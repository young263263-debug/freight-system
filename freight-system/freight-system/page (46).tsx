"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, X } from "lucide-react";
import { PageHeader, Card, Button, Field, Input, Table, Thead, Th, Tr, Td, EmptyState, LoadingState } from "@/components/ui";

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
      <PageHeader
        icon={<Building2 size={20} />}
        title="客戶管理"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "取消" : "新增客戶"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="客戶名稱" required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="聯絡人">
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </Field>
            <Field label="電話">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="備註">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit">儲存</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <LoadingState />
        ) : customers.length === 0 ? (
          <EmptyState icon={<Building2 size={32} />} message="尚無客戶資料" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>客戶名稱</Th>
                <Th>聯絡人</Th>
                <Th>電話</Th>
                <Th>備註</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {customers.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium text-slate-900">{c.name}</Td>
                  <Td>{c.contact || "-"}</Td>
                  <Td>{c.phone || "-"}</Td>
                  <Td>{c.notes || "-"}</Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline text-xs">刪除</button>
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
