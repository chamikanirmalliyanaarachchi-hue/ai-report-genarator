export type ToolKind = "python" | "shell" | "sql" | "code";

export interface ExecStep {
  index: number;
  title: string;
  tool: ToolKind;
  filename?: string;
  language?: string;
  code: string;
  /** false while the stream is still open (unclosed code fence) */
  complete: boolean;
}

export interface ParsedReport {
  thinking: string;
  steps: ExecStep[];
  narrative: string;
  hasArtifacts: boolean;
}

const EMPTY: ParsedReport = {
  thinking: "",
  steps: [],
  narrative: "",
  hasArtifacts: false,
};

/**
 * Parse a streamed report into structured execution artifacts.
 * Totally safe for partial input (mid-stream) — never throws; on any
 * unexpected shape it returns the raw text as the narrative so the UI
 * always has something to render.
 */
export function parseReport(raw: string): ParsedReport {
  if (!raw) return EMPTY;
  try {
    return parse(raw);
  } catch {
    return { ...EMPTY, narrative: raw };
  }
}

function normalizeTool(lang: string, info: string): ToolKind {
  const l = lang.toLowerCase();
  if (l === "python" || l === "py") return "python";
  if (l === "bash" || l === "sh" || l === "shell" || l === "zsh" || l === "cmd" || l === "powershell" || l === "ps1")
    return "shell";
  if (l === "sql") return "sql";
  // Infer from a filename hint when the language tag is missing.
  const fn = info.match(/filename=([^\s]+)/i);
  if (fn) {
    const ext = fn[1].split(".").pop()?.toLowerCase();
    if (ext === "py" || ext === "python") return "python";
    if (ext === "sh" || ext === "bash" || ext === "bat" || ext === "ps1")
      return "shell";
    if (ext === "sql") return "sql";
  }
  return "code";
}

function parse(raw: string): ParsedReport {
  let thinking = "";
  let body = raw;

  // <think>...</think> (optionally still open mid-stream)
  const closedThink = raw.match(/<think>([\s\S]*?)<\/think>/i);
  if (closedThink) {
    thinking = closedThink[1].trim();
    body = raw.replace(/<think>[\s\S]*?<\/think>/i, "");
  } else {
    const openThink = raw.match(/<think>([\s\S]*)$/i);
    if (openThink) {
      thinking = openThink[1].trim();
      body = raw.slice(0, raw.indexOf("<think>"));
    }
  }

  const steps: ExecStep[] = [];
  const narrativeChunks: string[] = [];

  const lines = body.split("\n");
  let current: Partial<ExecStep> | null = null;
  let inFence = false;
  let fenceClosed = true;
  let fenceLang = "";
  let fenceInfo = "";
  let codeBuffer: string[] = [];
  const narrativeBuffer: string[] = [];

  const flushNarrative = () => {
    const t = narrativeBuffer.join("\n").trim();
    if (t) narrativeChunks.push(t);
    narrativeBuffer.length = 0;
  };

  const flushStep = () => {
    if (!current && codeBuffer.length === 0) return;
    const tool = current?.tool ?? "code";
    const language = (current?.language ?? fenceLang) || "text";
    const filename =
      current?.filename ??
      (tool === "python"
        ? "script.py"
        : tool === "shell"
          ? "command.sh"
          : tool === "sql"
            ? "query.sql"
            : "artifact.txt");
    steps.push({
      index: steps.length,
      title:
        current?.title ??
        (tool === "shell"
          ? "Run shell command"
          : tool === "python"
            ? `Run ${filename}`
            : "Execution step"),
      tool,
      filename,
      language,
      code: codeBuffer.join("\n"),
      complete: fenceClosed,
    });
    current = null;
    codeBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ### STEP: <title>
    const stepMatch = line.match(/^#{1,4}\s*step:\s*(.+)$/i);
    if (stepMatch && !inFence) {
      flushNarrative();
      flushStep();
      current = { title: stepMatch[1].trim() };
      continue;
    }

    // ```lang filename=...
    const fenceMatch = line.match(/^```(\w+)?\s*(.*)$/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceClosed = false;
        fenceLang = (fenceMatch[1] || "").toLowerCase();
        fenceInfo = fenceMatch[2] || "";
        if (!current) current = {};
        current.tool = normalizeTool(fenceLang, fenceInfo);
        current.language = fenceLang || "text";
        const fn = fenceInfo.match(/filename=([^\s]+)/i);
        if (fn) current.filename = fn[1];
        codeBuffer = [];
        continue;
      } else {
        inFence = false;
        fenceClosed = true;
        flushStep();
        continue;
      }
    }

    if (inFence) {
      codeBuffer.push(line);
      continue;
    }
    narrativeBuffer.push(line);
  }

  if (inFence) {
    // fence still open (streaming) — emit the partial step.
    flushStep();
  } else {
    flushNarrative();
    flushStep();
  }
  if (current) flushStep();

  const narrative = narrativeChunks.join("\n\n").trim();
  return {
    thinking,
    steps,
    narrative,
    hasArtifacts: steps.length > 0,
  };
}
