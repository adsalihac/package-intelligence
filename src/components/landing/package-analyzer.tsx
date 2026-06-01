"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertTriangle,
  ArrowUpCircle,
  BarChart2,
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Glasses,
  Globe,
  Share2,
  Smartphone,
  Star,
  Tv,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type RNDirData,
  fetchRNDirectoryData,
  formatBytes,
  formatDownloads,
  formatRelativeDate,
} from "@/lib/rn-directory";
import { SAMPLE_PACKAGE_JSON } from "@/lib/sample-package";

// ─── Types ────────────────────────────────────────────────────────────────────

type PackageCategory = "Dependency" | "Dev Dependency";
type BundleImpact = "Low" | "Medium" | "High";
type PackageStatus = "Healthy" | "Needs Review" | "Deprecated" | "Archived" | "Outdated";
type RiskLevel = "Low" | "Medium" | "High";
type Better = "a" | "b" | "equal" | "none";

type PackageInsight = {
  name: string;
  version: string;
  category: PackageCategory;
  healthScore: number;
  healthGrade: string;
  expoCompatible: boolean;
  newArchitecture: boolean;
  bundleImpact: BundleImpact;
  status: PackageStatus;
  recommendation: string;
};

type EnrichedInsight = PackageInsight & {
  hasLiveData: boolean;
  platforms?: { ios: boolean; android: boolean; web: boolean; tvos: boolean; visionos: boolean; windows: boolean };
  weekDownloads?: number;
  stars?: number;
  lastRelease?: string;
  npmSize?: number;
  rnScore?: number;
  rnAlternatives?: string[];
  expoGo?: boolean;
  isUnmaintained?: boolean;
  unmaintainedReason?: string;
  isDeprecated?: boolean;
  deprecatedMessage?: string;
  isArchived?: boolean;
  deathRiskScore?: number;
  deathRiskLevel?: RiskLevel;
};

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type SurviveReport = {
  packageName: string;
  lastRelease?: string;
  contributorCount: number | null;
  busFactor: number | null;
  riskLevel: RiskLevel;
  riskScore: number;
  repo?: { owner: string; repo: string };
};

type ProjectType = "Expo" | "React Native" | "Unknown";
type DuplicateGroup = { category: string; packages: string[] };

// ─── Static data ──────────────────────────────────────────────────────────────

const DEMO_ALTERNATIVES: Record<string, string> = {
  "react-native-fast-image": "expo-image",
  "react-native-video": "expo-video",
  "react-native-image-picker": "expo-image-picker",
  "react-native-document-picker": "expo-document-picker",
  "react-native-linear-gradient": "expo-linear-gradient",
  "react-native-camera": "expo-camera",
  "react-native-maps": "expo-location",
  "@react-native-async-storage/async-storage": "expo-secure-store",
  "react-native-async-storage": "expo-secure-store",
};

const FUNCTIONAL_GROUPS: Record<string, string[]> = {
  "Image Loading": ["react-native-fast-image", "expo-image", "react-native-image-loading"],
  "Video Playback": ["react-native-video", "expo-video", "expo-av"],
  "Camera": ["react-native-camera", "expo-camera", "react-native-vision-camera"],
  "Image Picker": ["react-native-image-picker", "expo-image-picker", "react-native-image-crop-picker"],
  "Document Picker": ["react-native-document-picker", "expo-document-picker"],
  "Gradients": ["react-native-linear-gradient", "expo-linear-gradient"],
  "Maps": ["react-native-maps", "expo-location", "react-native-mapbox-gl"],
  "Navigation": ["@react-navigation/native", "expo-router", "react-native-navigation"],
  "Storage": [
    "@react-native-async-storage/async-storage",
    "react-native-async-storage",
    "expo-secure-store",
    "expo-file-system",
  ],
  "Push Notifications": [
    "expo-notifications",
    "@react-native-firebase/messaging",
    "react-native-push-notification",
  ],
};

const ARCHIVED = new Set(["react-native-camera"]);
const DEPRECATED = new Set(["react-native-document-picker"]);
const HEAVY = new Set(["react-native-video", "react-native-fast-image", "react-native-camera"]);

// ─── Style maps ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PackageStatus, string> = {
  Healthy: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  "Needs Review": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  Deprecated: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-400/15 dark:text-rose-200",
  Archived: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-200",
  Outdated: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-200",
};

const IMPACT_STYLES: Record<BundleImpact, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  Medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  High: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-400/15 dark:text-rose-200",
};

const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  Medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  High: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-400/15 dark:text-rose-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const grade = (s: number) =>
  s >= 95 ? "A+" : s >= 90 ? "A" : s >= 80 ? "B" : s >= 70 ? "C" : s >= 60 ? "D" : "F";

const hash = (v: string) =>
  Array.from(v).reduce((a, c) => (a + c.charCodeAt(0) * 7) % 100, 0);

const impactScore = (i: BundleImpact) => (i === "High" ? 3 : i === "Medium" ? 2 : 1);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const majorOf = (v?: string) => {
  if (!v) return null;
  const m = /(\d+)/.exec(v);
  return m ? parseInt(m[1], 10) : null;
};

const parseJson = (raw: string) => {
  const p = JSON.parse(raw) as PackageJson;
  return { dependencies: p.dependencies ?? {}, devDependencies: p.devDependencies ?? {} };
};

