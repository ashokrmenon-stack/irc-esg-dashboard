"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

export function BarYearByEntity({ data, dataKey, label }: { data: any[]; dataKey: string; label: string }) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="location_code" angle={-40} height={70} textAnchor="end" interval={0} fontSize={11}/>
        <YAxis tickFormatter={(v) => Intl.NumberFormat("en", { notation: "compact" }).format(v)} />
        <Tooltip formatter={(v: number) => Intl.NumberFormat("en").format(v)} />
        <Legend />
        <Bar dataKey={dataKey} name={label} fill="#0d9488" />
      </BarChart>
    </ResponsiveContainer>
  );
}
