import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Container, Eyebrow, ScrollReveal } from "@citroen-store/ui";
import { ModelCard } from "@/components/site/ModelCard";
import { catalog } from "@/lib/catalog";

export function RangeSection() {
  const t = useTranslations("models");
  const locale = useLocale();
  return (
    <section className="relative py-16 sm:py-24" data-rihla-section="range">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <ScrollReveal>
              <Eyebrow className="text-[--brand-primary]">
                {t("section_eyebrow")}
              </Eyebrow>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <h2 className="display mt-4 text-[clamp(2rem,5.5vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.035em]">
                {t("section_title")}
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.16}>
              <p className="mt-4 max-w-xl text-base text-[--brand-ink-muted]">
                {t("section_sub")}
              </p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.22}>
            <Link
              href={`/${locale}/models`}
              className="group inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-[--brand-ink]"
            >
              {t("all_range")}
              <ArrowRight
                size={16}
                strokeWidth={1.8}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </ScrollReveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((model, i) => (
            <ModelCard key={model.slug} model={model} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
