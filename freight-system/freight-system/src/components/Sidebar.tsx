"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "儀表板", icon: "📊" },
  { href: "/freight-orders", label: "運費單", icon: "🚚" },
  { href: "/payroll", label: "薪資結算", icon: "💰" },
  { href: "/receivables", label: "應收帳款", icon: "🧾" },
  { href: "/expenses", label: "費用管理", icon: "📉" },
  { href: "/profit-loss", label: "損益表", icon: "📈" },
  { href: "/drivers", label: "司機管理", icon: "🧑‍✈️" },
  { href: "/customers", label: "客戶管理", icon: "🏢" },
  { href: "/users", label: "帳號管理", icon: "👤" },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-slate-800">
        <h1 className="font-bold text-lg text-white">運費系統</h1>
        <p className="text-xs text-slate-400 mt-1">{userName}</p>
      </div>
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm transition ${
                active
                  ? "bg-slate-800 text-white border-r-2 border-blue-500"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded px-3 py-2 transition text-left"
        >
          登出
        </button>
      </div>
    </aside>
  );
}
