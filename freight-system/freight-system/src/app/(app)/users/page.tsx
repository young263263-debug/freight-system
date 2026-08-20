"use client";

import { useEffect, useState } from "react";
import { UserCog, Plus, X } from "lucide-react";
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
  LoadingState,
} from "@/components/ui";

type User = { id: number; name: string; email: string; role: "admin" | "accountant" | "driver"; driverName: string | null };
type Driver = { id: number; name: string };

const ROLE_LABEL: Record<string, string> = { admin: "管理者", accountant: "會計", driver: "司機" };
const ROLE_TONE: Record<string, "indigo" | "slate" | "amber"> = { admin: "indigo", accountant: "slate", driver: "amber" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin", driverId: "" });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/drivers").then((r) => r.json()),
    ])
      .then(([u, d]) => {
        setUsers(u);
        setDrivers(d);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "新增失敗");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "admin", driverId: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定要刪除此帳號嗎？")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "刪除失敗");
      return;
    }
    load();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        icon={<UserCog size={20} />}
        title="帳號管理"
        subtitle="管理者／會計為全權限，司機帳號僅能查看自己的薪資"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "取消" : "新增帳號"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="姓名" required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="密碼" required>
              <Input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="角色">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">管理者（老闆／全權限）</option>
                <option value="accountant">會計（全權限）</option>
                <option value="driver">司機（僅能看自己薪資）</option>
              </Select>
            </Field>
            {form.role === "driver" && (
              <Field label="連結司機資料" required className="sm:col-span-2">
                <Select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                  <option value="">請選擇</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </Field>
            )}
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit">建立帳號</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <LoadingState />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>姓名</Th>
                <Th>Email</Th>
                <Th>角色</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium text-slate-900">{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge tone={ROLE_TONE[u.role]}>
                      {ROLE_LABEL[u.role]}
                      {u.role === "driver" && u.driverName ? ` · ${u.driverName}` : ""}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-xs">刪除</button>
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
