"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, Plus, X } from "lucide-react";
import { PageHeader, Card, Button, Field, Input, Select, Table, Thead, Th, Tr, Td, Badge, EmptyState, LoadingState } from "@/components/ui";

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
      <PageHeader icon={<TrendingDown size={20} />} title="費用管理" />

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-700 text-sm">費用分類</h2>
        <Button variant="secondary" size="sm" onClick={() => setShowCatForm((s) => !s)}>
          {showCatForm ? <X size={13} /> : <Plus size={13} />} 新增分類
        </Button>
      </div>
      {showCatForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={handleAddCategory} className="flex gap-2 items-end flex-wrap">
            <Field label="分類名稱">
              <Input required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            </Field>
            <Field label="類型">
              <Select value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value })}>
                <option value="費用">費用（管銷）</option>
                <option value="成本">成本（營業成本）</option>
              </Select>
            </Field>
            <Button type="submit">新增</Button>
          </form>
        </Card>
      )}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full">
            {c.name} <span className="text-slate-400">({c.type})</span>
            <button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-600">×</button>
          </span>
        ))}
        {categories.length === 0 && <p className="text-sm text-slate-400">尚無分類，請先新增</p>}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-700 text-sm">費用紀錄</h2>
        <Button onClick={() => setShowExpForm((s) => !s)}>
          {showExpForm ? <X size={15} /> : <Plus size={15} />}
          {showExpForm ? "取消" : "新增費用"}
        </Button>
      </div>

      {showExpForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="日期" required>
              <Input required type="date" value={expForm.expenseDate} onChange={(e) => setExpForm({ ...expForm, expenseDate: e.target.value })} />
            </Field>
            <Field label="分類" required>
              <Select required value={expForm.categoryId} onChange={(e) => setExpForm({ ...expForm, categoryId: e.target.value })}>
                <option value="">請選擇</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="金額" required>
              <Input required type="number" step="0.01" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} />
            </Field>
            <Field label="說明" className="sm:col-span-3">
              <Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
            </Field>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isRecurring" checked={expForm.isRecurring} onChange={(e) => setExpForm({ ...expForm, isRecurring: e.target.checked })} />
              <label htmlFor="isRecurring" className="text-sm text-slate-600">設為每月固定費用（自動計入之後每個月）</label>
            </div>
            {expForm.isRecurring && (
              <Field label="每月扣款日">
                <Input type="number" min={1} max={28} value={expForm.recurringDay} onChange={(e) => setExpForm({ ...expForm, recurringDay: e.target.value })} />
              </Field>
            )}
            {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
            <div className="sm:col-span-3">
              <Button type="submit">儲存</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <LoadingState />
        ) : expenses.length === 0 ? (
          <EmptyState icon={<TrendingDown size={32} />} message="尚無費用紀錄" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>日期</Th>
                <Th>分類</Th>
                <Th>金額</Th>
                <Th>說明</Th>
                <Th>固定費用</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {expenses.map((e) => (
                <Tr key={e.id}>
                  <Td className="whitespace-nowrap">{e.expenseDate}</Td>
                  <Td>{categoryName(e.categoryId)}</Td>
                  <Td>{formatCurrency(e.amount)}</Td>
                  <Td>{e.description || "-"}</Td>
                  <Td>{e.isRecurring ? <Badge tone="indigo">每月 {e.recurringDay} 號</Badge> : "-"}</Td>
                  <Td className="text-right">
                    <button onClick={() => handleDeleteExpense(e.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
