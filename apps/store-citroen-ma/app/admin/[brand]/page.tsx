// /admin/[brand] — dashboard home: KPIs, mini funnel, recent activity.

import Link from "next/link";
import { ArrowUpRight, MessageSquare, Mic2, TrendingUp, Users } from "lucide-react";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Conversation, Lead } from "@/lib/supabase/database.types";
import { TimeSeriesChart } from "@/components/admin/charts/TimeSeriesChart";
import { FunnelBars } from "@/components/admin/charts/FunnelBars";
import { ConversationStatusPill } from "@/components/admin/ConversationStatusPill";

export const dynamic = "force-dynamic";

export default async function BrandDashboard({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;
  const accent = brand.primary_color ?? "#6366f1";

  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [{ data: convData30d }, { data: convData7d }, { data: leadData }] = await Promise.all([
    supa.from("conversations").select("*").eq("brand_id", brand.id).gte("started_at", since30d).order("started_at", { ascending: false }),
    supa.from("conversations").select("*").eq("brand_id", brand.id).gte("started_at", since7d),
    supa.from("leads").select("*").eq("brand_id", brand.id).order("created_at", { ascending: false }).limit(8),
  ]);

  const convs30d = (convData30d as unknown as Conversation[]) ?? [];
  const convs7d = (convData7d as unknown as Conversation[]) ?? [];
  const leads = (leadData as unknown as Lead[]) ?? [];

  const total30 = convs30d.length;
  const leads30 = convs30d.filter((c) => c.status === "closed_lead").length;
  const conv24h = convs30d.filter((c) => c.started_at >= since24h).length;
  const conversion = total30 > 0 ? (leads30 / total30) * 100 : 0;

  const last30Days = buildDailySeries(convs30d, 30);
  const funnelSteps = [
    { label: "Started", count: total30 },
    { label: "Usage", count: convs30d.filter((c) => c.reached_usage).length },
    { label: "Budget", count: convs30d.filter((c) => c.reached_budget).length },
    { label: "Reco", count: convs30d.filter((c) => c.reached_recommendation).length },
    { label: "Name", count: convs30d.filter((c) => c.captured_name).length },
    { label: "Phone", count: convs30d.filter((c) => c.captured_phone).length },
    { label: "City", count: convs30d.filter((c) => c.captured_city).length },
    { label: "Slot", count: convs30d.filter((c) => c.captured_slot).length },
    { label: "Booked", count: convs30d.filter((c) => c.booked_test_drive).length },
  ];

  const recentConvs = convs30d.slice(0, 8);

  const total7 = convs7d.length;
  const leads7 = convs7d.filter((c) => c.status === "closed_lead").length;
  const voice7 = convs7d.filter((c) => c.channel === "voice").length;
  const conversion7 = total7 > 0 ? (leads7 / total7) * 100 : 0;

  return (
    <div className="px-8 py-8">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <div className="mt-1 text-[12px] text-white/45">{brand.name} · last 30 days</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<MessageSquare size={14} strokeWidth={1.7} />}
          label="Conversations · 30d"
          value={total30.toLocaleString()}
          delta={conv24h > 0 ? `${conv24h} in last 24h` : null}
          accent={accent}
        />
        <KpiCard
          icon={<Users size={14} strokeWidth={1.7} />}
          label="Leads captured"
          value={leads30.toLocaleString()}
          delta={leads7 > 0 ? `${leads7} this week` : null}
          accent="#10b981"
        />
        <KpiCard
          icon={<TrendingUp size={14} strokeWidth={1.7} />}
          label="Conversion rate"
          value={`${conversion.toFixed(1)}%`}
          delta={total7 > 0 ? `${conversion7.toFixed(1)}% this week` : null}
          accent={accent}
        />
        <KpiCard
          icon={<Mic2 size={14} strokeWidth={1.7} />}
          label="Voice share · 7d"
          value={total7 > 0 ? `${Math.round((voice7 / total7) * 100)}%` : "—"}
          delta={`${voice7} voice / ${total7 - voice7} chat`}
          accent="#8b5cf6"
        />
      </div>

      {/* Time series + funnel */}
      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHead title="Conversations · daily" subtitle="Started vs. converted to lead" />
          <TimeSeriesChart accent={accent} data={last30Days} />
        </Card>
        <Card>
          <CardHead title="Qualification funnel" subtitle="Last 30 days" />
          <div className="mt-3">
            <FunnelBars steps={funnelSteps} accent={accent} />
          </div>
        </Card>
      </div>

      {/* Recent conversations + recent leads */}
      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHead
            title="Recent conversations"
            subtitle="Latest sessions"
            cta={<Link href={`/admin/${slug}/conversations`} className="inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white">View all <ArrowUpRight size={11} /></Link>}
          />
          <div className="mt-3 divide-y divide-white/[0.05]">
            {recentConvs.map((c) => (
              <Link
                key={c.id}
                href={`/admin/${slug}/conversations/${c.id}`}
                className="flex items-center justify-between gap-3 py-2.5 text-[12px] transition hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px]"
                    style={{ background: c.channel === "voice" ? "#8b5cf61f" : `${accent}1f`, color: c.channel === "voice" ? "#a78bfa" : accent }}
                  >
                    {c.channel === "voice" ? <Mic2 size={12} /> : <MessageSquare size={12} />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-white/85">
                      {c.lead_name ? c.lead_name : "Anonymous"}
                      <span className="ms-2 text-[10px] uppercase tracking-[0.16em] text-white/35">{c.locale}</span>
                    </div>
                    <div className="text-[10.5px] text-white/35">
                      {new Date(c.started_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                </div>
                <ConversationStatusPill status={c.status} />
              </Link>
            ))}
            {recentConvs.length === 0 && (
              <div className="py-6 text-center text-[11px] text-white/30">No conversations yet.</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Recent leads"
            subtitle="Latest captured leads"
            cta={<Link href={`/admin/${slug}/leads`} className="inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white">All leads <ArrowUpRight size={11} /></Link>}
          />
          <div className="mt-3 divide-y divide-white/[0.05]">
            {leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-[12px]">
                <div>
                  <div className="text-white/90">{l.first_name}</div>
                  <div className="text-[10.5px] text-white/35">
                    {l.phone}{l.city ? ` · ${l.city}` : ""}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-[11px] text-white/70">{l.model_slug}</div>
                  <div className="text-[10px] text-white/30">
                    {new Date(l.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </div>
                </div>
              </div>
            ))}
            {leads.length === 0 && (
              <div className="py-6 text-center text-[11px] text-white/30">No leads yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  delta,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string | null;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -end-10 -top-10 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: accent }}
      />
      <div className="relative flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-white/40">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md" style={{ background: `${accent}22`, color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="relative mt-3 text-2xl font-semibold tabular-nums text-white">{value}</div>
      {delta && <div className="relative mt-1 text-[10.5px] text-white/40">{delta}</div>}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      {children}
    </div>
  );
}

function CardHead({ title, subtitle, cta }: { title: string; subtitle?: string; cta?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-[13px] font-semibold text-white">{title}</div>
        {subtitle && <div className="mt-0.5 text-[11px] text-white/40">{subtitle}</div>}
      </div>
      {cta}
    </div>
  );
}

function buildDailySeries(convs: Conversation[], days: number): Array<{ date: string; total: number; leads: number }> {
  const buckets = new Map<string, { total: number; leads: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { total: 0, leads: 0 });
  }
  for (const c of convs) {
    const key = c.started_at.slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.total += 1;
      if (c.status === "closed_lead") b.leads += 1;
    }
  }
  return [...buckets.entries()].map(([date, v]) => ({ date, total: v.total, leads: v.leads }));
}
