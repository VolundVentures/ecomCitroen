"use client";

// Brand-aware floating widget. Flow:
//   closed → language picker → mode picker (chat | voice) → chat or call
//
// Designed for an exec-tier demo: bigger Rihla avatar FAB with a greeting
// bubble teaser, polished microinteractions throughout.

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { SendHorizonal, X, PhoneCall, ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import {
  dispatchRihlaTool,
  onEndCall,
  onImageCard,
  onShowrooms,
  onVideoCard,
  type ImageCardPayload,
  type ShowroomsPayload,
  type VideoCardPayload,
  type WidgetBrand,
} from "@/lib/rihla-actions";
import { useRihlaLive, type LiveToolCall } from "@/lib/use-rihla-live";
import { LanguagePicker, getLangConfig, getOpeningGreeting, type VoiceLang } from "@/components/rihla/LanguagePicker";
import { ModePicker, type Mode } from "@/components/rihla/ModePicker";
import { CallView } from "@/components/rihla/CallView";
import { ShowroomCards } from "@/components/rihla/ShowroomCards";

type ApvConfirmationPayload = {
  kind: "appointment" | "complaint";
  refNumber: string;
  ok: boolean;
  summary: Record<string, string | undefined>;
  warnings: string[];
};

type Msg =
  | { kind: "text"; role: "user" | "assistant"; text: string; tools?: Array<{ name: string; input: Record<string, unknown> }> }
  | { kind: "image_card"; role: "assistant"; payload: ImageCardPayload }
  | { kind: "video_card"; role: "assistant"; payload: VideoCardPayload }
  | { kind: "showrooms"; role: "assistant"; payload: ShowroomsPayload }
  | { kind: "apv_confirmation"; role: "assistant"; payload: ApvConfirmationPayload };

type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: Record<string, unknown> }
  | { type: "conversation"; id: string }
  | { type: "apv_confirmation"; kind: "appointment" | "complaint"; refNumber: string; ok: boolean; summary: Record<string, string | undefined>; warnings: string[] }
  | { type: "done" };

type Props = {
  brand: WidgetBrand & {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  availableLangs: VoiceLang[];
  /** When true, the panel is full-bleed inside its container (no FAB, no close). */
  embedded?: boolean;
};

type Stage = "lang" | "mode" | "chat";

const STORAGE_KEY = (slug: string) => `widget-state-${slug}`;

function readStored(slug: string): { lang: VoiceLang | null; mode: Mode | null } {
  if (typeof window === "undefined") return { lang: null, mode: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY(slug));
    if (!raw) return { lang: null, mode: null };
    const parsed = JSON.parse(raw) as { lang?: VoiceLang; mode?: Mode };
    return { lang: parsed.lang ?? null, mode: parsed.mode ?? null };
  } catch {
    return { lang: null, mode: null };
  }
}

function writeStored(slug: string, lang: VoiceLang | null, mode: Mode | null) {
  if (typeof window === "undefined") return;
  if (!lang && !mode) localStorage.removeItem(STORAGE_KEY(slug));
  else localStorage.setItem(STORAGE_KEY(slug), JSON.stringify({ lang, mode }));
}

