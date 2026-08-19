import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenseCategories } from "@/db/schema";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db.select().from(expenseCategories);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.name) return badRequest("請輸入分類名稱");

  const [row] = await db
    .insert(expenseCategories)
    .values({
      name: body.name,
      type: body.type === "成本" ? "成本" : "費用",
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
