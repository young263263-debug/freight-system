import {
  pgTable,
  serial,
  text,
  varchar,
  numeric,
  boolean,
  date,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const costBearerEnum = pgEnum("cost_bearer", ["driver", "company"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "匯款",
  "支票",
  "現金",
  "其他",
]);
export const expenseTypeEnum = pgEnum("expense_type", ["成本", "費用"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "accountant"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  idNumber: varchar("id_number", { length: 50 }),
  baseSalary: numeric("base_salary", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 4 })
    .notNull()
    .default("0"),
  defaultCostBearer: costBearerEnum("default_cost_bearer")
    .notNull()
    .default("driver"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const driverRecurringDeductions = pgTable("driver_recurring_deductions", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // e.g. 勞保, 健保
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  contact: varchar("contact", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const freightOrders = pgTable("freight_orders", {
  id: serial("id").primaryKey(),
  orderDate: date("order_date").notNull(),
  driverId: integer("driver_id")
    .notNull()
    .references(() => drivers.id),
  customerId: integer("customer_id").references(() => customers.id),
  itemDescription: text("item_description"),
  freightAmount: numeric("freight_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  invoiceTaxDeduction: numeric("invoice_tax_deduction", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  interestDeduction: numeric("interest_deduction", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  otherDeduction: numeric("other_deduction", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  costBearer: costBearerEnum("cost_bearer").notNull().default("driver"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: expenseTypeEnum("type").notNull().default("費用"),
  notes: text("notes"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseDate: date("expense_date").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => expenseCategories.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringDay: integer("recurring_day"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accountsReceivable = pgTable("accounts_receivable", {
  id: serial("id").primaryKey(),
  freightOrderId: integer("freight_order_id").references(
    () => freightOrders.id,
    { onDelete: "set null" }
  ),
  customerId: integer("customer_id").references(() => customers.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method")
    .notNull()
    .default("匯款"),
  isPaid: boolean("is_paid").notNull().default(false),
  paidDate: date("paid_date"),
  dueDate: date("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const otherIncome = pgTable("other_income", {
  id: serial("id").primaryKey(),
  incomeDate: date("income_date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
