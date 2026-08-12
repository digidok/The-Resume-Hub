import type { CvFileKind } from "./types";

const MIME_MAP: Record<string, CvFileKind> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
};

const EXTENSION_MAP: Record<string, CvFileKind> = {
  pdf: "pdf",
  docx: "docx",
  doc: "doc",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
};

export const ACCEPTED_EXTENSIONS = Object.keys(EXTENSION_MAP);

/** Just the two properties detection needs — satisfied by a browser File or a plain {name, type} record. */
type FileLike = { name: string; type?: string };

export function detectFileKind(file: FileLike): CvFileKind | null {
  if (file.type && MIME_MAP[file.type]) return MIME_MAP[file.type];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXTENSION_MAP[ext]) return EXTENSION_MAP[ext];
  return null;
}

export function imageMediaType(file: FileLike): "image/png" | "image/jpeg" | "image/webp" {
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/webp") return "image/webp";
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}
