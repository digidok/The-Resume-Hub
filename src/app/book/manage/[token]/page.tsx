import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CancelButton } from "@/components/booking/cancel-button";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatSast } from "@/lib/appointments/slots";

export const metadata = { title: "Your appointment — The Resume Document Hub", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ManageAppointmentPage({ params }: PageProps<"/book/manage/[token]">) {
  const { token } = await params;
  const { data: appt } = await createAdminClient()
    .from("appointments")
    .select("reference, name, starts_at, ends_at, status, appointment_types(name, duration_minutes)")
    .eq("manage_token", token.slice(0, 80))
    .maybeSingle();
  if (!appt) notFound();

  const typeRow = Array.isArray(appt.appointment_types) ? appt.appointment_types[0] : appt.appointment_types;
  const upcoming = appt.status === "booked" && new Date(appt.starts_at) > new Date();

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-14">
        <h1 className="text-2xl font-bold text-slate-900">Your appointment</h1>
        <div className="mt-6 rounded-2xl border border-slate-200 p-6">
          <p className="text-lg font-semibold text-slate-900">{typeRow?.name}</p>
          <p className="mt-1 text-slate-700">{formatSast(appt.starts_at)} (South African time)</p>
          <p className="mt-1 text-sm text-slate-500">
            {typeRow?.duration_minutes} minutes · Reference {appt.reference}
          </p>
          <p className="mt-3 text-sm">
            Status: <strong className="capitalize">{appt.status.replace("_", " ")}</strong>
          </p>
        </div>
        {upcoming ? (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <CancelButton token={token} />
            <Link href="/book" className="text-sm font-medium text-brand-700 hover:underline">
              Book a different time
            </Link>
          </div>
        ) : (
          <Link href="/book" className="mt-6 inline-block text-sm font-medium text-brand-700 hover:underline">
            Book a new appointment
          </Link>
        )}
        <p className="mt-6 text-xs text-slate-500">
          To change the time, cancel this appointment and book a new one.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
