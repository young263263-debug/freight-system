"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Customer = { id: number; name: string };
type Order = { id: number; orderDate: string; customerId: number | null; customerName: string | null; freightAmount: string };
type AR = {
  id: number;
  freightOrderId: number | null;
  customerId: number | null;
  customerName: string | null;
  orderDate: string | null;
  amount: string;
  paymentMethod: string;
  isPaid: boolean;
  paidDate: string | null;
  dueDate: string | null;
  notes: string | null;
};

const emptyForm = {
  freightOrderId: "",
  customerId: "",
  amount: "0",
  paymentMethod: "匯款",
  isPaid: false,
  dueDate: "",
  notes: "",
};

export default function ReceivablesPage() {
  const [ars, setArs] = useState<AR[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("unpaid");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/receivables").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/freight-orders").then((r) => r.json()),
    ]).then(([a, c, o]) => {
      setArs(a);
      setCustomers(c);
      setOrders(o);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function handleOrderChange(orderId: string) {
    const order = orders.find((o) => String(o.id) === orderId);
    setForm({
      ...form,
      freightOrderId: orderId,
      customerId: order?.customerId ? String(order.customerId) : form.customerId,
      amount: order ? order.freightAmount : form.amount,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/receivables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function handleTogglePaid(ar: AR) {
    await fetch(`/api/receivables/${ar.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: ar.amount,
        paymentMethod: ar.paymentMethod,
        isPaid: !ar.isPaid,
        paidDate: !ar.isPaid ? new Date().toISOString().slice(0, 10) : null,
        dueDate: ar.dueDate,
        notes: ar.notes,
      }),
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此筆應收帳款嗎？")) return;
    await fetch(`/api/receivables/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = ars.filter((a) => (filter === "all" ? true : filter === "paid" ? a.isPaid : !a.isPaid));
  const totalUnpaid = ars.filter((a) => !a.isPaid).reduce((s, a) => s + parseFloat(a.amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">應收帳款</h1>
        <button onClick={() => setShowForm((s) => !s)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          {showForm ? "取消" : "+ 新增應收帳款"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-slate-500">未收款總額</span>
        <span className="text-xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</span>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">關聯運費單（選填）</label>
            <select value={form.freightOrderId} onChange={(e) => handleOrderChange(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">不關聯</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.orderDate} - {o.customerName || "未指定客戶"} - {formatCurrency(o.freightAmount)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">客戶</label>
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">未指定</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">金額 *</label>
            <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">付款方式</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="匯款">匯款</option>
              <option value="支票">支票</option>
              <option value="現金">現金</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">預計收款日</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPaid" checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })} />
            <label htmlFor="isPaid" className="text-sm text-slate-600">已付款</label>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm text-slate-600 mb-1">備註</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">儲存</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-3">
        {(["unpaid", "paid", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded text-xs ${filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
            {f === "unpaid" ? "未收款" : f === "paid" ? "已收款" : "全部"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5">客戶</th>
              <th className="px-4 py-2.5">金額</th>
              <th className="px-4 py-2.5">付款方式</th>
              <th className="px-4 py-2.5">預計收款日</th>
              <th className="px-4 py-2.5">狀態</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">載入中...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">無資料</td></tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">{a.customerName || "-"}</td>
                <td className="px-4 py-2.5">{formatCurrency(a.amount)}</td>
                <td className="px-4 py-2.5">{a.paymentMethod}</td>
                <td className="px-4 py-2.5">{a.dueDate || "-"}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => handleTogglePaid(a)} className={`px-2 py-1 rounded text-xs ${a.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {a.isPaid ? "已收款" : "未收款"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
