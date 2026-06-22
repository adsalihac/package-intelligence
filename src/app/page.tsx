import { FeatureGrid } from "@/components/landing/feature-grid";
import { FutureFeatures } from "@/components/landing/future-features";
import { Hero } from "@/components/landing/hero";
import { PackageAnalyzer } from "@/components/landing/package-analyzer";
import { SectionHeading } from "@/components/landing/section-heading";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const repoUrl = "https://github.com/adsalihac/package-intelligence";
const forkUrl = "https://github.com/adsalihac/package-intelligence/fork";
const owner = "adsalihac";
const repo = "package-intelligence";

const formatStarCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return `${count}`;
};

const parseShieldsMessage = (message: string) => {
  const normalized = message.trim().toLowerCase();
  if (normalized.endsWith("k") || normalized.endsWith("m")) {
    return message;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : formatStarCount(parsed);
};

async function getStarCountLabel() {
  const token = process.env.GITHUB_TOKEN;
  const apiHeaders: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "package-intelligence-app",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token) {
    apiHeaders.Authorization = `Bearer ${token}`;
  }


  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: apiHeaders,
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error("GitHub API request failed");
    }
    const data = (await response.json()) as { stargazers_count?: number };
    if (typeof data.stargazers_count === "number") {
      return formatStarCount(data.stargazers_count);
    }
  } catch {
    // Fallback source when the GitHub API fails or is rate-limited.
  }

  try {
    const shieldsResponse = await fetch(
      `https://img.shields.io/github/stars/${owner}/${repo}.json`,
      { next: { revalidate: 3600 } }
    );

    if (!shieldsResponse.ok) {
      return null;
    }

    const shieldsData = (await shieldsResponse.json()) as { message?: string };
    if (!shieldsData.message) {
      return null;
    }

    return parseShieldsMessage(shieldsData.message);
  } catch {
    return null;
  }
}

export default async function Home() {
  const starCountLabel = await getStarCountLabel();

  return (
    <div className="ai-grid-bg min-h-screen bg-transparent">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/30 backdrop-blur-xl dark:border-white/10 dark:bg-[#08131f]/72">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/" className="flex items-center" aria-label="package-intelligence home">
            <Image
              src="/package-intelligence-logo.svg"
              alt="package-intelligence"
              width={232}
              height={58}
              className="h-10 w-auto dark:hidden sm:h-11"
              priority
            />
            <Image
              src="/package-intelligence-logo-dark.svg"
              alt="package-intelligence"
              width={232}
              height={58}
              className="hidden h-10 w-auto dark:block sm:h-11"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
        
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden sm:flex"
              )}
            >
              Star {starCountLabel === null ? "★" : `★ ${starCountLabel}`}
            </a>
            <a
              href={forkUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ size: "sm" }), "hidden sm:flex")}
            >
              Contribute
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="px-6 pb-28 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Hero />
        </div>

        <section id="features" className="mx-auto max-w-6xl">
          <SectionHeading
            title="Actionable dependency intelligence in one dashboard"
            description="Understand package health, compatibility, and bundle impact without digging through repositories or changelogs."
            eyebrow="Feature grid"
          />
          <FeatureGrid />
        </section>

        <section className="mx-auto max-w-6xl">
          <SectionHeading
            title="Upload your package.json and get instant insights"
            description="Drag and drop, paste JSON, or load a sample project to see a full dependency report."
            eyebrow="Main application"
            align="left"
          />
          <PackageAnalyzer />
        </section>

        <section className="mx-auto max-w-6xl">
          <FutureFeatures />
        </section>
      </main>

      <footer className="sticky bottom-0 z-40 border-t border-border/50 bg-background/30 shadow-[0_-12px_32px_color-mix(in_srgb,#001024_8%,transparent)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#08131f]/72">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <span>package-intelligence © 2026</span>
          <div className="flex items-center gap-4">
            <Link
              href="/changelog"
              className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Changelog
            </Link>
            <a
              href="https://www.producthunt.com/products/package-intelligence?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-package-intelligence"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Product Hunt badge"
              className="focus:outline-none"
            >
              {/* Light mode badge */}
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1159438&theme=light"
                alt="Package Intelligence - React Native & Expo Dependency Insights | Product Hunt"
                className="block dark:hidden"
                style={{ maxWidth: "140px", height: "auto" }}
              />
              {/* Dark mode badge */}
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1159438&theme=dark"
                alt="Package Intelligence - React Native & Expo Dependency Insights | Product Hunt"
                className="hidden dark:block"
                style={{ maxWidth: "140px", height: "auto" }}
              />
            </a>
            <a
              href="https://buymeacoffee.com/adsalihac"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/45 bg-amber-50/35 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur-sm transition hover:border-amber-400/60 hover:bg-amber-100/55 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-200 dark:hover:bg-amber-300/20"
            >
              <span>☕</span>
              <span>Buy me a coffee</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
