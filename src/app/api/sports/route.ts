import { elasticClient, SPORTS_INDEX_NAME } from "@/lib/elasticClient";
import { NextRequest, NextResponse } from "next/server";

export interface SportsTeam {
  name: string;
  sport_type: string;
  founded_date: string;
  trophies_won: number;
  is_active: boolean;
  description?: string;
  history?: string;
  stadium_info?: string;
}

/**
 * GET: Retrieve all sports teams.
 * In a real-world scenario, you would implement pagination. For this lab,
 * we retrieve a generous maximum number of documents using the _search API.
 */
export async function GET() {
  try {
    const response = await elasticClient.search({
      index: SPORTS_INDEX_NAME,
      size: 100, // Fetch up to 100 documents
      query: {
        match_all: {},
      },
    });

    // Map the Elasticsearch hits to a cleaner JSON structure, including the generated _id
    const teams = response.hits.hits.map((hit) => ({
      id: hit._id,
      ...(hit._source as SportsTeam),
    }));

    return NextResponse.json(teams, { status: 200 });
  } catch (error: any) {
    console.error("Elasticsearch GET All Error:", error);
    // Return empty array if index is missing, otherwise 500
    if (error.meta && error.meta.statusCode === 404) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(
      { error: "Failed to fetch documents." },
      { status: 500 },
    );
  }
}

/**
 * POST: Create a new sports team.
 * Uses the POST /<target>/_doc/ API to let Elasticsearch auto-generate the ID.
 */
export async function POST(request: NextRequest) {
  try {
    const body: SportsTeam = await request.json();

    // Basic validation to ensure required fields are present
    if (
      !body.name ||
      !body.sport_type ||
      !body.founded_date ||
      body.trophies_won === undefined ||
      body.is_active === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const response = await elasticClient.index({
      index: SPORTS_INDEX_NAME,
      document: {
        name: body.name,
        sport_type: body.sport_type,
        founded_date: body.founded_date, // Format: YYYY-MM-DD
        trophies_won: Number(body.trophies_won),
        is_active: Boolean(body.is_active),
        description: body.description || "",
        history: body.history || "",
        stadium_info: body.stadium_info || "",
      },
      // Force refresh to make the document immediately available for search
      refresh: true,
    });

    return NextResponse.json(
      { message: "Document created successfully", id: response._id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Elasticsearch POST Error:", error);
    return NextResponse.json(
      { error: "Failed to create document." },
      { status: 500 },
    );
  }
}
