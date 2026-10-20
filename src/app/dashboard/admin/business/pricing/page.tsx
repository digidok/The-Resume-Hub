import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireAdminPage } from "@/lib/business/guard";
import { clearCatalogOverride, saveCatalogOverride } from "@/lib/business/actions";
import { ALL_DIVISIONS, formatPrice } from "@/lib/catalog/divisions";
import { applyOverrides, type CatalogOverride } from "@/lib/catalog/overrides";

export const metadata = { title: "Pricing — The Resume Document Hub" };

export default async function PricingEditorPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("catalog_overrides").select("service_id, from_zar, quote_only, available");
  const overrides = new Map(((data ?? []) as CatalogOverride[]).map((o) => [o.service_id, o]));

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Change a starting price, switch a service to &quot;Request a quote&quot;, or hide it. Changes appear on the
        public pages within a few minutes. Reset returns a service to its default in the catalogue.
      </p>
      <BusinessAdminNav />

      <div className="space-y-6">
        {ALL_DIVISIONS.map((d) => {
          const effective = applyOverrides(d, overrides);
          return (
            <Card key={d.slug} className="overflow-hidden">
              <h2 className="border-b border-slate-100 bg-slate-50 px-5 py-3 font-semibold text-slate-900">{d.title}</h2>
              <ul className="divide-y divide-slate-100">
                {d.services.map((s, i) => {
                  const o = overrides.get(s.id);
                  const eff = effective.services[i];
                  return (
                    <li key={s.id} className="px-5 py-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          Default: {formatPrice(s)} · Showing: {eff.available === false ? "hidden" : formatPrice(eff)}
                          {o ? " · edited" : ""}
                        </p>
                      </div>
                      <form action={saveCatalogOverride} className="mt-2 flex flex-wrap items-center gap-3">
                        <input type="hidden" name="service_id" value={s.id} />
                        <input
                          name="from_zar"
                          inputMode="decimal"
                          defaultValue={o?.from_zar ?? ""}
                          placeholder={s.fromZar !== undefined ? `Default R${s.fromZar}` : "No default price"}
                          className="w-40 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                        />
                        <label className="flex items-center gap-1.5 text-sm text-slate-700">
                          <input type="checkbox" name="quote_only" defaultChecked={o?.quote_only ?? false} />
                          Request a quote
                        </label>
                        <label className="flex items-center gap-1.5 text-sm text-slate-700">
                          <input type="checkbox" name="available" defaultChecked={o?.available ?? true} />
                          Visible
                        </label>
                        <Button type="submit" size="sm" variant="outline">
                          Save
                        </Button>
                        {o && (
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            formAction={async () => {
                              "use server";
                              await clearCatalogOverride(s.id);
                            }}
                          >
                            Reset
                          </Button>
                        )}
                      </form>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
