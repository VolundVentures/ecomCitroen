"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle, Mic2 } from "lucide-react";

export type VoiceLang = "fr" | "ar" | "en" | "darija";

const LANGS: {
  id: VoiceLang;
  label: string;
  native: string;
  sttTag: string;
  greeting: string;
  flag: string;
}[] = [
  {
    id: "fr",
    label: "Français",
    native: "Français",
    sttTag: "fr-FR",
    greeting: "Merhba ! Je suis Rihla, votre conseillère Citroën. Qu'est-ce qui vous ferait plaisir aujourd'hui ?",
    flag: "🇫🇷",
  },
  {
    id: "darija",
    label: "Darija (الدارجة)",
    native: "الدارجة المغربية",
    sttTag: "ar-MA",
    greeting: "مرحبا بيك ! أنا رحلة، مستشارك ف سيتروين. كيفاش نقدر نعاونك اليوم ؟",
    flag: "🇲🇦",
  },
  {
    id: "ar",
    label: "العربية الفصحى",
    native: "العربية",
    sttTag: "ar-SA",
    greeting: "أهلاً وسهلاً ! أنا رحلة، مستشارتك في سيتروين. كيف يمكنني مساعدتك اليوم ؟",
    flag: "🇸🇦",
  },
  {
    id: "en",
    label: "English",
    native: "English",
    sttTag: "en-US",
    greeting: "Hi there! I'm Rihla, your Citroën advisor. What can I help you with today?",
    flag: "🇬🇧",
  },
];

export function getLangConfig(id: VoiceLang) {
  return LANGS.find((l) => l.id === id) ?? LANGS[0]!;
}

export function LanguagePicker({ onSelect }: { onSelect: (lang: VoiceLang) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center px-6"
    >
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full shadow-md">
          <Image src="/brand/rihla-avatar.jpg" alt="Rihla" fill className="object-cover" sizes="64px" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[#121214]">
          مرحبا · Bonjour · Hello
        </h3>
        <p className="mt-1 text-[13px] text-black/45">
          Choisissez votre langue pour commencer.
        </p>
      </div>

      <div className="mt-6 flex w-full flex-col gap-2">
        {LANGS.map((lang, i) => (
          <motion.button
            key={lang.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
            onClick={() => onSelect(lang.id)}
            className="group flex w-full items-center gap-3 rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-start shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-black/15 hover:shadow-md"
          >
            <span className="text-xl">{lang.flag}</span>
            <div className="flex-1">
              <div className="text-[13px] font-medium text-[#121214]">{lang.label}</div>
            </div>
            <div className="flex gap-1.5 text-black/20 transition group-hover:text-black/40">
              <MessageCircle size={13} strokeWidth={1.5} />
              <Mic2 size={13} strokeWidth={1.5} />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
