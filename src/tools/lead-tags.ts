import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerLeadTagTools(server: McpServer, env: Env): void {
  // a. Create or update a tag
  server.tool(
    "sl_create_lead_tag",
    "Create a new tag or update an existing one in SmartLead's shared tag system. Use id=0 to create a new tag, or pass an existing tag ID to update it.",
    {
      id: z.number().describe("Tag ID. Use 0 to create a new tag, or an existing tag ID to update it."),
      name: z.string().describe("Display name for the tag"),
      color: z.string().describe("Hex color code for the tag, e.g. #FF5733"),
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

  // b. Get tags for a lead or all tags
  server.tool(
    "sl_get_lead_tags",
    "Get tags for a specific lead or all available tags. NOTE: Uses CRM API path which may require SmartLead Premium access.",
    {
      leadId: z.number().optional().describe("Lead ID to get tags for. Omit to retrieve all available tags."),
    },
    async ({ leadId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (leadId !== undefined) {
          query.leadId = String(leadId);
        }
        const result = await client.request<unknown>("GET", "/crm/leads/tags", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // c. Add tags to a lead
  server.tool(
    "sl_add_tags_to_lead",
    "Add tags to a lead. NOTE: Uses CRM API path which may require SmartLead Premium access. Tags must exist first (use sl_create_lead_tag).",
    {
      leadId: z.number().describe("The lead ID to add tags to"),
      tagIds: z.array(z.number()).min(1).describe("Array of tag IDs to add to the lead"),
    },
    async ({ leadId, tagIds }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/crm/leads/tags", {
          body: { leadId, tagIds },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // d. Remove a tag from a lead
  server.tool(
    "sl_remove_tag_from_lead",
    "Remove a tag from a lead. NOTE: Uses CRM API path which may require SmartLead Premium. Use tag_mapping_id from sl_get_lead_tags, NOT tag ID.",
    {
      tagMappingId: z.number().describe("The tag mapping ID (from sl_get_lead_tags response), NOT the tag ID"),
    },
    async ({ tagMappingId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("DELETE", `/crm/leads/tags/${tagMappingId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
