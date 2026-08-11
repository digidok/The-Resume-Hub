import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();
  const url = searchParams.get("url")?.trim();
  const company = searchParams.get("company")?.trim();
  const location = searchParams.get("location")?.trim();

  if (!title || !url) {
    return NextResponse.redirect(new URL("/dashboard/saved-jobs?error=missing", request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const target = `/api/saved-jobs/capture?${searchParams.toString()}`;
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(target)}`, request.url)
    );
  }

  await supabase.from("saved_jobs").insert({
    user_id: user.id,
    external_title: title,
    external_company: company || null,
    external_location: location || null,
    external_url: url,
  });

  return NextResponse.redirect(new URL("/dashboard/saved-jobs?captured=1", request.url));
}
