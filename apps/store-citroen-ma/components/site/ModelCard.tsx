"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { ArrowUpRight, Zap, Leaf, Fuel } from "lucide-react";
import { type CatalogModel, formatMAD } from "@/lib/catalog";

const GENERATED_HERO: Record<string, string> = {
  "c3-aircross": "/generated/hero/c3-aircross.jpg",
  "c5-aircross": "/generated/hero/c5-aircross.jpg",
  berlingo: "/generated/hero/berlingo.jpg",
};

function useBestHeroImage(model: CatalogModel): string {
  const [src, setSrc] = useState<string>(
    GENERATED_HERO[model.slug] ?? model.heroImage ?? ""
  );
  useEffect(() => {
    let cancelled = false;
    const generated = GENERATED_HERO[model.slug];
    if (!generated) return;
    (async () => {
      try {
        const res = await fetch(generated, { method: "HEAD" });
        if (!cancelled) {
          setSrc(res.ok ? generated : model.heroImage ?? generated);
        }
      } catch {
        if (!cancelled) setSrc(model.heroImage ?? generated);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [model.slug, model.heroImage]);
  return src;
}

export function ModelCard({
  model,
  index = 0,
}: {
  model: CatalogModel;
  index?: number;
}) {
  const t = useTranslations("models");
  const locale = useLocale() as "fr" | "ar" | "en";
  const tagline = model.tagline[locale] ?? model.tagline.fr;
  const heroImage = useBestHeroImage(model);
  const isGenerated = heroImage.startsWith("/generated/");

  const cardRef = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 180, damping: 22 });
  const sy = useSpring(my, { stiffness: 180, damping: 22 });
  const rotateY = useTransform(sx, [0, 1], [4, -4]);
  const rotateX = useTransform(sy, [0, 1], [-3, 3]);
  const imgX = useTransform(sx, [0, 1], ["-2%", "2%"]);
  const imgY = useTransform(sy, [0, 1], ["-2%", "2%"]);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }
  function onLeave() {
    mx.set(0.5);
    my.set(0.5);
  }

  const fuelChip =
    model.fuelType === "electric" ? (
      <ChipDark label="EV" icon={<Zap size={10} strokeWidth={2} />} />
    ) : model.fuelType === "hybrid" ? (
      <ChipDark label="Hybride" icon={<Leaf size={10} strokeWidth={2} />} />
    ) : (
      <ChipDark label="Diesel" icon={<Fuel size={10} strokeWidth={2} />} />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.8,
        delay: index * 0.08,
        ease: [0.2, 0.7, 0.2, 1],
      }}
    >
      <Link
        ref={cardRef}
        href={`/${locale}/models/${model.slug}`}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group relative block overflow-hidden rounded-[28px] bg-[--brand-ink] text-white shadow-[0_30px_60px_-30px_rgba(18,18,20,0.35)]"
        style={
          {
            transformStyle: "preserve-3d",
            transformPerspective: 1000,
          } as React.CSSProperties
        }
      >
        <motion.div style={{ rotateX, rotateY }} className="relative">
          {/* Image area */}
          <div className="relative aspect-[5/4] overflow-hidden">
            {heroImage && (
              <motion.div
                style={{ x: imgX, y: imgY }}
                className="absolute inset-0"
              >
                <Image
                  src={heroImage}
                  alt={model.name}
                  fill
                  sizes="(min-width: 1024px) 460px, (min-width: 640px) 50vw, 100vw"
                  priority={index < 2}
                  className={
                    isGenerated
                      ? "h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                      : "h-full w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.05]"
                  }
                />
              </motion.div>
            )}

            {/* Warm wash to harmonise with the rest of the page */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.05) 45%, rgba(14,14,16,0.85) 100%)",
              }}
            />

            {/* Top-left chips */}
            <div className="absolute start-5 top-5 z-10 flex gap-2">
              <ChipDark label="2026" />
              {fuelChip}
            </div>

            {/* Bottom label */}
            <div className="absolute inset-x-5 bottom-5 z-10 flex items-end justify-between">
              <div>
                <div className="display text-2xl font-medium leading-tight sm:text-[28px]">
                  {model.shortName}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/60">
                  {model.bodyType}
                </div>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[--brand-ink] transition-transform group-hover:rotate-[-8deg]">
                <ArrowUpRight size={18} strokeWidth={1.8} />
              </div>
            </div>
          </div>

          {/* Meta row — warm sand bar */}
          <div
            className="flex items-center justify-between gap-4 border-t border-white/5 px-6 py-5"
            style={{ background: "var(--brand-surface-sand)", color: "var(--brand-ink)" }}
          >
            <div className="min-w-0">
              <div className="line-clamp-1 text-sm text-[--brand-ink-soft]">
                {tagline}
              </div>
            </div>
            <div className="flex shrink-0 items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                {t("starting_from")}
              </span>
              <span className="display text-lg font-medium">
                {formatMAD(model.priceFrom)}{" "}
                <span className="text-[--brand-ink-muted]">MAD</span>
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function ChipDark({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur">
      {icon}
      {label}
    </span>
  );
}
