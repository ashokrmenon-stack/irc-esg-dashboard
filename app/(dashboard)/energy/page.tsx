import { BarYearByEntity } from "@/components/charts/BarYearByEntity";
import { TrendChart } from "@/components/charts/TrendChart";
import { fetchSummary } from "@/lib/queries";

export const revalidate = 300;
export default async function Page() {
  const rows = await fetchSummary();
  const years = Array.from(new Set(rows.map(r => r.year))).sort();
  const latest = years[years.length - 1];

  const irc = rows.filter(r => r.location_code === "IRC");
  const trend = years.map(y => ({ year: y, ["Energy (GJ)"]: irc.find(r => r.year === y)?.total_energy_gj ?? null }));

  const byEntity = rows
    .filter(r => r.year === latest && r.location_code !== "IRC" && r.total_energy_gj != null)
    .sort((a, b) => (b.total_energy_gj ?? 0) - (a.total_energy_gj ?? 0));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Energy</h1>
        <p className="text-sm text-gray-500">{years[0]}-{years[years.length-1]} · per-entity breakdown for {latest}</p>
      </header>
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-medium mb-4">IRC group trend</h2>
        <TrendChart
          data={trend}
          series={[{ key: "Energy (GJ)", label: "Energy (GJ)", color: "#0d9488" }]}
          yLabel="GJ"
        />
      </section>
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-medium mb-4">By entity ({latest})</h2>
        <BarYearByEntity data={byEntity} dataKey="total_energy_gj" label="Energy (GJ)" />
      </section>
    </div>
  );
}
