import { NextRequest, NextResponse } from "next/server";

import { elasticClient, SPORTS_INDEX_NAME } from "@/lib/elasticClient";
import { SportsTeam } from "../route";

// Define the expected structure of the incoming search parameters
export interface SearchSportsParams {
  namePattern?: string; // Uses wildcard (e.g., "Man*")
  sportType?: string; // Uses exact term match
  foundedAfter?: string; // Uses range (gte)
  foundedBefore?: string; // Uses range (lte)
  minTrophies?: number; // Uses range (gte)
  maxTrophies?: number; // Uses range (lte)
  isActive?: boolean; // Uses exact term match
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchSportsParams = await request.json();

    // Initialize the components of our compound bool query
    const mustClauses: any[] = [];
    const filterClauses: any[] = [];

    // ----------------------------------------------------------------------
    // 1. Wildcard Query (Variant Requirement)
    // ----------------------------------------------------------------------
    // The wildcard query finds documents where the specified field matches
    // the wildcard pattern. We use case_insensitive to improve UX.
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

    // ----------------------------------------------------------------------
    // 2. Term Query (Exact Match)
    // ----------------------------------------------------------------------
    // The term query looks for an exact string match in the keyword field.
    if (body.sportType && body.sportType.trim() !== "") {
      filterClauses.push({
        term: {
          sport_type: {
            value: body.sportType,
          },
        },
      });
    }

    if (body.isActive !== undefined) {
      filterClauses.push({
        term: {
          is_active: {
            value: body.isActive,
          },
        },
      });
    }

    // ----------------------------------------------------------------------
    // 3. Range Query (Numeric)
    // ----------------------------------------------------------------------
    // The range query finds documents containing values within the boundaries.
    if (body.minTrophies !== undefined || body.maxTrophies !== undefined) {
      const trophiesRange: any = {};
      if (body.minTrophies !== undefined) trophiesRange.gte = body.minTrophies;
      if (body.maxTrophies !== undefined) trophiesRange.lte = body.maxTrophies;

      filterClauses.push({
        range: {
          trophies_won: trophiesRange,
        },
      });
    }

    // ----------------------------------------------------------------------
    // 4. Range Query (Dates)
    // ----------------------------------------------------------------------
    // Elasticsearch range queries natively support date fields.
    if (body.foundedAfter !== undefined || body.foundedBefore !== undefined) {
      const dateRange: any = {};
      if (body.foundedAfter) dateRange.gte = body.foundedAfter;
      if (body.foundedBefore) dateRange.lte = body.foundedBefore;

      filterClauses.push({
        range: {
          founded_date: dateRange,
        },
      });
    }

    // ----------------------------------------------------------------------
    // Assembly & Execution
    // ----------------------------------------------------------------------
    // Assemble the final query. If no filters are provided, fallback to match_all.
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
      size: 100, // Reasonable limit for the laboratory UI
      query: query,
    });

    // Map the response hits mapping the internal _id to the client-facing id
    const results = response.hits.hits.map((hit) => ({
      id: hit._id,
      ...(hit._source as SportsTeam),
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
