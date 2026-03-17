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
import { registerLeadNoteTools } from "./lead-notes";
import { registerLeadTaskTools } from "./lead-tasks";
import { registerLeadTagTools } from "./lead-tags";
import { registerLeadListTools } from "./lead-lists";
import { registerEmailAccountTagTools } from "./email-account-tags";
import { registerUtilityTools } from "./utilities";
import { registerSmartSenderTools } from "./smart-senders";
import { registerSmartProspectTools } from "./smart-prospect";

export function registerAllTools(server: McpServer, env: Env): void {
  registerCampaignTools(server, env);                // 17 campaign tools
  registerWebhookTools(server, env);                 // 9 webhook tools
  registerLeadTools(server, env);                    // 17 lead tools
  registerAccountTools(server, env);                 // 10 email account tools
  registerAnalyticsTools(server, env);               // 2 analytics tools
  registerStatisticsTools(server, env);              // 5 campaign statistics tools
  registerGlobalAnalyticsTools(server, env);         // 12 global analytics tools
  registerGlobalAnalyticsExtendedTools(server, env); // 9 global analytics extended tools
  registerMasterInboxTools(server, env);             // 24 master inbox tools
  registerClientTools(server, env);                  // 8 client management tools
  registerSmartDeliveryTools(server, env);           // 28 smart delivery tools
  registerLeadNoteTools(server, env);                // 2 lead note tools
  registerLeadTaskTools(server, env);                // 2 lead task tools
  registerLeadTagTools(server, env);                 // 4 lead tag tools
  registerLeadListTools(server, env);                // 9 lead list tools
  registerEmailAccountTagTools(server, env);         // 4 email account tag tools
  registerUtilityTools(server, env);                 // 5 utility tools
  registerSmartSenderTools(server, env);             // 5 smart sender tools
  registerSmartProspectTools(server, env);           // 26 smart prospect tools
}
