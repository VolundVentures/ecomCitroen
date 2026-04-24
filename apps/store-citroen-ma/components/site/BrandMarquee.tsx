import { Marquee } from "@citroen-store/ui";

const items = [
  "DARIJA",
  "FRANÇAIS",
  "العربية",
  "ENGLISH",
  "CONFIGURATION VOCALE",
  "GARDIEN NUMÉRIQUE",
  "RÉSERVATION EN CONVERSATION",
  "LIVRAISON PARTOUT AU MAROC",
  "CASABLANCA",
  "MARRAKECH",
  "RABAT",
  "ESSAOUIRA",
  "CHEFCHAOUEN",
  "AGADIR",
];

export function BrandMarquee() {
  return (
    <div
      className="relative border-y overflow-hidden"
      style={{
        background: "var(--brand-ink)",
        borderColor: "var(--brand-border-ink)",
      }}
    >
      <div className="noise-subtle absolute inset-0 opacity-30" aria-hidden />
      <div className="relative py-5">
        <Marquee>
          {items.map((item, i) => (
            <div
              key={`${item}-${i}`}
              className="flex items-center gap-16 whitespace-nowrap"
            >
              <span className="display text-2xl font-medium uppercase tracking-[0.18em] text-white/90 sm:text-3xl">
                {item}
              </span>
              <span style={{ color: "var(--color-accent-amber)" }}>◦</span>
            </div>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
