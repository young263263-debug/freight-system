import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { computeProfitLossForMonth } from "@/lib/finance";
import { currentYearMonth } from "@/lib/utils";
import { db } from "@/db";
import { accountsReceivable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toNumber } from "@/lib/utils";

export async function GET() {
  const { res } = await requireSession();
  if (res) return res;

  const yearMonth = currentYearMonth();
  const pl = await computeProfitLossForMonth(yearMonth);

  const unpaid = await db
    .select()
    .from(accountsReceivable)
    .where(eq(accountsReceivable.isPaid, false));
  const totalReceivable = unpaid.reduce((s, r) => s + toNumber(r.amount), 0);

  return NextResponse.json({
    yearMonth,
    freightRevenue: pl.freightRevenue,
    netProfit: pl.netProfit,
    totalReceivable,
    unpaidCount: unpaid.length,
  });
}
