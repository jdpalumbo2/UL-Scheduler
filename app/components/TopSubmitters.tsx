"use client";

import { useState } from "react";

type Submitter = { email: string; count: number };

export default function TopSubmitters({ data }: { data: Submitter[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? data : data.slice(0, 1);

  return (
    <div>
      <ul className="space-y-2">
        {visible.map((s, i) => (
          <li key={s.email} className="flex items-center justify-between text-sm">
            <span className="text-slate-600 truncate flex-1 mr-2">
              <span className="text-slate-400 mr-2">{i + 1}.</span>
              {s.email}
            </span>
            <span className="font-semibold text-slate-800 tabular-nums shrink-0">
              {s.count}
            </span>
          </li>
        ))}
      </ul>
      {data.length > 1 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          {expanded ? "Show less" : `Show all ${data.length}`}
        </button>
      )}
    </div>
  );
}