const parseLock = (raw: string): Record<string, string> => {
  try {
    const lock = JSON.parse(raw) as {
      packages?: Record<string, { version?: string }>;
      dependencies?: Record<string, { version?: string }>;
    };
    const out: Record<string, string> = {};
    if (lock.packages) {
      for (const [path, pkg] of Object.entries(lock.packages)) {
        if (!path.startsWith("node_modules/")) continue;
        const name = path.replace(/^node_modules\//, "");
        if (pkg.version) out[name] = pkg.version;
      }
    } else if (lock.dependencies) {
      for (const [name, dep] of Object.entries(lock.dependencies)) {
        if (dep.version) out[name] = dep.version;
      }
    }
    return out;
  } catch { return {}; }
};

const detectProject = (p: PackageJson): ProjectType => {
  const d = p.dependencies ?? {};
  if (typeof d.expo === "string") return "Expo";
  if (typeof d["react-native"] === "string") return "React Native";
  return "Unknown";
};

const buildBase = (name: string, version: string, category: PackageCategory): PackageInsight => {
  const h = hash(name);
  const alt = DEMO_ALTERNATIVES[name];
  const archived = ARCHIVED.has(name);
  const deprecated = DEPRECATED.has(name);
  const expoCompatible = name.startsWith("expo-") || !!alt || h > 58;
  const newArchitecture = !archived && !deprecated && (name.startsWith("expo-") || h > 62);
  const bundleImpact: BundleImpact = HEAVY.has(name) ? "High" : h > 70 ? "Medium" : "Low";

  let healthScore = 60 + (h % 31);
  if (expoCompatible) healthScore += 4;
  if (newArchitecture) healthScore += 4;
  if (alt) healthScore += 3;
  if (bundleImpact === "High") healthScore -= 8;
  if (bundleImpact === "Medium") healthScore -= 4;
  if (deprecated) healthScore = 28;
  if (archived) healthScore = 22;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const status: PackageStatus = deprecated ? "Deprecated" : archived ? "Archived"
    : healthScore < 50 ? "Needs Review" : healthScore < 65 ? "Outdated" : "Healthy";

  const recommendation = alt ? `Use ${alt}`
    : status === "Outdated" ? "Upgrade to latest release"
    : status === "Needs Review" ? "Audit usage and verify maintenance"
    : status === "Archived" ? "Replace or fork for maintenance"
    : status === "Deprecated" ? "Plan migration away" : "—";

  return { name, version, category, healthScore, healthGrade: grade(healthScore), expoCompatible, newArchitecture, bundleImpact, status, recommendation };
};

const enrich = (base: PackageInsight, live?: RNDirData): EnrichedInsight => {
  if (!live) {
    const fallbackRiskScore = base.status === "Deprecated"
      ? 72
      : base.status === "Archived"
      ? 82
      : base.status === "Needs Review"
      ? 48
      : base.status === "Outdated"
      ? 30
      : 8;
    return {
      ...base,
      hasLiveData: false,
      isUnmaintained: false,
      isDeprecated: base.status === "Deprecated",
      isArchived: base.status === "Archived",
      deathRiskScore: fallbackRiskScore,
      deathRiskLevel: fallbackRiskScore >= 70 ? "High" : fallbackRiskScore >= 35 ? "Medium" : "Low",
    };
  }

  const isArchived = live.github?.isArchived ?? false;
  const isDeprecated = live.deprecated ?? base.status === "Deprecated";
  const isUnmaintained = live.unmaintained ?? false;

  let deathRiskScore = 0;
  if (isArchived) deathRiskScore += 62;
  if (isDeprecated) deathRiskScore += 46;
  if (isUnmaintained) deathRiskScore += 34;
  if (base.bundleImpact === "High") deathRiskScore += 8;
  if (base.status === "Needs Review") deathRiskScore += 12;
  if (base.status === "Outdated") deathRiskScore += 6;
  deathRiskScore = clamp(deathRiskScore, 0, 100);

  const deathRiskLevel: RiskLevel = deathRiskScore >= 70 ? "High" : deathRiskScore >= 35 ? "Medium" : "Low";

  let hs = base.healthScore;
  if (live.score !== undefined) hs = Math.round((hs + Math.round(live.score * 100)) / 2);
  if (isUnmaintained) hs = Math.min(hs, 35);
  if (isDeprecated) hs = Math.min(hs, 30);
  if (isArchived) hs = Math.min(hs, 24);

  const nextStatus: PackageStatus = isArchived
    ? "Archived"
    : isDeprecated
    ? "Deprecated"
    : isUnmaintained && base.status === "Healthy"
    ? "Needs Review"
    : base.status;

  const recommendation = isArchived
    ? "Replace archived package with an active alternative"
    : isDeprecated
    ? "Migrate away from deprecated package"
    : isUnmaintained
    ? "Audit maintenance signals and prepare fallback"
    : base.recommendation;

  return {
    ...base,
    healthScore: hs,
    healthGrade: grade(hs),
    hasLiveData: true,
    newArchitecture: live.newArchitecture ?? base.newArchitecture,
    expoCompatible: live.expoGo != null ? (live.expoGo || base.name.startsWith("expo-")) : base.expoCompatible,
    status: nextStatus,
    recommendation,
    platforms: { ios: live.ios ?? false, android: live.android ?? false, web: live.web ?? false, tvos: live.tvos ?? false, visionos: live.visionos ?? false, windows: live.windows ?? false },
    weekDownloads: live.npm?.weekDownloads,
    stars: live.github?.stats?.stars,
    lastRelease: live.npm?.latestRelease ?? live.github?.stats?.updatedAt,
    npmSize: live.npm?.size,
    rnScore: live.score,
    rnAlternatives: live.alternatives,
    expoGo: live.expoGo,
    isUnmaintained,
    unmaintainedReason: live.unmaintainedReason,
    isDeprecated,
    deprecatedMessage: live.deprecatedMessage,
    isArchived,
    deathRiskScore,
    deathRiskLevel,
  };
};

const summarizeDeathChecker = (items: EnrichedInsight[]) => {
  const archived = items.filter((i) => i.isArchived).length;
  const deprecated = items.filter((i) => i.isDeprecated).length;
  const unmaintained = items.filter((i) => i.isUnmaintained).length;
  const total = items.length || 1;
  const avgRisk = Math.round(
    items.reduce((acc, item) => acc + (item.deathRiskScore ?? 0), 0) / total
  );
  const healthScore = clamp(100 - avgRisk, 0, 100);
  const riskLevel: RiskLevel = avgRisk >= 70 ? "High" : avgRisk >= 35 ? "Medium" : "Low";

  return {
    archived,
    deprecated,
    unmaintained,
    avgRisk,
    healthScore,
    riskLevel,
  };
};

const detectDuplicates = (names: string[]): DuplicateGroup[] => {
  const set = new Set(names);
  return Object.entries(FUNCTIONAL_GROUPS)
    .map(([category, members]) => ({ category, packages: members.filter((m) => set.has(m)) }))
    .filter((g) => g.packages.length >= 2);
};

const analyze = (payload: PackageJson, latestExpoMajor = 56) => {
  const entries: PackageInsight[] = [];
  for (const [n, v] of Object.entries(payload.dependencies ?? {})) entries.push(buildBase(n, v, "Dependency"));
  for (const [n, v] of Object.entries(payload.devDependencies ?? {})) entries.push(buildBase(n, v, "Dev Dependency"));

  const total = entries.length || 1;
  const avgHealth = Math.round(entries.reduce((a, e) => a + e.healthScore, 0) / total);
  const expoCompatPct = Math.round((entries.filter((e) => e.expoCompatible).length / total) * 100);
  const newArchPct = Math.round((entries.filter((e) => e.newArchitecture).length / total) * 100);

  const riskScore = entries.some((e) => e.status === "Deprecated" || e.status === "Archived") ? "High"
    : entries.some((e) => e.status === "Needs Review" || e.status === "Outdated") ? "Medium" : "Low";

  const recommendations = entries.filter((e) => e.recommendation.startsWith("Use "));
  const migrations = recommendations.map((e) => ({ current: e.name, alternative: DEMO_ALTERNATIVES[e.name] ?? e.recommendation }));

  const topHeavy = [...entries].sort((a, b) => impactScore(b.bundleImpact) - impactScore(a.bundleImpact) || b.healthScore - a.healthScore).slice(0, 4);

  const highCt = entries.filter((e) => e.bundleImpact === "High").length;
  const medCt = entries.filter((e) => e.bundleImpact === "Medium").length;
  const apkImpact: BundleImpact = highCt >= 3 ? "High" : highCt >= 1 || medCt >= 3 ? "Medium" : "Low";
  const ipaImpact: BundleImpact = highCt >= 2 ? "High" : highCt >= 1 || medCt >= 4 ? "Medium" : "Low";

  const risks = entries.filter((e) => e.status !== "Healthy").map((e) => ({
    name: e.name, status: e.status,
    detail: e.status === "Deprecated" ? "Marked deprecated in registry." : e.status === "Archived" ? "Repository archived or unmaintained." : e.status === "Needs Review" ? "Limited activity and compatibility signals." : "Update recommended to avoid compatibility drift.",
  }));

  const deps = payload.dependencies ?? {};
  const projectType = detectProject(payload);
  const expoVersionRaw = deps.expo;
  const expoInstalledMajor = majorOf(expoVersionRaw);
  const isExpoLatest = projectType === "Expo" && expoInstalledMajor !== null && expoInstalledMajor >= latestExpoMajor;
  const expoUpgradeNeeded = projectType === "Expo" && expoInstalledMajor !== null && expoInstalledMajor < latestExpoMajor;
  const rnVersionRaw = deps["react-native"];
  const duplicates = detectDuplicates(entries.map((e) => e.name));

  return { entries, depCount: Object.keys(payload.dependencies ?? {}).length, devDepCount: Object.keys(payload.devDependencies ?? {}).length, avgHealth, expoCompatPct, newArchPct, riskScore, recommendations, migrations, topHeavy, apkImpact, ipaImpact, risks, projectType, expoVersionRaw, expoInstalledMajor, latestExpoMajor, isExpoLatest, expoUpgradeNeeded, rnVersionRaw, duplicates };
};

type Analysis = ReturnType<typeof analyze>;

const toMarkdown = (a: Analysis, enriched: EnrichedInsight[]) => {
  const death = summarizeDeathChecker(enriched);
  const lines = [
    "# Package Intelligence Report",
    "",
    `> Generated: ${new Date().toLocaleString()}`,
    "",
    "## Project Overview",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Dependencies | ${a.depCount} |`,
    `| Dev Dependencies | ${a.devDepCount} |`,
    `| Health Score | ${a.avgHealth}/100 |`,
    `| Risk Score | ${a.riskScore} |`,
    `| Dependency Death Risk | ${death.avgRisk}/100 (${death.riskLevel}) |`,
    `| Dependency Health Report | ${death.healthScore}/100 |`,
    `| Expo Compatibility | ${a.expoCompatPct}% |`,
    `| New Architecture | ${a.newArchPct}% |`,
    `| Project Type | ${a.projectType} |`,
    "",
  ];
  lines.push(
    "## Dependency Death Checker",
    "",
    `- Archived packages: **${death.archived}**`,
    `- Deprecated packages: **${death.deprecated}**`,
    `- Unmaintained packages: **${death.unmaintained}**`,
    `- Risk score: **${death.avgRisk}/100 (${death.riskLevel})**`,
    ""
  );
  if (a.migrations.length) {
    lines.push("## Expo Migration Opportunities", "");
    a.migrations.forEach((m) => lines.push(`- **${m.current}** → \`${m.alternative}\``));
    lines.push("");
  }
  if (a.duplicates.length) {
    lines.push("## Duplicate Groups", "");
    a.duplicates.forEach((g) => lines.push(`**${g.category}:** ${g.packages.join(", ")}`));
    lines.push("");
  }
  if (a.risks.length) {
    lines.push("## Risk Detections", "");
    a.risks.forEach((r) => lines.push(`- \`${r.name}\` — **${r.status}**: ${r.detail}`));
    lines.push("");
  }
  lines.push("## Package Analysis", "", "| Package | Version | Health | New Arch | Expo Go | Bundle | Status | Downloads |", "|---------|---------|--------|----------|---------|--------|--------|-----------|");
  enriched.forEach((p) => lines.push(`| ${p.name} | ${p.version} | ${p.healthScore} (${p.healthGrade}) | ${p.newArchitecture ? "✓" : "✗"} | ${p.expoGo ? "✓" : "—"} | ${p.bundleImpact} | ${p.status} | ${formatDownloads(p.weekDownloads)} |`));
  return lines.join("\n");
};

