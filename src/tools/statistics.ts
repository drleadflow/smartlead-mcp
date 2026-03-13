import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerStatisticsTools(server: McpServer, env: Env): void {
  // 1. Get campaign top-level analytics
  server.tool(
    "sl_get_campaign_analytics",
    "Get high-level lifetime metrics for a SmartLead campaign (sent, opens, clicks, replies, bounces, unsubscribes).",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          `/campaigns/${campaignId}/analytics`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Get campaign analytics by date range
  server.tool(
    "sl_get_campaign_analytics_by_date",
    "Get SmartLead campaign analytics filtered by date range.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
    },
    async ({ campaignId, start_date, end_date }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (start_date) query.start_date = start_date;
        if (end_date) query.end_date = end_date;
        const result = await client.request<unknown>(
          "GET",
          `/campaigns/${campaignId}/analytics-by-date`,
          { query }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Get campaign lead statistics
  server.tool(
    "sl_get_campaign_lead_stats",
    "Get lead-level distribution metrics across statuses and categories for a SmartLead campaign.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          `/campaigns/${campaignId}/lead-stats`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Get campaign mailbox statistics
  server.tool(
    "sl_get_campaign_mailbox_stats",
    "Get performance breakdown by email account for a specific SmartLead campaign.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          `/campaigns/${campaignId}/mailbox-stats`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
