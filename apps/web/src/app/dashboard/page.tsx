import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-slate-600">
        Week-1 shell. Credits, recent jobs, and SA status will load from the API
        once stubs are wired to Postgres.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Credits</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
          <p className="text-xs text-slate-400">Stub · GET /credits</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Open jobs</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
          <p className="text-xs text-slate-400">Stub · GET /jobs</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Service account</p>
          <p className="mt-2 text-2xl font-semibold">Not connected</p>
          <Link href="/connect" className="text-xs text-brand-600 hover:underline">
            Connect SA →
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New submit
        </Link>
        <Link
          href="/jobs"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          View jobs
        </Link>
      </div>
    </div>
  );
}
