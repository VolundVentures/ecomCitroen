import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, Phone, MessageCircle, Navigation2 } from "lucide-react";
import { Container, Eyebrow, ScrollReveal } from "@citroen-store/ui";
import { maMarket } from "@citroen-store/market-config";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DealersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "dealers" });

  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-[440px] mesh-light opacity-80" aria-hidden />
      <Container className="relative space-y-14">
        <div className="max-w-2xl">
          <Eyebrow className="text-[--brand-primary]">
            <MapPin size={12} strokeWidth={1.8} /> {t("eyebrow")}
          </Eyebrow>
          <h1 className="display mt-4 text-[clamp(2.5rem,7vw,6rem)] font-medium leading-[0.95] tracking-[-0.04em]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-[--brand-ink-muted] sm:text-lg">
            {t("sub")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {maMarket.dealerNetwork.map((dealer, i) => (
            <ScrollReveal key={dealer.id} delay={i * 0.08}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-[--brand-border] bg-white p-7 transition-all hover:-translate-y-1 hover:border-[--brand-ink] hover:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                      {dealer.region}
                    </div>
                    <h2 className="display mt-2 text-2xl font-medium">
                      {dealer.name}
                    </h2>
                    <div className="mt-1 text-sm text-[--brand-ink-muted]">
                      {dealer.city}
                    </div>
                  </div>
                  <div className="rounded-full bg-[--brand-primary] p-2 text-white">
                    <MapPin size={16} strokeWidth={1.8} />
                  </div>
                </div>

                <p className="mt-6 text-sm text-[--brand-ink]">
                  {dealer.address}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <a
                    href={`tel:${dealer.phone}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[--brand-border] px-3 py-1.5 text-xs font-medium text-[--brand-ink] transition-colors hover:border-[--brand-ink]"
                  >
                    <Phone size={12} strokeWidth={1.8} />
                    {t("call")}
                  </a>
                  <a
                    href={`https://wa.me/${dealer.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <MessageCircle size={12} strokeWidth={1.8} />
                    {t("whatsapp")}
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${dealer.lat},${dealer.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[--brand-border] px-3 py-1.5 text-xs font-medium text-[--brand-ink] transition-colors hover:border-[--brand-ink]"
                  >
                    <Navigation2 size={12} strokeWidth={1.8} />
                    {t("directions")}
                  </a>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-[--brand-border] bg-[--brand-surface-dark] py-20 text-white">
          <div className="absolute inset-0 mesh-dark opacity-90" aria-hidden />
          <div className="absolute inset-0 grid-bg opacity-[0.3]" aria-hidden />
          <div className="relative mx-auto max-w-xl px-6 text-center">
            <div className="display text-2xl font-medium">
              Carte interactive — à venir
            </div>
            <p className="mt-3 text-sm text-white/60">
              Toute la carte du Maroc avec les concessionnaires officiels
              Citroën sera intégrée prochainement.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
