import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { SmartLeadClient } from "../client";
import { ok, err } from "../helpers";

export function registerSmartDeliveryTools(server: McpServer, env: Env): void {
  // 1. Get provider IDs
  server.tool(
    "sl_get_smart_delivery_providers",
    "Get region-wise email provider IDs for spam testing configuration from SmartLead's deliverability testing suite. NOTE: Requires SmartDelivery add-on.",
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

  // 2. Create manual placement test
  server.tool(
    "sl_create_manual_placement_test",
    "Create a manual inbox placement test in SmartLead Smart Delivery.",
    {
      test_name: z.string().optional().describe("Name for the test"),
      email_account_ids: z.array(z.number()).optional().describe("Email account IDs to test"),
      provider_ids: z.array(z.number()).optional().describe("Provider IDs to test against"),
    },
    async ({ test_name, email_account_ids, provider_ids }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (test_name !== undefined) body.test_name = test_name;
        if (email_account_ids !== undefined) body.email_account_ids = email_account_ids;
        if (provider_ids !== undefined) body.provider_ids = provider_ids;
        const result = await client.request<unknown>("POST", "/smart-delivery/manual-test", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Create automated placement test
  server.tool(
    "sl_create_automated_placement_test",
    "Create an automated recurring inbox placement test in SmartLead Smart Delivery.",
    {
      test_name: z.string().optional().describe("Name for the test"),
      email_account_ids: z.array(z.number()).optional().describe("Email account IDs to test"),
      provider_ids: z.array(z.number()).optional().describe("Provider IDs to test against"),
      schedule: z.record(z.any()).optional().describe("Schedule configuration object"),
    },
    async ({ test_name, email_account_ids, provider_ids, schedule }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (test_name !== undefined) body.test_name = test_name;
        if (email_account_ids !== undefined) body.email_account_ids = email_account_ids;
        if (provider_ids !== undefined) body.provider_ids = provider_ids;
        if (schedule !== undefined) body.schedule = schedule;
        const result = await client.request<unknown>("POST", "/smart-delivery/automated-test", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Get spam test details
  server.tool(
    "sl_get_spam_test_details",
    "Get detailed results for a specific spam/placement test including inbox placement scores.",
    {
      testId: z.string().describe("The test ID"),
    },
    async ({ testId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/smart-delivery/test/${testId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. Delete tests in bulk
  server.tool(
    "sl_delete_tests_bulk",
    "Delete multiple deliverability tests at once.",
    {
      test_ids: z.array(z.string()).describe("Array of test IDs to delete"),
    },
    async ({ test_ids }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/smart-delivery/delete-bulk", {
          body: { test_ids },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 6. Stop automated test
  server.tool(
    "sl_stop_automated_test",
    "Stop an active automated deliverability test, preserving collected results.",
    {
      testId: z.string().describe("The test ID to stop"),
    },
    async ({ testId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("PUT", `/smart-delivery/stop/${testId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 7. List all tests
  server.tool(
    "sl_list_delivery_tests",
    "List all deliverability tests with optional pagination and folder filter.",
    {
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page"),
      folder_id: z.string().optional().describe("Filter by folder ID"),
    },
    async ({ offset, limit, folder_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (offset !== undefined) body.offset = offset;
        if (limit !== undefined) body.limit = limit;
        if (folder_id !== undefined) body.folder_id = folder_id;
        const result = await client.request<unknown>("POST", "/smart-delivery/list", { body });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 8. Provider-wise report
  server.tool(
    "sl_get_provider_report",
    "Get deliverability metrics by email provider (Gmail, Outlook, Yahoo) for a test.",
    {
      test_id: z.string().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/smart-delivery/provider-report", {
          body: { test_id },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 9. Geo-wise report
  server.tool(
    "sl_get_geo_report",
    "Get deliverability metrics by geographic region for a test.",
    {
      test_id: z.string().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/smart-delivery/geo-report", {
          body: { test_id },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 10. Sender account report
  server.tool(
    "sl_get_sender_report",
    "Get performance metrics for a sender email account in a deliverability test.",
    {
      test_id: z.string().optional().describe("The test ID to filter by"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/sender-report", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 11. Spam filter report
  server.tool(
    "sl_get_spam_filter_report",
    "Get spam filter analysis report for a deliverability test.",
    {
      test_id: z.string().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/smart-delivery/spam-filter", {
          body: { test_id },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 12. DKIM details
  server.tool(
    "sl_get_dkim_details",
    "Check DKIM configuration status for sender domain authentication.",
    {
      test_id: z.string().optional().describe("The test ID to check"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/dkim", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 13. SPF details
  server.tool(
    "sl_get_spf_details",
    "Verify SPF record configuration for sender authorization.",
    {
      test_id: z.string().optional().describe("The test ID to check"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/spf", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 14. rDNS report
  server.tool(
    "sl_get_rdns_report",
    "Get reverse DNS report for a deliverability test.",
    {
      test_id: z.string().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/smart-delivery/rdns", {
          body: { test_id },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 15. Sender list
  server.tool(
    "sl_get_sender_list",
    "List all sender accounts in Smart Delivery.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/smart-delivery/senders");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 16. IP blacklists
  server.tool(
    "sl_get_ip_blacklists",
    "Check IP blacklist status for a deliverability test.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/blacklists", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 17. Domain blacklist
  server.tool(
    "sl_get_domain_blacklist",
    "Check domain blacklist status for a deliverability test.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/domain-blacklist", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 18. Test email content
  server.tool(
    "sl_get_test_email_content",
    "Retrieve actual email content from a deliverability test.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/email-content", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 19. IP blacklist count
  server.tool(
    "sl_get_ip_blacklist_count",
    "Quick health check: count of blacklists your IP appears on.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/ip-blacklist-count", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 20. Reply headers
  server.tool(
    "sl_get_reply_headers",
    "Get email reply headers from a deliverability test.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/reply-headers", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 21. Schedule history
  server.tool(
    "sl_get_schedule_history",
    "Get send history and execution logs for automated deliverability tests.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/schedule-history", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 22. IP details
  server.tool(
    "sl_get_ip_details",
    "Get IP address details for a deliverability test.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/ip-details", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 23. Mailbox summary
  server.tool(
    "sl_get_mailbox_summary",
    "Get high-level summary of all test mailboxes in Smart Delivery.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/mailbox-summary", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 24. Mailbox count
  server.tool(
    "sl_get_mailbox_count",
    "Get count of test mailboxes in Smart Delivery.",
    {
      test_id: z.string().optional().describe("The test ID"),
    },
    async ({ test_id }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (test_id) query.test_id = test_id;
        const result = await client.request<unknown>("GET", "/smart-delivery/mailbox-count", { query });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 25. Get folders
  server.tool(
    "sl_get_delivery_folders",
    "List organizational folders for spam tests in Smart Delivery.",
    {},
    async () => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", "/smart-delivery/folders");
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 26. Create folder
  server.tool(
    "sl_create_delivery_folder",
    "Create a new folder for organizing deliverability tests.",
    {
      name: z.string().describe("Folder name"),
    },
    async ({ name }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("POST", "/smart-delivery/folders", {
          body: { name },
        });
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 27. Get folder by ID
  server.tool(
    "sl_get_delivery_folder",
    "Get a specific Smart Delivery folder by ID.",
    {
      folderId: z.string().describe("The folder ID"),
    },
    async ({ folderId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("GET", `/smart-delivery/folders/${folderId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 28. Delete folder
  server.tool(
    "sl_delete_delivery_folder",
    "Delete an empty Smart Delivery test folder.",
    {
      folderId: z.string().describe("The folder ID to delete"),
    },
    async ({ folderId }) => {
      try {
        const client = new SmartLeadClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>("DELETE", `/smart-delivery/folders/${folderId}`);
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );
}
