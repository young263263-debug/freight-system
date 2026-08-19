import { db } from "@/db";
import {
  drivers,
  freightOrders,
  driverRecurringDeductions,
  expenses,
  expenseCategories,
  otherIncome,
} from "@/db/schema";
import { and, eq, gte, lt, lte } from "drizzle-orm";
import { toNumber, monthRange } from "./utils";

// ---------- Payroll ----------

export type DriverPayrollLine = {
  driver: typeof drivers.$inferSelect;
  orders: (typeof freightOrders.$inferSelect)[];
  totalFreight: number;
  totalInvoiceTax: number;
  totalInterest: number;
  totalOtherDeductionDriverBorne: number;
  totalOtherDeductionCompanyBorne: number;
  commissionAmount: number;
  baseSalary: number;
  grossPay: number; // max(commission, baseSalary)
  usedBaseSalary: boolean;
  recurringDeductions: { name: string; amount: number }[];
  totalRecurringDeductions: number;
  netPay: number;
};

export async function computePayrollForMonth(
  yearMonth: string
): Promise<DriverPayrollLine[]> {
  const { start, end } = monthRange(yearMonth);

  const allDrivers = await db.select().from(drivers).where(eq(drivers.active, true));
  const orders = await db
    .select()
    .from(freightOrders)
    .where(and(gte(freightOrders.orderDate, start), lt(freightOrders.orderDate, end)));
  const allDeductions = await db
    .select()
    .from(driverRecurringDeductions)
    .where(eq(driverRecurringDeductions.active, true));

  const lines: DriverPayrollLine[] = allDrivers.map((driver) => {
    const driverOrders = orders.filter((o) => o.driverId === driver.id);
    const totalFreight = driverOrders.reduce((s, o) => s + toNumber(o.freightAmount), 0);
    const totalInvoiceTax = driverOrders.reduce(
      (s, o) => s + toNumber(o.invoiceTaxDeduction),
      0
    );
    const totalInterest = driverOrders.reduce(
      (s, o) => s + toNumber(o.interestDeduction),
      0
    );
    const totalOtherDeductionDriverBorne = driverOrders
      .filter((o) => o.costBearer === "driver")
      .reduce((s, o) => s + toNumber(o.otherDeduction), 0);
    const totalOtherDeductionCompanyBorne = driverOrders
      .filter((o) => o.costBearer === "company")
      .reduce((s, o) => s + toNumber(o.otherDeduction), 0);

    const baseSalary = toNumber(driver.baseSalary);
    const commissionRate = toNumber(driver.commissionRate);
    const commissionAmount = totalFreight * commissionRate;

    const usedBaseSalary = baseSalary > 0 && baseSalary > commissionAmount;
    const grossPay = usedBaseSalary ? baseSalary : commissionAmount;

    const driverDeductions = allDeductions
      .filter((d) => d.driverId === driver.id)
      .map((d) => ({ name: d.name, amount: toNumber(d.amount) }));
    const totalRecurringDeductions = driverDeductions.reduce((s, d) => s + d.amount, 0);

    const netPay =
      grossPay -
      totalInvoiceTax -
      totalInterest -
      totalOtherDeductionDriverBorne -
      totalRecurringDeductions;

    return {
      driver,
      orders: driverOrders,
      totalFreight,
      totalInvoiceTax,
      totalInterest,
      totalOtherDeductionDriverBorne,
      totalOtherDeductionCompanyBorne,
      commissionAmount,
      baseSalary,
      grossPay,
      usedBaseSalary,
      recurringDeductions: driverDeductions,
      totalRecurringDeductions,
      netPay,
    };
  });

  // Only show drivers who had orders this month, or have a base salary (always paid)
  return lines.filter((l) => l.orders.length > 0 || l.baseSalary > 0);
}

// ---------- Expenses (with recurring templates auto-applied per month) ----------

export type MonthlyExpenseLine = {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryType: "成本" | "費用";
  amount: number;
  description: string | null;
  isRecurringTemplate: boolean;
};

