import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c10] px-4 text-white">
      <form action={loginAction} className="w-full max-w-sm space-y-4 rounded-2xl bg-white/5 p-8 backdrop-blur">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Admin</div>
          <h1 className="mt-1 text-2xl font-medium">Sign in</h1>
        </div>
        <input
          name="password"
          type="password"
          autoFocus
          placeholder="Password"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
        />
        <input type="hidden" name="next" value={next ?? "/admin"} />
        {error && <div className="text-[12px] text-red-400">Incorrect password.</div>}
        <button
          type="submit"
          className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0c0c10] transition hover:bg-white/90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
