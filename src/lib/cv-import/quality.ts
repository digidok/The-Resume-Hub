export type QualityCheck = { ok: boolean; reason?: string };

/**
 * Heuristic gate for native text extraction (PDF/DOCX/DOC). If this fails,
 * the caller should fall back to sending the document/image directly to
 * Claude instead of trusting the extracted text.
 */
export function assessTextQuality(rawText: string, pageCount = 1): QualityCheck {
  const text = rawText.trim();

  if (text.length < 40) {
    return { ok: false, reason: "Too little text was extracted." };
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 8) {
    return { ok: false, reason: "Only a few words were extracted." };
  }

  if (pageCount > 1) {
    const avgCharsPerPage = text.length / pageCount;
    if (avgCharsPerPage < 25) {
      return { ok: false, reason: `Too little text for a ${pageCount}-page document.` };
    }
  }

  const alnumCount = (text.match(/[a-zA-Z0-9]/g) ?? []).length;
  if (alnumCount / text.length < 0.4) {
    return { ok: false, reason: "A high proportion of characters look invalid." };
  }

  const replacementCount = (text.match(/�/g) ?? []).length;
  if (replacementCount / text.length > 0.05) {
    return { ok: false, reason: "Too many unreadable characters." };
  }

  const hasEmailLike = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasNameLike = /\b[A-Z][a-z]{1,}\s+[A-Z][a-z]{1,}\b/.test(text);
  if (!hasEmailLike && !hasNameLike) {
    return { ok: false, reason: "No email or name-like text was detected." };
  }

  return { ok: true };
}
