import { elasticClient, SPORTS_INDEX_NAME } from "@/lib/elasticClient";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 1. Check if the index already exists
    const indexExists = await elasticClient.indices.exists({
      index: SPORTS_INDEX_NAME,
    });

    if (indexExists) {
      return NextResponse.json(
        { message: `Index '${SPORTS_INDEX_NAME}' already exists.` },
        { status: 200 },
      );
    }

    // 2. Create the index with explicit mapping
    // We strictly use 'keyword', 'date', 'integer', and 'boolean' types.
    // The 'text' type is forbidden by the lab requirements.
    await elasticClient.indices.create({
      index: SPORTS_INDEX_NAME,
      mappings: {
        properties: {
          name: { type: "keyword" }, // Supports exact match and wildcard
          sport_type: { type: "keyword" }, // Supports exact term filtering
          founded_date: { type: "date" }, // Supports range queries
          trophies_won: { type: "integer" }, // Supports numeric range queries
          is_active: { type: "boolean" }, // Supports exact boolean queries
        },
      },
    });

    return NextResponse.json(
      {
        message: `Index '${SPORTS_INDEX_NAME}' created successfully with explicit mapping.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Elasticsearch Setup Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize Elasticsearch index." },
      { status: 500 },
    );
  }
}
