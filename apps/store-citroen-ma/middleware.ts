import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const ADMIN_COOKIE = "admin_session";

function expectedHash(): string | null {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return null;
  return createHash("sha256").update(pwd).digest("hex");
}

function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin gate.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      return NextResponse.next();
    }
    const expected = expectedHash();
    const got = req.cookies.get(ADMIN_COOKIE)?.value ?? "";
    if (!expected || !safeEquals(got, expected)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Widget + demo routes don't need next-intl.
  if (pathname.startsWith("/w/") || pathname.startsWith("/demo/")) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
