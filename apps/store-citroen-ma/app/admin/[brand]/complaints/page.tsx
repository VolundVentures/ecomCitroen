// /admin/[brand]/complaints — complaint (réclamation) list with CRC status
// workflow. Customer-care-facing — these are the tickets the CRC qualifies
// and routes to concerned dealers.

import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Complaint, ComplaintStatus } from "@/lib/supabase/database.types";
import { ComplaintStatusSelect } from "@/components/admin/ComplaintStatusSelect";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage({
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
  const accent = brand.primary_color ?? "#ef4444";

  let q = supa
    .from("complaints")
    .select("*")
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false });
  if (sp.status) q = q.eq("status", sp.status);
  const { data } = await q;
  const complaints = (data as unknown as Complaint[]) ?? [];

  const total = complaints.length;
  const counts = (s: ComplaintStatus) => complaints.filter((c) => c.status === s).length;

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Complaints</h1>
          <div className="mt-1 text-[12px] text-white/40">
            {total.toLocaleString()} complaint{total === 1 ? "" : "s"} · sorted by newest first
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterPill href={`/admin/${slug}/complaints`} label="All" count={total} active={!sp.status} accent={accent} />
        <FilterPill href={`/admin/${slug}/complaints?status=new`} label="New" count={counts("new")} active={sp.status === "new"} accent="#3b82f6" />
        <FilterPill href={`/admin/${slug}/complaints?status=qualified`} label="Qualified" count={counts("qualified")} active={sp.status === "qualified"} accent="#a855f7" />
        <FilterPill href={`/admin/${slug}/complaints?status=assigned`} label="Assigned" count={counts("assigned")} active={sp.status === "assigned"} accent="#f59e0b" />
        <FilterPill href={`/admin/${slug}/complaints?status=in_progress`} label="In progress" count={counts("in_progress")} active={sp.status === "in_progress"} accent="#06b6d4" />
        <FilterPill href={`/admin/${slug}/complaints?status=resolved`} label="Resolved" count={counts("resolved")} active={sp.status === "resolved"} accent="#10b981" />
        <FilterPill href={`/admin/${slug}/complaints?status=closed_no_resolution`} label="Closed unresolved" count={counts("closed_no_resolution")} active={sp.status === "closed_no_resolution"} accent="#ef4444" />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="grid grid-cols-[120px_1fr_140px_140px_1fr_140px_60px] gap-4 border-b border-white/[0.06] px-4 py-2.5 text-[10.5px] uppercase tracking-[0.16em] text-white/40">
          <div>Ref</div>
          <div>Customer</div>
          <div>Vehicle</div>
          <div>Phone</div>
          <div>Reason</div>
          <div>Status</div>
          <div></div>
        </div>
        <div>
          {complaints.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[120px_1fr_140px_140px_1fr_140px_60px] items-center gap-4 border-b border-white/[0.04] px-4 py-3 text-[12px] text-white/75 last:border-0"
            >
              <Link href={`/admin/${slug}/complaints/${c.id}`} className="font-mono text-[11px] text-white/85 hover:underline">
                {c.ref_number}
              </Link>
              <div>
                <div className="text-white/90">{c.full_name}</div>
                <div className="text-[10.5px] text-white/35">
                  {new Date(c.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
              <div>
                <div className="truncate text-white/80">{c.vehicle_brand} {c.vehicle_model}</div>
                <div className="font-mono text-[10px] text-white/35">{c.vin}</div>
              </div>
              <div className="font-mono text-[11.5px] text-white/65">{c.phone}</div>
              <div className="line-clamp-2 text-[11.5px] text-white/65">{c.reason}</div>
              <div>
                <ComplaintStatusSelect complaintId={c.id} status={c.status} />
              </div>
              <div className="text-end">
                {c.conversation_id && (
                  <Link
                    href={`/admin/${slug}/conversations/${c.conversation_id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-white/55 transition hover:border-white/30 hover:text-white"
                    title="View conversation"
                  >
                    <ArrowUpRight size={11} />
                  </Link>
                )}
              </div>
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="px-4 py-12 text-center text-[12px] text-white/30">
              No complaints {sp.status ? `with status “${sp.status}”` : "yet"}.
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
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] transition ${
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
