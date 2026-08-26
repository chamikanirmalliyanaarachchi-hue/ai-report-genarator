"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Mermaid({ code }: { code: string }) {
  const rawId = useId();
  const id = "mmd" + rawId.replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark =
          typeof document !== "undefined" &&
          document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          themeVariables: isDark
            ? { primaryColor: "#3f3f46", lineColor: "#a1a1aa" }
            : {},
        });
        const { svg } = await mermaid.render(id, code);
        if (active && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to render diagram");
      }
    })();
    return () => {
      active = false;
    };
  }, [code, id]);

  if (error) {
    return (
      <pre className="my-3 overflow-auto rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
        {error}
        {"\n\n"}
        {code}
      </pre>
    );
  }
  return (
    <div
      ref={ref}
      className="my-4 flex justify-center rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
    />
  );
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="report-md text-sm leading-relaxed text-slate-700 dark:text-zinc-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-5 mb-2 border-b border-slate-200 pb-1 text-lg font-semibold text-slate-900 dark:border-zinc-700 dark:text-zinc-50">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-1.5 text-base font-semibold text-slate-900 dark:text-zinc-100">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-zinc-50">
              {children}
            </strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-100">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {children}
            </tbody>
          ),
          th: ({ children }) => (
            <th className="border-b border-slate-200 px-3 py-2 font-semibold dark:border-zinc-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top">{children}</td>
          ),
          code: ({ className, children, ...props }) => (
            <code
              className={`rounded bg-slate-200/70 px-1 py-0.5 text-[0.85em] text-pink-600 dark:bg-zinc-700/70 dark:text-pink-300 ${className || ""}`}
              {...props}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => {
            const child = Array.isArray(children) ? children[0] : children;
            const el = child as any;
            const cn = el?.props?.className || "";
            if (/language-mermaid/.test(cn)) {
              const codeText = String(el?.props?.children ?? "").replace(
                /\n$/,
                ""
              );
              return <Mermaid code={codeText} />;
            }
            return (
              <pre className="my-3 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100 dark:bg-black/60">
                {children}
              </pre>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
