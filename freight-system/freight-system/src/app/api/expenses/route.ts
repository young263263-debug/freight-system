import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireSession, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireSession();
  if (res) return res;
  const rows = await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { session, res } = await requireSession();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.categoryId || !body?.expenseDate || body?.amount === undefined) {
    return badRequest("請輸入分類、日期與金額");
  }

  const [row] = await db
    .insert(expenses)
    .values({
      expenseDate: body.expenseDate,
      categoryId: Number(body.categoryId),
      amount: String(body.amount),
      description: body.description || null,
      isRecurring: body.isRecurring ?? false,
      recurringDay: body.isRecurring ? Number(body.recurringDay) || null : null,
      createdBy: session!.userId,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
