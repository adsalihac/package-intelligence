import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CHANGELOG, type ChangelogEntry } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog — Package Intelligence",
  description:
    "Track Package Intelligence feature changes, improvements, and fixes by version.",
};

const changeStyle: Record<ChangelogEntry["changes"][number]["type"], string> = {
  New: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  Improved: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-200",
  Fixed: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));

export default function ChangelogPage() {
  const latest = CHANGELOG[0];

  return (
    <div className="ai-grid-bg min-h-screen bg-transparent px-6 py-8 sm:px-8">
      <main className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-8 pb-10">
          <div className="flex items-center justify-between gap-4">
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition hover:bg-muted"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
          </div>

          <section className="max-w-3xl">
            <Badge className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-primary">
              latest v{latest.version}
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Changelog
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Version-by-version feature changes, improvements, and fixes for Package Intelligence.
            </p>
          </section>
        </header>

        <section className="space-y-5 pb-16">
          {CHANGELOG.map((entry) => (
            <Card key={entry.version} className="ai-panel border-border/70 bg-card/90">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        v{entry.version}
                      </h2>
                      <Badge className="border-primary/20 bg-primary/10 text-primary">
                        {entry.title}
                      </Badge>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {entry.summary}
                    </p>
                  </div>
                  <div className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays size={16} />
                    {formatDate(entry.date)}
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {entry.changes.map((change) => (
                    <div
                      key={`${entry.version}-${change.type}-${change.text}`}
                      className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/45 px-4 py-3 sm:flex-row sm:items-center"
                    >
                      <Badge className={changeStyle[change.type]}>{change.type}</Badge>
                      <p className="text-sm leading-6 text-foreground">{change.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
