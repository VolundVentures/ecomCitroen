import { setRequestLocale } from "next-intl/server";
import { SimplePageShell } from "@/components/site/SimplePageShell";

type Props = { params: Promise<{ locale: string }> };

export default async function ServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimplePageShell
      eyebrow="Service & entretien"
      title="Votre Citroën, entretenue comme il se doit."
      sub="Prise de rendez-vous, rappels d'entretien, pièces d'origine. Rihla vous guide. Bientôt disponible."
    />
  );
}
