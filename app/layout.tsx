import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import type { UiLocale } from "@/lib/ui-locale";

export const metadata: Metadata = {
  title: "ARB Editor",
  description: "Spreadsheet-style editor for Flutter ARB localization files"
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("arb-editor-ui-locale")?.value;
  const themeCookie = cookieStore.get("arb-editor-theme")?.value;
  const initialLocale: UiLocale = localeCookie === "en" ? "en" : "vi";
  const htmlClassName = themeCookie === "dark" || themeCookie === "light" ? themeCookie : undefined;

  return (
    <html lang={initialLocale} className={htmlClassName} suppressHydrationWarning>
      <body>
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
