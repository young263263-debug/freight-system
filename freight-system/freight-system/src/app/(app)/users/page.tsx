"use client";

import { useEffect, useState } from "react";

type User = { id: number; name: string; email: string; role: "admin" | "accountant" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/users").then((r) => r.json()).then(setUsers).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "admin" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此帳號嗎？")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "刪除失敗");
      return;
    }
    load();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">帳號管理</h1>
        <button onClick={() => setShowForm((s) => !s)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          {showForm ? "取消" : "+ 新增帳號"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">姓名 *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">密碼 *</label>
            <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">角色</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="admin">管理者（老闆／全權限）</option>
              <option value="accountant">會計</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">建立帳號</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2.5">姓名</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">角色</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">載入中...</td></tr>}
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">{u.name}</td>
                <td className="px-4 py-2.5">{u.email}</td>
                <td className="px-4 py-2.5">{u.role === "admin" ? "管理者" : "會計"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">目前所有登入帳號皆為完整權限（老闆／會計共用），僅記錄身分供追蹤操作紀錄用。</p>
    </div>
  );
}
