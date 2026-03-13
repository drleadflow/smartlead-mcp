import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerSmartDeliveryTools(server: McpServer, env: Env): void {
  // Get provider IDs
  server.tool(
    "sl_get_smart_delivery_providers",
    "Get region-wise email provider IDs for spam testing configuration from SmartLead's deliverability testing suite.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/smart-delivery/provider-ids");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
