import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Conversation } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function AnalyticsDashboard({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;

  const { data: convData } = await supa
    .from("conversations")
    .select("*")
    .eq("brand_id", brand.id)
    .gte("started_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
  const convs = (convData as unknown as Conversation[]) ?? [];

  const total = convs.length;
  const leads = convs.filter((c) => c.status === "closed_lead").length;
  const voice = convs.filter((c) => c.channel === "voice").length;
  const chat = convs.filter((c) => c.channel === "chat").length;
  const conversionPct = total > 0 ? ((leads / total) * 100).toFixed(1) : "0.0";

  // Funnel — % of conversations that reached each step.
  const funnel = [
    { label: "Started", count: total },
    { label: "Usage", count: convs.filter((c) => c.reached_usage).length },
    { label: "Budget", count: convs.filter((c) => c.reached_budget).length },
    { label: "Recommendation", count: convs.filter((c) => c.reached_recommendation).length },
    { label: "Name", count: convs.filter((c) => c.captured_name).length },
    { label: "Mobile", count: convs.filter((c) => c.captured_phone).length },
    { label: "City", count: convs.filter((c) => c.captured_city).length },
    { label: "Slot", count: convs.filter((c) => c.captured_slot).length },
    { label: "Booked", count: convs.filter((c) => c.booked_test_drive).length },
  ];

  // Locale breakdown
  const localeCount = new Map<string, number>();
  for (const c of convs) localeCount.set(c.locale, (localeCount.get(c.locale) ?? 0) + 1);
  const localeRows = [...localeCount.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h2 className="mb-6 text-lg font-medium">Analytics — last 30 days</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Conversations" value={total.toString()} />
        <Stat label="Leads" value={leads.toString()} />
        <Stat label="Conversion" value={`${conversionPct}%`} />
        <Stat label="Voice / Chat" value={`${voice} / ${chat}`} />
      </div>

      <h3 className="mt-12 mb-4 text-[11px] uppercase tracking-[0.18em] text-white/40">Qualification funnel</h3>
      <div className="overflow-hidden rounded-xl border border-white/10">
        {funnel.map((step, i) => {
          const pct = total > 0 ? (step.count / total) * 100 : 0;
          const dropoff = i > 0 ? (funnel[i - 1]!.count > 0 ? ((funnel[i - 1]!.count - step.count) / funnel[i - 1]!.count) * 100 : 0) : 0;
          return (
            <div key={step.label} className="flex items-center gap-4 border-b border-white/5 px-4 py-3 last:border-0">
              <div className="w-32 text-[12px] text-white/70">{step.label}</div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className="absolute inset-y-0 start-0 rounded-full bg-emerald-400/70" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-20 text-end text-[12px] tabular-nums text-white/60">{step.count}</div>
              <div className="w-16 text-end text-[11px] tabular-nums text-white/40">{pct.toFixed(0)}%</div>
              <div className="w-20 text-end text-[11px] tabular-nums text-orange-300/70">
                {i > 0 && dropoff > 0 ? `−${dropoff.toFixed(0)}%` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="mt-12 mb-4 text-[11px] uppercase tracking-[0.18em] text-white/40">Locale split</h3>
      <div className="overflow-hidden rounded-xl border border-white/10">
        {localeRows.map(([loc, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={loc} className="flex items-center gap-4 border-b border-white/5 px-4 py-3 last:border-0">
              <div className="w-32 text-[12px] text-white/70">{loc}</div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className="absolute inset-y-0 start-0 rounded-full bg-blue-400/70" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-16 text-end text-[12px] tabular-nums text-white/60">{count}</div>
              <div className="w-12 text-end text-[11px] tabular-nums text-white/40">{pct.toFixed(0)}%</div>
            </div>
          );
        })}
        {localeRows.length === 0 && (
          <div className="px-4 py-8 text-center text-[12px] text-white/40">No conversations yet.</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-2 text-2xl font-medium tabular-nums">{value}</div>
    </div>
  );
}
