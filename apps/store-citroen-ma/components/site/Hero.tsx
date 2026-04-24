"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, Mic, Sparkles } from "lucide-react";
import { Eyebrow } from "@citroen-store/ui";
import { openRihlaChat } from "@/lib/rihla-bus";

const HERO_IMAGE = "/generated/hero/homepage.jpg";

export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.08]);
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative isolate -mt-16 h-[100svh] min-h-[600px] max-h-[820px] overflow-hidden pt-16"
      style={{ background: "var(--brand-surface-warm)" }}
    >
      {/* Editorial background: ivory base + soft amber mesh */}
      <div className="absolute inset-0 mesh-editorial opacity-90" aria-hidden />
      <div className="noise-subtle absolute inset-0 opacity-50" aria-hidden />

      {/* Asymmetric image — positioned bottom-right, soft overlap */}
      <motion.div
        style={{ scale: imgScale, y: imgY }}
        className="pointer-events-none absolute inset-y-0 end-0 w-full overflow-hidden sm:w-[75%] lg:w-[62%]"
        aria-hidden
      >
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 60vw, (min-width: 640px) 75vw, 100vw"
          className="object-cover object-center"
        />
        {/* Stronger left fade on mobile so overlaid text stays readable. */}
        <div
          className="absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(248,245,240,0.78) 0%, rgba(248,245,240,0.55) 40%, rgba(248,245,240,0.25) 100%)",
          }}
        />
        <div
          className="absolute inset-0 hidden sm:block"
          style={{
            background:
              "linear-gradient(90deg, var(--brand-surface-warm) 0%, rgba(248,245,240,0.5) 18%, rgba(248,245,240,0.0) 40%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(217,144,88,0.06) 0%, transparent 30%, transparent 70%, rgba(14,14,16,0.25) 100%)",
          }}
        />
      </motion.div>

      {/* Text block — left column, fills viewport with tight spacing */}
      <motion.div
        style={{ opacity, y: textY }}
        className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col justify-between px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:px-10"
      >
        <div className="max-w-[720px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <span
              className="inline-block h-[2px] w-10"
              style={{ background: "var(--brand-primary)" }}
            />
            <Eyebrow className="text-[--brand-ink-muted]">{t("eyebrow")}</Eyebrow>
          </motion.div>

          <HeroTitle />

          <motion.p
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-5 max-w-[520px] text-balance text-sm leading-relaxed text-[--brand-ink-soft] sm:text-base"
          >
            {t("sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.85 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              type="button"
              onClick={() => openRihlaChat()}
              className="group relative inline-flex h-14 items-center gap-2.5 rounded-full bg-[--brand-ink] pe-2 ps-7 text-sm font-medium uppercase tracking-[0.16em] text-white transition-all hover:bg-[--brand-ink-soft]"
            >
              <Sparkles size={14} strokeWidth={1.8} className="opacity-70" />
              {t("cta_primary")}
              <span className="ms-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[--brand-ink] transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight size={16} strokeWidth={1.8} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => openRihlaChat({ voice: true })}
              className="group inline-flex h-14 items-center gap-2 rounded-full border border-[--brand-border-ink]/15 bg-white/40 px-6 text-sm font-medium uppercase tracking-[0.16em] text-[--brand-ink] backdrop-blur-md transition-all hover:border-[--brand-ink] hover:bg-white"
            >
              <Mic size={14} strokeWidth={1.8} />
              {t("cta_voice")}
            </button>

            <Link
              href={`/${locale}/models`}
              className="group inline-flex h-14 items-center gap-2 px-3 text-sm font-medium text-[--brand-ink] transition-colors"
            >
              <span className="border-b border-transparent transition-colors group-hover:border-[--brand-primary]">
                {t("cta_secondary")}
              </span>
              <ArrowUpRight
                size={16}
                strokeWidth={1.8}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </motion.div>
        </div>

        <HeroBottomBar />
      </motion.div>

      {/* Bottom fade into the rest of the page */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32 bg-gradient-to-b from-transparent to-[--brand-surface-warm]"
        aria-hidden
      />
    </section>
  );
}

function HeroTitle() {
  const t = useTranslations("hero");
  const title = t("title");
  const words = title.split(" ");
  return (
    <h1 className="display mt-7 text-balance text-[clamp(2rem,5.2vw,4.75rem)] leading-[0.98] tracking-[-0.035em]">
      {words.map((word, i) => {
        const stripped = word.replace(/[.,!?؟]/g, "");
        const isAccent =
          stripped === "conversation" ||
          stripped === "المحادثة" ||
          stripped === "conversations";

        return (
          <motion.span
            key={`${word}-${i}`}
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.85,
              delay: 0.2 + i * 0.08,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="me-[0.22em] inline-block"
          >
            {isAccent ? (
              <span className="serif-italic relative">
                <span className="ink-text">{word}</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: 0.2 + i * 0.08 + 0.7,
                    duration: 0.9,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="absolute -bottom-1 start-0 h-[3px] w-full origin-left"
                  style={{ background: "var(--brand-primary)" }}
                />
              </span>
            ) : (
              word
            )}
          </motion.span>
        );
      })}
    </h1>
  );
}

function HeroBottomBar() {
  const t = useTranslations("heroStats");
  const entries = [
    { kpi: t("stat1_kpi"), label: t("stat1_label") },
    { kpi: t("stat2_kpi"), label: t("stat2_label") },
    { kpi: t("stat3_kpi"), label: t("stat3_label") },
    { kpi: t("stat4_kpi"), label: t("stat4_label") },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1.2 }}
      className="mb-6 mt-10 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-5 border-t border-[--brand-border] pt-5 sm:grid-cols-4"
    >
      {entries.map((e, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="display text-2xl font-medium text-[--brand-ink] sm:text-3xl">
            {e.kpi}
          </div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
            {e.label}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
