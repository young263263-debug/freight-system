"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, Plus, X, Download } from "lucide-react";
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

type Invoice = {
  id: number;
  invoiceDate: string;
  invoiceNumber: string | null;
  direction: "銷項" | "進項";
  companyEntity: "和陞" | "和聖";
  counterpartyName: string;
  amount: string;
  taxAmount: string;
  notes: string | null;
};

const emptyForm = {
  invoiceDate: new Date().toISOString().slice(0, 10),
  invoiceNumber: "",
  direction: "銷項",
  companyEntity: "和陞",
  counterpartyName: "",
  amount: "0",
  taxAmount: "0",
  notes: "",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [companyTab, setCompanyTab] = useState<"和陞" | "和聖">("和陞");
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/invoices").then((r) => r.json()).then(setInvoices).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setForm({ ...emptyForm, companyEntity: companyTab });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此筆發票嗎？")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = invoices.filter((i) => i.companyEntity === companyTab);

  return (
    <div>
      <PageHeader
        icon={<FileSpreadsheet size={20} />}
        title="發票登記"
        subtitle="開立（銷項）與進項發票，分和陞／和聖兩個開票主體"
        action={
          <div className="flex gap-2">
            <a href={`/api/invoices/export?company=${companyTab}`}>
              <Button variant="secondary">
                <Download size={15} /> 匯出 {companyTab} Excel
              </Button>
            </a>
            <Button
              onClick={() => {
                setForm({ ...emptyForm, companyEntity: companyTab });
                setShowForm((s) => !s);
              }}
            >
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "取消" : "新增發票"}
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-4">
        {(["和陞", "和聖"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCompanyTab(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              companyTab === c ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="日期" required>
              <Input required type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
            </Field>
            <Field label="發票號碼">
              <Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
            </Field>
            <Field label="類別">
              <Select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option value="銷項">銷項（開立給客戶）</option>
                <option value="進項">進項（供應商開給我們）</option>
              </Select>
            </Field>
            <Field label="開票公司">
              <Select value={form.companyEntity} onChange={(e) => setForm({ ...form, companyEntity: e.target.value })}>
                <option value="和陞">和陞</option>
                <option value="和聖">和聖</option>
              </Select>
            </Field>
            <Field label="對方名稱" required className="sm:col-span-2">
              <Input required value={form.counterpartyName} onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} />
            </Field>
            <Field label="未稅金額">
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="稅額">
              <Input type="number" step="0.01" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
            </Field>
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

      <Card>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FileSpreadsheet size={32} />} message={`${companyTab} 目前尚無發票紀錄`} />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>日期</Th>
                <Th>發票號碼</Th>
                <Th>類別</Th>
                <Th>對方</Th>
                <Th>未稅金額</Th>
                <Th>稅額</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((i) => (
                <Tr key={i.id}>
                  <Td>{i.invoiceDate}</Td>
                  <Td>{i.invoiceNumber || "-"}</Td>
                  <Td>
                    <Badge tone={i.direction === "銷項" ? "indigo" : "slate"}>{i.direction}</Badge>
                  </Td>
                  <Td>{i.counterpartyName}</Td>
                  <Td>{formatCurrency(i.amount)}</Td>
                  <Td>{formatCurrency(i.taxAmount)}</Td>
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
