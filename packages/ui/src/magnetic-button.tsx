"use client";

import { useRef, forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "./cn";

export type MagneticButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: "primary" | "ghost" | "outline-light";
  size?: "md" | "lg";
  icon?: ReactNode;
  strength?: number;
};

const intentStyles: Record<NonNullable<MagneticButtonProps["intent"]>, string> = {
  primary:
    "bg-white text-[--brand-ink] hover:bg-white/90 shadow-[0_12px_40px_-12px_rgba(255,255,255,0.3)]",
  ghost:
    "bg-transparent text-white border border-white/20 hover:border-white/60 hover:bg-white/5",
  "outline-light":
    "bg-transparent text-[--brand-ink] border border-[--brand-border] hover:border-[--brand-ink] hover:bg-[--brand-surface-alt]",
};

const sizeStyles: Record<NonNullable<MagneticButtonProps["size"]>, string> = {
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-sm",
};

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  function MagneticButton(
    { className, intent = "primary", size = "md", icon, strength = 18, children, ...props },
    ref
  ) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const x = useSpring(mouseX, { stiffness: 160, damping: 18, mass: 0.6 });
    const y = useSpring(mouseY, { stiffness: 160, damping: 18, mass: 0.6 });
    const rotateX = useTransform(y, [-strength, strength], [6, -6]);
    const rotateY = useTransform(x, [-strength, strength], [-6, 6]);

    function onMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
      const el = btnRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX.set(
        Math.max(-strength, Math.min(strength, (e.clientX - cx) / 2))
      );
      mouseY.set(
        Math.max(-strength, Math.min(strength, (e.clientY - cy) / 2))
      );
    }

    function onMouseLeave() {
      mouseX.set(0);
      mouseY.set(0);
    }

    return (
      <motion.button
        ref={(n) => {
          btnRef.current = n;
          if (typeof ref === "function") ref(n);
          else if (ref) ref.current = n;
        }}
        style={{ x, y, rotateX, rotateY, transformPerspective: 600 }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase tracking-[0.16em] transition-colors",
          "shimmer-layer overflow-hidden will-change-transform",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-primary] focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          intentStyles[intent],
          sizeStyles[size],
          className
        )}
        whileTap={{ scale: 0.97 }}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
          {icon}
        </span>
      </motion.button>
    );
  }
);
