import { NextRequest, NextResponse } from "next/server";
import { requireSession, badRequest } from "@/lib/api-helpers";
import { computePayrollForMonth } from "@/lib/finance";
import { currentYearMonth } from "@/lib/utils";

// Any logged-in user can call this, but it only ever returns the caller's
// own driver record — used by the restricted "driver" role's payroll view.
export async function GET(req: NextRequest) {
  const { session, res } = await requireSession();
  if (res) return res;

  if (!session!.driverId) {
    return NextResponse.json({ error: "此帳號未連結司機資料" }, { status: 400 });
  }

  const yearMonth = req.nextUrl.searchParams.get("month") || currentYearMonth();
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return badRequest("月份格式錯誤");

  const lines = await computePayrollForMonth(yearMonth);
  const mine = lines.filter((l) => l.driver.id === session!.driverId);
  return NextResponse.json({ yearMonth, lines: mine });
}
