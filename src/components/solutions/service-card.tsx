import { Check, ChevronDown } from "lucide-react";
import { MODEL_LABEL, formatPrice, type CatalogService } from "@/lib/catalog/divisions";
import { SERVICE_DETAILS, processSteps } from "@/lib/catalog/details";

// A service card that opens in place to explain how the service works.
// Uses the native <details> element, so it works without JavaScript.
export function ServiceCard({ service, enquiryHref = "#enquiry" }: { service: CatalogService; enquiryHref?: string }) {
  const detail = SERVICE_DETAILS[service.id];
  const steps = detail?.steps ?? processSteps(service.models);

  return (
    <details className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md open:border-brand-300 open:shadow-md">
      <summary className="flex cursor-pointer list-none flex-col p-5 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-900">{service.name}</p>
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
        </div>
        <p className="mt-1 text-sm text-slate-600">{service.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-brand-700">{formatPrice(service)}</span>
          <span className="text-xs text-slate-500">{service.models.map((m) => MODEL_LABEL[m]).join(" · ")}</span>
        </div>
        <span className="mt-3 text-xs font-medium text-brand-600 group-open:hidden">How it works</span>
      </summary>

      <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4 text-sm">
        {detail && (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What you get</p>
              <ul className="mt-2 space-y-1.5">
                {detail.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What we need from you</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                {detail.needs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How it works</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-slate-500">Price and timing are confirmed in your quotation before any work starts.</p>
        <a
          href={enquiryHref}
          className="inline-block rounded-md bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
        >
          {service.fromZar === undefined ? "Request a quote" : "Enquire about this service"}
        </a>
      </div>
    </details>
  );
}
