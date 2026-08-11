export type PdfTextExtraction = { text: string; pageCount: number };

export async function extractPdfText(buffer: Buffer): Promise<PdfTextExtraction> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    const text = parsed.pages.map((p) => `--- page ${p.num} ---\n${p.text}`).join("\n\n");
    return { text: text.trim(), pageCount: parsed.total };
  } finally {
    await parser.destroy();
  }
}

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

/**
 * Best-effort legacy .doc extraction. word-extractor handles standard OLE2
 * Word documents; if it throws (unsupported variant), we fall back to a
 * crude printable-text scan so the caller can still assess whether there's
 * anything usable rather than failing outright.
 */
export async function extractDocText(buffer: Buffer): Promise<string> {
  try {
    const WordExtractor = (await import("word-extractor")).default;
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    return doc.getBody().trim();
  } catch (err) {
    console.error("word-extractor failed, falling back to raw scan", err);
    return crudeTextScan(buffer);
  }
}

function crudeTextScan(buffer: Buffer): string {
  const ascii = buffer.toString("latin1").replace(/[^\x20-\x7E\n]/g, " ");
  const runs = ascii.match(/[A-Za-z0-9][A-Za-z0-9 .,'&@()/-]{4,}/g) ?? [];
  return runs.join("\n").trim();
}
