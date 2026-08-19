import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { otherIncome } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/api-helpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireSession();
  if (res) return res;
  const { id } = await params;
  await db.delete(otherIncome).where(eq(otherIncome.id, Number(id)));
  return NextResponse.json({ ok: true });
}
