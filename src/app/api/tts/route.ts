import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

const LANGUAGE_MODEL = "gpt-4o-mini";

async function synthesizeSpeech(text: string, language: string) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: language.startsWith("uk") ? "alloy" : "alloy",
      input: text,
      format: "wav",
      language,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("TTS failed", body);
    throw new Error("TTS request failed");
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return base64;
}

export async function POST(req: NextRequest) {
  const { text, language } = await req.json();

  if (!text || !language) {
    return NextResponse.json({ error: "Missing text or language" }, { status: 400 });
  }

  try {
    const audioContent = await synthesizeSpeech(text, language);
    return NextResponse.json({ audioContent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "TTS synthesis failed" }, { status: 502 });
  }
}
