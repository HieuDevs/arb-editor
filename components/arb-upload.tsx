"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArbUploadProps {
  onFilesSelected: (files: FileList) => void;
}

export function ArbUpload({ onFilesSelected }: ArbUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const t = useTranslations("toolbar");

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".arb,application/json"
        multiple
        className="hidden"
        onChange={(event) => {
          if (!event.target.files || event.target.files.length === 0) {
            return;
          }
          onFilesSelected(event.target.files);
          event.target.value = "";
        }}
      />
      <Button type="button" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" />
        {t("upload")}
      </Button>
    </div>
  );
}
