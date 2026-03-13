import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerAnalyticsTools(server: McpServer, env: Env): void {
  // a. Get campaign stats
  server.tool(
    "sl_get_campaign_stats",
    "Get statistics for a SmartLead campaign: sent, opens, clicks, replies, bounces, unsubscribes. Optionally filter by date range.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      startDate: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format (optional)"),
      endDate: z
        .string()
        .optional()
        .describe("End date in YYYY-MM-DD format (optional)"),
    },
    async ({ campaignId, startDate, endDate }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (startDate) query.sent_time_start_date = startDate;
        if (endDate) query.sent_time_end_date = endDate;
        const result = await client.request<Record<string, unknown>>(
          "GET",
          `/campaigns/${campaignId}/statistics`,
          { query }
        );

        // Format as human-readable summary
        const sent = result?.sent_count ?? result?.total_sent ?? result?.sent ?? "N/A";
        const uniqueSent = result?.unique_sent_count ?? result?.unique_sent ?? "N/A";
        const opens = result?.open_count ?? result?.total_opens ?? result?.opens ?? "N/A";
        const uniqueOpens = result?.unique_open_count ?? result?.unique_opens ?? "N/A";
        const clicks = result?.click_count ?? result?.total_clicks ?? result?.clicks ?? "N/A";
        const replies = result?.reply_count ?? result?.total_replies ?? result?.replies ?? "N/A";
        const bounces = result?.bounce_count ?? result?.total_bounces ?? result?.bounces ?? "N/A";
        const unsubscribes =
          result?.unsubscribe_count ?? result?.total_unsubscribes ?? result?.unsubscribes ?? "N/A";

        const dateRange =
          startDate && endDate
            ? ` (${startDate} to ${endDate})`
            : startDate
            ? ` (from ${startDate})`
            : endDate
            ? ` (to ${endDate})`
            : "";

        const summary = [
          `Campaign ${campaignId} Stats${dateRange}:`,
          `- Sent: ${sent} (${uniqueSent} unique)`,
          `- Opens: ${opens} (${uniqueOpens} unique)`,
          `- Clicks: ${clicks}`,
          `- Replies: ${replies}`,
          `- Bounces: ${bounces}`,
          `- Unsubscribes: ${unsubscribes}`,
          ``,
          `Full response:`,
          JSON.stringify(result, null, 2),
        ].join("\n");

        return ok(summary);
      } catch (e) {
        return err(e);
      }
    }
  );

  // b. Get top-level analytics across all campaigns
  server.tool(
    "sl_get_all_campaign_analytics",
    "Get aggregated analytics across all SmartLead campaigns using the overall stats endpoint.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/overall-stats-v2"
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
