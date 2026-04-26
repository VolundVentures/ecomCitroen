// Single shared password for the demo admin gate. The browser sends
// `admin_session` cookie with a constant value once authenticated.
//
// This is intentionally minimal — for an exec demo, not for production.

import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "admin_session";

function expected(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) throw new Error("ADMIN_PASSWORD missing in env");
  return createHash("sha256").update(pwd).digest("hex");
}

export function checkPassword(input: string): boolean {
  if (!input) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(process.env.ADMIN_PASSWORD ?? "").digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const c = await cookies();
    const v = c.get(ADMIN_COOKIE)?.value;
    return v === expected();
  } catch {
    return false;
  }
}

export async function setAuthCookie() {
  const c = await cookies();
  c.set(ADMIN_COOKIE, expected(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookie() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}
