"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { ok, data } = await apiFetch<{
        token?: string;
        error?: string;
        creditsGranted?: number;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, agencyName, name: name || undefined }),
      });
      if (ok && data.token) {
        setToken(data.token);
        setResult(
          `Registered. Credits granted: ${data.creditsGranted ?? "?"}. Redirecting…`,
        );
        router.push("/dashboard");
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResult(
        `Request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Register agency</h1>
      <p className="text-sm text-slate-500">
        Creates Agency + owner User + seeded credits.{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          Already have an account?
        </Link>
      </p>
      <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <label className="block text-sm">
          Agency name
          <input
            required
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Your name (optional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Password (min 8)
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create account"}
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
