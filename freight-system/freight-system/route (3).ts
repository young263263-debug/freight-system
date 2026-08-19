import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession, badRequest } from "@/lib/api-helpers";
import { verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { session, res } = await requireSession();
  if (res) return res;

  const body = await req.json().catch(() => null);
  const { currentPassword, newPassword } = body || {};
  if (!currentPassword || !newPassword) {
    return badRequest("請輸入目前密碼與新密碼");
  }
  if (String(newPassword).length < 6) {
    return badRequest("新密碼至少需要 6 個字元");
  }

  const [user] = await db.select().from(users).where(eq(users.id, session!.userId));
  if (!user) return badRequest("找不到帳號");

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return badRequest("目前密碼不正確");

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, session!.userId));

  return NextResponse.json({ ok: true });
}
