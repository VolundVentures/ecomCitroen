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

  const { data: msgRows } = await supa
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
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
            <div><span className="text-white/40">Phone:</span> {conv.lead_phone}</div>
            <div><span className="text-white/40">City:</span> {conv.lead_city ?? "—"}</div>
            <div><span className="text-white/40">Slot:</span> {conv.lead_slot ?? "—"}</div>
            <div className="col-span-2 sm:col-span-4"><span className="text-white/40">Model:</span> {conv.lead_model_slug}</div>
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
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/50">
        <span className="text-white/40">Tool:</span>{" "}
        <span className="font-mono text-white/80">{p?.name}</span>
        {p?.input && Object.keys(p.input).length > 0 && (
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[10px] text-white/40">
            {JSON.stringify(p.input, null, 2)}
          </pre>
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
  return (
    <div className={m.role === "user" ? "flex justify-end" : ""}>
      <div
        className={
          m.role === "user"
            ? "max-w-[75%] rounded-2xl rounded-tr-md bg-white px-3.5 py-2.5 text-[12px] text-[#0c0c10]"
            : "max-w-[75%] rounded-2xl rounded-tl-md bg-white/10 px-3.5 py-2.5 text-[12px] text-white/90"
        }
      >
        {m.content}
      </div>
    </div>
  );
}

// Suppress unused import warnings in some Next.js builds
void Image;
