"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff } from "lucide-react";
import type { LiveState } from "@/lib/use-rihla-live";

type CallViewProps = {
  state: LiveState;
  onHangUp: () => void;
  duration: number;
};

export function CallView({ state, onHangUp, duration }: CallViewProps) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isActive = state === "listening" || state === "speaking" || state === "connected";
  const statusLabel =
    state === "speaking" ? "Rihla parle…"
    : state === "listening" ? "À vous…"
    : state === "connecting" ? "Connexion…"
    : "En appel";

  return (
    <div className="flex h-full flex-col items-center justify-between bg-gradient-to-b from-[#1a1a1e] to-[#0e0e10] px-6 py-8">
      {/* Top: status */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
          <motion.span
            className="h-2 w-2 rounded-full"
            style={{ background: state === "listening" ? "#22c55e" : state === "speaking" ? "#60a5fa" : "#a3e635" }}
            animate={isActive ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          {statusLabel}
        </div>
        <div className="mt-2 font-mono text-lg text-white/60">{timeStr}</div>
      </div>

      {/* Center: avatar with audio visualization */}
      <div className="relative">
        {/* Animated rings */}
        <AnimatePresence>
          {state === "speaking" && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-blue-400/20"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 1 + i * 0.25, opacity: 0 }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
            </>
          )}
          {state === "listening" && (
            <>
              {[1, 2].map((i) => (
                <motion.div
                  key={`l-${i}`}
                  className="absolute inset-0 rounded-full border border-emerald-400/20"
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1 + i * 0.15, opacity: 0 }}
                  transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Avatar */}
        <motion.div
          className="relative h-36 w-36 overflow-hidden rounded-full shadow-[0_0_60px_-15px_rgba(96,165,250,0.3)]"
          animate={
            state === "speaking"
              ? { scale: [1, 1.04, 1] }
              : state === "listening"
              ? { scale: [1, 1.02, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/brand/rihla-avatar.jpg"
            alt="Rihla"
            fill
            className="object-cover"
            sizes="144px"
            priority
          />
          {/* Overlay glow based on state */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                state === "speaking"
                  ? "radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)"
                  : state === "listening"
                  ? "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)"
                  : "none",
            }}
          />
        </motion.div>

        {/* Name */}
        <div className="mt-5 text-center">
          <div className="text-lg font-semibold text-white">Rihla</div>
          <div className="text-[12px] text-white/45">Conseillère Citroën Maroc</div>
        </div>
      </div>

      {/* Bottom: controls */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70"
          title={state === "listening" ? "Micro actif" : "Micro en pause"}
        >
          {state === "listening" ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          type="button"
          onClick={onHangUp}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)] transition hover:bg-red-600"
        >
          <PhoneOff size={24} />
        </button>

        <div className="h-10 w-10" />
      </div>
    </div>
  );
}
