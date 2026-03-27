"use client";

import { ArbUpload } from "@/components/arb-upload";
import { useTranslations } from "next-intl";
import { Download, Save, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterMode: "all" | "missing";
  onFilterModeChange: (value: "all" | "missing") => void;
  filteredKeysCount: number;
  onSaveDraft: () => void;
  onClearDraft: () => void;
  onDownloadAll: () => void;
  onFilesSelected: (files: FileList) => void;
  hasData: boolean;
}

export function Toolbar({
  search,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  filteredKeysCount,
  onSaveDraft,
  onClearDraft,
  onDownloadAll,
  onFilesSelected,
  hasData
}: ToolbarProps) {
  const t = useTranslations("toolbar");

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <ArbUpload onFilesSelected={onFilesSelected} />
      <div className="relative min-w-72 flex-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-9 rounded-lg border-border/60 bg-background/80 pl-9 shadow-sm transition focus-visible:ring-1"
        />
      </div>
      <div className="w-52">
        <Select
          value={filterMode}
          onValueChange={(value) => onFilterModeChange(value as "all" | "missing")}
        >
          <SelectTrigger className="h-9 rounded-lg border-border/70">
            <SelectValue placeholder={t("filterLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="missing">{t("filterMissing")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {t("filteredKeyCount", { count: filteredKeysCount })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSaveDraft}
        disabled={!hasData}
        className="rounded-lg border-border/70"
      >
        <Save className="h-4 w-4" />
        {t("saveDraft")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClearDraft}
        className="rounded-lg border-border/70"
      >
        <Trash2 className="h-4 w-4" />
        {t("clearDraft")}
      </Button>
      <Button type="button" size="sm" onClick={onDownloadAll} disabled={!hasData} className="rounded-lg shadow-sm">
        <Download className="h-4 w-4" />
        {t("downloadAll")}
      </Button>
    </div>
  );
}
