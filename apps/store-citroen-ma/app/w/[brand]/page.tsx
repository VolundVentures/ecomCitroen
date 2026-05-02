// /w/[brand] — fullscreen embedded widget. The chatbot fills the entire viewport.
// Used for demos, embeds, or QR-code links.

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

export default async function WidgetPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const ctx = await getBrandContext(slug);
  if (!ctx) notFound();

  const widgetBrand: WidgetBrand & {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  } = {
    slug: ctx.brand.slug,
    name: ctx.brand.name,
    agentName: ctx.brand.agent_name,
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

  // Plain FAB-and-collapse mode — identical look + behavior to the demo on
  // /demo/[brand] (rounded corners, drop shadow, FAB positioned bottom-right).
  // The host iframe just needs to be big enough to contain the open panel +
  // its shadow (~470 × 770 minimum) — see embed-test.html for an example.
  return (
    <WidgetBubble brand={widgetBrand} availableLangs={availableLangs} />
  );
}
