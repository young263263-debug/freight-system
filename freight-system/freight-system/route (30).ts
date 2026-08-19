import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { priceListItems } from "@/db/schema";
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
  if (!body?.itemName) return badRequest("請輸入路線／品項名稱");

  const [row] = await db
    .update(priceListItems)
    .set({
      customerId: body.customerId ? Number(body.customerId) : null,
      itemName: body.itemName,
      unit: body.unit || null,
      unitPrice: String(body.unitPrice ?? 0),
      notes: body.notes || null,
    })
    .where(eq(priceListItems.id, Number(id)))
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
  await db.delete(priceListItems).where(eq(priceListItems.id, Number(id)));
  return NextResponse.json({ ok: true });
}
