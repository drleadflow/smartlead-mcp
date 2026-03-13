import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "./types";
import { registerAllTools } from "./tools/index";

export class SmartLeadMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: "SmartLead MCP Server",
    version: "1.0.0",
  });

  async init(): Promise<void> {
    registerAllTools(this.server, this.env);
  }
}

export default SmartLeadMcpAgent.serve("/mcp");
