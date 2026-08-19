"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, Card, LinkButton, LoadingState } from "@/components/ui";
import {
  LayoutDashboard,
  Truck,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileCheck2,
  Car,
  Plus,
} from "lucide-react";

type DashboardData = {
  yearMonth: string;
  freightRevenue: number;
  netProfit: number;
  totalReceivable: number;
  unpaidCount: number;
  upcomingChecksCount: number;
  upcomingChecksAmount: number;
  expiringVehiclesCount: number;
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
      <PageHeader
        icon={<LayoutDashboard size={20} />}
        title="儀表板"
        subtitle={data ? `本月：${data.yearMonth}` : undefined}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={<Truck size={18} />}
              title="本月運費收入"
              value={formatCurrency(data?.freightRevenue)}
              href="/freight-orders"
              tone="indigo"
            />
            <StatCard
              icon={(data?.netProfit ?? 0) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              title="本月損益"
              value={formatCurrency(data?.netProfit)}
              positive={(data?.netProfit ?? 0) >= 0}
              href="/profit-loss"
              tone={(data?.netProfit ?? 0) >= 0 ? "emerald" : "red"}
            />
            <StatCard
              icon={<Receipt size={18} />}
              title="待收帳款"
              value={formatCurrency(data?.totalReceivable)}
              sub={`${data?.unpaidCount ?? 0} 筆未收`}
              href="/receivables"
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard
              icon={<FileCheck2 size={18} />}
              title="30 天內到期未兌現支票"
              value={`${data?.upcomingChecksCount ?? 0} 張`}
              sub={formatCurrency(data?.upcomingChecksAmount)}
              href="/checks"
              tone="slate"
            />
            <StatCard
              icon={<Car size={18} />}
              title="30 天內保險／驗車到期車輛"
              value={`${data?.expiringVehiclesCount ?? 0} 輛`}
              href="/vehicles"
              tone="slate"
            />
          </div>

          <Card className="p-6">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">快速入口</h2>
            <div className="flex flex-wrap gap-2.5">
              <LinkButton href="/freight-orders" variant="primary">
                <Plus size={15} /> 新增運費單
              </LinkButton>
              <LinkButton href="/payroll" variant="secondary">
                查看薪資結算
              </LinkButton>
              <LinkButton href="/expenses" variant="secondary">
                管理費用
              </LinkButton>
              <LinkButton href="/invoices" variant="secondary">
                發票登記
              </LinkButton>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  sub,
  positive,
  href,
  tone = "slate",
}: {
  icon?: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
  positive?: boolean;
  href: string;
  tone?: "indigo" | "emerald" | "amber" | "red" | "slate";
}) {
  const toneClasses: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Link href={href} className="block">
      <Card className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div className="flex items-center gap-2 mb-3">
          {icon && <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${toneClasses[tone]}`}>{icon}</div>}
          <p className="text-sm text-slate-500">{title}</p>
        </div>
        <p
          className={`text-2xl font-bold ${
            positive === undefined ? "text-slate-900" : positive ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </Card>
    </Link>
  );
}
