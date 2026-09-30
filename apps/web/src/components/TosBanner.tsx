/**
 * Persistent Google Indexing API / crawl-notify compliance banner.
 * Must remain visible across dashboard pages.
 * NEVER claim guaranteed indexing.
 */
export function TosBanner() {
  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-semibold">Verified-property workflow — Terms warning</p>
      <p className="mt-1 leading-relaxed">
        Use this tool only for URLs on Google Search Console properties where
        the connected service account is an owner (including an authorized
        client property). The Indexing API / crawl notify applies to destination
        pages on those verified properties, <strong>not third-party linking
        URLs</strong>. Backlink workflows check live, dofollow, target, and
        status, then work with the client destination. No spam, quota farms, or
        ranking manipulation. A successful notification does{" "}
        <strong>not guarantee</strong> crawling or indexing. See the project
        README for full compliance notes.
      </p>
    </div>
  );
}
