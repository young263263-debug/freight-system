"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type Driver = {
  id: number;
  name: string;
  phone: string | null;
  idNumber: string | null;
  baseSalary: string;
  commissionRate: string;
  defaultCostBearer: "driver" | "company";
  active: boolean;
  notes: string | null;
};

type Deduction = { id: number; name: string; amount: string; active: boolean };

export default function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newDeduction, setNewDeduction] = useState({ name: "", amount: "" });

  function load() {
    fetch(`/api/drivers/${id}`).then((r) => r.json()).then(setDriver);
    fetch(`/api/drivers/${id}/deductions`).then((r) => r.json()).then(setDeductions);
  }

  useEffect(load, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!driver) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/drivers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(driver),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "儲存失敗");
      return;
    }
    load();
  }

  async function handleAddDeduction(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeduction.name || !newDeduction.amount) return;
    await fetch(`/api/drivers/${id}/deductions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDeduction),
    });
    setNewDeduction({ name: "", amount: "" });
    load();
  }

  async function handleDeleteDeduction(deductionId: number) {
    await fetch(`/api/drivers/${id}/deductions/${deductionId}`, { method: "DELETE" });
    load();
  }

  if (!driver) return <p className="text-slate-400">載入中...</p>;

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.push("/drivers")} className="text-sm text-slate-500 hover:underline mb-4">
        ← 返回司機列表
      </button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">司機資料：{driver.name}</h1>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm text-slate-600 mb-1">姓名 *</label>
          <input required value={driver.name} onChange={(e) => setDriver({ ...driver, name: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">電話</label>
          <input value={driver.phone ?? ""} onChange={(e) => setDriver({ ...driver, phone: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">身分證字號</label>
          <input value={driver.idNumber ?? ""} onChange={(e) => setDriver({ ...driver, idNumber: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">底薪</label>
          <input type="number" step="0.01" value={driver.baseSalary} onChange={(e) => setDriver({ ...driver, baseSalary: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">抽成比例 (0~1)</label>
          <input type="number" step="0.0001" value={driver.commissionRate} onChange={(e) => setDriver({ ...driver, commissionRate: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">支出費用預設由誰負擔</label>
          <select value={driver.defaultCostBearer} onChange={(e) => setDriver({ ...driver, defaultCostBearer: e.target.value as "driver" | "company" })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="driver">司機身上</option>
            <option value="company">公司成本</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input type="checkbox" checked={driver.active} onChange={(e) => setDriver({ ...driver, active: e.target.checked })} id="active" />
          <label htmlFor="active" className="text-sm text-slate-600">在職中</label>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-slate-600 mb-1">備註</label>
          <textarea value={driver.notes ?? ""} onChange={(e) => setDriver({ ...driver, notes: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" rows={2} />
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-60">
            {saving ? "儲存中..." : "儲存變更"}
          </button>
        </div>
      </form>

      <h2 className="font-semibold text-slate-700 mb-3">每月固定扣款（例如：勞保、健保）</h2>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5">項目</th>
              <th className="px-4 py-2.5">金額</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {deductions.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400">尚無固定扣款項目</td></tr>
            )}
            {deductions.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{d.name}</td>
                <td className="px-4 py-2.5">{formatCurrency(d.amount)}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDeleteDeduction(d.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleAddDeduction} className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">項目名稱</label>
          <input value={newDeduction.name} onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })} placeholder="例如：勞健保" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">金額</label>
          <input type="number" step="0.01" value={newDeduction.amount} onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })} className="rounded border border-slate-300 px-3 py-2 text-sm w-32" />
        </div>
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded text-sm hover:bg-slate-900">新增</button>
      </form>
    </div>
  );
}
