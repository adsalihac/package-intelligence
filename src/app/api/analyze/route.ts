import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const packages = request.nextUrl.searchParams.get("packages");

  if (!packages) {
    return NextResponse.json({ error: "Missing packages parameter" }, { status: 400 });
  }

  try {
    const url = `https://reactnative.directory/api/libraries/check?packages=${packages}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "React Native Directory API request failed" },
        { status: response.status }
      );
    }

    const data = (await response.json()) as unknown;
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch package data" }, { status: 500 });
  }
}
