import type { ReactNode } from "react";
import { cn } from "./cn";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  fade?: boolean;
};

export function Marquee({ children, className, fade = true }: MarqueeProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fade &&
          "[mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]",
        className
      )}
    >
      <div className="marquee-track flex w-max gap-16 py-6">
        <div className="flex items-center gap-16 whitespace-nowrap">
          {children}
        </div>
        <div className="flex items-center gap-16 whitespace-nowrap" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
