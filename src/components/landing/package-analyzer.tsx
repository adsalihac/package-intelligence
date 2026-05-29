"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type PackageCategory = "Dependency" | "Dev Dependency";
type BundleImpact = "Low" | "Medium" | "High";
type PackageStatus = "Healthy" | "Needs Review" | "Deprecated" | "Archived" | "Outdated";

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

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type ProjectType = "Expo" | "React Native" | "Unknown";

const demoAlternatives: Record<string, { alternative: string }> = {
  "react-native-fast-image": { alternative: "expo-image" },
  "react-native-video": { alternative: "expo-video" },
  "react-native-image-picker": { alternative: "expo-image-picker" },
  "react-native-document-picker": { alternative: "expo-document-picker" },
  "react-native-linear-gradient": { alternative: "expo-linear-gradient" },
  "react-native-camera": { alternative: "expo-camera" },
};

const archivedPackages = new Set(["react-native-camera"]);
const deprecatedPackages = new Set(["react-native-document-picker"]);
const heavyPackages = new Set([
  "react-native-video",
  "react-native-fast-image",
  "react-native-camera",
]);

const samplePackageJson = JSON.stringify(
  {
    name: "expo-native-lens",
    dependencies: {
      expo: "~51.0.4",
      "expo-splash-screen": "~0.27.5",
      "react-native": "0.74.2",
      "react-native-fast-image": "^8.6.3",
      "react-native-video": "^6.0.0",
      "react-native-image-picker": "^7.0.0",
      "react-native-linear-gradient": "^2.8.3",
      "react-native-document-picker": "^9.1.1",
      "react-native-camera": "^4.2.1",
      "react-native-reanimated": "^3.12.0",
    },
    devDependencies: {
      typescript: "^5.5.4",
      eslint: "^9.0.0",
      jest: "^29.7.0",
      "@testing-library/react-native": "^12.5.1",
    },
  },
  null,
  2
);

const statusBadgeStyles: Record<PackageStatus, string> = {
  Healthy:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  "Needs Review":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  Deprecated:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-400/15 dark:text-rose-200",
  Archived:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-200",
  Outdated:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-200",
};

const impactBadgeStyles: Record<BundleImpact, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  Medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  High: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-400/15 dark:text-rose-200",
};

const gradeFromScore = (score: number) => {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
};

const hashString = (value: string) =>
  Array.from(value).reduce((acc, char) => (acc + char.charCodeAt(0) * 7) % 100, 0);

const toImpactScore = (impact: BundleImpact) =>
  impact === "High" ? 3 : impact === "Medium" ? 2 : 1;

const parsePackageJson = (value: string) => {
  const parsed = JSON.parse(value) as PackageJson;
  return {
    dependencies: parsed.dependencies ?? {},
    devDependencies: parsed.devDependencies ?? {},
  };
};

const getMajorVersion = (version: string | undefined) => {
  if (!version) return null;
  const match = /(\d+)/.exec(version);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
};

const detectProjectType = (payload: PackageJson): ProjectType => {
  const deps = payload.dependencies ?? {};
  if (typeof deps.expo === "string") return "Expo";
  if (typeof deps["react-native"] === "string") return "React Native";
  return "Unknown";
};

