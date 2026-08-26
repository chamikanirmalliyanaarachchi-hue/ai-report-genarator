// Frontend clients for live generation. The browser never talks to Groq
// directly and never sees the API key — it calls our own server routes.

async function readStream(res: Response): Promise<string> {
  if (!res.ok || !res.body) {
    let msg = "Request failed.";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) full += chunk;
  }
  return full;
}

/** Generate a report from a text prompt via POST /api/generate (streamed). */
export async function streamReport(
  userInput: string,
  onChunk: (chunk: string) => void,
  agent = ""
): Promise<{ text: string }> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: userInput, agent }),
  });

  const reader = res.body?.getReader();
  if (!res.ok || !reader) {
    let msg = "Failed to generate your report.";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onChunk(chunk);
    }
  }

  if (!full.trim()) {
    throw new Error("The model returned an empty response. Please try a different prompt.");
  }
  return { text: full };
}

/**
 * Analyze uploaded files. The raw files are sent as multipart FormData to the
 * backend, which saves them locally and parses them server-side (xlsx/mammoth/
 * pdf-parse), then streams the analysis back.
 */
export async function analyzeFiles(
  files: File[],
  userInput: string,
  onChunk: (chunk: string) => void,
  agent = ""
): Promise<{ text: string }> {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  form.append("prompt", userInput || "");
  form.append("agent", agent);

  const res = await fetch("/api/analyze-file", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    // Read the error body directly — the stream has NOT been locked yet, so
    // .json()/.text() are safe and we surface the real backend reason.
    let errorMessage = "Failed to analyze the file(s).";
    try {
      const errorData = await res.json();
      errorMessage =
        errorData.error || errorData.message || JSON.stringify(errorData);
    } catch {
      const textErr = await res.text();
      if (textErr) errorMessage = textErr;
    }
    throw new Error(errorMessage);
  }

  // Only now do we lock the stream for reading the success body.
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Failed to analyze the file(s).");
  }

  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onChunk(chunk);
    }
  }

  if (!full.trim()) {
    throw new Error(
      "The model returned no content for this file. Try a different file or add a short instruction."
    );
  }
  return { text: full };
}

/** Generate an image from a prompt via POST /api/generate-image. */
export async function generateImage(
  prompt: string
): Promise<{ imageUrl: string; revisedPrompt?: string }> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg =
      (data as { error?: string } | null)?.error ||
      "Image generation failed.";
    throw new Error(msg);
  }

  const url = (data as { imageUrl?: string } | null)?.imageUrl;
  if (!url) throw new Error("No image was returned by the image service.");
  return { imageUrl: url, revisedPrompt: (data as { revisedPrompt?: string })?.revisedPrompt };
}
