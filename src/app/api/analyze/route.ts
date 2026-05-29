import { type NextRequest, NextResponse } from "next/server";

interface RNDirLibrary {
  npmPkg?: string;
  ios?: boolean;
  android?: boolean;
  web?: boolean;
  tvos?: boolean;
  visionos?: boolean;
  windows?: boolean;
  newArchitecture?: boolean;
  expoGo?: boolean;
  unmaintained?: boolean;
  score?: number;
  github?: {
    stats?: { updatedAt?: string; stars?: number };
    isArchived?: boolean;
  };
  npm?: {
    weekDownloads?: number;
    size?: number;
    latestRelease?: string;
    latestReleaseDate?: string;
  };
  alternatives?: string[];
}

async function fetchOne(pkgName: string): Promise<RNDirLibrary | null> {
  try {
    const url = `https://reactnative.directory/api/libraries?search=${encodeURIComponent(pkgName)}&limit=5`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { libraries?: RNDirLibrary[] };
    const libs = data.libraries ?? [];
    return libs.find((l) => l.npmPkg === pkgName) ?? null;
  } catch {
    return null;
  }
}

// Fetch packages with limited concurrency to avoid overwhelming the API
async function fetchWithConcurrency(pkgNames: string[], limit = 8): Promise<(RNDirLibrary | null)[]> {
  const results: (RNDirLibrary | null)[] = new Array(pkgNames.length).fill(null);
  const queue = pkgNames.map((name, i) => ({ name, i }));
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      results[item.i] = await fetchOne(item.name);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function GET(request: NextRequest) {
  const packages = request.nextUrl.searchParams.get("packages");
  if (!packages) {
    return NextResponse.json({ error: "Missing packages parameter" }, { status: 400 });
  }

  const pkgList = packages.split(",").map((p) => p.trim()).filter(Boolean);

  try {
    const raw = await fetchWithConcurrency(pkgList);

    const data = pkgList
      .map((name, i) => {
        const lib = raw[i];
        if (!lib) return null;
        return {
          npmPkg: name,
          ios: lib.ios,
          android: lib.android,
          web: lib.web,
          tvos: lib.tvos,
          visionos: lib.visionos,
          windows: lib.windows,
          newArchitecture: lib.newArchitecture,
          expoGo: lib.expoGo,
          unmaintained: lib.unmaintained ?? lib.github?.isArchived ?? false,
          score: lib.score,
          github: {
            stats: {
              stars: lib.github?.stats?.stars,
              updatedAt: lib.github?.stats?.updatedAt,
            },
          },
          npm: {
            weekDownloads: lib.npm?.weekDownloads,
            size: lib.npm?.size,
            // Use latestReleaseDate for relative-date display
            latestRelease: lib.npm?.latestReleaseDate ?? lib.github?.stats?.updatedAt,
          },
          alternatives: lib.alternatives,
        };
      })
      .filter(Boolean);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch package data" }, { status: 500 });
  }
}
