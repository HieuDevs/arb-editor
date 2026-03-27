"use client";

import { useMemo, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import enMessages from "@/messages/en.json";
import viMessages from "@/messages/vi.json";
import { UiLocaleContext, type UiLocale } from "@/lib/ui-locale";

const LOCALE_STORAGE_KEY = "arb-editor-ui-locale";
const LOCALE_COOKIE_KEY = "arb-editor-ui-locale";

const messagesByLocale = {
  en: enMessages,
  vi: viMessages
} as const;

export function Providers({
  children,
  initialLocale
}: {
  children: React.ReactNode;
  initialLocale: UiLocale;
}) {
  const [locale, setLocale] = useState<UiLocale>(initialLocale);

  const handleSetLocale = (nextLocale: UiLocale) => {
    setLocale(nextLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const messages = useMemo(() => messagesByLocale[locale], [locale]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UiLocaleContext.Provider value={{ locale, setLocale: handleSetLocale }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster richColors />
        </NextIntlClientProvider>
      </UiLocaleContext.Provider>
    </ThemeProvider>
  );
}
