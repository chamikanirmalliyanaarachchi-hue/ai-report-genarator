"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Sparkles,
  Plus,
  FileText,
  MessageSquare,
  LogOut,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  BarChart3,
  GraduationCap,
  Palette,
  Briefcase,
  User,
  AlertTriangle,
  X,
  FileUp,
  Download,
  Paperclip,
  UploadCloud,
  Image as ImageIcon,
  ListChecks,
  Database,
  Wand2,
  Trash2,
  RotateCw,
  FolderOpen,
  History,
  Terminal,
  Code2,
  FileCode,
  ChevronDown,
  Brain,
  FileDown,
  Presentation,
  CreditCard,
  HelpCircle,
  ArrowUpRight,
  Coins,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "./AppProvider";
import { useAuth } from "./AuthProvider";
import { streamReport, analyzeFiles, generateImage } from "@/lib/ai";
import { downloadReportPdf, downloadReportDocx, downloadImage } from "@/lib/pdf-export";
import { parseReport, type ExecStep } from "@/lib/report-parser";
import {
  parseDelimited,
  computeProfile,
  fmt,
  strengthLabel,
  type DataProfile,
} from "@/lib/stats";
import Markdown from "./Markdown";
import {
  createProject,
  listProjects,
  setDocument,
  listDocuments,
  deleteDocument,
  setChatSession,
  listChatSessions,
  deleteChatSession,
} from "@/lib/db";
import {
  loadPendingUpload,
  dataUrlToFile,
  clearPendingUpload,
} from "@/lib/pendingUpload";
import type { Project } from "@/lib/models";

const BRAND = "AI Reporter";

type NavItem = { id: string; label: string; icon: typeof Plus };

const NAV: NavItem[] = [
  { id: "new", label: "New Project", icon: Plus },
  { id: "docs", label: "My Documents", icon: FileText },
  { id: "chat", label: "Chat History", icon: MessageSquare },
];

const TOOLS = [
  "Slides Agent",
  "AI Spreadsheets",
  "AI Image",
  "AI Video",
  "AI Design",
  "General Writer",
];

const TABS = [
  { id: "Featured", icon: LayoutGrid },
  { id: "Business", icon: BarChart3 },
  { id: "Edu & Academic", icon: GraduationCap },
  { id: "Creative", icon: Palette },
  { id: "Career", icon: Briefcase },
];

const ACCEPTED_EXT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
];

type DocItem = { id: string; name: string; size: number; createdAt: number };
type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  entries: ReportEntry[];
};

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function isAcceptedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXT.some((ext) => lower.endsWith(ext));
}

function isImageRequest(text: string): boolean {
  const t = text.toLowerCase();
  const hasImageNoun =
    /\b(image|images|picture|pictures|photo|photos|photograph|illustration|illustrations|artwork|render|rendering|drawing|painting|sketch)\b/.test(
      t
    );
  if (!hasImageNoun) return false;
  const hasAction =
    /\b(create|generate|make|draw|produce|render|paint|design|show|give me|i want|need|build|imagine)\b/.test(
      t
    ) || /\b(image|picture|photo)\b.*\b(of|for|with)\b/.test(t);
  return hasAction;
}

type Attachment = { id: string; name: string; size: number };

type Card = { title: string; desc: string; tag: string };

const TEMPLATES: Record<string, Card[]> = {
  Featured: [
    { title: "Quarterly Business Review", desc: "Auto-summarize performance with charts.", tag: "STRATEGY" },
    { title: "Market Research Brief", desc: "Competitor & trend analysis in minutes.", tag: "RESEARCH" },
    { title: "Investor Pitch Deck", desc: "Slides Agent turns notes into a deck.", tag: "SLIDES" },
    { title: "Weekly Status Report", desc: "Pull updates from docs and chats.", tag: "OPS" },
    { title: "Customer Insight Memo", desc: "Synthesize feedback into a strategy.", tag: "INSIGHT" },
    { title: "Product Launch Plan", desc: "Timeline, risks, and go-to-market.", tag: "GTM" },
  ],
  Business: [
    { title: "OKR Tracker", desc: "Translate goals into measurable KRs.", tag: "STRATEGY" },
    { title: "Financial Model", desc: "Spreadsheet Agent builds projections.", tag: "FINANCE" },
    { title: "SWOT Analysis", desc: "Structured strategic overview.", tag: "STRATEGY" },
    { title: "Board Deck", desc: "Executive narrative with visuals.", tag: "SLIDES" },
    { title: "Sales Playbook", desc: "Scripts and objection handling.", tag: "SALES" },
    { title: "Risk Assessment", desc: "Identify and rank operational risks.", tag: "RISK" },
  ],
  "Edu & Academic": [
    { title: "Literature Review", desc: "Summarize sources and find gaps.", tag: "RESEARCH" },
    { title: "Study Guide", desc: "Turn lecture notes into flashcards.", tag: "STUDY" },
    { title: "Research Proposal", desc: "Hypothesis, method, and timeline.", tag: "PLAN" },
    { title: "Essay Outline", desc: "Thesis with supporting arguments.", tag: "WRITING" },
    { title: "Lab Report", desc: "Format results and conclusions.", tag: "SCIENCE" },
    { title: "Citation Map", desc: "Connect papers and key findings.", tag: "RESEARCH" },
  ],
  Creative: [
    { title: "Short Story", desc: "Generate plot, characters, and scenes.", tag: "WRITING" },
    { title: "Brand Script", desc: "Video Agent writes the voiceover.", tag: "VIDEO" },
    { title: "Social Campaign", desc: "Hook-driven post variants.", tag: "MARKETING" },
    { title: "Poetry Set", desc: "Themed verses in any style.", tag: "WRITING" },
    { title: "Worldbuilding Bible", desc: "Map lore, factions, and magic.", tag: "DESIGN" },
    { title: "Mood Board", desc: "Image Agent renders concept art.", tag: "IMAGE" },
  ],
  Career: [
    { title: "Resume Builder", desc: "Tailor experience to the role.", tag: "DOCS" },
    { title: "Cover Letter", desc: "Personalized, concise, on-brand.", tag: "DOCS" },
    { title: "Interview Prep", desc: "Likely questions with talking points.", tag: "PREP" },
    { title: "LinkedIn About", desc: "Compelling professional summary.", tag: "BRAND" },
    { title: "Portfolio Case", desc: "Frame impact with metrics.", tag: "DESIGN" },
    { title: "Salary Negotiation", desc: "Talking points and benchmarks.", tag: "PREP" },
  ],
};

