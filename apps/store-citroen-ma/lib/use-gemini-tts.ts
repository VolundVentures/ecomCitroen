"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeForSpeech } from "./use-speech";

type TTSState = "idle" | "loading" | "playing";

export function useGeminiTTS(lang: string = "fr") {
  const [state, setState] = useState<TTSState>("idle");
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const onDoneRef = useRef<(() => void) | null>(null);
  const langRef = useRef(lang);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const processQueue = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return;
    playingRef.current = true;
    setState("loading");

    while (queueRef.current.length > 0) {
      const text = queueRef.current.shift()!;
      const clean = sanitizeForSpeech(text);
      if (!clean) continue;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/rihla/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, lang: langRef.current }),
          signal: controller.signal,
        });

        if (!res.ok) continue;

        const arrayBuf = await res.arrayBuffer();
        const ctx = getAudioCtx();
        const audioBuf = await ctx.decodeAudioData(arrayBuf);

        setState("playing");
        await new Promise<void>((resolve) => {
          const src = ctx.createBufferSource();
          src.buffer = audioBuf;
          src.connect(ctx.destination);
          src.onended = () => resolve();
          src.start(0);
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") break;
        console.warn("[gemini-tts] playback error:", err);
      }
    }

    playingRef.current = false;
    abortRef.current = null;
    setState("idle");
    // Fire the done callback — always, regardless of any external state.
    // The caller decides whether to act.
    onDoneRef.current?.();
  }, [getAudioCtx]);

  const speak = useCallback(
    (text: string) => {
      queueRef.current.push(text);
      void processQueue();
    },
    [processQueue]
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    abortRef.current?.abort();
    playingRef.current = false;
    setState("idle");
  }, []);

  /** Set the callback that fires when the entire queue is drained and all audio has played. */
  const setOnAllDone = useCallback((cb: (() => void) | null) => {
    onDoneRef.current = cb;
  }, []);

  /** Returns true if there are queued items or audio is currently playing. */
  const isBusy = useCallback(() => {
    return playingRef.current || queueRef.current.length > 0;
  }, []);

  useEffect(() => {
    return () => {
      stop();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [stop]);

  return {
    speak,
    stop,
    state,
    isSpeaking: state === "playing",
    isLoading: state === "loading",
    setOnAllDone,
    isBusy,
  };
}
