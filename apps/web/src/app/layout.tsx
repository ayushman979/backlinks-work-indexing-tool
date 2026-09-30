import type { Metadata } from "next";
import { TosBanner } from "@/components/TosBanner";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backlinks Work Indexing Tool",
  description:
    "Agency Google Indexing API MVP — credits, bulk submit, queue, status, service-account connect",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TosBanner />
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
