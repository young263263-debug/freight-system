import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { steelPlatePriceTiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/api-helpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireStaff();
  if (res) return res;
  const { id } = await params;
  await db.delete(steelPlatePriceTiers).where(eq(steelPlatePriceTiers.id, Number(id)));
  return NextResponse.json({ ok: true });
}
