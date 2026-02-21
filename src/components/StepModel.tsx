"use client";

import { useLab } from "@/context/LabContext";
import { ArrowRight, Binary, Calculator } from "lucide-react";

export default function StepModel() {
  const { model, setModel, setStep } = useLab();

  const handleNext = () => {
    if (model === "VECTOR") {
      setStep("DOCUMENTS");
    } else {
      setStep("TERMS");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">
        Step 1: Select Retrieval Model
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Choose the underlying mathematical model that the system will use to
        index documents and process search queries.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Boolean Model Selection Card */}
        <div
          onClick={() => setModel("BOOLEAN")}
          className={`cursor-pointer border-2 rounded-lg p-5 transition-all duration-200 ${
            model === "BOOLEAN"
              ? "border-blue-600 bg-blue-50/50 shadow-md"
              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md ${
                  model === "BOOLEAN"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Binary size={24} />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">
                Boolean Model
              </h3>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                model === "BOOLEAN" ? "border-blue-600" : "border-slate-300"
              }`}
            >
              {model === "BOOLEAN" && (
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Standard Exact-Match Boolean Retrieval. Supports rigorous AND/OR/NOT
            logic via strict DNF/CNF queries. Documents either match entirely or
            not at all.
          </p>
        </div>

        {/* Vector Space Model Selection Card */}
        <div
          onClick={() => setModel("VECTOR")}
          className={`cursor-pointer border-2 rounded-lg p-5 transition-all duration-200 ${
            model === "VECTOR"
              ? "border-blue-600 bg-blue-50/50 shadow-md"
              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md ${
                  model === "VECTOR"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Calculator size={24} />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">
                Vector Space Model
              </h3>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                model === "VECTOR" ? "border-blue-600" : "border-slate-300"
              }`}
            >
              {model === "VECTOR" && (
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Algebraic Model (Variant 2). Represents documents and queries as
            vectors using Binary TF and Smoothed IDF. Ranks results continuously
            using Cosine Similarity.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          Next Step <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
