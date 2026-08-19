"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type Driver = {
  id: number;
  name: string;
  phone: string | null;
  baseSalary: string;
  commissionRate: string;
  defaultCostBearer: "driver" | "company";
  active: boolean;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    baseSalary: "0",
    commissionRate: "0",
    defaultCostBearer: "driver",
  });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/drivers")
      .then((r) => r.json())
      .then(setDrivers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setForm({ name: "", phone: "", baseSalary: "0", commissionRate: "0", defaultCostBearer: "driver" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此司機嗎？")) return;
    await fetch(`/api/drivers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">司機管理</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          {showForm ? "取消" : "+ 新增司機"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">姓名 *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">電話</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">底薪</label>
            <input type="number" step="0.01" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">抽成比例 (0~1，例如 0.15 代表 15%)</label>
            <input type="number" step="0.0001" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">支出費用預設由誰負擔</label>
            <select value={form.defaultCostBearer} onChange={(e) => setForm({ ...form, defaultCostBearer: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="driver">司機身上</option>
              <option value="company">公司成本</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              儲存
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5">姓名</th>
              <th className="px-4 py-2.5">電話</th>
              <th className="px-4 py-2.5">底薪</th>
              <th className="px-4 py-2.5">抽成比例</th>
              <th className="px-4 py-2.5">支出負擔</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">載入中...</td></tr>
            )}
            {!loading && drivers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">尚無司機資料</td></tr>
            )}
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link href={`/drivers/${d.id}`} className="text-blue-600 hover:underline">{d.name}</Link>
                </td>
                <td className="px-4 py-2.5">{d.phone || "-"}</td>
                <td className="px-4 py-2.5">{formatCurrency(d.baseSalary)}</td>
                <td className="px-4 py-2.5">{(parseFloat(d.commissionRate) * 100).toFixed(2)}%</td>
                <td className="px-4 py-2.5">{d.defaultCostBearer === "driver" ? "司機身上" : "公司成本"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
