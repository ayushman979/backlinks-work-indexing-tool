"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Item = {
  id: string;
  url: string;
  type: string;
  status: string;
  errorMessage?: string | null;
};

type JobDetail = {
  id: string;
  status: string;
  itemCount: number;
  successCount: number;
  errorCount: number;
  items: Item[];
  note?: string;
  error?: string;
};

export default function JobDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [job, setJob] = useState<JobDetail | null>(null);
  const [raw, setRaw] = useState<string>("Loading…");

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await apiFetch<JobDetail>(`/jobs/${encodeURIComponent(id)}`);
    setJob(data.error ? null : data);
    setRaw(JSON.stringify(data, null, 2));
  }, [id]);

  useEffect(() => {
    load().catch((err) =>
      setRaw(`Request failed: ${err instanceof Error ? err.message : String(err)}`),
    );
    const t = setInterval(() => {
      load().catch(() => undefined);
    }, 4000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job {id.slice(0, 16)}…</h1>
        <button
          type="button"
          onClick={() => load()}
          className="rounded border px-3 py-1 text-sm"
        >
          Refresh
        </button>
      </div>
      {job && (
        <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
          <p>
            Status: <strong>{job.status}</strong> · items {job.itemCount} · ok{" "}
            {job.successCount} · err {job.errorCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {job.note ??
              "API acceptance does not guarantee Google will crawl or index the URL."}
          </p>
          <ul className="mt-3 max-h-80 space-y-2 overflow-auto">
            {job.items?.map((it) => (
              <li key={it.id} className="rounded border px-2 py-1 font-mono text-xs">
                <span
                  className={
                    it.status === "submitted"
                      ? "text-green-700"
                      : it.status === "error"
                        ? "text-red-700"
                        : "text-amber-700"
                  }
                >
                  [{it.status}]
                </span>{" "}
                {it.url}
                {it.errorMessage ? ` — ${it.errorMessage}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
        {raw}
      </pre>
    </div>
  );
}
