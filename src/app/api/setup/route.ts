import { elasticClient, SPORTS_INDEX_NAME } from "@/lib/elasticClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Extract query parameters to allow safe index recreation during development
    const url = new URL(request.url);
    const forceRecreate = url.searchParams.get("force") === "true";

    // 1. Check if the index already exists
    const indexExists = await elasticClient.indices.exists({
      index: SPORTS_INDEX_NAME,
    });

    if (indexExists) {
      if (forceRecreate) {
        // Drop the existing index to apply new mappings and analyzers
        await elasticClient.indices.delete({ index: SPORTS_INDEX_NAME });
        console.log(`Index '${SPORTS_INDEX_NAME}' deleted for recreation.`);
      } else {
        return NextResponse.json(
          {
            message: `Index '${SPORTS_INDEX_NAME}' already exists. Use ?force=true to drop and recreate.`,
          },
          { status: 200 },
        );
      }
    }

    // 2. Create the index with Advanced Text Analyzers and Explicit Mappings
    await elasticClient.indices.create({
      index: SPORTS_INDEX_NAME,
      body: {
        // --- SETTINGS: Define our custom analysis pipeline ---
        settings: {
          analysis: {
            char_filter: {
              // Custom character filter to normalize common sports abbreviations
              sports_abbreviations: {
                type: "mapping",
                mappings: [
                  "FC => Football Club",
                  "Utd => United",
                  "BBall => Basketball",
                ],
              },
            },
            analyzer: {
              // Custom Analyzer fulfilling Laboratory Requirement #6
              custom_sports_analyzer: {
                type: "custom",
                char_filter: [
                  "html_strip", // Built-in: Removes HTML tags like <b> or <p>
                  "sports_abbreviations", // Custom: Applies our abbreviation mappings
                ],
                tokenizer: "standard", // Built-in: Splits text by word boundaries
                filter: [
                  "lowercase", // Built-in: Normalizes to lowercase
                  "stop", // Built-in: Removes common stop words
                ],
              },
            },
          },
        },
        // --- MAPPINGS: Define the schema of our documents ---
        mappings: {
          properties: {
            // Original Lab 3 Fields (Metadata / Exact Matches)
            name: { type: "keyword" },
            sport_type: { type: "keyword" },
            founded_date: { type: "date" },
            trophies_won: { type: "integer" },
            is_active: { type: "boolean" },

            // New Lab 4 Fields (Full-Text Search)

            // Requirement 4: Field utilizing the standard analyzer
            description: {
              type: "text",
              analyzer: "standard",
            },

            // Requirement 5: Field utilizing a built-in language analyzer (English)
            // This enables stemming and language-specific stop words
            history: {
              type: "text",
              analyzer: "english",
            },

            // Requirement 6: Field utilizing our student-created custom analyzer
            stadium_info: {
              type: "text",
              analyzer: "custom_sports_analyzer",
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: `Index '${SPORTS_INDEX_NAME}' successfully created with advanced text analyzers and mappings.`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error(
      "Elasticsearch Setup Error:",
      error.meta?.body?.error || error,
    );
    return NextResponse.json(
      {
        error: "Failed to initialize Elasticsearch index.",
        details: error.meta?.body?.error,
      },
      { status: 500 },
    );
  }
}
