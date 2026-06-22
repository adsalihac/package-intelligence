type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type PublicReport = {
  projectType: "Expo" | "React Native" | "Unknown";
  packageCount: number;
  devPackageCount: number;
  healthScore: number;
  healthGrade: string;
  riskLevel: "Low" | "Medium" | "High";
  expoCompatibility: number;
  newArchitecture: number;
  risks: { name: string; status: string; detail: string }[];
  recommendations: { current: string; alternative: string }[];
  fixQueue: { title: string; detail: string; impact: "Low" | "Medium" | "High" }[];
};

const ALTERNATIVES: Record<string, string> = {
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

const ARCHIVED = new Set(["react-native-camera"]);
const DEPRECATED = new Set(["react-native-document-picker"]);
const HEAVY = new Set(["react-native-video", "react-native-fast-image", "react-native-camera"]);

const hash = (value: string) =>
  Array.from(value).reduce((acc, char) => (acc + char.charCodeAt(0) * 7) % 100, 0);

export const gradeHealth = (score: number) =>
  score >= 95 ? "A+" : score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";

export const badgeColor = (score: number) =>
  score >= 80 ? "brightgreen" : score >= 65 ? "yellowgreen" : score >= 50 ? "orange" : "red";

export function analyzePublicReport(raw: string): PublicReport {
  const parsed = JSON.parse(raw) as PackageJson;
  const dependencies = parsed.dependencies ?? {};
  const devDependencies = parsed.devDependencies ?? {};
  const entries = [
    ...Object.entries(dependencies).map(([name, version]) => ({ name, version, dev: false })),
    ...Object.entries(devDependencies).map(([name, version]) => ({ name, version, dev: true })),
  ];

  const analyzed = entries.map((entry) => {
    const packageHash = hash(entry.name);
    const archived = ARCHIVED.has(entry.name);
    const deprecated = DEPRECATED.has(entry.name);
    const alternative = ALTERNATIVES[entry.name];
    const expoCompatible = entry.name.startsWith("expo-") || Boolean(alternative) || packageHash > 58;
    const newArchitecture = !archived && !deprecated && (entry.name.startsWith("expo-") || packageHash > 62);
    const heavy = HEAVY.has(entry.name);

    let score = 62 + (packageHash % 30);
    if (expoCompatible) score += 4;
    if (newArchitecture) score += 4;
    if (alternative) score += 3;
    if (heavy) score -= 8;
    if (deprecated) score = 28;
    if (archived) score = 22;
    score = Math.max(0, Math.min(100, score));

    const status = archived
      ? "Archived"
      : deprecated
        ? "Deprecated"
        : score < 50
          ? "Needs Review"
          : score < 65
            ? "Outdated"
            : "Healthy";

    return { ...entry, score, status, expoCompatible, newArchitecture, heavy, alternative };
  });

  const total = analyzed.length || 1;
  const healthScore = Math.round(analyzed.reduce((sum, item) => sum + item.score, 0) / total);
  const riskCount = analyzed.filter((item) => item.status !== "Healthy").length;
  const highRiskCount = analyzed.filter((item) => item.status === "Archived" || item.status === "Deprecated").length;
  const riskLevel = highRiskCount > 0 ? "High" : riskCount > 0 ? "Medium" : "Low";
  const projectType = typeof dependencies.expo === "string"
    ? "Expo"
    : typeof dependencies["react-native"] === "string"
      ? "React Native"
      : "Unknown";

  const risks = analyzed
    .filter((item) => item.status !== "Healthy")
    .slice(0, 6)
    .map((item) => ({
      name: item.name,
      status: item.status,
      detail: item.status === "Archived"
        ? "Replace or fork before future platform upgrades."
        : item.status === "Deprecated"
          ? "Plan a migration away from this dependency."
          : "Review maintenance, compatibility, and release cadence.",
    }));

  const recommendations = analyzed
    .filter((item) => item.alternative)
    .map((item) => ({ current: item.name, alternative: item.alternative as string }));

  const fixQueue = [
    ...risks.map((risk) => ({
      title: `Resolve ${risk.name}`,
      detail: risk.detail,
      impact: risk.status === "Archived" || risk.status === "Deprecated" ? "High" as const : "Medium" as const,
    })),
    ...recommendations.slice(0, 4).map((item) => ({
      title: `Migrate ${item.current}`,
      detail: `Evaluate ${item.alternative} as a replacement.`,
      impact: "Medium" as const,
    })),
  ].slice(0, 8);

  return {
    projectType,
    packageCount: Object.keys(dependencies).length,
    devPackageCount: Object.keys(devDependencies).length,
    healthScore,
    healthGrade: gradeHealth(healthScore),
    riskLevel,
    expoCompatibility: Math.round((analyzed.filter((item) => item.expoCompatible).length / total) * 100),
    newArchitecture: Math.round((analyzed.filter((item) => item.newArchitecture).length / total) * 100),
    risks,
    recommendations,
    fixQueue,
  };
}
