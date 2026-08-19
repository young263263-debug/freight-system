import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { driverRecurringDeductions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; deductionId: string }> }
) {
  const { res } = await requireSession();
  if (res) return res;
  const { deductionId } = await params;
  const body = await req.json().catch(() => null);

  const [row] = await db
    .update(driverRecurringDeductions)
    .set({
      name: body.name,
      amount: String(body.amount),
      active: body.active ?? true,
    })
    .where(eq(driverRecurringDeductions.id, Number(deductionId)))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; deductionId: string }> }
) {
  const { res } = await requireSession();
  if (res) return res;
  const { deductionId } = await params;
  await db
    .delete(driverRecurringDeductions)
    .where(eq(driverRecurringDeductions.id, Number(deductionId)));
  return NextResponse.json({ ok: true });
}
