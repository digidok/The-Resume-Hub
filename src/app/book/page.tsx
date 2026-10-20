import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getActiveTypes } from "@/lib/appointments/server";
import { whatsappLink } from "@/lib/whatsapp-contacts";

export const metadata = {
  title: "Book an appointment — The Resume Document Hub",
  description: "Book a consultation, screening or recruitment call with The Resume Document Hub.",
};
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  let types: Awaited<ReturnType<typeof getActiveTypes>> = [];
  try {
    types = await getActiveTypes();
  } catch {
    types = [];
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-3xl px-4 py-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">Appointments</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Book a time that suits you</h1>
            <p className="mt-3 text-slate-200">
              Choose a service, pick a day and time, and we will confirm by email. All times are South African time.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-4 py-12">
          {types.length > 0 ? (
            <BookingFlow types={types} initialType={type} />
          ) : (
            <p className="text-slate-600">
              Online booking is not available right now. Please{" "}
              <a className="font-medium text-brand-700 underline" href={whatsappLink("main", "Hi, I'd like to book a consultation.")}>
                WhatsApp us
              </a>{" "}
              or email info@resumehub.co.za.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
