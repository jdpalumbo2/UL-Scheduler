"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

type BucketEntry = { bucket: string; count: number };
type UnitEntry = { unit: string; count: number };

const TOOLTIP_STYLE = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 1px 3px 0 rgb(15 42 71 / 0.08)",
};

export function MvpPitchChart({ data }: { data: BucketEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={32} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="2 2" />
        <XAxis
          dataKey="bucket"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={24}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#fafbfc" }} />
        <Bar dataKey="count" name="Teachers" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StartingPositionChart({ data }: { data: UnitEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        barSize={18}
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="#f1f5f9" strokeDasharray="2 2" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="unit"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#fafbfc" }} />
        <Bar dataKey="count" name="Teachers" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.count > 0 ? "#f97316" : "#fed7aa"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
