"use client";

import { useEffect, useState } from "react";
import { formatCurrency, currentYearMonth } from "@/lib/utils";

type Report = {
  yearMonth: string;
  freightRevenue: number;
  otherIncomeTotal: number;
  totalRevenue: number;
  driverPayrollCost: number;
  companyBorneOrderCosts: number;
  costLines: { categoryName: string; amount: number }[];
  totalCost: number;
  expenseLines: { categoryName: string; amount: number }[];
  totalExpense: number;
  netProfit: number;
};

type Income = { id: number; incomeDate: string; amount: string; description: string | null };

export default function ProfitLossPage() {
  const [month, setMonth] = useState(currentYearMonth());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ incomeDate: new Date().toISOString().slice(0, 10), amount: "0", description: "" });

  function loadIncomes() {
    fetch("/api/other-income").then((r) => r.json()).then(setIncomes);
  }

  function loadReport() {
    setLoading(true);
    fetch(`/api/profit-loss?month=${month}`)
      .then((r) => r.json())
      .then(setReport)
      .finally(() => setLoading(false));
  }

  useEffect(loadReport, [month]);
  useEffect(loadIncomes, []);

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/other-income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incomeForm),
    });
    setIncomeForm({ incomeDate: new Date().toISOString().slice(0, 10), amount: "0", description: "" });
    setShowIncomeForm(false);
    loadIncomes();
    loadReport();
  }

  async function handleDeleteIncome(id: number) {
    if (!confirm("確定要刪除此筆其他收入嗎？")) return;
    await fetch(`/api/other-income/${id}`, { method: "DELETE" });
    loadIncomes();
    loadReport();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">損益表</h1>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded border border-slate-300 px-3 py-1.5 text-sm" />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-700 text-sm">其他收入紀錄</h2>
          <button onClick={() => setShowIncomeForm((s) => !s)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200">
            {showIncomeForm ? "取消" : "+ 新增其他收入"}
          </button>
        </div>
        {showIncomeForm && (
          <form onSubmit={handleAddIncome} className="bg-white border border-slate-200 rounded-lg p-4 mb-3 flex gap-2 items-end flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1">日期</label>
              <input type="date" value={incomeForm.incomeDate} onChange={(e) => setIncomeForm({ ...incomeForm, incomeDate: e.target.value })} className="rounded border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">金額</label>
              <input type="number" step="0.01" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} className="rounded border border-slate-300 px-3 py-2 text-sm w-32" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">說明</label>
              <input value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} className="rounded border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">新增</button>
          </form>
        )}
        {incomes.filter((i) => i.incomeDate.slice(0, 7) === month).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden text-sm">
            {incomes.filter((i) => i.incomeDate.slice(0, 7) === month).map((i) => (
              <div key={i.id} className="flex justify-between items-center px-4 py-2 border-b border-slate-100 last:border-b-0">
                <span className="text-slate-600">{i.incomeDate} {i.description || ""}</span>
                <div className="flex items-center gap-3">
                  <span>{formatCurrency(i.amount)}</span>
                  <button onClick={() => handleDeleteIncome(i.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading || !report ? (
        <p className="text-slate-400">計算中...</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5 text-sm">
          <Section title="營業收入">
            <Line label="運費收入" value={report.freightRevenue} />
            <Line label="其他收入" value={report.otherIncomeTotal} />
            <Line label="收入合計" value={report.totalRevenue} bold />
          </Section>

          <Section title="營業成本">
            <Line label="司機薪資成本" value={report.driverPayrollCost} />
            <Line label="車主支出（公司負擔部分）" value={report.companyBorneOrderCosts} />
            {report.costLines.map((l, i) => (
              <Line key={i} label={l.categoryName} value={l.amount} />
            ))}
            <Line label="成本合計" value={report.totalCost} bold />
          </Section>

          <Section title="管銷費用">
            {report.expenseLines.length === 0 && <p className="text-slate-400 text-xs">本月無費用紀錄</p>}
            {report.expenseLines.map((l, i) => (
              <Line key={i} label={l.categoryName} value={l.amount} />
            ))}
            <Line label="費用合計" value={report.totalExpense} bold />
          </Section>

          <div className={`flex justify-between items-center rounded-lg px-4 py-3 font-bold text-base ${report.netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            <span>本期損益</span>
            <span>{formatCurrency(report.netProfit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-slate-500 font-medium mb-2 text-xs uppercase tracking-wide">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-slate-800 border-t border-slate-100 pt-1.5 mt-1.5" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
