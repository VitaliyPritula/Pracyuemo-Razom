// файл: /app/api/translate/route.ts або /pages/api/translate.ts

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json({ error: "Missing text or targetLang" }, { status: 400 });
    }

    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target: targetLang,
        format: "text",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("LibreTranslate API error:", errText);
      throw new Error("Translation API error");
    }

    const data = await res.json();

    return NextResponse.json({ translatedText: data.translatedText });
  } catch (error) {
    console.error("Translation failed:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
