import type { ArbJson } from "@/lib/types";

const localeRegex = /([a-z]{2}(?:[_-][A-Z]{2})?)/;

export function inferLocaleFromFilename(filename: string): string | null {
  const normalized = filename.replace(/\.arb$/i, "");
  const match = normalized.match(localeRegex);
  if (!match) {
    return null;
  }
  return match[1].replace("-", "_");
}

export function isArbFilename(filename: string): boolean {
  return /\.arb$/i.test(filename);
}

export function validateArbJsonShape(json: ArbJson): string[] {
  const errors: string[] = [];
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return ["ARB content must be a JSON object."];
  }
  for (const [key, value] of Object.entries(json)) {
    if (key.startsWith("@@")) {
      continue;
    }
    if (key.startsWith("@")) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(`Metadata key "${key}" must be a JSON object.`);
      }
      continue;
    }
    if (typeof value !== "string") {
      errors.push(`Translation key "${key}" must be a string.`);
    }
  }
  return errors;
}
