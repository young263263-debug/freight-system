"use client";

import { useEffect, useState } from "react";
import { Car, Plus, X } from "lucide-react";
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

type Driver = { id: number; name: string };
type Vehicle = {
  id: number;
  plateNumber: string;
  vehicleType: string | null;
  driverId: number | null;
  driverName: string | null;
  transportCompany: string | null;
  insuranceCompany: string | null;
  insuranceExpiry: string | null;
  inspectionDueDate: string | null;
  active: boolean;
};

const emptyForm = {
  plateNumber: "",
  vehicleType: "",
  driverId: "",
  transportCompany: "",
  insuranceCompany: "",
  insuranceExpiry: "",
  inspectionDueDate: "",
  notes: "",
};

function isSoon(dateStr: string | null) {
  if (!dateStr) return false;
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  return dateStr <= in30.toISOString().slice(0, 10);
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/drivers").then((r) => r.json()),
    ])
      .then(([v, d]) => {
        setVehicles(v);
        setDrivers(d);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/vehicles", {
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
    if (!confirm("確定要刪除此車輛嗎？")) return;
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        icon={<Car size={20} />}
        title="車輛管理"
        subtitle="車行、保險與驗車日期提醒"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "取消" : "新增車輛"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="車牌號碼" required>
              <Input required value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
            </Field>
            <Field label="車輛類型">
              <Input value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} placeholder="例如：曳引車、拖板車" />
            </Field>
            <Field label="指派司機">
              <Select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                <option value="">未指定</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="車行">
              <Input value={form.transportCompany} onChange={(e) => setForm({ ...form, transportCompany: e.target.value })} />
            </Field>
            <Field label="保險公司">
              <Input value={form.insuranceCompany} onChange={(e) => setForm({ ...form, insuranceCompany: e.target.value })} />
            </Field>
            <Field label="保險到期日">
              <Input type="date" value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} />
            </Field>
            <Field label="驗車日期">
              <Input type="date" value={form.inspectionDueDate} onChange={(e) => setForm({ ...form, inspectionDueDate: e.target.value })} />
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
        ) : vehicles.length === 0 ? (
          <EmptyState icon={<Car size={32} />} message="尚無車輛資料" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>車牌號碼</Th>
                <Th>類型</Th>
                <Th>指派司機</Th>
                <Th>車行</Th>
                <Th>保險</Th>
                <Th>驗車日期</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {vehicles.map((v) => (
                <Tr key={v.id}>
                  <Td className="font-medium text-slate-900">{v.plateNumber}</Td>
                  <Td>{v.vehicleType || "-"}</Td>
                  <Td>{v.driverName || "-"}</Td>
                  <Td>{v.transportCompany || "-"}</Td>
                  <Td>
                    {v.insuranceCompany || "-"}
                    {v.insuranceExpiry && (
                      <div>
                        <Badge tone={isSoon(v.insuranceExpiry) ? "amber" : "slate"}>{v.insuranceExpiry} 到期</Badge>
                      </div>
                    )}
                  </Td>
                  <Td>
                    {v.inspectionDueDate ? (
                      <Badge tone={isSoon(v.inspectionDueDate) ? "amber" : "slate"}>{v.inspectionDueDate}</Badge>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:underline text-xs">刪除</button>
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
