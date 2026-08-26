"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2 } from "lucide-react";

const ACCEPTED =
  ".csv,.xlsx,.xls,.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.gif";
const ACCEPTED_LABEL = "Documents & images";

export default function FileUploadBox({
  value,
  onChange,
}: {
  value?: File | null;
  onChange?: (file: File | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [internal, setInternal] = useState<File | null>(null);
  const file = value !== undefined ? value : internal;

  const setFile = useCallback(
    (f: File | null) => {
      if (onChange) onChange(f);
      else setInternal(f);
    },
    [onChange]
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) setFile(files[0]);
    },
    [setFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload file dropzone"
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !file) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`group relative mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
        isDragging
          ? "border-orange-500 bg-orange-500/10"
          : "border-zinc-300 bg-zinc-100/60 hover:border-orange-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-orange-500/70 dark:hover:bg-zinc-800/70"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {file ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full items-center justify-between gap-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-strong">
                {file.name}
              </p>
              <p className="text-xs text-muted">
                {(file.size / 1024).toFixed(1)} KB · Ready
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
            <button
              type="button"
              onClick={reset}
              aria-label="Remove file"
              className="rounded-full p-1 text-muted transition-colors hover:bg-zinc-200 hover:text-strong dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          <span
            className={`mb-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 ${
              isDragging
                ? "bg-orange-500/20 text-orange-500"
                : "bg-zinc-200/70 text-zinc-500 group-hover:text-orange-500 dark:bg-zinc-700/60 dark:text-zinc-400"
            }`}
          >
            <UploadCloud className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-strong">
            {isDragging ? "Drop your file here" : "Drag & drop your data file"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {ACCEPTED_LABEL} · or{" "}
            <span className="font-semibold text-orange-500">browse</span>
          </p>
        </>
      )}
    </div>
  );
}
