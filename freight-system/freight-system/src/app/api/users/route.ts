import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession, badRequest } from "@/lib/api-helpers";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const { res } = await requireSession();
  if (res) return res;
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { res } = await requireSession();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password) {
    return badRequest("請輸入姓名、Email、密碼");
  }

  const passwordHash = await hashPassword(body.password);
  try {
    const [row] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role === "accountant" ? "accountant" : "admin",
      })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return NextResponse.json(row, { status: 201 });
  } catch {
    return badRequest("此 Email 已被使用");
  }
}
