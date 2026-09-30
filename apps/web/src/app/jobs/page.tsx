"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default function JobsPage() {
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    try {
      const res = await fetch(`${API}/jobs/${encodeURIComponent(jobId)}`);
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(
        `Request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Job status</h1>
      <p className="text-sm text-slate-500">
        Look up a submit job by ID. List endpoint is stubbed empty until DB is
        wired.
      </p>
      <form onSubmit={lookup} className="flex flex-wrap gap-2">
        <input
          required
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          placeholder="job id"
          className="min-w-[240px] flex-1 rounded border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Lookup
        </button>
        {jobId && (
          <Link
            href={`/jobs/${encodeURIComponent(jobId)}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Open page
          </Link>
        )}
      </form>
      {result && (
        <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {result}
        </pre>
      )}
    </div>
  );
}
