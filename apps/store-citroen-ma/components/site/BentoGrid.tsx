"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  MessagesSquare,
  Image as ImageIcon,
  Film,
  Calculator,
  CarFront,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { Container, Eyebrow, ScrollReveal } from "@citroen-store/ui";

type Tile = {
  title: string;
  body: string;
  icon: React.ReactNode;
  span: string;
  tone: "ink" | "sand" | "sage" | "amber" | "petrol" | "stone";
  kicker?: string;
};

const TONE_BG: Record<Tile["tone"], string> = {
  ink:    "bg-[--brand-ink] text-white",
  sand:   "bg-[#EDE7DC] text-[--brand-ink]",
  sage:   "bg-[#D8DFD0] text-[--brand-ink]",
  amber:  "bg-[#E8CFB0] text-[--brand-ink]",
  petrol: "bg-[#2A4A4F] text-white",
  stone:  "bg-[#E2DCD1] text-[--brand-ink]",
};

const TONE_ACCENT_BORDER: Record<Tile["tone"], string> = {
  ink:    "border-white/10",
  sand:   "border-[--brand-ink]/10",
  sage:   "border-[--brand-ink]/10",
  amber:  "border-[--brand-ink]/12",
  petrol: "border-white/10",
  stone:  "border-[--brand-ink]/10",
};

const TONE_ICON_BG: Record<Tile["tone"], string> = {
  ink:    "bg-white/10",
  sand:   "bg-[#121214]/[0.06]",
  sage:   "bg-[#121214]/[0.06]",
  amber:  "bg-[#121214]/[0.06]",
  petrol: "bg-white/10",
  stone:  "bg-[#121214]/[0.06]",
};

const TONE_BODY_TEXT: Record<Tile["tone"], string> = {
  ink:    "text-white/80",
  sand:   "opacity-75",
  sage:   "opacity-75",
  amber:  "opacity-75",
  petrol: "text-white/80",
  stone:  "opacity-75",
};

export function BentoGrid() {
  const t = useTranslations("bento");

  const tiles: Tile[] = [
    {
      kicker: "01 — Concierge",
      title: t("tile1_title"),
      body: t("tile1_body"),
      icon: <MessagesSquare size={18} strokeWidth={1.5} />,
      span: "lg:col-span-3 lg:row-span-2",
      tone: "ink",
    },
    {
      kicker: "02 — Commande",
      title: t("tile2_title"),
      body: t("tile2_body"),
      icon: <CarFront size={18} strokeWidth={1.5} />,
      span: "lg:col-span-3",
      tone: "amber",
    },
    {
      kicker: "03 — Imagerie",
      title: t("tile3_title"),
      body: t("tile3_body"),
      icon: <ImageIcon size={18} strokeWidth={1.5} />,
      span: "lg:col-span-2",
      tone: "sand",
    },
    {
      kicker: "04 — Cinéma",
      title: t("tile4_title"),
      body: t("tile4_body"),
      icon: <Film size={18} strokeWidth={1.5} />,
      span: "lg:col-span-2",
      tone: "sage",
    },
    {
      kicker: "05 — Budget",
      title: t("tile5_title"),
      body: t("tile5_body"),
      icon: <Calculator size={18} strokeWidth={1.5} />,
      span: "lg:col-span-2",
      tone: "petrol",
    },
    {
      kicker: "06 — Réserver",
      title: t("tile6_title"),
      body: t("tile6_body"),
      icon: <Wallet size={18} strokeWidth={1.5} />,
      span: "lg:col-span-3",
      tone: "stone",
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24" style={{ background: "var(--brand-surface-warm)" }}>
      <div className="absolute inset-0 grid-bg-light opacity-60" aria-hidden />
      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <ScrollReveal>
              <Eyebrow>{t("eyebrow")}</Eyebrow>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="display mt-5 text-[clamp(2rem,5.5vw,4.5rem)] font-medium leading-[0.96] tracking-[-0.04em] text-[--brand-ink]">
                {t("title_lead")}{" "}
                <span className="serif-italic">
                  <span className="ink-text">{t("title_accent")}</span>
                </span>
                {t("title_tail")}
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-6 max-w-xl text-base text-[--brand-ink-muted]">{t("sub")}</p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.25}>
            <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted] sm:flex">
              <span className="inline-block h-px w-10 bg-[--brand-ink]/30" />
              Six capacités réunies
            </div>
          </ScrollReveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-3 lg:grid-cols-6 lg:grid-rows-[260px_260px_260px] lg:gap-4">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.7,
                delay: i * 0.08,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className={`group relative overflow-hidden rounded-[28px] border p-7 transition-colors ${TONE_BG[tile.tone]} ${TONE_ACCENT_BORDER[tile.tone]} ${tile.span}`}
            >
              {/* subtle grain */}
              <div className="noise-subtle absolute inset-0 opacity-30" aria-hidden />

              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border border-current/15 ${TONE_ICON_BG[tile.tone]}`}>
                    <span className="opacity-90">{tile.icon}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.24em] opacity-55">
                    {tile.kicker}
                  </span>
                </div>

                <div className="mt-auto">
                  <h3 className="display text-xl font-medium leading-tight sm:text-2xl">
                    {tile.title}
                  </h3>
                  <p className={`mt-3 max-w-lg text-sm leading-relaxed ${TONE_BODY_TEXT[tile.tone]}`}>
                    {tile.body}
                  </p>
                </div>

                <div className="absolute end-5 top-5 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight size={18} strokeWidth={1.6} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
