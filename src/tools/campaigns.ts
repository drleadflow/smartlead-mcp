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

  // 13. Create subsequence
  server.tool(
    "sl_create_subsequence",
    "Create a subsequence campaign that leads can be moved to based on behavioral triggers.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      subsequence_name: z.string().optional().describe("Name for the subsequence"),
      condition_events: z.array(z.string()).optional().describe("Array of behavioral trigger events"),
    },
    async ({ campaignId, subsequence_name, condition_events }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (subsequence_name !== undefined) body.subsequence_name = subsequence_name;
        if (condition_events !== undefined) body.condition_events = condition_events;
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/create-subsequence`, { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 14. Reply to campaign lead
  server.tool(
    "sl_reply_to_campaign_lead",
    "Reply to a lead's email thread within a campaign, maintaining conversation context.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      email_stats_id: z.string().describe("The email stats ID for the thread to reply to"),
      email_body: z.string().describe("The reply email body content"),
      to_email: z.string().optional().describe("Override recipient email address"),
      scheduled_time: z.string().optional().describe("ISO datetime to schedule the reply"),
      cc: z.string().optional().describe("CC email address"),
      bcc: z.string().optional().describe("BCC email address"),
      add_signature: z.boolean().optional().describe("Whether to include the email signature"),
      attachments: z.array(
        z.object({
          file_url: z.string().describe("URL of the attachment file"),
          file_name: z.string().optional().describe("Display name for the attachment"),
          file_type: z.string().optional().describe("MIME type of the attachment"),
        })
      ).optional().describe("Array of file attachments"),
    },
    async ({ campaignId, email_stats_id, email_body, to_email, scheduled_time, cc, bcc, add_signature, attachments }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { email_stats_id, email_body };
        if (to_email !== undefined) body.to_email = to_email;
        if (scheduled_time !== undefined) body.scheduled_time = scheduled_time;
        if (cc !== undefined) body.cc = cc;
        if (bcc !== undefined) body.bcc = bcc;
        if (add_signature !== undefined) body.add_signature = add_signature;
        if (attachments !== undefined) body.attachments = attachments;
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/reply-email-thread`, { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 15. Send test email
  server.tool(
    "sl_send_test_email",
    "Send a test email from a specific sequence step to verify content and deliverability.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadId: z.number().describe("Lead ID for personalization context"),
      sequenceNumber: z.number().describe("Which sequence step to test"),
      selectedEmailAccountId: z.number().optional().describe("Email account ID to send from"),
      customEmailAddress: z.string().optional().describe("Custom email address to send the test to"),
    },
    async ({ campaignId, leadId, sequenceNumber, selectedEmailAccountId, customEmailAddress }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { leadId, sequenceNumber };
        if (selectedEmailAccountId !== undefined) body.selectedEmailAccountId = selectedEmailAccountId;
        if (customEmailAddress !== undefined) body.customEmailAddress = customEmailAddress;
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/send-test-email`, { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 16. Update campaign team member
  server.tool(
    "sl_update_campaign_team_member",
    "Assign or remove a team member from managing a campaign.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      teamMemberId: z.number().nullable().describe("Team member ID to assign, or null to unassign"),
    },
    async ({ campaignId, teamMemberId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { teamMemberId };
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/team-member`, { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 17. Forward campaign email
  server.tool(
    "sl_forward_campaign_email",
    "Forward a campaign email to a team member or external recipient.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      email_stats_id: z.string().describe("The email stats ID of the email to forward"),
      forward_to_email: z.string().describe("Email address to forward to"),
      forward_message: z.string().optional().describe("Optional message to include with the forwarded email"),
    },
    async ({ campaignId, email_stats_id, forward_to_email, forward_message }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { email_stats_id, forward_to_email };
        if (forward_message !== undefined) body.forward_message = forward_message;
        const result = await client.request<unknown>("POST", `/campaigns/${campaignId}/forward-email`, { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
