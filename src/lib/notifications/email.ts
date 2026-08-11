export async function sendAutoApplyEmail(to: string, appliedCount: number) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  const jobWord = appliedCount === 1 ? "job" : "jobs";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Resume Hub auto-applied to ${appliedCount} new ${jobWord} for you`,
        html: `<p>Good news — Resume Hub's auto-apply found ${appliedCount} new matching ${jobWord} and submitted your application automatically.</p><p>Sign in to review them on your <a href="https://www.resumehub.co.za/dashboard/applications">applications page</a>.</p>`,
      }),
    });
  } catch (err) {
    console.error("Auto-apply email send failed", err);
  }
}
