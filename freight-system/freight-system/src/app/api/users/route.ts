import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, drivers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      driverId: users.driverId,
      driverName: drivers.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(drivers, eq(users.driverId, drivers.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password) {
    return badRequest("請輸入姓名、Email、密碼");
  }
  const role = ["accountant", "driver"].includes(body.role) ? body.role : "admin";
  if (role === "driver" && !body.driverId) {
    return badRequest("司機帳號請選擇要連結的司機資料");
  }

  const passwordHash = await hashPassword(body.password);
  try {
    const [row] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        passwordHash,
        role,
        driverId: role === "driver" ? Number(body.driverId) : null,
      })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return NextResponse.json(row, { status: 201 });
  } catch {
    return badRequest("此 Email 已被使用");
  }
}
