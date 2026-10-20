import { Check, ChevronDown } from "lucide-react";
import { MODEL_LABEL, formatPrice, type CatalogService } from "@/lib/catalog/divisions";
import { SERVICE_DETAILS } from "@/lib/catalog/details";

function priceBasis(service: CatalogService): string {
  if (service.fromZar === undefined) {
    return "This service is quoted for each request. Tell us what you need and we send a price for your approval before any work starts.";
  }
  const price = formatPrice(service);
  const monthly = service.models.includes("monthly");
  return `${price} is the starting price${monthly ? ", billed monthly for monthly packages" : ""}. The final price depends on scope, complexity and any third-party costs, and is confirmed in your quotation before any work starts.`;
}

// A price-list row that opens to explain what the price covers.
export function PriceRow({ service, enquiryHref }: { service: CatalogService; enquiryHref: string }) {
  const detail = SERVICE_DETAILS[service.id];
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-slate-700">
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            {service.name}
          </span>
          <span className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{service.models.map((m) => MODEL_LABEL[m]).join(" · ")}</span>
            <span className="font-semibold text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-4">
              {formatPrice(service)}
            </span>
          </span>
        </summary>
        <div className="space-y-3 bg-slate-50 px-5 pb-4 pt-3 text-sm">
          <p className="text-slate-700">{service.description}</p>
          {detail && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What the price covers</p>
              <ul className="mt-2 space-y-1.5">
                {detail.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-slate-500">{priceBasis(service)}</p>
          <a
            href={enquiryHref}
            className="inline-block rounded-md bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            {service.fromZar === undefined ? "Request a quote" : "Enquire about this service"}
          </a>
        </div>
      </details>
    </li>
  );
}
