import { NextResponse } from "next/server";
import { getActiveTypes, getOpenSlots } from "@/lib/appointments/server";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("type") ?? "";
  try {
    const types = await getActiveTypes();
    const type = types.find((t) => t.slug === slug);
    if (!type) return NextResponse.json({ error: "Unknown appointment type." }, { status: 404 });
    const slots = await getOpenSlots(type);
    return NextResponse.json({ type, slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("slots lookup failed", err);
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 503 });
  }
}
