import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Image generation is performed server-side so the exact provider/URL can be
// swapped without touching the client. We use Pollinations AI — a free,
// key-less image endpoint — so no API key is required. To use a different
// provider (DALL·E, Stable Diffusion, etc.), change buildImageUrl below.
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

function buildImageUrl(prompt: string): string {
  const p = prompt.trim();
  const encoded = encodeURIComponent(p);
  // width/height for a clean square; nologo removes the watermark.
  return `${POLLINATIONS_BASE}/${encoded}?width=1024&height=1024&nologo=true`;
}

export async function POST(req: NextRequest) {
  let prompt = "";
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: "Prompt is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // No text LLM is involved — we hand the model prompt straight to the
  // image provider and return the resulting image URL.
  const imageUrl = buildImageUrl(prompt);
  return new Response(JSON.stringify({ imageUrl }), {
    headers: { "Content-Type": "application/json" },
  });
}
