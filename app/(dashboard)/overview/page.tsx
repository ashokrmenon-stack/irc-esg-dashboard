import { KpiCard } from "@/components/ui/KpiCard";
import { TrendChart } from "@/components/charts/TrendChart";
import { fetchSummary } from "@/lib/queries";

export const revalidate = 300; // ISR: refresh every 5 min

export default async function OverviewPage() {
  const rows = await fetchSummary();
  const years = Array.from(new Set(rows.map(r => r.year))).sort();

  // Aggregate by year (IRC only — group rollup) for headline trend
  const irc = rows.filter(r => r.location_code === "IRC");
  const ircByYear = years.map(y => irc.find(r => r.year === y));

  // KPIs from latest year (max)
  const latest = years[years.length - 1];
  const ircLatest = irc.find(r => r.year === latest);
  const fmt = (n: number | null | undefined) => n == null ? "—" : Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

  const trendData = years.map(y => {
    const r = irc.find(x => x.year === y);
    return {
      year: y,
      Emissions: r?.scope12_tco2e ?? null,
      Energy: r?.total_energy_gj ?? null,
      Water: r?.total_withdrawn_areas_m3 ?? null,
      Waste: r?.total_waste_t ?? null
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-gray-500">IRC group totals, {years[0]}-{years[years.length-1]}</p>
      </header>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Scope 1+2 (tCO₂e)" value={fmt(ircLatest?.scope12_tco2e)} sub={`as of ${latest}`} />
        <KpiCard label="Energy (GJ)"       value={fmt(ircLatest?.total_energy_gj)} sub={`as of ${latest}`} />
        <KpiCard label="Water (m³)"        value={fmt(ircLatest?.total_withdrawn_areas_m3)} sub={`as of ${latest}`} />
        <KpiCard label="Waste (t)"         value={fmt(ircLatest?.total_waste_t)} sub={`as of ${latest}`} />
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-medium mb-4">Headline trends (IRC group)</h2>
        <TrendChart
          data={trendData}
          series={[
            { key: "Emissions", label: "GHG Scope 1+2 (tCO₂e)", color: "#dc2626" },
            { key: "Energy",    label: "Energy (GJ)",            color: "#f59e0b" },
            { key: "Water",     label: "Water withdrawn (m³)",   color: "#3b82f6" },
            { key: "Waste",     label: "Waste generated (t)",    color: "#0d9488" }
          ]}
        />
      </section>
    </div>
  );
}
