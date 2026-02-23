import { elasticClient, SPORTS_INDEX_NAME } from "@/lib/elasticClient";
import { NextRequest, NextResponse } from "next/server";
import { SportsTeam } from "../route";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET: Retrieve a single sports team by its Elasticsearch _id.
 */
export async function GET(request: NextRequest, props: RouteContext) {
  const { id } = await props.params;

  try {
    const response = await elasticClient.get({
      index: SPORTS_INDEX_NAME,
      id: id,
    });

    if (!response.found) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        id: response._id,
        ...(typeof response._source === "object" && response._source !== null
          ? response._source
          : {}),
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.meta && error.meta.statusCode === 404) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    }
    console.error(`Elasticsearch GET [${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch document." },
      { status: 500 },
    );
  }
}

/**
 * PUT: Update an existing sports team (Optional Task).
 * We use the update API which applies a partial update to the document.
 */
export async function PUT(request: NextRequest, props: RouteContext) {
  const { id } = await props.params;

  try {
    const body: Partial<SportsTeam> = await request.json();

    await elasticClient.update({
      index: SPORTS_INDEX_NAME,
      id: id,
      doc: body,
      refresh: true, // Force refresh to reflect changes immediately
    });

    return NextResponse.json(
      { message: "Document updated successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.meta && error.meta.statusCode === 404) {
      return NextResponse.json(
        { error: "Document not found to update." },
        { status: 404 },
      );
    }
    console.error(`Elasticsearch PUT [${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to update document." },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove a sports team by its _id.
 */
export async function DELETE(request: NextRequest, props: RouteContext) {
  const { id } = await props.params;

  try {
    await elasticClient.delete({
      index: SPORTS_INDEX_NAME,
      id: id,
      refresh: true, // Force refresh so it immediately disappears from search results
    });

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.meta && error.meta.statusCode === 404) {
      return NextResponse.json(
        { error: "Document not found to delete." },
        { status: 404 },
      );
    }
    console.error(`Elasticsearch DELETE [${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to delete document." },
      { status: 500 },
    );
  }
}
