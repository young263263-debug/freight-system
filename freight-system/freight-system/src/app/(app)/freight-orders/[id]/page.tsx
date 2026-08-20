"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Layers, ArrowLeft } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader, Card, Button, Field, Input, Table, Thead, Th, Tr, Td, EmptyState } from "@/components/ui";
import { Settings2 } from "lucide-react";

type Order = {
  id: number;
  orderDate: string;
  driverId: number;
  isSteelPlateOrder: boolean;
  freightAmount: string;
};

type SteelPlateItem = {
  id: number;
  lengthCm: string;
  widthCm: string;
  thicknessMm: string;
  weightKg: string;
  unitPricePerKg: string;
  amount: string;
  notes: string | null;
};

type Tier = { id: number; minSizeCm: string; maxSizeCm: string | null; unitPricePerKg: string; notes: string | null };

const emptyForm = { lengthCm: "", widthCm: "", thicknessMm: "", weightKg: "", notes: "" };
const emptyTierForm = { minSizeCm: "0", maxSizeCm: "", unitPricePerKg: "0", notes: "" };

export default function FreightOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<SteelPlateItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [showTiers, setShowTiers] = useState(false);
  const [tierForm, setTierForm] = useState(emptyTierForm);

  function load() {
    fetch(`/api/freight-orders/${id}`).then((r) => r.json()).then(setOrder);
    fetch(`/api/freight-orders/${id}/steel-plate-items`).then((r) => r.json()).then(setItems);
    fetch(`/api/steel-plate-tiers`).then((r) => r.json()).then(setTiers);
  }
  useEffect(load, [id]);

  async function handleAddTier(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/steel-plate-tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tierForm),
    });
    setTierForm(emptyTierForm);
    load();
  }

  async function handleDeleteTier(tierId: number) {
    await fetch(`/api/steel-plate-tiers/${tierId}`, { method: "DELETE" });
    load();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.lengthCm || !form.widthCm || !form.thicknessMm || !form.weightKg) {
      setError("請完整輸入長、寬、厚度與重量");
      return;
    }
    const res = await fetch(`/api/freight-orders/${id}/steel-plate-items`, {
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
    load();
  }

  async function handleDelete(itemId: number) {
    await fetch(`/api/freight-orders/${id}/steel-plate-items/${itemId}`, { method: "DELETE" });
    load();
  }

  const total = items.reduce((s, i) => s + parseFloat(i.amount), 0);

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.push("/freight-orders")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={14} /> 返回運費單列表
      </button>
      <PageHeader
        icon={<Layers size={20} />}
        title="特殊鐵板計價明細"
        subtitle={order ? `運費單日期：${order.orderDate}` : undefined}
      />

      <Card className="p-5 mb-6">
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <Field label="長 (cm)" required>
            <Input required type="number" step="0.01" value={form.lengthCm} onChange={(e) => setForm({ ...form, lengthCm: e.target.value })} />
          </Field>
          <Field label="寬 (cm)" required>
            <Input required type="number" step="0.01" value={form.widthCm} onChange={(e) => setForm({ ...form, widthCm: e.target.value })} />
          </Field>
          <Field label="厚度 (mm)" required>
            <Input required type="number" step="0.01" value={form.thicknessMm} onChange={(e) => setForm({ ...form, thicknessMm: e.target.value })} />
          </Field>
          <Field label="重量 (kg)" required>
            <Input required type="number" step="0.01" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
          </Field>
          <Field label="備註">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-red-600 sm:col-span-5">{error}</p>}
          <div className="sm:col-span-5">
            <Button type="submit">新增明細（自動依長寬最大值對照單價表計算）</Button>
          </div>
        </form>
      </Card>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={<Layers size={32} />} message="尚無明細，請於上方新增。系統會依「長、寬」取最大值對照單價表，乘以重量算出金額。" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>長 (cm)</Th>
                <Th>寬 (cm)</Th>
                <Th>厚度 (mm)</Th>
                <Th>重量 (kg)</Th>
                <Th>每公斤單價</Th>
                <Th>金額</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((i) => (
                <Tr key={i.id}>
                  <Td>{formatNumber(i.lengthCm)}</Td>
                  <Td>{formatNumber(i.widthCm)}</Td>
                  <Td>{formatNumber(i.thicknessMm)}</Td>
                  <Td>{formatNumber(i.weightKg)}</Td>
                  <Td>{formatNumber(i.unitPricePerKg)}</Td>
                  <Td className="font-medium">{formatCurrency(i.amount)}</Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(i.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                  </Td>
                </Tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold bg-slate-50/80">
                <td className="px-4 py-3" colSpan={5}>運費金額合計（已自動同步至運費單）</td>
                <td className="px-4 py-3">{formatCurrency(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </Table>
        )}
      </Card>
      <div className="mt-8">
        <button
          onClick={() => setShowTiers((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <Settings2 size={14} /> {showTiers ? "收起" : "設定"}鐵板單價分級表
        </button>
        {showTiers && (
          <Card className="p-5">
            <p className="text-xs text-slate-500 mb-4">
              依「長、寬取最大值」(cm) 落在哪個區間，決定每公斤單價。區間為「大於等於下限、小於上限」，上限留空代表無上限。
            </p>
            <form onSubmit={handleAddTier} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
              <Field label="下限 (cm)">
                <Input type="number" step="0.01" value={tierForm.minSizeCm} onChange={(e) => setTierForm({ ...tierForm, minSizeCm: e.target.value })} />
              </Field>
              <Field label="上限 (cm，留空=無上限)">
                <Input type="number" step="0.01" value={tierForm.maxSizeCm} onChange={(e) => setTierForm({ ...tierForm, maxSizeCm: e.target.value })} />
              </Field>
              <Field label="每公斤單價" required>
                <Input required type="number" step="0.0001" value={tierForm.unitPricePerKg} onChange={(e) => setTierForm({ ...tierForm, unitPricePerKg: e.target.value })} />
              </Field>
              <div className="flex items-end">
                <Button type="submit" className="w-full">新增級距</Button>
              </div>
            </form>
            <Table>
              <Thead>
                <tr>
                  <Th>下限 (cm)</Th>
                  <Th>上限 (cm)</Th>
                  <Th>每公斤單價</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {tiers.map((t) => (
                  <Tr key={t.id}>
                    <Td>{t.minSizeCm}</Td>
                    <Td>{t.maxSizeCm ?? "無上限"}</Td>
                    <Td>{t.unitPricePerKg}</Td>
                    <Td className="text-right">
                      <button onClick={() => handleDeleteTier(t.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
