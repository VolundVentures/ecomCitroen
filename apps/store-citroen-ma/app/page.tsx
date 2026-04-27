import Image from "next/image";
import Link from "next/link";

const agents = [
  {
    slug: "citroen-ma",
    name: "Citroën Maroc",
    market: "Morocco",
    logo: "/brands/citroen-ma/logo.svg",
    accent: "#e3251c",
    href: "/demo/citroen-ma",
  },
  {
    slug: "jeep-ma",
    name: "Jeep Maroc",
    market: "Morocco",
    logo: "/brands/jeep-ma/logo.svg",
    accent: "#2d6a4f",
    href: "/demo/jeep-ma",
  },
  {
    slug: "peugeot-ksa",
    name: "Peugeot KSA",
    market: "Saudi Arabia",
    logo: "/brands/peugeot-ksa/logo.svg",
    accent: "#1d4ed8",
    href: "/demo/peugeot-ksa",
  },
];

export default function RootPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-[#08080b] px-4 py-16">
      <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/40">
        Stellantis Demo
      </p>
      <h1 className="mb-3 text-center text-3xl font-semibold text-white">
        Choose your agent
      </h1>
      <p className="mb-12 text-center text-[14px] text-white/55">
        Select a brand to launch its AI sales assistant
      </p>

      <div className="flex w-full max-w-3xl flex-col gap-4 sm:flex-row">
        {agents.map((agent) => (
          <Link
            key={agent.slug}
            href={agent.href}
            className="group relative flex flex-1 flex-col items-center gap-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-8 text-center transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition group-hover:opacity-100"
              style={{ background: `linear-gradient(90deg, transparent, ${agent.accent}, transparent)` }}
            />

            <div className="relative h-14 w-28">
              <Image
                src={agent.logo}
                alt={agent.name}
                fill
                className="object-contain"
                sizes="112px"
              />
            </div>

            <div>
              <div className="text-[15px] font-semibold text-white">{agent.name}</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-white/40">
                {agent.market}
              </div>
            </div>

            <span
              className="mt-auto inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-medium text-white transition group-hover:brightness-110"
              style={{ background: agent.accent }}
            >
              Open demo
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 9L9 2M9 2H4M9 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
