import { NextRequest, NextResponse } from "next/server";

const YANDEX_TRANSLATE_URL =
  "https://translate.yandex.net/api/v1/tr.json/translate?id=5033d192.69c5ef66.6593d5fc.74722d74657874-0-0&srv=tr-text&reason=auto&format=text&strategy=0&disable_cache&ajax=1&yu=1998005641774579558";

function normalizeLangCode(locale: string): string {
  return locale.split(/[_-]/)[0].toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      text?: string;
      sourceLocale?: string;
      targetLocale?: string;
    };

    const text = typeof body.text === "string" ? body.text : "";
    const sourceLocale =
      typeof body.sourceLocale === "string" ? body.sourceLocale : "";
    const targetLocale =
      typeof body.targetLocale === "string" ? body.targetLocale : "";

    if (!text.trim() || !sourceLocale || !targetLocale) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const sourceLang = normalizeLangCode(sourceLocale);
    const targetLang = normalizeLangCode(targetLocale);
    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text });
    }

    const params = new URLSearchParams();
    params.set("text", text);
    params.set("options", "4");

    const url = `${YANDEX_TRANSLATE_URL}&source_lang=${encodeURIComponent(sourceLang)}&target_lang=${encodeURIComponent(targetLang)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "*/*",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://translate.yandex.com",
        referer: "https://translate.yandex.com/",
        "x-csrf-token": "51b30bea1dabdc1fe009fc7d6d407377daa2e219:69c5ef66",
        "x-retpath-y": "https://translate.yandex.com"
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Upstream translation failed: ${response.status}`, details: errorText },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { text?: string[] };
    const translatedText = data.text?.[0];
    if (!translatedText) {
      return NextResponse.json(
        { error: "Upstream response missing translated text." },
        { status: 502 }
      );
    }

    return NextResponse.json({ translatedText });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
