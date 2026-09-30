/**
 * @bw/google — Google Indexing API client stub
 *
 * ═══════════════════════════════════════════════════════════════════
 * GOOGLE INDEXING API — TERMS OF SERVICE (READ BEFORE IMPLEMENTING)
 * ═══════════════════════════════════════════════════════════════════
 *
 * 1. OWNER-ONLY URLS
 *    You may ONLY notify Google about URLs that you (or your authorized
 *    client) own. The service account MUST have verified ownership of
 *    the property in Google Search Console for every URL submitted.
 *
 * 2. NO THIRD-PARTY SPAM
 *    Do NOT use this client to mass-submit URLs you do not control,
 *    manipulate rankings for third-party sites, or spam Google's crawl
 *    infrastructure. Violations risk project / account suspension.
 *
 * 3. QUOTA & POLICY
 *    Respect daily quotas and Google's Indexing API ranking / usage
 *    policies. Prefer sitemaps for routine discovery; use Indexing API
 *    for time-sensitive pages (e.g. JobPosting, BroadcastEvent) as
 *    documented by Google.
 *
 * 4. AGENCY DUTY
 *    Agencies must obtain explicit client authorization and retain an
 *    audit trail of which properties were submitted on whose behalf.
 *
 * Docs: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 * ═══════════════════════════════════════════════════════════════════
 */

import { GoogleAuth, JWT } from "google-auth-library";

export const INDEXING_SCOPE =
  process.env.GOOGLE_INDEXING_SCOPE ??
  "https://www.googleapis.com/auth/indexing";

export const INDEXING_ENDPOINT =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";

export type IndexingNotificationType = "URL_UPDATED" | "URL_DELETED";

export interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
  [key: string]: unknown;
}

export interface PublishUrlResult {
  ok: boolean;
  url: string;
  type: IndexingNotificationType;
  /** Raw Google response body (JSON string) when available */
  gscResponse?: string;
  errorMessage?: string;
  /** Stub flag — true until real HTTP is wired */
  stub?: boolean;
}

/**
 * Build a JWT client from a service-account JSON object.
 * Never log private_key. Never invent or hardcode credentials.
 */
export function createJwtClient(
  credentials: ServiceAccountCredentials,
): JWT {
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [INDEXING_SCOPE],
  });
}

/**
 * Create GoogleAuth from an optional credentials path (local/dev only).
 * Prefer uploading SA JSON via the Connect UI in production.
 */
export function createGoogleAuth(keyFile?: string): GoogleAuth {
  return new GoogleAuth({
    keyFile: keyFile || process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
    scopes: [INDEXING_SCOPE],
  });
}

/**
 * Publish a URL notification to the Indexing API.
 *
 * WEEK-1 STUB: does not call Google. Validates inputs and returns a
 * stub response. Wire real `client.request` in a later week after
 * SA connect + ownership checks land.
 *
 * ToS: caller MUST ensure the URL is owner-verified for this SA.
 */
export async function publishUrlNotification(
  credentials: ServiceAccountCredentials | null,
  url: string,
  type: IndexingNotificationType = "URL_UPDATED",
): Promise<PublishUrlResult> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return {
      ok: false,
      url,
      type,
      errorMessage: "Invalid URL — must be absolute http(s)",
    };
  }

  if (!credentials?.client_email || !credentials?.private_key) {
    return {
      ok: false,
      url,
      type,
      stub: true,
      errorMessage:
        "No service-account credentials — connect a Google SA first (stub)",
    };
  }

  // STUB: real implementation would:
  //   const client = createJwtClient(credentials);
  //   const res = await client.request({
  //     url: INDEXING_ENDPOINT,
  //     method: "POST",
  //     data: { url, type },
  //   });
  //
  // ToS reminder: only owner-verified URLs. No third-party spam.

  const stubBody = {
    stub: true,
    message:
      "Indexing API call not executed (week-1 stub). ToS: owner-only URLs.",
    url,
    type,
    clientEmail: credentials.client_email,
  };

  return {
    ok: true,
    url,
    type,
    stub: true,
    gscResponse: JSON.stringify(stubBody),
  };
}

export function parseServiceAccountJson(
  raw: string,
): ServiceAccountCredentials {
  const parsed = JSON.parse(raw) as ServiceAccountCredentials;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "Invalid service-account JSON — need client_email and private_key",
    );
  }
  return parsed;
}
