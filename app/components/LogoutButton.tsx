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
      className="text-sm font-medium text-white/80 hover:text-white border border-white/30 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors"
    >
      Log out
    </button>
  );
}
