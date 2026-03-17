import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../types";
import { ok, err } from "../helpers";

const PROSPECT_BASE_URL = "https://prospect-api.smartlead.ai/api/v1";

class ProspectClient {
  constructor(private apiKey: string) {}

  async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; query?: Record<string, string> }
  ): Promise<T> {
    const url = new URL(`${PROSPECT_BASE_URL}${path}`);
    url.searchParams.set("api_key", this.apiKey);
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined) url.searchParams.set(k, v);
      }
    }
    const resp = await fetch(url.toString(), {
      method,
      headers: { "Content-Type": "application/json" },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`SmartLead Prospect ${resp.status}: ${text}`);
    }
    const contentType = resp.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return resp.json() as Promise<T>;
    }
    const text = await resp.text();
    return { message: text } as T;
  }
}

function lookupTool(
  server: McpServer,
  env: Env,
  name: string,
  desc: string,
  path: string,
  extraParams?: Record<string, z.ZodTypeAny>
): void {
  const schema: Record<string, z.ZodTypeAny> = {
    limit: z.number().optional().describe("Results per page (default 10, max 100)"),
    offset: z.number().optional().describe("Pagination offset"),
    search: z.string().optional().describe("Search filter"),
    ...extraParams,
  };
  server.tool(name, desc, schema, async (params: Record<string, unknown>) => {
    try {
      const client = new ProspectClient(env.SMARTLEAD_API_KEY);
      const query: Record<string, string> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) query[k] = String(v);
      }
      const result = await client.request<unknown>("GET", path, { query });
      return ok(JSON.stringify(result, null, 2));
    } catch (e) {
      return err(e);
    }
  });
}

