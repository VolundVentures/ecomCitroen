import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  ArrowLeft,
  ArrowUpRight,
  Gauge,
  Leaf,
  Ruler,
  Clock,
  Fuel,
  ShieldCheck,
  Wifi,
  Cog,
} from "lucide-react";
import { Container, Eyebrow } from "@citroen-store/ui";
import { ConfiguratorStage } from "@/components/site/ConfiguratorStage";
import { ModelGallery } from "@/components/site/ModelGallery";
import { ModelFeatures } from "@/components/site/ModelFeatures";
import { ModelSwitcher } from "@/components/site/ModelSwitcher";
import { catalog, getModelBySlug, formatMAD, type CatalogModel } from "@/lib/catalog";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return catalog.flatMap((m) =>
    ["fr", "ar", "en"].map((locale) => ({ locale, slug: m.slug }))
  );
}

export default async function ModelDetail({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const tagline =
    model.tagline[locale as keyof typeof model.tagline] ?? model.tagline.fr;

  return (
    <>
      <ModelSwitcher currentSlug={model.slug} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0E0E10] text-white">
        <div className="absolute inset-0">
          <Image
            src={`/generated/hero/${model.slug}.jpg`}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-60"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(14,14,16,0.85) 0%, rgba(14,14,16,0.55) 45%, rgba(14,14,16,0.25) 75%, rgba(14,14,16,0.65) 100%), linear-gradient(180deg, rgba(14,14,16,0.2) 0%, rgba(14,14,16,0.55) 100%)",
          }}
          aria-hidden
        />
        <div className="noise-subtle absolute inset-0 opacity-40" aria-hidden />

        <Container className="relative flex min-h-[56vh] flex-col justify-between py-10 sm:py-14">
          <Link
            href={`/${locale}/models`}
            className="inline-flex items-center gap-1.5 self-start text-xs font-medium uppercase tracking-[0.2em] text-white/85 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} strokeWidth={1.8} />
            Toute la gamme
          </Link>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-2xl">
              <Eyebrow className="text-white/80">2026 · {model.bodyType}</Eyebrow>
              <h1 className="display mt-3 text-white text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.94] tracking-[-0.04em]">
                {model.shortName}
              </h1>
              <p className="mt-4 max-w-xl text-balance text-base leading-relaxed text-white/85 sm:text-lg">
                {tagline}
              </p>
            </div>
            <div className="text-end">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/70">
                À partir de
              </div>
              <div className="display mt-1 text-3xl font-medium text-white">
                {formatMAD(model.priceFrom)}{" "}
                <span className="text-white/60">MAD</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Configurator */}
      <section
        data-rihla-section="configurator"
        className="border-t border-[--brand-border] bg-white py-10 sm:py-14"
      >
        <Container>
          <ConfiguratorStage model={model} />
        </Container>
      </section>

      {/* Lifestyle gallery (uses real scraped images) */}
      {model.lifestyle && model.lifestyle.length > 0 && (
        <section
          data-rihla-section="gallery"
          className="py-14 sm:py-20"
          style={{ background: "var(--brand-surface-warm)" }}
        >
          <Container>
            <ModelGallery items={model.lifestyle} modelName={model.name} />
          </Container>
        </section>
      )}

      {/* Features */}
      <section
        data-rihla-section="features"
        className="py-16 sm:py-24"
        style={{ background: "var(--brand-surface-sand)" }}
      >
        <Container>
          <ModelFeatures />
        </Container>
      </section>

      {/* Specs grid + trims table */}
      <section
        data-rihla-section="specs"
        className="py-16 sm:py-24"
        style={{ background: "var(--brand-surface-warm)" }}
      >
        <Container className="space-y-16">
          {model.specs && <SpecsGrid model={model} />}
          <SpecsTable model={model} />
        </Container>
      </section>

      {/* CTA — warm dark section */}
      <section
        data-rihla-section="cta"
        className="relative overflow-hidden py-16 text-white sm:py-24"
      >
        <div className="absolute inset-0 mesh-sunrise" aria-hidden />
        <div className="noise absolute inset-0 opacity-40" aria-hidden />
        <Container className="relative">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <Eyebrow className="text-white/80">Prête à partir ?</Eyebrow>
              <h2 className="display mt-4 text-white text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.035em]">
                Une dernière question ?{" "}
                <span className="serif-italic metal-text">Rihla répond.</span>
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/reserve/${model.slug}`}
                style={{ color: "#121214" }}
                className="group inline-flex h-14 items-center gap-2.5 rounded-full bg-white pe-2 ps-7 text-sm font-medium uppercase tracking-[0.16em] transition-colors hover:bg-white/90"
              >
                <span style={{ color: "#121214" }}>Réserver maintenant</span>
                <span className="ms-2 flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform group-hover:translate-x-0.5" style={{ background: "#121214" }}>
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </span>
              </Link>
              <Link
                href={`/${locale}/dealers`}
                className="inline-flex h-14 items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 text-sm font-medium uppercase tracking-[0.16em] text-white transition-all hover:border-white/60 hover:bg-white/10"
              >
                Réserver un essai
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function SpecsTable({ model }: { model: CatalogModel }) {
  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
          Finitions & motorisations
        </div>
        <h2 className="display text-3xl font-medium leading-tight sm:text-4xl">
          Choisissez votre version
        </h2>
        <p className="mt-3 max-w-xl text-base text-[--brand-ink-muted]">
          Comparaison rapide des versions disponibles au Maroc.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-[--brand-border] bg-white">
        <table className="w-full">
          <thead className="bg-[--brand-surface-sand] text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
            <tr>
              <th className="p-5 text-start font-medium">Finition</th>
              <th className="p-5 text-start font-medium">Moteur</th>
              <th className="hidden p-5 text-start font-medium sm:table-cell">Puissance</th>
              <th className="hidden p-5 text-start font-medium md:table-cell">Transmission</th>
              <th className="p-5 text-end font-medium">Prix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--brand-border] text-sm text-[--brand-ink]">
            {model.trims.map((trim) => (
              <tr key={trim.slug}>
                <td className="p-5 font-semibold">{trim.name}</td>
                <td className="p-5 text-[--brand-ink-soft]">{trim.engine}</td>
                <td className="hidden p-5 text-[--brand-ink-soft] sm:table-cell">
                  {trim.horsepower} ch
                </td>
                <td className="hidden p-5 text-[--brand-ink-soft] md:table-cell">
                  {trim.transmission}
                </td>
                <td className="p-5 text-end font-semibold">
                  {formatMAD(trim.priceFrom)}{" "}
                  <span className="text-[--brand-ink-muted]">MAD</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SpecsGrid({ model }: { model: CatalogModel }) {
  const s = model.specs;
  if (!s) return null;
  const headline = [
    {
      icon: <Gauge size={18} strokeWidth={1.6} />,
      label: "Vitesse max",
      value: `${s.performance.topSpeed} km/h`,
    },
    {
      icon: <Clock size={18} strokeWidth={1.6} />,
      label: "0 → 100 km/h",
      value: `${s.performance.acceleration.toFixed(1).replace(".", ",")} s`,
    },
    {
      icon: <Fuel size={18} strokeWidth={1.6} />,
      label: "Consommation",
      value: `${s.performance.consumption.toFixed(1).replace(".", ",")} L / 100 km`,
    },
    {
      icon: <Leaf size={18} strokeWidth={1.6} />,
      label: s.performance.electricRange ? "Autonomie élec." : "CO₂ WLTP",
      value: s.performance.electricRange
        ? `${s.performance.electricRange} km`
        : `${s.performance.co2} g/km`,
    },
  ];
  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted]">
          Caractéristiques
        </div>
        <h2 className="display text-3xl font-medium leading-tight sm:text-4xl">
          Sous le capot, dans l'habitacle,{" "}
          <span className="serif-italic ink-text">rien n'est caché.</span>
        </h2>
      </div>

      {/* Headline metric strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {headline.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-[--brand-border] bg-white p-5"
          >
            <div className="flex items-center gap-2 text-[--brand-ink-muted]">
              {m.icon}
              <span className="text-[11px] uppercase tracking-[0.22em]">{m.label}</span>
            </div>
            <div className="display mt-3 text-2xl font-medium text-[--brand-ink] sm:text-3xl">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SpecCard
          title="Dimensions"
          icon={<Ruler size={18} strokeWidth={1.6} />}
          rows={[
            ["Longueur", `${s.dimensions.length} mm`],
            ["Largeur", `${s.dimensions.width} mm`],
            ["Hauteur", `${s.dimensions.height} mm`],
            ["Empattement", `${s.dimensions.wheelbase} mm`],
            [
              "Coffre",
              `${s.dimensions.trunk} L${
                s.dimensions.trunkMax ? ` · jusqu'à ${s.dimensions.trunkMax} L` : ""
              }`,
            ],
            ["Poids à vide", `${s.dimensions.weight} kg`],
            ...(s.dimensions.turningCircle
              ? [["Diamètre de braquage", `${s.dimensions.turningCircle.toFixed(1).replace(".", ",")} m`] as [string, string]]
              : []),
          ]}
        />

        <SpecCard
          title="Intérieur"
          icon={<Cog size={18} strokeWidth={1.6} />}
          rows={[
            ["Écran central", s.interior.touchscreen],
            ...(s.interior.digitalCluster
              ? [["Combiné numérique", s.interior.digitalCluster] as [string, string]]
              : []),
            ["Places", `${s.interior.seats}`],
            ["Sellerie", s.interior.upholstery],
            ...(s.interior.sound ? [["Audio", s.interior.sound] as [string, string]] : []),
            [
              "Réservoir",
              s.performance.fuelTank ? `${s.performance.fuelTank} L` : "—",
            ],
          ]}
        />

        <SpecCard
          title="Garantie Maroc"
          icon={<ShieldCheck size={18} strokeWidth={1.6} />}
          rows={[
            ["Véhicule", `${s.warranty.vehicleYears} ans`],
            ...(s.warranty.batteryYears
              ? [["Batterie haute-tension", `${s.warranty.batteryYears} ans`] as [string, string]]
              : []),
            ...(s.warranty.paintYears
              ? [["Peinture", `${s.warranty.paintYears} ans`] as [string, string]]
              : []),
            ...(s.warranty.assistanceYears
              ? [["Assistance routière 24 h/24", `${s.warranty.assistanceYears} ans`] as [string, string]]
              : []),
            ["Entretien programmé", "Tous les 20 000 km / 2 ans"],
          ]}
        />

        <SpecCardList
          title="Sécurité"
          icon={<ShieldCheck size={18} strokeWidth={1.6} />}
          items={s.safety}
          className="lg:col-span-2"
        />

        <SpecCardList
          title="Connectivité"
          icon={<Wifi size={18} strokeWidth={1.6} />}
          items={s.connectivity}
        />
      </div>
    </div>
  );
}

function SpecCard({
  title,
  icon,
  rows,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  rows: [string, string][];
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[--brand-border] bg-white p-6 ${className}`}
    >
      <div className="mb-4 flex items-center gap-2 text-[--brand-ink-muted]">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.22em]">{title}</span>
      </div>
      <dl className="divide-y divide-[--brand-border] text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-[--brand-ink-muted]">{k}</dt>
            <dd className="text-end font-medium text-[--brand-ink]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SpecCardList({
  title,
  icon,
  items,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[--brand-border] bg-white p-6 ${className}`}
    >
      <div className="mb-4 flex items-center gap-2 text-[--brand-ink-muted]">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.22em]">{title}</span>
      </div>
      <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[--brand-ink-soft]"
          >
            <span
              className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full"
              style={{ background: "var(--brand-primary)" }}
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
