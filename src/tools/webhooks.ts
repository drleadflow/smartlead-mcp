import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";
import type { Env } from "../types";

const WEBHOOK_EVENTS = [
  "EMAIL_REPLY",
  "EMAIL_SENT",
  "EMAIL_OPEN",
  "EMAIL_LINK_CLICK",
  "EMAIL_BOUNCE",
  "LEAD_UNSUBSCRIBED",
  "LEAD_CATEGORY_UPDATED",
] as const;

export function registerWebhookTools(server: McpServer, env: Env): void {
  // a. Set (create or update) campaign webhook
  server.tool(
    "sl_set_campaign_webhook",
    "Register or update a webhook on a SmartLead campaign. Use sl_list_campaign_webhooks first to check for existing webhooks and avoid duplicate event delivery.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      webhookName: z.string().describe("A descriptive name for this webhook"),
      url: z.string().url().describe("The HTTPS URL that SmartLead will POST events to"),
      events: z
        .array(z.enum(WEBHOOK_EVENTS))
        .min(1)
        .describe(
          "List of event types to subscribe to: EMAIL_REPLY, EMAIL_SENT, EMAIL_OPEN, EMAIL_LINK_CLICK, EMAIL_BOUNCE, LEAD_UNSUBSCRIBED, LEAD_CATEGORY_UPDATED"
        ),
    },
    async ({ campaignId, webhookName, url, events }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/webhooks`, {
          body: {
            webhook_name: webhookName,
            webhook_url: url,
            event_types: events,
          },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // b. List campaign webhooks
  server.tool(
    "sl_list_campaign_webhooks",
    "List all webhooks registered on a SmartLead campaign. Check existing webhooks before adding new ones to avoid duplicate event delivery.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/campaigns/${campaignId}/webhooks`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // c. Delete campaign webhook
  server.tool(
    "sl_delete_campaign_webhook",
    "Delete a specific webhook from a SmartLead campaign by webhook ID.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      webhookId: z.number().describe("The webhook ID to delete"),
    },
    async ({ campaignId, webhookId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "DELETE",
          `/campaigns/${campaignId}/webhooks/${webhookId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // d. Create global webhook
  server.tool(
    "sl_create_global_webhook",
    "Create a webhook at user, client, or campaign level in SmartLead. Association type: 1=user (all campaigns), 2=client, 3=campaign.",
    {
      webhook_url: z.string().url().describe("HTTPS URL for event delivery"),
      association_type: z.number().min(1).max(3).describe("1=user level, 2=client level, 3=campaign level"),
      email_campaign_id: z.number().optional().describe("Required for association_type=3 (campaign level)"),
      client_id: z.number().optional().describe("Required for association_type=2 (client level)"),
      name: z.string().optional().describe("Descriptive webhook name"),
      event_type_map: z.record(z.boolean()).optional().describe("Event toggle map, e.g. {EMAIL_REPLY: true, EMAIL_SENT: false}"),
      force_create: z.boolean().optional().describe("Force creation even if similar webhook exists"),
    },
    async ({ webhook_url, association_type, email_campaign_id, client_id, name, event_type_map, force_create }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { webhook_url, association_type };
        if (email_campaign_id !== undefined) body.email_campaign_id = email_campaign_id;
        if (client_id !== undefined) body.client_id = client_id;
        if (name !== undefined) body.name = name;
        if (event_type_map !== undefined) body.event_type_map = event_type_map;
        if (force_create !== undefined) body.force_create = force_create;
        const result = await client.request<unknown>("POST", "/webhook/create", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // e. Get webhook details
  server.tool(
    "sl_get_webhook",
    "Get full details for a specific SmartLead webhook by its ID.",
    {
      webhookId: z.number().describe("The webhook ID"),
    },
    async ({ webhookId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/webhook/${webhookId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // f. Delete global webhook
  server.tool(
    "sl_delete_global_webhook",
    "Delete a SmartLead webhook by its ID (global deletion, not campaign-specific).",
    {
      webhookId: z.number().describe("The webhook ID to delete"),
    },
    async ({ webhookId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("DELETE", `/webhook/delete/${webhookId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // g. Get webhook summary for a campaign
  server.tool(
    "sl_get_webhook_summary",
    "Get webhook execution statistics for a campaign. Requires fromTime and toTime date range.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      fromTime: z.string().describe("Start of date range (ISO 8601, e.g. 2025-01-01T00:00:00Z)"),
      toTime: z.string().describe("End of date range (ISO 8601, e.g. 2026-12-31T00:00:00Z)"),
    },
    async ({ campaignId, fromTime, toTime }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/campaigns/${campaignId}/webhooks/summary`, {
          query: { fromTime, toTime },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // h. Retrigger failed webhooks
  server.tool(
    "sl_retrigger_webhooks",
    "Manually retry failed webhook deliveries for a SmartLead campaign.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/retrigger-webhooks`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // i. Update global webhook
  server.tool(
    "sl_update_global_webhook",
    "Update an existing SmartLead webhook configuration.",
    {
      webhookId: z.number().describe("The webhook ID to update"),
      webhook_url: z.string().url().optional().describe("New webhook URL"),
      name: z.string().optional().describe("New webhook name"),
      event_type_map: z.record(z.boolean()).optional().describe("Event toggle map, e.g. {EMAIL_REPLY: true}"),
    },
    async ({ webhookId, webhook_url, name, event_type_map }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (webhook_url !== undefined) body.webhook_url = webhook_url;
        if (name !== undefined) body.name = name;
        if (event_type_map !== undefined) body.event_type_map = event_type_map;
        const result = await client.request<unknown>("PUT", `/webhook/update/${webhookId}`, { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
