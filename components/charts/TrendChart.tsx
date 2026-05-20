"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

type Series = { key: string; label: string; color: string };
export function TrendChart({ data, series, yLabel }: { data: any[]; series: Series[]; yLabel?: string }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" />
        <YAxis tickFormatter={(v) => Intl.NumberFormat("en", { notation: "compact" }).format(v)} label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
        <Tooltip formatter={(v: number) => Intl.NumberFormat("en").format(v)} />
        <Legend />
        {series.map(s => <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot />)}
      </LineChart>
    </ResponsiveContainer>
  );
}
