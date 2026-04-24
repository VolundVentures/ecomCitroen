import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { SimplePageShell } from "@/components/site/SimplePageShell";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimplePageShell
      eyebrow="Mon espace"
      title="Votre garage Citroën."
      sub="Retrouvez vos configurations sauvegardées, vos essais réservés, et vos commandes en un seul endroit. Bientôt disponible."
    >
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/${locale}/models`}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[--brand-ink] px-6 text-sm font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[--brand-primary]"
        >
          Explorer la gamme
          <ArrowUpRight size={14} strokeWidth={1.8} />
        </Link>
        <Link
          href={`/${locale}/dealers`}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-[--brand-border] bg-white px-6 text-sm font-medium uppercase tracking-[0.16em] text-[--brand-ink] transition-colors hover:border-[--brand-ink]"
        >
          Trouver un concessionnaire
        </Link>
      </div>
    </SimplePageShell>
  );
}
