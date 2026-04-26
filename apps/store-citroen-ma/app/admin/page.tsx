// /admin — landing. Brand picker with cross-brand stats.

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Conversation } from "@/lib/supabase/database.types";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supa = adminClient();
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [{ data: brandsData }, { data: convsData }] = await Promise.all([
    supa.from("brands").select("*").eq("enabled", true).order("name"),
    supa.from("conversations").select("brand_id, status").gte("started_at", since30),
  ]);
  const brands = (brandsData as unknown as Brand[]) ?? [];
  const convs = (convsData as unknown as Pick<Conversation, "brand_id" | "status">[]) ?? [];

  const statsByBrand = new Map<string, { total: number; leads: number }>();
  for (const c of convs) {
    const cur = statsByBrand.get(c.brand_id) ?? { total: 0, leads: 0 };
    cur.total += 1;
    if (c.status === "closed_lead") cur.leads += 1;
    statsByBrand.set(c.brand_id, cur);
  }

  const totalConv = convs.length;
  const totalLeads = convs.filter((c) => c.status === "closed_lead").length;
  const conversion = totalConv > 0 ? (totalLeads / totalConv) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#08080b] text-white">
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#08080b]/80 px-8 py-3.5 backdrop-blur">
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">Stellantis · Demo Console</div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Powered by Rihla</div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="rounded-full border border-transparent px-3 py-1.5 text-[11px] text-white/40 transition hover:text-white">
            Sign out
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-12">
        {/* Cross-brand summary */}
        <div className="mb-10">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Last 30 days · all brands</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back.</h1>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Brands live" value={brands.length.toString()} />
            <SummaryStat label="Conversations" value={totalConv.toLocaleString()} />
            <SummaryStat label="Leads captured" value={totalLeads.toLocaleString()} />
            <SummaryStat label="Conversion" value={`${conversion.toFixed(1)}%`} />
          </div>
        </div>

        <h2 className="text-[10px] uppercase tracking-[0.22em] text-white/40">Brands</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => {
            const s = statsByBrand.get(b.id) ?? { total: 0, leads: 0 };
            const accent = b.primary_color ?? "#6366f1";
            return (
              <Link
                key={b.id}
                href={`/admin/${b.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-white/30 hover:bg-white/[0.05]"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition group-hover:opacity-30"
                  style={{ background: accent }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {b.logo_url ? (
                      <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-white/10 p-1.5">
                        <Image src={b.logo_url} alt={b.name} fill className="object-contain p-1.5" sizes="44px" />
                      </div>
                    ) : (
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-base font-bold text-white"
                        style={{ background: accent }}
                      >
                        {b.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="text-[14px] font-semibold">{b.name}</div>
                      <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">{b.market}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} strokeWidth={2} className="mt-1.5 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white" />
                </div>

                <div className="relative mt-5 flex items-end gap-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Convos · 30d</div>
                    <div className="mt-0.5 text-xl font-semibold tabular-nums">{s.total}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Leads</div>
                    <div className="mt-0.5 text-xl font-semibold tabular-nums">{s.leads}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Rate</div>
                    <div className="mt-0.5 text-xl font-semibold tabular-nums">
                      {s.total > 0 ? `${((s.leads / s.total) * 100).toFixed(0)}%` : "—"}
                    </div>
                  </div>
                </div>

                <div className="relative mt-4 flex flex-wrap gap-1.5">
                  {b.locales.map((l) => (
                    <span
                      key={l}
                      className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/60"
                    >
                      {l}
                    </span>
                  ))}
                </div>

                <div className="relative mt-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: accent }}>
                    Open dashboard <ArrowRight size={11} className="transition group-hover:translate-x-1" />
                  </span>
                  {/* The demo link sits inside a card-Link, so we use the same Link click here.
                      Stellantis demos always want the dashboard first. The "↗ Demo" pill below the cards
                      provides direct access. */}
                </div>
              </Link>
            );
          })}
          {brands.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
              No brands found. Run <code className="rounded bg-white/10 px-1.5 py-0.5">pnpm tsx scripts/seed-supabase.ts</code> to seed.
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/40">
            <Users size={11} strokeWidth={1.7} /> Quick demos
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {brands.map((b) => (
              <a
                key={b.slug}
                href={`/demo/${b.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[12px] text-white/80 transition hover:border-white/30 hover:bg-white/[0.07]"
              >
                ↗ {b.name}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
