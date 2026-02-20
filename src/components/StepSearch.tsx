"use client";

import { useLab } from "@/context/LabContext";
import { BooleanEngine } from "@/lib/BooleanEngine";
import { DocId, SearchMode } from "@/lib/types";
import { AlertCircle, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import IndexVisualizer from "./IndexVisualizer";

const DEFAULT_VARIANT_MODE: SearchMode = "DNF"; // Even variant

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;

  // Create a regex to match any of the terms, case-insensitive
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");

  // Split the text by the pattern
  const parts = text.split(pattern);

  return (
    <p className="text-slate-600 text-sm mt-1">
      {parts.map((part, i) => {
        // Check if this part matches one of our terms
        const isMatch = terms.some(
          (t) => t.toLowerCase() === part.toLowerCase(),
        );
        return isMatch ? (
          <mark
            key={i}
            className="bg-yellow-200 text-slate-900 rounded-sm px-0.5 font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </p>
  );
}

export default function StepSearch() {
  const { index, resetAll } = useLab();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>(DEFAULT_VARIANT_MODE);
  const [tryOtherVariant, setTryOtherVariant] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [results, setResults] = useState<DocId[] | null>(null);

  const handleSearch = () => {
    if (!index) return;
    const engine = new BooleanEngine(index);
    const validation = engine.validateQuery(query, mode);
    if (!validation.isValid) {
      setQueryError(validation.error || "Invalid query.");
      setResults(null);
      return;
    }
    setQueryError(null);
    const resultIds = engine.search(query, mode);
    setResults(resultIds);
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset everything? All data will be lost.",
      )
    ) {
      resetAll();
    }
  };

  const getDoc = (id: DocId) => index?.getDocument(id);

  // Extract terms from query for highlighting purposes
  // This is a naive extraction for UI only
  const highlightTerms = query
    .replace(/AND|OR|NOT|\(|\)/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Step 3: Boolean Search</h2>
          <button
            onClick={handleReset}
            className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors flex items-center gap-1"
          >
            <RefreshCw size={14} /> Reset System
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4 md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (queryError) setQueryError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={
                mode === "DNF"
                  ? "(fox AND dog) OR (wolf)"
                  : "(fox OR dog) AND (wolf)"
              }
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="md:min-w-[260px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Student Variant
            </label>
            <div className="px-4 py-2 border rounded-md bg-slate-50 text-sm text-slate-700">
              Even (DNF) is your default variant.
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={tryOtherVariant}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setTryOtherVariant(enabled);
                  if (!enabled) {
                    setMode(DEFAULT_VARIANT_MODE);
                  }
                  setQueryError(null);
                }}
              />
              Try other variant (Odd/CNF)
            </label>
            {tryOtherVariant && (
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as SearchMode);
                  setQueryError(null);
                }}
                className="w-full mt-2 px-4 py-2 border rounded-md bg-white cursor-pointer"
              >
                <option value="DNF">Even (DNF)</option>
                <option value="CNF">Odd (CNF)</option>
              </select>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 h-10"
          >
            <Search size={18} /> Search
          </button>
        </div>
        {queryError && <p className="text-sm text-red-600 mb-4">{queryError}</p>}

        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong>
              Mode:{" "}
              {mode === "CNF"
                ? "Conjunctive (AND of ORs)"
                : "Disjunctive (OR of ANDs)"}
            </strong>
            <br />
            Example:{" "}
            {mode === "CNF"
              ? "(term1 OR term2) AND (term3)"
              : "(term1 AND term2) OR (term3)"}
          </div>
        </div>
      </div>
      {results !== null && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">
            Search Results{" "}
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
              {results.length}
            </span>
          </h3>

          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-slate-500 italic">
                No documents found matching your query.
              </p>
            ) : (
              results.map((id) => {
                const doc = getDoc(id);
                if (!doc) return null;
                return (
                  <div
                    key={id}
                    className="p-4 border rounded hover:border-blue-300 transition-colors bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="text-green-500 mt-1 shrink-0"
                        size={20}
                      />
                      <div className="w-full">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800">
                            {doc.name}
                          </h4>
                          <span className="text-xs text-slate-400 font-mono">
                            ID:{" "}
                            {typeof id === "number" && id > 1000 ? "FILE" : id}
                          </span>
                        </div>
                        <HighlightedText
                          text={doc.content}
                          terms={highlightTerms}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Internal Index Visualizer */}
      <IndexVisualizer index={index} />
    </div>
  );
}
