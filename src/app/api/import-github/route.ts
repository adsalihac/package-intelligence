import { type NextRequest, NextResponse } from "next/server";

type GitHubFile = {
  path: string;
  content: string;
};

type GitHubImportResponse = {
  owner: string;
  repo: string;
  branch: string;
  packageJson: GitHubFile;
  lockfile?: GitHubFile;
};

const CANDIDATE_BRANCHES = ["HEAD", "main", "master"];
const LOCKFILE_PATHS = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

const parseGitHubRepo = (value: string) => {
  const trimmed = value.trim();
  const match = /github\.com\/([^/\s]+)\/([^/\s#?]+)/i.exec(trimmed);
  if (!match?.[1] || !match?.[2]) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
};

const githubHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.raw",
    "User-Agent": "package-intelligence-importer",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
};

async function fetchRepoFile(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
      {
        headers: githubHeaders(),
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return null;

    return await response.text();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const repoUrl = request.nextUrl.searchParams.get("repo");
  if (!repoUrl) {
    return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
  }

  const parsed = parseGitHubRepo(repoUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Enter a valid GitHub repository URL." },
      { status: 400 }
    );
  }

  for (const branch of CANDIDATE_BRANCHES) {
    const packageJson = await fetchRepoFile(parsed.owner, parsed.repo, "package.json", branch);
    if (!packageJson) continue;

    let lockfile: GitHubFile | undefined;
    for (const lockPath of LOCKFILE_PATHS) {
      const content = await fetchRepoFile(parsed.owner, parsed.repo, lockPath, branch);
      if (content) {
        lockfile = { path: lockPath, content };
        break;
      }
    }

    const response: GitHubImportResponse = {
      ...parsed,
      branch,
      packageJson: {
        path: "package.json",
        content: packageJson,
      },
      lockfile,
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  }

  return NextResponse.json(
    { error: "Could not find package.json on the default, main, or master branch." },
    { status: 404 }
  );
}
