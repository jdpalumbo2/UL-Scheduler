type Submitter = { email: string; count: number };

export default function TopSubmitters({ data }: { data: Submitter[] }) {
  return (
    <ol className="divide-y divide-slate-100">
      {data.map((s, i) => (
        <li key={s.email} className="flex justify-between items-center py-2 text-sm">
          <span className="text-slate-400 tabular-nums w-5 shrink-0">{i + 1}.</span>
          <span className="text-slate-700 truncate flex-1 mx-2">{s.email}</span>
          <span className="font-bold text-[#1e3a5f] tabular-nums shrink-0">{s.count}</span>
        </li>
      ))}
    </ol>
  );
}
