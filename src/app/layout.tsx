import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import { LabProvider } from "@/context/LabContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Information Retrieval Systems",
  description: "University Laboratory Works",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LabProvider>
          {/* Main Content Area - Expands to fill space */}
          <main className="min-h-screen p-8 max-w-5xl mx-auto flex flex-col">
            <header className="mb-8 border-b pb-4 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Information Retrieval
                </h1>
                <p className="text-slate-500">Laboratory Workspace</p>
              </div>
              <nav className="flex gap-4">
                <Link
                  href="/"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
                >
                  Lab 1 & 2 (Boolean/Vector)
                </Link>
                <Link
                  href="/lab3"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
                >
                  Lab 3 (Elasticsearch)
                </Link>
              </nav>
            </header>

            <div className="flex-1">{children}</div>
          </main>

          {/* Signature Footer */}
          <footer className="w-full border-t border-slate-200 bg-white mt-auto">
            <div className="max-w-5xl mx-auto p-8 text-center text-slate-500 text-sm">
              <p className="font-medium text-slate-900 mb-2">
                Laboratory Work #1, #2, #3 • Information Retrieval Systems
              </p>

              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-xs uppercase tracking-wide font-semibold text-slate-600 mb-4 border border-slate-200">
                Developed by:
                <span className="text-blue-600">Danylo Vernik</span>
                <span className="text-slate-300">|</span>
                Group:
                <span className="text-blue-600">KP-22</span>
              </div>

              <p className="text-xs opacity-60">
                © {new Date().getFullYear()} National Technical University of
                Ukraine "Igor Sikorsky Kyiv Polytechnic Institute"
              </p>
            </div>
          </footer>
        </LabProvider>
      </body>
    </html>
  );
}
