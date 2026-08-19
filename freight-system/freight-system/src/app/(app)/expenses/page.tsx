"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Category = { id: number; name: string; type: "成本" | "費用" };
type Expense = {
  id: number;
  expenseDate: string;
  categoryId: number;
  amount: string;
  description: string | null;
  isRecurring: boolean;
  recurringDay: number | null;
};

export default function ExpensesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", type: "費用" });
  const [expForm, setExpForm] = useState({
    expenseDate: new Date().toISOString().slice(0, 10),
    categoryId: "",
    amount: "0",
    description: "",
    isRecurring: false,
    recurringDay: "1",
  });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/expense-categories").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ]).then(([c, e]) => {
      setCategories(c);
      setExpenses(e);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setCatForm({ name: "", type: "費用" });
    setShowCatForm(false);
    load();
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!expForm.categoryId) {
      setError("請選擇分類");
      return;
    }
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expForm),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setExpForm({ expenseDate: new Date().toISOString().slice(0, 10), categoryId: "", amount: "0", description: "", isRecurring: false, recurringDay: "1" });
    setShowExpForm(false);
    load();
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("確定要刪除此分類嗎？")) return;
    await fetch(`/api/expense-categories/${id}`, { method: "DELETE" });
    load();
  }

  async function handleDeleteExpense(id: number) {
    if (!confirm("確定要刪除此筆費用嗎？")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  }

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? "未分類";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">費用管理</h1>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-700">費用分類</h2>
        <button onClick={() => setShowCatForm((s) => !s)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200">
          {showCatForm ? "取消" : "+ 新增分類"}
        </button>
      </div>
      {showCatForm && (
        <form onSubmit={handleAddCategory} className="bg-white border border-slate-200 rounded-lg p-4 mb-4 flex gap-2 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">分類名稱</label>
            <input required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">類型</label>
            <select value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value })} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="費用">費用（管銷）</option>
              <option value="成本">成本（營業成本）</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">新增</button>
        </form>
      )}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full">
            {c.name} <span className="text-slate-400">({c.type})</span>
            <button onClick={() => handleDeleteCategory(c.id)} className="ml-1 text-red-400 hover:text-red-600">×</button>
          </span>
        ))}
        {categories.length === 0 && <p className="text-sm text-slate-400">尚無分類，請先新增</p>}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-700">費用紀錄</h2>
        <button onClick={() => setShowExpForm((s) => !s)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          {showExpForm ? "取消" : "+ 新增費用"}
        </button>
      </div>

      {showExpForm && (
        <form onSubmit={handleAddExpense} className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">日期 *</label>
            <input required type="date" value={expForm.expenseDate} onChange={(e) => setExpForm({ ...expForm, expenseDate: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">分類 *</label>
            <select required value={expForm.categoryId} onChange={(e) => setExpForm({ ...expForm, categoryId: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">請選擇</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">金額 *</label>
            <input required type="number" step="0.01" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm text-slate-600 mb-1">說明</label>
            <input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isRecurring" checked={expForm.isRecurring} onChange={(e) => setExpForm({ ...expForm, isRecurring: e.target.checked })} />
            <label htmlFor="isRecurring" className="text-sm text-slate-600">設為每月固定費用（自動計入之後每個月）</label>
          </div>
          {expForm.isRecurring && (
            <div>
              <label className="block text-sm text-slate-600 mb-1">每月扣款日</label>
              <input type="number" min={1} max={28} value={expForm.recurringDay} onChange={(e) => setExpForm({ ...expForm, recurringDay: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            </div>
          )}
          {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">儲存</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5">日期</th>
              <th className="px-4 py-2.5">分類</th>
              <th className="px-4 py-2.5">金額</th>
              <th className="px-4 py-2.5">說明</th>
              <th className="px-4 py-2.5">固定費用</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">載入中...</td></tr>}
            {!loading && expenses.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">尚無費用紀錄</td></tr>
            )}
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 whitespace-nowrap">{e.expenseDate}</td>
                <td className="px-4 py-2.5">{categoryName(e.categoryId)}</td>
                <td className="px-4 py-2.5">{formatCurrency(e.amount)}</td>
                <td className="px-4 py-2.5">{e.description || "-"}</td>
                <td className="px-4 py-2.5">{e.isRecurring ? `每月 ${e.recurringDay} 號` : "-"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDeleteExpense(e.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
