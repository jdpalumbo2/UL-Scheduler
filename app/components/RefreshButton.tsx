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
      className="text-xs font-medium text-navy border border-navy rounded-lg px-3 py-1.5 hover:bg-navy hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
    >
      {loading && (
        <svg
          className="animate-spin h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
          />
        </svg>
      )}
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  );
}
