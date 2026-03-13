import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { registerCampaignTools } from "./campaigns";
import { registerWebhookTools } from "./webhooks";
import { registerLeadTools } from "./leads";
import { registerAccountTools } from "./accounts";
import { registerAnalyticsTools } from "./analytics";
import { registerStatisticsTools } from "./statistics";
import { registerGlobalAnalyticsTools } from "./global-analytics";
import { registerGlobalAnalyticsExtendedTools } from "./global-analytics-extended";
import { registerMasterInboxTools } from "./master-inbox";
import { registerClientTools } from "./clients";
import { registerSmartDeliveryTools } from "./smart-delivery";

export function registerAllTools(server: McpServer, env: Env): void {
  registerCampaignTools(server, env);                // 12 campaign tools
  registerWebhookTools(server, env);                 // 6 webhook tools (was 3)
  registerLeadTools(server, env);                    // 12 lead tools (was 5)
  registerAccountTools(server, env);                 // 8 email account tools (was 5)
  registerAnalyticsTools(server, env);               // 2 analytics tools
  registerStatisticsTools(server, env);              // 4 campaign statistics tools
  registerGlobalAnalyticsTools(server, env);         // 12 global analytics tools
  registerGlobalAnalyticsExtendedTools(server, env); // 9 global analytics tools (lead, mailbox, client, team)
  registerMasterInboxTools(server, env);             // 1 master inbox tool
  registerClientTools(server, env);                  // 1 client management tool
  registerSmartDeliveryTools(server, env);           // 1 smart delivery tool
}
