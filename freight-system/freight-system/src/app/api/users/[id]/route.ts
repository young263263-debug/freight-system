import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/api-helpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, res } = await requireSession();
  if (res) return res;
  const { id } = await params;
  if (Number(id) === session!.userId) {
    return NextResponse.json({ error: "無法刪除自己的帳號" }, { status: 400 });
  }
  await db.delete(users).where(eq(users.id, Number(id)));
  return NextResponse.json({ ok: true });
}
