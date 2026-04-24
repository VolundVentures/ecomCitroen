"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, MessagesSquare, Box } from "lucide-react";
import type { CatalogModel } from "@/lib/catalog";
import { formatMAD } from "@/lib/catalog";
import { openRihlaChat } from "@/lib/rihla-bus";
import { onConfiguratorChange } from "@/lib/rihla-actions";

export function ConfiguratorStage({ model }: { model: CatalogModel }) {
  const t = useTranslations("detail");
  const locale = useLocale();

  const [colorId, setColorId] = useState(model.colors[0]?.id ?? "");
  const [angleIdx, setAngleIdx] = useState(2); // middle angle by default
  const [trimSlug, setTrimSlug] = useState(model.trims[0]?.slug ?? "");

  // Let Rihla drive the configurator via rihla:configurator events.
  // Match color/trim by id or by fuzzy name contains (so "red" matches "Rouge Elixir").
  useEffect(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fuzzyColor = (needle: string) => {
      const n = norm(needle);
      return (
        model.colors.find((c) => c.id === needle) ??
        model.colors.find((c) => norm(c.id).includes(n) || n.includes(norm(c.id))) ??
        model.colors.find((c) => norm(c.name).includes(n) || n.includes(norm(c.name)))
      );
    };
    const fuzzyTrim = (needle: string) => {
      const n = norm(needle);
      return (
        model.trims.find((tr) => tr.slug === needle) ??
        model.trims.find((tr) => norm(tr.slug).includes(n) || n.includes(norm(tr.slug))) ??
        model.trims.find((tr) => norm(tr.name).includes(n) || n.includes(norm(tr.name)))
      );
    };
    return onConfiguratorChange((change) => {
      if (change.modelSlug && change.modelSlug !== model.slug) return;
      if (change.colorId) {
        const match = fuzzyColor(change.colorId);
        if (match) setColorId(match.id);
      }
      if (change.trimId) {
        const match = fuzzyTrim(change.trimId);
        if (match) setTrimSlug(match.slug);
      }
      if (typeof change.angleIndex === "number") {
        const clamped = Math.max(0, Math.min(4, change.angleIndex));
        setAngleIdx(clamped);
      }
    });
  }, [model]);

  const color = useMemo(
    () => model.colors.find((c) => c.id === colorId) ?? model.colors[0]!,
    [model, colorId]
  );
  const trim = useMemo(
    () => model.trims.find((tr) => tr.slug === trimSlug) ?? model.trims[0]!,
    [model, trimSlug]
  );

  const currentImage = color?.renders[angleIdx] ?? color?.renders[0];
  const totalPrice = (trim?.priceFrom ?? 0) + (color?.upcharge ?? 0);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px]">
      {/* Stage */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-[#0a0a0a] lg:aspect-auto lg:min-h-[620px]">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 45%, ${model.accentHex}40 0%, ${model.accentHex}10 40%, transparent 70%), linear-gradient(180deg, #0a0a0a 0%, #141414 100%)`,
          }}
          aria-hidden
        />
        <div className="noise-subtle absolute inset-0 opacity-50" aria-hidden />

        {/* Product image crossfade */}
        <AnimatePresence mode="wait">
          {currentImage && (
            <motion.div
              key={currentImage}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              className="absolute inset-0 flex items-center justify-center p-8"
            >
              <Image
                src={currentImage}
                alt={`${model.name} en ${color?.name}`}
                width={1600}
                height={1200}
                priority
                className="h-full w-full object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top badges */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] backdrop-blur">
            <Box size={11} strokeWidth={2} /> 3D interactif — bientôt
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-white backdrop-blur">
            {color?.name}
          </span>
        </div>

        {/* Angle selector */}
        {color && color.renders.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 p-5">
            {color.renders.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAngleIdx(i)}
                aria-label={`Angle ${i + 1}`}
                className={
                  i === angleIdx
                    ? "h-2 w-8 rounded-full bg-white transition-all"
                    : "h-2 w-2 rounded-full bg-white/30 transition-all hover:bg-white/60"
                }
              />
            ))}
          </div>
        )}

        {/* Bottom label */}
        <div className="pointer-events-none absolute inset-x-0 bottom-14 z-10 px-6 text-white">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/50">
            {model.name}
          </div>
          <div className="display mt-1 text-2xl font-medium">
            {trim?.name}
          </div>
        </div>
      </div>

      {/* Controls */}
      <aside className="space-y-6">
        {/* Trims */}
        <section>
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[--brand-ink-muted]">
            {t("trims")}
          </div>
          <div className="space-y-2">
            {model.trims.map((tr) => {
              const active = tr.slug === trimSlug;
              return (
                <button
                  key={tr.slug}
                  type="button"
                  onClick={() => setTrimSlug(tr.slug)}
                  className={
                    active
                      ? "w-full rounded-2xl border-2 border-[--brand-ink] bg-white p-4 text-start"
                      : "w-full rounded-2xl border border-[--brand-border] bg-white p-4 text-start transition-all hover:border-[--brand-ink]"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{tr.name}</div>
                    <div className="text-sm font-medium">
                      {formatMAD(tr.priceFrom)} MAD
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-[--brand-ink-muted]">
                    {tr.engine} · {tr.horsepower} ch · {tr.transmission}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Colors */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[--brand-ink-muted]">
              Couleur ({model.colors.length})
            </div>
            {(color?.upcharge ?? 0) > 0 && (
              <div className="text-[10px] uppercase tracking-[0.2em] text-[--brand-ink-muted]">
                +{formatMAD(color!.upcharge)} MAD
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {model.colors.map((c) => {
              const active = c.id === colorId;
              const isBitone = !!c.roofHex;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setColorId(c.id);
                    setAngleIdx(2);
                  }}
                  title={c.name}
                  aria-label={c.name}
                  className={
                    active
                      ? "relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-[--brand-ink] ring-offset-2"
                      : "relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-[--brand-border] transition-all hover:ring-[--brand-ink]"
                  }
                >
                  {isBitone ? (
                    <>
                      <div
                        className="absolute inset-x-0 top-0 h-1/2"
                        style={{ background: c.roofHex }}
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 h-1/2"
                        style={{ background: c.hex }}
                      />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: c.hex }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-[--brand-ink]">{color?.name}</div>
        </section>

        {/* Total + CTAs */}
        <section className="rounded-2xl border border-[--brand-border] bg-[--brand-surface-alt] p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
              Total
            </div>
            <div className="display text-xl font-medium">
              {formatMAD(totalPrice)}{" "}
              <span className="text-[--brand-ink-muted]">MAD</span>
            </div>
          </div>
          <Link
            href={`/${locale}/reserve/${model.slug}`}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[--brand-ink] text-sm font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[--brand-primary]"
          >
            {t("reserve")}
            <ArrowUpRight size={16} strokeWidth={1.8} />
          </Link>
          <button
            type="button"
            onClick={() =>
              openRihlaChat({
                seedMessage: `Je regarde la ${model.name} ${trim?.name} en ${color?.name}. Peux-tu m'aider à finaliser mon choix ?`,
              })
            }
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[--brand-border] bg-white text-sm font-medium text-[--brand-ink] transition-colors hover:border-[--brand-ink]"
          >
            <MessagesSquare size={14} strokeWidth={1.8} />
            {t("ask_rihla")}
          </button>
        </section>
      </aside>
    </div>
  );
}
