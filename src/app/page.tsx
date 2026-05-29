import { FeatureGrid } from "@/components/landing/feature-grid";
import { FutureFeatures } from "@/components/landing/future-features";
import { Hero } from "@/components/landing/hero";
import { PackageAnalyzer } from "@/components/landing/package-analyzer";
import { SectionHeading } from "@/components/landing/section-heading";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="ai-grid-bg min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 font-semibold text-primary shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_30%,transparent)]">
              PI
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-foreground">
                package-intelligence
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Build Intelligence Platform
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:flex">
            <a className="transition hover:text-foreground" href="#features">
              Features
            </a>
            <a className="transition hover:text-foreground" href="#analyzer">
              Analyzer
            </a>
            <a className="transition hover:text-foreground" href="#report">
              Demo Report
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#analyzer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden sm:flex"
              )}
            >
              Start analysis
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="px-6 pb-16 sm:px-8">
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

      <footer className="border-t border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <span>package-intelligence © 2026</span>
          <span>Designed for React Native and Expo product teams</span>
        </div>
      </footer>
    </div>
  );
}
