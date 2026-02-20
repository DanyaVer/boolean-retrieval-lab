"use client";

import { InvertedIndex } from "@/lib/InvertedIndex";
import { ChevronDown, ChevronRight, Database } from "lucide-react";
import { useState } from "react";

export default function IndexVisualizer({
  index,
}: {
  index: InvertedIndex | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!index) return null;

  const indexMap = index.getIndexSnapshot();
  const terms = Object.keys(indexMap).sort();

  return (
    <div className="mt-8 border rounded-md overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b"
      >
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <Database size={18} />
          Internal Index Structure (Debug View)
        </div>
        <div className="text-slate-500">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 w-1/3">Index Term</th>
                <th className="px-6 py-3">Postings List (Doc IDs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terms.map((term) => (
                <tr
                  key={term}
                  className="border-b hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-3 font-mono text-blue-600 font-medium">
                    {term}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      {indexMap[term].map((id) => (
                        <span
                          key={id}
                          className="px-2 py-0.5 bg-slate-200 rounded text-slate-700 text-xs font-mono"
                        >
                          Doc #
                          {typeof id === "number" && id > 1000
                            ? "Imported"
                            : id}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {terms.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px- py-8 t6ext-center text-slate-400"
                  >
                    Index is empty. No documents contain the allowed terms.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