export function WidgetBubble({ brand, availableLangs, embedded = false }: Props) {
  const [open, setOpen] = useState(embedded);
  const [showTeaser, setShowTeaser] = useState(false);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initial = readStored(brand.slug);
  const [voiceLang, setVoiceLang] = useState<VoiceLang | null>(initial.lang);
  const [mode, setMode] = useState<Mode | null>(initial.mode);

  const stage: Stage = !voiceLang ? "lang" : !mode ? "mode" : "chat";
  const langConfig = voiceLang ? getLangConfig(voiceLang) : null;
  const apiLocale = voiceLang === "darija" ? "ar" : voiceLang ?? "fr";

  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const conversationIdRef = useRef<string | null>(null);

  // Inject the assistant greeting on chat stage entry (or after mode pick).
  // For brands that have APV enabled (jeep-ma) the greeting lists all four
  // tracks (sales / RDV / info / complaint); for sales-only brands the
  // existing capability greeting is used.
  useEffect(() => {
    if (stage === "chat" && voiceLang && messages.length === 0 && mode === "chat") {
      setMessages([{ kind: "text", role: "assistant", text: getOpeningGreeting(voiceLang, brand.slug) }]);
    }
  }, [stage, voiceLang, mode, messages.length, brand.slug]);

  // Show greeting teaser briefly when widget loads closed.
  useEffect(() => {
    if (embedded || open) return;
    const t = setTimeout(() => setShowTeaser(true), 1200);
    const t2 = setTimeout(() => setShowTeaser(false), 8000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [embedded, open]);

  // Most-recent image-card payload (used by the CallView so the customer can
  // SEE the car the agent is talking about during a voice call).
  const [callImage, setCallImage] = useState<ImageCardPayload | null>(null);

  // Bumped each time the assistant's transcript hints that the user should
  // type something (name, phone). The CallView watches this and auto-opens
  // the inline keyboard so the user doesn't have to find the icon.
  const [typeRequest, setTypeRequest] = useState<{ id: number; placeholder?: string } | null>(null);
  const lastTypeRequestSnippetRef = useRef<string>("");

  useEffect(() => {
    return onImageCard((payload) => {
      setMessages((m) => {
        // Client-side dedup backup: if this model's card is already in the
        // message list, refresh the call-overlay image but do NOT add a
        // second card to the chat. Same normalize rule as server-side.
        const norm = (s: string | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const incomingSlug = norm(payload.modelSlug);
        if (incomingSlug && m.some((x) => x.kind === "image_card" && norm(x.payload.modelSlug) === incomingSlug)) {
          return m;
        }
        return [...m, { kind: "image_card", role: "assistant", payload }];
      });
      setCallImage(payload);
    });
  }, []);

  useEffect(() => {
    return onVideoCard((payload) => {
      setMessages((m) => [...m, { kind: "video_card", role: "assistant", payload }]);
    });
  }, []);

  useEffect(() => {
    return onShowrooms((payload) => {
      // Replace any prior showroom block — only the latest city's results stay
      // visible. Prevents the "Riyadh entries linger after I asked for Jeddah" bug.
      setMessages((m) => {
        const filtered = m.filter((x) => x.kind !== "showrooms");
        return [...filtered, { kind: "showrooms", role: "assistant", payload }];
      });
    });
  }, []);

  const handleLiveToolCall = useCallback((call: LiveToolCall): string => {
    return dispatchRihlaTool(
      { name: call.name, input: call.args },
      { locale: apiLocale, router: { push: () => {} }, brand }
    );
  }, [apiLocale, brand]);

  const handleLiveTranscript = useCallback((text: string, fromUser: boolean) => {
    if (fromUser) {
      setMessages((m) => [...m, { kind: "text", role: "user", text }]);
      // The user just spoke or typed → assume any pending "type" request was
      // satisfied. Don't keep popping the keyboard for a stale ask.
      lastTypeRequestSnippetRef.current = "";
    } else {
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.kind === "text" && last.role === "assistant") {
          copy[copy.length - 1] = { ...last, text: last.text + text };
        } else {
          copy.push({ kind: "text", role: "assistant", text });
        }
        return copy;
      });

      // Detect "please type your name / phone / number" in any language.
      // Triggers once per fresh assistant turn — we use a snippet ref so the
      // same chunk doesn't re-fire as more tokens stream in.
      const detected = detectTypeRequest(text, voiceLang);
      if (detected && detected.snippet !== lastTypeRequestSnippetRef.current) {
        lastTypeRequestSnippetRef.current = detected.snippet;
        setTypeRequest({ id: Date.now(), placeholder: detected.placeholder });
      }
    }
  }, [voiceLang]);

  const live = useRihlaLive(
    voiceLang ?? "fr",
    "Zephyr",
    { onToolCall: handleLiveToolCall, onTranscript: handleLiveTranscript },
    brand.slug
  );

  // Auto-start the call once the user picks "voice" mode.
  useEffect(() => {
    if (stage === "chat" && mode === "voice" && !live.isConnected && live.state === "idle") {
      setMessages([]);
      live.connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, mode]);

  // Call duration timer.
  useEffect(() => {
    if (live.isConnected) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [live.isConnected]);

  // end_call handling — works for BOTH voice and chat. For voice, the hook
  // already starts a soft disconnect (lets the farewell audio play), then we
  // navigate back to the mode picker so the call view doesn't stay frozen.
  useEffect(() => {
    return onEndCall(() => {
      if (mode === "voice") {
        // Audio finishes within ~6s (hard backstop in the hook). Reset mode
        // a touch later so the farewell line plays out cleanly.
        setTimeout(() => {
          setMode(null);
          writeStored(brand.slug, voiceLang, null);
          if (live.isConnected) live.disconnect();
        }, 4500);
        return;
      }
      if (!embedded) setTimeout(() => setOpen(false), 2000);
    });
  }, [embedded, mode, brand.slug, voiceLang, live]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleLangSelect = useCallback((lang: VoiceLang) => {
    setVoiceLang(lang);
    writeStored(brand.slug, lang, null);
    setMessages([]);
  }, [brand.slug]);

  const handleModeSelect = useCallback((m: Mode) => {
    setMode(m);
    writeStored(brand.slug, voiceLang, m);
    setMessages([]);
  }, [brand.slug, voiceLang]);

  const resetToLang = useCallback(() => {
    if (live.isConnected) live.disconnect();
    setVoiceLang(null);
    setMode(null);
    setMessages([]);
    writeStored(brand.slug, null, null);
  }, [brand.slug, live]);

  const resetToMode = useCallback(() => {
    if (live.isConnected) live.disconnect();
    setMode(null);
    setMessages([]);
    writeStored(brand.slug, voiceLang, null);
  }, [brand.slug, voiceLang, live]);

  const sendTextMessage = useCallback(async (text: string) => {
    const current = messagesRef.current;
    const userMsg: Msg = { kind: "text", role: "user", text };
    // Don't pre-create an empty assistant bubble — it leaves a visual artifact
    // when the model only emits a tool call (find_showrooms, show_model_image)
    // without any text. We create the assistant message lazily on the first
    // text token. Tool-only responses stand on their own as image / showroom
    // / video cards (pushed via the event bus subscriptions above).
    const next: Msg[] = [...current, userMsg];
    setMessages(next);
    setIsStreaming(true);

    if (live.isConnected) {
      live.sendText(text);
      setIsStreaming(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantStarted = false;

    try {
      const apiMessages = next
        .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
        .map((m) => ({ role: m.role, content: m.text }));

      // Compact session memory the server prepends to the system prompt.
      // The Gemini API itself only carries the text history forward, so the
      // model can't otherwise see which UI cards have been fired this
      // session. This block is what stops it from re-showing the same model
      // image when the customer just says "ok".
      const shownModels: string[] = [];
      const shownVideos: string[] = [];
      const searchedCities: string[] = [];
      for (const m of next) {
        if (m.kind === "image_card" && m.payload.modelSlug) shownModels.push(m.payload.modelSlug);
        else if (m.kind === "video_card" && m.payload.modelSlug) shownVideos.push(m.payload.modelSlug);
        else if (m.kind === "showrooms" && m.payload.city) searchedCities.push(m.payload.city);
      }
      const sessionContext = {
        shownModels: [...new Set(shownModels)],
        shownVideos: [...new Set(shownVideos)],
        searchedCities: [...new Set(searchedCities)],
      };

      const res = await fetch("/api/rihla/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandSlug: brand.slug,
          conversationId: conversationIdRef.current,
          locale: apiLocale,
          voice: false,
          messages: apiMessages,
          sessionContext,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let textAcc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let ev: StreamEvent;
          try { ev = JSON.parse(line.trim()); } catch { continue; }
          if (ev.type === "conversation") {
            conversationIdRef.current = ev.id;
          } else if (ev.type === "text") {
            textAcc += ev.text;
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (assistantStarted && last?.kind === "text" && last.role === "assistant") {
                copy[copy.length - 1] = { ...last, text: textAcc };
              } else {
                // First text token — create the assistant bubble now.
                copy.push({ kind: "text", role: "assistant", text: textAcc, tools: [] });
              }
              return copy;
            });
            assistantStarted = true;
          } else if (ev.type === "tool") {
            dispatchRihlaTool(
              { name: ev.name, input: ev.input },
              { locale: apiLocale, router: { push: () => {} }, brand }
            );
            // Only attach the tool chip to an existing assistant text bubble.
            // If the response is tool-only, the card itself is the assistant
            // turn — no empty bubble needed.
            if (assistantStarted) {
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last?.kind === "text" && last.role === "assistant") {
                  copy[copy.length - 1] = {
                    ...last,
                    tools: [...(last.tools ?? []), { name: ev.name, input: ev.input }],
                  };
                }
                return copy;
              });
            }
          } else if (ev.type === "apv_confirmation") {
            // Server-side persistence of an appointment / complaint just
            // completed and gave us a reference number. Render a success
            // card so the customer can read + screenshot the ref.
            setMessages((m) => [
              ...m,
              {
                kind: "apv_confirmation",
                role: "assistant",
                payload: { kind: ev.kind, refNumber: ev.refNumber, ok: ev.ok, summary: ev.summary, warnings: ev.warnings },
              },
            ]);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((m) => [
          ...m,
          { kind: "text", role: "assistant", text: technicalErrorText(voiceLang) },
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [apiLocale, brand, live, voiceLang]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    void sendTextMessage(text);
  }, [input, isStreaming, sendTextMessage]);

  const accent = brand.primaryColor ?? "#0c0c10";

  // ─── Inner panel content ──────────────────────────────────────────────────

  const panel = (
    <BubblePanel
      brand={brand}
      availableLangs={availableLangs}
      stage={stage}
      mode={mode}
      voiceLang={voiceLang}
      langConfig={langConfig}
      live={live}
      callDuration={callDuration}
      messages={messages}
      isStreaming={isStreaming}
      input={input}
      setInput={setInput}
      handleSend={handleSend}
      handleLangSelect={handleLangSelect}
      handleModeSelect={handleModeSelect}
      resetToLang={resetToLang}
      resetToMode={resetToMode}
      scrollRef={scrollRef}
      accent={accent}
      onClose={embedded ? null : () => setOpen(false)}
      callImage={callImage}
      typeRequest={typeRequest}
    />
  );

  if (embedded) {
    return <div className="relative h-full w-full overflow-hidden bg-white">{panel}</div>;
  }

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            key="fab-wrap"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="fixed bottom-5 end-5 z-[60] flex items-end gap-3"
          >
            {/* Greeting teaser — slides in from the side. */}
            <AnimatePresence>
              {showTeaser && (
                <motion.button
                  key="teaser"
                  type="button"
                  onClick={() => { setShowTeaser(false); setOpen(true); }}
                  initial={{ opacity: 0, x: 24, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.68, 0, 1] }}
                  className="mb-2 hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 text-start text-[12px] leading-snug text-[#0c0c10] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] sm:flex"
                >
                  <Sparkles size={12} strokeWidth={2} style={{ color: accent }} />
                  <span>{teaserText(voiceLang, brand.name.split(" ")[0]!)}</span>
                  <X
                    size={12}
                    strokeWidth={2}
                    className="ms-2 text-black/30 hover:text-black/60"
                    onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }}
                  />
                </motion.button>
              )}
            </AnimatePresence>

            {/* The big FAB with Rihla avatar */}
            <motion.button
              key="fab"
              type="button"
              onClick={() => setOpen(true)}
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.06 }}
              className="relative h-[72px] w-[72px] overflow-visible rounded-full focus:outline-none focus:ring-4 focus:ring-white/40"
              aria-label="Open Rihla"
            >
              {/* Pulse rings */}
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: accent, opacity: 0.18 }}
                animate={{ scale: [1, 1.55, 1], opacity: [0.18, 0, 0.18] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: accent, opacity: 0.14 }}
                animate={{ scale: [1, 1.85, 1], opacity: [0.14, 0, 0.14] }}
                transition={{ duration: 2.4, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
              />
              {/* Avatar */}
              <span
                className="relative block h-full w-full overflow-hidden rounded-full ring-[3px] ring-white shadow-[0_14px_36px_-8px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,0,0,0.04)]"
                style={{ background: accent }}
              >
                <Image
                  src="/brand/rihla-avatar.jpg"
                  alt="Rihla"
                  fill
                  priority
                  sizes="72px"
                  className="object-cover"
                />
              </span>
              {/* Online dot */}
              <span className="absolute bottom-1.5 end-1.5 inline-block h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_2px_6px_rgba(16,185,129,0.45)]" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 0.68, 0, 1] }}
            role="dialog"
            aria-label={brand.name}
            className="fixed inset-x-3 bottom-3 z-[60] flex h-[min(720px,calc(100dvh-24px))] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_84px_-16px_rgba(0,0,0,0.32),0_0_0_1px_rgba(0,0,0,0.06)] sm:inset-x-auto sm:bottom-5 sm:end-5 sm:h-[min(720px,calc(100dvh-40px))] sm:w-[min(420px,calc(100vw-32px))]"
          >
            {panel}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Inner panel content ────────────────────────────────────────────────────

