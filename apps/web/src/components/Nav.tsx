import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/submit", label: "Submit" },
  { href: "/jobs", label: "Jobs" },
  { href: "/connect", label: "Connect SA" },
  { href: "/login", label: "Login" },
];

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold text-brand-700">
          Backlinks Work · Indexing
        </Link>
        <nav className="flex flex-wrap gap-3 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-slate-600 hover:text-brand-600"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
