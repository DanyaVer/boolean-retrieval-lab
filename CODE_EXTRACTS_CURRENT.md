# Boolean Retrieval Lab - Main Code Extracts (Current Version)

This file contains the key code snippets of the current implementation so you can copy one document into external AI tools.

## 1) Domain Types (`src/lib/types.ts`)

```ts
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
```

## 2) Global App State (`src/context/LabContext.tsx`)

```tsx
type Step = "TERMS" | "DOCUMENTS" | "SEARCH";

const STORAGE_KEY = "lab_boolean_v1_state";

export const LabProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setStep] = useState<Step>("TERMS");
  const [terms, setTerms] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [index, setIndex] = useState<InvertedIndex | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTerms(parsed.terms || []);
        setDocuments(parsed.documents || []);
        setStep(parsed.step || "TERMS");

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

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ terms, documents, step: currentStep }),
    );
  }, [terms, documents, currentStep, isLoaded]);

  const addDocument = (doc: Document) => setDocuments((prev) => [...prev, doc]);

  const buildIndex = () => {
    const newIndex = new InvertedIndex(terms);
    documents.forEach((doc) => newIndex.addDocument(doc));
    setIndex(newIndex);
  };

  const resetAll = () => {
    setTerms([]);
    setDocuments([]);
    setStep("TERMS");
    setIndex(null);
    localStorage.removeItem(STORAGE_KEY);
  };
};
```

## 3) Inverted Index (`src/lib/InvertedIndex.ts`)

```ts
export class InvertedIndex {
  private index: InvertedIndexMap = {};
  private documents: Map<DocId, Document> = new Map();
  private allowedTerms: Set<string> = new Set();

  constructor(allowedTerms: string[]) {
    allowedTerms.forEach((t) => this.allowedTerms.add(t.toLowerCase()));
  }

  public addDocument(doc: Document): void {
    this.documents.set(doc.id, doc);
    const terms = this.tokenize(doc.content);

    terms.forEach((term) => {
      if (this.allowedTerms.has(term)) {
        if (!this.index[term]) this.index[term] = [];
        if (!this.index[term].includes(doc.id)) {
          this.index[term].push(doc.id);
        }
      }
    });
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  public getPostings(term: string): DocId[] {
    return this.index[term.toLowerCase()] || [];
  }

  public getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  public getDocument(id: DocId): Document | undefined {
    return this.documents.get(id);
  }

  public getIndexSnapshot(): InvertedIndexMap {
    return { ...this.index };
  }
}
```

## 4) Boolean Engine + Query Validation (`src/lib/BooleanEngine.ts`)

```ts
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

  private intersect(listA: DocId[], listB: DocId[]): DocId[] {
    const setB = new Set(listB);
    return listA.filter((id) => setB.has(id));
  }

  private union(listA: DocId[], listB: DocId[]): DocId[] {
    return Array.from(new Set([...listA, ...listB]));
  }

  private not(listA: DocId[], allDocs: DocId[]): DocId[] {
    const setA = new Set(listA);
    return allDocs.filter((id) => !setA.has(id));
  }

  public search(query: string, mode: SearchMode): DocId[] {
    const validation = this.validateQuery(query, mode);
    if (!validation.isValid) return [];

    const normalizedQuery = query.trim();
    const topLevelOperator = mode === "DNF" ? " OR " : " AND ";
    const subGroupOperator = mode === "DNF" ? " AND " : " OR ";

    const groups = normalizedQuery.split(
      new RegExp(`\\)\\s*${topLevelOperator.trim()}\\s*\\(`, "i"),
    );

    let finalResult: DocId[] | null = null;

    groups.forEach((rawGroup) => {
      const cleanGroup = rawGroup.replace(/^\(/, "").replace(/\)$/, "");
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

        if (groupResult === null) {
          groupResult = postings;
        } else {
          groupResult =
            mode === "DNF"
              ? this.intersect(groupResult, postings)
              : this.union(groupResult, postings);
        }
      });

      const safeGroupResult = groupResult || [];
      if (finalResult === null) {
        finalResult = safeGroupResult;
      } else {
        finalResult =
          mode === "DNF"
            ? this.union(finalResult, safeGroupResult)
            : this.intersect(finalResult, safeGroupResult);
      }
    });

    return finalResult || [];
  }
}
```

## 5) Terms Step (Unicode term validation) (`src/components/StepTerms.tsx`)

```tsx
const INDEX_TERM_PATTERN = /^[\p{L}\p{M}]+$/u;

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

const handleFileUpload = (content: string) => {
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

  if (validTerms.length > 0) setTerms([...terms, ...validTerms]);
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
```

## 6) Documents Step (normalization disclaimer) (`src/components/StepDocuments.tsx`)

```tsx
<p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
  Note: during indexing, document text is normalized to lowercase and
  punctuation is removed. For strict lab-compliant input, enter lowercase
  terms separated by single spaces without punctuation.
</p>
```

## 7) Search Step (even default + try odd + validation) (`src/components/StepSearch.tsx`)

```tsx
const DEFAULT_VARIANT_MODE: SearchMode = "DNF"; // Even variant

const [mode, setMode] = useState<SearchMode>(DEFAULT_VARIANT_MODE);
const [tryOtherVariant, setTryOtherVariant] = useState(false);
const [queryError, setQueryError] = useState<string | null>(null);

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
```

```tsx
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
  >
    <option value="DNF">Even (DNF)</option>
    <option value="CNF">Odd (CNF)</option>
  </select>
)}
```

## 8) Step Routing (`src/app/page.tsx`)

```tsx
{currentStep === "TERMS" && <StepTerms />}
{currentStep === "DOCUMENTS" && <StepDocuments />}
{currentStep === "SEARCH" && <StepSearch />}
```

## 9) File Upload Utility (`src/components/ui/FileUpload.tsx`)

```tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await file.text();
    onFileContent(text, file.name);
  }

  if (inputRef.current) inputRef.current.value = "";
};
```

## 10) Suggested Prompt Prefix (for external AI)

You can prepend this when sharing:

```text
This is a Next.js + TypeScript Boolean Retrieval lab project.
Use the code snippets below as the current source of truth.
Do not redesign from scratch; extend existing architecture and keep current staged workflow.
```

