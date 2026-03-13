import { BASE_URL } from "./config";

/**
 * Simple token-bucket rate limiter.
 * Allows `maxTokens` requests per `refillIntervalMs`.
 * Uses a sliding approach: tokens refill gradually.
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillIntervalMs: number
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      // Wait until at least one token is available
      const waitMs = this.refillIntervalMs / this.maxTokens;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = (elapsed / this.refillIntervalMs) * this.maxTokens;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

// Shared rate limiter: 10 requests per 2 seconds
const rateLimiter = new RateLimiter(10, 2000);

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 25_000; // 25s (Cloudflare has 30s hard limit)
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export class SmartLeadClient {
  constructor(private apiKey: string) {}

  async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; query?: Record<string, string> }
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("api_key", this.apiKey);
    if (options?.query) {
      Object.entries(options.query).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, v);
      });
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // Wait for rate limiter before each attempt
      await rateLimiter.acquire();

      if (attempt > 0) {
        // Exponential backoff with jitter: 1s, 2s, 4s
        const baseDelay = Math.pow(2, attempt - 1) * 1000;
        const jitter = Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const resp = await fetch(url.toString(), {
          method,
          headers: { "Content-Type": "application/json" },
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!resp.ok) {
          // Check if retryable
          if (RETRYABLE_STATUS_CODES.has(resp.status) && attempt < MAX_RETRIES) {
            // Respect Retry-After header if present
            const retryAfter = resp.headers.get("Retry-After");
            if (retryAfter) {
              const waitSecs = parseInt(retryAfter, 10);
              if (!isNaN(waitSecs) && waitSecs > 0 && waitSecs <= 60) {
                await new Promise((resolve) => setTimeout(resolve, waitSecs * 1000));
              }
            }
            const text = await resp.text();
            lastError = new Error(`SmartLead ${resp.status}: ${text}`);
            continue;
          }
          const text = await resp.text();
          throw new Error(`SmartLead ${resp.status}: ${text}`);
        }

        const contentType = resp.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          return resp.json() as Promise<T>;
        }
        // Some SmartLead endpoints return plain text (e.g. "success")
        const text = await resp.text();
        return { message: text } as T;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          lastError = new Error(`SmartLead request timeout after ${REQUEST_TIMEOUT_MS}ms`);
          if (attempt < MAX_RETRIES) continue;
          throw lastError;
        }
        // Only retry on network errors, not on non-retryable HTTP errors
        if (e instanceof Error && e.message.startsWith("SmartLead ")) {
          throw e;
        }
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      }
    }

    throw lastError ?? new Error("SmartLead request failed after retries");
  }
}
