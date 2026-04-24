import { setRequestLocale } from "next-intl/server";
import { SimplePageShell } from "@/components/site/SimplePageShell";

type Props = { params: Promise<{ locale: string }> };

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimplePageShell
      eyebrow="Conditions"
      title="Conditions générales de vente"
      sub="Toutes les ventes sont finalisées via le concessionnaire officiel Citroën le plus proche. Conditions complètes en cours de validation."
    >
      <p>
        Le paiement en ligne correspond à un acompte remboursable qui sécurise
        votre réservation. Le bon de commande final est signé électroniquement
        avec votre concessionnaire, qui reste votre interlocuteur principal
        pour la livraison, la reprise éventuelle et le financement.
      </p>
      <p>
        Toute réservation peut être annulée avant la signature du bon de
        commande. Les modalités complètes de remboursement seront détaillées à
        l'étape de réservation.
      </p>
    </SimplePageShell>
  );
}
