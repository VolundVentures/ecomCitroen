"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import type { Model } from "@/lib/supabase/database.types";
import { toggleModelAction } from "@/app/admin/[brand]/settings/actions";

export function ModelToggleList({ models, accent }: { models: Model[]; accent: string }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {models.map((m) => (
        <ModelRow key={m.id} model={m} accent={accent} />
      ))}
      {models.length === 0 && (
        <div className="col-span-full rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-[12px] text-white/40">
          No models configured.
        </div>
      )}
    </div>
  );
}

function ModelRow({ model, accent }: { model: Model; accent: string }) {
  const [enabled, setEnabled] = useState(model.enabled);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      await toggleModelAction(model.id, next);
    });
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-white/[0.025] p-2.5 transition ${
        enabled ? "border-white/15" : "border-white/[0.06] opacity-60"
      }`}
    >
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-white/5">
        {model.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={model.hero_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image src="/brand/rihla-avatar.jpg" alt="" fill className="object-cover" sizes="64px" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-white/90">{model.name}</div>
        <div className="truncate text-[10.5px] text-white/40">
          {model.body_type ?? "—"} · {model.fuel ?? "—"}
          {model.price_from ? ` · ${model.price_from.toLocaleString()} ${model.currency}` : ""}
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="relative h-6 w-11 shrink-0 rounded-full transition"
        style={{ background: enabled ? accent : "rgba(255,255,255,0.1)" }}
        aria-label={enabled ? "Disable" : "Enable"}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
          style={{ left: enabled ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}
