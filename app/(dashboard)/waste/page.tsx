import { BarYearByEntity } from "@/components/charts/BarYearByEntity";
import { TrendChart } from "@/components/charts/TrendChart";
import { fetchSummary } from "@/lib/queries";

export const revalidate = 300;
export default async function Page() {
  const rows = await fetchSummary();
  const years = Array.from(new Set(rows.map(r => r.year))).sort();
  const latest = years[years.length - 1];

  const irc = rows.filter(r => r.location_code === "IRC");
  const trend = years.map(y => ({ year: y, ["Waste (tonnes)"]: irc.find(r => r.year === y)?.total_waste_t ?? null }));

  const byEntity = rows
    .filter(r => r.year === latest && r.location_code !== "IRC" && r.total_waste_t != null)
    .sort((a, b) => (b.total_waste_t ?? 0) - (a.total_waste_t ?? 0));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Waste</h1>
        <p className="text-sm text-gray-500">{years[0]}-{years[years.length-1]} · per-entity breakdown for {latest}</p>
      </header>
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-medium mb-4">IRC group trend</h2>
        <TrendChart
          data={trend}
          series={[{ key: "Waste (tonnes)", label: "Waste (tonnes)", color: "#0d9488" }]}
          yLabel="tonnes"
        />
      </section>
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-medium mb-4">By entity ({latest})</h2>
        <BarYearByEntity data={byEntity} dataKey="total_waste_t" label="Waste (tonnes)" />
      </section>
    </div>
  );
}
