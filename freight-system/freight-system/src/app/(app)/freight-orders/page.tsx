"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, currentYearMonth } from "@/lib/utils";
import { Truck, Plus, X, Layers } from "lucide-react";
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

type Driver = { id: number; name: string; defaultCostBearer: "driver" | "company" };
type Customer = { id: number; name: string };
type Order = {
  id: number;
  orderDate: string;
  driverId: number;
  customerId: number | null;
  driverName: string | null;
  customerName: string | null;
  itemDescription: string | null;
  freightAmount: string;
  invoiceTaxDeduction: string;
  interestDeduction: string;
  otherDeduction: string;
  costBearer: "driver" | "company";
  isSteelPlateOrder: boolean;
};

const emptyForm = {
  orderDate: new Date().toISOString().slice(0, 10),
  driverId: "",
  customerId: "",
  itemDescription: "",
  freightAmount: "0",
  invoiceTaxDeduction: "0",
  interestDeduction: "0",
  otherDeduction: "0",
  costBearer: "driver",
  isSteelPlateOrder: false,
};

export default function FreightOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [monthFilter, setMonthFilter] = useState(currentYearMonth());

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/freight-orders").then((r) => r.json()),
      fetch("/api/drivers").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]).then(([o, d, c]) => {
      setOrders(o);
      setDrivers(d);
      setCustomers(c);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function handleDriverChange(driverId: string) {
    const driver = drivers.find((d) => String(d.id) === driverId);
    setForm({ ...form, driverId, costBearer: driver?.defaultCostBearer ?? "driver" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.driverId) {
      setError("請選擇司機");
      return;
    }
    const res = await fetch("/api/freight-orders", {
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
    if (!confirm("確定要刪除此筆運費單嗎？")) return;
    await fetch(`/api/freight-orders/${id}`, { method: "DELETE" });
    load();
  }

  const filteredOrders = orders.filter((o) => o.orderDate.slice(0, 7) === monthFilter);

  return (
    <div>
      <PageHeader
        icon={<Truck size={20} />}
        title="運費單"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "取消" : "新增運費單"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="日期" required>
              <Input required type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
            </Field>
            <Field label="司機" required>
              <Select required value={form.driverId} onChange={(e) => handleDriverChange(e.target.value)}>
                <option value="">請選擇</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="客戶">
              <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">未指定</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="貨物內容 / 備註" className="sm:col-span-3">
              <Input value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} />
            </Field>

            <div className="sm:col-span-3 flex items-center gap-2 bg-indigo-50/60 rounded-lg px-3 py-2.5">
              <input
                type="checkbox"
                id="isSteelPlateOrder"
                checked={form.isSteelPlateOrder}
                onChange={(e) => setForm({ ...form, isSteelPlateOrder: e.target.checked })}
              />
              <label htmlFor="isSteelPlateOrder" className="text-sm text-slate-700">
                這是特殊鐵板訂單（儲存後可到明細頁輸入長寬厚重量，系統自動計算運費金額）
              </label>
            </div>

            {!form.isSteelPlateOrder && (
              <Field label="運費金額">
                <Input type="number" step="0.01" value={form.freightAmount} onChange={(e) => setForm({ ...form, freightAmount: e.target.value })} />
              </Field>
            )}
            <Field label="扣發票稅">
              <Input type="number" step="0.01" value={form.invoiceTaxDeduction} onChange={(e) => setForm({ ...form, invoiceTaxDeduction: e.target.value })} />
            </Field>
            <Field label="扣利息">
              <Input type="number" step="0.01" value={form.interestDeduction} onChange={(e) => setForm({ ...form, interestDeduction: e.target.value })} />
            </Field>
            <Field label="車主支出費用">
              <Input type="number" step="0.01" value={form.otherDeduction} onChange={(e) => setForm({ ...form, otherDeduction: e.target.value })} />
            </Field>
            <Field label="此費用由誰負擔" className="sm:col-span-2">
              <Select value={form.costBearer} onChange={(e) => setForm({ ...form, costBearer: e.target.value })}>
                <option value="driver">司機身上（從薪資扣除）</option>
                <option value="company">公司成本（不影響薪資）</option>
              </Select>
            </Field>
            {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
            <div className="sm:col-span-3">
              <Button type="submit">儲存</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm text-slate-600">篩選月份：</label>
        <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-40" />
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : filteredOrders.length === 0 ? (
          <EmptyState icon={<Truck size={32} />} message="此月份尚無運費單" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>日期</Th>
                <Th>司機</Th>
                <Th>客戶</Th>
                <Th>運費</Th>
                <Th>扣發票稅</Th>
                <Th>扣利息</Th>
                <Th>車主支出</Th>
                <Th>負擔方</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {filteredOrders.map((o) => (
                <Tr key={o.id}>
                  <Td className="whitespace-nowrap">{o.orderDate}</Td>
                  <Td>{o.driverName}</Td>
                  <Td>{o.customerName || "-"}</Td>
                  <Td>
                    {formatCurrency(o.freightAmount)}
                    {o.isSteelPlateOrder && (
                      <Link href={`/freight-orders/${o.id}`} className="ml-2 inline-flex items-center gap-1 text-indigo-600 hover:underline text-xs">
                        <Layers size={12} /> 鐵板明細
                      </Link>
                    )}
                  </Td>
                  <Td>{formatCurrency(o.invoiceTaxDeduction)}</Td>
                  <Td>{formatCurrency(o.interestDeduction)}</Td>
                  <Td>{formatCurrency(o.otherDeduction)}</Td>
                  <Td>
                    <Badge tone={o.costBearer === "driver" ? "slate" : "indigo"}>
                      {o.costBearer === "driver" ? "司機" : "公司"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(o.id)} className="text-red-500 hover:underline text-xs">刪除</button>
                  </Td>
                </Tr>
              ))}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 font-semibold bg-slate-50/80">
                  <td className="px-4 py-3" colSpan={3}>合計</td>
                  <td className="px-4 py-3">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.freightAmount), 0))}</td>
                  <td className="px-4 py-3">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.invoiceTaxDeduction), 0))}</td>
                  <td className="px-4 py-3">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.interestDeduction), 0))}</td>
                  <td className="px-4 py-3">{formatCurrency(filteredOrders.reduce((s, o) => s + parseFloat(o.otherDeduction), 0))}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </Table>
        )}
      </Card>
    </div>
  );
}
