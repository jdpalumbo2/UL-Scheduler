"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-slate-600 hover:text-[#1e3a5f] border border-slate-200 hover:border-[#1e3a5f] rounded-lg px-3 py-1.5 transition-colors"
    >
      Log out
    </button>
  );
}
