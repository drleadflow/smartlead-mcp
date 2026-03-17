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

  // 2. List all clients
  server.tool(
    "sl_list_clients",
    "List all client accounts in SmartLead (agency/white-label feature).",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/client");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Update client
  server.tool(
    "sl_update_client",
    "Update an existing client in SmartLead. The id field identifies which client to update.",
    {
      id: z.number().describe("Client ID to update"),
      email: z.string().describe("Client email address"),
      name: z.string().describe("Client display name"),
      password: z.string().optional().describe("Login password"),
      logo_url: z.string().optional().describe("Logo image URL"),
      permission: z.array(z.string()).optional().describe("Feature access controls"),
      is_credit_assigned: z.boolean().optional().describe("Whether to allocate credits"),
      email_credits: z.number().optional().describe("Email credits to allocate"),
      lead_credits: z.number().optional().describe("Lead credits to allocate"),
    },
    async ({ id, email, name, password, logo_url, permission, is_credit_assigned, email_credits, lead_credits }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { id, email, name };
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

  // 4. Create client API key
  server.tool(
    "sl_create_client_api_key",
    "Create a new API key for a SmartLead client.",
    {
      clientId: z.number().describe("The client ID"),
      keyName: z.string().describe("Descriptive label for the API key"),
    },
    async ({ clientId, keyName }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/client/api-key", {
          body: { clientId, keyName },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. List client API keys
  server.tool(
    "sl_list_client_api_keys",
    "List API keys for SmartLead clients with optional filters.",
    {
      clientId: z.number().optional().describe("Filter by client ID"),
      status: z.enum(["active", "inactive"]).optional().describe("Filter by key status"),
      keyName: z.string().optional().describe("Filter by partial name match"),
    },
    async ({ clientId, status, keyName }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (clientId !== undefined) query.clientId = String(clientId);
        if (status) query.status = status;
        if (keyName) query.keyName = keyName;
        const result = await client.request<unknown>("GET", "/client/api-key", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 6. Delete client API key
  server.tool(
    "sl_delete_client_api_key",
    "Delete a SmartLead client API key.",
    {
      keyId: z.number().describe("The API key ID to delete"),
    },
    async ({ keyId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("DELETE", `/client/api-key/${keyId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 7. Reset client API key
  server.tool(
    "sl_reset_client_api_key",
    "Regenerate a SmartLead client API key while maintaining the key record.",
    {
      keyId: z.number().describe("The API key ID to reset"),
    },
    async ({ keyId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("PUT", `/client/api-key/reset/${keyId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
