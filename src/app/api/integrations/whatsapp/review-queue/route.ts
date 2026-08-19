import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WhatsAppServiceType } from "@/types/database";

const SERVICE_TYPES: WhatsAppServiceType[] = ["cv_cover_letter", "linkedin_revamp"];
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — generous for a docx/pdf preview

/** Inbound webhook n8n calls once it has generated a watermarked preview for
 * a WhatsApp done-for-you order (CV/cover letter or LinkedIn copy pack) —
 * this is the "Admin Review Queue" gate: the preview lands here for an admin
 * to approve/reject/request changes from the dashboard *before* n8n's next
 * step (sending it on to the client) can fire. See notifyReviewDecision in
 * src/lib/admin/whatsapp-review.ts for the corresponding outbound webhook
 * n8n needs to listen for. */
export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const customerPhone = typeof body?.customerPhone === "string" ? body.customerPhone.trim() : "";
  const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
  const serviceType = typeof body?.serviceType === "string" ? body.serviceType : "";
  const template = typeof body?.template === "string" ? body.template.trim() : "";
  const clientBrief = typeof body?.clientBrief === "string" ? body.clientBrief.trim() : "";
  const fileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const fileBase64 = typeof body?.fileBase64 === "string" ? body.fileBase64 : "";
  const contentType = typeof body?.contentType === "string" ? body.contentType : "application/octet-stream";

  if (!customerPhone) {
    return NextResponse.json({ error: "customerPhone is required." }, { status: 400 });
  }
  if (!SERVICE_TYPES.includes(serviceType as WhatsAppServiceType)) {
    return NextResponse.json({ error: `serviceType must be one of: ${SERVICE_TYPES.join(", ")}` }, { status: 400 });
  }
  if (!fileName || !fileBase64) {
    return NextResponse.json({ error: "fileName and fileBase64 are required." }, { status: 400 });
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(fileBase64, "base64");
  } catch {
    return NextResponse.json({ error: "fileBase64 is not valid base64." }, { status: 400 });
  }
  if (fileBuffer.length === 0 || fileBuffer.length > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is empty or exceeds the 15MB limit." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const reviewId = randomUUID();
  const storagePath = `${reviewId}/${fileName.replace(/[^\w.\-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage
    .from("whatsapp-previews")
    .upload(storagePath, fileBuffer, { contentType, upsert: false });
  if (uploadError) {
    console.error("WhatsApp review queue: preview upload failed", uploadError);
    return NextResponse.json({ error: "Could not store the preview file." }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("whatsapp_review_queue").insert({
    id: reviewId,
    customer_phone: customerPhone,
    customer_name: customerName || null,
    service_type: serviceType,
    template: template || null,
    client_brief: clientBrief || null,
    preview_storage_path: storagePath,
  });
  if (insertError) {
    console.error("WhatsApp review queue: insert failed", insertError);
    return NextResponse.json({ error: "Could not queue this preview for review." }, { status: 500 });
  }

  return NextResponse.json({ reviewId });
}
