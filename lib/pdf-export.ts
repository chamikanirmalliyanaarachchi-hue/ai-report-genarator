// Client-side document export for generated reports.
// PDF via jsPDF + jspdf-autotable; DOCX via the `docx` library.
// Both render the report's Markdown through a shared block parser so headings,
// tables, bullet lists, code, and Mermaid diagrams become real document
// structure instead of raw markdown text.

import { parseDocBlocks, stripInline, type DocNode } from "./markdown-blocks";
import type { DataProfile } from "./stats";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ----------------------------- Mermaid -> PNG ----------------------------- */

async function mermaidToPng(
  code: string
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });
    const id = "mmd-export-" + Math.random().toString(36).slice(2);
    const { svg } = await mermaid.render(id, code);
    const svg64 =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svg)));
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("mermaid image load failed"));
      img.src = svg64;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return null;
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* --------------------------- Canvas chart helpers --------------------------- */
// Charts are drawn on an offscreen <canvas> (browser) and embedded as PNG so we
// get full creative control (gradients, rounded bars, legends) instead of plain
// Mermaid output. Each helper returns a data URL + aspect ratio (h/w).

const CHART_PALETTE: [number, number, number][] = [
  [99, 102, 241],
  [14, 165, 233],
  [245, 158, 11],
  [34, 197, 94],
  [239, 68, 68],
  [168, 85, 247],
  [236, 72, 153],
  [20, 184, 166],
];

function chartFmt(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (a >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(Math.round(n * 100) / 100);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

interface ChartImage {
  dataUrl: string;
  aspect: number; // height / width
}

async function renderBarChart(
  labels: string[],
  values: number[],
  heading: string
): Promise<ChartImage | null> {
  try {
    const W = 800;
    const H = 360;
    const c = document.createElement("canvas");
    const dpr = 2;
    c.width = W * dpr;
    c.height = H * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const pl = 62;
    const pr = 24;
    const pt = 52;
    const pb = 104;
    const plotW = W - pl - pr;
    const plotH = H - pt - pb;
    const maxV = Math.max(...values, 1);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(heading, pl, 30);

    // Y-axis gridlines + value labels (kept clear of the plot via left padding)
    ctx.strokeStyle = "#e5e7eb";
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = (maxV * i) / ticks;
      const gy = pt + plotH - (plotH * i) / ticks;
      ctx.beginPath();
      ctx.moveTo(pl, gy);
      ctx.lineTo(pl + plotW, gy);
      ctx.stroke();
      ctx.fillText(chartFmt(v), pl - 10, gy);
    }

    const n = labels.length;
    const slot = plotW / n;
    const bw = Math.min(slot * 0.6, 64);
    for (let i = 0; i < n; i++) {
      const bh = plotH * (values[i] / maxV);
      const bx = pl + slot * i + (slot - bw) / 2;
      const by = pt + plotH - bh;
      const col = CHART_PALETTE[i % CHART_PALETTE.length];
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      roundRectPath(ctx, bx, by, bw, bh, 4);
      ctx.fill();

      // Value label drawn on an opaque white pill so it can never overlap the
      // bars, gridlines, or the top axis — placed just above each bar.
      const valTxt = chartFmt(values[i]);
      ctx.font = "bold 12px sans-serif";
      const tw = ctx.measureText(valTxt).width;
      const tx = bx + bw / 2;
      const ty = by - 7;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(tx - tw / 2 - 4, ty - 12, tw + 8, 15);
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(valTxt, tx, ty);

      // X-axis category labels (wrapped, max 2 lines, clear of the plot area)
      ctx.fillStyle = "#374151";
      ctx.font = "10px sans-serif";
      ctx.textBaseline = "top";
      const words = String(labels[i]).split(/\s+/);
      let line = "";
      const lines: string[] = [];
      for (const w of words) {
        const t = line ? line + " " + w : w;
        if (ctx.measureText(t).width > slot - 8 && line) {
          lines.push(line);
          line = w;
        } else line = t;
      }
      if (line) lines.push(line);
      lines
        .slice(0, 2)
        .forEach((l, k) =>
          ctx.fillText(l, bx + bw / 2, pt + plotH + 10 + k * 12)
        );
    }
    return { dataUrl: c.toDataURL("image/png"), aspect: H / W };
  } catch {
    return null;
  }
}

async function renderPieChart(
  labels: string[],
  values: number[],
  heading: string
): Promise<ChartImage | null> {
  try {
    const MAX_SLICES = 8;
    const L = labels.slice(0, MAX_SLICES);
    const V = values.slice(0, MAX_SLICES);
    const W = 800;
    const H = 380;
    const c = document.createElement("canvas");
    const dpr = 2;
    c.width = W * dpr;
    c.height = H * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(heading, 30, 28);

    const cx = 210;
    const cy = 210;
    const r = 150;
    const total = V.reduce((s, v) => s + v, 0) || 1;
    let start = -Math.PI / 2;
    for (let i = 0; i < L.length; i++) {
      const ang = (V[i] / total) * Math.PI * 2;
      const col = CHART_PALETTE[i % CHART_PALETTE.length];
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + ang);
      ctx.closePath();
      ctx.fill();
      start += ang;
    }

    const lx = 430;
    let ly = 120;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < L.length; i++) {
      const col = CHART_PALETTE[i % CHART_PALETTE.length];
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      roundRectPath(ctx, lx, ly - 8, 14, 14, 3);
      ctx.fill();
      ctx.fillStyle = "#111827";
      ctx.font = "13px sans-serif";
      const pct = ((V[i] / total) * 100).toFixed(1);
      const name =
        String(L[i]).length > 22
          ? String(L[i]).slice(0, 21) + "…"
          : L[i];
      ctx.fillText(`${name}  (${pct}%)`, lx + 22, ly);
      ly += 30;
    }
    return { dataUrl: c.toDataURL("image/png"), aspect: H / W };
  } catch {
    return null;
  }
}

