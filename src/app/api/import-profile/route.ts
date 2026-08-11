import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { randomSuffix } from "@/lib/slug";
import type { ResumeContent } from "@/types/database";

const PARSED_SCHEMA = {
  type: "object" as const,
  properties: {
    full_name: { type: "string" as const },
    email: { type: "string" as const },
    phone: { type: "string" as const },
    location: { type: "string" as const },
    website: { type: "string" as const },
    summary: { type: "string" as const },
    experience: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          company: { type: "string" as const },
          title: { type: "string" as const },
          location: { type: "string" as const },
          start_date: { type: "string" as const },
          end_date: { type: "string" as const },
          current: { type: "boolean" as const },
          description: { type: "string" as const },
        },
        required: ["company", "title"],
        additionalProperties: false,
      },
    },
    education: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          school: { type: "string" as const },
          degree: { type: "string" as const },
          field: { type: "string" as const },
          start_date: { type: "string" as const },
          end_date: { type: "string" as const },
        },
        required: ["school"],
        additionalProperties: false,
      },
    },
    skills: { type: "array" as const, items: { type: "string" as const } },
    projects: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          description: { type: "string" as const },
          url: { type: "string" as const },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  required: ["full_name", "experience", "education", "skills", "projects"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Profile import is not configured. Set ANTHROPIC_API_KEY on the server." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pastedText = String(formData.get("text") ?? "").trim();
  const file = formData.get("file");

  let sourceText = pastedText;

  if (!sourceText && file instanceof File) {
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
    }
    try {
      const { PDFParse } = await import("pdf-parse");
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      sourceText = parsed.text.trim();
    } catch (err) {
      console.error("PDF parse failed", err);
      return NextResponse.json({ error: "Could not read that PDF." }, { status: 400 });
    }
  }

  if (!sourceText) {
    return NextResponse.json(
      { error: "Paste your profile text or upload a PDF export of it." },
      { status: 400 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 2048,
      output_config: { format: { type: "json_schema", schema: PARSED_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Extract resume fields from this LinkedIn profile export. Only use information present in the text — do not invent anything. Leave fields blank/empty if not present.\n\n${sourceText}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text);

    const content: ResumeContent = {
      full_name: parsed.full_name ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      location: parsed.location ?? "",
      website: parsed.website ?? "",
      summary: parsed.summary ?? "",
      experience: (parsed.experience ?? []).map((exp: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        ...exp,
      })),
      education: (parsed.education ?? []).map((edu: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        ...edu,
      })),
      skills: parsed.skills ?? [],
      projects: (parsed.projects ?? []).map((project: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        ...project,
      })),
    };

    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        title: content.full_name ? `${content.full_name}'s Resume` : "Imported Resume",
        slug: `resume-${randomSuffix(8)}`,
        content,
      })
      .select("id")
      .single();

    if (error || !resume) {
      return NextResponse.json({ error: "Could not save imported resume." }, { status: 500 });
    }

    return NextResponse.json({ resumeId: resume.id });
  } catch (err) {
    console.error("Profile import failed", err);
    return NextResponse.json({ error: "Import failed. Please try again." }, { status: 500 });
  }
}
