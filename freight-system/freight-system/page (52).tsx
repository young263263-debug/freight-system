"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, Card, Button, Field, Input, Select, Textarea, Table, Thead, Th, Tr, Td } from "@/components/ui";

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

  if (!driver) return <p className="text-slate-400 text-sm">載入中...</p>;

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.push("/drivers")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={14} /> 返回司機列表
      </button>
      <PageHeader icon={<Users2 size={20} />} title={`司機資料：${driver.name}`} />

      <Card className="p-5 mb-8">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="姓名" required>
            <Input required value={driver.name} onChange={(e) => setDriver({ ...driver, name: e.target.value })} />
          </Field>
          <Field label="電話">
            <Input value={driver.phone ?? ""} onChange={(e) => setDriver({ ...driver, phone: e.target.value })} />
          </Field>
          <Field label="身分證字號">
            <Input value={driver.idNumber ?? ""} onChange={(e) => setDriver({ ...driver, idNumber: e.target.value })} />
          </Field>
          <Field label="底薪">
            <Input type="number" step="0.01" value={driver.baseSalary} onChange={(e) => setDriver({ ...driver, baseSalary: e.target.value })} />
          </Field>
          <Field label="抽成比例 (0~1)">
            <Input type="number" step="0.0001" value={driver.commissionRate} onChange={(e) => setDriver({ ...driver, commissionRate: e.target.value })} />
          </Field>
          <Field label="支出費用預設由誰負擔">
            <Select value={driver.defaultCostBearer} onChange={(e) => setDriver({ ...driver, defaultCostBearer: e.target.value as "driver" | "company" })}>
              <option value="driver">司機身上</option>
              <option value="company">公司成本</option>
            </Select>
          </Field>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={driver.active} onChange={(e) => setDriver({ ...driver, active: e.target.checked })} id="active" />
            <label htmlFor="active" className="text-sm text-slate-600">在職中</label>
          </div>
          <Field label="備註" className="sm:col-span-2">
            <Textarea value={driver.notes ?? ""} onChange={(e) => setDriver({ ...driver, notes: e.target.value })} rows={2} />
          </Field>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "儲存中..." : "儲存變更"}</Button>
          </div>
        </form>
      </Card>

      <h2 className="font-semibold text-slate-800 text-sm mb-3">每月固定扣款（例如：勞保、健保）</h2>
      <Card className="mb-4">
        {deductions.length === 0 ? (
          <p className="px-4 py-4 text-center text-slate-400 text-sm">尚無固定扣款項目</p>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>項目</Th>
                <Th>金額</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {deductions.map((d) => (
                <Tr key={d.id}>
                  <Td>{d.name}</Td>
                  <Td>{formatCurrency(d.amount)}</Td>
                  <Td className="text-right">
                    <button onClick={() => handleDeleteDeduction(d.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <form onSubmit={handleAddDeduction} className="flex gap-2 items-end flex-wrap">
        <Field label="項目名稱">
          <Input value={newDeduction.name} onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })} placeholder="例如：勞健保" />
        </Field>
        <Field label="金額">
          <Input type="number" step="0.01" value={newDeduction.amount} onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })} className="w-32" />
        </Field>
        <Button type="submit" variant="secondary">新增</Button>
      </form>
    </div>
  );
}