function TemplateCard({
  card,
  onSelect,
}: {
  card: Card;
  onSelect: (card: Card) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), {
    stiffness: 150,
    damping: 15,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), {
    stiffness: 150,
    damping: 15,
  });

  function handleMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function reset() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onClick={() => onSelect(card)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{
        y: -6,
        borderColor: "rgba(249,115,22,0.30)",
        boxShadow: "0 24px 60px -24px rgba(249,115,22,0.40)",
      }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-lg shadow-slate-200/50 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-orange-500/50"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/[0.06]" />

      <div className="relative flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500/25 to-orange-600/10 text-orange-500 shadow-[0_0_18px_-4px_rgba(249,115,22,0.6)]">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
          {card.tag}
        </span>
      </div>

      <h3 className="relative mt-4 text-base font-semibold text-slate-900 dark:text-white">
        {card.title}
      </h3>
      <p className="relative mt-1 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
        {card.desc}
      </p>
    </motion.button>
  );
}

type ReportEntry = {
  id: string;
  title: string;
  content: string;
  kind: "prompt" | "pdf" | "file" | "image";
  generating: boolean;
  agent: string;
  startedAt: number;
  imageUrl?: string;
  dataProfiles?: { name: string; profile: DataProfile }[];
};

function extractKpiCards(
  md: string
): { metric: string; value: string; signal: string }[] | null {
  const tableRe =
    /\|([^\n]*)\|\s*\n\s*\|[\s:|-]+\|\s*\n((?:\|.*\|\s*\n?)+)/g;
  let m: RegExpExecArray | null;
  while ((m = tableRe.exec(md))) {
    const header = m[1].split("|").map((s) => s.trim()).filter(Boolean);
    const hi = header.findIndex((h) => /metric/i.test(h));
    const vi = header.findIndex((h) => /value/i.test(h));
    const si = header.findIndex((h) => /signal/i.test(h));
    if (hi === -1 || vi === -1) continue;
    const rows = m[2].trim().split("\n").map((r) => r.trim()).filter(Boolean);
    const cards = rows
      .map((r) => {
        const cells = r.split("|").map((s) => s.trim()).filter(Boolean);
        return {
          metric: cells[hi] ?? "",
          value: cells[vi] ?? "",
          signal: si !== -1 ? cells[si] ?? "" : "",
        };
      })
      .filter((c) => c.metric);
    if (cards.length) return cards;
  }
  return null;
}

