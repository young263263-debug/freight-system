import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { checks } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db.select().from(checks).orderBy(desc(checks.dueDate));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.checkNumber || !body?.dueDate || body?.amount === undefined) {
    return badRequest("請輸入支票號碼、到期日與金額");
  }

  const [row] = await db
    .insert(checks)
    .values({
      checkNumber: body.checkNumber,
      bankName: body.bankName || null,
      direction: body.direction === "payable" ? "payable" : "receivable",
      counterparty: body.counterparty || null,
      amount: String(body.amount),
      issueDate: body.issueDate || null,
      dueDate: body.dueDate,
      isCashed: body.isCashed ?? false,
      cashedDate: body.cashedDate || null,
      accountsReceivableId: body.accountsReceivableId ? Number(body.accountsReceivableId) : null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
