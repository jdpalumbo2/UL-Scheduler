"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

type DayEntry = { date: string; entreINC: number; incubator: number };

export default function DailyChart({ data }: { data: DayEntry[] }) {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const formatted = data.map((d) => {
    const [, month, day] = d.date.split("-");
    return {
      ...d,
      label: `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`,
    };
  });

  const tickFormatter = (_: string, index: number) =>
    index % 5 === 0 ? formatted[index]?.label ?? "" : "";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} barSize={10} barCategoryGap="20%">
        <CartesianGrid
          vertical={false}
          stroke="#f1f5f9"
          strokeDasharray="2 2"
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={tickFormatter}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={24}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 12,
            boxShadow: "0 1px 3px 0 rgb(15 42 71 / 0.08)",
          }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
        />
        <Bar
          dataKey="entreINC"
          name="entreINCedu"
          stackId="a"
          fill="#0d9488"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="incubator"
          name="INCubatoredu"
          stackId="a"
          fill="#f97316"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
