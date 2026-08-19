import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireSession, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireSession();
  if (res) return res;
  const rows = await db.select().from(customers).orderBy(desc(customers.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { res } = await requireSession();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.name) return badRequest("請輸入客戶名稱");

  const [row] = await db
    .insert(customers)
    .values({
      name: body.name,
      contact: body.contact || null,
      phone: body.phone || null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
