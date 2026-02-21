import { InvertedIndex } from "./InvertedIndex";
import { SearchResult } from "./types";

export class VectorEngine {
  private index: InvertedIndex;

  constructor(index: InvertedIndex) {
    this.index = index;
  }

  /**
   * Tokenizes the query into normalized terms.
   * Mirrors the document tokenization process.
   *
   * @param query The raw user search query.
   * @returns Array of lowercase terms without punctuation.
   */
  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  /**
   * Generates the TF-IDF vector for a search query.
   * Applies Variant 2 rules: Binary Term Frequency and Smoothed IDF.
   *
   * @param query The raw search string.
   * @returns A map representing the query's vector { term: weight }.
   */
  public getQueryVector(query: string): Record<string, number> {
    const rawTerms = this.tokenize(query);
    const vector: Record<string, number> = {};
    const allowedTerms = this.index.getAllAllowedTerms();

    allowedTerms.forEach((term) => {
      // Binary TF: 1 if term is present in the query, else 0.
      const tf = rawTerms.includes(term) ? 1 : 0;

      if (tf > 0) {
        // IDF is pre-calculated by the InvertedIndex using the smoothed formula.
        const idf = this.index.getTermIdf(term);
        vector[term] = tf * idf;
      } else {
        vector[term] = 0;
      }
    });

    return vector;
  }

  /**
   * Calculates the Cosine Similarity between two TF-IDF vectors.
   * Formula: cos(θ) = (A · B) / (||A|| * ||B||)
   *
   * @param vecA The first vector (e.g., query vector).
   * @param vecB The second vector (e.g., document vector).
   * @returns A float between 0.0 and 1.0 representing similarity.
   */
  private calculateCosineSimilarity(
    vecA: Record<string, number>,
    vecB: Record<string, number>,
  ): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    // The dimensions of both vectors are identical (the allowed vocabulary terms)
    for (const term in vecA) {
      const valA = vecA[term] || 0;
      const valB = vecB[term] || 0;

      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) {
      return 0; // Avoid division by zero if either vector is completely empty (all 0s)
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Executes a Vector Space Model search.
   * Vectorizes the query, compares it against all indexed documents,
   * and returns a ranked list of results passing the similarity threshold.
   *
   * @param query The raw search string.
   * @param threshold The minimum cosine similarity score required (0.0 to 1.0). Default is 0.0.
   * @returns Sorted array of SearchResult objects.
   */
  public search(query: string, threshold: number = 0.0): SearchResult[] {
    const queryVector = this.getQueryVector(query);
    const allDocs = this.index.getAllDocuments();
    const results: SearchResult[] = [];

    // Identify terms that actually have a positive weight in the query
    // This is useful for returning matched terms to the UI for highlighting
    const activeQueryTerms = Object.keys(queryVector).filter(
      (term) => queryVector[term] > 0,
    );

    // If query contains no valid vocabulary terms, short-circuit and return empty results
    if (activeQueryTerms.length === 0) {
      return [];
    }

    // Compare the query vector against every document in the collection
    allDocs.forEach((doc) => {
      const docVector = this.index.getDocumentVector(doc.id);
      const score = this.calculateCosineSimilarity(queryVector, docVector);

      // We strictly require the score to be strictly greater than 0,
      // and greater than or equal to the user-defined threshold
      if (score > 0 && score >= threshold) {
        // Determine which specific terms caused the document to match
        const matches = activeQueryTerms.filter((term) => docVector[term] > 0);

        results.push({
          docId: doc.id,
          score,
          matches,
        });
      }
    });

    // Rank (sort) documents in descending order by their Cosine Similarity score
    return results.sort((a, b) => b.score - a.score);
  }
}
