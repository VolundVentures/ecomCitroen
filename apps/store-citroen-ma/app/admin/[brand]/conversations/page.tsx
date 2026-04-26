import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Conversation } from "@/lib/supabase/database.types";
import { ConversationStatusPill } from "@/components/admin/ConversationStatusPill";
import { ConversationFilters } from "@/components/admin/ConversationFilters";
import { Mic2, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SP = {
  status?: string;
  channel?: string;
  locale?: string;
  range?: string; // "24h" | "7d" | "30d" | "90d"
  q?: string;
  page?: string;
};

function rangeStart(range?: string): string | null {
  const now = Date.now();
  const map: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };
  const days = map[range ?? ""];
  return days ? new Date(now - days * 24 * 3600 * 1000).toISOString() : null;
}

export default async function ConversationsList({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<SP>;
}) {
  const { brand: slug } = await params;
  const sp = await searchParams;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;

  const page = Math.max(1, Number(sp.page ?? "1"));
  const fromIdx = (page - 1) * PAGE_SIZE;
  const toIdx = fromIdx + PAGE_SIZE - 1;

  let q = supa
    .from("conversations")
    .select("*", { count: "exact" })
    .eq("brand_id", brand.id)
    .order("started_at", { ascending: false })
    .range(fromIdx, toIdx);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.channel) q = q.eq("channel", sp.channel);
  if (sp.locale) q = q.eq("locale", sp.locale);
  const since = rangeStart(sp.range);
  if (since) q = q.gte("started_at", since);
  if (sp.q && sp.q.trim()) {
    const search = sp.q.trim();
    q = q.or(`lead_name.ilike.%${search}%,lead_phone.ilike.%${search}%,lead_city.ilike.%${search}%,lead_model_slug.ilike.%${search}%`);
  }
  const { data, count } = await q;
  const list = (data as unknown as Conversation[]) ?? [];
  const total = count ?? list.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Get distinct locales for the filter dropdown.
  const localeSet = brand.locales as string[];

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
          <div className="mt-1 text-[12px] text-white/40">
            {total.toLocaleString()} total · page {page} of {totalPages}
          </div>
        </div>
      </div>

      <ConversationFilters slug={slug} sp={sp} locales={localeSet} accent={brand.primary_color ?? "#6366f1"} />

      <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="grid grid-cols-[1fr_70px_70px_90px_1.6fr_70px] gap-4 border-b border-white/[0.06] px-4 py-2.5 text-[10.5px] uppercase tracking-[0.16em] text-white/40">
          <div>Started</div>
          <div>Channel</div>
          <div>Locale</div>
          <div>Status</div>
          <div>Lead</div>
          <div className="text-end">Duration</div>
        </div>
        <div>
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/admin/${slug}/conversations/${c.id}`}
              className="grid grid-cols-[1fr_70px_70px_90px_1.6fr_70px] items-center gap-4 border-b border-white/[0.04] px-4 py-3 text-[12px] text-white/75 transition last:border-0 hover:bg-white/[0.03]"
            >
              <div>
                <div className="text-white/85">{new Date(c.started_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</div>
                <div className="text-[10.5px] text-white/35">{c.id.slice(0, 8)}…</div>
              </div>
              <div className="flex items-center gap-1.5 text-white/70">
                {c.channel === "voice" ? <Mic2 size={12} className="text-violet-300" /> : <MessageSquare size={12} className="text-white/50" />}
                <span className="text-[11px] capitalize">{c.channel}</span>
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/55">{c.locale}</div>
              <div><ConversationStatusPill status={c.status} /></div>
              <div className="min-w-0">
                {c.lead_name ? (
                  <div className="truncate">
                    <span className="text-white/85">{c.lead_name}</span>
                    <span className="text-white/35"> · {c.lead_phone}</span>
                    {c.lead_model_slug && <span className="text-white/40"> · {c.lead_model_slug}</span>}
                  </div>
                ) : (
                  <span className="text-white/30">—</span>
                )}
              </div>
              <div className="text-end text-[11px] tabular-nums text-white/55">
                {c.duration_seconds != null
                  ? `${Math.floor(c.duration_seconds / 60)}m ${c.duration_seconds % 60}s`
                  : "—"}
              </div>
            </Link>
          ))}
          {list.length === 0 && (
            <div className="px-4 py-12 text-center text-[12px] text-white/30">No conversations match your filters.</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination slug={slug} sp={sp} page={page} totalPages={totalPages} />
      )}
    </div>
  );
}

function Pagination({
  slug,
  sp,
  page,
  totalPages,
}: {
  slug: string;
  sp: SP;
  page: number;
  totalPages: number;
}) {
  const buildUrl = (n: number) => {
    const params = new URLSearchParams();
    if (sp.status) params.set("status", sp.status);
    if (sp.channel) params.set("channel", sp.channel);
    if (sp.locale) params.set("locale", sp.locale);
    if (sp.range) params.set("range", sp.range);
    if (sp.q) params.set("q", sp.q);
    params.set("page", String(n));
    return `/admin/${slug}/conversations?${params.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-[12px]">
      <div className="text-white/40">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link href={buildUrl(page - 1)} className="rounded-md border border-white/10 px-3 py-1.5 text-white/70 transition hover:border-white/30 hover:text-white">← Previous</Link>
        )}
        {page < totalPages && (
          <Link href={buildUrl(page + 1)} className="rounded-md border border-white/10 px-3 py-1.5 text-white/70 transition hover:border-white/30 hover:text-white">Next →</Link>
        )}
      </div>
    </div>
  );
}
