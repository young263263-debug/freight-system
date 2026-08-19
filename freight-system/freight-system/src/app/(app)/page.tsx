"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type DashboardData = {
  yearMonth: string;
  freightRevenue: number;
  netProfit: number;
  totalReceivable: number;
  unpaidCount: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">儀表板</h1>
      <p className="text-sm text-slate-500 mb-6">
        {data ? `本月：${data.yearMonth}` : "載入中..."}
      </p>

      {loading ? (
        <p className="text-slate-400">載入中...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard title="本月運費收入" value={formatCurrency(data?.freightRevenue)} href="/freight-orders" />
          <StatCard
            title="本月損益"
            value={formatCurrency(data?.netProfit)}
            positive={(data?.netProfit ?? 0) >= 0}
            href="/profit-loss"
          />
          <StatCard
            title="待收帳款"
            value={formatCurrency(data?.totalReceivable)}
            sub={`${data?.unpaidCount ?? 0} 筆未收`}
            href="/receivables"
          />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold text-slate-700 mb-3">快速入口</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/freight-orders" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            + 新增運費單
          </Link>
          <Link href="/payroll" className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">
            查看薪資結算
          </Link>
          <Link href="/expenses" className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">
            管理費用
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  positive,
  href,
}: {
  title: string;
  value: string;
  sub?: string;
  positive?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition"
    >
      <p className="text-sm text-slate-500 mb-2">{title}</p>
      <p
        className={`text-2xl font-bold ${
          positive === undefined ? "text-slate-800" : positive ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </Link>
  );
}
