import Image from "next/image";
import { loginAction } from "./actions";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand } from "@/lib/supabase/database.types";
import { LoginAnimated } from "@/components/admin/LoginAnimated";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  // Surface the demo brands as a quiet trust strip below the form.
  let brands: Pick<Brand, "slug" | "name" | "logo_url" | "primary_color">[] = [];
  try {
    const supa = adminClient();
    const { data } = await supa
      .from("brands")
      .select("slug, name, logo_url, primary_color")
      .eq("enabled", true)
      .order("name");
    brands = (data as unknown as typeof brands) ?? [];
  } catch { /* offline; skip */ }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06060a] px-4 text-white">
      {/* Animated background — gradient orbs + grid */}
      <LoginAnimated />

      <div className="relative w-full max-w-[420px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/15 shadow-[0_18px_42px_-12px_rgba(0,0,0,0.65)]">
            <Image src="/brand/rihla-avatar.jpg" alt="Rihla" fill sizes="64px" className="object-cover" priority />
          </div>
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Stellantis · Demo Console
          </div>
          <h1 className="mt-4 text-[26px] font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-[13px] text-white/45">Sign in to manage Rihla, conversations, leads, and prompt versioning.</p>
        </div>

        <form
          action={loginAction}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md shadow-[0_24px_64px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]"
        >
          <label htmlFor="password" className="mb-1.5 block text-[10.5px] uppercase tracking-[0.18em] text-white/45">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoFocus
            required
            placeholder="••••••••••••"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white outline-none transition focus:border-white/30 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.06)]"
          />
          <input type="hidden" name="next" value={next ?? "/admin"} />

          {error && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-[11.5px] text-red-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" /> Incorrect password.
            </div>
          )}

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-[13.5px] font-medium text-[#0c0c10] shadow-[0_4px_14px_-4px_rgba(255,255,255,0.3)] transition hover:bg-white/90"
          >
            Sign in
          </button>
        </form>

        {/* Brand trust strip */}
        {brands.length > 0 && (
          <div className="mt-7">
            <div className="mb-3 text-center text-[10px] uppercase tracking-[0.22em] text-white/30">
              Live demo brands
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {brands.map((b) => (
                <div
                  key={b.slug}
                  className="group relative flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 transition hover:border-white/15 hover:bg-white/[0.05]"
                  title={b.name}
                >
                  {b.logo_url && (
                    <div className="relative h-5 w-5 overflow-hidden rounded-sm bg-white/10 p-0.5">
                      <Image src={b.logo_url} alt={b.name} fill className="object-contain p-0.5" sizes="20px" />
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-white/75">{b.name}</span>
                  {b.primary_color && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: b.primary_color }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 text-center text-[10.5px] text-white/30">
          Authorized personnel only · single-tenant demo gate
        </div>
      </div>
    </div>
  );
}
