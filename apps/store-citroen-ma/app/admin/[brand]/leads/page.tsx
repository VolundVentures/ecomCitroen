// /admin/[brand]/leads — captured leads with status workflow + CSV export.

import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Lead } from "@/lib/supabase/database.types";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { brand: slug } = await params;
  const sp = await searchParams;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;
  const accent = brand.primary_color ?? "#10b981";

  let q = supa.from("leads").select("*").eq("brand_id", brand.id).order("created_at", { ascending: false });
  if (sp.status) q = q.eq("status", sp.status);
  const { data } = await q;
  const leads = (data as unknown as Lead[]) ?? [];

  const total = leads.length;
  const newCount = leads.filter((l) => l.status === "new").length;
  const contactedCount = leads.filter((l) => l.status === "contacted").length;
  const closedCount = leads.filter((l) => l.status === "closed").length;

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <div className="mt-1 text-[12px] text-white/40">{total.toLocaleString()} captured leads</div>
        </div>
        <a
          href={`/api/admin/${slug}/leads/export${sp.status ? `?status=${sp.status}` : ""}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12px] text-white/85 transition hover:border-white/30 hover:bg-white/[0.07]"
        >
          Export CSV ↓
        </a>
      </div>

      {/* Status pills as filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterPill href={`/admin/${slug}/leads`} label="All" count={total} active={!sp.status} accent={accent} />
        <FilterPill href={`/admin/${slug}/leads?status=new`} label="New" count={newCount} active={sp.status === "new"} accent="#3b82f6" />
        <FilterPill href={`/admin/${slug}/leads?status=contacted`} label="Contacted" count={contactedCount} active={sp.status === "contacted"} accent="#f59e0b" />
        <FilterPill href={`/admin/${slug}/leads?status=closed`} label="Closed" count={closedCount} active={sp.status === "closed"} accent="#10b981" />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="grid grid-cols-[1fr_140px_1fr_120px_120px_140px_60px] gap-4 border-b border-white/[0.06] px-4 py-2.5 text-[10.5px] uppercase tracking-[0.16em] text-white/40">
          <div>Name</div>
          <div>Phone</div>
          <div>Model</div>
          <div>City</div>
          <div>Slot</div>
          <div>Status</div>
          <div></div>
        </div>
        <div>
          {leads.map((l) => (
            <div
              key={l.id}
              className="grid grid-cols-[1fr_140px_1fr_120px_120px_140px_60px] items-center gap-4 border-b border-white/[0.04] px-4 py-3 text-[12px] text-white/75 last:border-0"
            >
              <div>
                <div className="text-white/90">{l.first_name}</div>
                <div className="text-[10.5px] text-white/35">
                  {new Date(l.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </div>
              </div>
              <div className="font-mono text-[11.5px] text-white/65">{l.phone}</div>
              <div className="text-[12px] text-white/70">{l.model_slug}</div>
              <div className="text-[12px] text-white/55">{l.city ?? "—"}</div>
              <div className="text-[11px] text-white/55">{l.preferred_slot ?? "—"}</div>
              <div>
                <LeadStatusSelect leadId={l.id} status={l.status} />
              </div>
              <div className="text-end">
                <Link
                  href={`/admin/${slug}/conversations/${l.conversation_id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-white/55 transition hover:border-white/30 hover:text-white"
                  title="View conversation"
                >
                  <ArrowUpRight size={11} />
                </Link>
              </div>
            </div>
          ))}
          {leads.length === 0 && (
            <div className="px-4 py-12 text-center text-[12px] text-white/30">
              No leads {sp.status ? `with status “${sp.status}”` : "yet"}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  href,
  label,
  count,
  active,
  accent,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] transition ${
        active
          ? "text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "border border-white/10 bg-white/[0.025] text-white/60 hover:border-white/20 hover:text-white"
      }`}
      style={active ? { background: `${accent}26` } : {}}
    >
      <span>{label}</span>
      <span
        className="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
        style={active ? { background: accent, color: "white" } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}
      >
        {count}
      </span>
    </Link>
  );
}