function DataProfilePanel({
  profiles,
}: {
  profiles: { name: string; profile: DataProfile }[];
}) {
  return (
    <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/60 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-indigo-600/10 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          Data Profile
        </span>
        <span className="text-xs text-slate-500 dark:text-zinc-400">
          Computed statistics from your file
        </span>
      </div>

      <div className="space-y-4">
        {profiles.map(({ name, profile }, pi) => (
          <div key={pi}>
            <p className="mb-2 truncate text-sm font-semibold text-slate-700 dark:text-zinc-200">
              {name}
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-white px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
                {fmt(profile.rowCount)} rows
              </span>
              <span className="rounded-md bg-white px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
                {profile.colCount} columns
              </span>
              <span className="rounded-md bg-white px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
                {profile.missingCells} missing cells
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {profile.columns.map((c) => (
                <div
                  key={c.name}
                  className="rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-slate-700 dark:text-zinc-200">
                      {c.name}
                    </p>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {c.type}
                    </span>
                  </div>

                  {c.type === "numeric" ? (
                    <div className="mt-1.5 space-y-0.5 text-xs text-slate-600 dark:text-zinc-400">
                      <p>
                        <span className="text-slate-400">mean</span>{" "}
                        <span className="font-semibold text-slate-800 dark:text-zinc-100">
                          {fmt(c.mean!)}
                        </span>{" "}
                        <span className="text-slate-400">median</span>{" "}
                        <span className="font-semibold text-slate-800 dark:text-zinc-100">
                          {fmt(c.median!)}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">min</span> {fmt(c.min!)} ·{" "}
                        <span className="text-slate-400">max</span> {fmt(c.max!)}
                      </p>
                      {c.outliers ? (
                        <p className="text-rose-600 dark:text-rose-400">
                          {c.outliers} outlier{c.outliers === 1 ? "" : "s"}
                        </p>
                      ) : null}
                    </div>
                  ) : c.type === "categorical" || c.type === "date" ? (
                    <div className="mt-1.5 space-y-0.5 text-xs text-slate-600 dark:text-zinc-400">
                      <p className="text-slate-400">
                        {c.distinct} distinct
                        {c.missing ? ` · ${c.missing} missing` : ""}
                      </p>
                      {(c.top ?? []).slice(0, 3).map((t) => (
                        <p key={t.value} className="truncate">
                          <span className="font-semibold text-slate-800 dark:text-zinc-100">
                            {t.value}
                          </span>{" "}
                          — {t.count} ({t.pct.toFixed(0)}%)
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400">
                      {c.distinct} distinct values
                      {c.missing ? ` · ${c.missing} missing` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {profile.correlations.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  Correlations
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.correlations.slice(0, 6).map((cor) => (
                    <span
                      key={`${cor.a}-${cor.b}`}
                      className="rounded-md bg-white px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800"
                    >
                      {cor.a} ~ {cor.b}: r={cor.r}{" "}
                      <span className="text-slate-400">
                        ({strengthLabel(cor.r)} {cor.r >= 0 ? "+" : "−"})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportCard({
  entry,
  onDownload,
  onRefine,
  onSynthetic,
  onImageLoad,
  onFollowUp,
}: {
  entry: ReportEntry;
  onDownload: (entry: ReportEntry) => void;
  onRefine: (entry: ReportEntry) => void;
  onSynthetic: (entry: ReportEntry) => void;
  onImageLoad: (id: string) => void;
  onFollowUp: (entry: ReportEntry, action: "summary" | "slides") => void;
}) {
  const Icon =
    entry.kind === "pdf" || entry.kind === "file"
      ? FileText
      : entry.kind === "image"
        ? ImageIcon
        : Sparkles;

  const [elapsed, setElapsed] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const [artifact, setArtifact] = useState<{ pdf?: string; docx?: string }>({});

  const parsed = useMemo(
    () => parseReport(entry.content ?? ""),
    [entry.content]
  );

  const kpiCards = useMemo(
    () => extractKpiCards(entry.content ?? ""),
    [entry.content]
  );

  const stepCount = parsed.steps.length;
  const toolCount = new Set(parsed.steps.map((s) => s.tool)).size;

  const slug = (s: string) =>
    s.replace(/[^\w\-]+/g, "_").slice(0, 50) || "report";

  const handleExportPdf = async () => {
    const size = await downloadReportPdf(
      entry.title,
      parsed.narrative || entry.content,
      `${slug(entry.title)}.pdf`,
      entry.dataProfiles
    );
    if (size) setArtifact((a) => ({ ...a, pdf: formatBytes(size) }));
  };

  const handleExportDocx = async () => {
    const size = await downloadReportDocx(
      entry.title,
      parsed.narrative || entry.content,
      `${slug(entry.title)}.docx`,
      entry.dataProfiles
    );
    if (size) setArtifact((a) => ({ ...a, docx: formatBytes(size) }));
  };

  useEffect(() => {
    if (!entry.generating) return;
    const start = entry.startedAt ?? Date.now();
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      500
    );
    return () => clearInterval(t);
  }, [entry.generating, entry.startedAt]);

  const statusText = entry.generating
    ? elapsed < 2
      ? "Thinking…"
      : `Processing for ${elapsed}s…`
    : entry.content || entry.imageUrl
      ? `Processed for ${elapsed}s · used ${entry.agent}`
      : "";

  const hasResult = Boolean(entry.content || entry.imageUrl);

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-white/80 p-6 shadow-xl shadow-orange-500/10 backdrop-blur-2xl dark:bg-zinc-900/80">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {entry.title}
              </h2>
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-300">
                {BRAND}
              </span>
            </div>
            {entry.agent && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                {entry.agent}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDownload(entry)}
          disabled={entry.kind === "image" ? !entry.imageUrl : !entry.content}
          className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        >
          <Download className="h-4 w-4" />
          {entry.kind === "image" ? "Download Image" : "Download PDF"}
        </button>
      </div>

      {statusText && (
        <div className="mt-4 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {entry.generating && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                entry.generating ? "bg-orange-500" : "bg-emerald-500"
              }`}
            />
          </span>
          <span className="text-sm tabular-nums text-slate-500 dark:text-zinc-400">
            {statusText}
          </span>
        </div>
      )}

      {entry.generating && !entry.content && entry.kind !== "image" && (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-200/70 dark:bg-zinc-700/50" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200/70 dark:bg-zinc-700/50" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-slate-200/70 dark:bg-zinc-700/50" />
        </div>
      )}

      {entry.kind === "image" && entry.imageUrl && (
        <div className="relative mt-4 overflow-hidden rounded-xl border border-orange-500/20">
          <img
            src={entry.imageUrl}
            alt={entry.title}
            onLoad={() => onImageLoad(entry.id)}
            onError={() => onImageLoad(entry.id)}
            className={`w-full object-contain transition-opacity duration-300 ${
              entry.generating ? "opacity-0" : "opacity-100"
            }`}
          />
          {entry.generating && (
            <div className="absolute inset-0 grid place-items-center bg-slate-50/70 text-sm text-slate-400 dark:bg-zinc-800/40">
              Generating image…
            </div>
          )}
        </div>
      )}

      {entry.kind !== "image" && entry.content && (
        <div className="mt-5 space-y-3">
          {entry.dataProfiles && entry.dataProfiles.length > 0 && (
            <DataProfilePanel profiles={entry.dataProfiles} />
          )}

          {kpiCards && kpiCards.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {kpiCards.map((c, i) => {
                const up = /▲|↑|up|healthy|improv|grow|positive/i.test(c.signal);
                const down =
                  /▼|↓|watch|risk|down|declin|negativ|fail|breach/i.test(c.signal);
                const tone = up
                  ? "text-emerald-600 dark:text-emerald-400"
                  : down
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500 dark:text-zinc-400";
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {c.metric}
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {c.value}
                    </p>
                    {c.signal && (
                      <p className={`mt-0.5 text-xs font-semibold ${tone}`}>
                        {c.signal}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {parsed.thinking && <ThinkingBlock text={parsed.thinking} />}
          {parsed.steps.length > 0 && <ArtifactSteps steps={parsed.steps} />}
          {parsed.narrative && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <Markdown>{parsed.narrative}</Markdown>
            </div>
          )}
          {!parsed.thinking &&
            parsed.steps.length === 0 &&
            !parsed.narrative && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <Markdown>{entry.content}</Markdown>
              </div>
            )}
        </div>
      )}

      {!entry.generating && stepCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 font-medium text-orange-600 dark:text-orange-300">
            <ListChecks className="h-3.5 w-3.5" />
            Processed {stepCount} step{stepCount === 1 ? "" : "s"} · used{" "}
            {toolCount} tool{toolCount === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {entry.kind !== "image" && entry.content && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ArtifactCard
            kind="pdf"
            title={`${slug(entry.title)}.pdf`}
            status={artifact.pdf}
            onGenerate={handleExportPdf}
          />
          <ArtifactCard
            kind="docx"
            title={`${slug(entry.title)}.docx`}
            status={artifact.docx}
            onGenerate={handleExportDocx}
          />
        </div>
      )}

      {!entry.generating && hasResult && (
        <FollowUpChips
          onPdf={handleExportPdf}
          onDocx={handleExportDocx}
          onSummary={() => onFollowUp(entry, "summary")}
          onSlides={() => onFollowUp(entry, "slides")}
        />
      )}

      {showSteps && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
          Mode:{" "}
          <span className="font-medium text-slate-700 dark:text-zinc-200">
            {entry.agent}
          </span>
          . The model synthesized this response directly from your request.
        </div>
      )}

      {!entry.generating && hasResult && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSteps((s) => !s)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <ListChecks className="h-3.5 w-3.5" /> View intermediate steps
          </button>
          <button
            type="button"
            onClick={() => onSynthetic(entry)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <Database className="h-3.5 w-3.5" /> Generate synthetic data
          </button>
          <button
            type="button"
            onClick={() => onRefine(entry)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <Wand2 className="h-3.5 w-3.5" /> Refine analysis
          </button>
        </div>
      )}
    </div>
  );
}

type MenuItemProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick?: () => void;
};

function MenuItem({ icon: Icon, label, hint, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {hint && (
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          {hint}
        </span>
      )}
    </button>
  );
}

export default function Dashboard() {
  const { backToLanding } = useApp();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeView, setActiveView] = useState<"new" | "docs" | "chat">("new");
  const [activeTab, setActiveTab] = useState("Featured");
  const [prompt, setPrompt] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const goToPricing = () => {
    setMenuOpen(false);
    router.push("/pricing");
  };

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    setReports([]);
    setAttachments([]);
    setDocuments([]);
    setSessions([]);
    setProjects([]);
    setCurrentProjectId(null);
    setPrompt("");
    setError(null);
    closeMenu();
    backToLanding();
    router.push("/");
    signOut();
  };

  const [activeAgent, setActiveAgent] = useState("General Writer");
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileMapRef = useRef<Map<string, File>>(new Map());
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const docFileMap = useRef<Map<string, File>>(new Map());

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevLen = useRef(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && reports.length > prevLen.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    }
    prevLen.current = reports.length;
  }, [reports]);

  const addFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;
    const rejected: string[] = [];
    const next: Attachment[] = [];
    for (const f of incoming) {
      if (!isAcceptedFile(f.name)) {
        rejected.push(f.name);
        continue;
      }
      const id = crypto.randomUUID();
      fileMapRef.current.set(id, f);
      next.push({ id, name: f.name, size: f.size });
    }
    if (next.length) setAttachments((prev) => [...prev, ...next]);
    if (rejected.length) {
      setError(
        rejected.length === 1
          ? `Unsupported file: ${rejected[0]}`
          : `${rejected.length} unsupported file${rejected.length > 1 ? "s" : ""} were skipped`
      );
    }
  };

  const removeAttachment = (id: string) => {
    fileMapRef.current.delete(id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragCounter.current += 1;
      setDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragging(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      addFiles(e.dataTransfer.files);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const computeClientProfiles = async (
    files: File[]
  ): Promise<{ name: string; profile: DataProfile }[]> => {
    const out: { name: string; profile: DataProfile }[] = [];
    for (const f of files) {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      try {
        if (
          ext === "csv" ||
          ext === "tsv" ||
          ext === "txt" ||
          ext === "text" ||
          ext === "md"
        ) {
          const text = await f.text();
          const { headers, rows } = parseDelimited(
            text,
            ext === "tsv" ? "\t" : undefined
          );
          if (rows.length)
            out.push({
              name: f.name,
              profile: computeProfile(f.name, headers, rows),
            });
        } else if (ext === "xlsx" || ext === "xls") {
          const XLSX = ((await import("xlsx")) as any).default ?? (await import("xlsx"));
          const buf = await f.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array", cellDates: true });
          for (const sheetName of wb.SheetNames) {
            const sheet = wb.Sheets[sheetName];
            if (!sheet) continue;
            const aoa = XLSX.utils.sheet_to_json(sheet, {
              header: 1,
              defval: "",
              raw: false,
            }) as unknown[][];
            if (!aoa.length) continue;
            const headers = (aoa[0] ?? []).map((h: unknown, i: number) =>
              String(h ?? "").trim() || `Column ${i + 1}`
            );
            const rows = aoa
              .slice(1)
              .map((r) => (r as unknown[]).map((v) => (v == null ? "" : String(v))));
            const label = `${f.name} ▸ ${sheetName}`;
            out.push({
              name: label,
              profile: computeProfile(label, headers, rows),
            });
          }
        }
      } catch {
        /* best-effort */
      }
    }
    return out;
  };

  const analyzeUploadedFiles = async (
    files: File[],
    input: string,
    id: string,
    title: string,
    startedAt: number
  ) => {
    const dataProfiles = await computeClientProfiles(files);
    setReports((prev) => [
      ...prev,
      {
        id,
        title,
        content: "",
        kind: "file" as const,
        generating: true,
        agent: activeAgent,
        startedAt,
        dataProfiles: dataProfiles.length ? dataProfiles : undefined,
      },
    ]);

    files.forEach((f) => {
      const docId = crypto.randomUUID();
      docFileMap.current.set(docId, f);
      setDocuments((prev) => [
        ...prev,
        { id: docId, name: f.name, size: f.size, createdAt: Date.now() },
      ]);
      if (user) {
        void setDocument(user.uid, docId, {
          name: f.name,
          fileName: f.name,
          fileType: f.name.split(".").pop()?.toLowerCase(),
          size: f.size,
          status: "ready",
          projectId: currentProjectId || undefined,
        });
      }
    });

    try {
      await analyzeFiles(
        files,
        input,
        (chunk) =>
          setReports((prev) =>
            prev.map((r) =>
              r.id === id ? { ...r, content: r.content + chunk } : r
            )
          ),
        activeAgent
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong while analyzing the file(s)."
      );
    } finally {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, generating: false } : r))
      );
      setGenerating(false);
    }
  };

  const handleSend = async (override?: string) => {
    const input = (override ?? prompt).trim();
    if (generating) return;
    if (attachments.length === 0 && !input) return;

    setGenerating(true);
    setError(null);
    const id = crypto.randomUUID();
    const title = attachments.length
      ? `Analysis: ${attachments.map((a) => a.name).join(", ")}`
      : input.length > 70
        ? input.slice(0, 70) + "…"
        : input;
    const startedAt = Date.now();

    if (
      attachments.length === 0 &&
      (activeAgent === "AI Image" || isImageRequest(input))
    ) {
      setReports((prev) => [
        ...prev,
        {
          id,
          title,
          content: "",
          kind: "image",
          generating: true,
          agent: activeAgent,
          startedAt,
        },
      ]);
      setPrompt("");
      try {
        const { imageUrl } = await generateImage(input);
        setReports((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, imageUrl, generating: false } : r
          )
        );
      } catch (e) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  generating: false,
                  content:
                    e instanceof Error ? e.message : "Image generation failed.",
                }
              : r
          )
        );
      } finally {
        setGenerating(false);
      }
      return;
    }

    if (attachments.length) {
      const filesToSend = attachments
        .map((a) => fileMapRef.current.get(a.id))
        .filter((f): f is File => Boolean(f));
      setAttachments([]);
      setPrompt("");
      await analyzeUploadedFiles(filesToSend, input, id, title, startedAt);
      return;
    }

    setReports((prev) => [
      ...prev,
      {
        id,
        title,
        content: "",
        kind: "prompt",
        generating: true,
        agent: activeAgent,
        startedAt,
      },
    ]);
    setPrompt("");
    try {
      await streamReport(
        input,
        (chunk) =>
          setReports((prev) =>
            prev.map((r) =>
              r.id === id ? { ...r, content: r.content + chunk } : r
            )
          ),
        activeAgent
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong while generating your report."
      );
    } finally {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, generating: false } : r))
      );
      setGenerating(false);
    }
  };

  const handleRefine = (entry: ReportEntry) => {
    setPrompt(
      `Refine and expand the following analysis: "${entry.title}". Provide deeper detail, additional insights, and any caveats.`
    );
    document.getElementById("prompt-input")?.focus();
  };

  const handleSynthetic = (entry: ReportEntry) => {
    handleSend(
      `Generate synthetic sample data based on this analysis: "${entry.title}".`
    );
  };

  const handleImageLoaded = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, generating: false } : r))
    );
  };

  const loadProjects = async () => {
    if (!user) return;
    try {
      setProjects(await listProjects(user.uid));
    } catch {
      /* fallback */
    }
  };

  const loadDocuments = async () => {
    if (!user) return;
    try {
      const docs = await listDocuments(user.uid);
      setDocuments(
        docs.map((d) => ({
          id: d.id,
          name: d.name,
          size: d.size,
          createdAt: d.createdAt,
        }))
      );
    } catch {
      /* fallback */
    }
  };

  const loadSessions = async () => {
    if (!user) return;
    try {
      const recs = await listChatSessions(user.uid);
      setSessions(
        recs.map((r) => ({
          id: r.id,
          title: r.title,
          createdAt: r.createdAt,
          entries: r.entries.map((e) => ({
            id: e.id,
            title: e.title,
            content: e.content,
            kind: e.kind,
            generating: false,
            agent: e.agent,
            startedAt: e.startedAt,
            imageUrl: e.imageUrl,
          })),
        }))
      );
    } catch {
      /* fallback */
    }
  };

  const persistSession = async (s: ChatSession) => {
    if (!user) return;
    await setChatSession(user.uid, s.id, {
      title: s.title,
      agent: activeAgent,
      projectId: currentProjectId || undefined,
      createdAt: s.createdAt,
      entries: s.entries.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        kind: e.kind,
        agent: e.agent,
        startedAt: e.startedAt,
        imageUrl: e.imageUrl,
      })),
    });
  };

  const handleNav = async (id: string) => {
    if (id === "new") {
      setReports([]);
      setAttachments([]);
      setPrompt("");
      setError(null);
      setCurrentProjectId(null);
      setActiveView("new");

      if (user) {
        try {
          if (reports.length > 0) {
            const archived: ChatSession = {
              id: crypto.randomUUID(),
              title:
                reports[0].title.length > 60
                  ? reports[0].title.slice(0, 60) + "…"
                  : reports[0].title,
              createdAt: Date.now(),
              entries: reports.map((r) => ({ ...r, generating: false })),
            };
            setSessions((prev) => [archived, ...prev]);
            await persistSession(archived);
          }

          const name = `Project ${projects.length + 1}`;
          const p = await createProject(user.uid, {
            name,
            agent: activeAgent,
            prompt: prompt || undefined,
          });
          setProjects((prev) => [p, ...prev]);
          setCurrentProjectId(p.id);
        } catch {
          /* fallback */
        }
      }
      return;
    }

    setActiveView(id as "docs" | "chat");
    if (id === "docs") await loadDocuments();
    if (id === "chat") await loadSessions();
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([loadProjects(), loadDocuments(), loadSessions()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const injectedPending = useRef(false);
  useEffect(() => {
    if (!user || injectedPending.current) return;
    injectedPending.current = true;
    const pending = loadPendingUpload();
    if (!pending) return;
    try {
      addFiles([dataUrlToFile(pending)]);
      clearPendingUpload();
    } catch {
      clearPendingUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const reanalyzeDoc = (d: DocItem) => {
    const file = docFileMap.current.get(d.id);
    if (!file) return;
    setActiveView("new");
    const id = crypto.randomUUID();
    const title = `Analysis: ${file.name}`;
    const startedAt = Date.now();
    void analyzeUploadedFiles([file], "", id, title, startedAt);
  };

  const downloadDoc = (d: DocItem) => {
    const file = docFileMap.current.get(d.id);
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = d.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const deleteDoc = (id: string) => {
    docFileMap.current.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (user) void deleteDocument(id);
  };

  const restoreSession = (s: ChatSession) => {
    setReports(s.entries.map((e) => ({ ...e, generating: false })));
    setActiveView("new");
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (user) void deleteChatSession(id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleTemplateSelect = (c: Card) => {
    const composed = `${c.title} — ${c.desc} (Category: ${c.tag})`;
    handleSend(composed);
  };

  const handleDownload = (entry: ReportEntry) => {
    const safe = entry.title.replace(/[^\w\-]+/g, "_").slice(0, 50);
    if (entry.kind === "image" && entry.imageUrl) {
      downloadImage(entry.imageUrl, `${safe || "image"}.png`);
      return;
    }
    downloadReportPdf(entry.title, entry.content, `${safe || "report"}.pdf`, entry.dataProfiles);
  };

  const handleFollowUp = (entry: ReportEntry, action: "summary" | "slides") => {
    const ref = `"${entry.title}"`;
    if (action === "summary") {
      handleSend(
        `Create a one-page executive summary infographic based on this analysis: ${ref}. Make it dense, visual, and stakeholder-ready.`
      );
    } else if (action === "slides") {
      setActiveAgent("Slides Agent");
      handleSend(
        `Draft a 5-slide presentation for stakeholders based on this analysis: ${ref}.`
      );
    }
  };

  const cards = TEMPLATES[activeTab] ?? TEMPLATES.Featured;
  const hasReports = reports.length > 0;

  return (
    <div className="relative h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 dark:bg-zinc-950 dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-float-slow absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-300/30 blur-[130px] dark:bg-blue-600/20" />
        <div className="animate-float absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-purple-300/30 blur-[150px] dark:bg-purple-600/20" />
        <div className="animate-float-slow absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-300/30 blur-[130px] dark:bg-orange-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0.04),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_55%)]" />
      </div>

      <div className="flex h-screen">
        <aside
          className={`flex shrink-0 flex-col border-r border-slate-200 bg-white/70 backdrop-blur-2xl transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900/60 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Sparkles className="logo-sparkle h-6 w-6 text-orange-500 dark:text-orange-400" />
                <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  AI<span className="text-orange-500 dark:text-orange-400">Reporter</span>
                </span>
              </div>
            )}
            <button
              aria-label="Toggle sidebar"
              onClick={() => setCollapsed((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <nav className="relative flex flex-1 flex-col gap-1 px-3 py-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl border border-orange-500/30 bg-orange-500/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative z-10 h-5 w-5 shrink-0 text-orange-400" />
                  {!collapsed && <span className="relative z-10">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="relative border-t border-slate-200 p-3 dark:border-zinc-800">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {user?.photoURL && !imgError ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "User profile"}
                  onError={() => setImgError(true)}
                  className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-zinc-700"
                />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-sm font-semibold text-white ring-1 ring-slate-200 dark:from-zinc-700 dark:to-zinc-900 dark:ring-zinc-700">
                  {user?.displayName?.slice(0, 2).toUpperCase() ?? "AR"}
                </span>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {user?.displayName ?? "AI User"}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                    {user?.email ?? "Free plan"}
                  </p>
                </div>
              )}
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute bottom-20 left-3 right-3 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-black/60"
              >
                <div className="mb-1.5 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                        Current plan
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Free plan
                      </p>
                    </div>
                    <button
                      onClick={goToPricing}
                      className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Upgrade
                    </button>
                  </div>
                  <button
                    onClick={goToPricing}
                    className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] font-medium text-orange-600 hover:underline dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    View pricing &amp; plans
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex flex-col">
                  <MenuItem
                    icon={Coins}
                    label="Credits"
                    hint="120 left"
                    onClick={closeMenu}
                  />
                  <MenuItem
                    icon={Brain}
                    label="Memory Center"
                    onClick={() => {
                      closeMenu();
                      router.push("/memory");
                    }}
                  />
                  <MenuItem
                    icon={FileText}
                    label="My Documents"
                    onClick={() => {
                      closeMenu();
                      handleNav("docs");
                    }}
                  />
                  <MenuItem
                    icon={User}
                    label="My Account"
                    onClick={() => {
                      closeMenu();
                      router.push("/account");
                    }}
                  />
                  <MenuItem
                    icon={CreditCard}
                    label="Subscription & Billing"
                    onClick={goToPricing}
                  />
                  <MenuItem
                    icon={HelpCircle}
                    label="Help center"
                    onClick={() => {
                      closeMenu();
                      router.push("/help");
                    }}
                  />
                </div>

                <div className="my-1 h-px bg-slate-200 dark:bg-zinc-800" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto">
            {activeView === "new" && (
              <div className="mx-auto w-full max-w-5xl px-6 pb-8">
                {(() => {
                  const activeProject = projects.find(
                    (p) => p.id === currentProjectId
                  );
                  if (!activeProject) return null;
                  return (
                    <div className="flex justify-center pb-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        {activeProject.name}
                      </span>
                    </div>
                  );
                })()}

                <section className="flex flex-col items-center justify-center py-10 text-center">
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
                  >
                    Hi, I am <span className="text-orange-500">AI Reporter</span>
                  </motion.h1>
                  <p className="mt-2 text-center text-slate-500 dark:text-zinc-400">
                    Your intelligent workspace for turning data and documents into
                    polished reports.
                  </p>
                </section>

                {error && (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 backdrop-blur-2xl dark:text-red-300">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="flex-1 leading-relaxed">{error}</p>
                    <button
                      type="button"
                      aria-label="Dismiss error"
                      onClick={() => setError(null)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-red-500 transition-colors hover:bg-red-500/10 dark:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <section className="pb-24">
                  {hasReports ? (
                    <div className="flex flex-col gap-6">
                      {reports.map((r) => (
                        <ReportCard
                          key={r.id}
                          entry={r}
                          onDownload={handleDownload}
                          onRefine={handleRefine}
                          onSynthetic={handleSynthetic}
                          onImageLoad={handleImageLoaded}
                          onFollowUp={handleFollowUp}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="relative flex flex-wrap gap-1 border-b border-slate-200 dark:border-zinc-800">
                        {TABS.map((tab) => {
                          const Icon = tab.icon;
                          const active = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`relative flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                                active
                                  ? "text-orange-500"
                                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {tab.id}
                              {active && (
                                <motion.span
                                  layoutId="tab-active"
                                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {cards.map((card) => (
                          <TemplateCard
                            key={card.title}
                            card={card}
                            onSelect={handleTemplateSelect}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}

            {activeView === "docs" && (
              <div className="mx-auto w-full max-w-5xl px-6 pb-8">
                <DocumentsView
                  docs={documents}
                  onReanalyze={reanalyzeDoc}
                  onDownload={downloadDoc}
                  onDelete={deleteDoc}
                />
              </div>
            )}

            {activeView === "chat" && (
              <div className="mx-auto w-full max-w-5xl px-6 pb-8">
                <HistoryView
                  sessions={sessions}
                  onRestore={restoreSession}
                  onDelete={deleteSession}
                />
              </div>
            )}

            {activeView === "new" && (
              <div className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6">
                  {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {attachments.map((a) => (
                        <span
                          key={a.id}
                          className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-300"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          <span className="max-w-[160px] truncate">{a.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(a.id)}
                            aria-label={`Remove ${a.name}`}
                            className="grid h-4 w-4 place-items-center rounded-full transition-colors hover:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="group flex w-full items-center gap-3 rounded-2xl border border-orange-500/50 bg-white/80 p-2 pl-5 shadow-[0_0_40px_-12px_rgba(249,115,22,0.45)] backdrop-blur-2xl transition-shadow duration-300 focus-within:shadow-[0_0_60px_-10px_rgba(249,115,22,0.6)] dark:bg-zinc-900/60">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={generating}
                      aria-label="Upload files to analyze"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-orange-500 transition-colors hover:bg-orange-500/10 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <FileUp className="h-5 w-5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,.bmp"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <input
                      value={prompt}
                      id="prompt-input"
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      placeholder="Ask me anything, assign a task, or drop files to analyze…"
                      aria-label="Workspace task prompt input"
                      className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={generating}
                      aria-label="Send"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 transition-transform duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 group-hover:translate-x-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      {generating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {TOOLS.map((tool) => {
                      const isActive = activeAgent === tool;
                      return (
                        <motion.button
                          key={tool}
                          type="button"
                          onClick={() => setActiveAgent(tool)}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.96 }}
                          aria-pressed={isActive}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                            isActive
                              ? "border-orange-500/50 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30"
                              : "border-orange-500/20 bg-orange-500/10 text-orange-600 hover:border-orange-500/40 hover:text-orange-700 dark:text-orange-300 dark:hover:text-orange-200"
                          }`}
                        >
                          {tool}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-orange-400/70 bg-white/95 px-16 py-12 text-center shadow-2xl dark:bg-zinc-900/90">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30">
              <UploadCloud className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Add anything
            </h3>
            <p className="max-w-xs text-sm text-slate-500 dark:text-zinc-400">
              Drop any file here to add it to the conversation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      >
        <Brain className="h-4 w-4 text-orange-500" />
        <span>Thinking</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:border-zinc-800 dark:text-zinc-300">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      )}
    </div>
  );
}

function ArtifactSteps({ steps }: { steps: ExecStep[] }) {
  return (
    <ol className="relative ml-2 border-l border-slate-200 dark:border-zinc-700">
      {steps.map((s) => (
        <li key={s.index} className="mb-5 ml-5">
          <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 ring-4 ring-white dark:ring-zinc-900">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2 px-4 py-3">
              {s.tool === "shell" ? (
                <Terminal className="h-4 w-4 shrink-0 text-orange-500" />
              ) : (
                <Code2 className="h-4 w-4 shrink-0 text-orange-500" />
              )}
              <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                {s.title}
              </span>
              {!s.complete && (
                <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-orange-400" />
              )}
            </div>

            {s.code && (
              <details className="group border-t border-slate-200 dark:border-zinc-800" open>
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                  <FileCode className="h-4 w-4 shrink-0 text-orange-500" />
                  <span className="font-mono">{s.filename}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
                    {s.language}
                  </span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <pre className="max-h-80 overflow-auto bg-slate-950 px-4 py-3 text-xs leading-relaxed text-slate-100 dark:bg-black/60">
                  <code>{s.code}</code>
                </pre>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ArtifactCard({
  kind,
  title,
  status,
  onGenerate,
}: {
  kind: "pdf" | "docx";
  title: string;
  status?: string;
  onGenerate: () => void;
}) {
  const isPdf = kind === "pdf";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
          isPdf
            ? "bg-red-500/15 text-red-500"
            : "bg-blue-500/15 text-blue-500"
        }`}
      >
        {isPdf ? (
          <FileDown className="h-5 w-5" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-zinc-100">
          {title}
        </p>
        <p className="text-xs text-slate-400">
          {status ? `Generated · ${status}` : `Ready · ${isPdf ? "PDF" : "DOCX"} report`}
        </p>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        className="shrink-0 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      >
        {status ? "Download" : "Generate"}
      </button>
    </div>
  );
}

function FollowUpChips({
  onPdf,
  onDocx,
  onSummary,
  onSlides,
}: {
  onPdf: () => void;
  onDocx: () => void;
  onSummary: () => void;
  onSlides: () => void;
}) {
  const chip =
    "flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:border-orange-400 hover:text-orange-600 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50";
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={onPdf} className={chip}>
        <FileDown className="h-3.5 w-3.5" /> Generate PDF version
      </button>
      <button type="button" onClick={onDocx} className={chip}>
        <FileText className="h-3.5 w-3.5" /> Export to DOCX
      </button>
      <button type="button" onClick={onSummary} className={chip}>
        <Sparkles className="h-3.5 w-3.5" /> Executive summary infographic
      </button>
      <button type="button" onClick={onSlides} className={chip}>
        <Presentation className="h-3.5 w-3.5" /> Draft 5-slide presentation
      </button>
    </div>
  );
}

function DocumentsView({
  docs,
  onReanalyze,
  onDownload,
  onDelete,
}: {
  docs: DocItem[];
  onReanalyze: (d: DocItem) => void;
  onDownload: (d: DocItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="py-10">
      <div className="flex items-center gap-3">
        <FolderOpen className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          My Documents
        </h1>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Files you&apos;ve uploaded for analysis. Re-run them or download the
        originals.
      </p>

      {docs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-slate-400 dark:border-zinc-700 dark:bg-zinc-900/40">
          No documents yet. Upload a file from the workspace to get started.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <FileText className="h-8 w-8 shrink-0 text-orange-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900 dark:text-white">
                  {d.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatBytes(d.size)} · {new Date(d.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReanalyze(d)}
                className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Re-analyze
              </button>
              <button
                type="button"
                onClick={() => onDownload(d)}
                className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                type="button"
                onClick={() => onDelete(d.id)}
                aria-label={`Delete ${d.name}`}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryView({
  sessions,
  onRestore,
  onDelete,
}: {
  sessions: ChatSession[];
  onRestore: (s: ChatSession) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="py-10">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Chat History
        </h1>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Your past conversations and generated reports. Click any session to
        restore it.
      </p>

      {sessions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-slate-400 dark:border-zinc-700 dark:bg-zinc-900/40">
          No history yet. Start a new project and your sessions will appear here.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <MessageSquare className="h-8 w-8 shrink-0 text-orange-500" />
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => onRestore(s)}
              >
                <p className="truncate font-medium text-slate-900 dark:text-white">
                  {s.title}
                </p>
                <p className="text-xs text-slate-400">
                  {s.entries.length} item{s.entries.length === 1 ? "" : "s"} ·{" "}
                  {new Date(s.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRestore(s)}
                className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => onDelete(s.id)}
                aria-label="Delete session"
                className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
