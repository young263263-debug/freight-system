import { NextResponse } from "next/server";
import { getSession } from "./auth";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, res: NextResponse.json({ error: "未登入" }, { status: 401 }) };
  }
  return { session, res: null };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "找不到資料") {
  return NextResponse.json({ error: message }, { status: 404 });
}
