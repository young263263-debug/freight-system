"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Users2, Plus, X } from "lucide-react";
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

type Driver = {
  id: number;
  name: string;
  phone: string | null;
  baseSalary: string;
  commissionRate: string;
  defaultCostBearer: "driver" | "company";
  active: boolean;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    baseSalary: "0",
    commissionRate: "0",
    defaultCostBearer: "driver",
  });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/drivers")
      .then((r) => r.json())
      .then(setDrivers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setForm({ name: "", phone: "", baseSalary: "0", commissionRate: "0", defaultCostBearer: "driver" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此司機嗎？")) return;
    await fetch(`/api/drivers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        icon={<Users2 size={20} />}
        title="司機管理"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "取消" : "新增司機"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="姓名" required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="電話">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="底薪">
              <Input type="number" step="0.01" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
            </Field>
            <Field label="抽成比例 (0~1，例如 0.15 代表 15%)">
              <Input type="number" step="0.0001" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
            </Field>
            <Field label="支出費用預設由誰負擔" className="sm:col-span-2">
              <Select value={form.defaultCostBearer} onChange={(e) => setForm({ ...form, defaultCostBearer: e.target.value })}>
                <option value="driver">司機身上</option>
                <option value="company">公司成本</option>
              </Select>
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
        ) : drivers.length === 0 ? (
          <EmptyState icon={<Users2 size={32} />} message="尚無司機資料" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>姓名</Th>
                <Th>電話</Th>
                <Th>底薪</Th>
                <Th>抽成比例</Th>
                <Th>支出負擔</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {drivers.map((d) => (
                <Tr key={d.id}>
                  <Td>
                    <Link href={`/drivers/${d.id}`} className="font-medium text-indigo-600 hover:underline">{d.name}</Link>
                  </Td>
                  <Td>{d.phone || "-"}</Td>
                  <Td>{formatCurrency(d.baseSalary)}</Td>
                  <Td>{(parseFloat(d.commissionRate) * 100).toFixed(2)}%</Td>
                  <Td>
                    <Badge tone={d.defaultCostBearer === "driver" ? "slate" : "indigo"}>
                      {d.defaultCostBearer === "driver" ? "司機身上" : "公司成本"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:underline text-xs">刪除</button>
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
