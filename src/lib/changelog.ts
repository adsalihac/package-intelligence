export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: {
    type: "New" | "Improved" | "Fixed";
    text: string;
  }[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.4.0",
    date: "2026-06-22",
    title: "Changelog screen",
    summary: "Added a dedicated release history screen so users can track feature changes by product version.",
    changes: [
      { type: "New", text: "Versioned changelog page with grouped feature updates." },
      { type: "New", text: "Footer changelog action for quick access from the main app." },
      { type: "Improved", text: "Release notes now separate new, improved, and fixed changes." },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-06-22",
    title: "Repository import and upgrade planning",
    summary: "Expanded the analyzer from a package.json checker into a planning workflow for teams.",
    changes: [
      { type: "New", text: "GitHub repository import for package.json and supported lockfiles." },
      { type: "New", text: "Upgrade blockers panel for React Native and Expo migration planning." },
      { type: "New", text: "PR policy checks for CI-ready dependency review signals." },
      { type: "New", text: "Migration recipes for common React Native to Expo package replacements." },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-06-21",
    title: "Live dependency risk intelligence",
    summary: "Added live ecosystem signals that make dependency health scoring more actionable.",
    changes: [
      { type: "New", text: "Dependency death checker for archived, deprecated, and unmaintained packages." },
      { type: "New", text: "Package survivability check with release age, bus factor, and contributor count." },
      { type: "Improved", text: "Live React Native Directory, npm, and GitHub metadata in package details." },
      { type: "Improved", text: "Exported Markdown reports now include death-risk and compatibility details." },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-06-20",
    title: "Initial package intelligence dashboard",
    summary: "Launched the first analyzer experience for React Native and Expo dependency review.",
    changes: [
      { type: "New", text: "Package.json upload, paste, and sample analysis flows." },
      { type: "New", text: "Project detection for Expo, React Native CLI, and unknown projects." },
      { type: "New", text: "Health scores, bundle impact estimates, and Expo migration opportunities." },
      { type: "New", text: "Platform compatibility matrix, duplicate detection, and side-by-side package compare." },
    ],
  },
];
