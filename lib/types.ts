export type ArbJson = Record<string, unknown>;

export type MetadataEntry = Record<string, unknown>;

export interface ArbLocaleFile {
  locale: string;
  filename: string;
  special: Record<string, unknown>;
  translations: Record<string, string>;
  metadata: Record<string, MetadataEntry>;
  extras: Record<string, unknown>;
}

export interface TranslationEntry {
  key: string;
  valuesByLocale: Record<string, string>;
  metadataByLocale: Record<string, MetadataEntry | undefined>;
  missingLocales: string[];
}

export interface GroupedTranslationEntry extends TranslationEntry {
  group: string;
}

export interface ParseResult {
  files: ArbLocaleFile[];
  errors: string[];
}
