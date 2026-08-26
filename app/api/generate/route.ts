import { NextRequest } from "next/server";
import { streamGemini } from "@/lib/gemini";
import { getAgentSystem } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPrompt(userInput: string): string {
  return userInput;
}

// Detect short, casual greetings / pleasantries so we reply like an assistant
// instead of generating a heavy corporate report for "hi" or "hello".
function isCasualGreeting(input: string): boolean {
  const text = input.trim().toLowerCase();
  if (!text || text.length > 40) return false;
  return /^(hi|hii|hiii|hello|hey|heya|howdy|sup|yo|hiya|greetings|good\s*(morning|afternoon|evening)|hey\s*there|hi\s*there|what'?s\s*up|how\s*are\s*you|how\s*are\s*things|who\s*are\s*you|what\s*can\s*you\s*do)[\s!?.]*$/.test(
    text
  );
}

const CASUAL_REPLY =
  "Hi! I'm AI Report Generator, your advanced data analyst and report assistant. Tell me what you'd like to analyze or build — a market brief, a quarterly review, a project plan — and I'll generate a polished, structured report for you.";

export async function POST(req: NextRequest) {
  let prompt = "";
  let agent = "";
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt : "";
    agent = typeof body?.agent === "string" ? body.agent : "";
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

  // Casual greeting → friendly assistant reply, no heavy report generation.
  if (isCasualGreeting(prompt)) {
    return new Response(CASUAL_REPLY, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  return streamGemini({ system: getAgentSystem(agent), prompt: buildPrompt(prompt) });
}
