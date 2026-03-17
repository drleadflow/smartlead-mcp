import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerLeadListTools(server: McpServer, env: Env): void {
  // 1. Create a new lead list
  server.tool(
    "sl_create_lead_list",
    "Create a new lead list in SmartLead for organizing and segmenting leads before pushing them to campaigns.",
    {
      listName: z.string().describe("Name for the new lead list"),
    },
    async ({ listName }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/lead-list/", {
          body: { listName },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Get all lead lists with pagination
  server.tool(
    "sl_get_lead_lists",
    "Get all lead lists in SmartLead with optional filtering by name or tags. Supports pagination.",
    {
      listName: z
        .string()
        .optional()
        .describe("Filter by list name (partial match)"),
      tagIds: z
        .string()
        .optional()
        .describe("Comma-separated tag IDs to filter by"),
      limit: z
        .number()
        .min(1)
        .max(1000)
        .optional()
        .describe("Results per page (1-1000, default 10)"),
      offset: z
        .number()
        .optional()
        .describe("Pagination offset (default 0)"),
    },
    async ({ listName, tagIds, limit, offset }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (listName !== undefined) query.listName = listName;
        if (tagIds !== undefined) query.tagIds = tagIds;
        if (limit !== undefined) query.limit = String(limit);
        if (offset !== undefined) query.offset = String(offset);
        const result = await client.request<unknown>("GET", "/lead-list/", {
          query,
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Get a lead list by ID
  server.tool(
    "sl_get_lead_list",
    "Get details of a specific lead list by its ID in SmartLead.",
    {
      listId: z.number().describe("The lead list ID"),
    },
    async ({ listId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          `/lead-list/${listId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Update a lead list name
  server.tool(
    "sl_update_lead_list",
    "Update the name of an existing lead list in SmartLead.",
    {
      listId: z.number().describe("The lead list ID to update"),
      listName: z.string().describe("New name for the lead list"),
    },
    async ({ listId, listName }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "PUT",
          `/lead-list/${listId}`,
          { body: { listName } }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. Delete a lead list
  server.tool(
    "sl_delete_lead_list",
    "Delete a lead list from SmartLead. This removes the list but does not delete the leads themselves.",
    {
      listId: z.number().describe("The lead list ID to delete"),
    },
    async ({ listId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "DELETE",
          `/lead-list/${listId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 6. Bulk import leads to a list
  server.tool(
    "sl_import_leads_to_list",
    "Bulk import leads into a SmartLead lead list. Each lead must have at least an email field.",
    {
      listId: z.number().describe("The lead list ID to import leads into"),
      leadList: z
        .array(
          z.object({
            email: z.string().describe("Lead email address (required)"),
            first_name: z.string().optional().describe("Lead first name"),
            last_name: z.string().optional().describe("Lead last name"),
            company_name: z.string().optional().describe("Lead company name"),
            phone_number: z.string().optional().describe("Lead phone number"),
            website: z.string().optional().describe("Lead website URL"),
            location: z.string().optional().describe("Lead location / city"),
            custom_fields: z
              .record(z.any())
              .optional()
              .describe("Additional custom fields as key/value pairs"),
          })
        )
        .describe("Array of lead objects to import"),
      fileName: z
        .string()
        .describe("Name for the import file (e.g. 'my-leads.csv')"),
      ignoreGlobalBlockList: z
        .boolean()
        .optional()
        .describe("Skip global block list check during import"),
    },
    async ({ listId, leadList, fileName, ignoreGlobalBlockList }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { leadList, fileName };
        if (ignoreGlobalBlockList !== undefined) {
          body.ignoreGlobalBlockList = ignoreGlobalBlockList;
        }
        const result = await client.request<unknown>(
          "POST",
          `/lead-list/${listId}/import`,
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 7. Move leads between lists
  server.tool(
    "sl_move_leads_between_lists",
    "Move leads from one SmartLead lead list to another. Can move specific leads by ID or all leads in the source list.",
    {
      sourceListId: z.number().describe("The source lead list ID to move leads from"),
      targetListId: z.number().describe("The target lead list ID to move leads to"),
      leadIds: z
        .array(z.number())
        .optional()
        .describe("Specific lead IDs to move. Omit to use allLeads flag."),
      allLeads: z
        .boolean()
        .optional()
        .describe("Move all leads from source list (default false)"),
    },
    async ({ sourceListId, targetListId, leadIds, allLeads }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { sourceListId, targetListId };
        if (leadIds !== undefined) body.leadIds = leadIds;
        if (allLeads !== undefined) body.allLeads = allLeads;
        const result = await client.request<unknown>(
          "POST",
          "/lead-list/move-leads",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 8. Push leads from a list to a campaign
  server.tool(
    "sl_push_list_to_campaign",
    "Push leads from a SmartLead lead list to a campaign. Can copy or move leads. Specify either campaignId (existing) or campaignName (creates new).",
    {
      campaignId: z
        .number()
        .optional()
        .describe("Existing campaign ID to push leads to (use this OR campaignName)"),
      campaignName: z
        .string()
        .optional()
        .describe("Name for a new campaign to create and push leads to (use this OR campaignId)"),
      action: z
        .enum(["copy", "move"])
        .describe("Whether to copy or move leads from the list to the campaign"),
      listId: z.number().describe("The lead list ID to push leads from"),
      leadIds: z
        .array(z.number())
        .optional()
        .describe("Specific lead IDs to push. Omit to use allLeads flag."),
      allLeads: z
        .boolean()
        .optional()
        .describe("Push all leads from the list (default false)"),
    },
    async ({ campaignId, campaignName, action, listId, leadIds, allLeads }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const leadList: Record<string, unknown> = { listId };
        if (leadIds !== undefined) leadList.leadIds = leadIds;
        if (allLeads !== undefined) leadList.allLeads = allLeads;
        const body: Record<string, unknown> = { action, leadList };
        if (campaignId !== undefined) body.campaignId = campaignId;
        if (campaignName !== undefined) body.campaignName = campaignName;
        const result = await client.request<unknown>(
          "POST",
          "/leads/push-to-campaign",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 9. Assign or remove tags from lead lists
  server.tool(
    "sl_assign_tags_to_lead_list",
    "Assign or remove tags from one or more SmartLead lead lists. Useful for organizing and filtering lists.",
    {
      listIds: z
        .array(z.number())
        .min(1)
        .max(10)
        .describe("Lead list IDs to update (1-10)"),
      tagIds: z
        .array(z.number())
        .min(1)
        .max(10)
        .describe("Tag IDs to assign to the lists (1-10)"),
      removeTagIds: z
        .array(z.number())
        .min(1)
        .max(10)
        .optional()
        .describe("Tag IDs to remove from the lists (1-10)"),
    },
    async ({ listIds, tagIds, removeTagIds }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { listIds, tagIds };
        if (removeTagIds !== undefined) body.removeTagIds = removeTagIds;
        const result = await client.request<unknown>(
          "POST",
          "/lead-list/assign-tags",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
