import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { freightOrders, drivers, customers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;

  const rows = await db
    .select({
      order: freightOrders,
      driverName: drivers.name,
      customerName: customers.name,
    })
    .from(freightOrders)
    .leftJoin(drivers, eq(freightOrders.driverId, drivers.id))
    .leftJoin(customers, eq(freightOrders.customerId, customers.id))
    .orderBy(desc(freightOrders.orderDate));

  const result = rows.map((r) => ({ ...r.order, driverName: r.driverName, customerName: r.customerName }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.driverId || !body?.orderDate) {
    return badRequest("請選擇司機與日期");
  }

  const [row] = await db
    .insert(freightOrders)
    .values({
      orderDate: body.orderDate,
      driverId: Number(body.driverId),
      customerId: body.customerId ? Number(body.customerId) : null,
      itemDescription: body.itemDescription || null,
      freightAmount: String(body.freightAmount ?? 0),
      invoiceTaxDeduction: String(body.invoiceTaxDeduction ?? 0),
      interestDeduction: String(body.interestDeduction ?? 0),
      otherDeduction: String(body.otherDeduction ?? 0),
      costBearer: body.costBearer === "company" ? "company" : "driver",
      isSteelPlateOrder: body.isSteelPlateOrder ?? false,
      notes: body.notes || null,
      createdBy: session!.userId,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
