import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);
const COOKIE_NAME = "freight_session";
const PUBLIC_PATHS = ["/login"];

// Paths the restricted "driver" role is allowed to reach.
const DRIVER_ALLOWED_PAGES = ["/my-payroll", "/account"];
const DRIVER_ALLOWED_API_PREFIXES = ["/api/my-payroll", "/api/auth/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let payload: Record<string, unknown> | null = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, SECRET);
      payload = verified.payload as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (payload.role === "driver") {
    const isAllowedPage = DRIVER_ALLOWED_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    const isAllowedApi = DRIVER_ALLOWED_API_PREFIXES.some((p) => pathname.startsWith(p));
    if (!pathname.startsWith("/api") && !isAllowedPage) {
      return NextResponse.redirect(new URL("/my-payroll", req.url));
    }
    if (pathname.startsWith("/api") && !isAllowedApi) {
      return NextResponse.json({ error: "此帳號無此權限" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
