import { createClient } from "@supabase/supabase-js";
import { ALL_DIVISIONS, type Division } from "@/lib/catalog/divisions";

export type CatalogOverride = { service_id: string; from_zar: number | null; quote_only: boolean; available: boolean };

/** Public read of admin-managed price and availability overrides. Falls back to defaults on any error. */
export async function getOverrides(): Promise<Map<string, CatalogOverride>> {
  const map = new Map<string, CatalogOverride>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return map;
  try {
    const { data } = await createClient(url, key, { auth: { persistSession: false } })
      .from("catalog_overrides")
      .select("service_id, from_zar, quote_only, available");
    for (const row of (data ?? []) as CatalogOverride[]) map.set(row.service_id, row);
  } catch {
    // keep defaults
  }
  return map;
}

export function applyOverrides(division: Division, overrides: Map<string, CatalogOverride>): Division {
  return {
    ...division,
    services: division.services.map((s) => {
      const o = overrides.get(s.id);
      if (!o) return s;
      return {
        ...s,
        available: o.available,
        fromZar: o.quote_only ? undefined : o.from_zar !== null ? Number(o.from_zar) : s.fromZar,
      };
    }),
  };
}

export async function getDivisionsWithOverrides(divisions: Division[]): Promise<Division[]> {
  const overrides = await getOverrides();
  return divisions.map((d) => applyOverrides(d, overrides));
}

export async function getAnyDivisionWithOverrides(slug: string): Promise<Division | undefined> {
  const d = ALL_DIVISIONS.find((x) => x.slug === slug);
  if (!d) return undefined;
  return applyOverrides(d, await getOverrides());
}
