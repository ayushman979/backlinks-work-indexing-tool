import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">
        Backlinks Work Indexing Tool
      </h1>
      <p className="max-w-2xl text-slate-600">
        Agency-facing Google Indexing API MVP. Manage credits, bulk-submit
        owner-verified URLs and backlinks, track job status, and connect a
        Google service account.
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
          Submit URLs
        </Link>
      </div>
      <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Compliance:</strong> Indexing API is for properties you own.
        Do not use this tool for third-party spam. Harden toward Index Hub
        before production traffic.
      </aside>
    </div>
  );
}
