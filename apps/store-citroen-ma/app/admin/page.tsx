// /admin — landing. Lists all enabled brands and routes to per-brand admin tabs.

import Link from "next/link";
import Image from "next/image";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand } from "@/lib/supabase/database.types";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supa = adminClient();
  const { data } = await supa.from("brands").select("*").eq("enabled", true).order("name");
  const brands = (data as unknown as Brand[]) ?? [];
  return (
    <div className="min-h-screen bg-[#0c0c10] text-white">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Admin</div>
          <h1 className="text-lg font-medium">Demo Console</h1>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-[12px] text-white/40 hover:text-white">Sign out</button>
        </form>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-white/50">Brands</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/admin/${b.slug}/conversations`}
              className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                {b.logo_url && (
                  <div className="relative h-10 w-10 overflow-hidden rounded-md bg-white/10 p-1">
                    <Image src={b.logo_url} alt={b.name} fill className="object-contain p-1" sizes="40px" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="text-[11px] text-white/40">{b.slug} · {b.market}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {b.locales.map((l) => (
                  <span key={l} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">{l}</span>
                ))}
              </div>
              <div className="mt-2 flex gap-2 text-[12px] text-white/40">
                <span className="group-hover:text-white">Conversations →</span>
              </div>
            </Link>
          ))}
          {brands.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
              No brands found. Run <code className="rounded bg-white/10 px-1.5 py-0.5">pnpm tsx scripts/seed-supabase.ts</code> to seed.
            </div>
          )}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DemoLink href="/demo/jeep-ma" label="Jeep Maroc demo" />
          <DemoLink href="/demo/citroen-ma" label="Citroën Maroc demo" />
          <DemoLink href="/demo/peugeot-ksa" label="Peugeot KSA demo" />
        </div>
      </main>
    </div>
  );
}

function DemoLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[12px] text-white/70 transition hover:border-white/30 hover:bg-white/10"
    >
      ↗ {label}
    </a>
  );
}
