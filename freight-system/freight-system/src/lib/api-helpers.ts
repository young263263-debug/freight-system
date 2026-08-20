import { NextResponse } from "next/server";
import { getSession } from "./auth";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, res: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  }
  return { session, res: null };
}

/** Admin/accountant only — blocks the restricted "driver" role from staff endpoints. */
export async function requireStaff() {
  const session = await getSession();
  if (!session) {
    return { session: null, res: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  }
  if (session.role === "driver") {
    return { session: null, res: NextResponse.json({ error: "此帳號無此權限" }, { status: 403 }) };
  }
  return { session, res: null };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "找不到資料") {
  return NextResponse.json({ error: message }, { status: 404 });
}