export function registerSmartProspectTools(server: McpServer, env: Env): void {
  // 1. Search contacts
  server.tool(
    "sl_prospect_search_contacts",
    "Search the SmartLead prospect database for contacts matching filters. Returns contact results with scroll-based pagination.",
    {
      limit: z.number().min(1).max(500).describe("Number of results to return (1-500)"),
      scroll_id: z.string().optional().describe("Scroll ID from previous response for pagination"),
      filters: z
        .record(z.any())
        .optional()
        .describe(
          "Optional filter object. Supported keys (all string[]): name, firstName, lastName, title, excludeTitle, includeTitle, companyName, companyDomain, includeCompany, excludeCompany, includeCompanyDomain, excludeCompanyDomain, companyKeyword, department, level, city, state, country, companyHeadCount, companyRevenue, companyIndustry, companySubIndustry. Booleans: dontDisplayOwnedContact, titleExactMatch, companyExactMatch, companyDomainExactMatch"
        ),
    },
    async ({ limit, scroll_id, filters }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { limit };
        if (scroll_id !== undefined) body.scroll_id = scroll_id;
        if (filters !== undefined) Object.assign(body, filters);
        const result = await client.request<unknown>(
          "POST",
          "/search-email-leads/search-contacts",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 2. Get contacts
  server.tool(
    "sl_prospect_get_contacts",
    "Get prospect contacts by IDs or filter ID with optional search and verification status filtering.",
    {
      id: z
        .array(z.string())
        .max(200)
        .optional()
        .describe("Contact IDs to retrieve (max 200)"),
      filter_id: z.number().optional().describe("Filter/search ID to retrieve contacts from"),
      limit: z.number().min(1).max(1000).optional().describe("Results per page (1-1000)"),
      offset: z.number().optional().describe("Pagination offset"),
      search: z.string().optional().describe("Search within results"),
      verification_status: z
        .enum(["valid", "catch_all", "invalid"])
        .optional()
        .describe("Filter by email verification status"),
    },
    async ({ id, filter_id, limit, offset, search, verification_status }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = {};
        if (id !== undefined) body.id = id;
        if (filter_id !== undefined) body.filter_id = filter_id;
        if (limit !== undefined) body.limit = limit;
        if (offset !== undefined) body.offset = offset;
        if (search !== undefined) body.search = search;
        if (verification_status !== undefined) body.verification_status = verification_status;
        const result = await client.request<unknown>(
          "POST",
          "/search-email-leads/get-contacts",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 3. Fetch contacts
  server.tool(
    "sl_prospect_fetch_contacts",
    "Fetch prospect contacts from a saved search filter. Use after searching to retrieve and enrich contacts.",
    {
      filter_id: z.number().describe("Filter/search ID to fetch contacts from"),
      id: z.array(z.string()).optional().describe("Specific contact IDs to fetch"),
      limit: z.number().optional().describe("Number of contacts to fetch"),
      visual_limit: z.number().optional().describe("Visual display limit"),
      visual_offset: z.number().optional().describe("Visual display offset"),
    },
    async ({ filter_id, id, limit, visual_limit, visual_offset }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { filter_id };
        if (id !== undefined) body.id = id;
        if (limit !== undefined) body.limit = limit;
        if (visual_limit !== undefined) body.visual_limit = visual_limit;
        if (visual_offset !== undefined) body.visual_offset = visual_offset;
        const result = await client.request<unknown>(
          "POST",
          "/search-email-leads/fetch-contacts",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 4. Find emails
  server.tool(
    "sl_prospect_find_emails",
    "Find email addresses for up to 10 contacts by name and company domain.",
    {
      contacts: z
        .array(
          z.object({
            firstName: z.string().describe("Contact first name"),
            lastName: z.string().describe("Contact last name"),
            companyDomain: z.string().describe("Company domain (e.g. acme.com)"),
          })
        )
        .min(1)
        .max(10)
        .describe("Contacts to find emails for (max 10)"),
    },
    async ({ contacts }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "POST",
          "/search-email-leads/search-contacts/find-emails",
          { body: { contacts } }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 5. Review contacts
  server.tool(
    "sl_prospect_review_contacts",
    "Mark contacts in a filter as reviewed.",
    {
      filterId: z.string().describe("Filter ID to mark contacts as reviewed"),
    },
    async ({ filterId }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "PATCH",
          `/search-email-leads/review-contacts/${filterId}`
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 6. Save search
  server.tool(
    "sl_prospect_save_search",
    "Save a prospect search with filters for later use.",
    {
      search_string: z.string().describe("Name for the saved search"),
      filters: z
        .record(z.any())
        .optional()
        .describe("Search filters to save (same format as search_contacts filters)"),
    },
    async ({ search_string, filters }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const body: Record<string, unknown> = { search_string };
        if (filters !== undefined) body.filters = filters;
        const result = await client.request<unknown>(
          "POST",
          "/search-email-leads/search-filters/save-search",
          { body }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 7. Get saved searches
  server.tool(
    "sl_prospect_get_saved_searches",
    "List all saved prospect searches.",
    {
      limit: z.number().optional().describe("Results per page"),
      offset: z.number().optional().describe("Pagination offset"),
    },
    async ({ limit, offset }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (limit !== undefined) query.limit = String(limit);
        if (offset !== undefined) query.offset = String(offset);
        const result = await client.request<unknown>(
          "GET",
          "/search-email-leads/search-filters/saved-searches",
          { query }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 8. Get fetched searches
  server.tool(
    "sl_prospect_get_fetched_searches",
    "List all fetched/enriched prospect searches.",
    {
      limit: z.number().optional().describe("Results per page"),
      offset: z.number().optional().describe("Pagination offset"),
    },
    async ({ limit, offset }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (limit !== undefined) query.limit = String(limit);
        if (offset !== undefined) query.offset = String(offset);
        const result = await client.request<unknown>(
          "GET",
          "/search-email-leads/search-filters/fetched-searches",
          { query }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 9. Get recent searches
  server.tool(
    "sl_prospect_get_recent_searches",
    "List recent prospect searches.",
    {
      limit: z.number().optional().describe("Results per page"),
      offset: z.number().optional().describe("Pagination offset"),
    },
    async ({ limit, offset }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (limit !== undefined) query.limit = String(limit);
        if (offset !== undefined) query.offset = String(offset);
        const result = await client.request<unknown>(
          "GET",
          "/search-email-leads/search-filters/recent-searches",
          { query }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 10. Update saved search
  server.tool(
    "sl_prospect_update_saved_search",
    "Update the name of a saved prospect search.",
    {
      searchId: z.string().describe("Saved search ID to update"),
      search_string: z.string().describe("New name for the saved search"),
    },
    async ({ searchId, search_string }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "PUT",
          `/search-email-leads/search-filters/save-search/${searchId}`,
          { body: { search_string } }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 11. Update fetched lead search
  server.tool(
    "sl_prospect_update_fetched_lead",
    "Update the name of a fetched lead search.",
    {
      searchId: z.string().describe("Fetched search ID to update"),
      search_string: z.string().describe("New name for the fetched search"),
    },
    async ({ searchId, search_string }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "PUT",
          `/search-email-leads/search-filters/fetched-searches/${searchId}`,
          { body: { search_string } }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 12. Search analytics
  server.tool(
    "sl_prospect_search_analytics",
    "Get analytics for prospect searches, optionally filtered by a specific search.",
    {
      filter_id: z.string().optional().describe("Filter ID to get analytics for"),
    },
    async ({ filter_id }) => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const query: Record<string, string> = {};
        if (filter_id !== undefined) query.filter_id = filter_id;
        const result = await client.request<unknown>(
          "GET",
          "/search-email-leads/search-analytics",
          { query }
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 13. Reply analytics
  server.tool(
    "sl_prospect_reply_analytics",
    "Get reply analytics for prospect outreach.",
    {},
    async () => {
      try {
        const client = new ProspectClient(env.SMARTLEAD_API_KEY);
        const result = await client.request<unknown>(
          "GET",
          "/search-email-leads/reply-analytics"
        );
        return ok(JSON.stringify(result, null, 2));
      } catch (e) {
        return err(e);
      }
    }
  );

  // 14-26. Lookup endpoints
  lookupTool(
    server,
    env,
    "sl_prospect_cities",
    "Look up cities in the prospect database. Optionally filter by state and country.",
    "/search-email-leads/cities",
    {
      state: z.string().optional().describe("Filter by state name"),
      country: z.string().optional().describe("Filter by country name"),
    }
  );

  lookupTool(
    server,
    env,
    "sl_prospect_states",
    "Look up states in the prospect database. Optionally filter by country.",
    "/search-email-leads/states",
    {
      country: z.string().optional().describe("Filter by country name"),
    }
  );

  lookupTool(
    server,
    env,
    "sl_prospect_countries",
    "Look up countries available in the prospect database.",
    "/search-email-leads/countries"
  );

  lookupTool(
    server,
    env,
    "sl_prospect_companies",
    "Look up companies in the prospect database.",
    "/search-email-leads/company"
  );

  lookupTool(
    server,
    env,
    "sl_prospect_domains",
    "Look up company domains in the prospect database.",
    "/search-email-leads/domain"
  );

  lookupTool(
    server,
    env,
    "sl_prospect_industries",
    "Look up industries in the prospect database. Optionally include sub-industries.",
    "/search-email-leads/industries",
    {
      withSubIndustry: z
        .string()
        .optional()
        .describe("Set to 'true' to include sub-industries in results"),
    }
  );

  lookupTool(
    server,
    env,
    "sl_prospect_sub_industries",
    "Look up sub-industries in the prospect database. Optionally filter by parent industry.",
    "/search-email-leads/sub-industries",
    {
      industry_id: z.string().optional().describe("Parent industry ID to filter by"),
    }
  );

  lookupTool(
    server,
    env,
    "sl_prospect_departments",
    "Look up departments in the prospect database.",
    "/search-email-leads/departments"
  );

  lookupTool(
    server,
    env,
    "sl_prospect_levels",
    "Look up seniority levels in the prospect database.",
    "/search-email-leads/levels"
  );

  lookupTool(
    server,
    env,
    "sl_prospect_job_titles",
    "Look up job titles in the prospect database.",
    "/search-email-leads/job-title"
  );

  lookupTool(
    server,
    env,
    "sl_prospect_head_counts",
    "Look up company head count ranges in the prospect database.",
    "/search-email-leads/head-counts"
  );

  lookupTool(
    server,
    env,
    "sl_prospect_revenue",
    "Look up company revenue ranges in the prospect database.",
    "/search-email-leads/revenue"
  );

  lookupTool(
    server,
    env,
    "sl_prospect_keywords",
    "Look up company keywords in the prospect database.",
    "/search-email-leads/keywords"
  );
}
