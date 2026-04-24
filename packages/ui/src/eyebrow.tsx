import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Eyebrow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em]",
        className
      )}
      {...props}
    >
      <span className="inline-block h-[1px] w-8 bg-current opacity-60" />
      {children}
    </div>
  );
}
