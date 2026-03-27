"use client";

import { createContext, useContext } from "react";

export type UiLocale = "en" | "vi";

interface UiLocaleContextValue {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
}

export const UiLocaleContext = createContext<UiLocaleContextValue | undefined>(undefined);

export function useUiLocale() {
  const context = useContext(UiLocaleContext);
  if (!context) {
    throw new Error("useUiLocale must be used within UiLocaleContext provider");
  }
  return context;
}
