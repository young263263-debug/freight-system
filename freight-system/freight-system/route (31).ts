import { db } from "@/db";
import { priceListItems, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/api-helpers";
import { buildXlsxResponse } from "@/lib/xlsx-export";
import { toNumber } from "@/lib/utils";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;

  const rows = await db
    .select({ item: priceListItems, customerName: customers.name })
    .from(priceListItems)
    .leftJoin(customers, eq(priceListItems.customerId, customers.id));

  return buildXlsxResponse(
    "單價表",
    [
      { header: "客戶", key: "customerName", width: 18 },
      { header: "路線／品項", key: "itemName", width: 24 },
      { header: "單位", key: "unit", width: 10 },
      { header: "單價", key: "unitPrice", width: 12 },
      { header: "備註", key: "notes", width: 24 },
    ],
    rows.map((r) => ({
      customerName: r.customerName ?? "",
      itemName: r.item.itemName,
      unit: r.item.unit ?? "",
      unitPrice: toNumber(r.item.unitPrice),
      notes: r.item.notes ?? "",
    })),
    "單價表.xlsx"
  );
}
