import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { checks } from "@/db/schema";
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
    .update(checks)
    .set({
      checkNumber: body.checkNumber,
      bankName: body.bankName || null,
      direction: body.direction === "payable" ? "payable" : "receivable",
      counterparty: body.counterparty || null,
      amount: String(body.amount),
      issueDate: body.issueDate || null,
      dueDate: body.dueDate,
      isCashed: body.isCashed ?? false,
      cashedDate: body.cashedDate || null,
      notes: body.notes || null,
    })
    .where(eq(checks.id, Number(id)))
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
  await db.delete(checks).where(eq(checks.id, Number(id)));
  return NextResponse.json({ ok: true });
}
