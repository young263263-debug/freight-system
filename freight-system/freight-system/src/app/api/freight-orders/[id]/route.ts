import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { freightOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession, badRequest, notFound } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireSession();
  if (res) return res;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.driverId || !body?.orderDate) {
    return badRequest("請選擇司機與日期");
  }

  const [row] = await db
    .update(freightOrders)
    .set({
      orderDate: body.orderDate,
      driverId: Number(body.driverId),
      customerId: body.customerId ? Number(body.customerId) : null,
      itemDescription: body.itemDescription || null,
      freightAmount: String(body.freightAmount ?? 0),
      invoiceTaxDeduction: String(body.invoiceTaxDeduction ?? 0),
      interestDeduction: String(body.interestDeduction ?? 0),
      otherDeduction: String(body.otherDeduction ?? 0),
      costBearer: body.costBearer === "company" ? "company" : "driver",
      notes: body.notes || null,
    })
    .where(eq(freightOrders.id, Number(id)))
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
  await db.delete(freightOrders).where(eq(freightOrders.id, Number(id)));
  return NextResponse.json({ ok: true });
}
