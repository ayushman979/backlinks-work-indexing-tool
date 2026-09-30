"use client";

import Link from "next/link";
import { getToken, setToken } from "@/lib/api";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/submit", label: "Submit" },
  { href: "/jobs", label: "Jobs" },
  { href: "/connect", label: "Connect SA" },
];

export function Nav() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  function logout() {
    setToken(null);
    setAuthed(false);
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold text-brand-700">
          Backlinks Work · Indexing
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-slate-600 hover:text-brand-600"
            >
              {l.label}
            </Link>
          ))}
          {authed ? (
            <button
              type="button"
              onClick={logout}
              className="text-slate-600 hover:text-brand-600"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-brand-600">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded bg-brand-600 px-2 py-1 text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
