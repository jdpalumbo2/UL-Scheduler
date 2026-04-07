"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleRefresh() {
    setLoading(true);
    router.refresh();
    // Reset loading after a short delay since router.refresh() has no callback
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1 disabled:opacity-50"
    >
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  );
}
