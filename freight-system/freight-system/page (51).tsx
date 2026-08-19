"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Plus, X } from "lucide-react";
import { PageHeader, Card, Button, Field, Input, Select, Table, Thead, Th, Tr, Td, Badge, EmptyState, LoadingState } from "@/components/ui";

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
      <PageHeader
        icon={<Receipt size={20} />}
        title="應收帳款"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "取消" : "新增應收帳款"}
          </Button>
        }
      />

      <Card className="p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-slate-500">未收款總額</span>
        <span className="text-xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</span>
      </Card>

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="關聯運費單（選填）" className="sm:col-span-3">
              <Select value={form.freightOrderId} onChange={(e) => handleOrderChange(e.target.value)}>
                <option value="">不關聯</option>
                {orders.map((o) => <option key={o.id} value={o.id}>{o.orderDate} - {o.customerName || "未指定客戶"} - {formatCurrency(o.freightAmount)}</option>)}
              </Select>
            </Field>
            <Field label="客戶">
              <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">未指定</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="金額" required>
              <Input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="付款方式">
              <Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="匯款">匯款</option>
                <option value="支票">支票</option>
                <option value="現金">現金</option>
                <option value="其他">其他</option>
              </Select>
            </Field>
            <Field label="預計收款日">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPaid" checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })} />
              <label htmlFor="isPaid" className="text-sm text-slate-600">已付款</label>
            </div>
            <Field label="備註" className="sm:col-span-3">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
            <div className="sm:col-span-3">
              <Button type="submit">儲存</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex gap-2 mb-3">
        {(["unpaid", "paid", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {f === "unpaid" ? "未收款" : f === "paid" ? "已收款" : "全部"}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Receipt size={32} />} message="無資料" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>客戶</Th>
                <Th>金額</Th>
                <Th>付款方式</Th>
                <Th>預計收款日</Th>
                <Th>狀態</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((a) => (
                <Tr key={a.id}>
                  <Td>{a.customerName || "-"}</Td>
                  <Td>{formatCurrency(a.amount)}</Td>
                  <Td>{a.paymentMethod}</Td>
                  <Td>{a.dueDate || "-"}</Td>
                  <Td>
                    <button onClick={() => handleTogglePaid(a)}>
                      <Badge tone={a.isPaid ? "emerald" : "amber"}>{a.isPaid ? "已收款" : "未收款"}</Badge>
                    </button>
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline text-xs">刪除</button>
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
