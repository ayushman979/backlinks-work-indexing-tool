"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default function ConnectSaPage() {
  const [json, setJson] = useState("");
  const [label, setLabel] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/service-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialsJson: json,
          label: label || undefined,
        }),
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
      <h1 className="text-2xl font-bold">Connect Google service account</h1>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        Paste your own service-account JSON from Google Cloud. Do{" "}
        <strong>not</strong> invent credentials. The SA must have Search Console
        ownership for every URL you submit. Owner-only; no third-party spam.
        Private keys are never logged; encryption-at-rest lands in a later week.
      </div>
      <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <label className="block text-sm">
          Label (optional)
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Production SA"
          />
        </label>
        <label className="block text-sm">
          Service account JSON
          <textarea
            required
            rows={12}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{"type":"service_account","client_email":"…","private_key":"…",…}'
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Connecting…" : "Connect (stub)"}
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
