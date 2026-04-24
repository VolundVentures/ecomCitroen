import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VOICE_MAP: Record<string, string> = {
  fr: "Aoede",
  ar: "Aoede",
  darija: "Aoede",
  en: "Aoede",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 503 });
  }

  const { text, lang = "fr" } = (await req.json()) as { text: string; lang?: string };
  if (!text?.trim()) {
    return NextResponse.json({ error: "empty text" }, { status: 400 });
  }

  try {
    const voiceName = VOICE_MAP[lang] ?? "Aoede";

    // Style tags work for Latin-script text but break Arabic TTS.
    // Detect Arabic script and skip the tag.
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const styledText = hasArabic ? text : `[at a natural conversational pace, warmly] ${text}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: styledText }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[tts] Gemini error:", res.status, errText.slice(0, 300));
      return NextResponse.json({ error: `Gemini ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    const audioPart = json.candidates?.[0]?.content?.parts?.[0];
    if (!audioPart?.inlineData?.data) {
      return NextResponse.json({ error: "no audio in response" }, { status: 502 });
    }

    const pcmBase64 = audioPart.inlineData.data;
    const pcmBuffer = Buffer.from(pcmBase64, "base64");
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);

    return new Response(new Uint8Array(wavBuffer), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-cache",
        "Content-Length": String(wavBuffer.byteLength),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[tts]", msg);
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}

function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}
