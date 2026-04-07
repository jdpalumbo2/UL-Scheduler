"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DayEntry = { date: string; entreINC: number; incubator: number };

export default function DailyChart({ data }: { data: DayEntry[] }) {
  // Show abbreviated date labels: "Apr 6"
  const formatted = data.map((d) => {
    const [, month, day] = d.date.split("-");
    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];
    return {
      ...d,
      label: `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`,
    };
  });

  // Show every 5th label to avoid crowding
  const tickFormatter = (_: string, index: number) =>
    index % 5 === 0 ? formatted[index]?.label ?? "" : "";

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} barSize={8}>
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
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: "#f1f5f9" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
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
          fill="#d97706"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
