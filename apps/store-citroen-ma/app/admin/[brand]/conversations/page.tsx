import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Conversation } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function ConversationsList({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ status?: string; channel?: string }>;
}) {
  const { brand: slug } = await params;
  const { status, channel } = await searchParams;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;

  let q = supa.from("conversations").select("*").eq("brand_id", brand.id).order("started_at", { ascending: false }).limit(100);
  if (status) q = q.eq("status", status);
  if (channel) q = q.eq("channel", channel);
  const { data } = await q;
  const list = (data as unknown as Conversation[]) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">Conversations</h2>
        <div className="text-[11px] text-white/40">{list.length} shown</div>
      </div>

      <div className="mb-4 flex gap-2">
        <FilterChip href={`/admin/${slug}/conversations`} label="All" active={!status && !channel} />
        <FilterChip href={`/admin/${slug}/conversations?status=closed_lead`} label="Leads" active={status === "closed_lead"} />
        <FilterChip href={`/admin/${slug}/conversations?status=abandoned`} label="Abandoned" active={status === "abandoned"} />
        <FilterChip href={`/admin/${slug}/conversations?channel=voice`} label="Voice only" active={channel === "voice"} />
        <FilterChip href={`/admin/${slug}/conversations?channel=chat`} label="Chat only" active={channel === "chat"} />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-[12px]">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-4 py-2 text-start font-normal">Started</th>
              <th className="px-4 py-2 text-start font-normal">Channel</th>
              <th className="px-4 py-2 text-start font-normal">Locale</th>
              <th className="px-4 py-2 text-start font-normal">Status</th>
              <th className="px-4 py-2 text-start font-normal">Lead</th>
              <th className="px-4 py-2 text-start font-normal">Duration</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t border-white/5 text-white/70 hover:bg-white/5">
                <td className="px-4 py-2"><Link className="hover:text-white" href={`/admin/${slug}/conversations/${c.id}`}>{new Date(c.started_at).toLocaleString()}</Link></td>
                <td className="px-4 py-2">{c.channel}</td>
                <td className="px-4 py-2">{c.locale}</td>
                <td className="px-4 py-2"><StatusPill s={c.status} /></td>
                <td className="px-4 py-2">{c.lead_name ? `${c.lead_name} · ${c.lead_phone ?? "—"}` : "—"}</td>
                <td className="px-4 py-2">{c.duration_seconds != null ? `${Math.floor(c.duration_seconds / 60)}m ${c.duration_seconds % 60}s` : "—"}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">No conversations yet. Start one in the demo to populate.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-[11px] transition ${active ? "bg-white text-[#0c0c10]" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
    >
      {label}
    </Link>
  );
}

function StatusPill({ s }: { s: Conversation["status"] }) {
  const cls =
    s === "closed_lead" ? "bg-emerald-500/20 text-emerald-300"
    : s === "open" ? "bg-blue-500/20 text-blue-300"
    : s === "abandoned" ? "bg-orange-500/20 text-orange-300"
    : "bg-white/10 text-white/50";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${cls}`}>{s.replace("_", " ")}</span>;
}
