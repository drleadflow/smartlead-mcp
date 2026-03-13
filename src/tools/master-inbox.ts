import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerMasterInboxTools(server: McpServer, env: Env): void {
  // Fetch inbox replies
  server.tool(
    "sl_fetch_inbox_replies",
    "Fetch replies from the SmartLead master inbox with filtering and message history. Use this to get full reply bodies (webhooks only send truncated preview text).",
    {
      offset: z.number().optional().describe("Pagination offset (default 0)"),
      limit: z.number().optional().describe("Results per page"),
      search: z.string().optional().describe("Search by lead email address"),
      campaignIds: z.array(z.number()).optional().describe("Filter by campaign IDs"),
      sortBy: z.string().optional().describe("Sort order, e.g. REPLY_TIME_DESC"),
      fetch_message_history: z.boolean().optional().describe("Include full message history (default false)"),
    },
    async ({ offset, limit, search, campaignIds, sortBy, fetch_message_history }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (offset !== undefined) body.offset = offset;
        if (limit !== undefined) body.limit = limit;

        const filters: Record<string, unknown> = {};
        if (search) filters.search = search;
        if (campaignIds && campaignIds.length > 0) filters.campaignId = campaignIds;
        if (Object.keys(filters).length > 0) body.filters = filters;

        if (sortBy) body.sortBy = sortBy;

        const query: Record<string, string> = {};
        if (fetch_message_history) query.fetch_message_history = "true";

        const result = await client.request<unknown>(
          "POST",
          "/master-inbox/inbox-replies",
          { body, query }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
