import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Check, Lock, ArrowUpRight, Shield, Phone, CreditCard } from "lucide-react";
import { Container, Eyebrow } from "@citroen-store/ui";
import { catalog, getModelBySlug, formatMAD } from "@/lib/catalog";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return catalog.flatMap((m) =>
    ["fr", "ar", "en"].map((locale) => ({ locale, slug: m.slug }))
  );
}

export default async function ReservePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const t = await getTranslations({ locale, namespace: "reserve" });
  const firstTrim = model.trims[0];
  const heroImg = `/generated/hero/${model.slug}.jpg`;

  // Stripe Payment Link — sandbox URL from env, with graceful fallback.
  const stripeLink =
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ||
    "https://buy.stripe.com/test_3cI14meLieIFePqfVk8bS00";

  return (
    <>
      {/* Hero strip with the configured car */}
      <section className="relative overflow-hidden bg-[#0E0E10] text-white">
        <div className="absolute inset-0 opacity-55">
          <Image
            src={heroImg}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(14,14,16,0.85) 0%, rgba(14,14,16,0.55) 45%, rgba(14,14,16,0.2) 75%, rgba(14,14,16,0.6) 100%)",
          }}
          aria-hidden
        />
        <Container className="relative py-10 sm:py-14">
          <Link
            href={`/${locale}/models/${model.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} strokeWidth={1.8} />
            {t("back")}
          </Link>

          <div className="mt-8 max-w-2xl">
            <Eyebrow className="text-white/80">{t("eyebrow")}</Eyebrow>
            <h1 className="display mt-3 text-white text-[clamp(1.9rem,5vw,3.75rem)] font-medium leading-[0.98] tracking-[-0.035em]">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-balance text-sm text-white/80 sm:text-base">
              {t("sub")}
            </p>
          </div>
        </Container>
      </section>

      {/* Progress rail */}
      <section className="border-b border-[--brand-border] bg-white">
        <Container className="py-6">
          <ProgressRail activeIndex={3} />
        </Container>
      </section>

      <section className="relative py-12 sm:py-16" style={{ background: "var(--brand-surface-warm)" }}>
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
            {/* LEFT — configuration summary */}
            <div className="rounded-3xl border border-[--brand-border] bg-white p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                    Votre configuration
                  </div>
                  <h2 className="display mt-2 text-3xl font-medium text-[--brand-ink]">
                    {model.name}
                  </h2>
                  <div className="mt-1 text-sm text-[--brand-ink-muted]">
                    {firstTrim?.name} · {firstTrim?.engine} · {firstTrim?.horsepower} ch · {firstTrim?.transmission}
                  </div>
                </div>
                <div className="relative hidden h-20 w-32 overflow-hidden rounded-xl bg-[#0E0E10] sm:block">
                  <Image
                    src={heroImg}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  "Paiement sandbox Stripe (environnement test)",
                  "Acompte remboursable jusqu'à signature du bon de commande",
                  "Livraison partout au Maroc (concessionnaire agréé)",
                  "Rappel concessionnaire sous 2 heures en jour ouvré",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[--brand-border] bg-[--brand-surface-warm] p-4 text-sm text-[--brand-ink]"
                  >
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0"
                      style={{ color: "var(--brand-primary)" }}
                    />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: <Shield size={16} strokeWidth={1.7} />, label: "Conforme CNDP" },
                  { icon: <Lock size={16} strokeWidth={1.7} />, label: "Paiement chiffré" },
                  { icon: <Phone size={16} strokeWidth={1.7} />, label: "Suivi WhatsApp" },
                ].map((pill) => (
                  <div
                    key={pill.label}
                    className="flex items-center gap-2 rounded-xl border border-[--brand-border] bg-white px-3 py-2 text-xs text-[--brand-ink-soft]"
                  >
                    <span className="text-[--brand-ink-muted]">{pill.icon}</span>
                    {pill.label}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — payment card */}
            <aside className="space-y-4 rounded-3xl border border-[--brand-border] bg-white p-7">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                  Prix du véhicule
                </div>
                <div className="display mt-1 text-2xl font-medium text-[--brand-ink]">
                  {formatMAD(model.priceFrom)}{" "}
                  <span className="text-[--brand-ink-muted]">MAD</span>
                </div>
                <div className="mt-1 text-xs text-[--brand-ink-muted]">
                  à partir de — hors frais d'immatriculation
                </div>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{
                  background: "var(--brand-surface-sand)",
                  borderColor: "var(--brand-border)",
                }}
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
                  <CreditCard size={14} strokeWidth={1.6} />
                  Acompte — sécurisation
                </div>
                <div className="mt-2 text-sm text-[--brand-ink-soft]">
                  Un acompte remboursable sécurise votre configuration auprès du concessionnaire. Le montant s'affiche sur la page de paiement sécurisée.
                </div>
              </div>

              <a
                href={stripeLink}
                target="_blank"
                rel="noreferrer"
                className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[--brand-ink] px-6 text-sm font-medium uppercase tracking-[0.16em] text-white transition-all hover:bg-[--brand-ink-soft]"
              >
                <Lock size={14} strokeWidth={1.8} />
                {t("pay")} — paiement sécurisé
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.8}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>

              <div className="text-center text-[10px] uppercase tracking-[0.2em] text-[--brand-ink-muted]">
                Sandbox Stripe — aucun prélèvement réel
              </div>

              <Link
                href={`/${locale}/dealers`}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-[--brand-border] bg-white text-xs font-medium uppercase tracking-[0.18em] text-[--brand-ink] transition-colors hover:border-[--brand-ink]"
              >
                Ou contacter un concessionnaire
                <ArrowUpRight size={14} strokeWidth={1.8} />
              </Link>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}

function ProgressRail({ activeIndex }: { activeIndex: number }) {
  const steps = ["Découvrir", "Configurer", "Financer", "Réserver", "Livrer"];
  return (
    <ol className="flex items-center gap-2 overflow-x-auto text-[11px] uppercase tracking-[0.22em]">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={
                active
                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-[--brand-ink] text-white"
                  : done
                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-[--brand-primary] text-white"
                  : "flex h-7 w-7 items-center justify-center rounded-full border border-[--brand-border] bg-white text-[--brand-ink-muted]"
              }
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check size={13} strokeWidth={2.2} /> : i + 1}
            </span>
            <span
              className={
                active
                  ? "font-medium text-[--brand-ink]"
                  : done
                  ? "text-[--brand-ink]"
                  : "text-[--brand-ink-muted]"
              }
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 h-px w-6 bg-[--brand-border] sm:w-10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