type PanelProps = {
  brand: Props["brand"];
  availableLangs: VoiceLang[];
  stage: Stage;
  mode: Mode | null;
  voiceLang: VoiceLang | null;
  langConfig: ReturnType<typeof getLangConfig> | null;
  live: ReturnType<typeof useRihlaLive>;
  callDuration: number;
  messages: Msg[];
  isStreaming: boolean;
  input: string;
  setInput: (v: string) => void;
  handleSend: () => void;
  handleLangSelect: (l: VoiceLang) => void;
  handleModeSelect: (m: Mode) => void;
  resetToLang: () => void;
  resetToMode: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  accent: string;
  onClose: (() => void) | null;
  callImage: ImageCardPayload | null;
  typeRequest: { id: number; placeholder?: string } | null;
};

function BubblePanel(p: PanelProps) {
  // Voice mode / call view: render immediately when the user is in voice
  // mode, so the WebSocket-warmup gap doesn't show as a blank screen. The
  // CallView itself handles all live states (idle / connecting / listening
  // / speaking / error) with appropriate status labels and animations. We
  // only fall back to the picker when the user actively leaves voice mode
  // (mode === null after onHangUp + resetToMode) or when an error state
  // explicitly triggers a recovery flow.
  const callActive = p.mode === "voice" && p.live.state !== "error";
  if (callActive) {
    return (
      <CallView
        state={p.live.state}
        onHangUp={() => { p.live.disconnect(); p.resetToMode(); }}
        duration={p.callDuration}
        accent={p.accent}
        brandName={p.brand.name}
        locale={p.voiceLang}
        currentImage={p.callImage}
        typeRequest={p.typeRequest}
        onSendText={(t) => {
          // Send to Gemini Live with a [FIELD_TYPED] marker so the model can
          // distinguish typed input (canonical, accept verbatim) from voice
          // dictation (unreliable for names / phones / emails / VINs — agent
          // should refuse and re-ask the customer to type). The marker is
          // documented in the APV chassis-first override block of the voice
          // system prompt.
          p.live.sendText(`[FIELD_TYPED] ${t}`);
          // The on-screen transcript and DB persistence use the clean text —
          // never surface the marker to the user.
          p.live.notifyUserText?.(t);
        }}
      />
    );
  }
  return (
    <>
      <Header
        brand={p.brand}
        accent={p.accent}
        stage={p.stage}
        voiceLang={p.voiceLang}
        langConfig={p.langConfig}
        onClose={p.onClose}
        onChangeLang={p.resetToLang}
        onBack={p.stage === "chat" ? p.resetToMode : p.stage === "mode" ? p.resetToLang : null}
      />

      <AnimatePresence mode="wait">
        {p.stage === "lang" && (
          <motion.div key="lang" className="flex-1 overflow-hidden">
            <LanguagePicker onSelect={p.handleLangSelect} available={p.availableLangs} accent={p.accent} />
          </motion.div>
        )}

        {p.stage === "mode" && p.voiceLang && (
          <motion.div key="mode" className="flex-1 overflow-hidden">
            <ModePicker lang={p.voiceLang} accent={p.accent} onSelect={p.handleModeSelect} onBack={p.resetToLang} />
          </motion.div>
        )}

        {p.stage === "chat" && (
          <motion.div key="chat" className="flex flex-1 flex-col overflow-hidden bg-[#fafafa]">
            <div ref={p.scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {p.messages.map((m, i) => {
                  if (m.kind === "image_card") {
                    return <ImageCardMsg key={i} payload={m.payload} accent={p.accent} locale={p.voiceLang} />;
                  }
                  if (m.kind === "video_card") {
                    return <VideoCardMsg key={i} payload={m.payload} accent={p.accent} locale={p.voiceLang} />;
                  }
                  if (m.kind === "apv_confirmation") {
                    return <ApvConfirmationCard key={i} payload={m.payload} accent={p.accent} locale={p.voiceLang} />;
                  }
                  if (m.kind === "showrooms") {
                    return (
                      <ShowroomCards
                        key={i}
                        items={m.payload.items}
                        city={m.payload.city}
                        accent={p.accent}
                        locale={p.voiceLang}
                      />
                    );
                  }
                  return (
                    <TextMsg
                      key={i}
                      m={m}
                      streaming={p.isStreaming && i === p.messages.length - 1}
                      accent={p.accent}
                      brandName={p.brand.name}
                    />
                  );
                })}
                {/* Lightweight typing indicator while waiting for the first
                    token, so a tool-only response doesn't feel "stuck". */}
                {p.isStreaming &&
                  p.messages[p.messages.length - 1]?.role === "user" && (
                    <div className="flex items-end gap-2">
                      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brand/rihla-avatar.jpg" alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.04)]">
                        <TypingDots />
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="border-t border-black/[0.06] bg-white px-3 pb-3 pt-2.5">
              <div className="flex items-end gap-1.5 rounded-2xl border border-black/[0.08] bg-[#fafafa] p-1.5 transition focus-within:border-black/20 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]">
                <textarea
                  value={p.input}
                  onChange={(e) => p.setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); p.handleSend(); } }}
                  placeholder={inputPlaceholder(p.voiceLang)}
                  rows={1}
                  disabled={p.isStreaming}
                  className="block max-h-[96px] min-h-[36px] flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-2 text-[13px] leading-snug text-[#0c0c10] outline-none placeholder:text-black/30 disabled:opacity-40"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
                <motion.button
                  type="button"
                  onClick={p.handleSend}
                  disabled={p.isStreaming || !p.input.trim()}
                  whileTap={{ scale: 0.92 }}
                  className="mb-px flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-25"
                  style={{ background: p.accent }}
                  aria-label="Send"
                >
                  <SendHorizonal size={15} strokeWidth={2} />
                </motion.button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-black/30">
                <span>Powered by Rihla</span>
                <button
                  type="button"
                  onClick={p.resetToMode}
                  className="inline-flex items-center gap-1 transition hover:text-black/60"
                >
                  <PhoneCall size={10} strokeWidth={2} /> {switchToVoiceLabel(p.voiceLang)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Pieces ────────────────────────────────────────────────────────────────

function Header({
  brand,
  accent,
  stage,
  voiceLang,
  langConfig,
  onClose,
  onChangeLang,
  onBack,
}: {
  brand: Props["brand"];
  accent: string;
  stage: Stage;
  voiceLang: VoiceLang | null;
  langConfig: ReturnType<typeof getLangConfig> | null;
  onClose: (() => void) | null;
  onChangeLang: () => void;
  onBack: (() => void) | null;
}) {
  const isChat = stage === "chat";
  return (
    <header
      className="relative flex shrink-0 items-center gap-3 px-4 py-3 text-white"
      style={{ background: accent }}
    >
      {/* Subtle gloss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)" }}
      />

      {onBack && stage !== "lang" ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
      ) : (
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30">
          <Image src="/brand/rihla-avatar.jpg" alt="Rihla" fill sizes="36px" className="object-cover" />
        </div>
      )}

      <div className="relative min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-tight">{isChat ? "Rihla" : brand.name}</div>
        <div className="flex items-center gap-1.5 text-[11px] opacity-85">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>{isChat ? agentSubtitle(voiceLang, brand.name) : onlineLabel(voiceLang)}</span>
        </div>
      </div>

      <div className="relative flex items-center gap-1.5">
        {voiceLang && stage !== "lang" && (
          <button
            type="button"
            onClick={onChangeLang}
            className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/85 transition hover:bg-white/20"
            aria-label="Change language"
          >
            <span>{langConfig?.flag}</span>
            <span>{langConfig?.label}</span>
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <X size={15} strokeWidth={2} />
          </button>
        )}
      </div>
    </header>
  );
}

function inputPlaceholder(lang: VoiceLang | null): string {
  if (lang === "ar") return "اكتب رسالتك هنا…";
  if (lang === "darija") return "كتب الرسالة ديالك هنا…";
  if (lang === "en") return "Type your message…";
  return "Écrivez votre message…";
}

function agentSubtitle(lang: VoiceLang | null, brand: string): string {
  if (lang === "ar" || lang === "darija") return `مستشارة · ${brand}`;
  if (lang === "en") return `Advisor · ${brand}`;
  return `Conseillère · ${brand}`;
}

function onlineLabel(lang: VoiceLang | null): string {
  if (lang === "ar" || lang === "darija") return "متصلة";
  if (lang === "en") return "Online";
  return "En ligne";
}

function switchToVoiceLabel(lang: VoiceLang | null): string {
  if (lang === "ar" || lang === "darija") return "التحول للمكالمة";
  if (lang === "en") return "Switch to voice";
  return "Passer à la voix";
}

/** Look at a fresh assistant transcript chunk and decide whether the agent
 *  is asking the user to type something. Returns the matched snippet so we
 *  can dedupe + a placeholder hint for the keyboard. */
function detectTypeRequest(
  chunk: string,
  lang: VoiceLang | null
): { snippet: string; placeholder?: string } | null {
  const lower = chunk.toLowerCase();
  // VIN / chassis triggers — highest priority, since voice dictation of a 17-char
  // alphanumeric run is unreliable. Pop the keyboard so the customer can type
  // it accurately. Fires on any mention of "châssis", "VIN", or "chassis number"
  // in FR / AR / Darija / EN.
  const vinMatchers = [
    /\b(vin|ch[aâ]ssis|chassis)\b/i,
    /num[ée]ro\s+de\s+ch[aâ]ssis/i,
    /chassis\s+number/i,
    /(الشاسيه|الشاسي|الشاصي|شاسيه|شاسي|شاصي|الهيكل)/,
  ];
  for (const re of vinMatchers) {
    if (re.test(chunk)) {
      return { snippet: chunk.slice(0, 60), placeholder: vinPlaceholder(lang) };
    }
  }
  // Email triggers — pop the keyboard with an email-shaped placeholder.
  const emailMatchers = [
    /\b(e-?mail|courriel|adresse\s+e-?mail)\b/i,
    /(البريد\s*الإلكتروني|الإيميل|إيميلك|بريدك)/,
  ];
  for (const re of emailMatchers) {
    if (re.test(chunk)) {
      return { snippet: chunk.slice(0, 60), placeholder: emailPlaceholder(lang) };
    }
  }
  // Phone-number triggers (more specific than name). Two tiers:
  //   STRICT — explicit "type / tape / écrivez / اكتب" verb + field word.
  //   LOOSE  — any mention of phone / number, since voice flows often skip the
  //            verb ("Et votre numéro ?"). Keyboard auto-popping a moment too
  //            early is far less annoying than the customer trying to dictate
  //            12 digits over a noisy line.
  const phoneStrict = [
    /type[^.?!]{0,30}\b(phone|number|mobile|whatsapp)\b/i,
    /tape[zr]?[^.?!]{0,30}\b(num[ée]ro|t[ée]l[ée]phone|portable|whatsapp)\b/i,
    /[éeè]criv[a-z]*[^.?!]{0,30}\b(num[ée]ro|t[ée]l[ée]phone|portable)\b/i,
    /اكتب[^.?!]{0,30}(رقم|الجوال|الهاتف|واتساب)/,
    /كتب[^.?!]{0,30}(رقم|الهاتف|الواتساب)/,
  ];
  const phoneLoose = [
    /\b(num[ée]ro\s+(?:de\s+)?(?:t[ée]l[ée]phone|portable|mobile|whatsapp)|t[ée]l[ée]phone\s+mobile)\b/i,
    /\b(phone\s+number|mobile\s+number|whatsapp\s+number)\b/i,
    /(رقم\s*(?:الهاتف|الجوال|الموبايل|الواتساب|الفون)|نمرتك|نمرة\s*الهاتف|نيمرو\s*ديالك)/,
  ];
  for (const re of [...phoneStrict, ...phoneLoose]) {
    if (re.test(chunk)) {
      return { snippet: chunk.slice(0, 60), placeholder: phonePlaceholder(lang) };
    }
  }
  // Name triggers — same two-tier strategy.
  const nameStrict = [
    /type[^.?!]{0,30}\b(first\s*name|name)\b/i,
    /tape[zr]?[^.?!]{0,30}\b(pr[ée]nom|nom)\b/i,
    /[éeè]criv[a-z]*[^.?!]{0,30}\b(pr[ée]nom|nom)\b/i,
    /اكتب[^.?!]{0,30}(اسم|الاسم)/,
    /كتب[^.?!]{0,30}(سميتك|اسمك)/,
  ];
  const nameLoose = [
    /\b(votre\s+(?:nom\s+complet|nom|pr[ée]nom)|nom\s+complet)\b/i,
    /\b(your\s+(?:full\s+)?name|first\s+name|last\s+name)\b/i,
    /(اسمك\s*الكامل|الاسم\s*الكامل|سميتك|اسمك)/,
  ];
  for (const re of [...nameStrict, ...nameLoose]) {
    if (re.test(chunk)) {
      return { snippet: chunk.slice(0, 60), placeholder: namePlaceholder(lang) };
    }
  }
  // Lower-priority "in the chat / in the box" hint without a specific field.
  if (/(in the chat|in the box|dans le chat|في الدردشة|في المربع)/i.test(lower)) {
    return { snippet: chunk.slice(0, 60) };
  }
  return null;
}

function namePlaceholder(lang: VoiceLang | null): string {
  if (lang === "ar" || lang === "darija") return "اكتب اسمك…";
  if (lang === "en") return "Type your name…";
  return "Tapez votre prénom…";
}

function phonePlaceholder(lang: VoiceLang | null): string {
  if (lang === "ar" || lang === "darija") return "اكتب رقمك…";
  if (lang === "en") return "Type your phone number…";
  return "Tapez votre numéro…";
}

function vinPlaceholder(lang: VoiceLang | null): string {
  if (lang === "ar" || lang === "darija") return "اكتب رقم الشاسيه (17 حرف)…";
  if (lang === "en") return "Type your VIN (17 chars)…";
  return "Tapez le numéro de châssis (17 caractères)…";
}

function emailPlaceholder(lang: VoiceLang | null): string {
  if (lang === "ar" || lang === "darija") return "اكتب بريدك الإلكتروني…";
  if (lang === "en") return "Type your email…";
  return "Tapez votre adresse e-mail…";
}

function teaserText(lang: VoiceLang | null, brandFirstWord: string): string {
  if (lang === "ar" || lang === "darija") return `مرحبا ! تحتاج مساعدة لاختيار ${brandFirstWord} ؟`;
  if (lang === "en") return `Hi! Need help picking your ${brandFirstWord}?`;
  return `Bonjour ! Besoin d'aide pour choisir votre ${brandFirstWord} ?`;
}

/** Render an inline string: wraps phone-like digit runs in <bdi dir="ltr"> so
 *  numbers don't reverse inside Arabic text, AND parses **bold** segments. */
function renderInline(text: string, keyPrefix = ""): React.ReactNode {
  // First pass: split on **bold** markers (non-greedy, single line).
  const boldSplit = text.split(/(\*\*[^*\n]+\*\*)/g);
  const out: React.ReactNode[] = [];
  let bk = 0;
  for (const seg of boldSplit) {
    if (!seg) continue;
    if (/^\*\*[^*\n]+\*\*$/.test(seg)) {
      const inner = seg.slice(2, -2);
      out.push(<strong key={`${keyPrefix}b${bk++}`}>{wrapDigits(inner, `${keyPrefix}b${bk}d`)}</strong>);
    } else {
      out.push(<span key={`${keyPrefix}t${bk++}`}>{wrapDigits(seg, `${keyPrefix}t${bk}d`)}</span>);
    }
  }
  return out;
}

function wrapDigits(text: string, keyPrefix = ""): React.ReactNode {
  const re = /(\+?\d[\d\s-]{6,}\d)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <bdi key={`${keyPrefix}${key++}`} dir="ltr" className="font-mono tabular-nums">
        {m[0]}
      </bdi>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 0 ? text : parts;
}

/** Render an assistant chat message with minimal markdown:
 *   - lines starting with "- " or "* " or "• " group into a <ul>
 *   - blank lines separate paragraphs
 *   - **bold** inline
 *   - phone-shaped digit runs wrapped in <bdi> to keep LTR ordering in RTL
 *  Designed for the constrained output our voice / chat agents produce — not
 *  a general-purpose markdown library. Keeps zero deps. */
function renderRichText(text: string): React.ReactNode {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let paraBuf: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuf.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="my-1 list-disc space-y-0.5 ps-5">
        {listBuf.map((item, i) => (
          <li key={i}>{renderInline(item, `li${key}-${i}-`)}</li>
        ))}
      </ul>
    );
    listBuf = [];
  };
  const flushPara = () => {
    if (paraBuf.length === 0) return;
    const joined = paraBuf.join(" ");
    blocks.push(
      <p key={`p-${key++}`} className="my-0">
        {renderInline(joined, `p${key}-`)}
      </p>
    );
    paraBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) {
      flushPara();
      listBuf.push(bullet[1] ?? "");
      continue;
    }
    if (line === "") {
      flushList();
      flushPara();
      continue;
    }
    flushList();
    paraBuf.push(line);
  }
  flushList();
  flushPara();

  if (blocks.length === 0) return renderInline(text);
  if (blocks.length === 1) return blocks[0];
  return <div className="space-y-1.5">{blocks}</div>;
}

/** Back-compat alias kept for the user-side bubble (single-line, no lists). */
function renderWithLtrDigits(text: string): React.ReactNode {
  return wrapDigits(text);
}

function TextMsg({
  m,
  streaming,
  accent,
  brandName,
}: {
  m: Extract<Msg, { kind: "text" }>;
  streaming: boolean;
  accent: string;
  brandName: string;
}) {
  if (m.role === "assistant") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 0.68, 0, 1] }}
        className="flex items-end gap-2"
      >
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
          <Image src="/brand/rihla-avatar.jpg" alt="" fill sizes="28px" className="object-cover" />
        </div>
        <div className="min-w-0 max-w-[82%]">
          <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-[#0c0c10] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.04)]">
            {m.text ? renderRichText(m.text) : streaming ? <TypingDots /> : ""}
          </div>
          {m.tools && m.tools.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1 ps-1">
              {m.tools.map((tc, j) => (
                <span
                  key={j}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.06em]"
                  style={{ background: `${accent}10`, color: accent }}
                >
                  <Sparkles size={8} strokeWidth={2.2} /> {tc.name.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Use brandName subtly to convey context for the assistant */}
        <span className="sr-only">{brandName}</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 0.68, 0, 1] }}
      className="flex justify-end"
    >
      <div
        className="max-w-[82%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
        style={{ background: accent }}
      >
        {renderWithLtrDigits(m.text)}
      </div>
    </motion.div>
  );
}

function ImageCardMsg({
  payload,
  accent,
  locale,
}: {
  payload: ImageCardPayload;
  accent: string;
  locale: VoiceLang | null;
}) {
  const ctaLabel = payload.ctaLabel ?? defaultViewSiteLabel(locale);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 0.68, 0, 1] }}
      className="flex w-full items-end gap-2"
    >
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
        <Image src="/brand/rihla-avatar.jpg" alt="" fill sizes="28px" className="object-cover" />
      </div>
      <div className="min-w-0 max-w-[88%] overflow-hidden rounded-2xl rounded-bl-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.05)]">
        {payload.imageUrl && (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f4f4f5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payload.imageUrl}
              alt={payload.caption ?? ""}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </div>
        )}
        {/* Caption sits BELOW the image — never overlaid. Avoids the
            description-overlapping-the-car artifact. */}
        {payload.caption && (
          <div className="px-3.5 pb-1.5 pt-3 text-[13px] font-semibold leading-snug text-[#0c0c10]">
            {payload.caption}
          </div>
        )}
        {payload.ctaUrl && (
          <a
            href={payload.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[12px] font-medium transition hover:bg-black/[0.03]"
            style={{ color: accent }}
          >
            <span>{ctaLabel}</span>
            <ExternalLink size={12} strokeWidth={2} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function VideoCardMsg({
  payload,
  accent,
}: {
  payload: VideoCardPayload;
  accent: string;
  locale: VoiceLang | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 0.68, 0, 1] }}
      className="flex items-end gap-2"
    >
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
        <Image src="/brand/rihla-avatar.jpg" alt="" fill sizes="28px" className="object-cover" />
      </div>
      <div className="min-w-0 w-full max-w-[88%] overflow-hidden rounded-2xl rounded-bl-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.05)]">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
          <video
            src={payload.videoUrl}
            poster={payload.poster}
            controls
            playsInline
            autoPlay
            muted
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        {payload.caption && (
          <div className="border-t border-black/[0.04] px-3.5 py-2.5 text-[13px] font-semibold leading-snug text-[#0c0c10]" style={{ color: accent }}>
            {payload.caption}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ApvConfirmationCard({
  payload,
  accent,
  locale,
}: {
  payload: ApvConfirmationPayload;
  accent: string;
  locale: VoiceLang | null;
}) {
  const labels = apvLabels(locale, payload.kind);
  const s = payload.summary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 0.68, 0, 1] }}
      className="flex items-end gap-2"
    >
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
        <Image src="/brand/rihla-avatar.jpg" alt="" fill sizes="28px" className="object-cover" />
      </div>
      <div className="min-w-0 max-w-[88%] overflow-hidden rounded-2xl rounded-bl-md border border-emerald-500/30 bg-emerald-50/95 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_0_0_1px_rgba(16,185,129,0.15)]">
        <div className="flex items-center gap-2 border-b border-emerald-500/15 bg-emerald-500/[0.05] px-3.5 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15" style={{ color: accent }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M6.5 11.5L3 8l1-1 2.5 2.5L12 4l1 1z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-700/85">{labels.title}</div>
            <div className="font-mono text-[12.5px] font-semibold tracking-tight text-emerald-900">{payload.refNumber}</div>
          </div>
        </div>
        <div className="space-y-0.5 px-3.5 py-2.5 text-[12px] leading-relaxed text-emerald-950/85">
          {s.fullName && <Row label={labels.name} value={s.fullName} />}
          {s.phone && <Row label={labels.phone} value={s.phone} mono />}
          {s.email && <Row label={labels.email} value={s.email} />}
          {(s.vehicleBrand || s.vehicleModel) && (
            <Row label={labels.vehicle} value={[s.vehicleBrand, s.vehicleModel].filter(Boolean).join(" ")} />
          )}
          {s.vin && <Row label="VIN" value={s.vin} mono />}
          {s.interventionType && <Row label={labels.intervention} value={s.interventionType === "mechanical" ? labels.mech : labels.body} />}
          {s.city && <Row label={labels.city} value={s.city} />}
          {s.preferredDate && <Row label={labels.date} value={s.preferredDate} />}
          {s.preferredSlot && <Row label={labels.slot} value={s.preferredSlot === "morning" ? labels.morning : labels.afternoon} />}
          {s.site && <Row label={labels.site} value={s.site} />}
          {s.serviceDate && <Row label={labels.serviceDate} value={s.serviceDate} />}
          {s.reason && <Row label={labels.reason} value={s.reason} />}
        </div>
        <div className="border-t border-emerald-500/15 bg-emerald-500/[0.03] px-3.5 py-2 text-[11px] leading-snug text-emerald-800/80">
          {labels.footer}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-emerald-800/55">{label}</span>
      <span className={mono ? "font-mono text-[12px] tabular-nums text-emerald-950" : "text-[12px] text-emerald-950"}>
        {value}
      </span>
    </div>
  );
}

function apvLabels(locale: VoiceLang | null, kind: "appointment" | "complaint") {
  const isAppt = kind === "appointment";
  if (locale === "fr") {
    return {
      title: isAppt ? "Rendez-vous enregistré" : "Réclamation enregistrée",
      name: "Nom",
      phone: "Téléphone",
      email: "E-mail",
      vehicle: "Véhicule",
      intervention: "Intervention",
      mech: "Mécanique",
      body: "Carrosserie",
      city: "Ville",
      date: "Date",
      slot: "Créneau",
      morning: "Matin",
      afternoon: "Après-midi",
      site: "Atelier",
      serviceDate: "Date d'intervention",
      reason: "Motif",
      footer: isAppt
        ? "Un conseiller vous contactera sous 24h ouvrées pour confirmer le créneau."
        : "Le Centre de Relation Client vous recontactera sous 48h ouvrées.",
    };
  }
  if (locale === "ar" || locale === "darija") {
    return {
      title: isAppt ? "تم تسجيل الموعد" : "تم تسجيل الشكوى",
      name: "الاسم",
      phone: "الهاتف",
      email: "البريد الإلكتروني",
      vehicle: "السيارة",
      intervention: "نوع التدخل",
      mech: "ميكانيك",
      body: "صفائح",
      city: "المدينة",
      date: "التاريخ",
      slot: "الفترة",
      morning: "صباحاً",
      afternoon: "بعد الظهر",
      site: "الورشة",
      serviceDate: "تاريخ التدخل",
      reason: "السبب",
      footer: isAppt
        ? "سيتواصل معكم مستشار خلال 24 ساعة عمل لتأكيد الموعد."
        : "سيتواصل معكم مركز خدمة العملاء خلال 48 ساعة عمل.",
    };
  }
  return {
    title: isAppt ? "Appointment received" : "Complaint received",
    name: "Name",
    phone: "Phone",
    email: "Email",
    vehicle: "Vehicle",
    intervention: "Intervention",
    mech: "Mechanical",
    body: "Bodywork",
    city: "City",
    date: "Date",
    slot: "Slot",
    morning: "Morning",
    afternoon: "Afternoon",
    site: "Site",
    serviceDate: "Service date",
    reason: "Reason",
    footer: isAppt
      ? "An advisor will reach out within 24 working hours to confirm your slot."
      : "Our Customer Relations Centre will get back to you within 48 working hours.",
  };
}

function defaultViewSiteLabel(locale: VoiceLang | null): string {
  if (locale === "ar" || locale === "darija") return "زر الموقع الرسمي";
  if (locale === "en") return "View on official site";
  return "Voir sur le site officiel";
}

function technicalErrorText(locale: VoiceLang | null): string {
  if (locale === "ar" || locale === "darija") return "عذراً، حدث خلل تقني بسيط.";
  if (locale === "en") return "A small technical hiccup — please try again.";
  return "Petit souci technique.";
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-[5px] w-[5px] rounded-full bg-black/30"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </span>
  );
}
