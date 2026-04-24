import type { ReactNode } from "react";
import { Container, Eyebrow } from "@citroen-store/ui";

type Props = {
  eyebrow: string;
  title: string;
  sub?: string;
  children?: ReactNode;
};

export function SimplePageShell({ eyebrow, title, sub, children }: Props) {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-[360px] mesh-light opacity-70" aria-hidden />
      <Container className="relative max-w-3xl">
        <Eyebrow className="text-[--brand-primary]">{eyebrow}</Eyebrow>
        <h1 className="display mt-4 text-[clamp(2.25rem,6vw,5rem)] font-medium leading-[0.96] tracking-[-0.04em]">
          {title}
        </h1>
        {sub && (
          <p className="mt-5 max-w-xl text-base text-[--brand-ink-muted] sm:text-lg">
            {sub}
          </p>
        )}
        {children && <div className="mt-10 space-y-6 text-[--brand-ink]">{children}</div>}
      </Container>
    </section>
  );
}
