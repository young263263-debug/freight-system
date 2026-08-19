import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin1234";
  const name = process.env.SEED_ADMIN_NAME || "管理者";

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    console.log(`使用者 ${email} 已存在，略過。`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ name, email, passwordHash, role: "admin" });
  console.log(`已建立管理者帳號: ${email} / 密碼: ${password}`);
  console.log("請登入後盡快至「帳號管理」變更密碼或新增其他帳號。");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
