# SmartLead MCP Server

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the [SmartLead.ai](https://smartlead.ai) cold email platform. Deploy as a **Cloudflare Worker** and connect it to Claude Desktop, Claude Code, or any MCP-compatible client to manage your entire SmartLead account through natural language.

**67 tools** covering the full SmartLead API: campaigns, leads, email accounts, sequences, webhooks, analytics, warmup, master inbox, and more.

---

## Architecture

```
Claude / MCP Client
        |
        | MCP Protocol (SSE)
        v
 Cloudflare Worker
 (Durable Object)
        |
        | HTTPS + API Key
        v
 SmartLead API
 server.smartlead.ai/api/v1
```

- **Cloudflare Workers** -- serverless, globally distributed, ~50ms cold start
- **Durable Objects** -- persistent MCP agent state across requests
- **Token-bucket rate limiter** -- 10 requests per 2 seconds (matches SmartLead limits)
- **Automatic retry** -- exponential backoff with jitter for 429/5xx errors (max 3 retries)
- **25-second timeout** -- safely under Cloudflare's 30-second hard limit

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/drleadflow/smartlead-mcp.git
cd smartlead-mcp
npm install
```

### 2. Configure

Copy the example config and add your credentials:

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml`:

```toml
name = "smartlead-mcp"
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"    # From Cloudflare dashboard
# ...

[vars]
SMARTLEAD_API_KEY = "YOUR_SMARTLEAD_API_KEY"  # From SmartLead > Settings > API Keys
```

> **Tip:** For local development, create a `.dev.vars` file instead:
> ```
> SMARTLEAD_API_KEY=your-key-here
> ```

### 3. Deploy

```bash
npx wrangler deploy
```

Your MCP server is now live at:
```
https://smartlead-mcp.YOUR-SUBDOMAIN.workers.dev/mcp
```

### 4. Verify

```bash
curl https://smartlead-mcp.YOUR-SUBDOMAIN.workers.dev/mcp
```

---

## Connect to Claude

### Claude Code (CLI)

Add the MCP server to your Claude Code settings. Edit `~/.claude.json` and add under `mcpServers`:

```json
{
  "mcpServers": {
    "smartlead-mcp": {
      "type": "url",
      "url": "https://smartlead-mcp.YOUR-SUBDOMAIN.workers.dev/mcp"
    }
  }
}
```

Then restart Claude Code. All 67 `sl_*` tools will be available immediately.

### Claude Desktop

1. Open Claude Desktop **Settings** (gear icon)
2. Go to **Developer** > **Edit Config**
3. Add to `mcpServers`:

```json
{
  "mcpServers": {
    "smartlead-mcp": {
      "type": "url",
      "url": "https://smartlead-mcp.YOUR-SUBDOMAIN.workers.dev/mcp"
    }
  }
}
```

4. Restart Claude Desktop
5. You'll see a hammer icon indicating MCP tools are connected

### Any MCP Client

Point your MCP client to:
```
https://smartlead-mcp.YOUR-SUBDOMAIN.workers.dev/mcp
```

The server speaks standard MCP over Server-Sent Events (SSE). No authentication is required on the MCP side -- the SmartLead API key is stored securely in the Cloudflare Worker.

---

## All 67 Tools

### Campaigns (12 tools)

| Tool | Description |
|------|-------------|
| `sl_list_campaigns` | List all campaigns |
| `sl_get_campaign` | Get campaign details by ID |
| `sl_create_campaign` | Create a new campaign |
| `sl_update_campaign_status` | Start, pause, or stop a campaign |
| `sl_update_campaign_settings` | Update campaign name, tracking, unsubscribe text |
| `sl_update_campaign_schedule` | Set timezone, sending hours, daily limits |
| `sl_get_campaign_sequence` | Get email sequence steps |
| `sl_save_campaign_sequence` | Create/replace email sequence with A/B variants |
| `sl_list_campaign_email_accounts` | List email accounts assigned to campaign |
| `sl_add_email_account_to_campaign` | Assign email account to campaign |
| `sl_remove_email_account_from_campaign` | Unassign email account |
| `sl_delete_campaign` | Delete campaign (irreversible) |

### Leads (11 tools)

| Tool | Description |
|------|-------------|
| `sl_add_leads_to_campaign` | Bulk add leads (batched by 100, max 350/call) |
| `sl_list_campaign_leads` | List all leads in a campaign |
| `sl_get_lead_by_email` | Look up lead by email address |
| `sl_delete_lead_from_campaign` | Remove lead from campaign |
| `sl_pause_lead_in_campaign` | Pause email delivery for a lead |
| `sl_resume_lead_in_campaign` | Resume paused lead |
| `sl_update_lead` | Update lead data (name, company, custom fields) |
| `sl_unsubscribe_lead` | Globally unsubscribe from all campaigns |
| `sl_get_lead_categories` | Get all lead categories |
| `sl_export_campaign_leads` | Export campaign leads as CSV |
| `sl_get_all_leads_activities` | Get lead activity events with pagination |

### Email Accounts (8 tools)

| Tool | Description |
|------|-------------|
| `sl_list_email_accounts` | List all sending accounts |
| `sl_get_email_account` | Get account details (SMTP status, daily sent) |
| `sl_get_warmup_stats` | Get warmup reputation (sent, inbox, spam counts) |
| `sl_create_email_account` | Create SMTP/IMAP email account |
| `sl_create_oauth_email_account` | Add Gmail/Outlook via OAuth |
| `sl_update_email_account` | Update display name, daily limit, signature |
| `sl_delete_email_account` | Soft-delete email account |
| `sl_update_warmup_settings` | Enable/disable warmup, set daily rampup |

### Campaign Statistics (4 tools)

| Tool | Description |
|------|-------------|
| `sl_get_campaign_analytics` | Per-email analytics for a campaign |
| `sl_get_campaign_analytics_by_date` | Analytics broken down by date |
| `sl_get_campaign_lead_stats` | Lead-level statistics |
| `sl_get_campaign_mailbox_stats` | Per-mailbox sending statistics |

### Analytics (2 tools)

| Tool | Description |
|------|-------------|
| `sl_get_campaign_stats` | Campaign stats (sent, opens, clicks, replies, bounces) |
| `sl_get_all_campaign_analytics` | Aggregated analytics across all campaigns |

### Global Analytics (12 tools)

| Tool | Description |
|------|-------------|
| `sl_get_overall_analytics` | Overall stats across all campaigns |
| `sl_get_analytics_campaign_list` | Campaign list with analytics |
| `sl_get_analytics_campaign_overall` | Campaign-level overall stats |
| `sl_get_analytics_campaign_response` | Campaign response analytics |
| `sl_get_analytics_campaign_status` | Campaign status breakdown |
| `sl_get_analytics_followup_reply_rate` | Follow-up sequence reply rates |
| `sl_get_analytics_lead_to_reply_time` | Lead-to-reply time analysis |
| `sl_get_analytics_leads_for_first_reply` | Leads needed for first reply |
| `sl_get_analytics_daywise_overall` | Day-by-day overall analytics |
| `sl_get_analytics_daywise_by_sent_time` | Analytics by send time of day |
| `sl_get_analytics_daywise_positive_replies` | Positive replies by day |
| `sl_get_analytics_positive_replies_by_sent_time` | Positive replies by send time |

### Global Analytics Extended (9 tools)

| Tool | Description |
|------|-------------|
| `sl_get_analytics_lead_overall` | Lead-level overall analytics |
| `sl_get_analytics_lead_category_response` | Response rates by lead category |
| `sl_get_analytics_domain_health` | Domain reputation and health |
| `sl_get_analytics_account_health` | Per-account sending health |
| `sl_get_analytics_provider_performance` | ESP provider performance |
| `sl_get_analytics_client_list` | Client list with analytics |
| `sl_get_analytics_client_overall` | Client-level overall stats |
| `sl_get_analytics_monthly_client_count` | Monthly client count trends |
| `sl_get_analytics_team_board` | Team performance board |

### Webhooks (6 tools)

| Tool | Description |
|------|-------------|
| `sl_set_campaign_webhook` | Register webhook for campaign events |
| `sl_list_campaign_webhooks` | List webhooks for a campaign |
| `sl_delete_campaign_webhook` | Delete campaign webhook |
| `sl_create_global_webhook` | Create account-level webhook |
| `sl_get_webhook` | Get webhook details by ID |
| `sl_delete_global_webhook` | Delete global webhook |

### Master Inbox (1 tool)

| Tool | Description |
|------|-------------|
| `sl_fetch_inbox_replies` | Fetch full reply messages with conversation history |

### Client Management (1 tool)

| Tool | Description |
|------|-------------|
| `sl_create_client` | Create or save a client account |

### Smart Delivery (1 tool)

| Tool | Description |
|------|-------------|
| `sl_get_smart_delivery_providers` | Get smart delivery provider IDs |

---

## Project Structure

```
smartlead-mcp/
  src/
    index.ts                          # Entry point -- McpAgent + Durable Object
    client.ts                         # HTTP client with rate limiting + retry
    config.ts                         # Constants (BASE_URL, BATCH_SIZE)
    types.ts                          # Env interface
    helpers.ts                        # ok() / err() response helpers
    tools/
      index.ts                        # Tool registration orchestrator
      campaigns.ts                    # 12 campaign tools
      leads.ts                        # 11 lead tools
      accounts.ts                     # 8 email account tools
      analytics.ts                    # 2 core analytics tools
      statistics.ts                   # 4 campaign statistics tools
      global-analytics.ts             # 12 global analytics tools
      global-analytics-extended.ts    # 9 extended analytics tools
      analytics-helpers.ts            # Shared analytics query schema
      webhooks.ts                     # 6 webhook tools
      master-inbox.ts                 # 1 master inbox tool
      clients.ts                      # 1 client management tool
      smart-delivery.ts               # 1 smart delivery tool
  wrangler.toml                       # Cloudflare Worker config
  wrangler.toml.example               # Template with placeholders
  package.json
  tsconfig.json
```

---

## How It Works

### Rate Limiting

The server implements a token-bucket rate limiter matching SmartLead's API limits:

- **10 requests per 2 seconds** (conservative, SmartLead allows 10/sec)
- Requests queue automatically when the bucket is empty
- No requests are dropped -- they wait for available tokens

### Retry Logic

Failed requests are automatically retried with exponential backoff:

- **Retryable:** 429 (rate limit), 500, 502, 503, 504
- **Not retried:** 400, 401, 404, 422 (fail immediately)
- **Backoff:** 1s, 2s, 4s with random jitter
- **Max retries:** 3
- **Retry-After header:** Respected when present

### Authentication

SmartLead uses API key authentication via query parameter:

```
https://server.smartlead.ai/api/v1/endpoint?api_key=YOUR_KEY
```

The API key is stored in the Cloudflare Worker environment and never exposed to MCP clients.

---

## Development

### Local Dev

```bash
# Create local env file
echo 'SMARTLEAD_API_KEY=your-key' > .dev.vars

# Start dev server
npx wrangler dev

# MCP endpoint available at http://localhost:8787/mcp
```

### Type Check

```bash
npx tsc --noEmit
```

### Adding a New Tool

1. Choose the appropriate file in `src/tools/` (or create a new one)
2. Follow the pattern:

```typescript
server.tool(
  "sl_your_tool_name",                    // sl_ prefix, snake_case
  "Human-readable description",           // What it does
  {                                       // Zod parameter schema
    param: z.string().describe("..."),
  },
  async ({ param }) => {                  // Handler
    try {
      const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
      const result = await client.request<unknown>("GET", `/endpoint/${param}`);
      return ok(JSON.stringify(result, null, 2));
    } catch (e) {
      return err(e);
    }
  }
);
```

3. Register in `src/tools/index.ts`
4. Deploy: `npx wrangler deploy`

---

## Troubleshooting

### "Invalid API Key" errors

Your `SMARTLEAD_API_KEY` is wrong or not set. Verify:

```bash
curl "https://server.smartlead.ai/api/v1/campaigns?api_key=YOUR_KEY"
```

### Tools not appearing in Claude

After deploying, restart Claude Code or Claude Desktop to refresh the MCP connection. The Durable Object caches the tool list per session.

### SMTP failures on email accounts

`invalid_grant` errors mean Google OAuth tokens expired. This must be fixed in the SmartLead UI (Settings > Email Accounts > Reconnect). It cannot be resolved via API.

### Rate limit errors

The built-in rate limiter should prevent these. If you still see 429 errors, SmartLead may have tightened limits. Adjust in `src/client.ts`:

```typescript
const rateLimiter = new RateLimiter(5, 2000);  // More conservative
```

### Cloudflare deploy fails

Ensure you're logged in: `npx wrangler login`

Check your `account_id` in `wrangler.toml` matches your Cloudflare account.

---

## SmartLead API Reference

- **Base URL:** `https://server.smartlead.ai/api/v1`
- **Auth:** API key as `?api_key=` query parameter
- **Rate limits:** 10 req/sec (standard), 120 req/min (pro)
- **Docs:** [api.smartlead.ai/reference](https://api.smartlead.ai/reference)

---

## Tech Stack

- [Cloudflare Workers](https://developers.cloudflare.com/workers/) -- serverless runtime
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) -- persistent state
- [Model Context Protocol](https://modelcontextprotocol.io) -- AI tool protocol
- [MCP SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk) -- official TypeScript SDK
- [Agents Framework](https://www.npmjs.com/package/agents) -- Cloudflare's McpAgent base class
- [Zod](https://zod.dev) -- runtime parameter validation
- [TypeScript](https://www.typescriptlang.org/) -- strict mode

---

## License

MIT
