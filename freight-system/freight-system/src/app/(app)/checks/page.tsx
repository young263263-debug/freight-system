"use client";

import { useEffect, useState } from "react";
import { FileCheck2, Plus, X } from "lucide-react";
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
  Badge,
  EmptyState,
  LoadingState,
} from "@/components/ui";

type Check = {
  id: number;
  checkNumber: string;
  bankName: string | null;
  direction: "receivable" | "payable";
  counterparty: string | null;
  amount: string;
  issueDate: string | null;
  dueDate: string;
  isCashed: boolean;
  cashedDate: string | null;
  notes: string | null;
};

const emptyForm = {
  checkNumber: "",
  bankName: "",
  direction: "receivable",
  counterparty: "",
  amount: "0",
  issueDate: "",
  dueDate: "",
  isCashed: false,
  notes: "",
};

export default function ChecksPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<"all" | "uncashed" | "cashed">("uncashed");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/checks").then((r) => r.json()).then(setChecks).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/checks", {
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

  async function handleToggleCashed(c: Check) {
    await fetch(`/api/checks/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...c,
        isCashed: !c.isCashed,
        cashedDate: !c.isCashed ? new Date().toISOString().slice(0, 10) : null,
      }),
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此張支票紀錄嗎？")) return;
    await fetch(`/api/checks/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = checks.filter((c) =>
    filter === "all" ? true : filter === "cashed" ? c.isCashed : !c.isCashed
  );

  return (
    <div>
      <PageHeader
        icon={<FileCheck2 size={20} />}
        title="支票登記簿"
        subtitle="收到與開出的支票，追蹤兌現狀態"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "取消" : "新增支票"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="支票號碼" required>
              <Input required value={form.checkNumber} onChange={(e) => setForm({ ...form, checkNumber: e.target.value })} />
            </Field>
            <Field label="銀行">
              <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            </Field>
            <Field label="類型">
              <Select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option value="receivable">收到的支票（客戶付款）</option>
                <option value="payable">開出的支票（付款用）</option>
              </Select>
            </Field>
            <Field label="對方">
              <Input value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} />
            </Field>
            <Field label="金額" required>
              <Input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="開票日">
              <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </Field>
            <Field label="到期日" required>
              <Input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
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

      <div className="flex gap-2 mb-3">
        {(["uncashed", "cashed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "uncashed" ? "未兌現" : f === "cashed" ? "已兌現" : "全部"}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FileCheck2 size={32} />} message="無資料" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>支票號碼</Th>
                <Th>類型</Th>
                <Th>對方</Th>
                <Th>金額</Th>
                <Th>到期日</Th>
                <Th>狀態</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium text-slate-900">{c.checkNumber}</Td>
                  <Td>
                    <Badge tone={c.direction === "receivable" ? "indigo" : "slate"}>
                      {c.direction === "receivable" ? "收款" : "付款"}
                    </Badge>
                  </Td>
                  <Td>{c.counterparty || "-"}</Td>
                  <Td>{formatCurrency(c.amount)}</Td>
                  <Td>{c.dueDate}</Td>
                  <Td>
                    <button onClick={() => handleToggleCashed(c)}>
                      <Badge tone={c.isCashed ? "emerald" : "amber"}>{c.isCashed ? "已兌現" : "未兌現"}</Badge>
                    </button>
                  </Td>
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
