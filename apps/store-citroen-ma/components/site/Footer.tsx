import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@citroen-store/ui";

export function Footer() {
  const t = useTranslations("footer");
  const navT = useTranslations("nav");
  const locale = useLocale();
  return (
    <footer
      className="relative overflow-hidden text-[--brand-ink]"
      style={{ background: "var(--brand-surface-sand)" }}
    >
      <div className="absolute inset-0 grid-bg-light opacity-50" aria-hidden />
      <div className="noise-subtle absolute inset-0 opacity-30" aria-hidden />

      <Container className="relative py-20">
        <div className="grid grid-cols-2 gap-y-12 md:grid-cols-5">
          <div className="col-span-2 max-w-sm">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/citroen-logo.png"
                alt="Citroën"
                width={42}
                height={46}
                className="h-10 w-auto"
              />
              <span className="display text-[11px] font-medium uppercase tracking-[0.3em] text-[--brand-ink-muted]">
                MAROC
              </span>
            </div>
            <p className="mt-6 max-w-xs text-sm text-[--brand-ink-soft]">
              {t("description")}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[--brand-ink]/10 bg-white/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[--brand-ink-muted] backdrop-blur-sm">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-accent-amber)" }}
              />
              Propulsé par Rihla
            </div>
          </div>

          {[
            {
              title: t("explore"),
              links: [
                { href: `/${locale}/models`, label: navT("models") },
                { href: `/${locale}/financing`, label: navT("financing") },
                { href: `/${locale}/dealers`, label: navT("dealers") },
              ],
            },
            {
              title: t("account"),
              links: [
                { href: `/${locale}/account`, label: t("my_account") },
                { href: `/${locale}/orders`, label: t("orders") },
                { href: `/${locale}/service`, label: t("service") },
              ],
            },
            {
              title: t("legal_col"),
              links: [
                { href: `/${locale}/legal`, label: t("legal") },
                { href: `/${locale}/privacy`, label: t("privacy") },
                { href: `/${locale}/terms`, label: t("terms") },
              ],
            },
          ].map((col) => (
            <div key={col.title} className="col-span-1">
              <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-[--brand-ink-muted]">
                {col.title}
              </div>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[--brand-ink-soft] transition-colors hover:text-[--brand-ink]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-[--brand-ink]/10 pt-8 md:flex-row md:items-center">
          <div className="text-xs text-[--brand-ink-muted]">{t("rights")}</div>
          <div className="display text-[clamp(3rem,8vw,6rem)] font-medium leading-none tracking-[-0.05em] text-[--brand-ink]/10">
            CITROËN
          </div>
        </div>
      </Container>
    </footer>
  );
}
