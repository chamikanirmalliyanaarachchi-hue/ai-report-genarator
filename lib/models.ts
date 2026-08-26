// Database models for the AI Report Analyzer.
// These describe the documents stored in Firestore (collection names match the
// keys used in lib/db.ts): "projects", "documents", "chatSessions", "memories".

export interface Project {
  id: string;
  userId: string;
  name: string;
  agent: string;
  prompt?: string;
  createdAt: number;
  updatedAt: number;
}

export type DocStatus = "processing" | "ready" | "error";

export interface ReportDocument {
  id: string;
  userId: string;
  projectId?: string;
  name: string;
  fileName?: string;
  fileType?: string;
  size: number;
  status: DocStatus;
  previewUrl?: string;
  createdAt: number;
}

export interface ChatEntryLite {
  id: string;
  title: string;
  content: string;
  kind: "prompt" | "pdf" | "file" | "image";
  agent: string;
  startedAt: number;
  imageUrl?: string;
}

export interface ChatSessionRecord {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  agent: string;
  entries: ChatEntryLite[];
  createdAt: number;
  updatedAt: number;
}

export interface Memory {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
