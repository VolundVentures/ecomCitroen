// /demo/[brand] — fake brand landing page with the floating widget FAB.
// Shows the brand's hero model + a "Talk to our advisor" CTA.

import Image from "next/image";
import { notFound } from "next/navigation";
import { getBrandContext } from "@/lib/brand-context";
import { WidgetBubble } from "@/components/rihla/WidgetBubble";
import type { VoiceLang } from "@/components/rihla/LanguagePicker";
import type { WidgetBrand } from "@/lib/rihla-actions";

export const dynamic = "force-dynamic";

function localeToVoiceLang(locale: string): VoiceLang | null {
  if (locale === "fr-MA") return "fr";
  if (locale === "ar-MA" || locale === "ar-SA") return "ar";
  if (locale === "darija-MA") return "darija";
  if (locale === "en-MA" || locale === "en-SA") return "en";
  return null;
}

export default async function DemoLanding({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const ctx = await getBrandContext(slug);
  if (!ctx) notFound();

  const featured = ctx.models[0];
  const widgetBrand: WidgetBrand & {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  } = {
    slug: ctx.brand.slug,
    name: ctx.brand.name,
    homepageUrl: ctx.brand.homepage_url,
    logoUrl: ctx.brand.logo_url,
    primaryColor: ctx.brand.primary_color,
    models: ctx.models.map((m) => ({
      slug: m.slug,
      name: m.name,
      heroImage: m.hero_image_url,
      galleryImages: m.gallery_images,
      pageUrl: m.page_url,
    })),
  };

  const availableLangs = ctx.brand.locales
    .map(localeToVoiceLang)
    .filter((l): l is VoiceLang => l !== null);

  const accent = ctx.brand.primary_color ?? "#121214";

  return (
    <div className="min-h-screen bg-[#0c0c10] text-white">
      {/* Brand bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {ctx.brand.logo_url && (
            <div className="relative h-9 w-9 overflow-hidden rounded-md bg-white/10 p-1">
              <Image src={ctx.brand.logo_url} alt={ctx.brand.name} fill className="object-contain p-1" sizes="36px" />
            </div>
          )}
          <div className="text-sm font-semibold tracking-wide">{ctx.brand.name}</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Demo Stellantis</div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 pt-10 pb-32 lg:flex-row lg:gap-12 lg:pt-20">
        <div className="flex-1 lg:max-w-[520px]">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/40">
            <span className="h-[2px] w-8" style={{ background: accent }} /> AI sales advisor
          </div>
          <h1 className="text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            Discutez avec un conseiller {ctx.brand.name}, à toute heure.
          </h1>
          <p className="mt-5 max-w-[480px] text-sm leading-relaxed text-white/60 sm:text-base">
            Recommandation personnalisée, comparatif, simulation de financement, prise de rendez-vous chez le concessionnaire — par chat ou par appel vocal, dans la langue qui vous convient.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#chat"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: accent }}
            >
              Démarrer la conversation
            </a>
            <span className="text-[12px] text-white/40">↘ Cliquez sur le bouton en bas à droite</span>
          </div>
        </div>

        {featured && (
          <div className="relative aspect-[16/10] w-full max-w-[600px] flex-1 overflow-hidden rounded-[24px] bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featured.hero_image_url} alt={featured.name} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/60">Featured</div>
              <div className="text-xl font-medium">{featured.name}</div>
              {featured.price_from != null && featured.price_from > 0 && (
                <div className="text-[12px] text-white/60">
                  À partir de {featured.price_from.toLocaleString()} {featured.currency}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <WidgetBubble brand={widgetBrand} availableLangs={availableLangs} />
    </div>
  );
}
