// Pre-signup file retention.
//
// When a visitor uploads a file on the landing page and hits "Generate Report"
// before authenticating, we persist the file (content + metadata) to
// localStorage under a single key. After they sign up / log in and land on the
// dashboard, the file is rehydrated and auto-injected into the workspace.
//
// NOTE: localStorage only holds strings, so we serialize the File as a base64
// data URL. A size guard keeps us under the typical ~5MB quota.

export const PENDING_UPLOAD_KEY = "pending_upload_file";
const MAX_BYTES = 4 * 1024 * 1024; // 4MB safeguard

export interface PendingUpload {
  name: string;
  type: string;
  size: number;
  dataUrl: string; // base64 data URL: data:<mime>;base64,...
  savedAt: number;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** Persist a file to localStorage. Returns false if too large or unsupported. */
export async function savePendingUpload(file: File): Promise<boolean> {
  if (file.size > MAX_BYTES) return false;
  try {
    const dataUrl = await readAsDataURL(file);
    const payload: PendingUpload = {
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      savedAt: Date.now(),
    };
    localStorage.setItem(PENDING_UPLOAD_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** Read the saved pending file, or null if none / corrupted. */
export function loadPendingUpload(): PendingUpload | null {
  try {
    const raw = localStorage.getItem(PENDING_UPLOAD_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingUpload;
    if (!data?.dataUrl || !data.name) return null;
    return data;
  } catch {
    return null;
  }
}

/** Remove the saved pending file (call after a successful injection). */
export function clearPendingUpload(): void {
  try {
    localStorage.removeItem(PENDING_UPLOAD_KEY);
  } catch {
    /* ignore */
  }
}

/** Rebuild a real File object from a stored PendingUpload. */
export function dataUrlToFile(data: PendingUpload): File {
  const [meta, b64] = data.dataUrl.split(",");
  const mimeMatch = /data:([^;]*);base64/.exec(meta);
  const mime = mimeMatch ? mimeMatch[1] : data.type || "application/octet-stream";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], data.name, { type: mime });
}
