"use client";

import { motion } from "framer-motion";

type Step = { label: string; count: number };

export function FunnelBars({ steps, accent }: { steps: Step[]; accent: string }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  const startCount = steps[0]?.count ?? 0;

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const pct = (step.count / max) * 100;
        const ofStart = startCount > 0 ? (step.count / startCount) * 100 : 0;
        const dropoff =
          i > 0 && (steps[i - 1]?.count ?? 0) > 0
            ? ((steps[i - 1]!.count - step.count) / steps[i - 1]!.count) * 100
            : 0;
        return (
          <div key={step.label} className="flex items-center gap-3 text-[11px]">
            <div className="w-20 truncate text-white/65">{step.label}</div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
              <motion.span
                className="absolute inset-y-0 start-0 rounded-md"
                style={{ background: `linear-gradient(90deg, ${accent}cc 0%, ${accent}88 100%)` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
              />
              <div className="relative z-10 flex h-full items-center justify-end px-2 text-[11px] tabular-nums">
                <span className="text-white/85">{step.count}</span>
                <span className="ms-2 text-white/40">{ofStart.toFixed(0)}%</span>
              </div>
            </div>
            <div className="w-12 text-end text-[10px] tabular-nums text-orange-300/70">
              {i > 0 && dropoff > 0 ? `−${dropoff.toFixed(0)}%` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
