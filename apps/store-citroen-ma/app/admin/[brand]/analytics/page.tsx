// /admin/[brand]/analytics — funnel, channel split, locales, hour-of-day, top models.

import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Conversation, Lead } from "@/lib/supabase/database.types";
import { TimeSeriesChart } from "@/components/admin/charts/TimeSeriesChart";
import { FunnelBars } from "@/components/admin/charts/FunnelBars";
import { HourHeatmap } from "@/components/admin/charts/HourHeatmap";
import { ChannelDonut } from "@/components/admin/charts/ChannelDonut";

export const dynamic = "force-dynamic";

type SP = { range?: string };

function rangeDays(range?: string): number {
  const m: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  return m[range ?? ""] ?? 30;
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<SP>;
}) {
  const { brand: slug } = await params;
  const sp = await searchParams;
  const days = rangeDays(sp.range);
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;
  const accent = brand.primary_color ?? "#6366f1";

  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const [{ data: convData }, { data: leadData }] = await Promise.all([
    supa.from("conversations").select("*").eq("brand_id", brand.id).gte("started_at", since),
    supa.from("leads").select("*").eq("brand_id", brand.id).gte("created_at", since),
  ]);
  const convs = (convData as unknown as Conversation[]) ?? [];
  const leads = (leadData as unknown as Lead[]) ?? [];

  const total = convs.length;
  const leadsCount = convs.filter((c) => c.status === "closed_lead").length;
  const voice = convs.filter((c) => c.channel === "voice").length;
  const chat = convs.filter((c) => c.channel === "chat").length;
  const conversion = total > 0 ? (leadsCount / total) * 100 : 0;

  // Daily series
  const series = buildDailySeries(convs, days);

  // Funnel
  const funnel = [
    { label: "Started", count: total },
    { label: "Usage", count: convs.filter((c) => c.reached_usage).length },
    { label: "Budget", count: convs.filter((c) => c.reached_budget).length },
    { label: "Reco", count: convs.filter((c) => c.reached_recommendation).length },
    { label: "Name", count: convs.filter((c) => c.captured_name).length },
    { label: "Phone", count: convs.filter((c) => c.captured_phone).length },
    { label: "City", count: convs.filter((c) => c.captured_city).length },
    { label: "Slot", count: convs.filter((c) => c.captured_slot).length },
    { label: "Booked", count: convs.filter((c) => c.booked_test_drive).length },
  ];

  // Locale split
  const localeMap = new Map<string, number>();
  for (const c of convs) localeMap.set(c.locale, (localeMap.get(c.locale) ?? 0) + 1);
  const localeRows = [...localeMap.entries()].sort((a, b) => b[1] - a[1]);

  // Top models (from leads)
  const modelMap = new Map<string, number>();
  for (const l of leads) modelMap.set(l.model_slug, (modelMap.get(l.model_slug) ?? 0) + 1);
  const modelRows = [...modelMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Hour-of-day heatmap (UTC for now)
  const hours = new Array(24).fill(0) as number[];
  for (const c of convs) hours[new Date(c.started_at).getUTCHours()]! += 1;

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <div className="mt-1 text-[12px] text-white/40">{brand.name} · last {days} days</div>
        </div>
        <RangeSelector slug={slug} current={sp.range ?? "30d"} accent={accent} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Conversations" value={total.toLocaleString()} accent={accent} />
        <Stat label="Leads" value={leadsCount.toLocaleString()} accent="#10b981" />
        <Stat label="Conversion" value={`${conversion.toFixed(1)}%`} accent={accent} />
        <Stat label="Voice / Chat" value={`${voice} / ${chat}`} accent="#8b5cf6" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Conversations · daily" subtitle="Started vs. converted to lead">
          <TimeSeriesChart accent={accent} data={series} />
        </Card>
        <Card title="Channel split" subtitle="Chat vs voice">
          <ChannelDonut chat={chat} voice={voice} accent={accent} />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr]">
        <Card title="Qualification funnel" subtitle={`${days}-day window`}>
          <div className="mt-3"><FunnelBars steps={funnel} accent={accent} /></div>
        </Card>
        <Card title="Hour-of-day activity" subtitle="UTC">
          <HourHeatmap hours={hours} accent={accent} />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Top models" subtitle="Models with most leads">
          <div className="mt-3 space-y-2">
            {modelRows.map(([slug, c]) => {
              const max = Math.max(1, ...modelRows.map(([, x]) => x));
              return (
                <div key={slug} className="flex items-center gap-3 text-[12px]">
                  <div className="w-32 truncate text-white/65">{slug}</div>
                  <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
                    <div className="absolute inset-y-0 start-0 rounded-md" style={{ width: `${(c / max) * 100}%`, background: `linear-gradient(90deg, ${accent}cc 0%, ${accent}88 100%)` }} />
                  </div>
                  <div className="w-10 text-end tabular-nums text-white/85">{c}</div>
                </div>
              );
            })}
            {modelRows.length === 0 && <div className="py-4 text-center text-[12px] text-white/35">No leads yet.</div>}
          </div>
        </Card>
        <Card title="Locale split" subtitle="Conversations by language">
          <div className="mt-3 space-y-2">
            {localeRows.map(([loc, c]) => {
              const pct = total > 0 ? (c / total) * 100 : 0;
              return (
                <div key={loc} className="flex items-center gap-3 text-[12px]">
                  <div className="w-24 text-white/65">{loc}</div>
                  <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
                    <div className="absolute inset-y-0 start-0 rounded-md bg-blue-400/55" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-10 text-end tabular-nums text-white/85">{c}</div>
                  <div className="w-12 text-end text-[10.5px] tabular-nums text-white/40">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
            {localeRows.length === 0 && <div className="py-4 text-center text-[12px] text-white/35">No data.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div aria-hidden className="absolute -end-12 -top-10 h-28 w-28 rounded-full opacity-30 blur-2xl" style={{ background: accent }} />
      <div className="relative text-[10.5px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="relative mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        {subtitle && <div className="mt-0.5 text-[11px] text-white/40">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function RangeSelector({ slug, current, accent }: { slug: string; current: string; accent: string }) {
  const items = [
    { id: "7d", label: "7 days" },
    { id: "30d", label: "30 days" },
    { id: "90d", label: "90 days" },
  ];
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.025] p-0.5">
      {items.map((it) => {
        const active = current === it.id;
        return (
          <a
            key={it.id}
            href={`/admin/${slug}/analytics?range=${it.id}`}
            className={`rounded-full px-3 py-1 text-[11.5px] font-medium transition ${active ? "text-white" : "text-white/55 hover:text-white/80"}`}
            style={active ? { background: accent } : {}}
          >
            {it.label}
          </a>
        );
      })}
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
