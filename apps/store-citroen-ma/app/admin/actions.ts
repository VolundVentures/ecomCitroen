"use server";

import { redirect } from "next/navigation";
import { clearAuthCookie } from "@/lib/admin-auth";

export async function logoutAction() {
  await clearAuthCookie();
  redirect("/admin/login");
}
