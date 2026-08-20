import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accountsReceivable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, notFound } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireStaff();
  if (res) return res;
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const [row] = await db
    .update(accountsReceivable)
    .set({
      amount: String(body.amount),
      paymentMethod: body.paymentMethod || "匯款",
      isPaid: body.isPaid ?? false,
      paidDate: body.paidDate || null,
      dueDate: body.dueDate || null,
      notes: body.notes || null,
    })
    .where(eq(accountsReceivable.id, Number(id)))
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
  await db.delete(accountsReceivable).where(eq(accountsReceivable.id, Number(id)));
  return NextResponse.json({ ok: true });
}
