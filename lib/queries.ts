import { createServerClient } from "./supabase-server";

export type SummaryRow = {
  location_code: string; year: number;
  total_production_t: number | null;
  scope1_tco2e: number | null; scope2_tco2e: number | null; scope12_tco2e: number | null;
  total_energy_gj: number | null; renewable_energy_gj: number | null;
  total_withdrawn_areas_m3: number | null; total_discharge_m3: number | null;
  total_waste_t: number | null; hazardous_t: number | null; non_hazardous_t: number | null;
  nox_kg: number | null; sox_kg: number | null; pm_kg: number | null; voc_kg: number | null;
};

export async function fetchSummary(): Promise<SummaryRow[]> {
  const sb = createServerClient();
  const { data, error } = await sb.from("v_entity_year_summary").select("*").limit(5000);
  if (error) throw error;
  return (data ?? []) as SummaryRow[];
}

export function groupByYear<T extends { year: number }>(rows: T[]) {
  const m = new Map<number, T[]>();
  for (const r of rows) { if (!m.has(r.year)) m.set(r.year, []); m.get(r.year)!.push(r); }
  return m;
}
