// Isomorphic statistical profiler for tabular uploads (CSV / TSV / XLSX / XLS).
// Pure TypeScript — safe to import on the server (Node) and in the browser.
// It computes REAL descriptive statistics, distributions, and correlations so
// the analysis report is grounded in actual numbers rather than model estimates.

export type ColumnType = "numeric" | "date" | "categorical" | "text";

export interface DistributionBin {
  label: string;
  value: number;
}

export interface ColumnStat {
  name: string;
  type: ColumnType;
  count: number; // non-empty values
  missing: number; // empty values
  distinct: number;
  // numeric
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  outliers?: number;
  // categorical / distribution
  top?: { value: string; count: number; pct: number }[];
  distribution?: DistributionBin[];
}

export interface Correlation {
  a: string;
  b: string;
  r: number;
}

export interface DataProfile {
  source: string;
  rowCount: number;
  colCount: number;
  missingCells: number;
  columns: ColumnStat[];
  correlations: Correlation[];
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

// ---------- parsing ----------

export function detectDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const count = firstLine.split(d).length;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

// RFC4180-ish CSV/TSV parser that handles quoted fields and embedded delimiters.
export function parseDelimited(text: string, delim?: string): ParsedTable {
  const d = delim ?? detectDelimiter(text);
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === d) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((x) => x.length > 0)) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((x) => x.length > 0)) rows.push(row);
  }

  if (rows.length === 0) return { headers: [], rows: [] };
  // Normalize ragged rows to the max width.
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const norm = rows.map((r) => {
    const out = r.slice();
    while (out.length < width) out.push("");
    return out;
  });
  const headers = norm[0].map((h, i) => (h && h.trim()) || `Column ${i + 1}`);
  const dataRows = norm.slice(1);
  return { headers, rows: dataRows };
}

// ---------- value classification ----------

function cleanNumber(raw: string): number | null {
  if (raw == null) return null;
  let s = raw.trim();
  if (!s) return null;
  const neg = s.startsWith("(") && s.endsWith(")");
  s = s.replace(/[(),$\s%]/g, "");
  if (s === "" || s === "-") return null;
  if (/^-?\d*\.?\d+$/.test(s)) {
    const n = parseFloat(s);
    return neg ? -n : n;
  }
  return null;
}

function isDateString(s: string): boolean {
  if (!/\d{2,}/.test(s)) return false;
  // avoid classifying plain numbers as dates
  if (/^\d+(\.\d+)?$/.test(s.trim())) return false;
  const t = Date.parse(s);
  return !isNaN(t);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function pearson(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 3) return null;
  let sa = 0,
    sb = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i];
    sb += b[i];
  }
  const ma = sa / n;
  const mb = sb / n;
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma;
    const xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  if (da === 0 || db === 0) return null;
  return num / Math.sqrt(da * db);
}

// ---------- profiling ----------

