export type DocId = number;

export interface Document {
  id: DocId;
  content: string;
  name: string; // File name or "Document 1"
}

// The core structure: Term -> List of Document IDs
export interface InvertedIndexMap {
  [term: string]: DocId[];
}

export type SearchMode = "DNF" | "CNF"; // Disjunctive vs Conjunctive Normal Form

export interface SearchResult {
  docId: DocId;
  score: number; // For boolean, usually 1 or 0, but good for extensibility
  matches: string[];
}
