// /admin/[brand]/appointments/[id] — full detail of one service appointment.
// CRC-facing — every field collected by the chatbot, plus status workflow,
// internal notes, link back to the conversation transcript.

import Link from "next/link";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, ServiceAppointment } from "@/lib/supabase/database.types";
import { AppointmentStatusSelect } from "@/components/admin/AppointmentStatusSelect";

export const dynamic = "force-dynamic";

export default async function AppointmentDetail({
  params,
}: {
  params: Promise<{ brand: string; id: string }>;
}) {
  const { brand: slug, id } = await params;
  const supa = adminClient();

  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand | null;
  if (!brand) notFound();

  const { data: row } = await supa.from("service_appointments").select("*").eq("id", id).single();
  const a = row as unknown as ServiceAppointment | null;
  if (!a) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link href={`/admin/${slug}/appointments`} className="text-[11px] text-white/40 hover:text-white">
        ← Back to appointments
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Reference</div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{a.ref_number}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/40">Status</span>
          <AppointmentStatusSelect appointmentId={a.id} status={a.status} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="Created" value={new Date(a.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} />
        <Stat label="Updated" value={new Date(a.updated_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} />
        <Stat label="Source" value={a.source} />
        <Stat label="CNDP consent" value={new Date(a.cndp_consent_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} />
      </div>

      <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Customer</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Full name" value={a.full_name} />
        <Stat label="Phone" value={a.phone} mono />
        <Stat label="Email" value={a.email} />
      </div>

      <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Vehicle</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Brand" value={a.vehicle_brand} />
        <Stat label="Model" value={a.vehicle_model} />
        <Stat label="VIN" value={a.vin} mono />
      </div>

      <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Intervention</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Stat label="Type" value={a.intervention_type === "mechanical" ? "Mechanical" : "Bodywork"} />
        <Stat label="City" value={a.city} />
        <Stat label="Date" value={new Date(a.preferred_date).toLocaleDateString(undefined, { dateStyle: "medium" })} />
        <Stat label="Slot" value={a.preferred_slot === "morning" ? "Morning" : "Afternoon"} />
      </div>

      {a.comment && (
        <>
          <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Customer comment</h3>
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-[12.5px] text-white/85 whitespace-pre-wrap">
            {a.comment}
          </div>
        </>
      )}

      {a.notes && (
        <>
          <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-amber-300/80">Internal notes</h3>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 text-[12px] text-amber-100/85 whitespace-pre-wrap">
            {a.notes}
          </div>
        </>
      )}

      {a.conversation_id && (
        <div className="mt-8">
          <Link
            href={`/admin/${slug}/conversations/${a.conversation_id}`}
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
