import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db.select().from(invoices).orderBy(desc(invoices.invoiceDate));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.invoiceDate || !body?.counterpartyName) {
    return badRequest("請輸入日期與對方名稱");
  }

  const [row] = await db
    .insert(invoices)
    .values({
      invoiceDate: body.invoiceDate,
      invoiceNumber: body.invoiceNumber || null,
      direction: body.direction === "進項" ? "進項" : "銷項",
      companyEntity: body.companyEntity === "和聖" ? "和聖" : "和陞",
      counterpartyName: body.counterpartyName,
      amount: String(body.amount ?? 0),
      taxAmount: String(body.taxAmount ?? 0),
      notes: body.notes || null,
      createdBy: session!.userId,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
