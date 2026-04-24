import { setRequestLocale, getTranslations } from "next-intl/server";
import { Calculator } from "lucide-react";
import { Container, Eyebrow } from "@citroen-store/ui";
import { FinancingAdvisor } from "@/components/site/FinancingAdvisor";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function FinancingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "financing_page" });

  return (
    <section className="relative py-16 sm:py-24">
      <div className="absolute inset-x-0 top-0 h-[380px] mesh-light opacity-80" aria-hidden />
      <Container className="relative space-y-12">
        <div className="max-w-2xl">
          <Eyebrow className="text-[--brand-primary]">
            <Calculator size={12} strokeWidth={1.8} /> {t("eyebrow")}
          </Eyebrow>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,6rem)] font-medium leading-[0.95] tracking-[-0.04em]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-[--brand-ink-muted] sm:text-lg">
            {t("sub")}
          </p>
        </div>
        <FinancingAdvisor />
      </Container>
    </section>
  );
}
