import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerEmailAccountTagTools(server: McpServer, env: Env): void {
  // 1. Create or update an email account tag
  server.tool(
    "sl_create_email_account_tag",
    "Create a new email account tag or update an existing one in SmartLead. Use id=0 to create a new tag.",
    {
      id: z.number().describe("Tag ID. Use 0 to create a new tag, or an existing ID to update."),
      name: z.string().describe("Tag name"),
      color: z.string().describe("Tag color as hex string (e.g. '#FF5733')"),
    },
    async ({ id, name, color }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/email-accounts/tag-manager", {
          body: { id, name, color },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Get tags for specific email accounts
  server.tool(
    "sl_get_email_account_tags",
    "Get tags assigned to specific email accounts by their email addresses.",
    {
      email_ids: z
        .array(z.string())
        .min(1)
        .describe("Array of email addresses to get tags for"),
    },
    async ({ email_ids }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/email-accounts/tag-list", {
          body: { email_ids },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Assign tags to email accounts
  server.tool(
    "sl_assign_email_account_tags",
    "Assign one or more tags to email accounts by their account IDs.",
    {
      email_account_ids: z
        .array(z.number())
        .min(1)
        .max(25)
        .describe("Array of email account IDs (1-25)"),
      tag_ids: z
        .array(z.number())
        .min(1)
        .describe("Array of tag IDs to assign"),
    },
    async ({ email_account_ids, tag_ids }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/email-accounts/tag-mapping", {
          body: { email_account_ids, tag_ids },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Remove tags from email accounts
  server.tool(
    "sl_remove_email_account_tags",
    "Remove one or more tags from email accounts by their account IDs.",
    {
      email_account_ids: z
        .array(z.number())
        .min(1)
        .describe("Array of email account IDs"),
      tag_ids: z
        .array(z.number())
        .min(1)
        .describe("Array of tag IDs to remove"),
    },
    async ({ email_account_ids, tag_ids }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("DELETE", "/email-accounts/tag-mapping", {
          body: { email_account_ids, tag_ids },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
