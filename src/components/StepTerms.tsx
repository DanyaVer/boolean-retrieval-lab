"use client";

import { useLab } from "@/context/LabContext";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import FileUpload from "./ui/FileUpload";

const INDEX_TERM_PATTERN = /^[\p{L}\p{M}]+$/u;

export default function StepTerms() {
  const { terms, setTerms, setStep } = useLab();
  const [inputValue, setInputValue] = useState("");
  const [termError, setTermError] = useState<string | null>(null);

  const handleFileUpload = (content: string) => {
    // Split by newlines or commas, then validate terms.
    const parsedTerms = content
      .split(/[\n,]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const validTerms: string[] = [];
    const invalidTerms: string[] = [];

    parsedTerms.forEach((term) => {
      if (!INDEX_TERM_PATTERN.test(term)) {
        invalidTerms.push(term);
        return;
      }
      if (!terms.includes(term) && !validTerms.includes(term)) {
        validTerms.push(term);
      }
    });

    if (validTerms.length > 0) {
      setTerms([...terms, ...validTerms]);
    }

    if (invalidTerms.length > 0) {
      const preview = invalidTerms.slice(0, 3).join(", ");
      const suffix = invalidTerms.length > 3 ? "..." : "";
      setTermError(
        `Some terms were rejected: ${preview}${suffix}. Use letters only (any language).`,
      );
    } else {
      setTermError(null);
    }
  };

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newTerm = inputValue.toLowerCase().trim();
    if (!INDEX_TERM_PATTERN.test(newTerm)) {
      setTermError("Invalid term. Use letters only (any language).");
      return;
    }
    if (!terms.includes(newTerm)) {
      setTerms([...terms, newTerm]);
    }
    setTermError(null);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const removeTerm = (termToRemove: string) => {
    setTerms(terms.filter((t) => t !== termToRemove));
  };

  const handleNext = () => {
    if (terms.length === 0) return alert("Please add at least one term.");
    setStep("DOCUMENTS");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Step 1: Define Index Terms</h2>
      <p className="text-sm text-slate-500 mb-4">
        Enter the vocabulary of terms allowed in the system. Only these words
        will be indexed.
      </p>
      <p className="text-xs text-slate-500 mb-4">
        Terms are converted to lowercase automatically. Allowed characters are
        letters from any language.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. fox, dog, wolf"
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} /> Add Term
        </button>
      </div>
      {termError && <p className="text-sm text-red-600 mb-4">{termError}</p>}

      <div className="mb-6 flex justify-between items-center border-b pb-4 border-slate-100">
        <span className="text-xs text-slate-400">Or import from file:</span>
        <FileUpload
          label="Upload Terms List (.txt)"
          onFileContent={handleFileUpload}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {terms.length === 0 && (
          <span className="text-slate-400 italic">No terms added yet.</span>
        )}
        {terms.map((term) => (
          <div
            key={term}
            className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 border"
          >
            {term}
            <button
              onClick={() => removeTerm(term)}
              className="text-slate-400 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={terms.length === 0}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Next Step <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
