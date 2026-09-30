"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "@/lib/api";

type JobRow = {
  id: string;
  status: string;
  itemCount: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState("");

  async function load() {
    if (!getToken()) {
      setError("Not signed in.");
      return;
    }
    const { ok, data } = await apiFetch<{ jobs?: JobRow[]; error?: string }>("/jobs");
    if (!ok) {
      setError(data.error ?? "Failed to load jobs");
      return;
    }
    setJobs(data.jobs ?? []);
    setError(null);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : String(err)),
    );
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <button
          type="button"
          onClick={() => load()}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>
      <p className="text-sm text-slate-500">
        Statuses: queued | submitted | error (per item). Job-level: queued |
        processing | completed | failed. Notification ≠ indexing guarantee.
      </p>
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Job</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">OK / Err</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-slate-400">
                  No jobs yet.
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link
                      href={`/jobs/${j.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {j.id.slice(0, 12)}…
                    </Link>
                  </td>
                  <td className="px-3 py-2">{j.status}</td>
                  <td className="px-3 py-2">{j.itemCount}</td>
                  <td className="px-3 py-2">
                    {j.successCount} / {j.errorCount}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {new Date(j.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (jobId) window.location.href = `/jobs/${encodeURIComponent(jobId)}`;
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          placeholder="or paste job id"
          className="min-w-[240px] flex-1 rounded border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open
        </button>
      </form>
    </div>
  );
}
