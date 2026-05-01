// /demo/[brand] — premium brand-themed showcase landing page with the floating
// Rihla widget. This is what the user actually screen-shares during the demo.

import { notFound } from "next/navigation";
import { getBrandContext } from "@/lib/brand-context";
import { WidgetBubble } from "@/components/rihla/WidgetBubble";
import { DemoLanding } from "@/components/demo/DemoLanding";
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

export default async function DemoPage({ params }: { params: Promise<{ brand: string }> }) {
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
  const uniqueLangs = Array.from(new Set(availableLangs));

  return (
    <>
      <DemoLanding ctx={ctx} accent={ctx.brand.primary_color ?? "#0c0c10"} />
      <WidgetBubble brand={widgetBrand} availableLangs={uniqueLangs} />
    </>
  );
}
