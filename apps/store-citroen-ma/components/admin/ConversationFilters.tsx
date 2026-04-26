"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

type Props = {
  slug: string;
  sp: { status?: string; channel?: string; locale?: string; range?: string; q?: string };
  locales: string[];
  accent: string;
};

export function ConversationFilters({ slug, sp, locales, accent }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(sp.q ?? "");

  useEffect(() => { setQ(sp.q ?? ""); }, [sp.q]);

  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}${params.toString() ? "?" + params.toString() : ""}`);
    });
  };

  const debouncedSearch = (value: string) => {
    setQ(value);
    // Tiny debounce via timeout — 300ms feels right.
    if (typeof window !== "undefined") {
      window.clearTimeout((debouncedSearch as unknown as { _t?: number })._t);
      (debouncedSearch as unknown as { _t?: number })._t = window.setTimeout(() => {
        update({ q: value || null });
      }, 300);
    }
  };

  const ranges = [
    { id: null, label: "All time" },
    { id: "24h", label: "24h" },
    { id: "7d", label: "7d" },
    { id: "30d", label: "30d" },
    { id: "90d", label: "90d" },
  ] as const;

  const statuses = [
    { id: null, label: "Any status" },
    { id: "closed_lead", label: "Lead" },
    { id: "open", label: "Open" },
    { id: "closed_no_lead", label: "Closed" },
    { id: "abandoned", label: "Abandoned" },
  ] as const;

  const channels = [
    { id: null, label: "Any channel" },
    { id: "chat", label: "Chat" },
    { id: "voice", label: "Voice" },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedGroup
        value={sp.range ?? null}
        accent={accent}
        items={ranges}
        onChange={(v) => update({ range: v })}
      />
      <Divider />
      <SegmentedGroup
        value={sp.status ?? null}
        accent={accent}
        items={statuses}
        onChange={(v) => update({ status: v })}
      />
      <SegmentedGroup
        value={sp.channel ?? null}
        accent={accent}
        items={channels}
        onChange={(v) => update({ channel: v })}
      />
      {locales.length > 1 && (
        <select
          value={sp.locale ?? ""}
          onChange={(e) => update({ locale: e.target.value || null })}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-white/80 outline-none transition hover:border-white/30 focus:border-white/40"
        >
          <option value="" className="bg-[#0a0a0c]">Any locale</option>
          {locales.map((l) => (
            <option key={l} value={l} className="bg-[#0a0a0c]">{l}</option>
          ))}
        </select>
      )}
      <div className="ms-auto flex w-full items-center gap-2 sm:w-auto">
        <div className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 transition focus-within:border-white/30 sm:w-[260px]">
          <Search size={13} strokeWidth={1.7} className="text-white/40" />
          <input
            value={q}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Search name, phone, city, model…"
            className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-white/30"
          />
          {q && (
            <button type="button" onClick={() => { setQ(""); update({ q: null }); }} aria-label="Clear">
              <X size={13} className="text-white/40 hover:text-white/80" />
            </button>
          )}
        </div>
        <a
          href={`/api/admin/${slug}/conversations/export${searchParams ? `?${searchParams.toString()}` : ""}`}
          className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-white/70 transition hover:border-white/30 hover:text-white sm:inline-flex"
        >
          Export CSV
        </a>
      </div>
    </div>
  );
}

function SegmentedGroup<T extends string | null>({
  value,
  items,
  onChange,
  accent,
}: {
  value: T;
  items: ReadonlyArray<{ id: T; label: string }>;
  onChange: (v: T) => void;
  accent: string;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.025] p-0.5">
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={`${it.id ?? "_all"}`}
            type="button"
            onClick={() => onChange(it.id)}
            className={`rounded-full px-3 py-1 text-[11.5px] font-medium transition ${
              active ? "text-white" : "text-white/55 hover:text-white/80"
            }`}
            style={active ? { background: accent } : {}}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function Divider() {
  return <span className="hidden h-5 w-px bg-white/10 sm:inline-block" />;
}
