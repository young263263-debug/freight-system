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
export const userRoleEnum = pgEnum("user_role", ["admin", "accountant", "driver"]);
export const checkDirectionEnum = pgEnum("check_direction", ["receivable", "payable"]);
export const invoiceDirectionEnum = pgEnum("invoice_direction", ["銷項", "進項"]);
export const companyEntityEnum = pgEnum("company_entity", ["和陞", "和聖"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  driverId: integer("driver_id").references((): any => drivers.id, { onDelete: "set null" }),
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
  isSteelPlateOrder: boolean("is_steel_plate_order").notNull().default(false),
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

// ---------- 車輛管理 ----------

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plateNumber: varchar("plate_number", { length: 30 }).notNull(),
  vehicleType: varchar("vehicle_type", { length: 100 }),
  driverId: integer("driver_id").references(() => drivers.id, { onDelete: "set null" }),
  transportCompany: varchar("transport_company", { length: 150 }), // 車行
  insuranceCompany: varchar("insurance_company", { length: 150 }),
  insuranceExpiry: date("insurance_expiry"),
  inspectionDueDate: date("inspection_due_date"), // 驗車日期
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 支票登記簿 ----------

export const checks = pgTable("checks", {
  id: serial("id").primaryKey(),
  checkNumber: varchar("check_number", { length: 50 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }),
  direction: checkDirectionEnum("direction").notNull().default("receivable"), // receivable=收到的支票, payable=公司開出的支票
  counterparty: varchar("counterparty", { length: 150 }), // 對方（付款人或收款人）
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  issueDate: date("issue_date"),
  dueDate: date("due_date").notNull(), // 到期日
  isCashed: boolean("is_cashed").notNull().default(false),
  cashedDate: date("cashed_date"),
  accountsReceivableId: integer("accounts_receivable_id").references(
    () => accountsReceivable.id,
    { onDelete: "set null" }
  ),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 員工管理系統 ----------

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  idNumber: varchar("id_number", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  position: varchar("position", { length: 100 }), // 職稱
  hireDate: date("hire_date"), // 到職日
  monthlySalary: numeric("monthly_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  laborInsuranceAmount: numeric("labor_insurance_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  healthInsuranceAmount: numeric("health_insurance_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  healthInsuranceDependents: integer("health_insurance_dependents").notNull().default(0),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 發票登記 ----------

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceDate: date("invoice_date").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  direction: invoiceDirectionEnum("direction").notNull().default("銷項"), // 銷項=開立給客戶, 進項=供應商開給我們
  companyEntity: companyEntityEnum("company_entity").notNull().default("和陞"),
  counterpartyName: varchar("counterparty_name", { length: 150 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"), // 未稅金額
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 單價表 ----------

export const priceListItems = pgTable("price_list_items", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  itemName: varchar("item_name", { length: 150 }).notNull(), // 路線/品項名稱
  unit: varchar("unit", { length: 50 }), // 單位，例如：車、噸、趟
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 特殊鐵板計價 ----------

export const steelPlatePriceTiers = pgTable("steel_plate_price_tiers", {
  id: serial("id").primaryKey(),
  minSizeCm: numeric("min_size_cm", { precision: 10, scale: 2 }).notNull().default("0"), // 長寬取最大值的下限(cm)
  maxSizeCm: numeric("max_size_cm", { precision: 10, scale: 2 }), // 上限(cm)，留空代表無上限
  unitPricePerKg: numeric("unit_price_per_kg", { precision: 12, scale: 4 }).notNull().default("0"),
  notes: text("notes"),
});

export const steelPlateItems = pgTable("steel_plate_items", {
  id: serial("id").primaryKey(),
  freightOrderId: integer("freight_order_id")
    .notNull()
    .references(() => freightOrders.id, { onDelete: "cascade" }),
  lengthCm: numeric("length_cm", { precision: 10, scale: 2 }).notNull().default("0"),
  widthCm: numeric("width_cm", { precision: 10, scale: 2 }).notNull().default("0"),
  thicknessMm: numeric("thickness_mm", { precision: 10, scale: 2 }).notNull().default("0"),
  weightKg: numeric("weight_kg", { precision: 10, scale: 2 }).notNull().default("0"),
  unitPricePerKg: numeric("unit_price_per_kg", { precision: 12, scale: 4 }).notNull().default("0"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
