// Shared server-only Google Gemini streaming helper for the entire text
// backend (chat/report generation AND file analysis). Uses the official
// @google/genai SDK. The API key lives ONLY here on the server and is never
// shipped to the browser. Gemini 1.5 Flash provides a ~1M-token context
// window, so large extracted Excel/CSV/PDF content streams through without
// the tight token limits of smaller-context providers.

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Default model. NOTE: gemini-1.5-flash (and gemini-2.5-flash) are NOT offered
// to new Gemini accounts — Google returns 404 and recommends gemini-3.6-flash.
// We default to gemini-3.6-flash (multimodal, ~1M-token context), which is the
// closest available equivalent. Override with GEMINI_MODEL if your key/project
// supports a different model.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

export interface GeminiImage {
  dataUrl: string; // data:<mime>;base64,<payload>
  mime: string;
}

export async function streamGemini(opts: {
  system?: string | null;
  prompt: string;
  images?: GeminiImage[];
}): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];
    if (opts.images && opts.images.length > 0) {
      for (const img of opts.images) {
        const base64 = img.dataUrl.includes(",")
          ? img.dataUrl.split(",")[1]
          : img.dataUrl;
        parts.push({ inlineData: { mimeType: img.mime, data: base64 } });
      }
    }
    parts.push({ text: opts.prompt });

    const result = await ai.models.generateContentStream({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: opts.system ? { systemInstruction: opts.system } : undefined,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch {
          controller.enqueue(
            encoder.encode("\n\n[Error: generation was interrupted.]")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (e: any) {
    const msg = e?.message || "Gemini request failed while analyzing the file.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
