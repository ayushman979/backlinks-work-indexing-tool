/**
 * @bw/google — Google Indexing API client
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
 * 5. NO GUARANTEE
 *    A successful API response means Google accepted the notification —
 *    it does NOT guarantee crawling or indexing.
 *
 * Docs: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 * ═══════════════════════════════════════════════════════════════════
 */

import { GoogleAuth, JWT } from "google-auth-library";

export { encryptCredentials, decryptCredentials } from "./crypto.js";

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
  /** true when live HTTP was not used (missing creds or forced stub) */
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
 * When credentials are present: live HTTP call to Indexing API.
 * When missing: stub fallback (ok=false) so local/dev still runs.
 *
 * ToS: caller MUST ensure the URL is owner-verified for this SA.
 * Success ≠ guaranteed indexing.
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
    // Stub fallback when no credentials
    return {
      ok: false,
      url,
      type,
      stub: true,
      errorMessage:
        "No service-account credentials — connect a Google SA first (stub fallback)",
    };
  }

  // Force stub mode for tests / CI without hitting Google
  if (process.env.GOOGLE_INDEXING_STUB === "1") {
    const stubBody = {
      stub: true,
      message:
        "Indexing API call skipped (GOOGLE_INDEXING_STUB=1). ToS: owner-only URLs. No indexing guarantee.",
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

  try {
    const client = createJwtClient(credentials);
    const res = await client.request<{
      urlNotificationMetadata?: unknown;
      error?: { message?: string; code?: number };
    }>({
      url: INDEXING_ENDPOINT,
      method: "POST",
      data: { url, type },
    });

    return {
      ok: true,
      url,
      type,
      stub: false,
      gscResponse: JSON.stringify(res.data ?? {}),
    };
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
    let gscResponse: string | undefined;
    if (err && typeof err === "object" && "response" in err) {
      const resp = (err as { response?: { data?: unknown } }).response;
      if (resp?.data !== undefined) {
        gscResponse = JSON.stringify(resp.data);
      }
    }
    return {
      ok: false,
      url,
      type,
      stub: false,
      errorMessage: message,
      gscResponse,
    };
  }
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
