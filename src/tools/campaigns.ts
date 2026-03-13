import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";
import type { Env } from "../types";

export function registerCampaignTools(server: McpServer, env: Env): void {
  // 1. List campaigns
  server.tool(
    "sl_list_campaigns",
    "List all SmartLead campaigns with their id, name, and status.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/campaigns");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Get campaign by ID
  server.tool(
    "sl_get_campaign",
    "Get full details for a specific SmartLead campaign by its ID.",
    { campaignId: z.number().describe("The SmartLead campaign ID") },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/campaigns/${campaignId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Create campaign
  server.tool(
    "sl_create_campaign",
    "Create a new SmartLead campaign. Returns the created campaign with its ID.",
    {
      name: z.string().describe("Campaign name"),
      clientId: z.number().optional().describe("Optional client ID to associate with the campaign"),
    },
    async ({ name, clientId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { name };
        if (clientId !== undefined) body.client_id = clientId;
        const result = await client.request<unknown>("POST", "/campaigns/create", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Update campaign status
  server.tool(
    "sl_update_campaign_status",
    "Pause, resume (START), or stop a SmartLead campaign.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      status: z.enum(["PAUSED", "STOPPED", "START"]).describe("New campaign status"),
    },
    async ({ campaignId, status }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/status`, {
          body: { status },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. Update campaign settings
  server.tool(
    "sl_update_campaign_settings",
    "Update general settings for a SmartLead campaign (name, track_settings, stop_lead_settings, etc.).",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      settings: z.record(z.any()).describe(
        "Settings object. Accepted fields include: name, track_settings, stop_lead_settings, unsubscribe_text, send_as_plain_text, follow_up_percentage."
      ),
    },
    async ({ campaignId, settings }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/settings`, {
          body: settings,
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 6. Update campaign schedule
  server.tool(
    "sl_update_campaign_schedule",
    "Update the sending schedule for a SmartLead campaign (timezone, days, hours, rate limits).",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      timezone: z.string().describe("IANA timezone string, e.g. America/New_York"),
      days_of_the_week: z.array(z.number()).optional().describe(
        "Days to send (0=Sun, 1=Mon, ..., 6=Sat). Defaults to Mon-Fri if omitted."
      ),
      start_hour: z.string().optional().describe("Start hour in HH:MM format, e.g. 08:00"),
      end_hour: z.string().optional().describe("End hour in HH:MM format, e.g. 18:00"),
      min_time_btw_emails: z.number().optional().describe("Minimum minutes between emails"),
      max_new_leads_per_day: z.number().optional().describe("Maximum new leads contacted per day"),
    },
    async ({ campaignId, timezone, days_of_the_week, start_hour, end_hour, min_time_btw_emails, max_new_leads_per_day }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { timezone };
        if (days_of_the_week !== undefined) body.days_of_the_week = days_of_the_week;
        if (start_hour !== undefined) body.start_hour = start_hour;
        if (end_hour !== undefined) body.end_hour = end_hour;
        if (min_time_btw_emails !== undefined) body.min_time_btw_emails = min_time_btw_emails;
        if (max_new_leads_per_day !== undefined) body.max_new_leads_per_day = max_new_leads_per_day;
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/schedule`, { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 7. Get campaign sequence
  server.tool(
    "sl_get_campaign_sequence",
    "Get the email sequence (steps) for a SmartLead campaign.",
    { campaignId: z.number().describe("The SmartLead campaign ID") },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/campaigns/${campaignId}/sequence`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 8. Save campaign sequence
  server.tool(
    "sl_save_campaign_sequence",
    "Save (create or replace) the email sequence for a SmartLead campaign. Each step has a delay and one or more variants.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      sequences: z.array(
        z.object({
          seq_number: z.number().describe("Step number (1-based)"),
          seq_delay_details: z
            .object({ delay_in_days: z.number().describe("Days to wait before this step") })
            .optional(),
          seq_variants: z.array(
            z.object({
              subject: z.string().optional().describe("Email subject (optional for follow-ups)"),
              email_body: z.string().describe("Email body HTML or plain text"),
              variant_label: z.string().optional().describe("A/B variant label, e.g. A, B"),
            })
          ).describe("At least one variant is required per sequence step"),
        })
      ).describe("Array of sequence steps"),
    },
    async ({ campaignId, sequences }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/sequence`, {
          body: { sequences },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 9. List campaign email accounts
  server.tool(
    "sl_list_campaign_email_accounts",
    "List all email accounts currently assigned to a SmartLead campaign.",
    { campaignId: z.number().describe("The SmartLead campaign ID") },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/campaigns/${campaignId}/email-accounts`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 10. Add email account to campaign
  server.tool(
    "sl_add_email_account_to_campaign",
    "Assign an email account to a SmartLead campaign for sending.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      emailAccountId: z.number().describe("The email account ID to assign"),
    },
    async ({ campaignId, emailAccountId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/email-accounts`, {
          body: { email_account_id: emailAccountId },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 11. Remove email account from campaign
  server.tool(
    "sl_remove_email_account_from_campaign",
    "Remove (unassign) an email account from a SmartLead campaign.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      emailAccountId: z.number().describe("The email account ID to remove"),
    },
    async ({ campaignId, emailAccountId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "DELETE",
          `/campaigns/${campaignId}/email-accounts/${emailAccountId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 12. Delete campaign
  server.tool(
    "sl_delete_campaign",
    "Delete a SmartLead campaign by ID. NOTE: This is an irreversible action. Confirm with the user before calling.",
    { campaignId: z.number().describe("The SmartLead campaign ID to delete") },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("DELETE", `/campaigns/${campaignId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
