"use client";

import { motion } from "framer-motion";

export function HourHeatmap({ hours, accent }: { hours: number[]; accent: string }) {
  const max = Math.max(1, ...hours);
  return (
    <div className="mt-3">
      <div className="grid grid-cols-12 gap-1.5 sm:grid-cols-24" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
        {hours.map((c, h) => {
          const intensity = c / max;
          return (
            <motion.div
              key={h}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: h * 0.012 }}
              className="group relative aspect-square rounded-md"
              style={{
                background: c === 0 ? "rgba(255,255,255,0.04)" : `${accent}${Math.max(20, Math.round(intensity * 240)).toString(16).padStart(2, "0")}`,
              }}
              title={`${h.toString().padStart(2, "0")}:00 — ${c} conv.`}
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] font-medium text-white/0 transition group-hover:text-white/80">
                {c}
              </span>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-12 gap-1.5 text-center text-[8px] text-white/30 sm:grid-cols-24" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
        {hours.map((_, h) =>
          h % 4 === 0 ? <span key={h} style={{ gridColumn: `${h + 1}` }}>{h.toString().padStart(2, "0")}</span> : <span key={h} />
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10.5px] text-white/40">
        <span>Less</span>
        <span className="inline-flex gap-0.5">
          {[0.15, 0.35, 0.6, 0.85, 1].map((p) => (
            <span key={p} className="h-3 w-3 rounded-sm" style={{ background: `${accent}${Math.round(p * 240).toString(16).padStart(2, "0")}` }} />
          ))}
        </span>
        <span>More</span>
      </div>
    </div>
  );
}
