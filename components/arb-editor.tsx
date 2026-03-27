"use client";

import { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GroupSidebar } from "@/components/group-sidebar";
import { ThemeLocaleControls } from "@/components/theme-locale-controls";
import { Toolbar } from "@/components/toolbar";
import { TranslationTable } from "@/components/translation-table";
import { downloadAllAsZip, downloadLocaleArb } from "@/lib/arb-exporter";
import { parseArbFiles } from "@/lib/arb-parser";
import { computeKeyGroups, getOrderedGroups } from "@/lib/grouping";
import type { ArbLocaleFile, GroupedTranslationEntry, MetadataEntry } from "@/lib/types";
import { translateWithYandex } from "@/lib/yandex-translate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DRAFT_STORAGE_KEY = "arb-editor-draft-v1";

function getDraftFilesFromStorage(): ArbLocaleFile[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as ArbLocaleFile[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return normalizeFiles(parsed);
  } catch {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return [];
  }
}

function normalizeFiles(files: ArbLocaleFile[]): ArbLocaleFile[] {
  const allKeys = new Set<string>();
  for (const file of files) {
    Object.keys(file.translations).forEach((key) => allKeys.add(key));
  }
  const sortedKeys = [...allKeys].sort((a, b) => a.localeCompare(b));
  return files.map((file) => {
    const nextTranslations = { ...file.translations };
    for (const key of sortedKeys) {
      if (!(key in nextTranslations)) {
        nextTranslations[key] = "";
      }
    }
    return {
      ...file,
      translations: nextTranslations
    };
  });
}

function buildRows(
  files: ArbLocaleFile[],
  groupingEnabled: boolean,
  ungroupedLabel: string,
  allKeysLabel: string
): GroupedTranslationEntry[] {
  if (files.length === 0) {
    return [];
  }
  const allKeys = new Set<string>();
  files.forEach((file) => Object.keys(file.translations).forEach((key) => allKeys.add(key)));
  const sortedKeys = [...allKeys].sort((a, b) => a.localeCompare(b));
  const groupMapping = groupingEnabled ? computeKeyGroups(sortedKeys) : {};

  const rows: GroupedTranslationEntry[] = sortedKeys.map((key) => {
    const valuesByLocale: Record<string, string> = {};
    const metadataByLocale: Record<string, MetadataEntry | undefined> = {};
    const missingLocales: string[] = [];

    for (const file of files) {
      const value = file.translations[key] ?? "";
      valuesByLocale[file.locale] = value;
      metadataByLocale[file.locale] = file.metadata[key];
      if (value === "") {
        missingLocales.push(file.locale);
      }
    }

    return {
      key,
      valuesByLocale,
      metadataByLocale,
      missingLocales,
      group: groupingEnabled ? groupMapping[key] ?? ungroupedLabel : allKeysLabel
    };
  });

  return rows.sort((a, b) => {
    if (a.group !== b.group) {
      return a.group.localeCompare(b.group);
    }
    return a.key.localeCompare(b.key);
  });
}

function getDefaultCollapsedGroups(
  files: ArbLocaleFile[],
  groupingEnabled: boolean,
  ungroupedLabel: string,
  allKeysLabel: string
): Set<string> {
  const nextRows = buildRows(files, groupingEnabled, ungroupedLabel, allKeysLabel);
  return new Set(nextRows.map((row) => row.group));
}

function sortGroupsWithOpenedPinned(
  groups: Array<{ group: string; count: number }>,
  collapsedGroups: Set<string>
): Array<{ group: string; count: number }> {
  return [...groups].sort((a, b) => {
    const aOpened = !collapsedGroups.has(a.group);
    const bOpened = !collapsedGroups.has(b.group);
    if (aOpened !== bOpened) {
      return aOpened ? -1 : 1;
    }
    return a.group.localeCompare(b.group);
  });
}

function sortRowsWithOpenedGroupsPinned(
  rows: GroupedTranslationEntry[],
  collapsedGroups: Set<string>
): GroupedTranslationEntry[] {
  return [...rows].sort((a, b) => {
    const aOpened = !collapsedGroups.has(a.group);
    const bOpened = !collapsedGroups.has(b.group);
    if (aOpened !== bOpened) {
      return aOpened ? -1 : 1;
    }
    if (a.group !== b.group) {
      return a.group.localeCompare(b.group);
    }
    return a.key.localeCompare(b.key);
  });
}

