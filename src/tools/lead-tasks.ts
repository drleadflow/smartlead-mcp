import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerLeadTaskTools(server: McpServer, env: Env): void {
  // Create a task for a lead
  server.tool(
    "sl_create_lead_task",
    "Create a task for a lead in SmartLead. Tasks help track follow-ups and actions for specific leads.",
    {
      email_lead_map_id: z.number().describe("The email-lead mapping ID for the lead"),
      name: z.string().describe("Task name"),
      description: z.string().optional().describe("Task description"),
      priority: z
        .enum(["LOW", "MEDIUM", "HIGH"])
        .optional()
        .default("MEDIUM")
        .describe("Task priority (default MEDIUM)"),
      due_date: z
        .string()
        .optional()
        .describe("Due date in ISO 8601 format (e.g. 2026-04-01T00:00:00Z)"),
    },
    async ({ email_lead_map_id, name, description, priority, due_date }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {
          email_lead_map_id,
          name,
          priority,
        };
        if (description !== undefined) body.description = description;
        if (due_date !== undefined) body.due_date = due_date;

        const result = await client.request<unknown>(
          "POST",
          "/master-inbox/create-task",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // Get all tasks for a lead
  server.tool(
    "sl_get_lead_tasks",
    "Get all tasks for a specific lead. NOTE: This endpoint uses the CRM API path which may require SmartLead Premium access.",
    {
      leadId: z.number().describe("The lead ID to fetch tasks for"),
    },
    async ({ leadId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          `/crm/leads/tasks/${leadId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
