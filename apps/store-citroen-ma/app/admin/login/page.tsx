import Image from "next/image";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080b] px-4 text-white">
      {/* Decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-full ring-2 ring-white/15 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55)]">
            <Image src="/brand/rihla-avatar.jpg" alt="Rihla" fill sizes="56px" className="object-cover" />
          </div>
          <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-white/40">Stellantis · Demo Console</div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-[12.5px] text-white/45">Enter your password to continue.</p>
        </div>

        <form
          action={loginAction}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md shadow-[0_24px_64px_-20px_rgba(0,0,0,0.6)]"
        >
          <label htmlFor="password" className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-white/45">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoFocus
            required
            placeholder="••••••••••••"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
          />
          <input type="hidden" name="next" value={next ?? "/admin"} />

          {error && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-[11.5px] text-red-300">
              Incorrect password.
            </div>
          )}

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0c0c10] shadow-[0_4px_14px_-4px_rgba(255,255,255,0.25)] transition hover:bg-white/90"
          >
            Sign in
          </button>
        </form>

        <div className="mt-5 text-center text-[10.5px] text-white/35">
          Authorized personnel only · single-tenant demo gate
        </div>
      </div>
    </div>
  );
}
