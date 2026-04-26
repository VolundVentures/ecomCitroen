"use server";

import { redirect } from "next/navigation";
import { checkPassword, setAuthCookie } from "@/lib/admin-auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  if (!checkPassword(password)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  await setAuthCookie();
  redirect(next || "/admin");
}
