import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerAccountTools(server: McpServer, env: Env): void {
  // a. List all email accounts
  server.tool(
    "sl_list_email_accounts",
    "List all email sending accounts in SmartLead.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        // Try primary endpoint; fallback logged if it fails at runtime
        const result = await client.request<unknown>("GET", "/email-accounts");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // b. Get a single email account
  server.tool(
    "sl_get_email_account",
    "Get full details for a specific SmartLead email sending account by ID.",
    {
      emailAccountId: z.number().describe("The email account ID"),
    },
    async ({ emailAccountId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/email-accounts/${emailAccountId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // c. Get warmup stats for an email account
  server.tool(
    "sl_get_warmup_stats",
    "Get warmup statistics (sent, inbox, spam counts for last 7 days) for a SmartLead email account.",
    {
      emailAccountId: z.number().describe("The email account ID"),
    },
    async ({ emailAccountId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<Record<string, unknown>>(
          "GET",
          `/email-accounts/${emailAccountId}/warmup-stats`
        );
        // Format as readable summary
        const sent = result?.sent_count ?? result?.sent ?? "N/A";
        const inbox = result?.inbox_count ?? result?.inbox ?? "N/A";
        const spam = result?.spam_count ?? result?.spam ?? "N/A";
        const summary = `Warmup stats for account ${emailAccountId} (last 7 days):\n- Sent: ${sent}\n- Inbox: ${inbox}\n- Spam: ${spam}\n\nFull response:\n${JSON.stringify(result, null, 2)}`;
        return ok(summary);
      } catch (e) {
        return err(e);
      }
    }
  );

  // d. Create an email account
  server.tool(
    "sl_create_email_account",
    "Create a new email sending account in SmartLead using SMTP/IMAP credentials.",
    {
      from_name: z.string().describe("Display name for the sender"),
      from_email: z.string().describe("Sender email address"),
      smtp_host: z.string().describe("SMTP server hostname"),
      smtp_port: z.number().describe("SMTP server port (e.g. 587)"),
      smtp_username: z.string().describe("SMTP authentication username (user_name in API)"),
      smtp_password: z.string().describe("SMTP authentication password"),
      imap_host: z.string().describe("IMAP server hostname"),
      imap_port: z.number().describe("IMAP server port (e.g. 993)"),
      imap_username: z.string().describe("IMAP authentication username"),
      imap_password: z.string().describe("IMAP authentication password"),
      warmup_enabled: z.boolean().optional().describe("Enable warmup on creation (default true)"),
    },
    async ({
      from_name,
      from_email,
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      imap_host,
      imap_port,
      imap_username,
      imap_password,
      warmup_enabled,
    }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/email-accounts/save", {
          body: {
            from_name,
            from_email,
            smtp_host,
            smtp_port,
            user_name: smtp_username,
            password: smtp_password,
            imap_host,
            imap_port,
            imap_user_name: imap_username,
            imap_password,
            warmup_enabled: warmup_enabled ?? true,
          },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // e. Update email account
  server.tool(
    "sl_update_email_account",
    "Update settings for a SmartLead email sending account (display name, daily limit, signature, etc.).",
    {
      emailAccountId: z.number().describe("The email account ID to update"),
      max_email_per_day: z.number().optional().describe("Daily sending cap"),
      from_name: z.string().optional().describe("Display name"),
      custom_tracking_url: z.string().optional().describe("Custom tracking domain"),
      bcc: z.string().optional().describe("BCC address for all outgoing emails"),
      signature: z.string().optional().describe("HTML email signature"),
      client_id: z.number().optional().describe("Client association ID"),
      time_to_wait_in_mins: z.number().optional().describe("Interval between sends in minutes"),
      is_suspended: z.boolean().optional().describe("Suspension toggle"),
    },
    async ({ emailAccountId, max_email_per_day, from_name, custom_tracking_url, bcc, signature, client_id, time_to_wait_in_mins, is_suspended }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (max_email_per_day !== undefined) body.max_email_per_day = max_email_per_day;
        if (from_name !== undefined) body.from_name = from_name;
        if (custom_tracking_url !== undefined) body.custom_tracking_url = custom_tracking_url;
        if (bcc !== undefined) body.bcc = bcc;
        if (signature !== undefined) body.signature = signature;
        if (client_id !== undefined) body.client_id = client_id;
        if (time_to_wait_in_mins !== undefined) body.time_to_wait_in_mins = time_to_wait_in_mins;
        if (is_suspended !== undefined) body.is_suspended = is_suspended;
        const result = await client.request<unknown>(
          "POST",
          `/email-accounts/${emailAccountId}`,
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // f. Delete email account
  server.tool(
    "sl_delete_email_account",
    "Delete a SmartLead email sending account. This is a soft-delete: removes from campaigns, deactivates warmup, clears domain mappings.",
    {
      emailAccountId: z.number().describe("The email account ID to delete"),
    },
    async ({ emailAccountId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "DELETE",
          `/email-accounts/${emailAccountId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // g. Add OAuth email account
  server.tool(
    "sl_create_oauth_email_account",
    "Add a Gmail or Outlook email account to SmartLead using OAuth credentials.",
    {
      from_name: z.string().describe("Display name"),
      from_email: z.string().describe("Email address (must match OAuth account)"),
      username: z.string().describe("Email username (typically same as from_email)"),
      type: z.enum(["GMAIL", "OUTLOOK"]).describe("Email provider type"),
      warmup_enabled: z.boolean().describe("Whether to enable warmup"),
      use_whitelabel_credentials: z.boolean().describe("Use SmartLead's OAuth credentials"),
      token: z.object({
        scope: z.string().describe("OAuth scopes granted"),
        token_type: z.string().describe("Must be Bearer"),
        access_token: z.string().optional().describe("OAuth access token"),
        refresh_token: z.string().optional().describe("Token for renewal"),
        expiry_date: z.number().describe("Unix timestamp in milliseconds"),
        id_token: z.string().optional().describe("OpenID Connect ID token"),
      }).describe("OAuth token object"),
      max_email_per_day: z.number().optional().describe("Daily sending limit"),
      client_id: z.number().optional().describe("Multi-tenant client ID"),
    },
    async ({ from_name, from_email, username, type, warmup_enabled, use_whitelabel_credentials, token, max_email_per_day, client_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {
          from_name,
          from_email,
          username,
          type,
          warmup_enabled,
          use_whitelabel_credentials,
          token,
        };
        if (max_email_per_day !== undefined) body.max_email_per_day = max_email_per_day;
        if (client_id !== undefined) body.client_id = client_id;
        const result = await client.request<unknown>("POST", "/email-accounts/save-oauth", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // h. Update warmup settings for an email account
  server.tool(
    "sl_update_warmup_settings",
    "Enable or disable warmup and configure warmup parameters for a SmartLead email account.",
    {
      emailAccountId: z.number().describe("The email account ID"),
      warmup_enabled: z.boolean().describe("Whether warmup is enabled"),
      total_warmup_per_day: z
        .number()
        .optional()
        .describe("Total warmup emails to send per day"),
      daily_rampup: z
        .number()
        .optional()
        .describe("Number of additional warmup emails to add each day"),
      reply_rate_percentage: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Percentage of warmup emails that should receive a reply (0-100)"),
    },
    async ({ emailAccountId, warmup_enabled, total_warmup_per_day, daily_rampup, reply_rate_percentage }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { warmup_enabled };
        if (total_warmup_per_day !== undefined) body.total_warmup_per_day = total_warmup_per_day;
        if (daily_rampup !== undefined) body.daily_rampup = daily_rampup;
        if (reply_rate_percentage !== undefined) body.reply_rate_percentage = reply_rate_percentage;
        const result = await client.request<unknown>(
          "POST",
          `/email-accounts/${emailAccountId}/warmup`,
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // i. Suspend email account
  server.tool(
    "sl_suspend_email_account",
    "Suspend a SmartLead email account, pausing all sending and warmup activity.",
    {
      emailAccountId: z.number().describe("The email account ID to suspend"),
    },
    async ({ emailAccountId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "PUT",
          `/email-accounts/suspend/${emailAccountId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // j. Unsuspend email account
  server.tool(
    "sl_unsuspend_email_account",
    "Unsuspend a previously suspended SmartLead email account, resuming sending and warmup.",
    {
      emailAccountId: z.number().describe("The email account ID to unsuspend"),
    },
    async ({ emailAccountId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "DELETE",
          `/email-accounts/unsuspend/${emailAccountId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
