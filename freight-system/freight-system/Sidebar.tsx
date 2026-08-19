"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Truck,
  Wallet,
  Receipt,
  TrendingDown,
  LineChart,
  Users2,
  Building2,
  UserCog,
  Car,
  FileCheck2,
  IdCard,
  FileSpreadsheet,
  Tags,
  KeyRound,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_SECTIONS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    label: "總覽",
    items: [{ href: "/", label: "儀表板", icon: LayoutDashboard }],
  },
  {
    label: "營運",
    items: [
      { href: "/freight-orders", label: "運費單", icon: Truck },
      { href: "/payroll", label: "薪資結算", icon: Wallet },
      { href: "/receivables", label: "應收帳款", icon: Receipt },
      { href: "/checks", label: "支票登記簿", icon: FileCheck2 },
      { href: "/expenses", label: "費用管理", icon: TrendingDown },
      { href: "/profit-loss", label: "損益表", icon: LineChart },
    ],
  },
  {
    label: "資料管理",
    items: [
      { href: "/drivers", label: "司機管理", icon: Users2 },
      { href: "/vehicles", label: "車輛管理", icon: Car },
      { href: "/employees", label: "員工管理", icon: IdCard },
      { href: "/customers", label: "客戶管理", icon: Building2 },
      { href: "/price-list", label: "單價表", icon: Tags },
      { href: "/invoices", label: "發票登記", icon: FileSpreadsheet },
    ],
  },
  {
    label: "系統",
    items: [
      { href: "/users", label: "帳號管理", icon: UserCog },
      { href: "/account", label: "變更密碼", icon: KeyRound },
    ],
  },
];

export function Sidebar({ userName, roleLabel }: { userName: string; roleLabel: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const content = (
    <div className="w-64 shrink-0 bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg text-white tracking-tight">運費系統</h1>
          <p className="text-xs text-slate-400 mt-1">
            {userName} · {roleLabel}
          </p>
        </div>
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            <p className="px-5 pt-3 pb-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm transition ${
                    active
                      ? "bg-indigo-600/90 text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
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

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-slate-900 text-white px-4 py-3">
        <span className="font-bold">運費系統</span>
        <button onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
      </div>
      {/* Desktop sidebar */}
      <div className="hidden md:block">{content}</div>
      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0">{content}</div>
        </div>
      )}
    </>
  );
}