// ─── Deep Dive Slide Panel ────────────────────────────────────────────────────

function DeepDivePanel({ pkg, onClose }: { pkg: EnrichedInsight | null; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const open = pkg !== null;

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} aria-hidden="true" />
      <div className={`fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-border/70 bg-card shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-label={pkg ? `Details for ${pkg.name}` : "Package details"}>
        {pkg && (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/90 px-5 py-4 backdrop-blur-xl">
              <div>
                <p className="font-semibold text-foreground">{pkg.name}</p>
                <p className="text-xs text-muted-foreground">{pkg.version} · {pkg.category}</p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition" aria-label="Close panel"><X size={18} /></button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Health Score</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{pkg.healthScore}<span className="ml-1 text-sm text-muted-foreground">({pkg.healthGrade})</span></p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
                  <div className="mt-2"><Badge className={STATUS_STYLES[pkg.status]}>{pkg.status}</Badge></div>
                </div>
              </div>

              {pkg.hasLiveData && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Live · React Native Directory</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Weekly Downloads</p><p className="font-semibold text-foreground">{formatDownloads(pkg.weekDownloads)}</p></div>
                    <div><p className="text-xs text-muted-foreground">GitHub Stars</p><p className="flex items-center gap-1 font-semibold text-foreground"><Star size={12} className="text-amber-500" />{pkg.stars?.toLocaleString() ?? "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Last Release</p><p className="font-semibold text-foreground">{formatRelativeDate(pkg.lastRelease)}</p></div>
                    <div><p className="text-xs text-muted-foreground">npm Size</p><p className="font-semibold text-foreground">{formatBytes(pkg.npmSize)}</p></div>
                    {pkg.rnScore !== undefined && <div><p className="text-xs text-muted-foreground">RN Directory Score</p><p className="font-semibold text-foreground">{Math.round(pkg.rnScore * 100)}/100</p></div>}
                    {pkg.isUnmaintained && <div className="col-span-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"><AlertTriangle size={14} /><span className="text-xs font-medium">Marked unmaintained</span></div>}
                    {pkg.isArchived && <div className="col-span-2 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"><AlertTriangle size={14} /><span className="text-xs font-medium">Repository is archived</span></div>}
                    {pkg.isDeprecated && <div className="col-span-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"><AlertTriangle size={14} /><span className="text-xs font-medium">Deprecated on npm{pkg.deprecatedMessage ? `: ${pkg.deprecatedMessage}` : ""}</span></div>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Compatibility</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ label: "New Arch", val: pkg.newArchitecture }, { label: "Expo Compat", val: pkg.expoCompatible }, { label: "Expo Go", val: pkg.expoGo }].map(({ label, val }) => (
                    <div key={label} className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-xs font-medium ${val ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200" : "border-border/60 bg-muted/40 text-muted-foreground/60"}`}>
                      {label}<span>{val ? "✓" : val === undefined ? "—" : "✗"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {pkg.platforms && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Platform Support</p>
                  <div className="flex flex-wrap gap-2">
                    {(["iOS", "Android", "Web", "tvOS", "visionOS"] as const).map((label) => {
                      const key = label.toLowerCase().replace(/os$/, "os") as keyof typeof pkg.platforms;
                      const val = pkg.platforms![key as keyof typeof pkg.platforms];
                      return (
                        <div key={label} className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-xs font-medium ${val ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200" : "border-border/60 bg-muted/40 text-muted-foreground/60"}`}>
                          {label}<span>{val ? "✓" : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                <span className="text-sm font-medium text-foreground">Bundle Impact</span>
                <Badge className={IMPACT_STYLES[pkg.bundleImpact]}>{pkg.bundleImpact}</Badge>
              </div>

              {pkg.rnAlternatives && pkg.rnAlternatives.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Alternatives (RN Directory)</p>
                  {pkg.rnAlternatives.map((alt) => (
                    <div key={alt} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/50 px-3 py-2 text-sm">
                      <span className="text-primary font-medium">{alt}</span><ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}

              {pkg.recommendation !== "—" && (
                <div className="rounded-2xl border border-border/70 bg-muted/50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recommendation</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{pkg.recommendation}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <a href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink size={14} /> View on npm
                </a>
                <a href={`https://reactnative.directory/?search=${encodeURIComponent(pkg.name)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink size={14} /> View on RN Directory
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Compare Modal helpers ──────────────────────────────────────────────────────

function betterNum(av?: number, bv?: number, hi = true): Better {
  if (av === undefined || bv === undefined) return "none";
  if (av === bv) return "equal";
  return (hi ? av > bv : av < bv) ? "a" : "b";
}

// ─── SortHead ─────────────────────────────────────────────────────────────────

function SortHead({
  col,
  label,
  sortCol,
  setSortCol,
}: {
  col: keyof EnrichedInsight;
  label: string;
  sortCol: { col: keyof EnrichedInsight; asc: boolean } | null;
  setSortCol: React.Dispatch<React.SetStateAction<{ col: keyof EnrichedInsight; asc: boolean } | null>>;
}) {
  return (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors"
      onClick={() => setSortCol((p) => p?.col === col ? { col, asc: !p.asc } : { col, asc: true })}
    >
      {label}{sortCol?.col === col ? (sortCol.asc ? " ↑" : " ↓") : ""}
    </TableHead>
  );
}

function CompareRow({ label, va, vb, better }: { label: string; va: React.ReactNode; vb: React.ReactNode; better?: Better }) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-2.5 pr-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{label}</td>
      <td className={`py-2.5 px-3 text-sm text-center font-medium ${better === "a" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>{va}</td>
      <td className={`py-2.5 px-3 text-sm text-center font-medium ${better === "b" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>{vb}</td>
    </tr>
  );
}

// ─── Platform icons (inline SVG brand marks) ──────────────────────────────────

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.52 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
  </svg>
);

const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M17.523 15.341A5.5 5.5 0 0 0 20 10.5a5.5 5.5 0 0 0-5.5-5.5 5.5 5.5 0 0 0-5.5 5.5 5.5 5.5 0 0 0 2.477 4.841L10 20h4l-.477-4.659ZM12 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/>
    <path d="M7.5 9a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5Zm9 0a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5Z"/>
    <path d="M8.5 3.5 7 2M15.5 3.5 17 2"/>
    <circle cx="8.5" cy="3.5" r=".5"/><circle cx="15.5" cy="3.5" r=".5"/>
  </svg>
);

const WindowsIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M3 5.557 9.938 4.5v6.451H3V5.557ZM10.938 4.353 21 2.833V10.95h-10.062V4.353ZM3 11.969h6.938V18.5L3 17.443V11.97ZM10.938 12.087H21v8.083l-10.062-1.447V12.087Z"/>
  </svg>
);

// ─── Platform Dot ─────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  iOS:       "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  Android:   "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  Web:       "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400",
  tvOS:      "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  visionOS:  "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  Windows:   "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  "Expo Go": "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
};

function PlatformDot({ v, label }: { v?: boolean; label?: string }) {
  const color = label && PLATFORM_COLORS[label] ? PLATFORM_COLORS[label] : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400";
  return (
    <td className="py-2.5 px-4 text-center" title={label}>
      {v
        ? <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${color}`}>✓</span>
        : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted/50 text-muted-foreground/30 text-xs">✗</span>
      }
    </td>
  );
}

// ─── Compare Modal ─────────────────────────────────────────────────────────────

function CompareModal({ pkgs, onClose }: { pkgs: [EnrichedInsight, EnrichedInsight]; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const [a, b] = pkgs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-3xl border border-border/70 bg-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border/50 bg-card/90 px-6 py-4 backdrop-blur-xl">
          <h3 className="font-semibold text-foreground">Package Comparison</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">Metric</th>
                <th className="pb-3 px-3 text-center text-sm font-semibold text-foreground">{a.name}</th>
                <th className="pb-3 px-3 text-center text-sm font-semibold text-foreground">{b.name}</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Health Score" va={`${a.healthScore} (${a.healthGrade})`} vb={`${b.healthScore} (${b.healthGrade})`} better={betterNum(a.healthScore, b.healthScore)} />
              <CompareRow label="Status" va={<Badge className={STATUS_STYLES[a.status]}>{a.status}</Badge>} vb={<Badge className={STATUS_STYLES[b.status]}>{b.status}</Badge>} />
              <CompareRow label="New Architecture" va={a.newArchitecture ? "✓" : "✗"} vb={b.newArchitecture ? "✓" : "✗"} better={a.newArchitecture === b.newArchitecture ? "equal" : a.newArchitecture ? "a" : "b"} />
              <CompareRow label="Expo Go" va={a.expoGo != null ? (a.expoGo ? "✓" : "✗") : "—"} vb={b.expoGo != null ? (b.expoGo ? "✓" : "✗") : "—"} />
              <CompareRow label="Bundle Impact" va={<Badge className={IMPACT_STYLES[a.bundleImpact]}>{a.bundleImpact}</Badge>} vb={<Badge className={IMPACT_STYLES[b.bundleImpact]}>{b.bundleImpact}</Badge>} better={betterNum(impactScore(a.bundleImpact), impactScore(b.bundleImpact), false)} />
              <CompareRow label="npm Size" va={formatBytes(a.npmSize)} vb={formatBytes(b.npmSize)} better={a.npmSize && b.npmSize ? betterNum(a.npmSize, b.npmSize, false) : "none"} />
              <CompareRow label="Downloads/wk" va={formatDownloads(a.weekDownloads)} vb={formatDownloads(b.weekDownloads)} better={betterNum(a.weekDownloads, b.weekDownloads)} />
              <CompareRow label="GitHub Stars" va={a.stars?.toLocaleString() ?? "—"} vb={b.stars?.toLocaleString() ?? "—"} better={betterNum(a.stars, b.stars)} />
              <CompareRow label="Last Release" va={formatRelativeDate(a.lastRelease)} vb={formatRelativeDate(b.lastRelease)} />
              {(a.platforms || b.platforms) && (
                <CompareRow label="Platforms"
                  va={a.platforms ? Object.entries(a.platforms).filter(([, v]) => v).map(([k]) => k).join(", ") || "—" : "—"}
                  vb={b.platforms ? Object.entries(b.platforms).filter(([, v]) => v).map(([k]) => k).join(", ") || "—" : "—"}
                />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PackageAnalyzer() {
  const [inputValue, setInputValue] = useState("");
  const [lockValue, setLockValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [latestExpo, setLatestExpo] = useState(56);
  const fileRef = useRef<HTMLInputElement>(null);
  const lockRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [liveMap, setLiveMap] = useState<Record<string, RNDirData>>({});
  const [loadingLive, setLoadingLive] = useState(false);
  const [latestRn, setLatestRn] = useState("0.78.0");

  const [selectedPkg, setSelectedPkg] = useState<EnrichedInsight | null>(null);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<{ col: keyof EnrichedInsight; asc: boolean } | null>(null);
  const [tableTab, setTableTab] = useState("all");
  const [copied, setCopied] = useState(false);
  const [resolvedVers, setResolvedVers] = useState<Record<string, string>>({});
  const [surviveName, setSurviveName] = useState("");
  const [surviveLoading, setSurviveLoading] = useState(false);
  const [surviveError, setSurviveError] = useState<string | null>(null);
  const [surviveReport, setSurviveReport] = useState<SurviveReport | null>(null);

  // Fetch latest expo version
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("https://registry.npmjs.org/expo/latest", { signal: ctrl.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((d: { version?: string } | null) => { const m = majorOf(d?.version); if (m) setLatestExpo(m); })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Fetch latest React Native version
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("https://registry.npmjs.org/react-native/latest", { signal: ctrl.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((d: { version?: string } | null) => { if (d?.version) setLatestRn(d.version); })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Re-analyze when expo version updates
  useEffect(() => {
    if (!analysis || !inputValue) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setAnalysis(analyze(parseJson(inputValue), latestExpo)); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestExpo]);

  // Fetch live data when analysis changes
  useEffect(() => {
    if (!analysis) return;
    const names = analysis.entries.map((e) => e.name);
    if (!names.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingLive(true);
    setLiveMap({});
    fetchRNDirectoryData(names).then(setLiveMap).catch(() => {}).finally(() => setLoadingLive(false));
  }, [analysis]);

  // Load from URL hash on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = /^#q=(.+)/.exec(window.location.hash);
    if (!m) return;
    try {
      const dec = decodeURIComponent(escape(atob(m[1])));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(dec);
      setAnalysis(analyze(parseJson(dec), latestExpo));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doAnalyze = useCallback((raw: string) => {
    try {
      const parsed = parseJson(raw);
      setAnalysis(analyze(parsed, latestExpo));
      setError(null);
      setCompareSet(new Set());
      setSearch("");
    } catch {
      setError("Invalid JSON — please check your package.json formatting.");
    }
  }, [latestExpo]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setInputValue(text);
    doAnalyze(text);
  };

  const handleLock = (raw: string) => {
    const resolved = parseLock(raw);
    if (!Object.keys(resolved).length) setLockError("Could not parse lock file. Only package-lock.json (v2/v3) is supported.");
    else { setResolvedVers(resolved); setLockError(null); }
  };

  const checkSurvivability = useCallback(async () => {
    const name = surviveName.trim();
    if (!name) {
      setSurviveError("Enter an npm package name.");
      setSurviveReport(null);
      return;
    }

    setSurviveLoading(true);
    setSurviveError(null);

    try {
      const response = await fetch(`/api/survive?package=${encodeURIComponent(name)}`);
      const data = (await response.json()) as SurviveReport | { error?: string };

      if (!response.ok) {
        setSurviveReport(null);
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? data.error
            : undefined;
        setSurviveError(message ?? "Could not analyze this package.");
        return;
      }

      setSurviveReport(data as SurviveReport);
    } catch {
      setSurviveReport(null);
      setSurviveError("Failed to fetch survivability report.");
    } finally {
      setSurviveLoading(false);
    }
  }, [surviveName]);

  const enriched = useMemo<EnrichedInsight[]>(() => {
    if (!analysis) return [];
    return analysis.entries.map((e) => enrich(e, liveMap[e.name]));
  }, [analysis, liveMap]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (tableTab === "deps") list = list.filter((e) => e.category === "Dependency");
    else if (tableTab === "devDeps") list = list.filter((e) => e.category === "Dev Dependency");
    else if (tableTab === "issues") list = list.filter((e) => e.status !== "Healthy");
    if (search) list = list.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const av = a[sortCol.col], bv = b[sortCol.col];
        if (av === undefined || bv === undefined) return 0;
        const c = av < bv ? -1 : av > bv ? 1 : 0;
        return sortCol.asc ? c : -c;
      });
    }
    return list;
  }, [enriched, tableTab, search, sortCol]);

  const topBySize = useMemo(() => [...enriched].filter((e) => (e.npmSize ?? 0) > 0).sort((a, b) => (b.npmSize ?? 0) - (a.npmSize ?? 0)).slice(0, 8), [enriched]);
  const topByDl = useMemo(() => [...enriched].filter((e) => (e.weekDownloads ?? 0) > 0).sort((a, b) => (b.weekDownloads ?? 0) - (a.weekDownloads ?? 0)).slice(0, 8), [enriched]);
  const platformPkgs = useMemo(() => enriched.filter((e) => e.platforms), [enriched]);
  const deathChecker = useMemo(() => summarizeDeathChecker(enriched), [enriched]);

  const compareItems = useMemo((): [EnrichedInsight, EnrichedInsight] | null => {
    const [n1, n2] = Array.from(compareSet);
    if (!n2) return null;
    const a = enriched.find((e) => e.name === n1);
    const b = enriched.find((e) => e.name === n2);
    return a && b ? [a, b] : null;
  }, [compareSet, enriched]);

  const toggleCompare = (name: string) => {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else if (next.size < 2) next.add(name);
      return next;
    });
  };

  const exportMd = () => {
    if (!analysis) return;
    const blob = new Blob([toMarkdown(analysis, enriched)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "package-intelligence-report.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = () => {
    try {
      const enc = btoa(unescape(encodeURIComponent(inputValue)));
      const url = `${window.location.href.split("#")[0]}#q=${enc}`;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }).catch(() => fallbackCopy(url));
      } else {
        fallbackCopy(url);
      }
    } catch { /* ignore */ }
  };

  const fallbackCopy = (text: string) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
    document.body.removeChild(ta);
  };

  const hasResolved = Object.keys(resolvedVers).length > 0;
  const hasSize = topBySize.length > 0;
  const hasDl = topByDl.length > 0;
  const hasPlatform = platformPkgs.length > 0;

  return (
    <section id="analyzer" className="mx-auto max-w-6xl py-12 sm:py-16">

      {/* Upload + Overview */}
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <Card className="ai-panel border-border/70 bg-card/90">
          <CardHeader><CardTitle className="text-xl">Upload package.json</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <Tabs defaultValue="upload">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="w-full">Drag & Drop</TabsTrigger>
                <TabsTrigger value="paste" className="w-full">Paste JSON</TabsTrigger>
                <TabsTrigger value="lockfile" className="w-full">Lock File</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4 space-y-4">
                <div
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed px-6 py-10 text-center transition ${isDragging ? "border-primary/80 bg-primary/10" : "border-border/80 bg-muted/55"}`}
                  role="button" tabIndex={0}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f); }}
                >
                  <p className="text-sm font-semibold text-foreground">Drag & Drop or Browse File</p>
                  <p className="text-xs text-muted-foreground">Supports package.json only</p>
                  <Button variant="outline" size="sm" className="mt-2">Browse file</Button>
                  <Input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setInputValue(SAMPLE_PACKAGE_JSON); doAnalyze(SAMPLE_PACKAGE_JSON); }}>
                  Load Sample package.json
                </Button>
              </TabsContent>

              <TabsContent value="paste" className="mt-4 space-y-4">
                <Textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Paste your package.json here…" rows={12} className="font-mono text-xs" />
                <div className="flex flex-wrap gap-3">
                  <Button size="sm" onClick={() => doAnalyze(inputValue)}>Analyze package.json</Button>
                  <Button variant="outline" size="sm" onClick={() => { setInputValue(SAMPLE_PACKAGE_JSON); doAnalyze(SAMPLE_PACKAGE_JSON); }}>Load Sample</Button>
                </div>
              </TabsContent>

              <TabsContent value="lockfile" className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">Paste <code className="font-mono">package-lock.json</code> (npm v7+) to see resolved versions alongside declared versions.</p>
                <Textarea value={lockValue} onChange={(e) => setLockValue(e.target.value)} placeholder="Paste package-lock.json here…" rows={10} className="font-mono text-xs" />
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={() => handleLock(lockValue)} disabled={!lockValue.trim()}>Parse Lock File</Button>
                  <Button variant="outline" size="sm" onClick={() => lockRef.current?.click()}>Browse</Button>
                  <Input ref={lockRef} type="file" accept="application/json,.lock" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; void f.text().then((t) => { setLockValue(t); handleLock(t); }); }} />
                </div>
                {lockError && <p className="text-sm text-rose-500">{lockError}</p>}
                {hasResolved && <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ Loaded {Object.keys(resolvedVers).length} resolved versions.</p>}
              </TabsContent>
            </Tabs>
            {error && <p className="text-sm text-rose-500">{error}</p>}
          </CardContent>
        </Card>

        <Card className="ai-panel border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Project Overview</CardTitle>
            {loadingLive && <span className="flex items-center gap-1.5 text-xs text-primary animate-pulse"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" />Fetching live data…</span>}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {!analysis ? (
              <div className="rounded-3xl border border-border/70 bg-muted/55 px-4 py-6 text-sm text-muted-foreground sm:col-span-2">Upload or paste a valid package.json file to generate insights.</div>
            ) : (
              [
                { label: "Dependencies", value: analysis.depCount },
                { label: "Dev Dependencies", value: analysis.devDepCount },
                { label: "Health Score", value: `${analysis.avgHealth}/100` },
                { label: "Dependency Death Risk", value: `${deathChecker.avgRisk}/100 (${deathChecker.riskLevel})` },
                { label: "Health Report", value: `${deathChecker.healthScore}/100` },
                { label: "Expo Compatibility", value: `${analysis.expoCompatPct}%` },
                { label: "New Architecture Ready", value: `${analysis.newArchPct}%` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-3xl border border-border/70 bg-muted/55 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="ai-panel mt-8 border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle size={20} className="text-amber-500" />
            Will This Package Survive?
          </CardTitle>
          <p className="text-sm text-muted-foreground">Paste an npm package name to check release recency, bus factor, contributors, and risk level.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={surviveName}
              onChange={(e) => setSurviveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void checkSurvivability(); }}
              placeholder="e.g. react-native-camera"
              className="sm:max-w-md"
            />
            <Button size="sm" onClick={() => void checkSurvivability()} disabled={surviveLoading}>
              {surviveLoading ? "Checking..." : "Check package"}
            </Button>
          </div>

          {surviveError && <p className="text-sm text-rose-500">{surviveError}</p>}

          {surviveReport && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last Release</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatRelativeDate(surviveReport.lastRelease)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bus Factor</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{surviveReport.busFactor ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contributors</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{surviveReport.contributorCount ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Risk Level</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={RISK_LEVEL_STYLES[surviveReport.riskLevel]}>{surviveReport.riskLevel}</Badge>
                  <span className="text-sm font-medium text-foreground">{surviveReport.riskScore}/100</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {analysis && (
        <>

          {/* Upgrade Manager */}
          <Card className="ai-panel mt-8 border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ArrowUpCircle size={20} className="text-primary" />
                Upgrade Manager
              </CardTitle>
              <p className="text-sm text-muted-foreground">Step-by-step upgrade paths for Expo SDK and React Native.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Expo Upgrade Panel — only for Expo projects */}
              {analysis.projectType === "Expo" && (() => {
                const from = analysis.expoInstalledMajor;
                const to = analysis.latestExpoMajor;
                const isLatest = from !== null && from >= to;
                const upgradeUrl = from ? `https://docs.expo.dev/bare/upgrade/?fromSdk=${from}&toSdk=${to}` : "https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/";
                return (
                  <div className={`rounded-2xl border p-4 ${isLatest ? "border-emerald-300/70 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10" : "border-amber-300/70 bg-amber-50/60 dark:border-amber-400/40 dark:bg-amber-500/10"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚡</span>
                        <div>
                          <p className="font-semibold text-foreground">Expo SDK</p>
                          <p className="text-sm text-muted-foreground">
                            {from ? `SDK ${from}` : "Not detected"} → <span className="font-semibold text-foreground">SDK {to}</span>
                          </p>
                        </div>
                        {isLatest
                          ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">✓ Up to date</Badge>
                          : <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Upgrade available</Badge>}
                      </div>
                      <a href={upgradeUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted">
                        <ExternalLink size={14} />
                        {isLatest ? "View Changelog" : `Upgrade SDK ${from} → ${to}`}
                      </a>
                    </div>
                    {!isLatest && from && (
                      <div className="mt-3 space-y-1.5 rounded-xl bg-background/60 p-3 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">Upgrade steps:</p>
                        <p>1. Run <code className="rounded bg-muted px-1 py-0.5 font-mono">npx expo install expo@~{to}.0.0</code></p>
                        <p>2. Run <code className="rounded bg-muted px-1 py-0.5 font-mono">npx expo-doctor</code> to check compatibility</p>
                        <p>3. Follow the official upgrade guide linked above</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* React Native Upgrade Panel — only for bare RN CLI projects */}
              {analysis.projectType === "React Native" && (() => {
                const fromRaw = analysis.rnVersionRaw?.replace(/[^0-9.]/g, "");
                const isLatest = fromRaw === latestRn;
                const upgradeUrl = fromRaw
                  ? `https://react-native-community.github.io/upgrade-helper/?from=${fromRaw}&to=${latestRn}`
                  : "https://react-native-community.github.io/upgrade-helper/";
                return (
                  <div className={`rounded-2xl border p-4 ${isLatest ? "border-emerald-300/70 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10" : "border-sky-300/70 bg-sky-50/60 dark:border-sky-400/40 dark:bg-sky-500/10"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📱</span>
                        <div>
                          <p className="font-semibold text-foreground">React Native</p>
                          <p className="text-sm text-muted-foreground">
                            {fromRaw ? `v${fromRaw}` : "Not detected"} → <span className="font-semibold text-foreground">v{latestRn}</span>
                          </p>
                        </div>
                        {isLatest
                          ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">✓ Up to date</Badge>
                          : <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">Upgrade available</Badge>}
                      </div>
                      <a href={upgradeUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted">
                        <ExternalLink size={14} />
                        {isLatest ? "View Upgrade Helper" : `Open Upgrade Helper`}
                      </a>
                    </div>
                    {!isLatest && fromRaw && (
                      <div className="mt-3 space-y-1.5 rounded-xl bg-background/60 p-3 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">Upgrade steps:</p>
                        <p>1. Use the <strong>Upgrade Helper</strong> link above to see every file diff</p>
                        <p>2. Run <code className="rounded bg-muted px-1 py-0.5 font-mono">npx react-native upgrade</code> or apply diffs manually</p>
                        <p>3. Update native iOS/Android files as instructed in the diff</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {analysis.projectType === "Unknown" && (
                <p className="text-sm text-muted-foreground">Could not detect Expo or React Native version. Ensure your package.json includes <code className="font-mono">expo</code> or <code className="font-mono">react-native</code> in dependencies.</p>
              )}
            </CardContent>
          </Card>

          {/* Dependency Death Checker */}
          <Card className="ai-panel mt-8 border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle size={20} className="text-rose-500" />
                Dependency Death Checker
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste package.json to detect archived, unmaintained, and deprecated packages with a project-wide risk score.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Archived</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{deathChecker.archived}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Unmaintained</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{deathChecker.unmaintained}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Deprecated</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{deathChecker.deprecated}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Risk Score</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-2xl font-semibold text-foreground">{deathChecker.avgRisk}/100</p>
                    <Badge className={RISK_LEVEL_STYLES[deathChecker.riskLevel]}>{deathChecker.riskLevel}</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Health report score: <span className="font-semibold text-foreground">{deathChecker.healthScore}/100</span>
              </div>

              {enriched.filter((item) => (item.deathRiskLevel ?? "Low") === "High").length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Highest risk dependencies</p>
                  {enriched
                    .filter((item) => (item.deathRiskLevel ?? "Low") === "High")
                    .sort((a, b) => (b.deathRiskScore ?? 0) - (a.deathRiskScore ?? 0))
                    .slice(0, 5)
                    .map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setSelectedPkg(item)}
                        className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-muted/55 px-3 py-2 text-left text-sm transition hover:bg-muted/70"
                      >
                        <span className="font-medium text-foreground">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{item.deathRiskScore ?? 0}/100</span>
                          <Badge className={RISK_LEVEL_STYLES[item.deathRiskLevel ?? "Low"]}>{item.deathRiskLevel ?? "Low"}</Badge>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations + Bundle */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="ai-panel border-border/70 bg-card/90">
              <CardHeader><CardTitle className="text-xl">Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {analysis.recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No Expo migration opportunities detected.</p>
                ) : (
                  analysis.recommendations.slice(0, 3).map((item) => (
                    <div key={item.name} className="rounded-3xl border border-border/70 bg-muted/50 p-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        <span>{item.name}</span><span className="text-muted-foreground">→</span><span className="text-primary">{item.recommendation}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">Better Expo integration, active maintenance, and New Architecture support.</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="ai-panel border-border/70 bg-card/90">
              <CardHeader><CardTitle className="text-xl">Bundle Impact</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-3xl border border-border/70 bg-muted/55 p-4">
                  {[{ label: "Estimated APK Impact", v: analysis.apkImpact }, { label: "Estimated IPA Impact", v: analysis.ipaImpact }].map(({ label, v }) => (
                    <div key={label} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{label}</span><Badge className={IMPACT_STYLES[v]}>{v}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-semibold text-foreground">Top heavy packages</p>
                <div className="space-y-2">
                  {analysis.topHeavy.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-3xl border border-border/70 bg-muted/50 px-3 py-2 text-sm">
                      <span className="truncate">{item.name}</span><Badge className={IMPACT_STYLES[item.bundleImpact]}>{item.bundleImpact}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bundle Size Heatmap */}
          <Card className="ai-panel mt-8 border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart2 size={18} className="text-primary" />Bundle Size Heatmap
                {hasSize
                  ? <span className="text-xs font-normal text-muted-foreground ml-1">(npm install size — live)</span>
                  : <span className="text-xs font-normal text-muted-foreground ml-1">(estimated impact · live sizes load after analysis)</span>
                }
                {loadingLive && <span className="ml-auto text-xs text-muted-foreground animate-pulse">Fetching live data…</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasSize ? (
                <div className="space-y-3">
                  {(() => {
                    const max = Math.max(...topBySize.map((e) => e.npmSize ?? 0));
                    return topBySize.map((pkg) => {
                      const pct = max > 0 ? ((pkg.npmSize ?? 0) / max) * 100 : 0;
                      const bar = pct > 70 ? "bg-rose-500 dark:bg-rose-400" : pct > 40 ? "bg-amber-500 dark:bg-amber-400" : "bg-emerald-500 dark:bg-emerald-400";
                      return (
                        <div key={pkg.name} className="flex items-center gap-3">
                          <button onClick={() => setSelectedPkg(pkg)} className="w-44 shrink-0 truncate text-right text-sm font-medium text-foreground hover:text-primary transition">{pkg.name}</button>
                          <div className="flex-1 h-4 rounded-full bg-muted/60 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{formatBytes(pkg.npmSize)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  {(["High", "Medium", "Low"] as const).map((level) => {
                    const pkgsAtLevel = enriched.filter((e) => e.bundleImpact === level).slice(0, 5);
                    if (!pkgsAtLevel.length) return null;
                    const barColor = level === "High" ? "bg-rose-500 dark:bg-rose-400" : level === "Medium" ? "bg-amber-500 dark:bg-amber-400" : "bg-emerald-500 dark:bg-emerald-400";
                    const barPct = level === "High" ? 90 : level === "Medium" ? 55 : 25;
                    return pkgsAtLevel.map((pkg) => (
                      <div key={pkg.name} className="flex items-center gap-3">
                        <button onClick={() => setSelectedPkg(pkg)} className="w-44 shrink-0 truncate text-right text-sm font-medium text-foreground hover:text-primary transition">{pkg.name}</button>
                        <div className="flex-1 h-4 rounded-full bg-muted/60 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${barPct}%` }} />
                        </div>
                        <Badge className={IMPACT_STYLES[level]}>{level}</Badge>
                      </div>
                    ));
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download Rankings */}
          {hasDl && (
            <Card className="ai-panel mt-8 border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Star size={18} className="text-amber-500" />Download Rankings
                  <span className="text-xs font-normal text-muted-foreground ml-1">(weekly via npm)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const max = Math.max(...topByDl.map((e) => e.weekDownloads ?? 0));
                    return topByDl.map((pkg, i) => {
                      const pct = max > 0 ? ((pkg.weekDownloads ?? 0) / max) * 100 : 0;
                      return (
                        <div key={pkg.name} className="flex items-center gap-3">
                          <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                          <button onClick={() => setSelectedPkg(pkg)} className="w-44 shrink-0 truncate text-sm font-medium text-foreground hover:text-primary transition">{pkg.name}</button>
                          <div className="flex-1 h-3 rounded-full bg-muted/60 overflow-hidden"><div className="h-full rounded-full bg-primary/70 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                          <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{formatDownloads(pkg.weekDownloads)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Compatibility Matrix */}
          {platformPkgs.length > 0 && (
            <Card className="ai-panel mt-8 border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Smartphone size={18} className="text-primary" />Platform Compatibility Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/70">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Package</th>
                        {[
                          ["iOS",      <AppleIcon key="ios" />],
                          ["Android",  <AndroidIcon key="and" />],
                          ["Web",      <Globe key="web" size={13} />],
                          ["tvOS",     <Tv key="tv" size={13} />],
                          ["visionOS", <Glasses key="vis" size={13} />],
                          ["Windows",  <WindowsIcon key="win" />],
                          ["Expo Go",  null],
                        ].map(([label, Icon]) => (
                          <th key={String(label)} className="py-3 px-4 text-center font-semibold text-muted-foreground">
                            <span className="flex items-center justify-center gap-1">{Icon}{String(label)}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {platformPkgs.map((pkg) => (
                        <tr key={pkg.name} className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedPkg(pkg)}>
                          <td className="py-2.5 px-4 text-xs font-medium text-foreground max-w-[160px] truncate">{pkg.name}</td>
                          <PlatformDot v={pkg.platforms?.ios} label="iOS" />
                          <PlatformDot v={pkg.platforms?.android} label="Android" />
                          <PlatformDot v={pkg.platforms?.web} label="Web" />
                          <PlatformDot v={pkg.platforms?.tvos} label="tvOS" />
                          <PlatformDot v={pkg.platforms?.visionos} label="visionOS" />
                          <PlatformDot v={pkg.platforms?.windows} label="Windows" />
                          <PlatformDot v={pkg.expoGo ?? undefined} label="Expo Go" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Migration + Risk */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <Card className="ai-panel border-border/70 bg-card/90">
              <CardHeader><CardTitle className="text-xl">Expo Migration Opportunities</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Potential improvements</span>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">{analysis.migrations.length}</Badge>
                </div>
                {analysis.migrations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No migration opportunities found.</p>
                ) : analysis.migrations.map((m) => (
                  <div key={m.current} className="rounded-3xl border border-border/70 bg-muted/50 px-4 py-3 text-sm">
                    <div className="text-xs text-muted-foreground">Replace:</div>
                    <div className="mt-1 font-semibold text-foreground">{m.current} <span className="text-muted-foreground">→</span> <span className="text-primary">{m.alternative}</span></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="ai-panel border-border/70 bg-card/90">
              <CardHeader><CardTitle className="text-xl">Risk Detection</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {analysis.risks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No risks detected. Dependencies look healthy.</p>
                ) : analysis.risks.map((r) => (
                  <div key={r.name} className="rounded-3xl border border-border/70 bg-muted/50 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{r.name}</span>
                      <Badge className={STATUS_STYLES[r.status]}>{r.status}</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">{r.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Duplicate Detection */}
          {analysis.duplicates.length > 0 && (
            <Card className="ai-panel mt-8 border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Copy size={18} className="text-amber-500" />Duplicate Functionality Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Multiple packages serving the same purpose found. Consider consolidating.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.duplicates.map((g) => (
                    <div key={g.category} className="rounded-3xl border border-amber-200/70 bg-amber-50/50 p-4 dark:border-amber-400/30 dark:bg-amber-500/10">
                      <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-2">{g.category}</p>
                      {g.packages.map((pkg) => <p key={pkg} className="text-sm font-medium text-foreground">• {pkg}</p>)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export / Share bar (moved above table) */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BarChart2 size={16} className="text-primary" />
              {enriched.length} packages analysed
              {loadingLive ? (
                <span className="text-xs text-muted-foreground animate-pulse">(loading live data…)</span>
              ) : enriched.filter((e) => e.hasLiveData).length > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">· {enriched.filter((e) => e.hasLiveData).length} with live data</span>
              )}
            </div>
            <div className="flex flex-1 justify-end gap-2">
              {compareSet.size > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCompareSet(new Set())}>
                  Clear compare ({compareSet.size}/2)
                </Button>
              )}
              {compareSet.size === 2 && (
                <Button size="sm" className="ml-2" onClick={() => setShowCompare(true)}>
                  Compare ({compareSet.size})
                </Button>
              )}
              {compareSet.size === 1 && <span className="self-center text-xs text-muted-foreground">Select 1 more to compare</span>}
              <Button variant="outline" size="sm" onClick={exportMd}><Download size={14} className="mr-1.5" />Export MD</Button>
              <Button variant="outline" size="sm" onClick={share}>
                {copied ? <><Check size={14} className="mr-1.5 text-emerald-500" />Copied!</> : <><Share2 size={14} className="mr-1.5" />Share Link</>}
              </Button>
            </div>
          </div>

          {/* Package Analysis Table */}
          <Card className="ai-panel mt-4 border-border/70 bg-card/90">
            <CardHeader><CardTitle className="text-xl">Package Analysis Table</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search packages…" className="max-w-xs" />
                <div className="flex gap-1.5">
                  {[{ key: "all", label: "All" }, { key: "deps", label: "Dependencies" }, { key: "devDeps", label: "Dev" }, { key: "issues", label: "Issues" }].map(({ key, label }) => (
                    <button key={key} onClick={() => setTableTab(key)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${tableTab === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <SortHead col="name" label="Package" sortCol={sortCol} setSortCol={setSortCol} />
                      <TableHead>Version</TableHead>
                      {hasResolved && <TableHead>Resolved</TableHead>}
                      <TableHead>Cat.</TableHead>
                      <SortHead col="healthScore" label="Health" sortCol={sortCol} setSortCol={setSortCol} />
                      <TableHead>Expo Go</TableHead>
                      <TableHead>New Arch</TableHead>
                      {hasPlatform && <TableHead className="text-center"><span className="flex items-center justify-center gap-1"><AppleIcon />iOS</span></TableHead>}
                      {hasPlatform && <TableHead className="text-center"><span className="flex items-center justify-center gap-1"><AndroidIcon />Android</span></TableHead>}
                      {hasPlatform && <TableHead className="text-center"><span className="flex items-center justify-center gap-1"><Globe size={12} />Web</span></TableHead>}
                      {hasPlatform && <TableHead className="text-center">tvOS</TableHead>}
                      {hasPlatform && <TableHead className="text-center">visionOS</TableHead>}
                      {hasPlatform && <TableHead className="text-center"><span className="flex items-center justify-center gap-1"><WindowsIcon />Win</span></TableHead>}
                      <TableHead>Bundle</TableHead>
                      {hasSize && <TableHead>npm Size</TableHead>}
                      {hasDl && <TableHead>Downloads</TableHead>}
                      {hasDl && <TableHead>Last Release</TableHead>}
                      <TableHead>Death Risk</TableHead>
                      <TableHead>Flags</TableHead>
                      <SortHead col="status" label="Status" sortCol={sortCol} setSortCol={setSortCol} />
                      <TableHead>Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.name} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedPkg(item)}>
                        <TableCell onClick={(e) => { e.stopPropagation(); toggleCompare(item.name); }}>
                          <input type="checkbox" readOnly checked={compareSet.has(item.name)} className="cursor-pointer accent-primary" aria-label={`Compare ${item.name}`} />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <span className="flex items-center gap-1">{item.name}<ChevronRight size={12} className="text-muted-foreground opacity-50" /></span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{item.version}</TableCell>
                        {hasResolved && <TableCell className="font-mono text-xs text-muted-foreground">{resolvedVers[item.name] ?? "—"}</TableCell>}
                        <TableCell className="text-xs text-muted-foreground">{item.category === "Dev Dependency" ? "Dev" : "Dep"}</TableCell>
                        <TableCell>{item.healthScore}/100 <span className="text-xs text-muted-foreground">({item.healthGrade})</span></TableCell>
                        <TableCell>{item.hasLiveData ? (item.expoGo ? <span className="text-emerald-500">✓</span> : <span className="text-muted-foreground/40">✗</span>) : <span className="text-muted-foreground/40">—</span>}</TableCell>
                        <TableCell>{item.newArchitecture ? <span className="text-emerald-500">✓</span> : <span className="text-muted-foreground/40">✗</span>}</TableCell>
                        {hasPlatform && <TableCell className="text-center">{item.platforms ? (item.platforms.ios ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">✓</span> : <span className="text-muted-foreground/30 text-xs">✗</span>) : <span className="text-muted-foreground/20 text-xs">—</span>}</TableCell>}
                        {hasPlatform && <TableCell className="text-center">{item.platforms ? (item.platforms.android ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold">✓</span> : <span className="text-muted-foreground/30 text-xs">✗</span>) : <span className="text-muted-foreground/20 text-xs">—</span>}</TableCell>}
                        {hasPlatform && <TableCell className="text-center">{item.platforms ? (item.platforms.web ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold">✓</span> : <span className="text-muted-foreground/30 text-xs">✗</span>) : <span className="text-muted-foreground/20 text-xs">—</span>}</TableCell>}
                        {hasPlatform && <TableCell className="text-center">{item.platforms ? (item.platforms.tvos ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold">✓</span> : <span className="text-muted-foreground/30 text-xs">✗</span>) : <span className="text-muted-foreground/20 text-xs">—</span>}</TableCell>}
                        {hasPlatform && <TableCell className="text-center">{item.platforms ? (item.platforms.visionos ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">✓</span> : <span className="text-muted-foreground/30 text-xs">✗</span>) : <span className="text-muted-foreground/20 text-xs">—</span>}</TableCell>}
                        {hasPlatform && <TableCell className="text-center">{item.platforms ? (item.platforms.windows ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold">✓</span> : <span className="text-muted-foreground/30 text-xs">✗</span>) : <span className="text-muted-foreground/20 text-xs">—</span>}</TableCell>}
                        <TableCell><Badge className={IMPACT_STYLES[item.bundleImpact]}>{item.bundleImpact}</Badge></TableCell>
                        {hasSize && <TableCell className="text-xs text-muted-foreground">{formatBytes(item.npmSize)}</TableCell>}
                        {hasDl && <TableCell className="text-xs text-muted-foreground">{formatDownloads(item.weekDownloads)}</TableCell>}
                        {hasDl && <TableCell className="text-xs text-muted-foreground">{formatRelativeDate(item.lastRelease)}</TableCell>}
                        <TableCell>
                          <Badge className={RISK_LEVEL_STYLES[item.deathRiskLevel ?? "Low"]}>
                            {(item.deathRiskScore ?? 0)}/100
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {[item.isArchived ? "Archived" : null, item.isDeprecated ? "Deprecated" : null, item.isUnmaintained ? "Unmaintained" : null].filter(Boolean).join(" · ") || "Healthy"}
                        </TableCell>
                        <TableCell><Badge className={STATUS_STYLES[item.status]}>{item.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.recommendation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No packages match your search.</p>}
              </div>
              <p className="text-xs text-muted-foreground">Click a row to open full package details. Check up to 2 packages to compare side by side.</p>
            </CardContent>
          </Card>
        </>
      )}

      <DeepDivePanel pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
      {showCompare && compareItems && <CompareModal pkgs={compareItems} onClose={() => setShowCompare(false)} />}
    </section>
  );
}
