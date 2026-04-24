"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Locale = "fr" | "ar" | "en";

const LOCALE_TO_BCP47: Record<Locale, string> = {
  fr: "fr-FR",
  ar: "ar-MA",
  en: "en-US",
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResult };
};
type SpeechRecognitionErrorEvent = { error: string; message?: string };

type ISpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onspeechend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => ISpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type SpeechHandle = {
  supported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  interim: string;
  /** True while a voice conversation loop is active (auto-restart on end). */
  conversation: boolean;

  /** Push-to-talk: listen once, call onFinal with the final transcript, stop. */
  startOnce: (onFinal: (transcript: string) => void) => void;
  stopOnce: () => void;

  /** Start a continuous back-and-forth conversation. Restarts on end/timeout. */
  startConversation: (onFinal: (transcript: string) => void) => void;
  stopConversation: () => void;

  speak: (text: string, opts?: { onEnd?: () => void }) => void;
  stopSpeaking: () => void;
};

export function useSpeech(locale: Locale = "fr"): SpeechHandle {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const [conversation, setConversation] = useState(false);

  const recRef = useRef<ISpeechRecognition | null>(null);
  const finalCbRef = useRef<((transcript: string) => void) | null>(null);
  const modeRef = useRef<"off" | "once" | "conversation">("off");
  // When true, recognition should be in the "paused while TTS plays" state.
  const pausedByTtsRef = useRef(false);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    setSupported(
      !!Ctor && typeof window !== "undefined" && "speechSynthesis" in window
    );
    // Preload voices — some browsers (notably Chrome) populate this list asynchronously;
    // calling getVoices() + subscribing to voiceschanged ensures our first utterance
    // can still pick the best Arabic/French voice.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const onVoices = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.("voiceschanged", onVoices);
      return () => {
        window.speechSynthesis.removeEventListener?.("voiceschanged", onVoices);
      };
    }
  }, []);

  const abortRec = useCallback(() => {
    try {
      recRef.current?.abort();
    } catch {
      // ignore
    }
    recRef.current = null;
  }, []);

  /** Open a fresh SpeechRecognition with wiring tailored to modeRef.current. */
  const openRecognizer = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    abortRec();
    const rec = new Ctor();
    rec.lang = LOCALE_TO_BCP47[locale] ?? "fr-FR";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = modeRef.current === "conversation";

    rec.onstart = () => {
      setIsListening(true);
      setInterim("");
    };
    rec.onerror = (e) => {
      // "no-speech" is common and fine — we just restart when in conversation mode.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        modeRef.current = "off";
        setConversation(false);
      }
    };
    rec.onend = () => {
      setIsListening(false);
      setInterim("");
      // Auto-restart on end when in conversation mode (unless TTS is playing;
      // the TTS onend handler will resume us).
      if (modeRef.current === "conversation" && !pausedByTtsRef.current) {
        setTimeout(() => {
          if (modeRef.current === "conversation" && !pausedByTtsRef.current) {
            try {
              openRecognizer();
            } catch {
              // ignore
            }
          }
        }, 250);
      } else if (modeRef.current === "once") {
        modeRef.current = "off";
      }
    };
    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r?.[0]?.transcript ?? "";
        if (r?.isFinal) finalText += t;
        else interimText += t;
      }
      if (interimText) setInterim(interimText);
      if (finalText.trim()) {
        setInterim("");
        // In conversation mode, don't auto-restart — the caller will resume
        // after LLM + TTS completes. Stop the recognizer first so we don't
        // pile up transcripts.
        if (modeRef.current === "conversation") {
          pausedByTtsRef.current = true;
          try {
            rec.stop();
          } catch {
            // ignore
          }
        }
        finalCbRef.current?.(finalText.trim());
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setIsListening(false);
    }
  }, [abortRec, locale]);

  const startOnce = useCallback(
    (onFinal: (transcript: string) => void) => {
      modeRef.current = "once";
      finalCbRef.current = onFinal;
      pausedByTtsRef.current = false;
      openRecognizer();
    },
    [openRecognizer]
  );

  const stopOnce = useCallback(() => {
    if (modeRef.current === "once") {
      modeRef.current = "off";
    }
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  const startConversation = useCallback(
    (onFinal: (transcript: string) => void) => {
      modeRef.current = "conversation";
      setConversation(true);
      finalCbRef.current = onFinal;
      pausedByTtsRef.current = false;
      openRecognizer();
    },
    [openRecognizer]
  );

  const stopConversation = useCallback(() => {
    modeRef.current = "off";
    setConversation(false);
    pausedByTtsRef.current = false;
    abortRec();
    try {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, [abortRec]);

  const stopSpeaking = useCallback(() => {
    try {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, opts?: { onEnd?: () => void }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      // Clean the text for speech: strip markdown, emojis, bracketed asides.
      const clean = sanitizeForSpeech(text);
      if (!clean) {
        opts?.onEnd?.();
        return;
      }

      // Auto-detect the script so we pick an Arabic voice for Arabic content,
      // a French voice for Latin content, etc. Fixes the "Darija read with a
      // French accent" bug when the page locale is FR but Rihla replied in AR.
      const detectedLang = detectLangForSpeech(clean, locale);

      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = detectedLang;
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      const voice = pickBestVoice(utter.lang);
      if (voice) utter.voice = voice;

      utter.onstart = () => {
        setIsSpeaking(true);
        // Pause recognition while we're speaking so we don't hear ourselves.
        if (modeRef.current === "conversation") {
          pausedByTtsRef.current = true;
          try {
            recRef.current?.stop();
          } catch {
            // ignore
          }
        }
      };
      utter.onend = () => {
        setIsSpeaking(false);
        // Resume recognition after we stop speaking (if still in conversation).
        if (modeRef.current === "conversation" && !window.speechSynthesis.speaking) {
          pausedByTtsRef.current = false;
          setTimeout(() => {
            if (modeRef.current === "conversation") openRecognizer();
          }, 300);
        }
        opts?.onEnd?.();
      };
      utter.onerror = () => {
        setIsSpeaking(false);
        opts?.onEnd?.();
      };

      window.speechSynthesis.speak(utter);
    },
    [locale, openRecognizer]
  );

  useEffect(() => {
    return () => {
      modeRef.current = "off";
      abortRec();
      try {
        if (typeof window !== "undefined") window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  }, [abortRec]);

  return {
    supported,
    isListening,
    isSpeaking,
    interim,
    conversation,
    startOnce,
    stopOnce,
    startConversation,
    stopConversation,
    speak,
    stopSpeaking,
  };
}

/* ─────────────────────────── Helpers ─────────────────────────── */

/** Remove markdown, emojis, and other chars that read awkwardly out loud. */
export function sanitizeForSpeech(raw: string): string {
  let s = raw;
  // Strip markdown emphasis / code markers
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/~~([^~]+)~~/g, "$1");
  // Strip markdown headings / list markers / quote markers at line start
  s = s.replace(/^[ \t]*[#>]{1,6}\s*/gm, "");
  s = s.replace(/^[ \t]*[-*•·]\s+/gm, "");
  s = s.replace(/^[ \t]*\d+\.\s+/gm, "");
  // Remove emoji (broad unicode ranges)
  s = s.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F900}-\u{1F9FF}\u{2700}-\u{27BF}]/gu,
    ""
  );
  // Normalise whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Choose the spoken-language tag based on script detection, with locale as fallback. */
function detectLangForSpeech(text: string, locale: "fr" | "ar" | "en"): string {
  const arCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalLetters = (text.match(/[\p{L}]/gu) || []).length || 1;
  if (arCount / totalLetters > 0.3) return "ar-MA";
  if (locale === "ar") return "ar-MA";
  if (locale === "en") return "en-US";
  return "fr-FR";
}

/**
 * Pick the highest-quality voice for a given BCP-47 tag from the user's
 * installed voices. Prefers Google/Apple premium voices where available.
 */
function pickBestVoice(langTag: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const target = langTag.toLowerCase();
  const targetPrefix = target.split("-")[0] ?? target;

  const ranked = voices
    .map((v) => {
      const l = (v.lang || "").toLowerCase();
      let score = 0;
      if (l === target) score += 100;
      else if (l.startsWith(targetPrefix + "-")) score += 70;
      else if (l.startsWith(targetPrefix)) score += 50;
      else return null;
      const name = v.name.toLowerCase();
      // Prefer premium neural voices when available (names vary by platform)
      if (name.includes("google")) score += 20;
      if (name.includes("premium") || name.includes("enhanced")) score += 25;
      if (name.includes("neural")) score += 20;
      if (name.includes("siri") || name.includes("samantha")) score += 15;
      // Avoid "espeak" legacy voices
      if (name.includes("espeak")) score -= 40;
      return { v, score };
    })
    .filter(Boolean) as { v: SpeechSynthesisVoice; score: number }[];
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.v ?? null;
}
