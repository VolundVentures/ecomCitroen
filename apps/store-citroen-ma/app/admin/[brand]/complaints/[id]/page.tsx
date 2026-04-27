// /admin/[brand]/complaints/[id] — full detail of one complaint. CRC-facing
// — every field collected by the chatbot, the customer's free-text reason,
// status workflow, internal CRC notes.

import Link from "next/link";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Complaint } from "@/lib/supabase/database.types";
import { ComplaintStatusSelect } from "@/components/admin/ComplaintStatusSelect";

export const dynamic = "force-dynamic";

export default async function ComplaintDetail({
  params,
}: {
  params: Promise<{ brand: string; id: string }>;
}) {
  const { brand: slug, id } = await params;
  const supa = adminClient();

  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand | null;
  if (!brand) notFound();

  const { data: row } = await supa.from("complaints").select("*").eq("id", id).single();
  const c = row as unknown as Complaint | null;
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link href={`/admin/${slug}/complaints`} className="text-[11px] text-white/40 hover:text-white">
        ← Back to complaints
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Reference</div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{c.ref_number}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/40">Status</span>
          <ComplaintStatusSelect complaintId={c.id} status={c.status} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="Created" value={new Date(c.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} />
        <Stat label="Updated" value={new Date(c.updated_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} />
        <Stat label="Source" value={c.source} />
        <Stat label="CNDP consent" value={new Date(c.cndp_consent_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} />
      </div>

      <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Customer</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Full name" value={c.full_name} />
        <Stat label="Phone" value={c.phone} mono />
        <Stat label="Email" value={c.email} />
      </div>

      <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Vehicle</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Brand" value={c.vehicle_brand} />
        <Stat label="Model" value={c.vehicle_model} />
        <Stat label="VIN" value={c.vin} mono />
      </div>

      <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Concerned intervention</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Type" value={c.intervention_type === "mechanical" ? "Mechanical" : "Bodywork"} />
        <Stat label="Site" value={c.site} />
        <Stat label="Service date" value={c.service_date ? new Date(c.service_date).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"} />
      </div>

      <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Customer reason</h3>
      <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-[12.5px] leading-relaxed text-white/85 whitespace-pre-wrap">
        {c.reason}
      </div>

      {c.attachment_url && (
        <div className="mt-3">
          <a
            href={c.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-white/85 transition hover:border-white/30 hover:bg-white/[0.07]"
          >
            View attachment ↗
          </a>
        </div>
      )}

      {c.crc_notes && (
        <>
          <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-amber-300/80">CRC notes</h3>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 text-[12px] text-amber-100/85 whitespace-pre-wrap">
            {c.crc_notes}
          </div>
        </>
      )}

      {c.conversation_id && (
        <div className="mt-8">
          <Link
            href={`/admin/${slug}/conversations/${c.conversation_id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[12px] text-white/85 transition hover:border-white/30 hover:bg-white/[0.07]"
          >
            View original conversation →
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className={`mt-0.5 text-[12.5px] text-white/85 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
