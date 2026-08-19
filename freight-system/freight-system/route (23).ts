import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { driverRecurringDeductions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireStaff();
  if (res) return res;
  const { id } = await params;
  const rows = await db
    .select()
    .from(driverRecurringDeductions)
    .where(eq(driverRecurringDeductions.driverId, Number(id)));
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
  if (!body?.name || body?.amount === undefined) {
    return badRequest("請輸入項目名稱與金額");
  }

  const [row] = await db
    .insert(driverRecurringDeductions)
    .values({
      driverId: Number(id),
      name: body.name,
      amount: String(body.amount),
      active: body.active ?? true,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
