import { DocId, Document, InvertedIndexMap } from "./types";

export class InvertedIndex {
  private index: InvertedIndexMap = {};
  private documents: Map<DocId, Document> = new Map();
  private allowedTerms: Set<string> = new Set();
  private dynamicVocabulary: boolean;

  constructor(allowedTerms: string[], dynamicVocabulary: boolean = false) {
    this.dynamicVocabulary = dynamicVocabulary;
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
      // If dynamic vocabulary is enabled (Vector Model), auto-expand the allowed terms
      if (this.dynamicVocabulary) {
        this.allowedTerms.add(term);
      }

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

  public getAllAllowedTerms(): string[] {
    return Array.from(this.allowedTerms);
  }

  // =========================================================================
  // VECTOR SPACE MODEL EXTENSIONS (Variant 2)
  // =========================================================================

  /**
   * Calculates the Smoothed Inverse Document Frequency (IDF) for a given term.
   * Formula: idf = 1 + log(N / (1 + n_t))
   */
  public getTermIdf(term: string): number {
    const normalized = term.toLowerCase();
    if (!this.allowedTerms.has(normalized)) return 0;

    const totalDocuments = this.documents.size;
    const documentFrequency = this.index[normalized]
      ? this.index[normalized].length
      : 0;

    // Smoothed IDF formula (Variant 2)
    return 1 + Math.log(totalDocuments / (1 + documentFrequency));
  }

  /**
   * Generates the TF-IDF vector for a specific document.
   * Uses Binary Term Frequency (Variant 2): tf = 1 if term is present, else 0.
   */
  public getDocumentVector(docId: DocId): Record<string, number> {
    const vector: Record<string, number> = {};

    this.allowedTerms.forEach((term) => {
      // Binary TF calculation: 1 if document is in the term's postings list, 0 otherwise
      const postings = this.index[term] || [];
      const tf = postings.includes(docId) ? 1 : 0;

      if (tf > 0) {
        const idf = this.getTermIdf(term);
        vector[term] = tf * idf;
      } else {
        vector[term] = 0;
      }
    });

    return vector;
  }
}
