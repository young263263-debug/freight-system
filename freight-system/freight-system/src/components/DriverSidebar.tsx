"use client";

import { useRouter } from "next/navigation";
import { Wallet, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DriverSidebar({ userName }: { userName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const items = [
    { href: "/my-payroll", label: "我的薪資", icon: Wallet },
    { href: "/account", label: "變更密碼", icon: KeyRound },
  ];

  return (
    <div className="w-56 shrink-0 bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <h1 className="font-bold text-lg text-white tracking-tight">運費系統</h1>
        <p className="text-xs text-slate-400 mt-1">{userName} · 司機</p>
      </div>
      <nav className="flex-1 py-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm transition ${
                active ? "bg-indigo-600/90 text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg px-3 py-2.5 transition text-left"
        >
          <LogOut size={16} />
          登出
        </button>
      </div>
    </div>
  );
}
