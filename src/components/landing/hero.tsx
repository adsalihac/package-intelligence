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
        <Badge className="rounded-full border border-primary/30 bg-primary/15 px-4 py-1 text-primary">
          package-intelligence beta
        </Badge>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Build-ready dependency intelligence for React Native teams
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Upload your package.json and get an instant build-style report on
          package health, dependency death risk, Expo alignment, architecture readiness, and bundle
          pressure.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#analyzer"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-7")}
          >
            Analyze package.json
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span>Expo alternatives</span>
          <span>New architecture</span>
          <span>Bundle impact</span>
          <span>Risk detection</span>
          <span>Death checker</span>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute -top-8 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_28%,transparent),transparent_65%)] blur-xl" />
    </section>
  );
}
