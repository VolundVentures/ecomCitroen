"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { ArrowUpRight, Mic, MapPin } from "lucide-react";
import { Container, Eyebrow, ScrollReveal } from "@citroen-store/ui";
import { openRihlaChat } from "@/lib/rihla-bus";

export function FinalCTA() {
  const t = useTranslations("finalCta");
  const locale = useLocale();

  return (
    <section className="relative isolate overflow-hidden py-20 text-white sm:py-28" data-rihla-section="cta">
      {/* Warm charcoal base with editorial backdrop */}
      <div className="absolute inset-0 mesh-sunrise" aria-hidden />
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/generated/backdrops/atlas-mountains.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-30"
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,14,16,0.55) 0%, rgba(14,14,16,0.75) 60%, #0E0E10 100%)",
        }}
        aria-hidden
      />
      <div className="noise absolute inset-0 opacity-40" aria-hidden />

      <Container className="relative">
        <div className="mx-auto max-w-4xl text-center">
          <ScrollReveal>
            <div className="mx-auto flex w-fit items-center gap-3">
              <span
                className="inline-block h-[2px] w-10"
                style={{ background: "var(--brand-primary)" }}
              />
              <Eyebrow className="text-white/75">{t("eyebrow")}</Eyebrow>
              <span
                className="inline-block h-[2px] w-10"
                style={{ background: "var(--brand-primary)" }}
              />
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="display mt-6 text-[clamp(2.5rem,7.5vw,6.5rem)] font-medium leading-[0.92] tracking-[-0.04em]">
              {t("title_lead")}{" "}
              <span className="serif-italic">
                <span className="metal-text">{t("title_accent")}</span>
              </span>{" "}
              {t("title_tail")}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-xl text-balance text-base text-white/75 sm:text-lg">
              {t("sub")}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openRihlaChat()}
                className="group relative inline-flex h-14 items-center gap-2.5 rounded-full bg-white pe-2 ps-7 text-sm font-medium uppercase tracking-[0.16em] text-[#121214] transition-all hover:bg-white/90"
              >
                {t("cta_primary")}
                <span className="ms-2 flex h-10 w-10 items-center justify-center rounded-full bg-[--brand-ink] text-white transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => openRihlaChat({ voice: true })}
                className="inline-flex h-14 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 text-sm font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/10"
              >
                <Mic size={14} strokeWidth={1.8} />
                Parler en direct
              </button>
              <Link
                href={`/${locale}/dealers`}
                className="inline-flex h-14 items-center gap-2 rounded-full px-6 text-sm font-medium text-white/85 transition-colors hover:text-white"
              >
                <MapPin size={14} strokeWidth={1.8} />
                <span className="border-b border-transparent pb-0.5 transition-colors hover:border-white">
                  {t("cta_secondary")}
                </span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
