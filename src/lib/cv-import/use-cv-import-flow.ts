"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACCEPTED_EXTENSIONS } from "@/lib/cv-import/detect";
import type { CvImportDraft } from "@/lib/cv-import/types";

// Matches Vercel's hard request-body cap on serverless functions (can't be
// raised via config) — files go straight to Supabase Storage from the
// browser instead, so this is just an early, friendly heads-up, not the
// thing actually enforcing the limit.
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const PROGRESS_STAGES = [
  "Uploading CV…",
  "Reading document…",
  "Analysing pages…",
  "Extracting experience…",
  "Building your Career Passport…",
];

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function extOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export type CvImportStage = "form" | "loading" | "review" | "error";

type UploadedFileRef = { storagePath: string; fileName: string; fileType?: string; fileSize: number };

function safeStorageName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "cv";
}

/** Uploads straight to Supabase Storage from the browser — see the note on MAX_FILE_BYTES above. */
async function uploadFilesToStorage(files: File[]): Promise<UploadedFileRef[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const uploaded: UploadedFileRef[] = [];
  for (const file of files) {
    const path = `${user.id}/${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}-${safeStorageName(file.name)}`;
    const { error } = await supabase.storage
      .from("cv-uploads")
      .upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (error) throw error;
    uploaded.push({ storagePath: path, fileName: file.name, fileType: file.type, fileSize: file.size });
  }
  return uploaded;
}

/**
 * The upload → parse → review → confirm state machine shared by the
 * standalone Import CV page and the "build a CV" onboarding wizard. Each
 * caller supplies onConfirmed to decide what happens once a resume has
 * actually been saved — the standalone page jumps straight to the editor,
 * the wizard continues to its remaining steps first.
 */
export function useCvImportFlow(onConfirmed: (resumeId: string) => void) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const [stage, setStage] = useState<CvImportStage>("form");
  const [progressLabel, setProgressLabel] = useState(PROGRESS_STAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CvImportDraft | null>(null);
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleFilePick(picked: FileList | null) {
    setPickError(null);
    if (!picked || picked.length === 0) return;
    const list = Array.from(picked);

    if (list.length > 1) {
      const allImages = list.every((f) => IMAGE_EXTENSIONS.has(extOf(f)));
      if (!allImages) {
        setPickError("Multiple files must all be images — one photo per CV page.");
        setFiles([list[0]]);
        return;
      }
    }

    const unsupported = list.find((f) => !ACCEPTED_EXTENSIONS.includes(extOf(f)));
    if (unsupported) {
      setPickError(`"${unsupported.name}" isn't a supported file type.`);
      return;
    }

    const tooLarge = list.find((f) => f.size > MAX_FILE_BYTES);
    if (tooLarge) {
      setPickError(
        `"${tooLarge.name}" is too large. Please upload files under ${MAX_FILE_BYTES / (1024 * 1024)}MB.`
      );
      return;
    }

    setFiles(list);
    setText("");
  }

  async function submit() {
    if (!text.trim() && files.length === 0) {
      setPickError("Paste your profile text or choose a CV file.");
      return;
    }
    setStage("loading");
    setError(null);

    let stageIndex = 0;
    setProgressLabel(PROGRESS_STAGES[0]);
    timerRef.current = setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, PROGRESS_STAGES.length - 1);
      setProgressLabel(PROGRESS_STAGES[stageIndex]);
    }, 2200);

    try {
      let body: { text: string } | { sourceFiles: UploadedFileRef[] };

      if (files.length > 0) {
        body = { sourceFiles: await uploadFilesToStorage(files) };
      } else {
        body = { text: text.trim() };
      }

      const res = await fetch("/api/import-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (timerRef.current) clearInterval(timerRef.current);

      if (!res.ok) {
        setError(data.error ?? "We couldn't fully read this CV.");
        setStage("error");
        return;
      }

      setDraft(data.draft as CvImportDraft);
      setStage("review");
    } catch (err) {
      if (timerRef.current) clearInterval(timerRef.current);
      console.error("CV upload failed", err);
      setError("We couldn't upload your file. Please check your connection and try again.");
      setStage("error");
    }
  }

  async function confirm(finalDraft: CvImportDraft) {
    setConfirming(true);
    try {
      const res = await fetch("/api/import-profile/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: finalDraft.content,
          careerExtras: finalDraft.careerExtras,
          sourceFilePath: finalDraft.sourceFiles[0]?.storagePath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "We couldn't save your CV.");
        setStage("error");
        return;
      }
      onConfirmed(data.resumeId as string);
    } catch {
      setError("We couldn't reach the server.");
      setStage("error");
    } finally {
      setConfirming(false);
    }
  }

  function startOver() {
    setStage("form");
    setDraft(null);
    setFiles([]);
    setText("");
    setError(null);
  }

  return {
    text,
    setText,
    files,
    setFiles,
    pickError,
    stage,
    progressLabel,
    error,
    draft,
    confirming,
    handleFilePick,
    submit,
    confirm,
    startOver,
  };
}
