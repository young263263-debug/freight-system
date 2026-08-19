import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/api-helpers";
import { computeProfitLossForMonth } from "@/lib/finance";
import { currentYearMonth } from "@/lib/utils";
import { db } from "@/db";
import { accountsReceivable, checks, vehicles } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { toNumber } from "@/lib/utils";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;

  const yearMonth = currentYearMonth();
  const pl = await computeProfitLossForMonth(yearMonth);

  const unpaid = await db
    .select()
    .from(accountsReceivable)
    .where(eq(accountsReceivable.isPaid, false));
  const totalReceivable = unpaid.reduce((s, r) => s + toNumber(r.amount), 0);

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30DaysStr = in30Days.toISOString().slice(0, 10);

  const uncashedChecks = await db.select().from(checks).where(eq(checks.isCashed, false));
  const upcomingChecks = uncashedChecks.filter((c) => c.dueDate <= in30DaysStr);

  const allVehicles = await db.select().from(vehicles).where(eq(vehicles.active, true));
  const expiringVehicles = allVehicles.filter(
    (v) =>
      (v.inspectionDueDate && v.inspectionDueDate <= in30DaysStr) ||
      (v.insuranceExpiry && v.insuranceExpiry <= in30DaysStr)
  );

  return NextResponse.json({
    yearMonth,
    freightRevenue: pl.freightRevenue,
    netProfit: pl.netProfit,
    totalReceivable,
    unpaidCount: unpaid.length,
    upcomingChecksCount: upcomingChecks.length,
    upcomingChecksAmount: upcomingChecks.reduce((s, c) => s + toNumber(c.amount), 0),
    expiringVehiclesCount: expiringVehicles.length,
  });
}
