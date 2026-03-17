import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";
import { BATCH_SIZE } from "../config";

export function registerLeadTools(server: McpServer, env: Env): void {
  // 1. Add leads to campaign (batched)
  server.tool(
    "sl_add_leads_to_campaign",
    "Add leads to a SmartLead campaign. Adds leads in batches of 100. Max 350 leads per call. Returns total count added and number of batches sent.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leads: z
        .array(
          z.object({
            email: z.string().describe("Lead email address (required)"),
            first_name: z.string().optional().describe("Lead first name"),
            last_name: z.string().optional().describe("Lead last name"),
            company_name: z.string().optional().describe("Lead company name"),
            phone_number: z.string().optional().describe("Lead phone number"),
            website: z.string().optional().describe("Lead website URL"),
            location: z.string().optional().describe("Lead location / city"),
            custom_fields: z.record(z.any()).optional().describe("Additional custom fields as key/value pairs"),
          })
        )
        .max(350)
        .describe("Array of leads to add. Maximum 350 per call. SmartLead sends in batches of 100."),
      settings: z
        .object({
          ignore_global_block_list: z.boolean().optional().describe("Skip global block list check"),
          ignore_unsubscribe_list: z.boolean().optional().describe("Skip unsubscribe list check"),
          skip_community_bounce_list: z.boolean().optional().describe("Skip community bounce list check"),
        })
        .optional()
        .describe("Optional upload settings"),
    },
    async ({ campaignId, leads, settings }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const batches = Math.ceil(leads.length / BATCH_SIZE);
        let totalAdded = 0;

        for (let i = 0; i < batches; i++) {
          const chunk = leads.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
          const body: Record<string, unknown> = { lead_list: chunk };
          if (settings) {
            const s: Record<string, unknown> = {};
            if (settings.ignore_global_block_list !== undefined)
              s.ignore_global_block_list = settings.ignore_global_block_list;
            if (settings.ignore_unsubscribe_list !== undefined)
              s.ignore_unsubscribe_list = settings.ignore_unsubscribe_list;
            if (settings.skip_community_bounce_list !== undefined)
              s.skip_community_bounce_list = settings.skip_community_bounce_list;
            if (Object.keys(s).length > 0) body.settings = s;
          }
          await client.request<unknown>("POST", `/campaigns/${campaignId}/leads`, { body });
          totalAdded += chunk.length;
        }

        return ok(
          JSON.stringify({ total: totalAdded, batches, campaignId }, null, 2)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. List leads in a campaign
  server.tool(
    "sl_list_campaign_leads",
    "List all leads in a SmartLead campaign.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/campaigns/${campaignId}/leads`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Get lead by email (dedup check)
  server.tool(
    "sl_get_lead_by_email",
    "Look up a lead in SmartLead by email address. Use this to check if a lead already exists before adding them to avoid duplicates.",
    {
      email: z.string().describe("Lead email address to look up"),
    },
    async ({ email }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/leads", {
          query: { email },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Delete lead from campaign
  server.tool(
    "sl_delete_lead_from_campaign",
    "Remove a lead from a SmartLead campaign by lead ID.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadId: z.number().describe("The lead ID to remove"),
    },
    async ({ campaignId, leadId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "DELETE",
          `/campaigns/${campaignId}/leads/${leadId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. Pause lead in campaign
  server.tool(
    "sl_pause_lead_in_campaign",
    "Pause a specific lead within a SmartLead campaign so they stop receiving emails until unpaused.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadId: z.number().describe("The lead ID to pause"),
    },
    async ({ campaignId, leadId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "POST",
          `/campaigns/${campaignId}/leads/${leadId}/pause`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 6. Resume lead in campaign
  server.tool(
    "sl_resume_lead_in_campaign",
    "Resume email sending for a paused lead in a SmartLead campaign.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadId: z.number().describe("The lead ID to resume"),
      resume_lead_with_delay_days: z
        .number()
        .optional()
        .describe("Days before next email. Omit to use sequence default delay."),
    },
    async ({ campaignId, leadId, resume_lead_with_delay_days }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (resume_lead_with_delay_days !== undefined) {
          body.resume_lead_with_delay_days = resume_lead_with_delay_days;
        }
        const result = await client.request<unknown>(
          "POST",
          `/campaigns/${campaignId}/leads/${leadId}/resume`,
          { body: Object.keys(body).length > 0 ? body : undefined }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 7. Update lead
  server.tool(
    "sl_update_lead",
    "Update a lead's data in a SmartLead campaign. Changes apply globally across all campaigns.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadId: z.number().describe("The lead ID to update"),
      email: z.string().describe("Lead email address (required even if not changing)"),
      first_name: z.string().optional().describe("Lead first name"),
      last_name: z.string().optional().describe("Lead last name"),
      phone_number: z.string().optional().describe("Lead phone number"),
      company_name: z.string().optional().describe("Lead company name"),
      website: z.string().optional().describe("Lead website URL"),
      location: z.string().optional().describe("Lead location"),
      linkedin_profile: z.string().optional().describe("LinkedIn profile URL"),
      company_url: z.string().optional().describe("Company URL"),
      custom_fields: z.record(z.any()).optional().describe("Custom fields as key/value pairs (merged with existing, not replaced)"),
    },
    async ({ campaignId, leadId, email, first_name, last_name, phone_number, company_name, website, location, linkedin_profile, company_url, custom_fields }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { email };
        if (first_name !== undefined) body.first_name = first_name;
        if (last_name !== undefined) body.last_name = last_name;
        if (phone_number !== undefined) body.phone_number = phone_number;
        if (company_name !== undefined) body.company_name = company_name;
        if (website !== undefined) body.website = website;
        if (location !== undefined) body.location = location;
        if (linkedin_profile !== undefined) body.linkedin_profile = linkedin_profile;
        if (company_url !== undefined) body.company_url = company_url;
        if (custom_fields !== undefined) body.custom_fields = custom_fields;
        const result = await client.request<unknown>(
          "POST",
          `/campaigns/${campaignId}/leads/${leadId}`,
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 8. Unsubscribe lead globally
  server.tool(
    "sl_unsubscribe_lead",
    "Globally unsubscribe a lead from ALL SmartLead campaigns. The lead record is retained but marked as unsubscribed.",
    {
      leadId: z.number().describe("The lead ID to unsubscribe"),
    },
    async ({ leadId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "POST",
          `/leads/${leadId}/unsubscribe`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 9. Get lead categories
  server.tool(
    "sl_get_lead_categories",
    "Get all available lead categories (both global and user-created) in SmartLead.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/leads/fetch-categories");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 10. Export campaign leads as CSV
  server.tool(
    "sl_export_campaign_leads",
    "Export all leads for a SmartLead campaign as CSV data.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
    },
    async ({ campaignId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          `/campaigns/${campaignId}/leads-export`
        );
        return ok(typeof result === "string" ? result : JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 11. Get all leads activities
  server.tool(
    "sl_get_all_leads_activities",
    "Get lead activity events across all SmartLead campaigns with pagination and optional time filtering.",
    {
      offset: z.number().optional().describe("Pagination offset (default 0)"),
      limit: z.number().min(1).max(1000).optional().describe("Results per page (1-1000)"),
      event_time_from: z.string().optional().describe("ISO 8601 datetime - filter events after this time"),
      event_time_to: z.string().optional().describe("ISO 8601 datetime - filter events before this time"),
    },
    async ({ offset, limit, event_time_from, event_time_to }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (offset !== undefined) query.offset = String(offset);
        if (limit !== undefined) query.limit = String(limit);
        if (event_time_from) query.event_time_from = event_time_from;
        if (event_time_to) query.event_time_to = event_time_to;
        const result = await client.request<unknown>(
          "GET",
          "/campaigns/all-leads-activities",
          { query }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 12. Get campaign lead by ID
  server.tool(
    "sl_get_campaign_lead_by_id",
    "Get detailed info for a specific lead in a campaign including contact data, engagement stats, and custom fields.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadId: z.number().describe("The lead ID to retrieve"),
    },
    async ({ campaignId, leadId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          `/campaigns/${campaignId}/leads/${leadId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 13. Get lead message history
  server.tool(
    "sl_get_lead_message_history",
    "Get the complete email conversation thread for a lead including sent emails, replies, timestamps, and engagement data.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadId: z.number().describe("The lead ID"),
      show_plain_text_response: z.boolean().optional().describe("Return plain text instead of HTML body"),
    },
    async ({ campaignId, leadId, show_plain_text_response }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (show_plain_text_response !== undefined)
          query.show_plain_text_response = String(show_plain_text_response);
        const result = await client.request<unknown>(
          "GET",
          `/campaigns/${campaignId}/leads/${leadId}/message-history`,
          { query }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 14. Get bulk lead message history
  server.tool(
    "sl_get_bulk_lead_message_history",
    "Get email conversation history for multiple leads in bulk. Pass null for lead_ids to get all leads.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      workspaceId: z.number().describe("The SmartLead workspace ID"),
      lead_ids: z.array(z.number()).nullable().optional().describe("Array of lead IDs, or null to get all leads"),
    },
    async ({ campaignId, workspaceId, lead_ids }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {
          lead_ids: lead_ids ?? null,
        };
        const result = await client.request<unknown>(
          "POST",
          `/campaigns/${campaignId}/message-history-for-leads/${workspaceId}`,
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 15. Update lead category
  server.tool(
    "sl_update_lead_category",
    "Update a lead's category in a campaign (e.g. Interested, Not Interested). Pass null to remove category.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadId: z.number().describe("The lead ID"),
      category_id: z.number().nullable().describe("Category ID to assign, or null to remove category"),
      pause_lead: z.boolean().optional().describe("Whether to pause the lead after updating category (default false)"),
    },
    async ({ campaignId, leadId, category_id, pause_lead }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { category_id };
        if (pause_lead !== undefined) body.pause_lead = pause_lead;
        const result = await client.request<unknown>(
          "POST",
          `/campaigns/${campaignId}/leads/${leadId}/category`,
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 16. Update lead email account
  server.tool(
    "sl_update_lead_email_account",
    "Change which email account sends to a specific lead for deliverability optimization.",
    {
      email_account_id: z.number().describe("The new email account ID to assign"),
      email_campaign_id: z.number().describe("The campaign ID"),
      email_lead_id: z.number().describe("The lead ID within the campaign"),
      override_lead_email_account: z.boolean().optional().describe("Override even if lead already has an assigned account"),
    },
    async ({ email_account_id, email_campaign_id, email_lead_id, override_lead_email_account }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {
          email_account_id,
          email_campaign_id,
          email_lead_id,
        };
        if (override_lead_email_account !== undefined)
          body.override_lead_email_account = override_lead_email_account;
        const result = await client.request<unknown>(
          "POST",
          "/campaigns/update-lead-email-account",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 17. Mark lead as complete
  server.tool(
    "sl_mark_lead_complete",
    "Manually mark a lead as completed in a campaign, stopping further email sends without unsubscribing.",
    {
      campaignId: z.number().describe("The SmartLead campaign ID"),
      leadMapId: z.number().describe("The campaign_lead_map_id for the lead"),
    },
    async ({ campaignId, leadMapId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "POST",
          `/campaigns/${campaignId}/leads/${leadMapId}/manual-complete`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
