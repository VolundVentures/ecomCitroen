import { setRequestLocale } from "next-intl/server";
import { SimplePageShell } from "@/components/site/SimplePageShell";

type Props = { params: Promise<{ locale: string }> };

export default async function LegalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimplePageShell
      eyebrow="Informations légales"
      title="Mentions légales"
      sub="Contenu légal complet en cours de validation par notre conseil juridique Maroc."
    >
      <p>
        Site édité par Stellantis Maroc. Les marques Citroën et Stellantis sont
        la propriété de leurs titulaires respectifs. Toute reproduction interdite.
      </p>
      <p>
        Pour toute demande, contactez-nous via le chat Rihla ou le réseau des
        concessionnaires officiels.
      </p>
    </SimplePageShell>
  );
}
