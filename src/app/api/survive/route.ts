import { type NextRequest, NextResponse } from "next/server";

type NpmVersionMeta = {
  repository?: string | { type?: string; url?: string };
};

type NpmPackument = {
  "dist-tags"?: { latest?: string };
  time?: Record<string, string>;
  versions?: Record<string, NpmVersionMeta>;
  repository?: string | { type?: string; url?: string };
};

type GitHubContributor = {
  contributions?: number;
};

type SurviveReport = {
  packageName: string;
  lastRelease?: string;
  contributorCount: number | null;
  busFactor: number | null;
  riskLevel: "Low" | "Medium" | "High";
  riskScore: number;
  repo?: { owner: string; repo: string };
};

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseGitHubSlug = (
  input?: string
): { owner: string; repo: string } | null => {
  if (!input) return null;

  const normalized = input
    .replace(/^git\+/, "")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");

  const match = /github\.com\/([^/]+)\/([^/#?]+)/i.exec(normalized);
  if (!match?.[1] || !match?.[2]) return null;

  return { owner: match[1], repo: match[2] };
};

const monthsSince = (isoDate?: string): number | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / ONE_MONTH_MS);
};

const computeBusFactor = (contributors: GitHubContributor[]): number | null => {
  const counts = contributors
    .map((c) => c.contributions ?? 0)
    .filter((n) => n > 0)
    .sort((a, b) => b - a);

  if (!counts.length) return null;

  const total = counts.reduce((sum, n) => sum + n, 0);
  let cumulative = 0;

  for (let i = 0; i < counts.length; i += 1) {
    cumulative += counts[i];
    if (cumulative / total >= 0.5) {
      return i + 1;
    }
  }

  return counts.length;
};

const scoreRisk = (params: {
  releaseAgeMonths: number | null;
  busFactor: number | null;
  contributorCount: number | null;
  archived: boolean;
}): { riskScore: number; riskLevel: "Low" | "Medium" | "High" } => {
  let score = 0;

  if (params.archived) score += 35;

  if (params.releaseAgeMonths !== null) {
    if (params.releaseAgeMonths > 24) score += 40;
    else if (params.releaseAgeMonths > 12) score += 25;
    else if (params.releaseAgeMonths > 6) score += 12;
  } else {
    score += 10;
  }

  if (params.contributorCount !== null) {
    if (params.contributorCount <= 1) score += 25;
    else if (params.contributorCount <= 3) score += 15;
    else if (params.contributorCount <= 6) score += 8;
  } else {
    score += 10;
  }

  if (params.busFactor !== null) {
    if (params.busFactor <= 1) score += 25;
    else if (params.busFactor <= 2) score += 15;
    else if (params.busFactor <= 3) score += 8;
    else if (params.busFactor >= 5) score -= 5;
  } else {
    score += 8;
  }

  const riskScore = clamp(score, 0, 100);
  const riskLevel =
    riskScore >= 65 ? "High" : riskScore >= 35 ? "Medium" : "Low";

  return { riskScore, riskLevel };
};

async function fetchNpmPackument(pkgName: string): Promise<NpmPackument | null> {
  try {
    const encoded = encodeURIComponent(pkgName);
    const res = await fetch(`https://registry.npmjs.org/${encoded}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return (await res.json()) as NpmPackument;
  } catch {
    return null;
  }
}

async function fetchGitHubMetrics(
  owner: string,
  repo: string
): Promise<{ contributors: GitHubContributor[]; archived: boolean } | null> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "User-Agent": "package-intelligence-survivability",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const [repoRes, contributorsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
        next: { revalidate: 3600 },
      }),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100&anon=1`,
        {
          headers,
          next: { revalidate: 3600 },
        }
      ),
    ]);

    if (!repoRes.ok || !contributorsRes.ok) return null;

    const repoData = (await repoRes.json()) as { archived?: boolean };
    const contributors = (await contributorsRes.json()) as GitHubContributor[];

    return {
      contributors: Array.isArray(contributors) ? contributors : [],
      archived: repoData.archived ?? false,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const packageName = request.nextUrl.searchParams.get("package")?.trim();
  if (!packageName) {
    return NextResponse.json(
      { error: "Missing package parameter" },
      { status: 400 }
    );
  }

  const packument = await fetchNpmPackument(packageName);
  if (!packument) {
    return NextResponse.json(
      { error: "Package not found" },
      { status: 404 }
    );
  }

  const latest = packument["dist-tags"]?.latest;
  const lastRelease = latest ? packument.time?.[latest] : undefined;

  const versionRepoUrl = latest
    ? packument.versions?.[latest]?.repository
    : undefined;

  const rootRepoUrl = packument.repository;
  const rawRepo =
    typeof versionRepoUrl === "string"
      ? versionRepoUrl
      : versionRepoUrl?.url ??
        (typeof rootRepoUrl === "string" ? rootRepoUrl : rootRepoUrl?.url);

  const slug = parseGitHubSlug(rawRepo);
  let contributorCount: number | null = null;
  let busFactor: number | null = null;
  let archived = false;

  if (slug) {
    const gh = await fetchGitHubMetrics(slug.owner, slug.repo);
    if (gh) {
      contributorCount = gh.contributors.length;
      busFactor = computeBusFactor(gh.contributors);
      archived = gh.archived;
    }
  }

  const releaseAgeMonths = monthsSince(lastRelease);
  const { riskScore, riskLevel } = scoreRisk({
    releaseAgeMonths,
    contributorCount,
    busFactor,
    archived,
  });

  const report: SurviveReport = {
    packageName,
    lastRelease,
    contributorCount,
    busFactor,
    riskScore,
    riskLevel,
    repo: slug ?? undefined,
  };

  return NextResponse.json(report, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
