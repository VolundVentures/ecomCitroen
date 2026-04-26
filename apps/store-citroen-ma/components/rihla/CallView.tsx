"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Keyboard, SendHorizonal, X, ExternalLink } from "lucide-react";
import type { LiveState } from "@/lib/use-rihla-live";
import type { ImageCardPayload } from "@/lib/rihla-actions";

type CallViewProps = {
  state: LiveState;
  onHangUp: () => void;
  duration: number;
  accent?: string;
  brandName?: string;
  /** When provided, exposes a "type" affordance the user can tap to send text mid-call. */
  onSendText?: (text: string) => void;
  /** Locale for the typing affordance label. */
  locale?: "fr" | "ar" | "en" | "darija" | null;
  /** When the agent calls show_model_image during a voice call, render the image overlay. */
  currentImage?: ImageCardPayload | null;
  /** When the agent asks the user to type something, this gets bumped — opens
   *  the inline keyboard automatically, optional placeholder hint. */
  typeRequest?: { id: number; placeholder?: string } | null;
};

const TYPE_LABELS: Record<NonNullable<CallViewProps["locale"]>, { tap: string; placeholder: string; sent: string }> = {
  fr: { tap: "Écrire", placeholder: "Tapez votre nom, numéro…", sent: "Envoyé" },
  darija: { tap: "كتب", placeholder: "كتب الاسم، الرقم…", sent: "تم الإرسال" },
  ar: { tap: "اكتب", placeholder: "اكتب الاسم، الرقم…", sent: "تم الإرسال" },
  en: { tap: "Type", placeholder: "Type your name, number…", sent: "Sent" },
};

export function CallView({
  state,
  onHangUp,
  duration,
  accent = "#60a5fa",
  brandName = "Rihla",
  onSendText,
  locale,
  currentImage,
  typeRequest,
}: CallViewProps) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isActive = state === "listening" || state === "speaking" || state === "connected";
  const statusLabel =
    state === "speaking"
      ? "Rihla parle…"
      : state === "listening"
      ? "À vous…"
      : state === "connecting"
      ? "Connexion…"
      : "En appel";

  const dotColor = state === "listening" ? "#22c55e" : state === "speaking" ? accent : "#a3e635";

  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [sentFlash, setSentFlash] = useState(false);
  const [autoPlaceholder, setAutoPlaceholder] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labels = TYPE_LABELS[locale ?? "fr"];
  const isRtl = locale === "ar" || locale === "darija";
  const placeholder = autoPlaceholder ?? labels.placeholder;

  useEffect(() => {
    if (typing) inputRef.current?.focus();
  }, [typing]);

  // Auto-open the keyboard whenever the agent asks the user to type something
  // (name, phone). The bubble bumps `typeRequest.id` each time the assistant
  // turn includes a "type" trigger word.
  useEffect(() => {
    if (!typeRequest) return;
    setAutoPlaceholder(typeRequest.placeholder ?? null);
    setTyping(true);
  }, [typeRequest]);

  const send = useCallback(() => {
    const t = text.trim();
    if (!t || !onSendText) return;
    onSendText(t);
    setText("");
    setAutoPlaceholder(null);
    setSentFlash(true);
    setTimeout(() => setSentFlash(false), 1100);
  }, [text, onSendText]);

  return (
    <div
      className="relative flex h-full flex-col items-center justify-between overflow-hidden px-6 py-8"
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, ${accent}22 0%, #0e0e10 60%, #0a0a0c 100%)`,
      }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
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

      {/* Center: avatar */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-12 rounded-full blur-3xl"
          style={{ background: `${accent}30` }}
        />

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

        <div className="relative mt-6 text-center">
          <div className="text-xl font-semibold tracking-tight text-white">Rihla</div>
          <div className="mt-0.5 text-[12px] text-white/45">Conseillère · {brandName}</div>

          {/* Equalizer is positioned ABSOLUTELY below the name so it doesn't
              push the image card down when the agent starts speaking. */}
          <AnimatePresence>
            {state === "speaking" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 -bottom-7 flex items-end justify-center gap-1"
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
      </div>

      {/* Inline car image — appears when the agent fires show_model_image
          during a voice call. Anchored fixed above the bottom controls so
          the equalizer / avatar scaling never pushes it down or hides the
          "View on official site" CTA. */}
      <AnimatePresence>
        {currentImage?.imageUrl && (
          <motion.div
            key={currentImage.imageUrl}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0, 1] }}
            className="absolute bottom-[148px] left-1/2 z-20 w-[min(360px,calc(100vw-48px))] -translate-x-1/2 overflow-hidden rounded-2xl bg-white/[0.04] shadow-[0_18px_42px_-12px_rgba(0,0,0,0.55)]"
            style={{ boxShadow: `0 18px 42px -12px ${accent}55, 0 0 0 1px rgba(255,255,255,0.08)` }}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage.imageUrl}
                alt={currentImage.caption ?? ""}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              {currentImage.caption && (
                <div className="absolute inset-x-0 bottom-0 px-3.5 pb-2 pt-6">
                  <div className="text-[12.5px] font-semibold text-white drop-shadow-sm">
                    {currentImage.caption}
                  </div>
                </div>
              )}
            </div>
            {currentImage.ctaUrl && (
              <a
                href={currentImage.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3.5 py-2 text-[12px] font-medium transition hover:bg-white/[0.04]"
                style={{ color: accent }}
              >
                <span>{currentImage.ctaLabel ?? "View on official site"}</span>
                <ExternalLink size={12} strokeWidth={2} />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom: controls */}
      <div className="relative flex flex-col items-center gap-3">
        {/* Inline text input — slides in when the user taps "Type" */}
        <AnimatePresence>
          {typing && onSendText && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 0.68, 0, 1] }}
              className="mb-1 flex w-[min(360px,calc(100vw-48px))] items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] p-1.5 backdrop-blur-xl"
              style={{ boxShadow: `0 12px 32px -8px ${accent}55` }}
            >
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); send(); }
                  if (e.key === "Escape") { setTyping(false); setText(""); }
                }}
                placeholder={placeholder}
                className="flex-1 bg-transparent px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-white/35"
              />
              <motion.button
                type="button"
                onClick={send}
                disabled={!text.trim()}
                whileTap={{ scale: 0.92 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition disabled:opacity-30"
                style={{ background: accent }}
                aria-label="Send"
              >
                <SendHorizonal size={15} strokeWidth={2} />
              </motion.button>
              <button
                type="button"
                onClick={() => { setTyping(false); setText(""); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/55 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Close keyboard"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sentFlash && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10.5px] uppercase tracking-[0.18em] text-emerald-300/85"
            >
              {labels.sent}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-7">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/75"
            title={state === "listening" ? "Mic on" : "Mic muted"}
            aria-label="Microphone"
          >
            {state === "listening" ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

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

          {onSendText ? (
            <motion.button
              type="button"
              onClick={() => setTyping((v) => !v)}
              whileTap={{ scale: 0.92 }}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                typing ? "bg-white text-[#0c0c10]" : "bg-white/10 text-white/75 hover:bg-white/15 hover:text-white"
              }`}
              aria-label={labels.tap}
              title={labels.tap}
            >
              <Keyboard size={18} />
            </motion.button>
          ) : (
            <div className="h-12 w-12" />
          )}
        </div>

        {onSendText && !typing && (
          <button
            type="button"
            onClick={() => setTyping(true)}
            className="text-[11px] uppercase tracking-[0.2em] text-white/40 transition hover:text-white/70"
          >
            {labels.tap} ↑
          </button>
        )}
      </div>
    </div>
  );
}
