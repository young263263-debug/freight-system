import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
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
  if (!body?.name) return badRequest("請輸入客戶名稱");

  const [row] = await db
    .update(customers)
    .set({
      name: body.name,
      contact: body.contact || null,
      phone: body.phone || null,
      notes: body.notes || null,
    })
    .where(eq(customers.id, Number(id)))
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
  await db.delete(customers).where(eq(customers.id, Number(id)));
  return NextResponse.json({ ok: true });
}