const buildPackage = (
  name: string,
  version: string,
  category: PackageCategory
): PackageInsight => {
  const hash = hashString(name);
  const alternative = demoAlternatives[name]?.alternative;
  const isArchived = archivedPackages.has(name);
  const isDeprecated = deprecatedPackages.has(name);

  const expoCompatible =
    name.startsWith("expo-") || Boolean(alternative) || hash > 58;
  const newArchitecture =
    !isArchived && !isDeprecated && (name.startsWith("expo-") || hash > 62);

  const bundleImpact: BundleImpact = heavyPackages.has(name)
    ? "High"
    : hash > 70
      ? "Medium"
      : "Low";

  let healthScore = 60 + (hash % 31);
  if (expoCompatible) healthScore += 4;
  if (newArchitecture) healthScore += 4;
  if (alternative) healthScore += 3;
  if (bundleImpact === "High") healthScore -= 8;
  if (bundleImpact === "Medium") healthScore -= 4;

  if (isDeprecated) healthScore = 28;
  if (isArchived) healthScore = 22;

  healthScore = Math.max(0, Math.min(100, healthScore));

  const status: PackageStatus = isDeprecated
    ? "Deprecated"
    : isArchived
      ? "Archived"
      : healthScore < 50
        ? "Needs Review"
        : healthScore < 65
          ? "Outdated"
          : "Healthy";

  const recommendation = alternative
    ? `Use ${alternative}`
    : status === "Outdated"
      ? "Upgrade to latest release"
      : status === "Needs Review"
        ? "Audit usage and verify maintenance"
        : status === "Archived"
          ? "Replace or fork for maintenance"
          : status === "Deprecated"
            ? "Plan migration away"
            : "—";

  return {
    name,
    version,
    category,
    healthScore,
    healthGrade: gradeFromScore(healthScore),
    expoCompatible,
    newArchitecture,
    bundleImpact,
    status,
    recommendation,
  };
};

const analyzePackages = (payload: PackageJson, latestExpoMajor = 56) => {
  const entries: PackageInsight[] = [];
  Object.entries(payload.dependencies ?? {}).forEach(([name, version]) => {
    entries.push(buildPackage(name, version, "Dependency"));
  });
  Object.entries(payload.devDependencies ?? {}).forEach(([name, version]) => {
    entries.push(buildPackage(name, version, "Dev Dependency"));
  });

  const dependencyCount = Object.keys(payload.dependencies ?? {}).length;
  const devDependencyCount = Object.keys(payload.devDependencies ?? {}).length;
  const totalPackages = entries.length || 1;

  const averageHealth = Math.round(
    entries.reduce((acc, item) => acc + item.healthScore, 0) / totalPackages
  );

  const expoCompatibilityPercent = Math.round(
    (entries.filter((item) => item.expoCompatible).length / totalPackages) * 100
  );

  const newArchitecturePercent = Math.round(
    (entries.filter((item) => item.newArchitecture).length / totalPackages) *
      100
  );

  const riskScore = entries.some(
    (item) => item.status === "Deprecated" || item.status === "Archived"
  )
    ? "High"
    : entries.some(
          (item) => item.status === "Needs Review" || item.status === "Outdated"
        )
      ? "Medium"
      : "Low";

  const recommendations = entries.filter((item) =>
    item.recommendation.startsWith("Use ")
  );

  const migrationOpportunities = recommendations.map((item) => ({
    current: item.name,
    alternative: demoAlternatives[item.name]?.alternative ?? item.recommendation,
  }));

  const heavyPackagesList = entries
    .slice()
    .sort(
      (a, b) =>
        toImpactScore(b.bundleImpact) - toImpactScore(a.bundleImpact) ||
        b.healthScore - a.healthScore
    )
    .slice(0, 4);

  const highImpactCount = entries.filter((item) => item.bundleImpact === "High")
    .length;
  const mediumImpactCount = entries.filter(
    (item) => item.bundleImpact === "Medium"
  ).length;

  const apkImpact: BundleImpact =
    highImpactCount >= 3
      ? "High"
      : highImpactCount >= 1 || mediumImpactCount >= 3
        ? "Medium"
        : "Low";
  const ipaImpact: BundleImpact =
    highImpactCount >= 2
      ? "High"
      : highImpactCount >= 1 || mediumImpactCount >= 4
        ? "Medium"
        : "Low";

  const riskDetections = entries
    .filter((item) => item.status !== "Healthy")
    .map((item) => ({
      name: item.name,
      status: item.status,
      detail:
        item.status === "Deprecated"
          ? "Marked deprecated in registry metadata."
          : item.status === "Archived"
            ? "Repository archived or unmaintained."
            : item.status === "Needs Review"
              ? "Limited activity and compatibility signals."
              : "Update recommended to avoid compatibility drift.",
    }));

    const dependencies = payload.dependencies ?? {};
    const projectType = detectProjectType(payload);
    const expoVersionRaw = dependencies.expo;
    const expoInstalledMajor = getMajorVersion(expoVersionRaw);
    const isExpoLatest =
      projectType === "Expo" &&
      expoInstalledMajor !== null &&
      expoInstalledMajor >= latestExpoMajor;
    const expoUpgradeNeeded =
      projectType === "Expo" &&
      expoInstalledMajor !== null &&
      expoInstalledMajor < latestExpoMajor;

  return {
    entries,
    dependencyCount,
    devDependencyCount,
    averageHealth,
    expoCompatibilityPercent,
    newArchitecturePercent,
    riskScore,
    recommendations,
    migrationOpportunities,
    heavyPackagesList,
    apkImpact,
    ipaImpact,
    riskDetections,
    projectType,
    expoVersionRaw,
    expoInstalledMajor,
    latestExpoMajor,
    isExpoLatest,
    expoUpgradeNeeded,
  };
};

