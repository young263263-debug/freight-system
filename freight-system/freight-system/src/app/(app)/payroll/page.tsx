"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatNumber, currentYearMonth } from "@/lib/utils";

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

export default function PayrollPage() {
  const [month, setMonth] = useState(currentYearMonth());
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/payroll?month=${month}`)
      .then((r) => r.json())
      .then((d) => setLines(d.lines))
      .finally(() => setLoading(false));
  }, [month]);

  const totalNetPay = lines.reduce((s, l) => s + l.netPay, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">薪資結算</h1>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded border border-slate-300 px-3 py-1.5 text-sm" />
      </div>

      {loading ? (
        <p className="text-slate-400">計算中...</p>
      ) : lines.length === 0 ? (
        <p className="text-slate-400">此月份無資料</p>
      ) : (
        <div className="space-y-4">
          {lines.map((l) => (
            <div key={l.driver.id} className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">{l.driver.name}</h3>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(l.netPay)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-slate-600 mb-3">
                <div>
                  <p className="text-xs text-slate-400">運費總額</p>
                  <p>{formatCurrency(l.totalFreight)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">抽成金額</p>
                  <p>{formatCurrency(l.commissionAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">底薪</p>
                  <p>{formatCurrency(l.baseSalary)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">計薪方式</p>
                  <p className="font-medium">{l.usedBaseSalary ? "採底薪" : "採抽成"}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 text-sm space-y-1">
                <Row label="計薪基礎（抽成 vs 底薪取較高者）" value={l.grossPay} />
                <Row label="扣發票稅" value={-l.totalInvoiceTax} />
                <Row label="扣利息" value={-l.totalInterest} />
                <Row label="車主支出費用（司機負擔部分）" value={-l.totalOtherDeductionDriverBorne} />
                {l.recurringDeductions.map((d, i) => (
                  <Row key={i} label={`固定扣款：${d.name}`} value={-d.amount} />
                ))}
                <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold text-slate-800">
                  <span>實發薪資</span>
                  <span>{formatCurrency(l.netPay)}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-slate-800 text-white rounded-lg p-5 flex justify-between items-center">
            <span className="font-medium">當期薪資合計</span>
            <span className="text-xl font-bold">{formatCurrency(totalNetPay)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className={value < 0 ? "text-red-500" : ""}>{value < 0 ? "-" : ""}{formatNumber(Math.abs(value))}</span>
    </div>
  );
}
