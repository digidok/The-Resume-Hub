import { Resend } from "resend";

export async function sendReferenceRequestEmail(
  to: string,
  candidateName: string,
  submitUrl: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from,
      to,
      subject: `${candidateName} has requested a reference from you`,
      html: `<p>${candidateName} has listed you as a reference on Resume Hub, a South African job-seeking platform, and would like you to write a short reference on their behalf.</p><p><a href="${submitUrl}">Click here to submit your reference</a> — no account or sign-up required, it takes a couple of minutes.</p><p>If you weren't expecting this, you can safely ignore this email.</p>`,
    });
  } catch (err) {
    console.error("Reference request email send failed", err);
  }
}

export async function sendAutoApplyEmail(to: string, appliedCount: number) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  const jobWord = appliedCount === 1 ? "job" : "jobs";
  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Resume Hub auto-applied to ${appliedCount} new ${jobWord} for you`,
      html: `<p>Good news — Resume Hub's auto-apply found ${appliedCount} new matching ${jobWord} and submitted your application automatically.</p><p>Sign in to review them on your <a href="https://www.resumehub.co.za/dashboard/applications">applications page</a>.</p>`,
    });
  } catch (err) {
    console.error("Auto-apply email send failed", err);
  }
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** "Your resume has been registered" welcome email, sent when the business
 * registers a client's CV on the platform. Returns true only if Resend
 * accepted the message, so callers never report an email as sent when it was
 * not. */
export async function sendRegistrationEmail(to: string, name: string, loginUrl: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const resend = new Resend(apiKey);
  const first = escapeHtml(name.trim().split(/\s+/)[0] || "there");
  const safeUrl = escapeHtml(loginUrl);

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: "Your resume has been registered on Resume Hub",
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;line-height:1.55">
<h2 style="margin:0 0 12px;color:#142238">Hi ${first},</h2>
<p>Your resume has been registered on <strong>Resume Hub</strong>. Your documents are saved to your own private account, so you can open, download and update them whenever you need to.</p>
<p style="margin:24px 0"><a href="${safeUrl}" style="background:#142238;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold;display:inline-block">Open my Resume Hub</a></p>
<p style="font-size:14px;color:#475569">The button signs you in directly and works once, for a short time. If it has expired, go to <a href="https://www.resumehub.co.za/forgot-password">resumehub.co.za/forgot-password</a>, enter this email address and we will send you a fresh link to set your own password.</p>
<p style="font-size:14px;color:#475569">Questions? Just reply to this email.</p>
<p style="margin-top:24px">Kind regards,<br>The Resume Hub team</p>
</div>`,
    });
    if (error) {
      console.error("Registration email send failed", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Registration email send failed", err);
    return false;
  }
}
