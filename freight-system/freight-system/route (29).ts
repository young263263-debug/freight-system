import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { priceListItems, customers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db
    .select({ item: priceListItems, customerName: customers.name })
    .from(priceListItems)
    .leftJoin(customers, eq(priceListItems.customerId, customers.id))
    .orderBy(desc(priceListItems.createdAt));
  return NextResponse.json(rows.map((r) => ({ ...r.item, customerName: r.customerName })));
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.itemName) return badRequest("請輸入路線／品項名稱");

  const [row] = await db
    .insert(priceListItems)
    .values({
      customerId: body.customerId ? Number(body.customerId) : null,
      itemName: body.itemName,
      unit: body.unit || null,
      unitPrice: String(body.unitPrice ?? 0),
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
