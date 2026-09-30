"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default function SubmitPage() {
  const [raw, setRaw] = useState("");
  const [type, setType] = useState<"url" | "backlink">("url");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const urls = raw
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    const items = urls.map((url) => ({ url, type }));
    try {
      const res = await fetch(`${API}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(
        `Request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Bulk submit</h1>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        Only submit <strong>owner-verified</strong> URLs / backlinks. No
        third-party spam. Each item costs credits (see env defaults).
      </div>
      <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <label className="block text-sm">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "url" | "backlink")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="url">URL</option>
            <option value="backlink">Backlink</option>
          </select>
        </label>
        <label className="block text-sm">
          URLs (one per line or comma-separated)
          <textarea
            required
            rows={8}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"https://example.com/page-1\nhttps://example.com/page-2"}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit (stub)"}
        </button>
      </form>
      {result && (
        <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {result}
        </pre>
      )}
    </div>
  );
}
