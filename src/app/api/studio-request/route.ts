import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DOCUMENT_TYPE_IDS,
  TEMPLATE_STYLE_IDS,
  UPLOAD_RULES,
  documentLabel,
  type FileDescriptor,
  type UploadKind,
} from "@/lib/studio/catalog";

const BUCKET = "studio-uploads";
const NOTIFY_TO = "info@resumehub.co.za";
const MAX_PER_HOUR = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function makeReference(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `RDH-${out}`;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success for bots.
  if (clean(body.website, 100)) {
    return NextResponse.json({ reference: "RDH-000000", uploads: [] });
  }

  const documentType = clean(body.documentType, 60);
  const templateStyle = clean(body.templateStyle, 60);
  const companyName = clean(body.companyName, 160);
  const contactName = clean(body.contactName, 120);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const deadlineRaw = clean(body.deadline, 10);
  const brief = clean(body.brief, 4000);

  if (!DOCUMENT_TYPE_IDS.includes(documentType)) {
    return NextResponse.json({ error: "Please choose a document type." }, { status: 400 });
  }
  if (!TEMPLATE_STYLE_IDS.includes(templateStyle)) {
    return NextResponse.json({ error: "Please choose a template style." }, { status: 400 });
  }
  if (!companyName || !contactName) {
    return NextResponse.json({ error: "Company and contact name are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw) ? deadlineRaw : null;

  const rawFiles: unknown[] = Array.isArray(body.files) ? body.files.slice(0, 6) : [];
  const files: FileDescriptor[] = [];
  const perKind: Record<string, number> = {};
  for (const f of rawFiles) {
    const item = f as Partial<FileDescriptor>;
    const kind = item.kind as UploadKind;
    const rules = UPLOAD_RULES[kind];
    if (!rules) return NextResponse.json({ error: "Unsupported file." }, { status: 400 });
    const name = clean(item.name, 200);
    const size = Number(item.size);
    const type = clean(item.type, 120);
    if (!name || !Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "Unsupported file." }, { status: 400 });
    }
    if (size > rules.maxBytes) {
      return NextResponse.json(
        { error: `${rules.label} "${name}" is too large (limit ${Math.round(rules.maxBytes / 1048576)}MB).` },
        { status: 400 },
      );
    }
    if (!rules.mimes.includes(type)) {
      return NextResponse.json({ error: `${rules.label} "${name}" is not a supported file type.` }, { status: 400 });
    }
    perKind[kind] = (perKind[kind] ?? 0) + 1;
    if (perKind[kind] > rules.maxFiles) {
      return NextResponse.json({ error: `Too many ${rules.label.toLowerCase()} files.` }, { status: 400 });
    }
    files.push({ kind, name, size, type });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Requests are temporarily unavailable. Please WhatsApp us." }, { status: 503 });
  }

  // Light abuse guard: limit requests per email per hour.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("studio_requests")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json({ error: "Too many requests. Please try again later or WhatsApp us." }, { status: 429 });
  }

  const reference = makeReference();
  const stored = files.map((f) => ({
    ...f,
    path: `${reference}/${f.kind}-${crypto.randomUUID().slice(0, 8)}-${safeName(f.name)}`,
  }));

  const { error: insertError } = await admin.from("studio_requests").insert({
    reference,
    document_type: documentType,
    template_style: templateStyle,
    company_name: companyName,
    contact_name: contactName,
    email,
    phone: phone || null,
    deadline,
    brief: brief || null,
    files: stored,
  });
  if (insertError) {
    console.error("studio_requests insert failed", insertError);
    return NextResponse.json({ error: "We couldn't save your request. Please try again." }, { status: 500 });
  }

  const uploads: { kind: UploadKind; name: string; path: string; token: string }[] = [];
  for (const f of stored) {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(f.path);
    if (error || !data) {
      console.error("signed upload url failed", error);
      continue;
    }
    uploads.push({ kind: f.kind, name: f.name, path: f.path, token: data.token });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    try {
      await new Resend(apiKey).emails.send({
        from,
        to: NOTIFY_TO,
        replyTo: email,
        subject: `New Document Studio request ${reference}: ${documentLabel(documentType)}`,
        html: `<p><strong>${esc(reference)}</strong></p>
<p><strong>Document:</strong> ${esc(documentLabel(documentType))}<br>
<strong>Template:</strong> ${esc(templateStyle)}<br>
<strong>Company:</strong> ${esc(companyName)}<br>
<strong>Contact:</strong> ${esc(contactName)} (${esc(email)}${phone ? `, ${esc(phone)}` : ""})<br>
<strong>Deadline:</strong> ${deadline ? esc(deadline) : "not specified"}<br>
<strong>Files:</strong> ${stored.length ? stored.map((f) => esc(`${f.kind}: ${f.name}`)).join("; ") : "none"}</p>
<p>${esc(brief || "No brief provided.").replace(/\n/g, "<br>")}</p>
<p>Files are in the private Supabase bucket "${BUCKET}" under ${esc(reference)}/.</p>`,
      });
    } catch (err) {
      console.error("studio request email failed", err);
    }
  }

  return NextResponse.json({ reference, uploads });
}
