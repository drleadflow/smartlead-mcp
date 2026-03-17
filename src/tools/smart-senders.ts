import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerSmartSenderTools(server: McpServer, env: Env): void {
  // 1. Search available domains
  server.tool(
    "sl_search_domain",
    "Search available domains for purchase in the Smart Senders marketplace. Requires SmartSenders access (contact support@smartlead.ai).",
    {
      domain: z.string().optional().describe("Search query for domain name"),
    },
    async ({ domain }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (domain !== undefined) query.domain = domain;
        const result = await client.request<unknown>("GET", "/smart-senders/search-domain", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Get mailbox marketplace vendors
  server.tool(
    "sl_get_vendors",
    "Get mailbox marketplace vendors from Smart Senders.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/smart-senders/vendors");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Auto-generate mailboxes
  server.tool(
    "sl_auto_generate_mailboxes",
    "Auto-generate mailboxes from Smart Senders. Body schema varies - contact SmartLead support for parameters.",
    {
      config: z.record(z.any()).optional().describe("Generation configuration object"),
    },
    async ({ config }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = config ?? {};
        const result = await client.request<unknown>("POST", "/smart-senders/auto-generate", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Place a mailbox order
  server.tool(
    "sl_place_order",
    "Place a mailbox order in Smart Senders. Body schema varies - contact SmartLead support for parameters.",
    {
      order: z.record(z.any()).optional().describe("Order details object"),
    },
    async ({ order }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = order ?? {};
        const result = await client.request<unknown>("POST", "/smart-senders/place-order", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. List purchased/managed domains
  server.tool(
    "sl_get_domain_list",
    "List purchased and managed domains from Smart Senders.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/smart-senders/domains");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
