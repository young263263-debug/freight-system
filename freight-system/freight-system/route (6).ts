import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, badRequest, notFound } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireStaff();
  if (res) return res;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.name) return badRequest("請輸入員工姓名");

  const [row] = await db
    .update(employees)
    .set({
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
    .where(eq(employees.id, Number(id)))
    .returning();

  if (!row) return notFound();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireStaff();
  if (res) return res;
  const { id } = await params;
  await db.delete(employees).where(eq(employees.id, Number(id)));
  return NextResponse.json({ ok: true });
}
