import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerUtilityTools(server: McpServer, env: Env): void {
  // 1. Verify email deliverability
  server.tool(
    "sl_verify_email",
    "Verify an email address for deliverability — checks syntax, domain, SMTP, and quality. Use before adding leads to avoid bounces.",
    {
      email: z.string().email().describe("The email address to verify"),
    },
    async ({ email }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/verify-emails", {
          body: { email },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Send a single transactional email
  server.tool(
    "sl_send_single_email",
    "Send a single transactional email outside of any campaign. Useful for one-off follow-ups or test emails.",
    {
      to_email: z.string().email().describe("Recipient email address"),
      from_email: z.string().email().describe("Sender email address (must be a connected account)"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content (HTML or plain text)"),
      email_account_id: z.number().optional().describe("SmartLead email account ID to send from"),
    },
    async ({ to_email, from_email, subject, body: emailBody, email_account_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const reqBody: Record<string, unknown> = { to_email, from_email, subject, body: emailBody };
        if (email_account_id !== undefined) reqBody.email_account_id = email_account_id;
        const result = await client.request<unknown>("POST", "/send-email/initiate", {
          body: reqBody,
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Get global domain block list
  server.tool(
    "sl_get_domain_block_list",
    "Get the global domain block list. Blocked domains are excluded from all campaigns. Supports pagination with offset and limit.",
    {
      offset: z.number().optional().describe("Pagination offset (default 0)"),
      limit: z.number().max(1000).optional().describe("Number of results to return (max 1000)"),
    },
    async ({ offset, limit }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (offset !== undefined) query.offset = String(offset);
        if (limit !== undefined) query.limit = String(limit);
        const result = await client.request<unknown>("GET", "/leads/get-domain-block-list", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Add domains to block list
  server.tool(
    "sl_add_to_domain_block_list",
    "Add one or more domains to the global block list. Leads from blocked domains are excluded from all campaigns.",
    {
      domain_block_list: z
        .array(z.string())
        .min(1)
        .describe("Array of domain names to block (e.g. ['example.com', 'spam.org'])"),
      client_id: z.number().optional().describe("Optional client ID to scope the block list"),
    },
    async ({ domain_block_list, client_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const reqBody: Record<string, unknown> = { domain_block_list };
        if (client_id !== undefined) reqBody.client_id = client_id;
        const result = await client.request<unknown>("POST", "/leads/add-domain-block-list", {
          body: reqBody,
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. Delete a domain from block list
  server.tool(
    "sl_delete_from_domain_block_list",
    "Remove a domain from the global block list by its block list entry ID. Use sl_get_domain_block_list first to find the entry ID.",
    {
      blockListId: z.number().describe("The block list entry ID to delete"),
    },
    async ({ blockListId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "DELETE",
          `/leads/delete-domain-block-list/${blockListId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
