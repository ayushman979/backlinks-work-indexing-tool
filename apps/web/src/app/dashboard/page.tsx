"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "@/lib/api";

export default function DashboardPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [jobsOpen, setJobsOpen] = useState<number | null>(null);
  const [saLabel, setSaLabel] = useState<string>("—");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      setError("Not signed in — register or login first.");
      return;
    }
    (async () => {
      const [c, j, sa] = await Promise.all([
        apiFetch<{ balance?: number; error?: string }>("/credits"),
        apiFetch<{ jobs?: Array<{ status: string }> }>("/jobs"),
        apiFetch<{ accounts?: Array<{ clientEmail: string; isActive: boolean; label?: string | null }> }>(
          "/service-account",
        ),
      ]);
      if (!c.ok) {
        setError(c.data.error ?? `Credits error (${c.status})`);
        return;
      }
      setCredits(c.data.balance ?? 0);
      const jobs = j.data.jobs ?? [];
      setJobsOpen(
        jobs.filter((x) => x.status === "queued" || x.status === "processing")
          .length,
      );
      const active = (sa.data.accounts ?? []).find((a) => a.isActive);
      setSaLabel(active ? active.label || active.clientEmail : "Not connected");
    })().catch((err) =>
      setError(err instanceof Error ? err.message : String(err)),
    );
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-slate-600">
        Credits, open jobs, and service-account status from the live API.
        Submitting notifies Google — it does <strong>not</strong> guarantee
        indexing.
      </p>
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}{" "}
          <Link href="/login" className="underline">
            Login
          </Link>{" "}
          /{" "}
          <Link href="/register" className="underline">
            Register
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Credits</p>
          <p className="mt-2 text-2xl font-semibold">
            {credits === null ? "…" : credits}
          </p>
          <p className="text-xs text-slate-400">GET /credits</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Open jobs</p>
          <p className="mt-2 text-2xl font-semibold">
            {jobsOpen === null ? "…" : jobsOpen}
          </p>
          <p className="text-xs text-slate-400">GET /jobs</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Service account</p>
          <p className="mt-2 truncate text-lg font-semibold" title={saLabel}>
            {saLabel}
          </p>
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
