const UNGROUPED = "Ungrouped";

interface PrefixStats {
  prefix: string;
  depth: number;
  keys: string[];
  score: number;
}

function getPrefixes(key: string, maxDepth = 5): string[] {
  const parts = key.split("_").filter(Boolean);
  if (parts.length < 2) {
    return [];
  }
  const prefixes: string[] = [];
  const depthLimit = Math.min(maxDepth, parts.length - 1);
  for (let i = 1; i <= depthLimit; i += 1) {
    prefixes.push(parts.slice(0, i).join("_"));
  }
  return prefixes;
}

function scorePrefix(prefix: string, keys: string[]): PrefixStats {
  const depth = prefix.split("_").length;
  const memberKeys = keys.filter((key) => key.startsWith(`${prefix}_`));
  const memberCount = memberKeys.length;
  const avgSegments =
    memberKeys.reduce((sum, key) => sum + key.split("_").length, 0) /
    Math.max(memberCount, 1);
  const compactness = 1 / Math.max(avgSegments - depth, 1);
  const sizeWeight = Math.min(memberCount, 8) * 2;
  const specificityWeight = depth * 3;
  const noisePenalty = memberCount < 2 ? 100 : 0;
  return {
    prefix,
    depth,
    keys: memberKeys,
    score: sizeWeight + specificityWeight + compactness * 4 - noisePenalty
  };
}

export function computeKeyGroups(keys: string[]): Record<string, string> {
  const stableKeys = [...new Set(keys)].sort((a, b) => a.localeCompare(b));
  const mapping: Record<string, string> = {};
  const scoredCache = new Map<string, PrefixStats>();

  for (const key of stableKeys) {
    if (!key.includes("_")) {
      mapping[key] = UNGROUPED;
      continue;
    }
    const prefixes = getPrefixes(key);
    let best: PrefixStats | null = null;

    for (const prefix of prefixes) {
      let stats = scoredCache.get(prefix);
      if (!stats) {
        stats = scorePrefix(prefix, stableKeys);
        scoredCache.set(prefix, stats);
      }
      if (stats.keys.length < 2) {
        continue;
      }
      if (
        best === null ||
        stats.score > best.score ||
        (stats.score === best.score && stats.depth > best.depth) ||
        (stats.score === best.score &&
          stats.depth === best.depth &&
          stats.prefix.localeCompare(best.prefix) < 0)
      ) {
        best = stats;
      }
    }

    mapping[key] = best ? best.prefix : UNGROUPED;
  }

  return mapping;
}

export function getOrderedGroups(
  mapping: Record<string, string>
): Array<{ group: string; count: number }> {
  const counts = new Map<string, number>();
  for (const group of Object.values(mapping)) {
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([group, count]) => ({ group, count }));
}

export const UNGROUPED_LABEL = UNGROUPED;
