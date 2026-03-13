import { z } from "zod";

/** Common query params shared by most global analytics endpoints. */
export const analyticsQuerySchema = {
  start_date: z.string().optional().describe("Filter start date (YYYY-MM-DD)"),
  end_date: z.string().optional().describe("Filter end date (YYYY-MM-DD)"),
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
  const query: Record<string, string> = {};
  if (params.start_date) query.start_date = params.start_date;
  if (params.end_date) query.end_date = params.end_date;
  if (params.timezone) query.timezone = params.timezone;
  if (params.client_ids) query.client_ids = params.client_ids;
  if (params.campaign_ids) query.campaign_ids = params.campaign_ids;
  return query;
}
