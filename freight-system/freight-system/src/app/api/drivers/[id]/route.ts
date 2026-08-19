import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { drivers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession, badRequest, notFound } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireSession();
  if (res) return res;
  const { id } = await params;
  const [row] = await db.select().from(drivers).where(eq(drivers.id, Number(id)));
  if (!row) return notFound();
  return NextResponse.json(row);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireSession();
  if (res) return res;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.name) return badRequest("請輸入司機姓名");

  const [row] = await db
    .update(drivers)
    .set({
      name: body.name,
      phone: body.phone || null,
      idNumber: body.idNumber || null,
      baseSalary: String(body.baseSalary ?? 0),
      commissionRate: String(body.commissionRate ?? 0),
      defaultCostBearer: body.defaultCostBearer === "company" ? "company" : "driver",
      active: body.active ?? true,
      notes: body.notes || null,
    })
    .where(eq(drivers.id, Number(id)))
    .returning();

  if (!row) return notFound();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireSession();
  if (res) return res;
  const { id } = await params;
  await db.delete(drivers).where(eq(drivers.id, Number(id)));
  return NextResponse.json({ ok: true });
}