export async function getExpensesForMonth(
  yearMonth: string
): Promise<MonthlyExpenseLine[]> {
  const { start, end } = monthRange(yearMonth);

  const categories = await db.select().from(expenseCategories);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const dated = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.isRecurring, false),
        gte(expenses.expenseDate, start),
        lt(expenses.expenseDate, end)
      )
    );

  const recurringTemplates = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.isRecurring, true), lte(expenses.expenseDate, end)));

  const lines: MonthlyExpenseLine[] = [];

  for (const e of dated) {
    const cat = categoryMap.get(e.categoryId);
    lines.push({
      id: e.id,
      categoryId: e.categoryId,
      categoryName: cat?.name ?? "未分類",
      categoryType: (cat?.type as "成本" | "費用") ?? "費用",
      amount: toNumber(e.amount),
      description: e.description,
      isRecurringTemplate: false,
    });
  }

  for (const e of recurringTemplates) {
    const cat = categoryMap.get(e.categoryId);
    lines.push({
      id: e.id,
      categoryId: e.categoryId,
      categoryName: cat?.name ?? "未分類",
      categoryType: (cat?.type as "成本" | "費用") ?? "費用",
      amount: toNumber(e.amount),
      description: e.description,
      isRecurringTemplate: true,
    });
  }

  return lines;
}

// ---------- Profit & Loss ----------

export type ProfitLossReport = {
  yearMonth: string;
  freightRevenue: number;
  otherIncomeTotal: number;
  totalRevenue: number;
  driverPayrollCost: number;
  companyBorneOrderCosts: number;
  costLines: { categoryName: string; amount: number }[];
  totalCost: number;
  expenseLines: { categoryName: string; amount: number }[];
  totalExpense: number;
  netProfit: number;
};

export async function computeProfitLossForMonth(
  yearMonth: string
): Promise<ProfitLossReport> {
  const { start, end } = monthRange(yearMonth);

  const orders = await db
    .select()
    .from(freightOrders)
    .where(and(gte(freightOrders.orderDate, start), lt(freightOrders.orderDate, end)));
  const freightRevenue = orders.reduce((s, o) => s + toNumber(o.freightAmount), 0);
  const companyBorneOrderCosts = orders
    .filter((o) => o.costBearer === "company")
    .reduce((s, o) => s + toNumber(o.otherDeduction), 0);

  const incomeRows = await db
    .select()
    .from(otherIncome)
    .where(and(gte(otherIncome.incomeDate, start), lt(otherIncome.incomeDate, end)));
  const otherIncomeTotal = incomeRows.reduce((s, r) => s + toNumber(r.amount), 0);

  const payroll = await computePayrollForMonth(yearMonth);
  const driverPayrollCost = payroll.reduce((s, l) => s + l.grossPay, 0);

  const expenseLinesRaw = await getExpensesForMonth(yearMonth);
  const costLinesMap = new Map<string, number>();
  const expenseLinesMap = new Map<string, number>();
  for (const l of expenseLinesRaw) {
    const target = l.categoryType === "成本" ? costLinesMap : expenseLinesMap;
    target.set(l.categoryName, (target.get(l.categoryName) ?? 0) + l.amount);
  }
  const costLines = Array.from(costLinesMap.entries()).map(([categoryName, amount]) => ({
    categoryName,
    amount,
  }));
  const expenseLines = Array.from(expenseLinesMap.entries()).map(
    ([categoryName, amount]) => ({ categoryName, amount })
  );

  const totalCost =
    costLines.reduce((s, l) => s + l.amount, 0) +
    driverPayrollCost +
    companyBorneOrderCosts;
  const totalExpense = expenseLines.reduce((s, l) => s + l.amount, 0);
  const totalRevenue = freightRevenue + otherIncomeTotal;
  const netProfit = totalRevenue - totalCost - totalExpense;

  return {
    yearMonth,
    freightRevenue,
    otherIncomeTotal,
    totalRevenue,
    driverPayrollCost,
    companyBorneOrderCosts,
    costLines,
    totalCost,
    expenseLines,
    totalExpense,
    netProfit,
  };
}
