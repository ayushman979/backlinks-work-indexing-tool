import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">
        Verified client-property crawl notify + backlink checks
      </h1>
      <p className="max-w-2xl text-slate-600">
        An agency workflow for bulk crawl notify on verified client properties.
        Send destination-page notifications only where your connected service
        account is a Google Search Console owner, while checking backlink live,
        dofollow, target, and status. We do not index arbitrary backlinks or
        third-party linking URLs.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open dashboard
        </Link>
        <Link
          href="/submit"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Start a workflow
        </Link>
      </div>
      <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Compliance:</strong> Use crawl notify only for destination pages
        on GSC properties where the agency or client is the verified owner. A
        backlink check verifies the link and works with the client destination;
        it does not submit the third-party linking URL to Google. Example offer
        language: “$5 for 100 backlink checks + destination crawl requests” —
        positioning only, not a live price.
      </aside>
    </div>
  );
}
