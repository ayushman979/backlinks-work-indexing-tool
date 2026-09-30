/**
 * Persistent Google Indexing API ToS warning banner.
 * Must remain visible across dashboard pages.
 */
export function TosBanner() {
  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-semibold">Google Indexing API — Terms warning</p>
      <p className="mt-1 leading-relaxed">
        Submit <strong>only URLs you own</strong> (or that your client owns and
        has authorized). The connected service account must have verified
        ownership in Google Search Console.{" "}
        <strong>No third-party spam</strong>, ranking manipulation, or mass
        submission of sites you do not control. Abuse can suspend your Google
        Cloud project. See the project README for full compliance notes.
      </p>
    </div>
  );
}
