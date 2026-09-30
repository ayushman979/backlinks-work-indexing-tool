"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ConnectSaPage() {
  const [json, setJson] = useState("");
  const [label, setLabel] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<
    Array<{ id: string; clientEmail: string; isActive: boolean; label?: string | null }>
  >([]);

  async function refresh() {
    const { data } = await apiFetch<{
      accounts?: Array<{
        id: string;
        clientEmail: string;
        isActive: boolean;
        label?: string | null;
      }>;
    }>("/service-account");
    setAccounts(data.accounts ?? []);
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await apiFetch("/service-account", {
        method: "POST",
        body: JSON.stringify({
          credentialsJson: json,
          label: label || undefined,
        }),
      });
      setResult(JSON.stringify(data, null, 2));
      setJson("");
      await refresh();
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
        Credentials are encrypted at rest. Connecting does{" "}
        <strong>not</strong> guarantee indexing.
      </div>
      {accounts.length > 0 && (
        <ul className="rounded-lg border bg-white p-3 text-sm shadow-sm">
          {accounts.map((a) => (
            <li key={a.id} className="font-mono text-xs">
              {a.isActive ? "✅" : "○"} {a.label ? `${a.label} — ` : ""}
              {a.clientEmail}
            </li>
          ))}
        </ul>
      )}
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
          {loading ? "Connecting…" : "Connect & encrypt"}
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
