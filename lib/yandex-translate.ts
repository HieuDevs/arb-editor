"use client";

export async function translateWithYandex(
  text: string,
  sourceLocale: string,
  targetLocale: string
): Promise<string> {
  if (!text.trim() || sourceLocale === targetLocale) {
    return text;
  }

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      text,
      sourceLocale,
      targetLocale
    })
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    const message =
      errorData?.error ?? `Translate request failed (${response.status})`;
    throw new Error(message);
  }

  const data = (await response.json()) as { translatedText?: string };
  const translated = data.translatedText;
  if (!translated) {
    throw new Error("Translate response missing text.");
  }
  return translated;
}
