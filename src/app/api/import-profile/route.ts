import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectFileKind, imageMediaType } from "@/lib/cv-import/detect";
import { assessTextQuality } from "@/lib/cv-import/quality";
import { extractDocText, extractDocxText, extractPdfText } from "@/lib/cv-import/extract-text";
import {
  buildDocumentExtractionPrompt,
  buildImageExtractionPrompt,
  buildTextExtractionPrompt,
} from "@/lib/cv-import/schema";
import { detectProfilePhoto, runCvExtraction, type ExtractionInput } from "@/lib/cv-import/claude";
import { buildDraftFromExtraction } from "@/lib/cv-import/build-draft";
import type { CvSourceFile } from "@/lib/cv-import/types";

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_FILES = 10;

function friendlyError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type UploadedFileRef = { storagePath: string; fileName: string; fileType?: string; fileSize: number };

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return friendlyError("CV import is not configured. Set ANTHROPIC_API_KEY on the server.", 503);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return friendlyError("Sign in required.", 401);
  }

  // The client uploads the file(s) straight to Supabase Storage and sends us
  // only the storage paths — never the raw bytes. Vercel enforces a hard
  // 4.5MB request-body limit on serverless functions that no amount of app
  // config can raise, so routing real CV files (often several MB once a
  // scan or embedded photo is involved) through this route's own body would
  // silently fail for a large share of real uploads.
  const body = await request.json().catch(() => null);
  if (!body) {
    return friendlyError("Invalid request.", 400);
  }

  const pastedText = typeof body.text === "string" ? body.text.trim() : "";
  const uploadedFiles: UploadedFileRef[] = Array.isArray(body.sourceFiles) ? body.sourceFiles : [];

  const usageLog = { supabase, userId: user.id };

  try {
    // --- Pasted text path (LinkedIn export paste) ---
    if (pastedText) {
      const parsed = await runCvExtraction(
        apiKey,
        {
          mode: "text",
          prompt: buildTextExtractionPrompt(pastedText),
        },
        usageLog
      );
      const draft = buildDraftFromExtraction(parsed, []);
      return NextResponse.json({ draft });
    }

    if (uploadedFiles.length === 0) {
      return friendlyError("Paste your profile text or upload a CV file.", 400);
    }

    if (uploadedFiles.length > 1 && uploadedFiles.length > MAX_IMAGE_FILES) {
      return friendlyError(`You can upload up to ${MAX_IMAGE_FILES} page images at once.`, 400);
    }

    for (const ref of uploadedFiles) {
      if (ref.fileSize > MAX_FILE_BYTES) {
        return friendlyError(
          `"${ref.fileName}" is too large. Please upload files under ${MAX_FILE_BYTES / (1024 * 1024)}MB.`,
          413
        );
      }
    }

    const kinds = uploadedFiles.map((ref) => detectFileKind({ name: ref.fileName, type: ref.fileType }));
    if (kinds.some((k) => k === null)) {
      return friendlyError(
        "Unsupported file type. Please upload a PDF, DOCX, DOC, PNG, JPG, or WEBP file.",
        400
      );
    }

    if (uploadedFiles.length > 1 && kinds.some((k) => k !== "image")) {
      return friendlyError(
        "Multiple files are only supported for image pages (e.g. photos of each CV page). Upload a single PDF/DOCX/DOC file instead.",
        400
      );
    }

    const sourceFiles: CvSourceFile[] = [];
    const buffers: Buffer[] = [];
    for (const ref of uploadedFiles) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from("cv-uploads")
        .download(ref.storagePath);
      if (downloadError || !blob) {
        console.error("CV source file download failed", downloadError);
        return friendlyError("We couldn't read your uploaded file. Please try again.", 500);
      }
      buffers.push(Buffer.from(await blob.arrayBuffer()));
      sourceFiles.push({ storagePath: ref.storagePath, fileName: ref.fileName, fileSize: ref.fileSize });
    }

    const kind = kinds[0]!;

    // --- Images (single or multi-page) — sent straight to Claude vision ---
    if (kind === "image") {
      const images = uploadedFiles.map((ref, i) => ({
        base64: buffers[i]!.toString("base64"),
        mediaType: imageMediaType({ name: ref.fileName, type: ref.fileType }),
      }));
      const extractionInput: ExtractionInput = {
        mode: "image",
        prompt: buildImageExtractionPrompt(uploadedFiles.length),
        images,
      };
      const [parsed, hasProfilePhoto] = await Promise.all([
        runCvExtraction(apiKey, extractionInput, usageLog),
        detectProfilePhoto(apiKey, extractionInput, usageLog),
      ]);
      const draft = buildDraftFromExtraction(parsed, sourceFiles, { hasProfilePhoto });
      return NextResponse.json({ draft });
    }

    const buffer = buffers[0]!;

    // --- PDF: native text first, OCR/vision fallback for scanned PDFs ---
    if (kind === "pdf") {
      let nativeText = "";
      let pageCount = 1;
      try {
        const extracted = await extractPdfText(buffer);
        nativeText = extracted.text;
        pageCount = extracted.pageCount;
      } catch (err) {
        console.error("Native PDF text extraction failed", err);
      }

      const quality = assessTextQuality(nativeText, pageCount);

      if (quality.ok) {
        const parsed = await runCvExtraction(
          apiKey,
          {
            mode: "text",
            prompt: buildTextExtractionPrompt(nativeText),
          },
          usageLog
        );
        const draft = buildDraftFromExtraction(parsed, sourceFiles);
        return NextResponse.json({ draft });
      }

      // Scanned/image-based PDF — let Claude read the document directly.
      const extractionInput: ExtractionInput = {
        mode: "pdf-document",
        prompt: buildDocumentExtractionPrompt(),
        pdfBase64: buffer.toString("base64"),
      };
      const [parsed, hasProfilePhoto] = await Promise.all([
        runCvExtraction(apiKey, extractionInput, usageLog),
        detectProfilePhoto(apiKey, extractionInput, usageLog),
      ]);
      const draft = buildDraftFromExtraction(parsed, sourceFiles, {
        hasProfilePhoto,
        warning:
          "This looked like a scanned or image-based PDF, so we read it visually instead of extracting text directly.",
      });
      return NextResponse.json({ draft });
    }

    // --- DOCX ---
    if (kind === "docx") {
      let text = "";
      try {
        text = await extractDocxText(buffer);
      } catch (err) {
        console.error("DOCX parse failed", err);
        return friendlyError("We couldn't read that DOCX file. It may be corrupted.", 400);
      }
      if (!assessTextQuality(text).ok) {
        return friendlyError(
          "We couldn't find enough readable text in that document. Please try a PDF or image export instead.",
          400
        );
      }
      const parsed = await runCvExtraction(
        apiKey,
        {
          mode: "text",
          prompt: buildTextExtractionPrompt(text),
        },
        usageLog
      );
      const draft = buildDraftFromExtraction(parsed, sourceFiles);
      return NextResponse.json({ draft });
    }

    // --- Legacy DOC (best-effort) ---
    const text = await extractDocText(buffer);
    if (!assessTextQuality(text).ok) {
      return friendlyError(
        "We couldn't fully read that .doc file. Please try saving it as PDF or DOCX and uploading again.",
        400
      );
    }
    const parsed = await runCvExtraction(
      apiKey,
      {
        mode: "text",
        prompt: buildTextExtractionPrompt(text),
      },
      usageLog
    );
    const draft = buildDraftFromExtraction(parsed, sourceFiles, {
      warning: "Older .doc files can be harder to read reliably — please double-check the details below.",
    });
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("CV import failed", err);
    return friendlyError("We couldn't fully read this CV. Please try again.", 500);
  }
}
