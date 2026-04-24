"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { catalog, formatMAD } from "@/lib/catalog";

export function ModelSwitcher({ currentSlug }: { currentSlug: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const base = pathname?.startsWith(`/${locale}`) ? `/${locale}` : `/${locale}`;

  return (
    <section className="relative border-y border-[--brand-border] bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex shrink-0 items-center gap-2 pe-4 text-[11px] font-medium uppercase tracking-[0.22em] text-[--brand-ink-muted]">
          Passer à
          <span className="inline-block h-px w-8 bg-[--brand-border]" />
        </div>
        {catalog.map((m) => {
          const active = m.slug === currentSlug;
          return (
            <Link
              key={m.slug}
              href={`${base}/models/${m.slug}`}
              className={
                active
                  ? "group relative flex shrink-0 items-center gap-3 rounded-full bg-[--brand-ink] px-4 py-2 text-white"
                  : "group relative flex shrink-0 items-center gap-3 rounded-full border border-[--brand-border] bg-white px-4 py-2 text-[--brand-ink] transition-colors hover:border-[--brand-ink] hover:bg-[--brand-surface-alt]"
              }
              aria-current={active ? "page" : undefined}
            >
              <span
                className="relative h-8 w-12 shrink-0 overflow-hidden rounded-md"
                style={{
                  background: `radial-gradient(ellipse at 50% 45%, ${m.accentHex}55 0%, transparent 70%), #0a0a0a`,
                }}
              >
                {m.heroImage && (
                  <Image
                    src={m.heroImage}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-contain"
                  />
                )}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">
                  {m.shortName}
                </span>
                <span
                  className={
                    active
                      ? "text-[10px] uppercase tracking-[0.2em] text-white/60"
                      : "text-[10px] uppercase tracking-[0.2em] text-[--brand-ink-muted]"
                  }
                >
                  dès {formatMAD(m.priceFrom)} MAD
                </span>
              </span>
              {!active && (
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.8}
                  className="ms-1 opacity-50 transition-all group-hover:opacity-100"
                />
              )}
              {active && (
                <motion.span
                  layoutId="model-switcher-dot"
                  className="h-1.5 w-1.5 rounded-full bg-[--brand-primary]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
