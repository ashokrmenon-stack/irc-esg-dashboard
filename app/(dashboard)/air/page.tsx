import { BarYearByEntity } from "@/components/charts/BarYearByEntity";
import { TrendChart } from "@/components/charts/TrendChart";
import { fetchSummary } from "@/lib/queries";

export const revalidate = 300;
export default async function Page() {
  const rows = await fetchSummary();
  const years = Array.from(new Set(rows.map(r => r.year))).sort();
  const latest = years[years.length - 1];

  const irc = rows.filter(r => r.location_code === "IRC");
  const trend = years.map(y => ({ year: y, ["NOx (kg)"]: irc.find(r => r.year === y)?.nox_kg ?? null }));

  const byEntity = rows
    .filter(r => r.year === latest && r.location_code !== "IRC" && r.nox_kg != null)
    .sort((a, b) => (b.nox_kg ?? 0) - (a.nox_kg ?? 0));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Air pollutants</h1>
        <p className="text-sm text-gray-500">{years[0]}-{years[years.length-1]} · per-entity breakdown for {latest}</p>
      </header>
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-medium mb-4">IRC group trend</h2>
        <TrendChart
          data={trend}
          series={[{ key: "NOx (kg)", label: "NOx (kg)", color: "#0d9488" }]}
          yLabel="kg"
        />
      </section>
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-medium mb-4">By entity ({latest})</h2>
        <BarYearByEntity data={byEntity} dataKey="nox_kg" label="NOx (kg)" />
      </section>
    </div>
  );
}
