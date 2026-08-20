import { NextRequest, NextResponse } from "next/server";
import { requireStaff, badRequest } from "@/lib/api-helpers";
import { computePayrollForMonth } from "@/lib/finance";
import { currentYearMonth } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;

  const yearMonth = req.nextUrl.searchParams.get("month") || currentYearMonth();
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return badRequest("月份格式錯誤");

  const lines = await computePayrollForMonth(yearMonth);
  return NextResponse.json({ yearMonth, lines });
}
