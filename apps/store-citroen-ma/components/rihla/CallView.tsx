"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff } from "lucide-react";
import type { LiveState } from "@/lib/use-rihla-live";

type CallViewProps = {
  state: LiveState;
  onHangUp: () => void;
  duration: number;
  accent?: string;
  brandName?: string;
};

export function CallView({ state, onHangUp, duration, accent = "#60a5fa", brandName = "Rihla" }: CallViewProps) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isActive = state === "listening" || state === "speaking" || state === "connected";
  const statusLabel =
    state === "speaking" ? "Rihla parle…"
    : state === "listening" ? "À vous…"
    : state === "connecting" ? "Connexion…"
    : "En appel";

  const dotColor = state === "listening" ? "#22c55e" : state === "speaking" ? accent : "#a3e635";

  return (
    <div
      className="relative flex h-full flex-col items-center justify-between overflow-hidden px-6 py-8"
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, ${accent}22 0%, #0e0e10 60%, #0a0a0c 100%)`,
      }}
    >
      {/* Subtle grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Top: status */}
      <div className="relative text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/50">
          <motion.span
            className="h-2 w-2 rounded-full"
            style={{ background: dotColor, boxShadow: `0 0 12px ${dotColor}` }}
            animate={isActive ? { scale: [1, 1.45, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          {statusLabel}
        </div>
        <div className="mt-2 font-mono text-base tabular-nums text-white/55">{timeStr}</div>
      </div>

      {/* Center: avatar with audio visualization */}
      <div className="relative">
        {/* Halo blob */}
        <div
          aria-hidden
          className="absolute -inset-12 rounded-full blur-3xl"
          style={{ background: `${accent}30` }}
        />

        {/* Animated rings */}
        <AnimatePresence>
          {state === "speaking" && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1.5px solid ${accent}` }}
                  initial={{ scale: 1, opacity: 0.55 }}
                  animate={{ scale: 1 + i * 0.32, opacity: 0 }}
                  transition={{ duration: 1.8, delay: i * 0.28, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
            </>
          )}
          {state === "listening" && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={`l-${i}`}
                  className="absolute inset-0 rounded-full border border-emerald-400/35"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 1 + i * 0.2, opacity: 0 }}
                  transition={{ duration: 2.2, delay: i * 0.35, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Avatar */}
        <motion.div
          className="relative h-44 w-44 overflow-hidden rounded-full ring-4 ring-white/10"
          style={{
            boxShadow: `0 0 80px -10px ${accent}66, 0 0 0 1px rgba(255,255,255,0.1)`,
          }}
          animate={
            state === "speaking"
              ? { scale: [1, 1.045, 1] }
              : state === "listening"
              ? { scale: [1, 1.02, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/brand/rihla-avatar.jpg"
            alt="Rihla"
            fill
            className="object-cover"
            sizes="176px"
            priority
          />
          <div
            className="absolute inset-0 rounded-full mix-blend-soft-light"
            style={{
              background:
                state === "speaking"
                  ? `radial-gradient(circle, ${accent}40 0%, transparent 70%)`
                  : state === "listening"
                  ? "radial-gradient(circle, rgba(34,197,94,0.32) 0%, transparent 70%)"
                  : "none",
            }}
          />
        </motion.div>

        {/* Name */}
        <div className="mt-6 text-center">
          <div className="text-xl font-semibold tracking-tight text-white">Rihla</div>
          <div className="mt-0.5 text-[12px] text-white/45">Conseillère · {brandName}</div>
        </div>

        {/* Equalizer bars (speaking only) */}
        <AnimatePresence>
          {state === "speaking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 flex items-end justify-center gap-1"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.span
                  key={i}
                  className="block w-[3px] rounded-full"
                  style={{ background: accent }}
                  animate={{ height: [6, 16 + (i % 3) * 6, 8, 14, 6] }}
                  transition={{ duration: 0.8, delay: i * 0.05, repeat: Infinity }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: controls */}
      <div className="relative flex items-center gap-8">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/75"
          title={state === "listening" ? "Micro actif" : "Micro en pause"}
        >
          {state === "listening" ? <Mic size={18} /> : <MicOff size={18} />}
        </div>

        <motion.button
          type="button"
          onClick={onHangUp}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_42px_-6px_rgba(239,68,68,0.65)] transition hover:bg-red-600"
          aria-label="Hang up"
        >
          <PhoneOff size={22} />
        </motion.button>

        <div className="h-12 w-12" />
      </div>
    </div>
  );
}
