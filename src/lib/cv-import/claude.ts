import Anthropic from "@anthropic-ai/sdk";
import { CV_EXTRACTION_SCHEMA, PHOTO_DETECTION_PROMPT, PHOTO_DETECTION_SCHEMA } from "./schema";
import type { CvExtractionResult } from "./types";

type ImageInput = { base64: string; mediaType: "image/png" | "image/jpeg" | "image/webp" };

export type ExtractionInput =
  | { mode: "text"; prompt: string }
  | { mode: "pdf-document"; prompt: string; pdfBase64: string }
  | { mode: "image"; prompt: string; images: ImageInput[] };

function buildContentBlocks(input: ExtractionInput, promptOverride?: string): Anthropic.MessageParam["content"] {
  const prompt = promptOverride ?? input.prompt;
  if (input.mode === "text") return prompt;
  if (input.mode === "pdf-document") {
    return [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 } },
      { type: "text", text: prompt },
    ];
  }
  return [
    ...input.images.map((img) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
    })),
    { type: "text" as const, text: prompt },
  ];
}

async function callStructured<T>(
  anthropic: Anthropic,
  content: Anthropic.MessageParam["content"],
  schema: Record<string, unknown>,
  maxTokens: number
): Promise<T> {
  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: maxTokens,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No response from AI.");
  }
  return JSON.parse(textBlock.text) as T;
}

export async function runCvExtraction(apiKey: string, input: ExtractionInput): Promise<CvExtractionResult> {
  const anthropic = new Anthropic({ apiKey });
  const content = buildContentBlocks(input);
  return callStructured<CvExtractionResult>(anthropic, content, CV_EXTRACTION_SCHEMA, 4096);
}

/**
 * Kept as a separate, minimal call — combining photo detection into the main
 * extraction schema pushes structured-output schema compilation past its
 * complexity limit. Only meaningful for vision-based modes (the model needs
 * to actually see the document); returns false for text-only input.
 */
export async function detectProfilePhoto(apiKey: string, input: ExtractionInput): Promise<boolean> {
  if (input.mode === "text") return false;
  const anthropic = new Anthropic({ apiKey });
  const content = buildContentBlocks(input, PHOTO_DETECTION_PROMPT);
  const result = await callStructured<{ has_profile_photo: boolean }>(
    anthropic,
    content,
    PHOTO_DETECTION_SCHEMA,
    50
  );
  return result.has_profile_photo;
}
