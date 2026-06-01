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
  deprecated?: boolean;
  deprecatedMessage?: string;
  unmaintainedReason?: string;
}

type NpmVersion = {
  deprecated?: string;
};

type NpmPackument = {
  "dist-tags"?: { latest?: string };
  versions?: Record<string, NpmVersion>;
  time?: Record<string, string>;
  repository?: string | { type?: string; url?: string };
};

const UNMAINTAINED_MONTHS = 18;
const UNMAINTAINED_MS = UNMAINTAINED_MONTHS * 30 * 24 * 60 * 60 * 1000;

const parseGitHubSlug = (input?: string): { owner: string; repo: string } | null => {
  if (!input) return null;

  const normalized = input
    .replace(/^git\+/, "")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");

  const match = /github\.com\/([^/]+)\/([^/#?]+)/i.exec(normalized);
  if (!match?.[1] || !match?.[2]) return null;

  return {
    owner: match[1],
    repo: match[2],
  };
};

const formatMonthsAgo = (date: Date) => {
  const months = Math.max(
    1,
    Math.floor((Date.now() - date.getTime()) / (30 * 24 * 60 * 60 * 1000))
  );
  return `${months} month${months === 1 ? "" : "s"} ago`;
};

async function fetchRNDirectoryLibrary(pkgName: string): Promise<RNDirLibrary | null> {
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

async function fetchNpmSignals(pkgName: string): Promise<Pick<RNDirLibrary, "deprecated" | "deprecatedMessage" | "unmaintained" | "unmaintainedReason" | "github" | "npm">> {
  try {
    const encoded = encodeURIComponent(pkgName);
    const npmRes = await fetch(`https://registry.npmjs.org/${encoded}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!npmRes.ok) return {};

    const packument = (await npmRes.json()) as NpmPackument;
    const latest = packument["dist-tags"]?.latest;
    const latestVersion = latest ? packument.versions?.[latest] : undefined;
    const latestReleaseDate = latest ? packument.time?.[latest] : undefined;

    let isUnmaintained = false;
    let unmaintainedReason: string | undefined;

    if (latestReleaseDate) {
      const releaseDate = new Date(latestReleaseDate);
      if (!Number.isNaN(releaseDate.getTime()) && Date.now() - releaseDate.getTime() > UNMAINTAINED_MS) {
        isUnmaintained = true;
        unmaintainedReason = `No release since ${formatMonthsAgo(releaseDate)}.`;
      }
    }

    let isArchived = false;
    const repoUrl =
      typeof packument.repository === "string"
        ? packument.repository
        : packument.repository?.url;
    const slug = parseGitHubSlug(repoUrl);

    if (slug) {
      try {
        const headers: HeadersInit = {
          Accept: "application/vnd.github+json",
          "User-Agent": "package-intelligence-analyzer",
          "X-GitHub-Api-Version": "2022-11-28",
        };
        const token = process.env.GITHUB_TOKEN;
        if (token) headers.Authorization = `Bearer ${token}`;

        const repoRes = await fetch(`https://api.github.com/repos/${slug.owner}/${slug.repo}`, {
          headers,
          next: { revalidate: 3600 },
        });

        if (repoRes.ok) {
          const repoData = (await repoRes.json()) as { archived?: boolean; pushed_at?: string; stargazers_count?: number };
          isArchived = repoData.archived ?? false;

          if (!isUnmaintained && repoData.pushed_at) {
            const pushedAt = new Date(repoData.pushed_at);
            if (!Number.isNaN(pushedAt.getTime()) && Date.now() - pushedAt.getTime() > UNMAINTAINED_MS) {
              isUnmaintained = true;
              unmaintainedReason = `No repository activity since ${formatMonthsAgo(pushedAt)}.`;
            }
          }

          return {
            deprecated: Boolean(latestVersion?.deprecated),
            deprecatedMessage: latestVersion?.deprecated,
            unmaintained: isUnmaintained,
            unmaintainedReason,
            github: {
              isArchived,
              stats: {
                updatedAt: repoData.pushed_at,
                stars: repoData.stargazers_count,
              },
            },
            npm: {
              latestReleaseDate,
            },
          };
        }
      } catch {
        // Ignore GitHub metadata failures and continue with npm-only signals.
      }
    }

    return {
      deprecated: Boolean(latestVersion?.deprecated),
      deprecatedMessage: latestVersion?.deprecated,
      unmaintained: isUnmaintained,
      unmaintainedReason,
      github: {
        isArchived,
      },
      npm: {
        latestReleaseDate,
      },
    };
  } catch {
    return {};
  }
}

async function fetchOne(pkgName: string): Promise<RNDirLibrary | null> {
  const [rnDir, npmSignals] = await Promise.all([
    fetchRNDirectoryLibrary(pkgName),
    fetchNpmSignals(pkgName),
  ]);

  const merged: RNDirLibrary = {
    ...(rnDir ?? {}),
    npmPkg: pkgName,
    deprecated: npmSignals.deprecated ?? false,
    deprecatedMessage: npmSignals.deprecatedMessage,
    unmaintained: (rnDir?.unmaintained ?? false) || (npmSignals.unmaintained ?? false),
    unmaintainedReason: npmSignals.unmaintainedReason,
    github: {
      ...(rnDir?.github ?? {}),
      ...(npmSignals.github ?? {}),
      stats: {
        ...(rnDir?.github?.stats ?? {}),
        ...(npmSignals.github?.stats ?? {}),
      },
      isArchived: (rnDir?.github?.isArchived ?? false) || (npmSignals.github?.isArchived ?? false),
    },
    npm: {
      ...(rnDir?.npm ?? {}),
      ...(npmSignals.npm ?? {}),
    },
  };

  return merged;
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
          unmaintainedReason: lib.unmaintainedReason,
          deprecated: lib.deprecated ?? false,
          deprecatedMessage: lib.deprecatedMessage,
          score: lib.score,
          github: {
            isArchived: lib.github?.isArchived,
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
