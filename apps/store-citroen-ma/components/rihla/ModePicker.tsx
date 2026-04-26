"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, PhoneCall, Sparkles } from "lucide-react";
import type { VoiceLang } from "@/components/rihla/LanguagePicker";

export type Mode = "chat" | "voice";

const COPY: Record<VoiceLang, { title: string; subtitle: string; chat: { title: string; sub: string }; voice: { title: string; sub: string } }> = {
  fr: {
    title: "Comment préférez-vous discuter ?",
    subtitle: "Rihla peut répondre par message ou en appel vocal.",
    chat: { title: "Par message", sub: "Réponse instantanée, à votre rythme." },
    voice: { title: "Appel vocal", sub: "Conversation naturelle, comme au téléphone." },
  },
  darija: {
    title: "كيفاش بغيتي تهضر ؟",
    subtitle: "تقدر تكتب ولا تهضر معاها مباشرة.",
    chat: { title: "بالكتابة", sub: "جواب سريع، بالوقت ديالك." },
    voice: { title: "مكالمة صوتية", sub: "محادثة طبيعية، كأنك ف التيليفون." },
  },
  ar: {
    title: "كيف تفضل التواصل ؟",
    subtitle: "يمكنك الكتابة أو الاتصال بـ رحلة مباشرة.",
    chat: { title: "كتابياً", sub: "ردود فورية، على راحتك." },
    voice: { title: "مكالمة صوتية", sub: "محادثة طبيعية، كأنك تتصل هاتفياً." },
  },
  en: {
    title: "How would you like to chat?",
    subtitle: "Rihla can answer by message or live voice call.",
    chat: { title: "By message", sub: "Instant replies, at your own pace." },
    voice: { title: "Voice call", sub: "Natural conversation, like a phone call." },
  },
};

export function ModePicker({
  lang,
  accent,
  onSelect,
  onBack,
}: {
  lang: VoiceLang;
  accent: string;
  onSelect: (mode: Mode) => void;
  onBack?: () => void;
}) {
  const copy = COPY[lang];
  const isRtl = lang === "ar" || lang === "darija";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col bg-gradient-to-b from-[#fafafa] to-white px-5 py-7"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 0.68, 0, 1] }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ background: `${accent}12`, color: accent }}
        >
          <Sparkles size={11} strokeWidth={2} /> Rihla
        </motion.div>
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mt-3 text-balance text-[18px] font-semibold leading-snug text-[#0c0c10]"
        >
          {copy.title}
        </motion.h3>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="mt-1.5 text-[13px] leading-relaxed text-black/50"
        >
          {copy.subtitle}
        </motion.p>
      </div>

      <div className="mt-7 flex flex-1 flex-col justify-center gap-3">
        <ModeCard
          delay={0.2}
          onClick={() => onSelect("chat")}
          accent={accent}
          icon={<MessageSquare size={22} strokeWidth={1.7} />}
          title={copy.chat.title}
          subtitle={copy.chat.sub}
        />
        <ModeCard
          delay={0.28}
          onClick={() => onSelect("voice")}
          accent={accent}
          variant="filled"
          icon={<PhoneCall size={22} strokeWidth={1.7} />}
          title={copy.voice.title}
          subtitle={copy.voice.sub}
        />
      </div>

      {onBack && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.36 }}
          type="button"
          onClick={onBack}
          className="mx-auto mt-2 text-[11px] text-black/35 transition hover:text-black/60"
        >
          {lang === "ar" || lang === "darija" ? "← غير اللغة" : "← Change language"}
        </motion.button>
      )}
    </motion.div>
  );
}

function ModeCard({
  delay,
  onClick,
  accent,
  icon,
  title,
  subtitle,
  variant = "outline",
}: {
  delay: number;
  onClick: () => void;
  accent: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: "outline" | "filled";
}) {
  const filled = variant === "filled";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 0.68, 0, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-start transition"
      style={
        filled
          ? { background: accent, color: "white" }
          : { background: "white", color: "#0c0c10", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)" }
      }
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105"
        style={filled ? { background: "rgba(255,255,255,0.18)" } : { background: `${accent}10`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold leading-snug">{title}</div>
        <div
          className="mt-0.5 text-[12px] leading-snug"
          style={{ color: filled ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.45)" }}
        >
          {subtitle}
        </div>
      </div>
      <ArrowRight
        size={16}
        strokeWidth={2}
        className="shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100 rtl:rotate-180"
      />
    </motion.button>
  );
}
