"use client";

import { ChevronDown, Languages, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useUiLocale, type UiLocale } from "@/lib/ui-locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export function ThemeLocaleControls() {
  const t = useTranslations("toolbar");
  const { setTheme, theme } = useTheme();
  const { locale, setLocale } = useUiLocale();

  const applyTheme = (nextTheme: "light" | "dark" | "system") => {
    setTheme(nextTheme);
    document.cookie = `arb-editor-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="flex items-center gap-2 rounded-xl bg-card/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-lg border-transparent">
            {t("theme")}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            checked={theme === "light"}
            onCheckedChange={() => applyTheme("light")}
          >
            <Sun className="mr-2 h-4 w-4" />
            {t("themeLight")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={theme === "dark"}
            onCheckedChange={() => applyTheme("dark")}
          >
            <Moon className="mr-2 h-4 w-4" />
            {t("themeDark")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={theme === "system"}
            onCheckedChange={() => applyTheme("system")}
          >
            {t("themeSystem")}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-44">
        <Select value={locale} onValueChange={(value) => setLocale(value as UiLocale)}>
          <SelectTrigger className="rounded-lg border-transparent">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t("languageEn")}</SelectItem>
            <SelectItem value="vi">{t("languageVi")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
