import { DocId, Document, InvertedIndexMap } from "./types";

export class InvertedIndex {
  private index: InvertedIndexMap = {};
  private documents: Map<DocId, Document> = new Map();
  private allowedTerms: Set<string> = new Set();

  constructor(allowedTerms: string[]) {
    // Normalize allowed terms to lowercase for consistency
    allowedTerms.forEach((t) => this.allowedTerms.add(t.toLowerCase()));
  }

  /**
   * Adds a document to the collection and indexes it.
   */
  public addDocument(doc: Document): void {
    this.documents.set(doc.id, doc);
    const terms = this.tokenize(doc.content);

    terms.forEach((term) => {
      // Only index terms that are in the defined allowed set
      if (this.allowedTerms.has(term)) {
        if (!this.index[term]) {
          this.index[term] = [];
        }
        // Avoid duplicate IDs for the same term in the same doc
        if (!this.index[term].includes(doc.id)) {
          this.index[term].push(doc.id);
        }
      }
    });
  }

  /**
   * Converts raw text into a list of normalized terms.
   * Removes punctuation and converts to lowercase.
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter((t) => t.length > 0);
  }

  public getDocument(id: DocId): Document | undefined {
    return this.documents.get(id);
  }

  public getPostings(term: string): DocId[] {
    const normalized = term.toLowerCase();
    return this.index[normalized] || [];
  }

  /**
   * Returns a snapshot of the internal index for visualization.
   */
  public getIndexSnapshot(): InvertedIndexMap {
    return { ...this.index };
  }

  public getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }
}
