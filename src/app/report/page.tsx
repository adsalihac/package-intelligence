import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PublicReportViewer } from "@/components/report/public-report-viewer";

export const metadata: Metadata = {
  title: "Shared Dependency Report — Package Intelligence",
  description:
    "A shareable Package Intelligence report for React Native and Expo dependency health.",
};

export default function ReportPage() {
  return (
    <div className="ai-grid-bg min-h-screen bg-transparent px-6 py-8 sm:px-8">
      <main className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4 pb-10">
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
            Analyze
          </Link>
        </header>

        <PublicReportViewer />
      </main>
    </div>
  );
}
