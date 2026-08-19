import { NextRequest } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { requireStaff } from "@/lib/api-helpers";
import { buildXlsxResponse } from "@/lib/xlsx-export";
import { toNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;

  const companyFilter = req.nextUrl.searchParams.get("company"); // 和陞 | 和聖 | null(all)
  let rows = await db.select().from(invoices);
  if (companyFilter === "和陞" || companyFilter === "和聖") {
    rows = rows.filter((r) => r.companyEntity === companyFilter);
  }

  return buildXlsxResponse(
    "發票登記",
    [
      { header: "日期", key: "invoiceDate", width: 14 },
      { header: "發票號碼", key: "invoiceNumber", width: 16 },
      { header: "類別", key: "direction", width: 10 },
      { header: "開票公司", key: "companyEntity", width: 10 },
      { header: "對方", key: "counterpartyName", width: 22 },
      { header: "未稅金額", key: "amount", width: 14 },
      { header: "稅額", key: "taxAmount", width: 12 },
      { header: "含稅合計", key: "total", width: 14 },
      { header: "備註", key: "notes", width: 24 },
    ],
    rows.map((i) => ({
      invoiceDate: i.invoiceDate,
      invoiceNumber: i.invoiceNumber ?? "",
      direction: i.direction,
      companyEntity: i.companyEntity,
      counterpartyName: i.counterpartyName,
      amount: toNumber(i.amount),
      taxAmount: toNumber(i.taxAmount),
      total: toNumber(i.amount) + toNumber(i.taxAmount),
      notes: i.notes ?? "",
    })),
    "發票登記.xlsx"
  );
}
