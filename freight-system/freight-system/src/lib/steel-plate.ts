import { db } from "@/db";
import { steelPlatePriceTiers, steelPlateItems, freightOrders } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { toNumber } from "./utils";

/**
 * 特殊鐵板計價邏輯：
 * 取長、寬兩者的最大值，對照「單價分級表」（依尺寸區間 cm）找出對應的每公斤單價，
 * 再乘以重量(kg)得出該筆明細金額。分級表可由使用者自行編輯調整。
 */
export async function resolveSteelPlateUnitPrice(maxSizeCm: number): Promise<number> {
  const tiers = await db
    .select()
    .from(steelPlatePriceTiers)
    .orderBy(asc(steelPlatePriceTiers.minSizeCm));

  for (const tier of tiers) {
    const min = toNumber(tier.minSizeCm);
    const max = tier.maxSizeCm === null ? null : toNumber(tier.maxSizeCm);
    if (maxSizeCm >= min && (max === null || maxSizeCm < max)) {
      return toNumber(tier.unitPricePerKg);
    }
  }
  return 0;
}

export function computeSteelPlateAmount(weightKg: number, unitPricePerKg: number) {
  return Math.round(weightKg * unitPricePerKg * 100) / 100;
}

/** Recompute the freight order's freightAmount from the sum of its steel plate line items. */
export async function syncFreightAmountFromSteelPlateItems(freightOrderId: number) {
  const items = await db
    .select()
    .from(steelPlateItems)
    .where(eq(steelPlateItems.freightOrderId, freightOrderId));
  const total = items.reduce((s, it) => s + toNumber(it.amount), 0);
  await db
    .update(freightOrders)
    .set({ freightAmount: String(total) })
    .where(eq(freightOrders.id, freightOrderId));
  return total;
}
