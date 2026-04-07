"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleRefresh() {
    setLoading(true);
    router.refresh();
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="text-xs font-medium text-[#1e3a5f] border border-[#1e3a5f] rounded-lg px-3 py-1.5 hover:bg-[#1e3a5f] hover:text-white transition-colors disabled:opacity-50"
    >
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  );
}
