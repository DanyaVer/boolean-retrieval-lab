# Boolean Retrieval Lab - Architecture Context

This document is a high-level and implementation-level context file for extending this project in future labs without rebuilding from scratch.

## 1) Project Purpose and Scope

- Current lab: Standard Boolean Information Retrieval.
- UI type: Web application (single-page flow).
- Core workflow:
  1. Define index terms.
  2. Add document collection.
  3. Execute Boolean queries and inspect results.

## 2) Technology Stack

- Framework: Next.js `16.1.6` (App Router).
- Language: TypeScript.
- UI library: React `19.2.3`.
- Styling: Tailwind CSS v4 + global CSS.
- Icons: `lucide-react`.
- State management: React Context + local component state.
- Persistence: `localStorage` (client-side only).
- Build scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run start`
  - `npm run lint`

Source: `package.json`.

## 3) Top-Level Architecture

The system is fully client-side. There is no backend/API/database.

- **Presentation layer**
  - Step-based UI components for Terms, Documents, Search.
- **Application state layer**
  - `LabContext` stores step, terms, documents, built index.
- **Domain/logic layer**
  - `InvertedIndex` builds postings lists for allowed terms.
  - `BooleanEngine` validates and evaluates CNF/DNF queries.

## 4) Folder and Module Map

- `src/app/layout.tsx`
  - Root layout, wraps app in `LabProvider`.
- `src/app/page.tsx`
  - Step router + progress indicator (`TERMS`, `DOCUMENTS`, `SEARCH`).
- `src/context/LabContext.tsx`
  - Global app state and orchestration.
- `src/lib/types.ts`
  - Shared domain types (`Document`, `DocId`, `SearchMode`).
- `src/lib/InvertedIndex.ts`
  - Inverted index implementation and tokenization.
- `src/lib/BooleanEngine.ts`
  - Query validation + Boolean execution logic.
- `src/components/StepTerms.tsx`
  - Terms entry, validation, and import.
- `src/components/StepDocuments.tsx`
  - Document entry/upload and transition to indexing.
- `src/components/StepSearch.tsx`
  - Search UI, variant mode, query validation errors, results.
- `src/components/IndexVisualizer.tsx`
  - Debug table view of `term -> postings`.
- `src/components/ui/FileUpload.tsx`
  - Shared file upload component.

## 5) Core Data Model

Defined in `src/lib/types.ts`:

- `DocId = number`
- `Document = { id, content, name }`
- `InvertedIndexMap = Record<string, DocId[]>`
- `SearchMode = "DNF" | "CNF"`

## 6) State Management and Persistence

Managed in `src/context/LabContext.tsx`.

- Context state:
  - `currentStep`
  - `terms`
  - `documents`
  - `index` (instance of `InvertedIndex` or `null`)
- Actions:
  - `setStep`, `setTerms`, `addDocument`, `setDocuments`
  - `buildIndex()` creates new `InvertedIndex(terms)` and adds all docs
  - `resetAll()` clears state + `localStorage`
- Persistence:
  - Stored under key: `lab_boolean_v1_state`
  - Saved fields: `terms`, `documents`, `step`
  - On reload, if saved step is `SEARCH`, index is rebuilt in-memory

## 7) End-to-End Execution Flow

1. **Terms stage (`StepTerms`)**
   - Manual add or file upload.
   - Terms are lowercased.
   - Validation regex: `/^[\p{L}\p{M}]+$/u` (letters from any language).
   - At least one term required before next step.

2. **Documents stage (`StepDocuments`)**
   - Manual text area or multiple file upload.
   - At least one document required.
   - On finish: `buildIndex()` then `setStep("SEARCH")`.
   - UI disclaimer states documents are normalized during indexing.

3. **Search stage (`StepSearch`)**
   - Default student variant is **Even => DNF**.
   - Optional toggle allows trying odd variant (CNF).
   - Query validated with `BooleanEngine.validateQuery`.
   - Valid query executes `BooleanEngine.search`.
   - Matching doc IDs are mapped back to `Document` objects and rendered.
   - `IndexVisualizer` can show internal postings for debugging.

## 8) Retrieval Engine Details

Implemented in `src/lib/InvertedIndex.ts` + `src/lib/BooleanEngine.ts`.

### Inverted Index

- Constructor receives allowed terms and normalizes them to lowercase.
- `addDocument(doc)`:
  - Tokenizes document content.
  - Adds doc ID only for tokens that exist in allowed terms.
  - Prevents duplicate doc IDs inside the same postings list.
- `getPostings(term)` returns postings for normalized term.

### Tokenization

Current tokenizer:

- lowercases text
- removes punctuation with regex
- splits by whitespace

Note: current regex uses `\w`, which is ASCII-centric. This matters if future labs require full Unicode token handling in document content.

### Boolean Engine

- Supports:
  - `AND` (intersection)
  - `OR` (union)
  - `NOT` (relative to all indexed docs)
- Mode-aware structure:
  - **DNF**: OR of AND-groups
  - **CNF**: AND of OR-groups
- Validation:
  - Strict grouped format with parentheses.
  - Terms support Unicode letters.
  - Returns explicit validation error message.

Expected formats:

- DNF: `(term1 AND term2) OR (term3)`
- CNF: `(term1 OR term2) AND (term3)`

## 9) Variant Logic

Implemented in `src/components/StepSearch.tsx`:

- `DEFAULT_VARIANT_MODE = "DNF"` for even variant.
- UI shows even as default.
- Checkbox enables "try other variant (Odd/CNF)" for experimentation.

## 10) Known Constraints and Technical Debt

- No backend/data store; everything is client memory + `localStorage`.
- Parser is format-constrained to grouped CNF/DNF expressions.
- `InvertedIndex.tokenize` is not fully Unicode-aware due `\w` usage.
- `README.md` is still generic Next.js boilerplate (not project-specific).
- Lint has pre-existing non-architecture issues (in `layout.tsx` and `LabContext.tsx`).

## 11) Extension Strategy for Future Labs

Use current modules as stable extension points:

- Extend retrieval logic in `src/lib/BooleanEngine.ts`
  - Add new models (vector space, BM25, fuzzy matching) in new engine classes.
- Keep `InvertedIndex` as base indexing service
  - Add positional index, term frequency, document length metadata.
- Add pluggable query parsers
  - Move CNF/DNF parsing into dedicated parser module(s).
- Introduce backend when needed
  - Keep existing UI, move persistence/indexing to API routes/service.
- Preserve workflow components
  - Reuse `StepTerms`, `StepDocuments`, `StepSearch` as lab-specific shells.

## 12) Quick Onboarding for AI/Contributors

When continuing in this repo:

1. Start from `src/app/page.tsx` to see step orchestration.
2. Review `src/context/LabContext.tsx` for state and lifecycle.
3. Review `src/lib/InvertedIndex.ts` + `src/lib/BooleanEngine.ts` for core logic.
4. Update only the relevant layer (UI, state, engine) instead of rewriting full flow.
5. Keep current staged workflow unless assignment explicitly changes it.

