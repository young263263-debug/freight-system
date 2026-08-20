import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
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
  if (!body?.plateNumber) return badRequest("請輸入車牌號碼");

  const [row] = await db
    .update(vehicles)
    .set({
      plateNumber: body.plateNumber,
      vehicleType: body.vehicleType || null,
      driverId: body.driverId ? Number(body.driverId) : null,
      transportCompany: body.transportCompany || null,
      insuranceCompany: body.insuranceCompany || null,
      insuranceExpiry: body.insuranceExpiry || null,
      inspectionDueDate: body.inspectionDueDate || null,
      notes: body.notes || null,
      active: body.active ?? true,
    })
    .where(eq(vehicles.id, Number(id)))
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
  await db.delete(vehicles).where(eq(vehicles.id, Number(id)));
  return NextResponse.json({ ok: true });
}
