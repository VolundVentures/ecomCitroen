import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-primary] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      intent: {
        primary:
          "bg-[--brand-primary] text-white hover:bg-[--brand-primary-hover] active:translate-y-px",
        secondary:
          "bg-[--brand-ink] text-white hover:bg-black",
        ghost:
          "bg-transparent text-[--brand-ink] hover:bg-[--brand-surface-alt]",
        outline:
          "border border-[--brand-border] bg-transparent text-[--brand-ink] hover:border-[--brand-ink]",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-md",
        md: "h-11 px-5 text-sm rounded-md",
        lg: "h-14 px-8 text-base rounded-lg tracking-wide uppercase",
      },
    },
    defaultVariants: { intent: "primary", size: "md" },
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, intent, size, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(button({ intent, size }), className)}
      {...props}
    />
  );
});
