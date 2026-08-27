"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  Brain,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  listMemories,
  setMemory,
  deleteMemory,
  clearMemories,
} from "@/lib/db";
import type { Memory } from "@/lib/models";

export default function MemoryCenterPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setMemories(await listMemories(user.uid));
    } catch {
      setError("Could not load memories. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
    else {
      setMemories([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;
    try {
      const m = await setMemory(user.uid, crypto.randomUUID(), {
        title: title.trim(),
        content: content.trim(),
      });
      setMemories((prev) => [m, ...prev]);
      setTitle("");
      setContent("");
      setError(null);
    } catch {
      setError("Failed to save memory. Please try again.");
    }
  };

  const startEdit = (m: Memory) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditContent(m.content);
  };

  const handleEdit = async (id: string) => {
    if (!user || !editTitle.trim() || !editContent.trim()) return;
    try {
      const updated = await setMemory(user.uid, id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? updated : m))
      );
      setEditingId(null);
      setError(null);
    } catch {
      setError("Failed to update memory. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Failed to delete memory.");
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (
      !window.confirm(
        "Clear all saved memories? This cannot be undone."
      )
    )
      return;
    try {
      await clearMemories(user.uid);
      setMemories([]);
    } catch {
      setError("Failed to clear memories.");
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-orange-600 dark:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Report Generator
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">
              AI Report Generator
            </span>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Go to app
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Memory Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Stored context, custom instructions, and saved notes the AI
              remembers across your projects.
            </p>
          </div>
        </motion.div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Add memory */}
        {!user ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-slate-500 dark:text-zinc-400">
              Please sign in to use the Memory Center.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleAdd}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Add a memory
            </h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Company tone guide)"
              className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should the AI remember? Add instructions, preferences, or context."
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Save memory
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Saved memories ({memories.length})
            </h2>
            {memories.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-medium text-red-500 hover:underline dark:text-red-400"
              >
                Clear all
              </button>
            )}
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-400">Loading…</p>
          ) : memories.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
              No memories yet. Add your first memory above.
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {memories.map((m) => (
                <li
                  key={m.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {editingId === m.id ? (
                    <div>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          <X className="h-4 w-4" /> Cancel
                        </button>
                        <button
                          onClick={() => handleEdit(m.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-sm font-semibold text-white"
                        >
                          <Check className="h-4 w-4" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold">{m.title}</h3>
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => startEdit(m)}
                            aria-label="Edit"
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            aria-label="Delete"
                            className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-zinc-300">
                        {m.content}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
