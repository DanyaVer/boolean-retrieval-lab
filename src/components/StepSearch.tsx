"use client";

import { useLab } from "@/context/LabContext";
import { BooleanEngine } from "@/lib/BooleanEngine";
import { VectorEngine } from "@/lib/VectorEngine";
import { SearchMode, SearchResult } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import IndexVisualizer from "./IndexVisualizer";

const DEFAULT_VARIANT_MODE: SearchMode = "DNF"; // Even variant

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;

  // Create a regex to match any of the terms, case-insensitive
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <p className="text-slate-600 text-sm mt-1">
      {parts.map((part, i) => {
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
  const { index, resetAll, model } = useLab();
  const [query, setQuery] = useState("");
  const stepNumber = model === "BOOLEAN" ? 4 : 3;

  // Boolean State
  const [mode, setMode] = useState<SearchMode>(DEFAULT_VARIANT_MODE);
  const [tryOtherVariant, setTryOtherVariant] = useState(false);

  // Vector State
  const [threshold, setThreshold] = useState<number>(0.0);

  const [queryError, setQueryError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  const handleSearch = () => {
    if (!index) return;

    if (!query.trim()) {
      setQueryError("Query cannot be empty.");
      setResults(null);
      return;
    }

    setQueryError(null);

    if (model === "BOOLEAN") {
      const engine = new BooleanEngine(index);
      const validation = engine.validateQuery(query, mode);
      if (!validation.isValid) {
        setQueryError(validation.error || "Invalid query.");
        setResults(null);
        return;
      }

      const resultIds = engine.search(query, mode);

      // Extract naive terms for highlighting
      const highlightTerms = query
        .replace(/AND|OR|NOT|\(|\)/gi, " ")
        .split(/\s+/)
        .filter((t) => t.length > 0);

      const mappedResults: SearchResult[] = resultIds.map((id) => ({
        docId: id,
        score: 1, // Boolean matches always have a score of 1
        matches: highlightTerms,
      }));

      setResults(mappedResults);
    } else {
      // Vector Space Model Execution
      const engine = new VectorEngine(index);
      const vectorResults = engine.search(query, threshold);
      setResults(vectorResults);
    }
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

  const getDoc = (id: number) => index?.getDocument(id);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Step {stepNumber}: Search Collection
          </h2>
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
                model === "BOOLEAN"
                  ? mode === "DNF"
                    ? "(fox AND dog) OR (wolf)"
                    : "(fox OR dog) AND (wolf)"
                  : "Enter natural language query terms..."
              }
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Conditional Controls based on Model */}
          {model === "BOOLEAN" ? (
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
                    if (!enabled) setMode(DEFAULT_VARIANT_MODE);
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
          ) : (
            <div className="md:min-w-[260px]">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <SlidersHorizontal size={16} /> Similarity Threshold
              </label>
              <div className="flex items-center gap-3 px-4 py-2 border rounded-md bg-slate-50">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-mono font-bold text-slate-700 w-10 text-right">
                  {threshold.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Minimum cosine score (0 to 1) required to return a document.
              </p>
            </div>
          )}

          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 h-10"
          >
            <Search size={18} /> Search
          </button>
        </div>

        {queryError && (
          <p className="text-sm text-red-600 mb-4">{queryError}</p>
        )}

        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {model === "BOOLEAN" ? (
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
          ) : (
            <div>
              <strong>Mode: Vector Space Model (Variant 2)</strong>
              <br />
              Extracts TF-IDF vectors from the query and calculates the cosine
              similarity against all documents.
            </div>
          )}
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
                No documents found matching your criteria.
              </p>
            ) : (
              results.map((result) => {
                const doc = getDoc(result.docId);
                if (!doc) return null;
                return (
                  <div
                    key={result.docId}
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
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-slate-400 font-mono">
                              ID:{" "}
                              {typeof result.docId === "number" &&
                              result.docId > 1000
                                ? "FILE"
                                : result.docId}
                            </span>
                            {model === "VECTOR" && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold border border-blue-200 shadow-sm">
                                Score: {result.score.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                        <HighlightedText
                          text={doc.content}
                          terms={result.matches}
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
