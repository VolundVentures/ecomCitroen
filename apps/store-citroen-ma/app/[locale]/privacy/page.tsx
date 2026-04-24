import { setRequestLocale } from "next-intl/server";
import { SimplePageShell } from "@/components/site/SimplePageShell";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimplePageShell
      eyebrow="Données personnelles"
      title="Protection des données"
      sub="Conformité CNDP (Loi 09-08) en cours. Politique complète publiée avant le lancement."
    >
      <p>
        Vos données sont traitées conformément à la Loi 09-08 sur la protection
        des données personnelles au Maroc. Vous disposez à tout moment d'un droit
        d'accès, de rectification et de suppression.
      </p>
      <p>
        Les conversations avec Rihla ne sont utilisées que pour améliorer votre
        parcours. Aucune donnée n'est partagée avec des tiers sans votre
        consentement explicite.
      </p>
    </SimplePageShell>
  );
}
