import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { steelPlatePriceTiers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db
    .select()
    .from(steelPlatePriceTiers)
    .orderBy(asc(steelPlatePriceTiers.minSizeCm));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (body?.unitPricePerKg === undefined) return badRequest("請輸入每公斤單價");

  const [row] = await db
    .insert(steelPlatePriceTiers)
    .values({
      minSizeCm: String(body.minSizeCm ?? 0),
      maxSizeCm: body.maxSizeCm !== undefined && body.maxSizeCm !== "" ? String(body.maxSizeCm) : null,
      unitPricePerKg: String(body.unitPricePerKg),
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
