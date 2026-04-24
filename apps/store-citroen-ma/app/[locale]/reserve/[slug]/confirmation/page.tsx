import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  Check,
  CalendarDays,
  Mail,
  Phone,
  MapPin,
  Download,
  ArrowRight,
} from "lucide-react";
import { Container, Eyebrow } from "@citroen-store/ui";
import { catalog, getModelBySlug, formatMAD } from "@/lib/catalog";
import { maMarket } from "@citroen-store/market-config";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export function generateStaticParams() {
  return catalog.flatMap((m) =>
    ["fr", "ar", "en"].map((locale) => ({ locale, slug: m.slug }))
  );
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { session_id } = await searchParams;
  setRequestLocale(locale);
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const firstTrim = model.trims[0];
  const dealer = maMarket.dealerNetwork[0];
  const heroImg = `/generated/hero/${model.slug}.jpg`;

  // Generate a visit date (next business day + 2 days from now)
  const visitDate = new Date();
  visitDate.setDate(visitDate.getDate() + 2);
  if (visitDate.getDay() === 0) visitDate.setDate(visitDate.getDate() + 1);
  if (visitDate.getDay() === 6) visitDate.setDate(visitDate.getDate() + 2);
  const visitStr = visitDate.toLocaleDateString("fr-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const refNumber = `CIT-MA-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // TODO: verify Stripe session_id and send email via Resend when RESEND_API_KEY is set
  // For now this page is a demo confirmation.

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-emerald-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <Image src={heroImg} alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/80 to-emerald-700/90" />
        <Container className="relative py-16 text-center sm:py-20">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Check size={40} strokeWidth={2.5} className="text-white" />
          </div>
          <h1 className="display mt-6 text-[clamp(2rem,5vw,3.5rem)] font-medium leading-tight tracking-tight">
            Réservation confirmée !
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/85">
            Votre acompte a été reçu. Le concessionnaire vous contactera sous 2 heures pour organiser la suite.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
            Réf. {refNumber}
          </div>
        </Container>
      </section>

      {/* Details */}
      <section className="py-12 sm:py-16" style={{ background: "var(--brand-surface-warm)" }}>
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Vehicle summary */}
            <div className="rounded-2xl border border-[--brand-border] bg-white p-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                Votre véhicule
              </div>
              <h2 className="display mt-2 text-2xl font-medium text-[--brand-ink]">{model.name}</h2>
              <div className="mt-1 text-sm text-[--brand-ink-muted]">
                {firstTrim?.name} · {firstTrim?.engine} · {firstTrim?.horsepower} ch
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                  Prix
                </span>
                <span className="display text-xl font-medium text-[--brand-ink]">
                  {formatMAD(model.priceFrom)} MAD
                </span>
              </div>
              <div className="mt-4 relative h-32 overflow-hidden rounded-xl bg-[#0E0E10]">
                <Image src={heroImg} alt="" fill sizes="300px" className="object-cover opacity-80" />
              </div>
            </div>

            {/* Visit appointment */}
            <div className="rounded-2xl border border-[--brand-border] bg-white p-6">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                <CalendarDays size={14} /> Rendez-vous concessionnaire
              </div>
              <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                <div className="text-lg font-semibold text-emerald-800">{visitStr}</div>
                <div className="mt-1 text-sm text-emerald-700">10h00 — 12h00 (créneau indicatif)</div>
              </div>
              {dealer && (
                <div className="mt-4 space-y-2 text-sm text-[--brand-ink-soft]">
                  <div className="font-semibold text-[--brand-ink]">{dealer.name}</div>
                  <div className="flex items-center gap-2"><MapPin size={13} /> {dealer.address}</div>
                  <div className="flex items-center gap-2"><Phone size={13} /> {dealer.phone}</div>
                </div>
              )}
              <p className="mt-4 text-xs text-[--brand-ink-muted]">
                Le concessionnaire confirmera l'heure exacte par WhatsApp et email sous 2 heures.
              </p>
            </div>

            {/* Next steps */}
            <div className="rounded-2xl border border-[--brand-border] bg-white p-6">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                <Mail size={14} /> Prochaines étapes
              </div>
              <ol className="mt-4 space-y-4">
                {[
                  { step: "1", title: "Email de confirmation", desc: "Envoyé à votre adresse avec le récapitulatif et la facture d'acompte.", done: true },
                  { step: "2", title: "Appel du concessionnaire", desc: "Dans les 2 heures ouvrées pour confirmer votre créneau de visite.", done: false },
                  { step: "3", title: "Essai & bon de commande", desc: "Essai du véhicule, choix des options finales, signature du bon de commande.", done: false },
                  { step: "4", title: "Livraison", desc: "Préparation du véhicule et livraison à domicile ou en concessionnaire.", done: false },
                ].map((s) => (
                  <li key={s.step} className="flex gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${s.done ? "bg-emerald-500 text-white" : "border border-[--brand-border] text-[--brand-ink-muted]"}`}>
                      {s.done ? <Check size={13} strokeWidth={2.5} /> : s.step}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-[--brand-ink]">{s.title}</div>
                      <div className="text-xs text-[--brand-ink-muted]">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}`}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[--brand-ink] px-6 text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[--brand-ink-soft]"
            >
              Retour à l'accueil <ArrowRight size={14} />
            </Link>
            <Link
              href={`/${locale}/models/${slug}`}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[--brand-border] px-6 text-sm font-medium uppercase tracking-[0.16em] text-[--brand-ink] transition hover:border-[--brand-ink]"
            >
              Voir ma configuration
            </Link>
          </div>

          {session_id && (
            <div className="mt-4 text-center text-[10px] text-[--brand-ink-muted]">
              Stripe session: {session_id}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
