import { ClientLogo } from "@/components/clients/client-logo";

const CLIENTS = [
  { slug: "mtn", name: "MTN" },
  { slug: "vodacom", name: "Vodacom" },
  { slug: "sishen-iron-ore-development-trust", name: "SIOC Community Development Trust" },
  { slug: "south-african-weather-service", name: "South African Weather Service" },
  { slug: "jindal-mining", name: "Jindal Africa" },
  { slug: "eskom", name: "Eskom" },
];

export function ClientsStrip() {
  return (
    <section aria-labelledby="clients-heading" className="border-b border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h2
          id="clients-heading"
          className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          Organisations we have worked with
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-6">
          {CLIENTS.map((c) => (
            <li key={c.slug} className="flex h-24 items-center justify-center bg-white px-4">
              <ClientLogo slug={c.slug} name={c.name} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
