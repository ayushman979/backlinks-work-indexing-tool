"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default function JobDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [result, setResult] = useState<string>("Loading…");

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/jobs/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => setResult(JSON.stringify(data, null, 2)))
      .catch((err) =>
        setResult(
          `Request failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
  }, [id]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Job {id}</h1>
      <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
        {result}
      </pre>
    </div>
  );
}
