import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Chip({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[--brand-border] bg-[--brand-surface] px-3 py-1 text-xs font-medium uppercase tracking-widest text-[--brand-ink]",
        className
      )}
      {...props}
    />
  );
}
