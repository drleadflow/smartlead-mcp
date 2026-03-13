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
    "Get SmartLead campaign analytics filtered by date range. Defaults to last 30 days.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      start_date: z.string().optional().describe("Start date (YYYY-MM-DD). Defaults to 30 days ago."),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD). Defaults to today."),
    },
    async ({ campaignId, start_date, end_date }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const now = new Date();
        const thirtyAgo = new Date();
        thirtyAgo.setDate(thirtyAgo.getDate() - 30);
        const query: Record<string, string> = {
          start_date: start_date ?? thirtyAgo.toISOString().slice(0, 10),
          end_date: end_date ?? now.toISOString().slice(0, 10),
        };
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

  // 3. Get campaign lead statistics (extracted from /campaigns/{id}/analytics response)
  server.tool(
    "sl_get_campaign_lead_stats",
    "Get lead-level distribution metrics (total, paused, blocked, completed, etc.) for a SmartLead campaign. Extracted from the campaign analytics endpoint.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<Record<string, unknown>>(
          "GET",
          `/campaigns/${campaignId}/analytics`
        );
        // Extract just the lead stats portion
        const leadStats = result?.campaign_lead_stats ?? {};
        return ok(JSON.stringify(leadStats, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Get campaign email account statistics
  server.tool(
    "sl_get_campaign_mailbox_stats",
    "Get performance breakdown by email account for a SmartLead campaign. Uses the campaign email accounts endpoint with per-account send metrics.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          `/campaigns/${campaignId}/email-accounts`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
