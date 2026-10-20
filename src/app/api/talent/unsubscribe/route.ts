import { createAdminClient } from "@/lib/supabase/admin";

// Opt-out link in recruitment emails. GET only shows a confirmation button (email scanners
// open links automatically, so a GET must never opt anyone out); POST records the opt-out.

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#0f172a"><h1 style="font-size:1.4rem">${title}</h1>${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  );
}

function tokenOf(request: Request): string {
  return (new URL(request.url).searchParams.get("t") ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 64);
}

export async function GET(request: Request) {
  const t = tokenOf(request);
  if (!t) return page("Link not valid", "<p>This opt-out link is not valid.</p>", 400);
  return page(
    "Stop receiving messages?",
    `<p>We will stop sending you recruitment messages. You can still apply for jobs on Resume Hub.</p><form method="post" action="/api/talent/unsubscribe?t=${t}"><button style="background:#12264d;color:#fff;border:0;padding:.7rem 1.2rem;border-radius:6px;font-weight:600;cursor:pointer">Yes, stop messages</button></form>`
  );
}

export async function POST(request: Request) {
  const t = tokenOf(request);
  if (!t) return page("Link not valid", "<p>This opt-out link is not valid.</p>", 400);
  const { data } = await createAdminClient()
    .from("talent_pool")
    .update({ consent_status: "withdrawn", consent_at: null })
    .eq("unsub_token", t)
    .select("id");
  if (!data?.length) return page("Link not valid", "<p>We could not find this subscription.</p>", 404);
  return page("You have been unsubscribed", "<p>We will not send you any more recruitment messages. If this was a mistake, email info@resumehub.co.za.</p>");
}
