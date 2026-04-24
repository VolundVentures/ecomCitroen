import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container, Eyebrow } from "@citroen-store/ui";
import { ModelCard } from "@/components/site/ModelCard";
import { catalog } from "@/lib/catalog";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ModelsIndex({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "models" });

  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-0 mesh-light opacity-80" aria-hidden />
      <Container className="relative">
        <div className="max-w-2xl">
          <Eyebrow className="text-[--brand-primary]">{t("section_eyebrow")}</Eyebrow>
          <h1 className="display mt-5 text-[clamp(2.5rem,7vw,6rem)] font-medium leading-[0.95] tracking-[-0.04em]">
            {t("section_title")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-[--brand-ink-muted] sm:text-lg">
            {t("section_sub")}
          </p>
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
