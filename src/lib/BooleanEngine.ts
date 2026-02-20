import { InvertedIndex } from "./InvertedIndex";
import { DocId, SearchMode } from "./types";

export class BooleanEngine {
  private index: InvertedIndex;

  constructor(index: InvertedIndex) {
    this.index = index;
  }

  public validateQuery(
    query: string,
    mode: SearchMode,
  ): { isValid: boolean; error?: string } {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return { isValid: false, error: "Query cannot be empty." };
    }

    const topLevelOperator = mode === "DNF" ? "OR" : "AND";
    const subGroupOperator = mode === "DNF" ? "AND" : "OR";

    // Accept Unicode letters in any language; NOT is optional for each term.
    const termExpr = String.raw`(?:NOT\s+)?[\p{L}\p{M}]+`;
    const groupExpr = String.raw`\(\s*${termExpr}(?:\s+${subGroupOperator}\s+${termExpr})*\s*\)`;
    const fullExpr = String.raw`^${groupExpr}(?:\s+${topLevelOperator}\s+${groupExpr})*$`;

    const formatRegex = new RegExp(fullExpr, "iu");
    if (!formatRegex.test(normalizedQuery)) {
      return {
        isValid: false,
        error:
          mode === "DNF"
            ? "Invalid DNF query. Use format: (term1 AND term2) OR (term3)."
            : "Invalid CNF query. Use format: (term1 OR term2) AND (term3).",
      };
    }

    return { isValid: true };
  }

  /**
   * Performs set intersection (AND)
   */
  private intersect(listA: DocId[], listB: DocId[]): DocId[] {
    const setB = new Set(listB);
    return listA.filter((id) => setB.has(id));
  }

  /**
   * Performs set union (OR)
   */
  private union(listA: DocId[], listB: DocId[]): DocId[] {
    return Array.from(new Set([...listA, ...listB]));
  }

  /**
   * Performs set difference (NOT) - strict boolean NOT relative to all docs
   */
  private not(listA: DocId[], allDocs: DocId[]): DocId[] {
    const setA = new Set(listA);
    return allDocs.filter((id) => !setA.has(id));
  }

  /**
   * Main entry point for search.
   * Parses the query based on the selected mode (DNF or CNF).
   */
  public search(query: string, mode: SearchMode): DocId[] {
    const validation = this.validateQuery(query, mode);
    if (!validation.isValid) return [];

    // Simple parser: assumes the user follows the lab strict format.
    // DNF: (A AND B) OR (C)
    // CNF: (A OR B) AND (C)

    // 1. Remove outer parentheses if they exist solely to wrap the whole expression
    // but keep structure for splitting groups.
    const normalizedQuery = query.trim();

    // 2. Split by the Top-Level Operator
    const topLevelOperator = mode === "DNF" ? " OR " : " AND ";
    const subGroupOperator = mode === "DNF" ? " AND " : " OR ";

    // Regex to split by operator but respect parentheses is complex.
    // For this lab, we assume groups are clearly parenthesized or simple.
    // e.g., "(term1 AND term2) OR (term3)"

    // We split by closing parenthesis followed by operator
    // This is a naive implementation fitting for the lab's expected input structure.
    const groups = normalizedQuery.split(
      new RegExp(`\\)\\s*${topLevelOperator.trim()}\\s*\\(`, "i"),
    );

    let finalResult: DocId[] | null = null;

    groups.forEach((rawGroup) => {
      // Clean up parentheses
      const cleanGroup = rawGroup.replace(/^\(/, "").replace(/\)$/, "");

      // Process the sub-group
      const terms = cleanGroup.split(
        new RegExp(`\\s+${subGroupOperator.trim()}\\s+`, "i"),
      );

      let groupResult: DocId[] | null = null;

      terms.forEach((rawTerm) => {
        let term = rawTerm.trim();
        let isNegation = false;

        if (term.toUpperCase().startsWith("NOT ")) {
          isNegation = true;
          term = term.substring(4).trim();
        }

        let postings = this.index.getPostings(term);

        if (isNegation) {
          const allDocIds = this.index.getAllDocuments().map((d) => d.id);
          postings = this.not(postings, allDocIds);
        }

        // Combine within the group
        if (groupResult === null) {
          groupResult = postings;
        } else {
          groupResult =
            mode === "DNF"
              ? this.intersect(groupResult, postings) // DNF inner is AND
              : this.union(groupResult, postings); // CNF inner is OR
        }
      });

      // Combine the group result with the final result
      const safeGroupResult = groupResult || [];

      if (finalResult === null) {
        finalResult = safeGroupResult;
      } else {
        finalResult =
          mode === "DNF"
            ? this.union(finalResult, safeGroupResult) // DNF outer is OR
            : this.intersect(finalResult, safeGroupResult); // CNF outer is AND
      }
    });

    return finalResult || [];
  }
}
