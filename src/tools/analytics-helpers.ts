import { z } from "zod";

/** Returns today's date as YYYY-MM-DD in UTC. */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns date 30 days ago as YYYY-MM-DD in UTC. */
function thirtyDaysAgoUTC(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

/** Common query params shared by most global analytics endpoints.
 *  start_date and end_date are optional for callers but always sent to
 *  the SmartLead API (defaults: last 30 days). */
export const analyticsQuerySchema = {
  start_date: z
    .string()
    .optional()
    .describe("Filter start date (YYYY-MM-DD). Defaults to 30 days ago."),
  end_date: z
    .string()
    .optional()
    .describe("Filter end date (YYYY-MM-DD). Defaults to today."),
  timezone: z.string().optional().describe("IANA timezone (e.g. America/New_York)"),
  client_ids: z.string().optional().describe("Comma-separated client IDs to filter"),
  campaign_ids: z.string().optional().describe("Comma-separated campaign IDs to filter"),
};

export function buildAnalyticsQuery(params: {
  start_date?: string;
  end_date?: string;
  timezone?: string;
  client_ids?: string;
  campaign_ids?: string;
}): Record<string, string> {
  const query: Record<string, string> = {
    start_date: params.start_date ?? thirtyDaysAgoUTC(),
    end_date: params.end_date ?? todayUTC(),
  };
  if (params.timezone) query.timezone = params.timezone;
  return query;
}

/** Builds query with timezone always included (required by some endpoints). */
export function buildAnalyticsQueryWithTimezone(params: {
  start_date?: string;
  end_date?: string;
  timezone?: string;
  client_ids?: string;
  campaign_ids?: string;
}): Record<string, string> {
  const query = buildAnalyticsQuery(params);
  if (!query.timezone) query.timezone = "America/New_York";
  if (params.client_ids) query.client_ids = params.client_ids;
  if (params.campaign_ids) query.campaign_ids = params.campaign_ids;
  return query;
}
