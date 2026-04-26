"use client";

import { motion } from "framer-motion";

export function ChannelDonut({ chat, voice, accent }: { chat: number; voice: number; accent: string }) {
  const total = chat + voice;
  if (total === 0) {
    return <div className="py-6 text-center text-[12px] text-white/35">No data.</div>;
  }
  const chatPct = (chat / total) * 100;
  const voicePct = 100 - chatPct;

  // Stroke-dash math on a 100-circumference circle — easier than sweeps.
  const r = 56;
  const C = 2 * Math.PI * r;

  return (
    <div className="mt-3 flex items-center justify-center gap-7">
      <svg viewBox="0 0 160 160" width={160} height={160}>
        <circle cx={80} cy={80} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={20} fill="none" />
        <motion.circle
          cx={80}
          cy={80}
          r={r}
          stroke={accent}
          strokeWidth={20}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${C}`, opacity: 0 }}
          animate={{ strokeDasharray: `${(chatPct / 100) * C} ${C}`, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          transform="rotate(-90 80 80)"
        />
        <motion.circle
          cx={80}
          cy={80}
          r={r}
          stroke="#8b5cf6"
          strokeWidth={20}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${C}`, strokeDashoffset: 0, opacity: 0 }}
          animate={{
            strokeDasharray: `${(voicePct / 100) * C} ${C}`,
            strokeDashoffset: -((chatPct / 100) * C),
            opacity: 1,
          }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          transform="rotate(-90 80 80)"
        />
        <text x={80} y={78} textAnchor="middle" fill="white" fontSize={26} fontWeight={600} fontFamily="ui-sans-serif">
          {total}
        </text>
        <text x={80} y={96} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10} letterSpacing={2}>
          TOTAL
        </text>
      </svg>

      <div className="space-y-3 text-[12px]">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: accent }} />
          <div>
            <div className="text-white/85">Chat</div>
            <div className="text-[10.5px] text-white/40">
              {chat} · {chatPct.toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-violet-500" />
          <div>
            <div className="text-white/85">Voice</div>
            <div className="text-[10.5px] text-white/40">
              {voice} · {voicePct.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
