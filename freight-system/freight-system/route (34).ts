import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { steelPlateItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";
import {
  resolveSteelPlateUnitPrice,
  computeSteelPlateAmount,
  syncFreightAmountFromSteelPlateItems,
} from "@/lib/steel-plate";
import { toNumber } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireStaff();
  if (res) return res;
  const { id } = await params;
  const rows = await db
    .select()
    .from(steelPlateItems)
    .where(eq(steelPlateItems.freightOrderId, Number(id)));
  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireStaff();
  if (res) return res;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (
    body?.lengthCm === undefined ||
    body?.widthCm === undefined ||
    body?.thicknessMm === undefined ||
    body?.weightKg === undefined
  ) {
    return badRequest("請輸入長、寬、厚度與重量");
  }

  const lengthCm = toNumber(body.lengthCm);
  const widthCm = toNumber(body.widthCm);
  const weightKg = toNumber(body.weightKg);
  const maxSizeCm = Math.max(lengthCm, widthCm);
  const unitPricePerKg = await resolveSteelPlateUnitPrice(maxSizeCm);
  const amount = computeSteelPlateAmount(weightKg, unitPricePerKg);

  const [row] = await db
    .insert(steelPlateItems)
    .values({
      freightOrderId: Number(id),
      lengthCm: String(lengthCm),
      widthCm: String(widthCm),
      thicknessMm: String(toNumber(body.thicknessMm)),
      weightKg: String(weightKg),
      unitPricePerKg: String(unitPricePerKg),
      amount: String(amount),
      notes: body.notes || null,
    })
    .returning();

  const newTotal = await syncFreightAmountFromSteelPlateItems(Number(id));

  return NextResponse.json({ item: row, freightAmountTotal: newTotal }, { status: 201 });
}
