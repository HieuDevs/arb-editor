"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { MetadataEntry } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MetadataEditorProps {
  metadata: MetadataEntry | undefined;
  onChange: (nextMetadata: MetadataEntry | undefined) => void;
}

function sanitizeMetadata(
  metadata: MetadataEntry
): MetadataEntry | undefined {
  const next: MetadataEntry = { ...metadata };
  const placeholders = next.placeholders;
  if (
    placeholders === null ||
    placeholders === undefined ||
    (typeof placeholders === "string" && placeholders.trim() === "") ||
    (Array.isArray(placeholders) && placeholders.length === 0) ||
    (typeof placeholders === "object" &&
      !Array.isArray(placeholders) &&
      placeholders !== null &&
      Object.keys(placeholders as Record<string, unknown>).length === 0)
  ) {
    delete next.placeholders;
  }

  if (Object.keys(next).length === 0) {
    return undefined;
  }
  return next;
}

export function MetadataEditor({ metadata, onChange }: MetadataEditorProps) {
  const t = useTranslations("table");
  const initialText = useMemo(
    () => JSON.stringify(metadata ?? {}, null, 2),
    [metadata]
  );
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string>("");

  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
        {t("metadataJson")}
      </div>
      <Textarea
        value={text}
        rows={8}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          try {
            const parsed = JSON.parse(next) as MetadataEntry;
            if (
              typeof parsed !== "object" ||
              parsed === null ||
              Array.isArray(parsed)
            ) {
              setError(t("metadataObjectError"));
              return;
            }
            setError("");
            onChange(sanitizeMetadata(parsed));
          } catch {
            setError(t("metadataInvalidError"));
          }
        }}
        className="font-mono text-xs"
      />
      {error ? (
        <Alert variant="destructive" className="mt-2 py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
