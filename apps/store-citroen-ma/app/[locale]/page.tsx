import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/site/Hero";
import { BrandMarquee } from "@/components/site/BrandMarquee";
import { BuyingPath } from "@/components/site/BuyingPath";
import { BentoGrid } from "@/components/site/BentoGrid";
import { RangeSection } from "@/components/site/RangeSection";
import { FinalCTA } from "@/components/site/FinalCTA";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <BrandMarquee />
      <RangeSection />
      <BuyingPath />
      <BentoGrid />
      <FinalCTA />
    </>
  );
}
