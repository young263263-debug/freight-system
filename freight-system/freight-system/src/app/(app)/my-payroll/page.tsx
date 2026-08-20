"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { formatCurrency, formatNumber, currentYearMonth } from "@/lib/utils";
import { PageHeader, Card, Input, LoadingState, EmptyState } from "@/components/ui";

type PayrollLine = {
  driver: { id: number; name: string };
  totalFreight: number;
  totalInvoiceTax: number;
  totalInterest: number;
  totalOtherDeductionDriverBorne: number;
  commissionAmount: number;
  baseSalary: number;
  grossPay: number;
  usedBaseSalary: boolean;
  recurringDeductions: { name: string; amount: number }[];
  totalRecurringDeductions: number;
  netPay: number;
};

export default function MyPayrollPage() {
  const [month, setMonth] = useState(currentYearMonth());
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/my-payroll?month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setLines([]);
        } else {
          setLines(d.lines);
        }
      })
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div className="max-w-lg">
      <PageHeader
        icon={<Wallet size={20} />}
        title="我的薪資"
        action={<Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <Card className="p-6 text-sm text-red-600">{error}</Card>
      ) : lines.length === 0 ? (
        <Card>
          <EmptyState icon={<Wallet size={32} />} message="此月份尚無薪資資料" />
        </Card>
      ) : (
        lines.map((l) => (
          <Card key={l.driver.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{l.driver.name}</h3>
              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(l.netPay)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 mb-4">
              <div>
                <p className="text-xs text-slate-400">運費總額</p>
                <p>{formatCurrency(l.totalFreight)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">計薪方式</p>
                <p className="font-medium">{l.usedBaseSalary ? "採底薪" : "採抽成"}</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 text-sm space-y-1.5">
              <Row label="計薪基礎" value={l.grossPay} />
              <Row label="扣發票稅" value={-l.totalInvoiceTax} />
              <Row label="扣利息" value={-l.totalInterest} />
              <Row label="車主支出費用" value={-l.totalOtherDeductionDriverBorne} />
              {l.recurringDeductions.map((d, i) => (
                <Row key={i} label={`固定扣款：${d.name}`} value={-d.amount} />
              ))}
              <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold text-slate-800">
                <span>實發薪資</span>
                <span>{formatCurrency(l.netPay)}</span>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className={value < 0 ? "text-red-500" : ""}>
        {value < 0 ? "-" : ""}
        {formatNumber(Math.abs(value))}
      </span>
    </div>
  );
}
