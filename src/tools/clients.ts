import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerClientTools(server: McpServer, env: Env): void {
  // Create/save client
  server.tool(
    "sl_create_client",
    "Create a new client account in SmartLead (agency/white-label feature).",
    {
      email: z.string().describe("Unique client email address"),
      name: z.string().describe("Client display name"),
      password: z.string().optional().describe("Login password for the client"),
      logo_url: z.string().optional().describe("Logo image URL"),
      permission: z.array(z.string()).optional().describe("Feature access controls"),
      is_credit_assigned: z.boolean().optional().describe("Whether to allocate credits"),
      email_credits: z.number().optional().describe("Email credits to allocate"),
      lead_credits: z.number().optional().describe("Lead credits to allocate"),
    },
    async ({ email, name, password, logo_url, permission, is_credit_assigned, email_credits, lead_credits }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { email, name };
        if (password !== undefined) body.password = password;
        if (logo_url !== undefined) body.logo_url = logo_url;
        if (permission !== undefined) body.permission = permission;
        if (is_credit_assigned !== undefined) body.is_credit_assigned = is_credit_assigned;
        if (email_credits !== undefined) body.email_credits = email_credits;
        if (lead_credits !== undefined) body.lead_credits = lead_credits;
        const result = await client.request<unknown>("POST", "/client/save", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
