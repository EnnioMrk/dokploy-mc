import { NextRequest, NextResponse } from "next/server";

import { readDirectory } from "@/lib/directory";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedPath = searchParams.get("path") ?? "";

  try {
    const snapshot = await readDirectory(requestedPath);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to read the requested directory.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
