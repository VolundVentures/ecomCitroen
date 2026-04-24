import { setRequestLocale } from "next-intl/server";
import { SimplePageShell } from "@/components/site/SimplePageShell";

type Props = { params: Promise<{ locale: string }> };

export default async function OrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimplePageShell
      eyebrow="Mes commandes"
      title="Suivi de vos réservations."
      sub="Du premier paiement jusqu'à la remise des clés, suivez chaque étape en direct. Bientôt disponible."
    />
  );
}
