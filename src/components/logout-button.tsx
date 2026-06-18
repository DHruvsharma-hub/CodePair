"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl transition text-slate-400 hover:text-rose-400"
      title="Sign Out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
