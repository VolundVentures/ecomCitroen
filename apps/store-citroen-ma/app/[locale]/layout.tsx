import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RihlaBubble } from "@/components/rihla/RihlaBubble";

export const metadata: Metadata = {
  title: {
    default: "Citroën Maroc — Boutique en ligne",
    template: "%s · Citroën Maroc",
  },
  description:
    "Configurez, visualisez et réservez votre Citroën en conversation. Acompte 1 000 MAD. Livraison partout au Maroc.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div lang={locale} dir={dir} className="bg-[--brand-surface] text-[--brand-ink]">
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Header locale={locale} />
        <main className="pt-16">{children}</main>
        <Footer />
        <RihlaBubble />
      </NextIntlClientProvider>
    </div>
  );
}
