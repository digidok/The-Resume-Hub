import { Resend } from "resend";

export const TEAM_EMAIL = "info@resumehub.co.za";
export const SITE_URL = "https://www.resumehub.co.za";

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Sends a transactional email. Never throws: a failed email must not break the action that triggered it. */
export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  try {
    await new Resend(apiKey).emails.send({ from, ...opts });
    return true;
  } catch (err) {
    console.error("email send failed", opts.subject, err);
    return false;
  }
}

export function emailBody(greetingName: string, paragraphs: string[], link?: { path: string; label: string }): string {
  const cta = link
    ? `<p><a href="${SITE_URL}${link.path}" style="display:inline-block;background:#12264d;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">${esc(link.label)}</a></p>`
    : "";
  return `<p>Hi ${esc(greetingName)},</p>${paragraphs.map((p) => `<p>${p}</p>`).join("")}${cta}<p>The Resume Document Hub<br>Single Point of Contact</p>`;
}
