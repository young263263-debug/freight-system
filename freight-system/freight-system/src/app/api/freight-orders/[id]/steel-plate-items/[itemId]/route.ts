import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { steelPlateItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/api-helpers";
import { syncFreightAmountFromSteelPlateItems } from "@/lib/steel-plate";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { res } = await requireStaff();
  if (res) return res;
  const { id, itemId } = await params;
  await db.delete(steelPlateItems).where(eq(steelPlateItems.id, Number(itemId)));
  const newTotal = await syncFreightAmountFromSteelPlateItems(Number(id));
  return NextResponse.json({ ok: true, freightAmountTotal: newTotal });
}
