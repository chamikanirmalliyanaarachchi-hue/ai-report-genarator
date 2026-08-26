import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { streamGemini } from "@/lib/gemini";
import { getAgentSystem, VISION_SYSTEM } from "@/lib/prompts";
import {
  parseDelimited,
  computeProfile,
  formatProfileForPrompt,
  type DataProfile,
} from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];
const TABULAR_EXTS = ["csv", "tsv", "txt", "text", "xlsx", "xls"];

// Compute a real statistical profile for a tabular buffer (CSV/TSV/TXT/XLSX/XLS).
// Returns one DataProfile per sheet/file. Non-tabular files return [].
async function computeProfiles(
  buffer: Buffer,
  ext: string,
  name: string
): Promise<DataProfile[]> {
  try {
    if (ext === "xlsx" || ext === "xls") {
      const mod = (await import("xlsx")) as any;
      const XLSX = mod.default ?? mod;
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const out: DataProfile[] = [];
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        const aoa = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: false,
        }) as unknown[][];
        if (!aoa.length) continue;
        const headers = (aoa[0] ?? []).map((h, i) =>
          String(h ?? "").trim() || `Column ${i + 1}`
        );
        const rows = aoa
          .slice(1)
          .map((r) => (r as unknown[]).map((v) => (v == null ? "" : String(v))));
        out.push(computeProfile(`${name} ▸ ${sheetName}`, headers, rows));
      }
      return out;
    }

    if (ext === "csv" || ext === "tsv" || ext === "txt" || ext === "text") {
      const text = buffer.toString("utf-8");
      const { headers, rows } = parseDelimited(text, ext === "tsv" ? "\t" : undefined);
      if (!rows.length) return [];
      return [computeProfile(name, headers, rows)];
    }
  } catch {
    /* profiling is best-effort; never abort the analysis */
  }
  return [];
}

function imageMime(ext: string): string {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    default:
      return "image/png";
  }
}

/**
 * Parse an in-memory buffer based on file extension into a clean text string.
 * Parsers are imported lazily so a single failing package can never crash the
 * module load. Every failure throws — the caller decides how to surface it.
 */
