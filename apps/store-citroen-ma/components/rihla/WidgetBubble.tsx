"use client";

// Brand-aware widget chat bubble for /w/[brand] and /demo/[brand]. Slim version
// of RihlaBubble — no next-intl, no router push (tools open brand-site URLs in
// new tabs), supports image cards inline.

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { SendHorizonal, X, PhoneCall, Sparkles, Globe, ExternalLink } from "lucide-react";
import {
  dispatchRihlaTool,
  onEndCall,
  onImageCard,
  type ImageCardPayload,
  type WidgetBrand,
} from "@/lib/rihla-actions";
import { useRihlaLive, type LiveToolCall } from "@/lib/use-rihla-live";
import { LanguagePicker, getLangConfig, type VoiceLang } from "@/components/rihla/LanguagePicker";
import { CallView } from "@/components/rihla/CallView";

type Msg =
  | { kind: "text"; role: "user" | "assistant"; text: string; tools?: Array<{ name: string; input: Record<string, unknown> }> }
  | { kind: "image_card"; role: "assistant"; payload: ImageCardPayload };

type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: Record<string, unknown> }
  | { type: "done" };

type Props = {
  brand: WidgetBrand & {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  /** Available locales for this brand. */
  availableLangs: VoiceLang[];
  /** When true, the panel is full-bleed inside its container (no FAB, no close). */
  embedded?: boolean;
};

export function WidgetBubble({ brand, availableLangs, embedded = false }: Props) {
  const [open, setOpen] = useState(embedded);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [voiceLang, setVoiceLang] = useState<VoiceLang | null>(() => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem(`widget-lang-${brand.slug}`) as VoiceLang) ?? null;
  });
  const langConfig = voiceLang ? getLangConfig(voiceLang) : null;
  const apiLocale = voiceLang === "darija" ? "ar" : voiceLang ?? "fr";

  const [messages, setMessages] = useState<Msg[]>(() =>
    voiceLang
      ? [{ kind: "text", role: "assistant", text: getLangConfig(voiceLang).greeting }]
      : []
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Render image cards as messages when the agent calls show_model_image.
  useEffect(() => {
    return onImageCard((payload) => {
      setMessages((m) => [...m, { kind: "image_card", role: "assistant", payload }]);
    });
  }, []);

  const handleLiveToolCall = useCallback((call: LiveToolCall): string => {
    return dispatchRihlaTool(
      { name: call.name, input: call.args },
      {
        locale: apiLocale,
        router: { push: () => {} },
        brand,
      }
    );
  }, [apiLocale, brand]);

  const handleLiveTranscript = useCallback((text: string, fromUser: boolean) => {
    if (fromUser) {
      setMessages((m) => [...m, { kind: "text", role: "user", text }]);
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
    }
  }, []);

  const live = useRihlaLive(
    voiceLang ?? "fr",
    "Zephyr",
    { onToolCall: handleLiveToolCall, onTranscript: handleLiveTranscript },
    brand.slug
  );

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

  // end_call from text chat → close panel after delay.
  useEffect(() => {
    return onEndCall(() => {
      if (live.isConnected) return;
      if (!embedded) setTimeout(() => setOpen(false), 2500);
    });
  }, [live.isConnected, embedded]);

  // Auto-scroll on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const startCall = useCallback(() => {
    if (!live.isConnected) {
      setMessages((m) => [...m, { kind: "text", role: "assistant", text: "" }]);
      live.connect();
    }
  }, [live]);

  const endCall = useCallback(() => { live.disconnect(); }, [live]);

  const handleLangSelect = useCallback((lang: VoiceLang) => {
    setVoiceLang(lang);
    localStorage.setItem(`widget-lang-${brand.slug}`, lang);
    setMessages([{ kind: "text", role: "assistant", text: getLangConfig(lang).greeting }]);
  }, [brand.slug]);

  const sendTextMessage = useCallback(async (text: string) => {
    const current = messagesRef.current;
    const userMsg: Msg = { kind: "text", role: "user", text };
    const assistantMsg: Msg = { kind: "text", role: "assistant", text: "", tools: [] };
    const next: Msg[] = [...current, userMsg, assistantMsg];
    setMessages(next);
    setIsStreaming(true);

    if (live.isConnected) {
      live.sendText(text);
      setIsStreaming(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build the API messages list — only text turns; image_card aren't part of LLM context.
      const apiMessages = next
        .slice(0, -1)
        .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
        .map((m) => ({ role: m.role, content: m.text }));

      const res = await fetch("/api/rihla/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandSlug: brand.slug,
          locale: apiLocale,
          voice: false,
          messages: apiMessages,
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
          if (ev.type === "text") {
            textAcc += ev.text;
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.kind === "text" && last.role === "assistant") {
                copy[copy.length - 1] = { ...last, text: textAcc };
              }
              return copy;
            });
          } else if (ev.type === "tool") {
            dispatchRihlaTool(
              { name: ev.name, input: ev.input },
              { locale: apiLocale, router: { push: () => {} }, brand }
            );
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
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.kind === "text" && last.role === "assistant" && !last.text) {
            copy[copy.length - 1] = { ...last, text: "Petit souci technique." };
          }
          return copy;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [apiLocale, brand, live]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    void sendTextMessage(text);
  }, [input, isStreaming, sendTextMessage]);

  const accent = brand.primaryColor ?? "#121214";

  // ─── Render ─────────────────────────────────────────────────────────────

  // Embedded mode renders the panel inline (no FAB, no close button).
  if (embedded) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
        <BubbleContent
          brand={brand}
          availableLangs={availableLangs}
          voiceLang={voiceLang}
          langConfig={langConfig}
          live={live}
          callDuration={callDuration}
          endCall={endCall}
          startCall={startCall}
          messages={messages}
          isStreaming={isStreaming}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          handleLangSelect={handleLangSelect}
          scrollRef={scrollRef}
          accent={accent}
          onClose={null}
          onLangReset={() => { setVoiceLang(null); localStorage.removeItem(`widget-lang-${brand.slug}`); }}
        />
      </div>
    );
  }

  // Floating mode (used in /demo/[brand]) — FAB + slide-up panel.
  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            type="button"
            onClick={() => setOpen(true)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="fixed bottom-5 end-5 z-[60] overflow-hidden rounded-full shadow-[0_8px_36px_-6px_rgba(0,0,0,0.35)]"
            style={{ background: accent }}
            aria-label="Open chat"
          >
            <div className="relative h-14 w-14">
              {brand.logoUrl ? (
                <Image src={brand.logoUrl} alt={brand.name} fill className="object-cover p-2" sizes="56px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Sparkles size={20} color="white" />
                </div>
              )}
              <div className="absolute -end-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 0.68, 0, 1] }}
            role="dialog"
            aria-label={brand.name}
            className="fixed inset-x-3 bottom-3 z-[60] flex h-[min(720px,calc(100dvh-24px))] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_-16px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.06)] sm:inset-x-auto sm:bottom-5 sm:end-4 sm:h-[min(720px,calc(100dvh-40px))] sm:w-[min(420px,calc(100vw-32px))]"
          >
            <BubbleContent
              brand={brand}
              availableLangs={availableLangs}
              voiceLang={voiceLang}
              langConfig={langConfig}
              live={live}
              callDuration={callDuration}
              endCall={endCall}
              startCall={startCall}
              messages={messages}
              isStreaming={isStreaming}
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              handleLangSelect={handleLangSelect}
              scrollRef={scrollRef}
              accent={accent}
              onClose={() => setOpen(false)}
              onLangReset={() => { setVoiceLang(null); localStorage.removeItem(`widget-lang-${brand.slug}`); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Inner content (header + body + input) ────────────────────────────────────

type ContentProps = {
  brand: Props["brand"];
  availableLangs: VoiceLang[];
  voiceLang: VoiceLang | null;
  langConfig: ReturnType<typeof getLangConfig> | null;
  live: ReturnType<typeof useRihlaLive>;
  callDuration: number;
  endCall: () => void;
  startCall: () => void;
  messages: Msg[];
  isStreaming: boolean;
  input: string;
  setInput: (v: string) => void;
  handleSend: () => void;
  handleLangSelect: (l: VoiceLang) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  accent: string;
  onClose: (() => void) | null;
  onLangReset: () => void;
};

function BubbleContent(p: ContentProps) {
  if (p.live.isConnected) {
    return <CallView state={p.live.state} onHangUp={p.endCall} duration={p.callDuration} />;
  }
  return (
    <>
      <header
        className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3"
        style={{ background: p.accent, color: "white" }}
      >
        {p.brand.logoUrl && (
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/10 p-1">
            <Image src={p.brand.logoUrl} alt={p.brand.name} fill className="object-contain p-1" sizes="36px" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">{p.brand.name}</div>
          <div className="flex items-center gap-1.5 text-[11px] opacity-80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            En ligne
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {p.voiceLang && (
            <button
              type="button"
              onClick={p.onLangReset}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/80 transition hover:bg-white/20"
            >
              <Globe size={10} /> {p.langConfig?.flag}
            </button>
          )}
          {p.onClose && (
            <button type="button" onClick={p.onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20">
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      {!p.voiceLang ? (
        <div className="flex-1 bg-[#fafafa]">
          <LanguagePicker onSelect={p.handleLangSelect} />
        </div>
      ) : (
        <>
          <div ref={p.scrollRef} className="flex-1 overflow-y-auto bg-[#fafafa] px-4 py-4">
            <div className="space-y-4">
              {p.messages.map((m, i) =>
                m.kind === "image_card" ? (
                  <ImageCardMsg key={i} payload={m.payload} />
                ) : (
                  <TextMsg key={i} m={m} streaming={p.isStreaming && i === p.messages.length - 1} />
                )
              )}
            </div>
          </div>

          <div className="border-t border-black/[0.06] bg-white px-3 pb-3 pt-2">
            <div className="flex items-end gap-1.5 rounded-2xl border border-black/[0.08] bg-[#fafafa] p-1.5">
              <button
                type="button"
                onClick={p.startCall}
                className="mb-px flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-600"
                title="Appeler"
              >
                <PhoneCall size={14} />
              </button>
              <textarea
                value={p.input}
                onChange={(e) => p.setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); p.handleSend(); } }}
                placeholder={p.langConfig?.label ? `Message en ${p.langConfig.label}…` : "Écrivez ici…"}
                rows={1}
                disabled={p.isStreaming}
                className="block max-h-[96px] min-h-[32px] flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-[13px] leading-snug text-[#121214] outline-none placeholder:text-black/30 disabled:opacity-40"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={p.handleSend}
                disabled={p.isStreaming || !p.input.trim()}
                className="mb-px flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-20"
                style={{ background: p.accent }}
              >
                <SendHorizonal size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function TextMsg({ m, streaming }: { m: Extract<Msg, { kind: "text" }>; streaming: boolean }) {
  if (m.role === "assistant") {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-[#121214] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {m.text || (streaming ? <TypingDots /> : "")}
        </div>
        {m.tools && m.tools.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {m.tools.map((tc, j) => (
              <span key={j} className="inline-flex items-center gap-0.5 rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[9px] text-black/35">
                <Sparkles size={8} /> {tc.name.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[#121214] px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
        {m.text}
      </div>
    </motion.div>
  );
}

function ImageCardMsg({ payload }: { payload: ImageCardPayload }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="max-w-[90%] overflow-hidden rounded-2xl rounded-tl-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {payload.imageUrl && (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f4f4f5]">
            {/* Use plain <img> so we don't need a remotePatterns config for arbitrary CDNs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payload.imageUrl} alt={payload.caption ?? ""} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="px-3.5 py-2.5">
          {payload.caption && <div className="text-[13px] font-medium text-[#121214]">{payload.caption}</div>}
          {payload.ctaUrl && (
            <a
              href={payload.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:underline"
            >
              {payload.ctaLabel ?? "Voir plus"}
              <ExternalLink size={11} strokeWidth={2} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="inline-block h-[5px] w-[5px] rounded-full bg-black/25" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }} />
      ))}
    </span>
  );
}
