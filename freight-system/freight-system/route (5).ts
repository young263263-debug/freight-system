import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db.select().from(employees).orderBy(desc(employees.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.name) return badRequest("請輸入員工姓名");

  const [row] = await db
    .insert(employees)
    .values({
      name: body.name,
      idNumber: body.idNumber || null,
      phone: body.phone || null,
      address: body.address || null,
      position: body.position || null,
      hireDate: body.hireDate || null,
      monthlySalary: String(body.monthlySalary ?? 0),
      laborInsuranceAmount: String(body.laborInsuranceAmount ?? 0),
      healthInsuranceAmount: String(body.healthInsuranceAmount ?? 0),
      healthInsuranceDependents: Number(body.healthInsuranceDependents ?? 0),
      active: body.active ?? true,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
