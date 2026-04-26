"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  Globe,
  MessageSquare,
  Mic2,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import type { FullBrandContext } from "@/lib/brand-context";
import { DEMO_I18N, type DemoLang, type DemoStrings, pickDemoLang } from "@/components/demo/demo-i18n";

type Props = {
  ctx: FullBrandContext;
  accent: string;
};

const FLAGS: Record<DemoLang, string> = { en: "🇬🇧", fr: "🇫🇷", ar: "🇸🇦" };
const LANG_LABELS: Record<DemoLang, string> = { en: "English", fr: "Français", ar: "العربية" };

export function DemoLanding({ ctx, accent }: Props) {
  const { brand, models } = ctx;
  const initialLang = pickDemoLang(brand.locales);
  const [lang, setLang] = useState<DemoLang>(initialLang);
  const t = DEMO_I18N[lang];
  const isRtl = lang === "ar";
  const hero = models[0];
  const featured = models.slice(0, 6);

  // Show whichever languages the brand supports.
  const availableLangs: DemoLang[] = (() => {
    const set = new Set<DemoLang>();
    for (const loc of brand.locales) {
      if (loc.startsWith("ar") || loc === "darija-MA") set.add("ar");
      else if (loc.startsWith("en")) set.add("en");
      else if (loc.startsWith("fr")) set.add("fr");
    }
    if (set.size === 0) set.add("fr");
    return ["en", "fr", "ar"].filter((l) => set.has(l as DemoLang)) as DemoLang[];
  })();

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-white" dir={isRtl ? "rtl" : "ltr"}>
      <Nav brand={brand} accent={accent} t={t} lang={lang} setLang={setLang} availableLangs={availableLangs} />

      <section className="relative overflow-hidden">
        <BackgroundOrb accent={accent} />

        <div className="relative mx-auto max-w-7xl px-6 pt-12 pb-24 lg:pt-20 lg:pb-32">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <motion.div
                key={`badge-${lang}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/70 backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                {t.badge}
              </motion.div>

              <motion.h1
                key={`h1-${lang}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.02em] sm:text-5xl lg:text-6xl"
              >
                {t.title1}
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(135deg, ${accent} 0%, #ffffff 100%)` }}
                >
                  {t.title2} {brand.name.split(" ")[0]}
                </span>
                <br /> {t.title3}
              </motion.h1>

              <motion.p
                key={`sub-${lang}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-6 max-w-[520px] text-[15px] leading-relaxed text-white/65"
              >
                {t.subtitle}
              </motion.p>

              <motion.div
                key={`cta-${lang}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <CTAButton accent={accent} primary>
                  <Sparkles size={15} strokeWidth={2} className="opacity-90" />
                  {t.ctaPrimary}
                  <ArrowDownRight size={15} strokeWidth={2.2} className="opacity-90 rtl:rotate-90" />
                </CTAButton>
                <CTAButton accent={accent}>
                  <Mic2 size={15} strokeWidth={2} />
                  {t.ctaVoice}
                </CTAButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.44 }}
                className="mt-12 grid max-w-[560px] grid-cols-3 gap-6 border-t border-white/5 pt-8"
              >
                <Stat label={t.statDealers} value="42+" />
                <Stat label={t.statResponse} value="< 2s" />
                <Stat label={t.statLanguages} value={brand.locales.length.toString()} />
              </motion.div>
            </div>

            {hero && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 0.68, 0, 1] }}
                className="relative"
              >
                <div className="relative aspect-[5/4] overflow-hidden rounded-[28px] bg-white/[0.04] shadow-[0_28px_84px_-16px_rgba(0,0,0,0.6)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={hero.hero_image_url} alt={hero.name} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent" />
                  <div
                    className="absolute -inset-[1px] rounded-[28px]"
                    style={{
                      background: `linear-gradient(135deg, ${accent}55 0%, transparent 35%, transparent 65%, ${accent}33 100%)`,
                      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                      padding: "1px",
                    }}
                  />

                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.22em] text-white/70">{t.modelFeaturedLabel}</div>
                      <div className="mt-1 text-2xl font-semibold leading-tight">{hero.name}</div>
                      {hero.tagline && <div className="mt-1 max-w-[280px] text-[12px] text-white/70">{hero.tagline}</div>}
                    </div>
                    {hero.price_from && hero.price_from > 0 && (
                      <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-end backdrop-blur">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">{t.modelFromLabel}</div>
                        <div className="text-sm font-semibold tabular-nums">
                          {hero.price_from.toLocaleString()} {hero.currency}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="absolute -bottom-7 -end-7 hidden max-w-[260px] rounded-2xl border border-white/10 bg-[#101013]/85 p-4 shadow-[0_18px_44px_-12px_rgba(0,0,0,0.5)] backdrop-blur lg:block"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/15">
                      <Image src="/brand/rihla-avatar.jpg" alt="Rihla" fill sizes="36px" className="object-cover" />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold">Rihla</div>
                      <div className="flex items-center gap-1 text-[10px] text-white/55">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        {lang === "en" ? "Online" : lang === "ar" ? "متصلة" : "En ligne"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-[12px] leading-snug text-white/80">
                    {t.speech}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">{t.whyTitle}</div>
            <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-[-0.01em] sm:text-4xl">
              {t.whySub}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Feature accent={accent} icon={<MessageSquare size={18} strokeWidth={1.7} />} title={t.feature1Title} text={t.feature1} />
            <Feature accent={accent} icon={<Globe size={18} strokeWidth={1.7} />} title={t.feature2Title} text={t.feature2} />
            <Feature accent={accent} icon={<Zap size={18} strokeWidth={1.7} />} title={t.feature3Title} text={t.feature3} />
            <Feature accent={accent} icon={<Sparkles size={18} strokeWidth={1.7} />} title={t.feature4Title} text={t.feature4} />
            <Feature accent={accent} icon={<Star size={18} strokeWidth={1.7} />} title={t.feature5Title} text={t.feature5} />
            <Feature accent={accent} icon={<Shield size={18} strokeWidth={1.7} />} title={t.feature6Title} text={t.feature6} />
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">{t.rangeEyebrow(models.length)}</div>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.01em] sm:text-4xl">
                {t.rangeTitle(models.length, brand.name.split(" ")[0] ?? brand.name)}
              </h2>
            </div>
            <a
              href={brand.homepage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/70 transition hover:border-white/30 hover:text-white sm:inline-flex"
            >
              {t.rangeCta}
              <ArrowRight size={13} strokeWidth={2} className="rtl:rotate-180" />
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((m, i) => (
              <motion.a
                key={m.id}
                href={m.page_url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 0.68, 0, 1] }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] transition hover:border-white/20"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.hero_image_url}
                    alt={m.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{m.body_type ?? "—"}</div>
                      <div className="mt-0.5 text-base font-semibold leading-tight">{m.name}</div>
                    </div>
                    {m.price_from && m.price_from > 0 && (
                      <div className="text-end">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">{t.modelFromLabel}</div>
                        <div className="text-[13px] font-semibold tabular-nums">
                          {m.price_from.toLocaleString()} {m.currency}
                        </div>
                      </div>
                    )}
                  </div>
                  {m.tagline && <div className="line-clamp-2 text-[12px] text-white/55">{m.tagline}</div>}
                  <div className="mt-auto flex items-center gap-1.5 text-[11px] font-medium" style={{ color: accent }}>
                    <span>{t.modelDiscuss}</span>
                    <ArrowRight size={12} strokeWidth={2} className="transition group-hover:translate-x-1 rtl:rotate-180" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-4">
          <div
            className="relative overflow-hidden rounded-[28px] p-10 lg:p-16"
            style={{
              background: `radial-gradient(120% 160% at 80% 0%, ${accent}33 0%, transparent 60%), linear-gradient(180deg, #131318 0%, #0a0a0c 100%)`,
              boxShadow: `0 24px 80px -20px ${accent}66, 0 0 0 1px rgba(255,255,255,0.06)`,
            }}
          >
            <div className="relative max-w-xl">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">{t.finalEyebrow}</div>
              <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.01em] sm:text-4xl">
                {t.finalTitle}
              </h3>
              <p className="mt-3 text-[15px] text-white/65">{t.finalSub}</p>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] text-white/75 backdrop-blur">
                <ArrowDownRight size={14} strokeWidth={2} className="opacity-80" />
                <span>{t.finalHint}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-7 text-[11px] text-white/35 sm:flex-row">
          <div>© {new Date().getFullYear()} {brand.name} · Powered by Rihla</div>
          <div className="flex items-center gap-3">
            <span>Demo Stellantis</span>
            <span>·</span>
            <span>{brand.market === "MA" ? "Maroc" : "Saudi Arabia"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Nav({
  brand,
  accent,
  t,
  lang,
  setLang,
  availableLangs,
}: {
  brand: FullBrandContext["brand"];
  accent: string;
  t: DemoStrings;
  lang: DemoLang;
  setLang: (l: DemoLang) => void;
  availableLangs: DemoLang[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0c]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          {brand.logo_url && (
            <div className="relative h-8 w-8 overflow-hidden rounded-md bg-white/10 p-1">
              <Image src={brand.logo_url} alt={brand.name} fill className="object-contain p-1" sizes="32px" />
            </div>
          )}
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">{brand.name}</div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-white/40">{t.navTagline}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-white/80 transition hover:border-white/30 hover:bg-white/[0.07]"
            >
              <span className="text-base leading-none">{FLAGS[lang]}</span>
              <span>{LANG_LABELS[lang]}</span>
              <Globe size={11} strokeWidth={1.7} className="opacity-60" />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute end-0 z-30 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#101013] shadow-[0_18px_42px_-12px_rgba(0,0,0,0.6)]"
                >
                  {availableLangs.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => { setLang(l); setOpen(false); }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-[12px] transition hover:bg-white/[0.06] ${
                        l === lang ? "bg-white/[0.04] text-white" : "text-white/70"
                      }`}
                    >
                      <span className="text-base leading-none">{FLAGS[l]}</span>
                      <span>{LANG_LABELS[l]}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <a
            href={brand.homepage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full border border-white/10 px-3.5 py-1.5 text-[11px] text-white/70 transition hover:border-white/30 hover:text-white sm:inline-flex"
            style={{ borderColor: `${accent}33` }}
          >
            {t.navOfficial} ↗
          </a>
        </div>
      </div>
    </header>
  );
}

function BackgroundOrb({ accent }: { accent: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[-15%] h-[640px] w-[640px] rounded-full blur-[140px]"
        style={{ background: `${accent}33` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-32 left-[-10%] h-[420px] w-[420px] rounded-full blur-[140px]"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
        }}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
    </div>
  );
}

function CTAButton({
  children,
  primary,
  accent,
}: {
  children: React.ReactNode;
  primary?: boolean;
  accent: string;
}) {
  if (primary) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -1 }}
        className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white shadow-[0_12px_28px_-8px_rgba(0,0,0,0.4)] transition"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)` }}
      >
        {children}
      </motion.button>
    );
  }
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 backdrop-blur transition hover:border-white/40 hover:bg-white/10 hover:text-white"
    >
      {children}
    </motion.button>
  );
}

function Feature({
  accent,
  icon,
  title,
  text,
}: {
  accent: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: `${accent}1a`, color: accent }}
      >
        {icon}
      </div>
      <div className="mt-4 text-[15px] font-semibold leading-snug">{title}</div>
      <div className="mt-1.5 text-[13px] leading-relaxed text-white/55">{text}</div>
    </motion.div>
  );
}
