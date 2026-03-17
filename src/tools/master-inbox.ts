import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

// ---------------------------------------------------------------------------
// Shared helpers for inbox list endpoints
// ---------------------------------------------------------------------------

const inboxListSchema = {
  offset: z.number().optional().describe("Pagination offset (default 0)"),
  limit: z.number().optional().describe("Results per page (default 20, max 20)"),
  sortBy: z.string().optional().describe("Sort order: REPLY_TIME_DESC or SENT_TIME_DESC"),
  search: z.string().optional().describe("Search by lead email (max 30 chars)"),
  campaignIds: z.array(z.number()).optional().describe("Filter by campaign IDs"),
  emailAccountIds: z.array(z.number()).optional().describe("Filter by email account IDs"),
};

function buildInboxBody(params: {
  offset?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  campaignIds?: number[];
  emailAccountIds?: number[];
  leadCategories?: Record<string, unknown>;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (params.offset !== undefined) body.offset = params.offset;
  if (params.limit !== undefined) body.limit = params.limit;
  if (params.sortBy) body.sortBy = params.sortBy;
  const filters: Record<string, unknown> = {};
  if (params.search) filters.search = params.search;
  if (params.campaignIds?.length) filters.campaignId = params.campaignIds;
  if (params.emailAccountIds?.length) filters.emailAccountId = params.emailAccountIds;
  if (params.leadCategories) filters.leadCategories = params.leadCategories;
  if (Object.keys(filters).length > 0) body.filters = filters;
  return body;
}

// ---------------------------------------------------------------------------
// Register all 24 Master Inbox tools
// ---------------------------------------------------------------------------

export function registerMasterInboxTools(server: McpServer, env: Env): void {
  // -------------------------------------------------------------------------
  // 1. sl_get_inbox_messages
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_messages",
    "Fetch replies from the SmartLead master inbox with filtering and message history. Use this to get full reply bodies (webhooks only send truncated preview text).",
    {
      ...inboxListSchema,
      fetch_message_history: z
        .boolean()
        .optional()
        .describe("Include full message history (default false)"),
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds, fetch_message_history }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const query: Record<string, string> = {};
        if (fetch_message_history) query.fetch_message_history = "true";
        const result = await client.request<unknown>("POST", "/master-inbox/inbox-replies", { body, query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 2. sl_get_inbox_sent
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_sent",
    "Fetch sent messages from the SmartLead master inbox.",
    {
      ...inboxListSchema,
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const result = await client.request<unknown>("POST", "/master-inbox/sent", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 3. sl_get_inbox_assigned
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_assigned",
    "Fetch inbox messages assigned to you in the SmartLead master inbox.",
    {
      ...inboxListSchema,
      fetch_message_history: z
        .boolean()
        .optional()
        .describe("Include full message history (default false)"),
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds, fetch_message_history }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const query: Record<string, string> = {};
        if (fetch_message_history) query.fetch_message_history = "true";
        const result = await client.request<unknown>("POST", "/master-inbox/assigned-me", { body, query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 4. sl_get_inbox_unread
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_unread",
    "Fetch unread replies from the SmartLead master inbox.",
    {
      ...inboxListSchema,
      fetch_message_history: z
        .boolean()
        .optional()
        .describe("Include full message history (default false)"),
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds, fetch_message_history }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const query: Record<string, string> = {};
        if (fetch_message_history) query.fetch_message_history = "true";
        const result = await client.request<unknown>("POST", "/master-inbox/unread-replies", { body, query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 5. sl_get_inbox_important
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_important",
    "Fetch important messages from the SmartLead master inbox.",
    {
      ...inboxListSchema,
      fetch_message_history: z
        .boolean()
        .optional()
        .describe("Include full message history (default false)"),
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds, fetch_message_history }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const query: Record<string, string> = {};
        if (fetch_message_history) query.fetch_message_history = "true";
        const result = await client.request<unknown>("POST", "/master-inbox/important", { body, query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 6. sl_get_inbox_snoozed
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_snoozed",
    "Fetch snoozed messages from the SmartLead master inbox.",
    {
      ...inboxListSchema,
      fetch_message_history: z
        .boolean()
        .optional()
        .describe("Include full message history (default false)"),
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds, fetch_message_history }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const query: Record<string, string> = {};
        if (fetch_message_history) query.fetch_message_history = "true";
        const result = await client.request<unknown>("POST", "/master-inbox/snoozed", { body, query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 7. sl_get_inbox_scheduled
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_scheduled",
    "Fetch scheduled messages from the SmartLead master inbox.",
    {
      ...inboxListSchema,
      sortBy: z
        .string()
        .optional()
        .describe("Sort order: SCHEDULED_TIME_ASC or SCHEDULED_TIME_DESC"),
      fetch_message_history: z
        .boolean()
        .optional()
        .describe("Include full message history (default false)"),
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds, fetch_message_history }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const query: Record<string, string> = {};
        if (fetch_message_history) query.fetch_message_history = "true";
        const result = await client.request<unknown>("POST", "/master-inbox/scheduled", { body, query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 8. sl_get_inbox_reminders
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_reminders",
    "Fetch messages with reminders from the SmartLead master inbox.",
    {
      ...inboxListSchema,
      sortBy: z
        .string()
        .optional()
        .describe("Sort order: REMINDER_TIME_ASC or REMINDER_TIME_DESC"),
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const result = await client.request<unknown>("POST", "/master-inbox/reminders", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 9. sl_get_inbox_archived
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_archived",
    "Fetch archived messages from the SmartLead master inbox.",
    {
      ...inboxListSchema,
      fetch_message_history: z
        .boolean()
        .optional()
        .describe("Include full message history (default false)"),
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds, fetch_message_history }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const query: Record<string, string> = {};
        if (fetch_message_history) query.fetch_message_history = "true";
        const result = await client.request<unknown>("POST", "/master-inbox/archived", { body, query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 10. sl_get_inbox_views
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_views",
    "Fetch inbox views from the SmartLead master inbox.",
    {
      ...inboxListSchema,
    },
    async ({ offset, limit, sortBy, search, campaignIds, emailAccountIds }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = buildInboxBody({ offset, limit, sortBy, search, campaignIds, emailAccountIds });
        const result = await client.request<unknown>("POST", "/master-inbox/views", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 11. sl_get_inbox_item
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_inbox_item",
    "Get a single inbox item by campaign_lead_map_id from the SmartLead master inbox.",
    {
      id: z.number().describe("The campaign_lead_map_id of the inbox item"),
    },
    async ({ id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/master-inbox/${id}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 12. sl_get_untracked_replies
  // -------------------------------------------------------------------------
  server.tool(
    "sl_get_untracked_replies",
    "Get untracked replies from the SmartLead master inbox. These are replies that could not be matched to a campaign lead.",
    {
      limit: z.number().optional().describe("Results per page (1-100)"),
      offset: z.number().optional().describe("Pagination offset"),
      fetchAttachments: z.boolean().optional().describe("Include attachments"),
      fetchBody: z.boolean().optional().describe("Include full email body"),
      from_email: z.string().optional().describe("Filter by sender email"),
      to_email: z.string().optional().describe("Filter by recipient email"),
      subject_line: z.string().optional().describe("Filter by subject line"),
    },
    async ({ limit, offset, fetchAttachments, fetchBody, from_email, to_email, subject_line }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (limit !== undefined) query.limit = String(limit);
        if (offset !== undefined) query.offset = String(offset);
        if (fetchAttachments !== undefined) query.fetchAttachments = String(fetchAttachments);
        if (fetchBody !== undefined) query.fetchBody = String(fetchBody);
        if (from_email) query.from_email = from_email;
        if (to_email) query.to_email = to_email;
        if (subject_line) query.subject_line = subject_line;
        const result = await client.request<unknown>("GET", "/master-inbox/untracked-replies", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 13. sl_inbox_reply
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_reply",
    "Send a reply to an email thread from the SmartLead inbox.",
    {
      campaignId: z.number().describe("Campaign ID"),
      emailStatsId: z.string().describe("Email stats ID of the message to reply to"),
      emailBody: z.string().describe("HTML body of the reply"),
      toEmail: z.string().optional().describe("Override recipient email address"),
      scheduledTime: z.string().optional().describe("Schedule send time (ISO 8601)"),
      cc: z.string().optional().describe("CC email addresses (comma-separated)"),
      bcc: z.string().optional().describe("BCC email addresses (comma-separated)"),
      addSignature: z.boolean().optional().describe("Add email signature to reply"),
    },
    async ({ campaignId, emailStatsId, emailBody, toEmail, scheduledTime, cc, bcc, addSignature }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {
          campaignId,
          emailStatsId,
          emailBody,
        };
        if (toEmail) body.toEmail = toEmail;
        if (scheduledTime) body.scheduledTime = scheduledTime;
        if (cc) body.cc = cc;
        if (bcc) body.bcc = bcc;
        if (addSignature !== undefined) body.addSignature = addSignature;
        const result = await client.request<unknown>("POST", "/email-campaigns/send-email-thread", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 14. sl_inbox_forward
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_forward",
    "Forward an email reply from the SmartLead inbox to other recipients.",
    {
      campaignId: z.number().describe("Campaign ID"),
      emailStatsId: z.string().describe("Email stats ID of the message to forward"),
      forwardEmailSubject: z.string().describe("Subject line for the forwarded email"),
      forwardEmailBody: z.string().describe("HTML body for the forwarded email"),
      forwardToEmailIds: z.string().describe("Comma-separated email addresses to forward to"),
    },
    async ({ campaignId, emailStatsId, forwardEmailSubject, forwardEmailBody, forwardToEmailIds }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {
          campaignId,
          emailStatsId,
          forwardEmailSubject,
          forwardEmailBody,
          forwardToEmailIds,
        };
        const result = await client.request<unknown>("POST", "/email-campaigns/forward-reply-email", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 15. sl_inbox_mark_read
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_mark_read",
    "Mark an inbox message as read or unread in the SmartLead master inbox.",
    {
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      read_status: z.boolean().describe("True to mark as read, false to mark as unread"),
    },
    async ({ email_lead_map_id, read_status }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = { email_lead_map_id, read_status };
        const result = await client.request<unknown>("PATCH", "/master-inbox/change-read-status", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 16. sl_inbox_update_category
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_update_category",
    "Update the lead category of an inbox item in the SmartLead master inbox. Set category_id to null to remove the category.",
    {
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      category_id: z.number().nullable().describe("Category ID to assign, or null to remove"),
    },
    async ({ email_lead_map_id, category_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = { email_lead_map_id, category_id };
        const result = await client.request<unknown>("PATCH", "/master-inbox/update-category", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 17. sl_inbox_update_revenue
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_update_revenue",
    "Update the revenue value for an inbox lead in the SmartLead master inbox.",
    {
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      revenue: z.number().describe("Revenue amount to assign to this lead"),
    },
    async ({ email_lead_map_id, revenue }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = { email_lead_map_id, revenue };
        const result = await client.request<unknown>("PATCH", "/master-inbox/update-revenue", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 18. sl_inbox_assign_team_member
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_assign_team_member",
    "Assign a team member to an inbox item in the SmartLead master inbox.",
    {
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      team_member_id: z.number().describe("Team member ID to assign"),
    },
    async ({ email_lead_map_id, team_member_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = { email_lead_map_id, team_member_id };
        const result = await client.request<unknown>("POST", "/master-inbox/update-team-member", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 19. sl_inbox_create_task
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_create_task",
    "Create a task for an inbox lead in the SmartLead master inbox.",
    {
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      name: z.string().describe("Task name"),
      description: z.string().optional().describe("Task description"),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().describe("Task priority"),
      due_date: z.string().optional().describe("Due date (ISO 8601 format)"),
    },
    async ({ email_lead_map_id, name, description, priority, due_date }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { email_lead_map_id, name };
        if (description) body.description = description;
        if (priority) body.priority = priority;
        if (due_date) body.due_date = due_date;
        const result = await client.request<unknown>("POST", "/master-inbox/create-task", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 20. sl_inbox_create_note
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_create_note",
    "Create a note for an inbox lead in the SmartLead master inbox.",
    {
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      note_message: z.string().describe("Note content"),
    },
    async ({ email_lead_map_id, note_message }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = { email_lead_map_id, note_message };
        const result = await client.request<unknown>("POST", "/master-inbox/create-note", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 21. sl_inbox_block_domains
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_block_domains",
    "Block one or more email domains in the SmartLead master inbox. Blocked domains will not receive future emails.",
    {
      domains: z.array(z.string()).describe("Array of domains to block (e.g. ['example.com', 'spam.org'])"),
      source: z
        .enum(["manual", "bounce", "complaint", "invalid"])
        .optional()
        .describe("Source/reason for blocking"),
    },
    async ({ domains, source }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { domains };
        if (source) body.source = source;
        const result = await client.request<unknown>("POST", "/master-inbox/block-domains", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 22. sl_inbox_resume_lead
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_resume_lead",
    "Resume a paused lead in a campaign from the SmartLead master inbox.",
    {
      campaign_id: z.number().describe("Campaign ID"),
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      resume_delay_days: z.number().optional().describe("Number of days to wait before resuming"),
    },
    async ({ campaign_id, email_lead_map_id, resume_delay_days }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { campaign_id, email_lead_map_id };
        if (resume_delay_days !== undefined) body.resume_delay_days = resume_delay_days;
        const result = await client.request<unknown>("PATCH", "/master-inbox/resume-lead", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 23. sl_inbox_set_reminder
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_set_reminder",
    "Set a reminder on an inbox message in the SmartLead master inbox.",
    {
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      email_stats_id: z.string().describe("Email stats ID of the specific message"),
      message: z.string().describe("Reminder message text"),
      reminder_time: z.string().describe("When to trigger the reminder (ISO 8601 format)"),
    },
    async ({ email_lead_map_id, email_stats_id, message, reminder_time }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body = { email_lead_map_id, email_stats_id, message, reminder_time };
        const result = await client.request<unknown>("POST", "/master-inbox/set-reminder", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  // 24. sl_inbox_push_to_subsequence
  // -------------------------------------------------------------------------
  server.tool(
    "sl_inbox_push_to_subsequence",
    "Push an inbox lead to a sub-sequence in SmartLead. Use this to trigger follow-up sequences based on lead behavior.",
    {
      email_lead_map_id: z.number().describe("The email_lead_map_id of the inbox item"),
      sub_sequence_id: z.number().describe("ID of the sub-sequence to push the lead into"),
      sub_sequence_delay_time: z
        .number()
        .optional()
        .describe("Delay in seconds before starting the sub-sequence"),
      stop_lead_on_parent_campaign_reply: z
        .boolean()
        .optional()
        .describe("Stop the lead in the parent campaign if they reply"),
    },
    async ({ email_lead_map_id, sub_sequence_id, sub_sequence_delay_time, stop_lead_on_parent_campaign_reply }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { email_lead_map_id, sub_sequence_id };
        if (sub_sequence_delay_time !== undefined) body.sub_sequence_delay_time = sub_sequence_delay_time;
        if (stop_lead_on_parent_campaign_reply !== undefined)
          body.stop_lead_on_parent_campaign_reply = stop_lead_on_parent_campaign_reply;
        const result = await client.request<unknown>("POST", "/master-inbox/push-to-subsequence", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