export function ArbEditor() {
  const tApp = useTranslations("app");
  const tErrors = useTranslations("errors");
  const tTable = useTranslations("table");
  const [files, setFiles] = useState<ArbLocaleFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "missing">("all");
  const [groupingEnabled] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [expandedMetadataCells, setExpandedMetadataCells] = useState<Set<string>>(
    new Set()
  );
  const [isPageDragging, setIsPageDragging] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string>("");
  const [translatingCells, setTranslatingCells] = useState<Set<string>>(new Set());
  const pageDragDepthRef = useRef(0);

  const locales = useMemo(() => files.map((file) => file.locale), [files]);
  const rows = useMemo(
    () =>
      buildRows(files, groupingEnabled, tTable("ungrouped"), tTable("allKeys")),
    [files, groupingEnabled, tTable]
  );
  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const sourceRows = sortRowsWithOpenedGroupsPinned(rows, collapsedGroups);
    const filterMissingRows =
      filterMode === "missing"
        ? sourceRows.filter((row) => row.missingLocales.length > 0)
        : sourceRows;
    if (!keyword) {
      return filterMissingRows;
    }
    return filterMissingRows.filter((row) => row.key.toLowerCase().includes(keyword));
  }, [rows, search, collapsedGroups, filterMode]);
  const filteredKeysCount = filteredRows.length;

  const groups = useMemo(() => {
    if (filteredRows.length === 0) {
      return [];
    }
    const map: Record<string, string> = {};
    filteredRows.forEach((row) => {
      map[row.key] = row.group;
    });
    return sortGroupsWithOpenedPinned(getOrderedGroups(map), collapsedGroups);
  }, [filteredRows, collapsedGroups]);

  const handleIncomingFiles = async (selectedFiles: FileList) => {
    const parsed = await parseArbFiles(selectedFiles);
    if (parsed.errors.length > 0) {
      setErrors(parsed.errors);
    } else {
      setErrors([]);
    }
    if (parsed.files.length > 0) {
      const normalized = normalizeFiles(parsed.files);
      setFiles(normalized);
      setCollapsedGroups(
        getDefaultCollapsedGroups(
          normalized,
          groupingEnabled,
          tTable("ungrouped"),
          tTable("allKeys")
        )
      );
      setExpandedMetadataCells(new Set());
    }
  };

  const onFilesSelected = (selectedFiles: FileList) => {
    void handleIncomingFiles(selectedFiles);
  };

  const handlePageDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    pageDragDepthRef.current += 1;
    setIsPageDragging(true);
  };

  const handlePageDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (!isPageDragging) {
      setIsPageDragging(true);
    }
  };

  const handlePageDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    pageDragDepthRef.current = Math.max(0, pageDragDepthRef.current - 1);
    if (pageDragDepthRef.current === 0) {
      setIsPageDragging(false);
    }
  };

  const handlePageDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsPageDragging(false);
    pageDragDepthRef.current = 0;
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      void handleIncomingFiles(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  };

  const updateValue = (key: string, locale: string, value: string) => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.locale !== locale) {
          return file;
        }
        return {
          ...file,
          translations: {
            ...file.translations,
            [key]: value
          }
        };
      })
    );
  };

  const updateMetadata = (
    key: string,
    locale: string,
    metadata: MetadataEntry | undefined
  ) => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.locale !== locale) {
          return file;
        }
        const nextMetadata = { ...file.metadata };
        if (metadata) {
          nextMetadata[key] = metadata;
        } else {
          delete nextMetadata[key];
        }
        return {
          ...file,
          metadata: nextMetadata
        };
      })
    );
  };

  const cloneMetadata = (key: string, targetLocale: string) => {
    const sourceFile = files.find(
      (file) => file.locale !== targetLocale && file.metadata[key]
    );
    if (!sourceFile) {
      return;
    }
    const metadata = sourceFile.metadata[key];
    if (!metadata) {
      return;
    }
    updateMetadata(key, targetLocale, { ...metadata });
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const downloadLocale = (locale: string) => {
    const file = files.find((item) => item.locale === locale);
    if (file) {
      downloadLocaleArb(file);
    }
  };

  const translateMissingForCell = async (key: string, targetLocale: string) => {
    const sourceLocale = locales.find((locale) => locale.toLowerCase().startsWith("vi"));
    if (!sourceLocale || sourceLocale === targetLocale) {
      return;
    }

    const sourceFile = files.find((file) => file.locale === sourceLocale);
    const targetFile = files.find((file) => file.locale === targetLocale);
    if (!sourceFile) {
      return;
    }
    if (!targetFile) {
      return;
    }
    const sourceText = sourceFile.translations[key] ?? "";
    const targetText = targetFile.translations[key] ?? "";
    if (!sourceText.trim() || targetText.trim()) {
      return;
    }

    const cellId = `${targetLocale}::${key}`;
    setTranslatingCells((prev) => {
      const next = new Set(prev);
      next.add(cellId);
      return next;
    });

    try {
      const translatedText = await translateWithYandex(
        sourceText,
        sourceLocale,
        targetLocale
      );
      setFiles((prev) =>
        prev.map((file) => {
          if (file.locale !== targetLocale) {
            return file;
          }
          return {
            ...file,
            translations: {
              ...file.translations,
              [key]: translatedText
            }
          };
        })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : tErrors("translateFailed");
      setErrors((prev) => [...prev, `${targetLocale}/${key}: ${message}`]);
    } finally {
      setTranslatingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellId);
        return next;
      });
    }
  };

  const saveDraft = () => {
    if (files.length === 0) {
      return;
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(files));
    const time = new Date().toLocaleTimeString();
    setDraftSavedAt(time);
    toast.success(tApp("draftSavedAt", { time }));
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFiles([]);
    setErrors([]);
    setSearch("");
    setFilterMode("all");
    setCollapsedGroups(new Set());
    setExpandedMetadataCells(new Set());
    setDraftSavedAt("");
    toast.success(tApp("draftCleared"));
  };

  useEffect(() => {
    const draftFiles = getDraftFilesFromStorage();
    if (draftFiles.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setFiles(draftFiles);
      setCollapsedGroups(
        getDefaultCollapsedGroups(draftFiles, true, tTable("ungrouped"), tTable("allKeys"))
      );
      setErrors([]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tTable]);

  return (
    <main
      className="relative h-screen overflow-hidden bg-background p-5"
      onDragEnter={handlePageDragEnter}
      onDragOver={handlePageDragOver}
      onDragLeave={handlePageDragLeave}
      onDrop={handlePageDrop}
    >
      {isPageDragging ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-primary/15">
          <div className="rounded-xl border-2 border-dashed border-primary bg-card/95 px-8 py-6 text-center shadow-lg">
            <div className="text-base font-semibold text-primary">{tApp("dropTitle")}</div>
            <div className="mt-1 text-sm text-muted-foreground">{tApp("dropDescription")}</div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex h-full max-w-[1880px] flex-col gap-5 pb-10">
        <div className="sticky top-5 z-40 flex justify-end">
          <ThemeLocaleControls />
        </div>
        <Toolbar
          search={search}
          onSearchChange={setSearch}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          filteredKeysCount={filteredKeysCount}
          onSaveDraft={saveDraft}
          onClearDraft={clearDraft}
          onDownloadAll={() => void downloadAllAsZip(files)}
          onFilesSelected={onFilesSelected}
          hasData={files.length > 0}
        />

        {files.length === 0 ? (
          <Alert className="rounded-xl border-amber-400/70 bg-amber-500/10 shadow-sm">
            <AlertTitle className="text-base font-semibold text-amber-800 dark:text-amber-300">
              {tApp("localeNoteTitle")}
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm text-amber-700 dark:text-amber-200">
              {tApp("localeNoteDescription")}
            </AlertDescription>
          </Alert>
        ) : null}

        {errors.length > 0 ? (
          <Alert variant="destructive" className="rounded-xl shadow-sm">
            <AlertTitle>{tErrors("importTitle")}</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex min-h-0 flex-1 gap-4">
          <GroupSidebar
            groups={groups}
            collapsedGroups={collapsedGroups}
            onToggleGroup={toggleGroup}
          />
          <div className="min-h-0 min-w-0 flex-1">
            <TranslationTable
              locales={locales}
              rows={filteredRows}
              collapsedGroups={collapsedGroups}
              expandedMetadataCells={expandedMetadataCells}
              onToggleGroup={toggleGroup}
              onToggleMetadata={(key, locale) =>
                setExpandedMetadataCells((prev) => {
                  const next = new Set(prev);
                  const cellId = `${locale}::${key}`;
                  if (next.has(cellId)) {
                    next.delete(cellId);
                  } else {
                    next.add(cellId);
                  }
                  return next;
                })
              }
              onValueChange={updateValue}
              onMetadataChange={updateMetadata}
              onCloneMetadata={cloneMetadata}
              onDownloadLocale={downloadLocale}
              onTranslateCell={(key, locale) =>
                void translateMissingForCell(key, locale)
              }
              translatingCells={translatingCells}
            />
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 py-2 text-center text-xs text-muted-foreground backdrop-blur">
        {tApp("copyright")}
      </div>
    </main>
  );
}
