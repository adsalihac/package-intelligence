"use client";

import { motion } from "framer-motion";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pt-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center"
      >
        <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
          Package Intelligence Beta
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Understand Your React Native & Expo Dependencies in Seconds
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Upload your package.json and instantly discover Expo alternatives,
          package risks, bundle impact, compatibility issues, and optimization
          opportunities.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#analyzer"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-6")}
          >
            Analyze package.json
          </a>
          <a
            href="#report"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "h-11 px-6"
            )}
          >
            View Demo Report
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span>Expo alternatives</span>
          <span>New Architecture</span>
          <span>Bundle impact</span>
          <span>Risk detection</span>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle,rgba(37,99,235,0.12),transparent_60%)]" />
    </section>
  );
}
