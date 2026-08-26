// Block-level Markdown parser used by the PDF/DOCX exporters so generated
// reports render as real document structure (headings, tables, lists, code,
// diagrams) instead of raw markdown text.

export type DocNode =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "hr" };

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

const isTableSep = (s: string) =>
  /^\s*\|?[\s:|-]+\|?\s*$/.test(s) && s.includes("-");

export function parseDocBlocks(md: string): DocNode[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const nodes: DocNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const prevI = i;

    // Fenced code (```lang ... ```) — includes mermaid diagrams. Also accept
    // the `filename=...` form emitted by the EXEC protocol.
    const fence = line.match(/^```\s*([\w.-]*)(?:\s+filename=[\w.\-]+)?\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      nodes.push({ type: "code", lang, code: buf.join("\n") });
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      nodes.push({ type: "heading", level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      nodes.push({ type: "hr" });
      i++;
      continue;
    }

    // GFM table
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      isTableSep(lines[i + 1])
    ) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      nodes.push({ type: "table", header, rows });
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "").trim());
        i++;
      }
      nodes.push({ type: "bullets", items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, "").trim());
        i++;
      }
      nodes.push({ type: "numbered", items });
      continue;
    }

    // Paragraph (aggregate consecutive plain lines). Always consumes the current
    // line first so `i` advances even when the aggregation loop below stops
    // immediately (e.g. a line like "```python filename=x.py" that starts with
    // backticks but isn't a valid fence opener) — otherwise we'd loop forever.
    if (line.trim() !== "") {
      const buf: string[] = [line.trim()];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^```/.test(lines[i]) &&
        !/^(#{1,6})\s+/.test(lines[i]) &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i]) &&
        !(
          lines[i].includes("|") &&
          i + 1 < lines.length &&
          isTableSep(lines[i + 1])
        )
      ) {
        buf.push(lines[i].trim());
        i++;
      }
      nodes.push({ type: "paragraph", text: buf.join(" ") });
      continue;
    }

    i++; // blank line

    // Safety net: guarantee forward progress so a malformed/unexpected line can
    // never cause an infinite loop (which previously surfaced as a RangeError
    // "Invalid array length" from unbounded Array.push).
    if (i === prevI) i++;
  }

  return nodes;
}


// Convert **bold**, *italic*, `code` inline markup to plain text (for PDF,
// which can't easily render inline emphasis without splitting runs).
export function stripInline(s: string): string {
  return s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*(.*?)\*/g, "$1");
}
