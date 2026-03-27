"use client";

import { type MouseEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Languages, Puzzle, Plus, Copy } from "lucide-react";
import { MetadataEditor } from "@/components/metadata-editor";
import type { GroupedTranslationEntry, MetadataEntry } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TranslationTableProps {
  locales: string[];
  rows: GroupedTranslationEntry[];
  collapsedGroups: Set<string>;
  expandedMetadataCells: Set<string>;
  onToggleGroup: (group: string) => void;
  onToggleMetadata: (key: string, locale: string) => void;
  onValueChange: (key: string, locale: string, value: string) => void;
  onMetadataChange: (
    key: string,
    locale: string,
    metadata: MetadataEntry | undefined
  ) => void;
  onCloneMetadata: (key: string, locale: string) => void;
  onDownloadLocale: (locale: string) => void;
  onTranslateCell: (key: string, locale: string) => void;
  translatingCells: Set<string>;
}

export function TranslationTable({
  locales,
  rows,
  collapsedGroups,
  expandedMetadataCells,
  onToggleGroup,
  onToggleMetadata,
  onValueChange,
  onMetadataChange,
  onCloneMetadata,
  onDownloadLocale,
  onTranslateCell,
  translatingCells
}: TranslationTableProps) {
  const t = useTranslations("table");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isResizing, setIsResizing] = useState(false);
  const colRefs = useRef<Record<string, HTMLTableColElement | null>>({});

  const getColumnWidth = (columnId: string, fallback: number) =>
    columnWidths[columnId] ?? fallback;

  const startResize = (
    event: MouseEvent<HTMLDivElement>,
    columnId: string,
    minWidth: number,
    fallbackWidth: number
  ) => {
    event.preventDefault();
    setIsResizing(true);
    const startX = event.clientX;
    const targetCol = colRefs.current[columnId];
    const startWidth = targetCol?.offsetWidth ?? getColumnWidth(columnId, fallbackWidth);
    let latestWidth = startWidth;

    const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = Math.max(minWidth, startWidth + delta);
      latestWidth = nextWidth;
      const activeCol = colRefs.current[columnId];
      if (activeCol) {
        activeCol.style.width = `${nextWidth}px`;
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      setColumnWidths((prev) => ({
        ...prev,
        [columnId]: latestWidth
      }));
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-card/60 p-10 text-center">
        <div className="mx-auto max-w-md space-y-2">
          <p className="text-base font-medium text-foreground">{t("uploadHint")}</p>
          <p className="text-sm text-muted-foreground">
            {t("uploadHintSubtle")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-auto rounded-xl border bg-card shadow-sm ${
        isResizing ? "cursor-col-resize select-none" : ""
      }`}
    >
      <Table className="min-w-full table-fixed">
        <colgroup>
          <col
            ref={(element) => {
              colRefs.current.key = element;
            }}
            style={{ width: "280px" }}
          />
          {locales.map((locale) => (
            <col
              key={`col-${locale}`}
              ref={(element) => {
                colRefs.current[`locale:${locale}`] = element;
              }}
              style={{ width: `${getColumnWidth(`locale:${locale}`, 260)}px` }}
            />
          ))}
        </colgroup>
        <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <TableRow>
            <TableHead className="sticky left-0 z-30 border-r bg-background/95 text-xs uppercase">
              {t("key")}
            </TableHead>
            {locales.map((locale) => (
              <TableHead
                key={locale}
                className="relative border-r text-xs uppercase"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{locale}</Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onDownloadLocale(locale)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("downloadLocale", { locale })}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div
                  onMouseDown={(event) =>
                    startResize(event, `locale:${locale}`, 180, 260)
                  }
                  className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize"
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const previousGroup = index > 0 ? rows[index - 1].group : "";
            const isGroupChanged = row.group !== previousGroup;
            const isCollapsed = collapsedGroups.has(row.group);
            if (isCollapsed) {
              return isGroupChanged ? (
                <TableRow
                  key={`collapsed-${row.group}`}
                  className="bg-muted/35 hover:bg-muted/35"
                >
                  <TableCell
                    colSpan={1 + locales.length}
                    className="py-2.5 text-xs text-muted-foreground"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleGroup(row.group)}
                    >
                      {t("collapsed", { group: row.group })}
                    </Button>
                  </TableCell>
                </TableRow>
              ) : null;
            }

            const hasAnyMetadata = locales.some(
              (locale) => row.metadataByLocale[locale] !== undefined
            );

            return (
              <FragmentRow
                key={row.key}
                row={row}
                locales={locales}
                isGroupChanged={isGroupChanged}
                hasAnyMetadata={hasAnyMetadata}
                expandedMetadataCells={expandedMetadataCells}
                onToggleGroup={onToggleGroup}
                onToggleMetadata={onToggleMetadata}
                onValueChange={onValueChange}
                onMetadataChange={onMetadataChange}
                onCloneMetadata={onCloneMetadata}
                onTranslateCell={onTranslateCell}
                translatingCells={translatingCells}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface FragmentRowProps {
  row: GroupedTranslationEntry;
  locales: string[];
  isGroupChanged: boolean;
  hasAnyMetadata: boolean;
  expandedMetadataCells: Set<string>;
  onToggleGroup: (group: string) => void;
  onToggleMetadata: (key: string, locale: string) => void;
  onValueChange: (key: string, locale: string, value: string) => void;
  onMetadataChange: (
    key: string,
    locale: string,
    metadata: MetadataEntry | undefined
  ) => void;
  onCloneMetadata: (key: string, locale: string) => void;
  onTranslateCell: (key: string, locale: string) => void;
  translatingCells: Set<string>;
}

function FragmentRow({
  row,
  locales,
  isGroupChanged,
  hasAnyMetadata,
  expandedMetadataCells,
  onToggleGroup,
  onToggleMetadata,
  onValueChange,
  onMetadataChange,
  onCloneMetadata,
  onTranslateCell,
  translatingCells
}: FragmentRowProps) {
  const t = useTranslations("table");

  return (
    <>
      {isGroupChanged ? (
        <TableRow className="bg-muted/35 hover:bg-muted/35">
          <TableCell
            colSpan={1 + locales.length}
            className="border-y py-2.5 text-xs"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleGroup(row.group)}
            >
              {row.group}
            </Button>
          </TableCell>
        </TableRow>
      ) : null}
      <TableRow className={hasAnyMetadata ? "bg-amber-500/10 hover:bg-amber-500/10" : "hover:bg-muted/30"}>
        <TableCell className="sticky left-0 z-10 border-r bg-inherit py-2 font-mono text-xs">
          {row.key}
        </TableCell>
        {locales.map((locale) => {
          const value = row.valuesByLocale[locale] ?? "";
          const isMissing = row.missingLocales.includes(locale);
          const cellId = `${locale}::${row.key}`;
          const isTranslatingCell = translatingCells.has(cellId);
          const currentMetadata = row.metadataByLocale[locale];
          const hasMetadataForLocale = Boolean(currentMetadata);
          const cloneSourceLocale = locales.find(
            (candidate) =>
              candidate !== locale && row.metadataByLocale[candidate] !== undefined
          );
          const isExpanded = expandedMetadataCells.has(cellId);
          const isVietnameseLocale = locale.toLowerCase().startsWith("vi");
          const canTranslate = !hasMetadataForLocale && !isVietnameseLocale;
          return (
            <TableCell key={locale} className="border-r p-1.5">
              <Collapsible open={isExpanded}>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      value={value}
                      onChange={(event) =>
                        onValueChange(row.key, locale, event.target.value)
                      }
                      placeholder={isMissing ? t("missing") : ""}
                      className={`h-9 rounded-md border-border/70 bg-background/90 shadow-none transition focus-visible:ring-1 ${
                        isMissing ? "border-amber-400/60 bg-amber-500/10" : ""
                      }`}
                    />
                    {canTranslate ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onTranslateCell(row.key, locale)}
                              disabled={isTranslatingCell}
                              aria-label={t("translateFromVietnamese")}
                              className="h-8 w-8 rounded-md border border-border/60"
                            >
                              <Languages className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("translateFromVietnamese")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CollapsibleTrigger asChild>
                            <Button
                    type="button"
                    onClick={() => onToggleMetadata(row.key, locale)}
                              variant="outline"
                              size="icon"
                              aria-label={hasMetadataForLocale ? t("editMetadata") : t("addMetadata")}
                              className="h-8 w-8 rounded-md border border-border/60"
                            >
                              {hasMetadataForLocale ? (
                                <Puzzle className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          {hasMetadataForLocale ? t("editMetadata") : t("addMetadata")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  {!hasMetadataForLocale && cloneSourceLocale ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onCloneMetadata(row.key, locale)}
                              aria-label={t("cloneMetadata", { locale: cloneSourceLocale })}
                              className="h-8 w-8 rounded-md border border-border/60"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("cloneMetadata", { locale: cloneSourceLocale })}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                  ) : null}
                  </div>
                  <CollapsibleContent>
                    <MetadataEditor
                      metadata={currentMetadata}
                      onChange={(nextMetadata) => onMetadataChange(row.key, locale, nextMetadata)}
                    />
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </TableCell>
          );
        })}
      </TableRow>
    </>
  );
}
