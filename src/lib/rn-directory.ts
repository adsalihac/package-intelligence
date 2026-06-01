export type RNDirData = {
  npmPkg: string;
  github?: {
    isArchived?: boolean;
    stats?: {
      updatedAt?: string;
      stars?: number;
      hasIssues?: boolean;
    };
  };
  npm?: {
    size?: number;
    weekDownloads?: number;
    latestRelease?: string;
  };
  score?: number;
  newArchitecture?: boolean;
  expoGo?: boolean;
  ios?: boolean;
  android?: boolean;
  web?: boolean;
  tvos?: boolean;
  visionos?: boolean;
  windows?: boolean;
  unmaintained?: boolean;
  unmaintainedReason?: string;
  deprecated?: boolean;
  deprecatedMessage?: string;
  alternatives?: string[];
};

const BATCH_SIZE = 50;

export async function fetchRNDirectoryData(
  packages: string[]
): Promise<Record<string, RNDirData>> {
  const result: Record<string, RNDirData> = {};

  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE);
    try {
      const response = await fetch(
        `/api/analyze?packages=${encodeURIComponent(batch.join(","))}`
      );
      if (!response.ok) continue;

      const data = (await response.json()) as unknown;
      const items = Array.isArray(data) ? data : [];
      for (const item of items as RNDirData[]) {
        if (item?.npmPkg) {
          result[item.npmPkg] = item;
        }
      }
    } catch {
      // Silently continue on fetch failure
    }
  }

  return result;
}

export const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatDownloads = (count?: number): string => {
  if (!count || count === 0) return "—";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M/wk`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K/wk`;
  return `${count}/wk`;
};

export const formatRelativeDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (diffDays < 1) return "Today";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}yr ago`;
  } catch {
    return "—";
  }
};
