"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { PageHeader, Card, Field, Input, Button } from "@/components/ui";

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("兩次輸入的新密碼不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "變更失敗");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <PageHeader icon={<KeyRound size={20} />} title="變更密碼" />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="目前密碼" required>
            <Input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </Field>
          <Field label="新密碼" required>
            <Input required type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <Field label="確認新密碼" required>
            <Input required type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">密碼已更新</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "處理中..." : "更新密碼"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