async function extractFromBuffer(buffer: Buffer, ext: string): Promise<string> {
  switch (ext) {
    case "pdf": {
      const mod = (await import("pdf-parse/lib/pdf-parse.js")) as any;
      const pdfParse = mod.default ?? mod;
      const out = await pdfParse(buffer);
      return out.text || "";
    }
    case "docx": {
      const mod = (await import("mammoth")) as any;
      const mammoth = mod.default ?? mod;
      const out = await mammoth.extractRawText({ buffer });
      return out.value || "";
    }
    case "xlsx":
    case "xls": {
      const mod = (await import("xlsx")) as any;
      const XLSX = mod.default ?? mod;
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const parts: string[] = [];
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        try {
          // Clean markdown-friendly CSV so the model sees real rows/columns.
          parts.push(
            `### Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`
          );
        } catch {
          parts.push(`### Sheet: ${sheetName}\n(unable to read this sheet)`);
        }
      }
      return parts.join("\n\n");
    }
    case "csv":
    case "txt":
    case "text":
    case "md":
      return buffer.toString("utf-8");
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const raw = form.getAll("files");
    const files = raw.filter((f) => typeof f !== "string") as unknown as File[];
    const prompt = String(form.get("prompt") || "");
    const agent = String(form.get("agent") || "");

    if (files.length === 0) {
      return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
    }

    const sections: string[] = [];
    const skipped: string[] = [];
    const profiles: DataProfile[] = [];
    const imagePayloads: { dataUrl: string; mime: string }[] = [];

    for (const file of files) {
      const ext =
        (path.extname(file.name).replace(".", "").toLowerCase()) || "";
      const buf = Buffer.from(await file.arrayBuffer());

      // Best-effort local save for debugging — never lets a disk error abort
      // the analysis. The real work happens on the in-memory buffer below.
      try {
        const dir = path.join(process.cwd(), "uploads");
        fs.mkdirSync(dir, { recursive: true });
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
        fs.writeFileSync(path.join(dir, safe), buf);
      } catch {
        /* ignore save failures (e.g. read-only filesystem) */
      }

      // Images go through the multimodal vision pipeline.
      if (IMAGE_EXTS.includes(ext)) {
        imagePayloads.push({
          dataUrl: `data:${imageMime(ext)};base64,${buf.toString("base64")}`,
          mime: imageMime(ext),
        });
        continue;
      }

      // Everything else is parsed to text on the server before reaching the LLM.
      try {
        const text = await extractFromBuffer(buf, ext);
        if (text.trim()) {
          sections.push(`### ${file.name}\n${text}`);
        } else {
          skipped.push(`${file.name} (no extractable text)`);
        }
      } catch (e) {
        skipped.push(
          `${file.name}: ${e instanceof Error ? e.message : "unreadable"}`
        );
      }

      // Best-effort real statistical profile (CSV/TSV/TXT/XLSX/XLS).
      if (TABULAR_EXTS.includes(ext)) {
        const ps = await computeProfiles(buf, ext, file.name);
        profiles.push(...ps);
      }
    }

    // Gemini 1.5 Flash has a ~1M-token window, so we pass the FULL parsed
    // content without truncation — no 8k/context overflow risk like the old
    // Groq pipeline. (A pathological multi-hundred-MB doc could still overflow
    // the request; that edge case is left to the model/transport layer.)
    const docContext = sections.join("\n\n");

    // ---- Multimodal (image) path ----
    // Gemini 1.5 Flash is natively multimodal, so images go through the same
    // stream with inline image parts — no separate vision model needed.
    if (imagePayloads.length > 0 && sections.length === 0) {
      const visionPrompt =
        `The user attached image(s) (charts, documents, screenshots, or tables) for analysis.\n\n` +
        `User request: ${
          prompt || "(no extra instruction — analyze the visual content thoroughly)"
        }`;
      return streamGemini({
        system: VISION_SYSTEM,
        prompt: visionPrompt,
        images: imagePayloads,
      });
    }

    // ---- Text / spreadsheet / document path ----
    if (sections.length === 0) {
      const reason = skipped.length
        ? `Could not read the uploaded file(s): ${skipped.join("; ")}.`
        : "No readable text could be extracted from the uploaded file(s).";
      return NextResponse.json({ error: reason }, { status: 422 });
    }

    const profileBlock = profiles.length
      ? `\n\n--- BEGIN COMPUTED DATA PROFILE (use these exact figures) ---\n${formatProfileForPrompt(
          profiles
        )}\n--- END COMPUTED DATA PROFILE ---\n\n` +
        `Use the COMPUTED DATA PROFILE above as the authoritative source of ` +
        `truth for every statistic you cite (means, medians, correlations, ` +
        `distributions, missing values). Do not estimate or round differently ` +
        `from those figures; build your charts and tables directly from them.`
      : "";

    const userPrompt =
      `The user attached the following file(s) for analysis. ` +
      `Here is the parsed data extracted from the uploaded file(s):\n\n` +
      `--- BEGIN PARSED DATA ---\n${docContext}\n--- END PARSED DATA ---\n\n` +
      `User request: ${
        prompt || "(no extra instruction — analyze the data thoroughly)"
      }\n\n` +
      `Use the parsed data above as the source of truth. Provide a structured, ` +
      `professional analysis that covers the full dataset.` +
      profileBlock;

    return streamGemini({ system: getAgentSystem(agent), prompt: userPrompt });
  } catch (e) {
    // Final safety net: always return JSON, never an unhandled rejection.
    const message =
      e instanceof Error
        ? e.message
        : "Unexpected server error while analyzing the file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
