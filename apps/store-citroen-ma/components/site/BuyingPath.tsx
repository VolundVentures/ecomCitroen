"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  MessagesSquare,
  Car,
  Calculator,
  CreditCard,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { Container, Eyebrow, ScrollReveal } from "@citroen-store/ui";
import { openRihlaChat } from "@/lib/rihla-bus";

type Step = {
  num: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  href?: string;
  onClick?: () => void;
};

export function BuyingPath() {
  const locale = useLocale();
  const t = useTranslations("buyingPath");

  const steps: Step[] = [
    {
      num: "01",
      icon: <MessagesSquare size={18} strokeWidth={1.5} />,
      title: t("step1_title"),
      body: t("step1_body"),
      cta: t("step1_cta"),
      onClick: () => openRihlaChat(),
    },
    {
      num: "02",
      icon: <Car size={18} strokeWidth={1.5} />,
      title: t("step2_title"),
      body: t("step2_body"),
      cta: t("step2_cta"),
      href: `/${locale}/models`,
    },
    {
      num: "03",
      icon: <Calculator size={18} strokeWidth={1.5} />,
      title: t("step3_title"),
      body: t("step3_body"),
      cta: t("step3_cta"),
      href: `/${locale}/financing`,
    },
    {
      num: "04",
      icon: <CreditCard size={18} strokeWidth={1.5} />,
      title: t("step4_title"),
      body: t("step4_body"),
      cta: t("step4_cta"),
      href: `/${locale}/reserve/c3-aircross`,
    },
    {
      num: "05",
      icon: <KeyRound size={18} strokeWidth={1.5} />,
      title: t("step5_title"),
      body: t("step5_body"),
      cta: t("step5_cta"),
      href: `/${locale}/dealers`,
    },
  ];

  return (
    <section
      className="relative py-16 sm:py-24"
      style={{ background: "var(--brand-surface-sand)" }}
      data-rihla-section="path"
    >
      <div className="absolute inset-0 grid-bg-light opacity-50" aria-hidden />
      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <ScrollReveal>
              <Eyebrow>{t("eyebrow")}</Eyebrow>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <h2 className="display mt-4 text-[clamp(1.9rem,4.5vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.035em] text-[--brand-ink]">
                {t("title_lead")}{" "}
                <span className="serif-italic ink-text">{t("title_accent")}</span>
                {t("title_tail")}
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p className="mt-4 max-w-xl text-base text-[--brand-ink-muted]">
                {t("sub")}
              </p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2}>
            <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted] sm:flex">
              <span className="inline-block h-px w-10 bg-[--brand-ink]/30" />
              {t("chip")}
            </div>
          </ScrollReveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => {
            const body = (
              <motion.div
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.07,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
                className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[--brand-border] bg-white p-5 transition-colors hover:border-[--brand-ink]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-[--brand-ink-muted]">
                    {step.num}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[--brand-surface-warm] text-[--brand-ink]">
                    {step.icon}
                  </span>
                </div>
                <div className="mt-8 flex flex-1 flex-col">
                  <h3 className="text-base font-semibold leading-snug text-[--brand-ink] sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[--brand-ink-muted]">
                    {step.body}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[--brand-ink]">
                  <span className="border-b border-[--brand-ink]/30 pb-0.5 transition-colors group-hover:border-[--brand-primary]">
                    {step.cta}
                  </span>
                  <ArrowRight
                    size={14}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </motion.div>
            );

            return step.href ? (
              <Link key={step.num} href={step.href} className="h-full">
                {body}
              </Link>
            ) : (
              <button
                key={step.num}
                type="button"
                onClick={step.onClick}
                className="h-full text-start"
              >
                {body}
              </button>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