export function computeProfile(
  source: string,
  headers: string[],
  rows: string[][]
): DataProfile {
  const rowCount = rows.length;
  const colCount = headers.length;
  const columns: ColumnStat[] = [];

  for (let c = 0; c < colCount; c++) {
    const values = rows.map((r) => (r[c] ?? "").trim());
    const nonEmpty = values.filter((v) => v.length > 0);
    const missing = rowCount - nonEmpty.length;
    const distinct = new Set(nonEmpty.map((v) => v.toLowerCase())).size;

    let numericCount = 0;
    const nums: number[] = [];
    let dateCount = 0;
    for (const v of nonEmpty) {
      const n = cleanNumber(v);
      if (n !== null) {
        numericCount++;
        nums.push(n);
      } else if (isDateString(v)) {
        dateCount++;
      }
    }

    const col: ColumnStat = {
      name: headers[c],
      type: "text",
      count: nonEmpty.length,
      missing,
      distinct,
    };

    const numericRatio = nonEmpty.length ? numericCount / nonEmpty.length : 0;
    const dateRatio = nonEmpty.length ? dateCount / nonEmpty.length : 0;
    const avgLen =
      nonEmpty.length ? nonEmpty.reduce((s, v) => s + v.length, 0) / nonEmpty.length : 0;

    if (numericRatio >= 0.8) {
      col.type = "numeric";
      const sorted = [...nums].sort((a, b) => a - b);
      const mean = nums.reduce((s, v) => s + v, 0) / nums.length;
      const variance =
        nums.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (nums.length - 1 || 1);
      const std = Math.sqrt(variance);
      const q1 = quantile(sorted, 0.25);
      const q3 = quantile(sorted, 0.75);
      const iqr = q3 - q1;
      const lo = q1 - 1.5 * iqr;
      const hi = q3 + 1.5 * iqr;
      const outliers = nums.filter((v) => v < lo || v > hi).length;
      col.mean = mean;
      col.median = quantile(sorted, 0.5);
      col.std = std;
      col.min = sorted[0];
      col.max = sorted[sorted.length - 1];
      col.q1 = q1;
      col.q3 = q3;
      col.iqr = iqr;
      col.outliers = outliers;

      // distribution buckets
      const min = col.min!;
      const max = col.max!;
      const binCount = 6;
      const bins: DistributionBin[] = Array.from({ length: binCount }, (_, i) => ({
        label: "",
        value: 0,
      }));
      if (max > min) {
        const step = (max - min) / binCount;
        for (const v of nums) {
          let idx = Math.floor((v - min) / step);
          if (idx >= binCount) idx = binCount - 1;
          if (idx < 0) idx = 0;
          bins[idx].value++;
        }
        for (let i = 0; i < binCount; i++) {
          const loV = min + i * step;
          const hiV = i === binCount - 1 ? max : min + (i + 1) * step;
          bins[i].label = `${fmt(loV)}–${fmt(hiV)}`;
        }
      }
      col.distribution = bins;
    } else if (dateRatio >= 0.8) {
      col.type = "date";
      col.distribution = undefined;
    } else if (distinct <= Math.max(25, rowCount * 0.5) && avgLen < 60) {
      col.type = "categorical";
      const counts = new Map<string, number>();
      for (const v of nonEmpty) counts.set(v, (counts.get(v) ?? 0) + 1);
      const top = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([value, count]) => ({
          value,
          count,
          pct: (count / nonEmpty.length) * 100,
        }));
      col.top = top;
      col.distribution = top.map((t) => ({ label: t.value, value: t.count }));
    } else {
      col.type = "text";
    }

    columns.push(col);
  }

  // Correlations between numeric columns.
  const numericCols = columns
    .map((col, idx) => ({ col, idx }))
    .filter((x) => x.col.type === "numeric");
  const correlations: Correlation[] = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const a = numericCols[i].col;
      const b = numericCols[j].col;
      const aVals: number[] = [];
      const bVals: number[] = [];
      for (let r = 0; r < rowCount; r++) {
        const av = cleanNumber(rows[r][numericCols[i].idx] ?? "");
        const bv = cleanNumber(rows[r][numericCols[j].idx] ?? "");
        if (av !== null && bv !== null) {
          aVals.push(av);
          bVals.push(bv);
        }
      }
      const r = pearson(aVals, bVals);
      if (r !== null && Math.abs(r) >= 0.3) {
        correlations.push({ a: a.name, b: b.name, r: Math.round(r * 100) / 100 });
      }
    }
  }
  correlations.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));

  const missingCells = columns.reduce((s, c) => s + c.missing, 0);

  return {
    source,
    rowCount,
    colCount,
    missingCells,
    columns,
    correlations: correlations.slice(0, 12),
  };
}

// ---------- formatting ----------

export function fmt(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n);
  const decimals = abs >= 1000 ? 0 : abs >= 1 ? 2 : 3;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function strengthLabel(r: number): string {
  const a = Math.abs(r);
  if (a >= 0.8) return "very strong";
  if (a >= 0.6) return "strong";
  if (a >= 0.4) return "moderate";
  if (a >= 0.3) return "weak";
  return "negligible";
}

// Compact block injected into the LLM prompt so it grounds claims in real stats.
export function formatProfileForPrompt(profiles: DataProfile[]): string {
  if (profiles.length === 0) return "";
  const blocks = profiles.map((p) => {
    const lines: string[] = [];
    lines.push(
      `DATA PROFILE for "${p.source}" (COMPUTED, use these exact figures):`
    );
    lines.push(
      `- Shape: ${p.rowCount} rows × ${p.colCount} columns; missing cells: ${p.missingCells} (${(
        (p.missingCells / Math.max(1, p.rowCount * p.colCount)) *
        100
      ).toFixed(1)}%)`
    );
    for (const c of p.columns) {
      if (c.type === "numeric") {
        lines.push(
          `- Numeric "${c.name}": n=${c.count}, missing=${c.missing}, mean=${fmt(
            c.mean!
          )}, median=${fmt(c.median!)}, std=${fmt(c.std!)}, min=${fmt(
            c.min!
          )}, max=${fmt(c.max!)}, Q1=${fmt(c.q1!)}, Q3=${fmt(
            c.q3!
          )}, outliers(IQR)=${c.outliers}`
        );
      } else if (c.type === "categorical" || c.type === "date") {
        const topStr = (c.top ?? [])
          .slice(0, 5)
          .map((t) => `${t.value}=${t.count} (${t.pct.toFixed(1)}%)`)
          .join(", ");
        lines.push(
          `- ${c.type === "date" ? "Date" : "Categorical"} "${c.name}": n=${
            c.count
          }, missing=${c.missing}, distinct=${c.distinct}${
            topStr ? `, top: ${topStr}` : ""
          }`
        );
      }
    }
    if (p.correlations.length) {
      lines.push(`- Correlations (Pearson):`);
      for (const cor of p.correlations.slice(0, 8)) {
        lines.push(
          `    • ${cor.a} ~ ${cor.b}: r=${cor.r} (${strengthLabel(cor.r)} ${
            cor.r >= 0 ? "positive" : "negative"
          })`
        );
      }
    }
    return lines.join("\n");
  });
  return blocks.join("\n\n");
}
