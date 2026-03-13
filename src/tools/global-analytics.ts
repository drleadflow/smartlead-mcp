import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";
import { analyticsQuerySchema, buildAnalyticsQuery, buildAnalyticsQueryWithTimezone } from "./analytics-helpers";

export function registerGlobalAnalyticsTools(server: McpServer, env: Env): void {
  // 1. Overall analytics v2
  server.tool(
    "sl_get_overall_analytics",
    "Get account-wide aggregate statistics across all SmartLead campaigns.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/overall-stats-v2",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Campaign list (analytics context) — does NOT accept date filters
  server.tool(
    "sl_get_analytics_campaign_list",
    "Get campaign list with analytics context from SmartLead.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/campaign/list"
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Campaign overall stats
  server.tool(
    "sl_get_analytics_campaign_overall",
    "Get aggregate campaign performance metrics from SmartLead analytics.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/campaign/overall-stats",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Campaign response stats
  server.tool(
    "sl_get_analytics_campaign_response",
    "Get detailed response analysis with sentiment breakdown from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/campaign/response-stats",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. Campaign status stats — does NOT accept date filters
  server.tool(
    "sl_get_analytics_campaign_status",
    "Get campaign count by status (active, paused, stopped, etc.) from SmartLead.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/campaign/status-stats"
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 6. Follow-up reply rate
  server.tool(
    "sl_get_analytics_followup_reply_rate",
    "Get reply rates for follow-up sequences (2nd, 3rd, 4th+) from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/campaign/follow-up-reply-rate",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 7. Lead to reply time
  server.tool(
    "sl_get_analytics_lead_to_reply_time",
    "Get average time from first email sent to first reply received in SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/campaign/lead-to-reply-time",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 8. Leads for first reply
  server.tool(
    "sl_get_analytics_leads_for_first_reply",
    "Get average number of leads contacted before receiving first reply in SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/campaign/leads-take-for-first-reply",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 9. Day-wise overall stats
  server.tool(
    "sl_get_analytics_daywise_overall",
    "Get day-by-day email engagement breakdown from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/day-wise-overall-stats",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 10. Day-wise overall stats by sent time (requires timezone)
  server.tool(
    "sl_get_analytics_daywise_by_sent_time",
    "Get daily email metrics organized by sent time from SmartLead. Requires timezone (defaults to America/New_York).",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/day-wise-overall-stats-by-sent-time",
          { query: buildAnalyticsQueryWithTimezone(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 11. Day-wise positive reply stats
  server.tool(
    "sl_get_analytics_daywise_positive_replies",
    "Get daily positive reply metrics from SmartLead, filtered to interested/positive categories.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/day-wise-positive-reply-stats",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 12. Positive reply stats by sent time (requires timezone)
  server.tool(
    "sl_get_analytics_positive_replies_by_sent_time",
    "Get positive reply stats organized by email sent time from SmartLead. Requires timezone (defaults to America/New_York).",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/day-wise-positive-reply-stats-by-sent-time",
          { query: buildAnalyticsQueryWithTimezone(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
