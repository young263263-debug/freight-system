"use client";

import { useEffect, useState } from "react";
import { IdCard, Plus, X, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  Table,
  Thead,
  Th,
  Tr,
  Td,
  Badge,
  EmptyState,
  LoadingState,
} from "@/components/ui";

type Employee = {
  id: number;
  name: string;
  idNumber: string | null;
  phone: string | null;
  address: string | null;
  position: string | null;
  hireDate: string | null;
  monthlySalary: string;
  laborInsuranceAmount: string;
  healthInsuranceAmount: string;
  healthInsuranceDependents: number;
  active: boolean;
  notes: string | null;
};

const emptyForm = {
  name: "",
  idNumber: "",
  phone: "",
  address: "",
  position: "",
  hireDate: "",
  monthlySalary: "0",
  laborInsuranceAmount: "0",
  healthInsuranceAmount: "0",
  healthInsuranceDependents: "0",
  notes: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/employees").then((r) => r.json()).then(setEmployees).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/employees", {
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
    if (!confirm("確定要刪除此員工資料嗎？")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        icon={<IdCard size={20} />}
        title="員工管理系統"
        subtitle="個人資料、薪資與勞健保資訊"
        action={
          <div className="flex gap-2">
            <a href="/api/employees/export">
              <Button variant="secondary">
                <Download size={15} /> 匯出 Excel
              </Button>
            </a>
            <Button onClick={() => setShowForm((s) => !s)}>
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "取消" : "新增員工"}
            </Button>
          </div>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="姓名" required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="身分證字號">
              <Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
            </Field>
            <Field label="電話">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="職稱">
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </Field>
            <Field label="到職日">
              <Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
            </Field>
            <Field label="月薪">
              <Input type="number" step="0.01" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
            </Field>
            <Field label="勞保金額">
              <Input type="number" step="0.01" value={form.laborInsuranceAmount} onChange={(e) => setForm({ ...form, laborInsuranceAmount: e.target.value })} />
            </Field>
            <Field label="健保金額">
              <Input type="number" step="0.01" value={form.healthInsuranceAmount} onChange={(e) => setForm({ ...form, healthInsuranceAmount: e.target.value })} />
            </Field>
            <Field label="健保眷屬人數">
              <Input type="number" value={form.healthInsuranceDependents} onChange={(e) => setForm({ ...form, healthInsuranceDependents: e.target.value })} />
            </Field>
            <Field label="地址" className="sm:col-span-3">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
        ) : employees.length === 0 ? (
          <EmptyState icon={<IdCard size={32} />} message="尚無員工資料" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>姓名</Th>
                <Th>職稱</Th>
                <Th>電話</Th>
                <Th>月薪</Th>
                <Th>勞保</Th>
                <Th>健保</Th>
                <Th>狀態</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {employees.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium text-slate-900">{e.name}</Td>
                  <Td>{e.position || "-"}</Td>
                  <Td>{e.phone || "-"}</Td>
                  <Td>{formatCurrency(e.monthlySalary)}</Td>
                  <Td>{formatCurrency(e.laborInsuranceAmount)}</Td>
                  <Td>{formatCurrency(e.healthInsuranceAmount)}</Td>
                  <Td>
                    <Badge tone={e.active ? "emerald" : "slate"}>{e.active ? "在職" : "離職"}</Badge>
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline text-xs">刪除</button>
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
