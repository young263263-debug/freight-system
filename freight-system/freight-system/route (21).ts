import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.name) return badRequest("請輸入司機姓名");

  const [row] = await db
    .insert(drivers)
    .values({
      name: body.name,
      phone: body.phone || null,
      idNumber: body.idNumber || null,
      baseSalary: String(body.baseSalary ?? 0),
      commissionRate: String(body.commissionRate ?? 0),
      defaultCostBearer: body.defaultCostBearer === "company" ? "company" : "driver",
      active: body.active ?? true,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
