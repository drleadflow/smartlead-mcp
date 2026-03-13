import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";
import { analyticsQuerySchema, buildAnalyticsQuery } from "./analytics-helpers";

export function registerGlobalAnalyticsExtendedTools(server: McpServer, env: Env): void {
  // 1. Lead overall stats
  server.tool(
    "sl_get_analytics_lead_overall",
    "Get comprehensive lead engagement statistics by status and category from SmartLead.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/analytics/lead/overall-stats");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Lead category-wise response
  server.tool(
    "sl_get_analytics_lead_category_response",
    "Get lead response breakdown by category with sentiment distribution from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/lead/category-wise-response",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Domain-wise health metrics
  server.tool(
    "sl_get_analytics_domain_health",
    "Get performance metrics aggregated by email sending domain from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/mailbox/domain-wise-health-metrics",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Email account health metrics
  server.tool(
    "sl_get_analytics_account_health",
    "Get health and deliverability metrics by individual email account with bounce rates from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/mailbox/name-wise-health-metrics",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. Provider-wise performance
  server.tool(
    "sl_get_analytics_provider_performance",
    "Get performance comparison across Gmail, Outlook, and SMTP providers from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/mailbox/provider-wise-overall-performance",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 6. Client list (analytics)
  server.tool(
    "sl_get_analytics_client_list",
    "Get all clients for agency account filtering from SmartLead analytics.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/client/list",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 7. Client overall stats
  server.tool(
    "sl_get_analytics_client_overall",
    "Get performance metrics aggregated by client from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/client/overall-stats",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 8. Month-wise client count
  server.tool(
    "sl_get_analytics_monthly_client_count",
    "Get monthly breakdown of active clients showing growth trends from SmartLead.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/client/month-wise-count",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 9. Team board stats
  server.tool(
    "sl_get_analytics_team_board",
    "Get performance metrics by team member from SmartLead analytics.",
    { ...analyticsQuerySchema },
    async (params) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/analytics/team-board/overall-stats",
          { query: buildAnalyticsQuery(params) }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