export function PackageAnalyzer() {
  const [inputValue, setInputValue] = useState(samplePackageJson);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState(() =>
    analyzePackages(parsePackageJson(samplePackageJson), 56)
  );
  const [latestExpoMajor, setLatestExpoMajor] = useState(56);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadLatestExpoVersion = async () => {
      try {
        const response = await fetch("https://registry.npmjs.org/expo/latest", {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = (await response.json()) as { version?: string };
        const major = getMajorVersion(data.version);
        if (major !== null) {
          setLatestExpoMajor(major);
        }
      } catch {
        // Keep fallback SDK major when network request fails.
      }
    };

    void loadLatestExpoVersion();

    return () => controller.abort();
  }, []);

  const handleAnalyze = (value: string) => {
    try {
      const parsed = parsePackageJson(value);
      setAnalysis(analyzePackages(parsed, latestExpoMajor));
      setError(null);
    } catch {
      setError("Invalid JSON. Please check your package.json formatting.");
    }
  };

  useEffect(() => {
    handleAnalyze(inputValue);
    // latestExpoMajor should refresh Expo SDK status in existing results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestExpoMajor]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setInputValue(text);
    handleAnalyze(text);
  };

  const overviewCards = useMemo(
    () => [
      { label: "Dependencies", value: analysis.dependencyCount },
      { label: "Dev Dependencies", value: analysis.devDependencyCount },
      { label: "Health Score", value: `${analysis.averageHealth}/100` },
      { label: "Risk Score", value: analysis.riskScore },
      {
        label: "Expo Compatibility",
        value: `${analysis.expoCompatibilityPercent}%`,
      },
      {
        label: "New Architecture Ready",
        value: `${analysis.newArchitecturePercent}%`,
      },
    ],
    [analysis]
  );

  let expoUpgradePanel: React.ReactNode;
  if (analysis.projectType === "Expo") {
    if (analysis.expoUpgradeNeeded) {
      expoUpgradePanel = (
        <div className="rounded-2xl border border-amber-300/70 bg-amber-100/60 px-4 py-3 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
          Expo SDK is behind the latest release. Upgrade from SDK {analysis.expoInstalledMajor} to SDK {analysis.latestExpoMajor}.
        </div>
      );
    } else if (analysis.isExpoLatest) {
      expoUpgradePanel = (
        <div className="rounded-2xl border border-emerald-300/70 bg-emerald-100/60 px-4 py-3 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          Expo SDK is up to date with the latest release.
        </div>
      );
    } else {
      expoUpgradePanel = (
        <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3 text-muted-foreground">
          Expo is detected but the version format could not be parsed automatically.
        </div>
      );
    }
  } else if (analysis.projectType === "React Native") {
    expoUpgradePanel = (
      <div className="rounded-2xl border border-sky-300/70 bg-sky-100/60 px-4 py-3 text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-200">
        React Native project detected without Expo. SDK upgrade check applies only to Expo projects.
      </div>
    );
  } else {
    expoUpgradePanel = (
      <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3 text-muted-foreground">
        Could not identify Expo or React Native dependencies from this package.json.
      </div>
    );
  }

  return (
    <section id="analyzer" className="mx-auto max-w-6xl py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <Card className="ai-panel border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Upload package.json</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs defaultValue="upload">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="w-full">
                  Drag & Drop
                </TabsTrigger>
                <TabsTrigger value="paste" className="w-full">
                  Paste JSON
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-4 space-y-4">
                <div
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed px-6 py-10 text-center transition ${
                    isDragging
                      ? "border-primary/80 bg-primary/10"
                      : "border-border/80 bg-muted/55"
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) {
                      void handleFile(file);
                    }
                  }}
                >
                  <p className="text-sm font-semibold text-foreground">
                    Drag & Drop or Browse File
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports package.json only
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Browse file
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleFile(file);
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      setInputValue(samplePackageJson);
                      handleAnalyze(samplePackageJson);
                    }}
                  >
                    Sample package.json
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAnalyze(inputValue)}
                  >
                    Analyze current data
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="paste" className="mt-4 space-y-4">
                <Textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  rows={12}
                  className="font-mono text-xs"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" onClick={() => handleAnalyze(inputValue)}>
                    Analyze package.json
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInputValue(samplePackageJson);
                      handleAnalyze(samplePackageJson);
                    }}
                  >
                    Use sample package.json
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            {error ? (
              <p className="text-sm text-rose-500">{error}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="ai-panel border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {overviewCards.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-border/70 bg-muted/55 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="ai-panel mt-8 border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-xl">Expo SDK Upgrade Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Project Type
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {analysis.projectType}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Installed Expo
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {analysis.expoVersionRaw ?? "Not installed"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/55 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Latest Expo SDK
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {analysis.latestExpoMajor}
              </p>
            </div>
          </div>

          {expoUpgradePanel}
        </CardContent>
      </Card>

      <div id="report" className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="ai-panel border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {analysis.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Expo migration opportunities detected.
              </p>
            ) : (
              analysis.recommendations.slice(0, 2).map((item) => (
                <div
                  key={item.name}
                  className="rounded-3xl border border-border/70 bg-muted/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">↓</span>
                    <span className="text-primary">{item.recommendation}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Better Expo integration, active maintenance, and New
                    Architecture support.
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="ai-panel border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Bundle Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-3xl border border-border/70 bg-muted/55 p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Estimated APK Impact</span>
                <Badge className={impactBadgeStyles[analysis.apkImpact]}>
                  {analysis.apkImpact}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Estimated IPA Impact</span>
                <Badge className={impactBadgeStyles[analysis.ipaImpact]}>
                  {analysis.ipaImpact}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Top heavy packages
              </p>
              <div className="space-y-2">
                {analysis.heavyPackagesList.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-3xl border border-border/70 bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span>{item.name}</span>
                    <Badge className={impactBadgeStyles[item.bundleImpact]}>
                      {item.bundleImpact}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <Card className="ai-panel border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">
              Expo Migration Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Potential Improvements Found</span>
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                {analysis.migrationOpportunities.length}
              </Badge>
            </div>
            {analysis.migrationOpportunities.map((item) => (
              <div
                key={item.current}
                className="rounded-3xl border border-border/70 bg-muted/50 px-4 py-3 text-sm"
              >
                <div className="text-muted-foreground">Replace:</div>
                <div className="mt-1 font-semibold text-foreground">
                  {item.current} →{" "}
                  <span className="text-primary">{item.alternative}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="ai-panel border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Risk Detection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.riskDetections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No risks detected. Your dependencies look healthy.
              </p>
            ) : (
              analysis.riskDetections.map((item) => (
                <div
                  key={item.name}
                  className="rounded-3xl border border-border/70 bg-muted/50 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {item.name}
                    </span>
                    <Badge className={statusBadgeStyles[item.status]}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground">{item.detail}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="ai-panel mt-12 border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-xl">Package Analysis Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead>Expo Compatible</TableHead>
                  <TableHead>New Architecture</TableHead>
                  <TableHead>Bundle Impact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.entries.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.version}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.healthScore}/100 ({item.healthGrade})
                    </TableCell>
                    <TableCell>{item.expoCompatible ? "Yes" : "No"}</TableCell>
                    <TableCell>{item.newArchitecture ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Badge className={impactBadgeStyles[item.bundleImpact]}>
                        {item.bundleImpact}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeStyles[item.status]}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.recommendation}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