/* -------------------------------- PDF ------------------------------------ */

/** Generate and download a PDF report. Returns the file size in bytes. */
export async function downloadReportPdf(
  title: string,
  content: string,
  filename: string,
  profiles?: { name: string; profile: DataProfile }[]
): Promise<number> {
  if (!content?.trim()) return 0;

  const { jsPDF } = await import("jspdf");
  const autoTableMod = (await import("jspdf-autotable")) as any;
  let autoTable =
    autoTableMod.default ?? autoTableMod.autoTable ?? autoTableMod;
  if (autoTable && autoTable.default && typeof autoTable.default === "function") {
    autoTable = autoTable.default;
  }
  if (typeof autoTable !== "function") {
    throw new Error("jspdf-autotable failed to load");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxW = pageW - margin * 2;
  const footerH = 12;

  const BRAND: [number, number, number] = [17, 24, 39];
  const ACCENT: [number, number, number] = [99, 102, 241];

  const nodes = parseDocBlocks(content);
  let y = margin;

  const drawSlimHeader = () => {
    doc.setFillColor(BRAND[0], BRAND[1], BRAND[2]);
    doc.rect(0, 0, pageW, 10, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Camco AI", margin, 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(200);
    const t = doc.splitTextToSize(title, 90);
    doc.text(t, pageW - margin, 7, { align: "right" });
  };

  const ensure = (needed: number) => {
    if (y + needed > pageH - margin - footerH) {
      doc.addPage();
      drawSlimHeader();
      y = 16;
    }
  };

  // Renders the computed-stats executive dashboard (status cards, risk badge,
  // data-quality progress bars, cohort bar chart, segment pie, correlation
  // meters) directly from a DataProfile.
  const renderProfileDashboard = async (
    profile: DataProfile,
    sourceName: string
  ) => {
    ensure(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Executive Data Profile", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130);
    const src = doc.splitTextToSize(sourceName, maxW - 60);
    doc.text(src, pageW - margin, y, { align: "right" });
    y += 4;
    doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 40, y);
    y += 6;

    const rowsC = profile.rowCount;
    const colsC = profile.colCount;
    const cells = rowsC * colsC || 1;
    const missingPct = (profile.missingCells / cells) * 100;
    const numCols = profile.columns.filter((c) => c.type === "numeric");
    const totalOutliers = numCols.reduce((s, c) => s + (c.outliers || 0), 0);
    const outlierRate = rowsC ? (totalOutliers / rowsC) * 100 : 0;
    const highAlert = missingPct > 15 || outlierRate > 5;

    // KPI status cards
    const cardH = 20;
    const gap = 4;
    const cardW = (maxW - gap * 3) / 4;
    const cards: {
      label: string;
      value: string;
      color: [number, number, number];
    }[] = [
      { label: "Records", value: chartFmt(rowsC), color: [99, 102, 241] },
      { label: "Fields", value: String(colsC), color: [14, 165, 233] },
      {
        label: "Missing Data",
        value: missingPct.toFixed(1) + "%",
        color: [245, 158, 11],
      },
      { label: "Outliers", value: String(totalOutliers), color: [239, 68, 68] },
    ];
    ensure(cardH + 4);
    cards.forEach((cd, i) => {
      const x = margin + i * (cardW + gap);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
      doc.setFillColor(cd.color[0], cd.color[1], cd.color[2]);
      doc.rect(x, y, 1.6, cardH, "F");
      doc.setTextColor(110);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(cd.label.toUpperCase(), x + 4, y + 6);
      doc.setTextColor(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(cd.value, x + 4, y + 16);
    });
    y += cardH + 6;

    // Risk severity badge + reason
    const badgeW = 52;
    const badgeH = 12;
    ensure(badgeH + 4);
    doc.setFillColor(
      highAlert ? 220 : 22,
      highAlert ? 38 : 163,
      highAlert ? 38 : 74
    );
    doc.roundedRect(margin, y, badgeW, badgeH, 3, 3, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(highAlert ? "HIGH ALERT" : "SUSTAINABLE", margin + badgeW / 2, y + 8, {
      align: "center",
    });
    doc.setTextColor(90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      highAlert
        ? `Elevated risk: ${missingPct.toFixed(1)}% missing, ${outlierRate.toFixed(1)}% outliers.`
        : `Within tolerance: ${missingPct.toFixed(1)}% missing, ${outlierRate.toFixed(1)}% outliers.`,
      margin + badgeW + 6,
      y + 8
    );
    y += badgeH + 5;

    // Data-quality progress bars
    const barH = 7;
    const bars = [
      {
        label: "Missing data",
        pct: Math.min(100, missingPct),
        color: [245, 158, 11] as [number, number, number],
      },
      {
        label: "Outlier rate",
        pct: Math.min(100, outlierRate * 5),
        color: [239, 68, 68] as [number, number, number],
      },
    ];
    bars.forEach((b) => {
      ensure(barH + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text(b.label, margin, y + 5);
      const trackX = margin + 34;
      const trackW = maxW - 34 - 16;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(trackX, y, trackW, barH, 2, 2, "F");
      const fw = Math.max(2, (trackW * Math.min(100, b.pct)) / 100);
      doc.setFillColor(b.color[0], b.color[1], b.color[2]);
      doc.roundedRect(trackX, y, fw, barH, 2, 2, "F");
      doc.setTextColor(60);
      doc.text(`${b.pct.toFixed(1)}%`, trackX + trackW + 2, y + 5);
      y += barH + 6;
    });
    y += 2;

    // Pick the most relevant distribution column for the charts. Skip unique /
    // identifier / date-like columns such as "Year" (which yield flat, uniform
    // bars). Prefer a numeric distribution with real spread (e.g. Total Score),
    // otherwise a categorical column with a sensible, varied set of categories.
    const isUniqueLike = (c: DataProfile["columns"][number]) =>
      c.count > 0 && c.distinct >= c.count * 0.8;
    const variedNumeric = profile.columns.find(
      (c) =>
        c.type === "numeric" &&
        c.distribution &&
        c.distribution.length > 1 &&
        Math.max(...c.distribution.map((d) => d.value)) -
          Math.min(...c.distribution.map((d) => d.value)) >
          0
    );
    const catDist = profile.columns
      .filter(
        (c) =>
          c.type === "categorical" &&
          c.top &&
          c.top.length >= 2 &&
          c.top.length <= 12 &&
          !isUniqueLike(c)
      )
      .sort(
        (a, b) =>
          (b.top?.reduce((s, t) => s + t.count, 0) ?? 0) -
          (a.top?.reduce((s, t) => s + t.count, 0) ?? 0)
      )[0];

    const barSource = variedNumeric ?? catDist;
    const pieSource = catDist ?? variedNumeric;

    if (barSource) {
      const barLabels = barSource.distribution
        ? barSource.distribution.map((d) => d.label)
        : (barSource.top ?? []).map((t) => t.value);
      const barValues = barSource.distribution
        ? barSource.distribution.map((d) => d.value)
        : (barSource.top ?? []).map((t) => t.count);
      const barTitle =
        barSource.type === "numeric"
          ? `Distribution — ${barSource.name}`
          : `Top Categories — ${barSource.name}`;
      const bar = await renderBarChart(barLabels, barValues, barTitle);
      if (bar) {
        const w = maxW;
        const h = w * bar.aspect;
        ensure(h + 6);
        doc.addImage(bar.dataUrl, "PNG", margin, y, w, h);
        y += h + 4;
      }
    }

    if (pieSource) {
      const pieLabels =
        pieSource.top && pieSource.top.length
          ? pieSource.top.map((t) => t.value)
          : (pieSource.distribution ?? []).map((d) => d.label);
      const pieValues =
        pieSource.top && pieSource.top.length
          ? pieSource.top.map((t) => t.count)
          : (pieSource.distribution ?? []).map((d) => d.value);
      if (pieLabels.length) {
        const pie = await renderPieChart(
          pieLabels,
          pieValues,
          `Segment Distribution — ${pieSource.name}`
        );
        if (pie) {
          const w = Math.min(110, maxW);
          const h = w * pie.aspect;
          ensure(h + 6);
          doc.addImage(pie.dataUrl, "PNG", (pageW - w) / 2, y, w, h);
          y += h + 4;
        }
      }
    }

    // Correlation strength meters — each element sits in its own column
    // (truncated left label | centered track | r-value) so nothing overlaps.
    if (profile.correlations.length) {
      ensure(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text("Correlation Strength", margin, y);
      y += 6;
      const labelW = 46;
      const trackW = 66;
      const trackX = margin + labelW + 2;
      const cx = trackX + trackW / 2;
      const meterH = 8;
      profile.correlations.slice(0, 6).forEach((cor) => {
        ensure(meterH + 7);
        const positive = cor.r >= 0;
        const col: [number, number, number] = positive
          ? [22, 163, 74]
          : [220, 38, 38];
        const raw = `${cor.a} ~ ${cor.b}`;
        const label = raw.length > 26 ? raw.slice(0, 25) + "…" : raw;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(60);
        doc.text(label, margin, y + 6);
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(trackX, y, trackW, meterH, 2, 2, "F");
        doc.setFillColor(148, 163, 184);
        doc.rect(cx - 0.3, y, 0.6, meterH, "F");
        const fw = (trackW / 2) * Math.min(1, Math.abs(cor.r));
        if (fw > 0.5) {
          doc.setFillColor(col[0], col[1], col[2]);
          if (positive) doc.roundedRect(cx, y, fw, meterH, 2, 2, "F");
          else doc.roundedRect(cx - fw, y, fw, meterH, 2, 2, "F");
        }
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`r = ${cor.r}`, trackX + trackW + 4, y + 6);
        y += meterH + 7;
      });
    }
    y += 4;
  };

  // ---- Branded cover band (page 1) ----
  doc.setFillColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.rect(0, 26, pageW, 1.2, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Camco AI", margin, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(190);
  doc.text("Data Intelligence & Visualization Report", margin, 20);
  const now = new Date();
  doc.setFontSize(8);
  doc.text(now.toLocaleDateString(), pageW - margin, 13, { align: "right" });
  doc.text(now.toLocaleTimeString(), pageW - margin, 19, { align: "right" });
  y = 34;

  // Analysis title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);
  const titleLines = doc.splitTextToSize(title, maxW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 3;
  doc.setDrawColor(220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Computed-stats dashboard
  if (profiles && profiles.length) {
    for (const { name, profile } of profiles) {
      await renderProfileDashboard(profile, name);
    }
    ensure(8);
    doc.setDrawColor(230);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  }

  for (const node of nodes) {
    switch (node.type) {
      case "heading": {
        ensure(10);
        const size = node.level <= 1 ? 14 : node.level === 2 ? 12 : 11;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(node.text, maxW);
        doc.text(lines, margin, y);
        y += lines.length * (size * 0.5 + 1) + 3;
        if (node.level <= 2) {
          doc.setDrawColor(220);
          doc.setLineWidth(0.2);
          doc.line(margin, y - 1, pageW - margin, y - 1);
          y += 4;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        break;
      }
      case "paragraph": {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(stripInline(node.text), maxW);
        for (const ln of lines) {
          ensure(5.5);
          doc.text(ln, margin, y);
          y += 5.3;
        }
        y += 2.5;
        break;
      }
      case "bullets": {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        for (const item of node.items) {
          const lines = doc.splitTextToSize(stripInline(item), maxW - 6);
          lines.forEach((ln: string, idx: number) => {
            ensure(5.3);
            doc.text(idx === 0 ? "•" : "", margin + 2, y);
            doc.text(ln, margin + 6, y);
            y += 5.3;
          });
          y += 1.2;
        }
        y += 2.5;
        break;
      }
      case "numbered": {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        node.items.forEach((item, n) => {
          const lines = doc.splitTextToSize(stripInline(item), maxW - 8);
          lines.forEach((ln: string, idx: number) => {
            ensure(5.3);
            doc.text(idx === 0 ? `${n + 1}.` : "", margin + 2, y);
            doc.text(ln, margin + 8, y);
            y += 5.3;
          });
          y += 1.2;
        });
        y += 2.5;
        break;
      }
      case "hr": {
        ensure(6);
        doc.setDrawColor(210);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 6;
        break;
      }
      case "code": {
        if (node.lang === "mermaid") {
          const png = await mermaidToPng(node.code);
          if (png) {
            const ratio = png.height / png.width;
            let w = Math.min(maxW, 170);
            let h = w * ratio;
            const maxH = pageH - margin * 2;
            if (h > maxH) {
              h = maxH;
              w = h / ratio;
            }
            ensure(h + 4);
            doc.addImage(png.dataUrl, "PNG", margin, y, w, h);
            y += h + 4;
            break;
          }
          // Fallback: render the source as monospace text.
        }
        doc.setFont("courier", "normal");
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(node.code, maxW - 4);
        for (const ln of lines) {
          ensure(4.5);
          doc.text(ln, margin + 2, y);
          y += 4.2;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        y += 3;
        break;
      }
      case "table": {
        // Strip markdown bold markers for display, but remember which body cells
        // were explicitly bold so we can render them with a real bold font
        // instead of printing literal "**".
        const cleanHead = node.header.map((h) => h.replace(/\*\*/g, ""));
        const cleanRows = node.rows.map((r) => r.map((c) => c.replace(/\*\*/g, "")));
        const rowBold = node.rows.map((r) =>
          r.map((c) => /^\*\*.+\*\*$/.test(c))
        );
        const colCount = node.header.length || (node.rows[0]?.length ?? 1);
        const colStyles: Record<number, { cellWidth: number }> = {};
        const colW = maxW / colCount;
        for (let ci = 0; ci < colCount; ci++) colStyles[ci] = { cellWidth: colW };

        autoTable(doc, {
          head: [cleanHead],
          body: cleanRows,
          startY: y,
          margin: { left: margin, right: margin },
          tableWidth: "auto",
          styles: {
            fontSize: 8.5,
            cellPadding: 2.5,
            overflow: "linebreak",
            valign: "middle",
            font: "helvetica",
          },
          headStyles: {
            fillColor: [17, 24, 39],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: colStyles,
          didParseCell: (data: any) => {
            if (
              data.section === "body" &&
              rowBold[data.row.index]?.[data.column.index]
            ) {
              data.cell.styles.fontStyle = "bold";
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 5;
        break;
      }
    }
  }

  stampPdfFooter(doc, pageW, pageH, margin);
  const blob = doc.output("blob");
  triggerDownload(blob, filename || "report.pdf");
  return blob.size;
}

// Stamped footer across every page of the generated PDF.
function stampPdfFooter(
  doc: any,
  pageW: number,
  pageH: number,
  margin: number
) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Camco AI · Confidential", margin, pageH - margin + 8);
    doc.text(
      `Page ${p} / ${pages}`,
      pageW - margin - 18,
      pageH - margin + 8
    );
    doc.setTextColor(0);
  }
}

/* -------------------------------- DOCX ----------------------------------- */

/** Generate and download a .docx report. Returns the file size in bytes. */
export async function downloadReportDocx(
  title: string,
  content: string,
  filename: string,
  profiles?: { name: string; profile: DataProfile }[]
): Promise<number> {
  if (!content?.trim()) return 0;

  const {
    Document,
    Paragraph,
    TextRun,
    Packer,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    ImageRun,
  } = await import("docx");

  const runsFromInline = (text: string): any[] => {
    const runs: any[] = [];
    const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) runs.push(new TextRun(text.slice(last, m.index)));
      if (m[2] !== undefined)
        runs.push(new TextRun({ text: m[2], bold: true }));
      else if (m[3] !== undefined)
        runs.push(new TextRun({ text: m[3], italics: true }));
      else if (m[4] !== undefined)
        runs.push(new TextRun({ text: m[4], font: "Courier New" }));
      last = re.lastIndex;
    }
    if (last < text.length) runs.push(new TextRun(text.slice(last)));
    return runs.length ? runs : [new TextRun(text)];
  };

  const nodes = parseDocBlocks(content);
  const children: any[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Camco AI", bold: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: title, bold: true })],
    }),
    new Paragraph({ children: [new TextRun(" ")] }),
  ];

  if (profiles && profiles.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Executive Data Profile")],
      })
    );
    for (const { name, profile } of profiles) {
      const cells = profile.rowCount * profile.colCount || 1;
      const missingPct = ((profile.missingCells / cells) * 100).toFixed(1);
      const numCols = profile.columns.filter((c) => c.type === "numeric");
      const outliers = numCols.reduce((s, c) => s + (c.outliers || 0), 0);
      const rows: string[][] = [
        ["Source", name],
        ["Records", String(profile.rowCount)],
        ["Fields", String(profile.colCount)],
        ["Missing cells", `${profile.missingCells} (${missingPct}%)`],
        ["Outliers", String(outliers)],
        ["Correlations", String(profile.correlations.length)],
      ];
      const buildCell = (text: string, bold: boolean) =>
        new TableCell({
          children: [
            new Paragraph({
              children: bold
                ? [new TextRun({ text, bold: true })]
                : [new TextRun(text)],
            }),
          ],
        });
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows.map(
            (r) =>
              new TableRow({
                children: [buildCell(r[0], true), buildCell(r[1], false)],
              })
          ),
        })
      );
      children.push(new Paragraph({ children: [new TextRun(" ")] }));
    }
  }

  for (const node of nodes) {
    switch (node.type) {
      case "heading": {
        const level =
          node.level <= 1
            ? HeadingLevel.HEADING_1
            : node.level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;
        children.push(
          new Paragraph({ heading: level, children: [new TextRun(node.text)] })
        );
        break;
      }
      case "paragraph": {
        children.push(
          new Paragraph({ children: runsFromInline(node.text) })
        );
        break;
      }
      case "bullets": {
        for (const item of node.items) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: runsFromInline(item),
            })
          );
        }
        break;
      }
      case "numbered": {
        node.items.forEach((item, n) => {
          children.push(
            new Paragraph({
              numbering: { reference: "numbered-list", level: 0 },
              children: runsFromInline(item),
            })
          );
        });
        break;
      }
      case "hr": {
        children.push(
          new Paragraph({
            border: {
              bottom: {
                color: "CCCCCC",
                space: 1,
                style: "single",
                size: 6,
              },
            },
            children: [new TextRun("")],
          })
        );
        break;
      }
      case "code": {
        if (node.lang === "mermaid") {
          const png = await mermaidToPng(node.code);
          if (png) {
            const bytes = dataUrlToBytes(png.dataUrl);
            const ratio = png.height / png.width;
            let w = Math.min(600, 600);
            let h = w * ratio;
            if (h > 800) {
              h = 800;
              w = h / ratio;
            }
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: bytes,
                    type: "png",
                    transformation: { width: w, height: h },
                  }),
                ],
              })
            );
            children.push(new Paragraph({ children: [new TextRun(" ")] }));
            break;
          }
        }
        children.push(
          new Paragraph({
            children: [new TextRun({ text: node.code, font: "Courier New" })],
          })
        );
        break;
      }
      case "table": {
        const buildCell = (text: string, bold: boolean) =>
          new TableCell({
            children: [
              new Paragraph({
                children: bold
                  ? [new TextRun({ text, bold: true })]
                  : runsFromInline(text),
              }),
            ],
          });
        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: node.header.map((h) => buildCell(h, true)),
            }),
            ...node.rows.map(
              (r) =>
                new TableRow({ children: r.map((c) => buildCell(c, false)) })
            ),
          ],
        });
        children.push(table);
        children.push(new Paragraph({ children: [new TextRun(" ")] }));
        break;
      }
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 12 },
      children: [
        new TextRun({
          text: "Generated by Camco AI",
          italics: true,
          color: "999999",
        }),
      ],
    })
  );

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "numbered-list",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: "start",
            },
          ],
        },
      ],
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, filename || "report.docx");
  return blob.size;
}

// Download an image (e.g., from Pollinations) by fetching it as a blob and
// triggering a browser save. Falls back to opening in a new tab if blocked.
export async function downloadImage(
  url: string,
  filename: string
): Promise<void> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    triggerDownload(blob, filename);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}
