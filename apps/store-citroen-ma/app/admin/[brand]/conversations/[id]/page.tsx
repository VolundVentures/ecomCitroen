import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import type {
  Conversation,
  Message,
  ImageCardPayload,
  ToolUsePayload,
} from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function ConversationDetail({
  params,
}: {
  params: Promise<{ brand: string; id: string }>;
}) {
  const { brand: slug, id } = await params;
  const supa = adminClient();

  const { data: convRow } = await supa
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();
  const conv = convRow as unknown as Conversation | null;
  if (!conv) notFound();

  // Order by seq first (deterministic per-conversation counter set by trigger
  // in migration 00003). Fall back to created_at as a tiebreaker for pre-
  // migration rows where seq = 0.
  const { data: msgRows } = await supa
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("seq", { ascending: true })
    .order("created_at", { ascending: true });
  const messages = (msgRows as unknown as Message[]) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link href={`/admin/${slug}/conversations`} className="text-[11px] text-white/40 hover:text-white">
        ← Back to conversations
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Channel" value={conv.channel} />
        <Stat label="Locale" value={conv.locale} />
        <Stat label="Status" value={conv.status.replace("_", " ")} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
        <Stat label="Started" value={new Date(conv.started_at).toLocaleString()} />
        <Stat label="Ended" value={conv.ended_at ? new Date(conv.ended_at).toLocaleString() : "—"} />
        <Stat
          label="Duration"
          value={conv.duration_seconds != null ? `${Math.floor(conv.duration_seconds / 60)}m ${conv.duration_seconds % 60}s` : "—"}
        />
      </div>

      {conv.lead_name && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-[12px]">
          <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/70">Lead captured</div>
          <div className="mt-1 grid grid-cols-2 gap-2 text-white/80 sm:grid-cols-4">
            <div><span className="text-white/40">Name:</span> {conv.lead_name}</div>
            <div><span className="text-white/40">Phone:</span> <span className="font-mono">{conv.lead_phone}</span></div>
            <div><span className="text-white/40">City:</span> {conv.lead_city ?? "—"}</div>
            <div><span className="text-white/40">Slot:</span> {conv.lead_slot ?? "—"}</div>
            <div className="col-span-2 sm:col-span-2"><span className="text-white/40">Model:</span> {conv.lead_model_slug}</div>
            <div className="col-span-2 sm:col-span-2"><span className="text-white/40">Showroom:</span> {conv.lead_showroom ?? "—"}</div>
          </div>
        </div>
      )}

      <h3 className="mt-8 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Transcript</h3>
      <div className="space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-[12px] text-white/40">
            No messages.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-0.5 text-[12px] text-white/80">{value}</div>
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  if (m.kind === "tool_use") {
    const p = m.payload as ToolUsePayload | null;
    if (!p) return null;
    // Render tool_use rows the way the CUSTOMER saw them in chat — actual
    // image / video / showroom cards — instead of a generic "Tool:" debug
    // chip. This is what makes the admin transcript match the live UX.
    if (p.name === "show_model_image") {
      const slug = String(p.input?.slug ?? "");
      const caption = String(p.input?.caption ?? slug);
      return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <div className="aspect-[16/10] w-full bg-gradient-to-br from-white/[0.04] to-transparent" />
          <div className="px-3 py-2 text-[12px] text-white/80">
            <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/55">Image shown</div>
            <div className="mt-0.5 font-medium">{caption}</div>
          </div>
        </div>
      );
    }
    if (p.name === "show_model_video") {
      const slug = String(p.input?.slug ?? "");
      const caption = String(p.input?.caption ?? slug);
      return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <div className="flex aspect-video w-full items-center justify-center bg-black/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="#0c0c10" aria-hidden>
                <path d="M5 3.5v9l8-4.5z" />
              </svg>
            </div>
          </div>
          <div className="px-3 py-2 text-[12px] text-white/80">
            <div className="text-[10px] uppercase tracking-[0.18em] text-violet-300/55">Video shown</div>
            <div className="mt-0.5 font-medium">{caption}</div>
          </div>
        </div>
      );
    }
    if (p.name === "find_showrooms") {
      const city = String(p.input?.city ?? "");
      return (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white/80">
          <div className="text-[10px] uppercase tracking-[0.18em] text-sky-300/55">Showrooms listed</div>
          <div className="mt-0.5">{city ? `Searched: ${city}` : "All showrooms"}</div>
        </div>
      );
    }
    if (p.name === "book_test_drive" || p.name === "book_showroom_visit") {
      const i = (p.input ?? {}) as Record<string, unknown>;
      const labelKind = p.name === "book_test_drive" ? "Test drive booked" : "Showroom visit booked";
      return (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-[12px] text-emerald-100/95">
          <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">{labelKind}</div>
          <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
            {typeof i.firstName === "string" && <div><span className="text-emerald-300/55">Name:</span> {i.firstName}</div>}
            {typeof i.phone === "string" && <div><span className="text-emerald-300/55">Phone:</span> <span className="font-mono">{i.phone}</span></div>}
            {typeof i.city === "string" && <div><span className="text-emerald-300/55">City:</span> {i.city}</div>}
            {typeof i.preferredSlot === "string" && <div><span className="text-emerald-300/55">Slot:</span> {i.preferredSlot}</div>}
            {typeof i.slug === "string" && <div><span className="text-emerald-300/55">Model:</span> {i.slug}</div>}
            {typeof i.showroomName === "string" && <div><span className="text-emerald-300/55">Showroom:</span> {i.showroomName}</div>}
          </div>
        </div>
      );
    }
    if (p.name === "end_call") {
      return (
        <div className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
          End of conversation
        </div>
      );
    }
    // Fallback for any other tool — still useful for debugging.
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/50">
        <span className="text-white/40">Action:</span>{" "}
        <span className="font-mono text-white/80">{p.name.replace(/_/g, " ")}</span>
        {p.input && Object.keys(p.input).length > 0 && (
          <span className="ms-2 font-mono text-[10px] text-white/35">
            {Object.entries(p.input)
              .map(([k, v]) => `${k}=${String(v).slice(0, 24)}`)
              .join(" · ")}
          </span>
        )}
      </div>
    );
  }
  if (m.kind === "image_card") {
    const p = m.payload as ImageCardPayload | null;
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {p?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.caption ?? ""} className="aspect-[16/10] w-full object-cover" />
        )}
        <div className="px-3 py-2 text-[12px] text-white/70">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Image card</div>
          {p?.caption && <div className="mt-0.5">{p.caption}</div>}
        </div>
      </div>
    );
  }
  // text
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%]">
          <div className="mb-1 text-end text-[9px] font-medium uppercase tracking-[0.2em] text-emerald-300/70">
            User
          </div>
          <div className="rounded-2xl rounded-tr-md bg-emerald-500/15 px-3.5 py-2.5 text-[12px] text-white/95 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]">
            {m.content}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.2em] text-white/35">
        Rihla
      </div>
      <div className="max-w-[78%] rounded-2xl rounded-tl-md bg-white/[0.06] px-3.5 py-2.5 text-[12px] text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        {m.content}
      </div>
    </div>
  );
}

// Suppress unused import warnings in some Next.js builds
void Image;
