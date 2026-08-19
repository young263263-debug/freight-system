"use client";

import { useEffect, useState } from "react";

type Customer = { id: number; name: string; contact: string | null; phone: string | null; notes: string | null };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", notes: "" });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/customers").then((r) => r.json()).then(setCustomers).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setForm({ name: "", contact: "", phone: "", notes: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此客戶嗎？")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">客戶管理</h1>
        <button onClick={() => setShowForm((s) => !s)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          {showForm ? "取消" : "+ 新增客戶"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">客戶名稱 *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">聯絡人</label>
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">電話</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">備註</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">儲存</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5">客戶名稱</th>
              <th className="px-4 py-2.5">聯絡人</th>
              <th className="px-4 py-2.5">電話</th>
              <th className="px-4 py-2.5">備註</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">載入中...</td></tr>}
            {!loading && customers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">尚無客戶資料</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">{c.name}</td>
                <td className="px-4 py-2.5">{c.contact || "-"}</td>
                <td className="px-4 py-2.5">{c.phone || "-"}</td>
                <td className="px-4 py-2.5">{c.notes || "-"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
