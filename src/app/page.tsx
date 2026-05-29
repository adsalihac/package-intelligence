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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              PI
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Package Intelligence
              </p>
              <p className="text-xs text-muted-foreground">
                React Native & Expo
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
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

      <footer className="border-t border-border/60 bg-background/80">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <span>Package Intelligence © 2026</span>
          <span>Built for React Native & Expo teams</span>
        </div>
      </footer>
    </div>
  );
}
