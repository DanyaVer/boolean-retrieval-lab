"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { InvertedIndex } from "@/lib/InvertedIndex";
import { Document, RetrievalModel } from "@/lib/types";

export type Step = "MODEL" | "TERMS" | "DOCUMENTS" | "SEARCH";

interface LabContextType {
  currentStep: Step;
  setStep: (step: Step) => void;

  model: RetrievalModel;
  setModel: (model: RetrievalModel) => void;

  // Data State
  terms: string[];
  setTerms: (terms: string[]) => void;
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;

  // Logic State
  index: InvertedIndex | null;
  buildIndex: () => void;
  resetAll: () => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

const STORAGE_KEY = "lab_boolean_v1_state";

export const LabProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with defaults, hydration happens in useEffect
  const [currentStep, setStep] = useState<Step>("MODEL");
  const [model, setModel] = useState<RetrievalModel>("BOOLEAN");
  const [terms, setTerms] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [index, setIndex] = useState<InvertedIndex | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Storage on Mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setModel(parsed.model || "BOOLEAN");
        setTerms(parsed.terms || []);
        setDocuments(parsed.documents || []);
        setStep(parsed.step || "MODEL");

        // Rebuild index if we were in search mode
        if (parsed.step === "SEARCH" && parsed.terms && parsed.documents) {
          const newIndex = new InvertedIndex(parsed.terms);
          parsed.documents.forEach((d: Document) => newIndex.addDocument(d));
          setIndex(newIndex);
        }
      } catch (e) {
        console.error("Failed to load state", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to Storage on Change
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      model,
      terms,
      documents,
      step: currentStep,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [model, terms, documents, currentStep, isLoaded]);

  const addDocument = (doc: Document) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const buildIndex = () => {
    const isVector = model === "VECTOR";
    // For Vector Model, we start with an empty vocabulary and dynamic expansion = true.
    // For Boolean Model, we strictly use the user-defined terms and dynamic expansion = false.
    const newIndex = new InvertedIndex(isVector ? [] : terms, isVector);

    documents.forEach((doc) => newIndex.addDocument(doc));
    setIndex(newIndex);
  };

  const resetAll = () => {
    setModel("BOOLEAN");
    setTerms([]);
    setDocuments([]);
    setStep("MODEL");
    setIndex(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Prevent flash of empty content
  if (!isLoaded)
    return (
      <div className="p-8 text-center text-slate-400">Loading workspace...</div>
    );

  return (
    <LabContext.Provider
      value={{
        currentStep,
        setStep,
        model,
        setModel,
        terms,
        setTerms,
        documents,
        addDocument,
        setDocuments,
        index,
        buildIndex,
        resetAll,
      }}
    >
      {children}
    </LabContext.Provider>
  );
};

export const useLab = () => {
  const context = useContext(LabContext);
  if (!context) throw new Error("useLab must be used within a LabProvider");
  return context;
};
