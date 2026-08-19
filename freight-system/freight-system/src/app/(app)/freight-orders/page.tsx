"use client";

import { useEffect, useState } from "react";
import { formatCurrency, currentYearMonth } from "@/lib/utils";

type Driver = { id: number; name: string; defaultCostBearer: "driver" | "company" };
type Customer = { id: number; name: string };
type Order = {
  id: number;
  orderDate: string;
  driverId: number;
  customerId: number | null;
  driverName: string | null;
  customerName: string | null;
  itemDescription: string | null;
  freightAmount: string;
  invoiceTaxDeduction: string;
  interestDeduction: string;
  otherDeduction: string;
  costBearer: "driver" | "company";
};

const emptyForm = {
  orderDate: new Date().toISOString().slice(0, 10),
  driverId: "",
  customerId: "",
  itemDescription: "",
  freightAmount: "0",
  invoiceTaxDeduction: "0",
  interestDeduction: "0",
  otherDeduction: "0",
  costBearer: "driver",
};

export default function FreightOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [monthFilter, setMonthFilter] = useState(currentYearMonth());

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/freight-orders").then((r) => r.json()),
      fetch("/api/drivers").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]).then(([o, d, c]) => {
      setOrders(o);
      setDrivers(d);
      setCustomers(c);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function handleDriverChange(driverId: string) {
    const driver = drivers.find((d) => String(d.id) === driverId);
    setForm({ ...form, driverId, costBearer: driver?.defaultCostBearer ?? "driver" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.driverId) {
      setError("請選擇司機");
      return;
    }
    const res = await fetch("/api/freight-orders", {
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

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此筆運費單嗎？")) return;
    await fetch(`/api/freight-orders/${id}`, { method: "DELETE" });
    load();
  }

  const filteredOrders = orders.filter((o) => o.orderDate.slice(0, 7) === monthFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">運費單</h1>
        <button onClick={() => setShowForm((s) => !s)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          {showForm ? "取消" : "+ 新增運費單"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">日期 *</label>
            <input required type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">司機 *</label>
            <select required value={form.driverId} onChange={(e) => handleDriverChange(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">請選擇</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">客戶</label>
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">未指定</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm text-slate-600 mb-1">貨物內容 / 備註</label>
            <input value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">運費金額</label>
            <input type="number" step="0.01" value={form.freightAmount} onChange={(e) => setForm({ ...form, freightAmount: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">扣發票稅</label>
            <input type="number" step="0.01" value={form.invoiceTaxDeduction} onChange={(e) => setForm({ ...form, invoiceTaxDeduction: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">扣利息</label>
            <input type="number" step="0.01" value={form.interestDeduction} onChange={(e) => setForm({ ...form, interestDeduction: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">車主支出費用</label>
            <input type="number" step="0.01" value={form.otherDeduction} onChange={(e) => setForm({ ...form, otherDeduction: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">此費用由誰負擔</label>
            <select value={form.costBearer} onChange={(e) => setForm({ ...form, costBearer: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="driver">司機身上（從薪資扣除）</option>
              <option value="company">公司成本（不影響薪資）</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">儲存</button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm text-slate-600">篩選月份：</label>
        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="rounded border border-slate-300 px-3 py-1.5 text-sm" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5">日期</th>
              <th className="px-4 py-2.5">司機</th>
              <th className="px-4 py-2.5">客戶</th>
              <th className="px-4 py-2.5">運費</th>
              <th className="px-4 py-2.5">扣發票稅</th>
              <th className="px-4 py-2.5">扣利息</th>
              <th className="px-4 py-2.5">車主支出</th>
              <th className="px-4 py-2.5">負擔方</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">載入中...</td></tr>}
            {!loading && filteredOrders.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">此月份尚無運費單</td></tr>
            )}
            {filteredOrders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 whitespace-nowrap">{o.orderDate}</td>
                <td className="px-4 py-2.5">{o.driverName}</td>
                <td className="px-4 py-2.5">{o.customerName || "-"}</td>
                <td className="px-4 py-2.5">{formatCurrency(o.freightAmount)}</td>
                <td className="px-4 py-2.5">{formatCurrency(o.invoiceTaxDeduction)}</td>
                <td className="px-4 py-2.5">{formatCurrency(o.interestDeduction)}</td>
                <td className="px-4 py-2.5">{formatCurrency(o.otherDeduction)}</td>
                <td className="px-4 py-2.5">{o.costBearer === "driver" ? "司機" : "公司"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDelete(o.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
          {filteredOrders.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold bg-slate-50">
                <td className="px-4 py-2.5" colSpan={3}>合計</td>
                <td className="px-4 py-2.5">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.freightAmount), 0))}</td>
                <td className="px-4 py-2.5">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.invoiceTaxDeduction), 0))}</td>
                <td className="px-4 py-2.5">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.interestDeduction), 0))}</td>
                <td className="px-4 py-2.5">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.otherDeduction), 0))}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
