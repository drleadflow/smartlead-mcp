import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";
import type { Env } from "../types";

export function registerLeadNoteTools(server: McpServer, env: Env): void {
  // a. Create a note on a lead
  server.tool(
    "sl_create_lead_note",
    "Create a note on a lead in SmartLead's master inbox. Requires the email_lead_map_id (the mapping ID between a lead and a campaign).",
    {
      email_lead_map_id: z.number().describe("The email-lead mapping ID (links a lead to a campaign)"),
      note_message: z.string().describe("The note content to attach to the lead"),
    },
    async ({ email_lead_map_id, note_message }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/master-inbox/create-note", {
          body: {
            email_lead_map_id,
            note_message,
          },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // b. Get all notes for a lead
  server.tool(
    "sl_get_lead_notes",
    "Get all notes attached to a specific lead. NOTE: This endpoint uses the CRM API path which may require SmartLead Premium access.",
    {
      leadId: z.number().describe("The SmartLead lead ID"),
    },
    async ({ leadId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/crm/leads/notes/${leadId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
