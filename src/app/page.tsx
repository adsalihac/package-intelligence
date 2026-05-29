import { FeatureGrid } from "@/components/landing/feature-grid";
import { FutureFeatures } from "@/components/landing/future-features";
import { Hero } from "@/components/landing/hero";
import { PackageAnalyzer } from "@/components/landing/package-analyzer";
import { SectionHeading } from "@/components/landing/section-heading";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

const repoUrl = "https://github.com/adsalihac/package-intelligence";
const forkUrl = "https://github.com/adsalihac/package-intelligence/fork";

const formatStarCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return `${count}`;
};

async function getStarCount() {
  try {
    const response = await fetch("https://api.github.com/repos/adsalihac/package-intelligence", {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const starCount = await getStarCount();

  return (
    <div className="ai-grid-bg min-h-screen bg-transparent">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <a href="/" className="flex items-center" aria-label="package-intelligence home">
            <Image
              src="/package-intelligence-logo.svg"
              alt="package-intelligence"
              width={232}
              height={58}
              className="h-10 w-auto sm:h-11"
              priority
            />
          </a>
          <div className="flex items-center gap-3">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden sm:flex"
              )}
            >
              Star {starCount === null ? "★" : `★ ${formatStarCount(starCount)}`}
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

      <footer className="sticky bottom-0 z-40 border-t border-border/50 bg-background/30 shadow-[0_-12px_32px_color-mix(in_srgb,#001024_8%,transparent)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <span>package-intelligence © 2026</span>
          <div className="flex items-center gap-4">
            <a
              href="https://buymeacoffee.com/adsalihac"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/45 bg-amber-50/35 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur-sm transition hover:border-amber-400/60 hover:bg-amber-100/55"
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
