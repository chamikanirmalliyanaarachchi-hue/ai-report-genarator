// Client-side data layer for the AI Report Analyzer.
// Talks to Firestore (web SDK) using the existing Firebase app. All reads/writes
// are scoped by `userId` so each account only sees its own Projects, Documents,
// and Chat History. Callers must pass the authenticated user's uid.

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Project,
  ReportDocument,
  ChatSessionRecord,
  Memory,
} from "./models";

const byCreatedDesc = (a: { createdAt: number }, b: { createdAt: number }) =>
  b.createdAt - a.createdAt;
const byUpdatedDesc = (a: { updatedAt: number }, b: { updatedAt: number }) =>
  b.updatedAt - a.updatedAt;

// Firestore rejects `undefined` field values, so strip them before writing.
// (e.g. an optional `projectId` that is `null` on the client must be omitted,
// not sent as `undefined`.)
function stripUndefined<T extends object>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/* --------------------------------- Projects -------------------------------- */

export async function createProject(
  userId: string,
  data: { name: string; agent: string; prompt?: string }
): Promise<Project> {
  const now = Date.now();
  const ref = await addDoc(collection(db, "projects"), {
    userId,
    name: data.name,
    agent: data.agent,
    prompt: data.prompt ?? "",
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: ref.id,
    userId,
    name: data.name,
    agent: data.agent,
    prompt: data.prompt,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listProjects(userId: string): Promise<Project[]> {
  const q = query(collection(db, "projects"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Project, "id">),
  }));
  return items.sort(byCreatedDesc);
}

export async function deleteProject(userId: string, id: string): Promise<void> {
  // Best-effort: only delete if it belongs to the user (rule-enforced server-side).
  void userId;
  await deleteDoc(doc(db, "projects", id));
}

/* -------------------------------- Documents -------------------------------- */

/**
 * Insert a document row. Uses an explicit id so the in-memory File map (keyed by
 * the same id) stays in sync for re-download / re-analyze within the session.
 */
export async function setDocument(
  userId: string,
  id: string,
  data: Omit<ReportDocument, "id" | "userId" | "createdAt">
): Promise<ReportDocument> {
  const now = Date.now();
  const record: ReportDocument = {
    id,
    userId,
    ...data,
    createdAt: now,
  };
  await setDoc(doc(db, "documents", id), stripUndefined(record));
  return record;
}

export async function listDocuments(userId: string): Promise<ReportDocument[]> {
  const q = query(collection(db, "documents"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ReportDocument, "id">),
  }));
  return items.sort(byCreatedDesc);
}

export async function deleteDocument(id: string): Promise<void> {
  await deleteDoc(doc(db, "documents", id));
}

/* ------------------------------ Chat History ------------------------------- */

/**
 * Upsert a chat session. Uses an explicit id (the same one used in local state)
 * so re-opening / deleting stays consistent.
 */
export async function setChatSession(
  userId: string,
  id: string,
  data: Omit<ChatSessionRecord, "id" | "userId" | "updatedAt">
): Promise<void> {
  const record: ChatSessionRecord = {
    id,
    userId,
    ...data,
    updatedAt: Date.now(),
  };
  await setDoc(doc(db, "chatSessions", id), stripUndefined(record), {
    merge: true,
  });
}

export async function listChatSessions(
  userId: string
): Promise<ChatSessionRecord[]> {
  const q = query(
    collection(db, "chatSessions"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ChatSessionRecord, "id">),
  }));
  return items.sort(byUpdatedDesc);
}

export async function deleteChatSession(id: string): Promise<void> {
  await deleteDoc(doc(db, "chatSessions", id));
}

/* -------------------------------- Memories --------------------------------- */

export async function setMemory(
  userId: string,
  id: string,
  data: { title: string; content: string }
): Promise<Memory> {
  const now = Date.now();
  const record: Memory = { id, userId, ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(db, "memories", id), record, { merge: true });
  return record;
}

export async function listMemories(userId: string): Promise<Memory[]> {
  const q = query(collection(db, "memories"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Memory, "id">),
  }));
  return items.sort(byUpdatedDesc);
}

export async function deleteMemory(id: string): Promise<void> {
  await deleteDoc(doc(db, "memories", id));
}

export async function clearMemories(userId: string): Promise<void> {
  const q = query(collection(db, "memories"), where("userId", "==", userId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

// Re-export for convenience to keep call sites tidy.
export type { Project, ReportDocument, ChatSessionRecord, Memory };
