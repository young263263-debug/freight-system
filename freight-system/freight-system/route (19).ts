import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accountsReceivable, customers, freightOrders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;

  const rows = await db
    .select({
      ar: accountsReceivable,
      customerName: customers.name,
      orderDate: freightOrders.orderDate,
    })
    .from(accountsReceivable)
    .leftJoin(customers, eq(accountsReceivable.customerId, customers.id))
    .leftJoin(freightOrders, eq(accountsReceivable.freightOrderId, freightOrders.id))
    .orderBy(desc(accountsReceivable.createdAt));

  const result = rows.map((r) => ({
    ...r.ar,
    customerName: r.customerName,
    orderDate: r.orderDate,
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (body?.amount === undefined) return badRequest("請輸入金額");

  const [row] = await db
    .insert(accountsReceivable)
    .values({
      freightOrderId: body.freightOrderId ? Number(body.freightOrderId) : null,
      customerId: body.customerId ? Number(body.customerId) : null,
      amount: String(body.amount),
      paymentMethod: body.paymentMethod || "匯款",
      isPaid: body.isPaid ?? false,
      paidDate: body.paidDate || null,
      dueDate: body.dueDate || null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
