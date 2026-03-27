"use client";

import JSZip from "jszip";
import type { ArbLocaleFile } from "@/lib/types";

function buildExportJson(file: ArbLocaleFile): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  result["@@locale"] = file.locale;

  const translationKeys = Object.keys(file.translations).sort((a, b) =>
    a.localeCompare(b)
  );
  for (const key of translationKeys) {
    result[key] = file.translations[key];
    const metadata = file.metadata[key];
    if (metadata) {
      result[`@${key}`] = metadata;
    }
  }

  const extraKeys = Object.keys(file.extras).sort((a, b) => a.localeCompare(b));
  for (const key of extraKeys) {
    result[key] = file.extras[key];
  }

  return result;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadLocaleArb(file: ArbLocaleFile): void {
  const json = buildExportJson(file);
  const pretty = JSON.stringify(json, null, 2);
  const blob = new Blob([pretty], { type: "application/json" });
  const filename = file.filename.endsWith(".arb")
    ? file.filename
    : `app_${file.locale}.arb`;
  downloadBlob(blob, filename);
}

export async function downloadAllAsZip(files: ArbLocaleFile[]): Promise<void> {
  const zip = new JSZip();
  for (const file of files) {
    const json = buildExportJson(file);
    const pretty = JSON.stringify(json, null, 2);
    const filename = file.filename.endsWith(".arb")
      ? file.filename
      : `app_${file.locale}.arb`;
    zip.file(filename, pretty);
  }
  const content = await zip.generateAsync({ type: "blob" });
  downloadBlob(content, "arb-files.zip");
}
