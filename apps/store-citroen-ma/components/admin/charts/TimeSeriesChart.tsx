"use client";

import { motion } from "framer-motion";

type Point = { date: string; total: number; leads: number };

export function TimeSeriesChart({ data, accent }: { data: Point[]; accent: string }) {
  const w = 720;
  const h = 220;
  const padX = 24;
  const padY = 16;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const maxY = Math.max(1, ...data.map((d) => Math.max(d.total, d.leads)));
  const niceMax = Math.ceil(maxY * 1.15);

  const x = (i: number) => padX + (innerW * i) / Math.max(1, data.length - 1);
  const y = (v: number) => padY + innerH - (innerH * v) / niceMax;

  const totalPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.total).toFixed(1)}`).join(" ");
  const leadPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.leads).toFixed(1)}`).join(" ");

  const totalArea = `${totalPath} L${x(data.length - 1).toFixed(1)},${(padY + innerH).toFixed(1)} L${x(0).toFixed(1)},${(padY + innerH).toFixed(1)} Z`;

  const gridYs = [0.25, 0.5, 0.75].map((p) => padY + innerH * p);

  // Pick ~5 evenly spaced labels.
  const labelEvery = Math.max(1, Math.floor(data.length / 5));

  return (
    <div className="mt-3 w-full overflow-x-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" preserveAspectRatio="none" style={{ height: 220 }}>
        <defs>
          <linearGradient id="ts-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridYs.map((gy, i) => (
          <line key={i} x1={padX} x2={w - padX} y1={gy} y2={gy} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
        ))}

        {/* Total area */}
        <motion.path
          d={totalArea}
          fill="url(#ts-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={totalPath}
          fill="none"
          stroke={accent}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />

        {/* Leads line */}
        <motion.path
          d={leadPath}
          fill="none"
          stroke="#10b981"
          strokeWidth={1.6}
          strokeDasharray="4,4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
        />

        {/* Lead dots */}
        {data.map((d, i) =>
          d.leads > 0 ? (
            <circle key={i} cx={x(i)} cy={y(d.leads)} r={2.5} fill="#10b981" />
          ) : null
        )}

        {/* X axis ticks */}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text
              key={d.date}
              x={x(i)}
              y={h - 2}
              textAnchor="middle"
              fontSize={9}
              fill="rgba(255,255,255,0.35)"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              {d.date.slice(5)}
            </text>
          ) : null
        )}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 px-1 text-[11px] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[6px] w-3 rounded-full" style={{ background: accent }} />
          Conversations
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[6px] w-3 rounded-full bg-emerald-500" />
          Leads
        </span>
      </div>
    </div>
  );
}
