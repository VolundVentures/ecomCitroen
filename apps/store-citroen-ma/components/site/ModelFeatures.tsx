import {
  ShieldCheck,
  Wifi,
  Armchair,
  Gauge,
  Wrench,
  CloudSun,
} from "lucide-react";
import { ScrollReveal } from "@citroen-store/ui";

const features = [
  {
    icon: <Armchair size={20} strokeWidth={1.5} />,
    title: "Advanced Comfort®",
    body: "Sièges et suspensions brevetés pour absorber les imperfections de la route. Spécifique Citroën.",
  },
  {
    icon: <ShieldCheck size={20} strokeWidth={1.5} />,
    title: "Sécurité active",
    body: "Freinage automatique d'urgence, maintien de voie, détection d'angles morts, reconnaissance des panneaux.",
  },
  {
    icon: <Wifi size={20} strokeWidth={1.5} />,
    title: "Connectée, simplement",
    body: "Écran tactile HD, Apple CarPlay & Android Auto sans fil, services connectés intégrés.",
  },
  {
    icon: <Gauge size={20} strokeWidth={1.5} />,
    title: "Performance mesurée",
    body: "Moteurs optimisés pour la conduite quotidienne marocaine — ville, autoroute, routes secondaires.",
  },
  {
    icon: <CloudSun size={20} strokeWidth={1.5} />,
    title: "Pensée pour le climat",
    body: "Climatisation automatique, pare-brise athermique, peintures protégées contre le soleil intense.",
  },
  {
    icon: <Wrench size={20} strokeWidth={1.5} />,
    title: "Entretien prévisible",
    body: "Réseau de concessionnaires officiels au Maroc. Pièces disponibles, garantie constructeur.",
  },
];

export function ModelFeatures() {
  return (
    <section>
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="display text-3xl font-medium leading-tight sm:text-4xl">
          Équipements qui comptent
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <ScrollReveal key={f.title} delay={i * 0.05}>
            <div className="group h-full rounded-3xl border border-[--brand-border] bg-white p-6 transition-all hover:border-[--brand-ink] hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.2)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[--brand-ink] text-white transition-colors group-hover:bg-[--brand-primary]">
                {f.icon}
              </div>
              <h3 className="display mt-5 text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[--brand-ink-muted]">
                {f.body}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
