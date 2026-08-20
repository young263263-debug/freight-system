"use client";

import { useEffect, useState } from "react";
import { Tags, Plus, X, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  Select,
  Table,
  Thead,
  Th,
  Tr,
  Td,
  EmptyState,
  LoadingState,
} from "@/components/ui";

type Customer = { id: number; name: string };
type PriceItem = {
  id: number;
  customerId: number | null;
  customerName: string | null;
  itemName: string;
  unit: string | null;
  unitPrice: string;
  notes: string | null;
};

const emptyForm = { customerId: "", itemName: "", unit: "", unitPrice: "0", notes: "" };

export default function PriceListPage() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/price-list").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ])
      .then(([i, c]) => {
        setItems(i);
        setCustomers(c);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/price-list", {
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
    if (!confirm("確定要刪除此筆單價嗎？")) return;
    await fetch(`/api/price-list/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        icon={<Tags size={20} />}
        title="單價表"
        subtitle="客戶／路線常態運費單價，可匯出 Excel"
        action={
          <div className="flex gap-2">
            <a href="/api/price-list/export">
              <Button variant="secondary">
                <Download size={15} /> 匯出 Excel
              </Button>
            </a>
            <Button onClick={() => setShowForm((s) => !s)}>
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "取消" : "新增單價"}
            </Button>
          </div>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="客戶">
              <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">不指定</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="路線／品項名稱" required>
              <Input required value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
            </Field>
            <Field label="單位">
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="車、噸、趟..." />
            </Field>
            <Field label="單價">
              <Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
            </Field>
            <Field label="備註" className="sm:col-span-2">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
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
        ) : items.length === 0 ? (
          <EmptyState icon={<Tags size={32} />} message="尚無單價資料" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>客戶</Th>
                <Th>路線／品項</Th>
                <Th>單位</Th>
                <Th>單價</Th>
                <Th>備註</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((i) => (
                <Tr key={i.id}>
                  <Td>{i.customerName || "-"}</Td>
                  <Td className="font-medium text-slate-900">{i.itemName}</Td>
                  <Td>{i.unit || "-"}</Td>
                  <Td>{formatCurrency(i.unitPrice)}</Td>
                  <Td>{i.notes || "-"}</Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(i.id)} className="text-red-500 hover:underline text-xs">刪除</button>
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
