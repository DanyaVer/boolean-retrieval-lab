import { elasticClient, SPORTS_INDEX_NAME } from "@/lib/elasticClient";
import { NextRequest, NextResponse } from "next/server";
import { SportsTeam } from "../route";

// Define the expected structure of the incoming search parameters
export interface SearchSportsParams {
  // Metadata & Term-level parameters (Lab 3)
  namePattern?: string;
  sportType?: string;
  foundedAfter?: string;
  foundedBefore?: string;
  minTrophies?: number | "";
  maxTrophies?: number | "";
  isActive?: boolean | "";

  // Full-Text Search parameters (Lab 4)
  descriptionMatch?: string; // Uses 'match' on description
  historyMatch?: string; // Uses 'match' on history
  stadiumMatch?: string; // Uses 'match' on stadium_info
  historyPhrase?: string; // Uses 'match_phrase' on history
  globalTextSearch?: string; // Uses 'multi_match' across all three text fields
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchSportsParams = await request.json();

    // Initialize the components of our compound bool query
    const mustClauses: any[] = [];
    const filterClauses: any[] = [];

    // ======================================================================
    // PART 1: TERM-LEVEL QUERIES (Lab 3)
    // ======================================================================

    // 1. Wildcard Query
    if (body.namePattern && body.namePattern.trim() !== "") {
      mustClauses.push({
        wildcard: {
          name: {
            value: body.namePattern,
            case_insensitive: true,
          },
        },
      });
    }

    // 2. Term Queries (Exact Match)
    if (body.sportType && body.sportType.trim() !== "") {
      filterClauses.push({ term: { sport_type: { value: body.sportType } } });
    }

    if (body.isActive !== undefined && body.isActive !== "") {
      filterClauses.push({ term: { is_active: { value: body.isActive } } });
    }

    // 3. Range Queries
    if (
      (body.minTrophies !== undefined && body.minTrophies !== "") ||
      (body.maxTrophies !== undefined && body.maxTrophies !== "")
    ) {
      const trophiesRange: any = {};
      if (body.minTrophies !== undefined && body.minTrophies !== "")
        trophiesRange.gte = body.minTrophies;
      if (body.maxTrophies !== undefined && body.maxTrophies !== "")
        trophiesRange.lte = body.maxTrophies;
      filterClauses.push({ range: { trophies_won: trophiesRange } });
    }

    if (body.foundedAfter || body.foundedBefore) {
      const dateRange: any = {};
      if (body.foundedAfter) dateRange.gte = body.foundedAfter;
      if (body.foundedBefore) dateRange.lte = body.foundedBefore;
      filterClauses.push({ range: { founded_date: dateRange } });
    }

    // ======================================================================
    // PART 2: FULL-TEXT SEARCH QUERIES (Lab 4)
    // ======================================================================

    // 4. Match Queries (Analyzed full-text search)
    if (body.descriptionMatch && body.descriptionMatch.trim() !== "") {
      mustClauses.push({
        match: { description: body.descriptionMatch },
      });
    }

    if (body.historyMatch && body.historyMatch.trim() !== "") {
      mustClauses.push({
        match: { history: body.historyMatch },
      });
    }

    if (body.stadiumMatch && body.stadiumMatch.trim() !== "") {
      mustClauses.push({
        match: { stadium_info: body.stadiumMatch },
      });
    }

    // 5. Match Phrase Query (Exact sequence of words)
    if (body.historyPhrase && body.historyPhrase.trim() !== "") {
      mustClauses.push({
        match_phrase: {
          history: {
            query: body.historyPhrase,
            slop: 0, // 0 means exact phrase. Increase slop to allow words in between.
          },
        },
      });
    }

    // 6. Multi-Match Query (Global search across multiple fields)
    if (body.globalTextSearch && body.globalTextSearch.trim() !== "")
      mustClauses.push({
        multi_match: {
          query: body.globalTextSearch,
          fields: ["description", "history", "stadium_info"],
          type: "best_fields",
        },
      });

    // ======================================================================
    // PART 3: ASSEMBLY & EXECUTION
    // ======================================================================

    const hasConditions = mustClauses.length > 0 || filterClauses.length > 0;

    const query = hasConditions
      ? {
          bool: {
            ...(mustClauses.length > 0 && { must: mustClauses }),
            ...(filterClauses.length > 0 && { filter: filterClauses }),
          },
        }
      : { match_all: {} };

    // Execute the search request against Elasticsearch
    const response = await elasticClient.search({
      index: SPORTS_INDEX_NAME,
      size: 100,
      query: query,

      // Highlight feature: Extracts the matched fragments from the text fields
      highlight: {
        pre_tags: [
          "<mark class='bg-yellow-200 text-yellow-900 rounded-sm px-1'>",
        ],
        post_tags: ["</mark>"],
        fields: {
          description: {},
          history: {},
          stadium_info: {},
        },
      },
    });

    // Map the response hits, including the calculated relevance score and highlights
    const results = response.hits.hits.map((hit) => ({
      id: hit._id,
      ...(hit._source as SportsTeam),
      score: hit._score, // Include relevance score
      highlights: hit.highlight || {}, // Include highlighted text fragments
    }));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Elasticsearch Search API Error:", error);
    return NextResponse.json(
      { error: "Failed to execute search query against Elasticsearch." },
      { status: 500 },
    );
  }
}
