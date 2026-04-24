"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Globe, Menu, X, Mic } from "lucide-react";
import Image from "next/image";
import { Container } from "@citroen-store/ui";
import { openRihlaChat } from "@/lib/rihla-bus";

export function Header({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 14);
  });

  const switchTo = locale === "fr" ? "ar" : locale === "ar" ? "en" : "fr";
  const switchLabel =
    locale === "fr" ? "العربية" : locale === "ar" ? "English" : "Français";

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: scrolled ? "rgba(248,245,240,0.82)" : "rgba(248,245,240,0)",
        borderColor: scrolled ? "rgba(227,222,212,1)" : "rgba(227,222,212,0)",
        backdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
      }}
      transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b"
    >
      <Container className="flex h-16 items-center justify-between">
        <Link href={`/${locale}`} className="group flex items-center gap-2.5">
          <Image
            src="/brand/citroen-logo.png"
            alt="Citroën"
            width={36}
            height={40}
            priority
            className="h-7 w-auto"
          />
          <span className="display text-[11px] font-medium uppercase tracking-[0.3em] text-[--brand-ink-muted]">
            MAROC
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {[
            { href: `/${locale}/models`, label: t("models") },
            { href: `/${locale}/financing`, label: t("financing") },
            { href: `/${locale}/dealers`, label: t("dealers") },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative text-sm font-medium text-[--brand-ink] transition-colors"
            >
              {item.label}
              <span className="absolute -bottom-1 start-0 h-[2px] w-0 bg-[--brand-primary] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openRihlaChat({ voice: true })}
            className="hidden items-center gap-1.5 rounded-full border border-[--brand-border] bg-white/40 px-3.5 py-1.5 text-xs font-medium text-[--brand-ink] backdrop-blur-md transition-colors hover:border-[--brand-ink] hover:bg-white sm:inline-flex"
            aria-label="Parler à Rihla"
          >
            <Mic size={13} strokeWidth={1.6} />
            Rihla
          </button>
          <Link
            href={`/${switchTo}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[--brand-border] bg-white/40 px-3.5 py-1.5 text-xs font-medium text-[--brand-ink] backdrop-blur-md transition-colors hover:border-[--brand-ink] hover:bg-white"
          >
            <Globe size={13} strokeWidth={1.6} />
            {switchLabel}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden rounded-full border border-[--brand-border] bg-white/40 p-2 text-[--brand-ink] backdrop-blur-md"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="border-t border-[--brand-border] bg-[--brand-surface-warm] md:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {[
                { href: `/${locale}/models`, label: t("models") },
                { href: `/${locale}/financing`, label: t("financing") },
                { href: `/${locale}/dealers`, label: t("dealers") },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-[--brand-ink] hover:bg-[--brand-surface-sand]"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  openRihlaChat({ voice: true });
                }}
                className="mt-2 flex items-center gap-2 rounded-xl bg-[--brand-ink] px-4 py-3 text-base font-medium text-white"
              >
                <Mic size={16} strokeWidth={1.6} />
                Parler à Rihla
              </button>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
