import { NextResponse } from "next/server";

function detectLang(text: string): string {
  const hasCyrillic = /[а-яёіїєґА-ЯЁІЇЄҐ]/.test(text);
  return hasCyrillic ? "uk" : "en";
}

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing text or targetLang" },
        { status: 400 }
      );
    }

    const sourceLang = detectLang(text);

    // якщо мова джерела і ціль однакові — повертаємо оригінал
    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text });
    }

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;

    const res = await fetch(url, { method: "GET" });
    const data = await res.json();

    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || "Translation failed");
    }

    return NextResponse.json({
      translatedText: data.responseData.translatedText,
    });

  } catch (error) {
    console.error("Translation error details:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}