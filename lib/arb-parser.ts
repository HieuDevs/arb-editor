"use client";

import type { ArbJson, ArbLocaleFile, ParseResult } from "@/lib/types";
import {
  inferLocaleFromFilename,
  isArbFilename,
  validateArbJsonShape
} from "@/lib/validation";

function safeParseJson(text: string): ArbJson | null {
  try {
    return JSON.parse(text) as ArbJson;
  } catch {
    return null;
  }
}

function parseArbContent(json: ArbJson, filename: string): ArbLocaleFile {
  const translations: Record<string, string> = {};
  const metadata: Record<string, Record<string, unknown>> = {};
  const special: Record<string, unknown> = {};
  const extras: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(json)) {
    if (key === "@@locale") {
      special[key] = value;
      continue;
    }
    if (key.startsWith("@@")) {
      extras[key] = value;
      continue;
    }
    if (key.startsWith("@")) {
      const baseKey = key.slice(1);
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        metadata[baseKey] = value as Record<string, unknown>;
      }
      continue;
    }
    if (typeof value === "string") {
      translations[key] = value;
    }
  }

  const localeFromJson =
    typeof json["@@locale"] === "string" ? (json["@@locale"] as string) : null;
  const fallbackLocale = inferLocaleFromFilename(filename) ?? "unknown";
  const locale = localeFromJson ?? fallbackLocale;

  return {
    locale,
    filename,
    special,
    translations,
    metadata,
    extras
  };
}

export async function parseArbFiles(files: FileList): Promise<ParseResult> {
  const errors: string[] = [];
  const parsedFiles: ArbLocaleFile[] = [];
  const seenLocales = new Set<string>();

  const fileArray = Array.from(files);
  for (const file of fileArray) {
    if (!isArbFilename(file.name)) {
      errors.push(`${file.name}: file must have .arb extension.`);
      continue;
    }
    const text = await file.text();
    const json = safeParseJson(text);
    if (!json) {
      errors.push(`${file.name}: invalid JSON.`);
      continue;
    }
    const shapeErrors = validateArbJsonShape(json);
    if (shapeErrors.length > 0) {
      errors.push(...shapeErrors.map((message) => `${file.name}: ${message}`));
      continue;
    }
    const parsed = parseArbContent(json, file.name);
    if (seenLocales.has(parsed.locale)) {
      errors.push(`${file.name}: duplicate locale "${parsed.locale}".`);
      continue;
    }
    seenLocales.add(parsed.locale);
    parsedFiles.push(parsed);
  }

  return { files: parsedFiles, errors };
}
