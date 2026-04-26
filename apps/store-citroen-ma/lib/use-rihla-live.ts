"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LiveState = "idle" | "connecting" | "connected" | "speaking" | "listening" | "error";

export type LiveToolCall = {
  name: string;
  id: string;
  args: Record<string, unknown>;
};

type LiveCallbacks = {
  onToolCall: (call: LiveToolCall) => string;
  onTranscript?: (text: string, fromUser: boolean) => void;
  onStateChange?: (state: LiveState) => void;
};

type GeminiMsg =
  | { setupComplete: unknown }
  | {
      serverContent?: {
        modelTurn?: { parts?: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> };
        inputTranscription?: { text?: string; finished?: boolean };
        outputTranscription?: { text?: string; finished?: boolean };
        turnComplete?: boolean;
      };
    }
  | {
      toolCall?: {
        functionCalls: Array<{ name: string; id: string; args: Record<string, unknown> }>;
      };
    };

// ─── Tool declarations for the live session ─────────────────────────────────

const LIVE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "configure_car",
        description: "Change the color, trim or angle of the car on the current page. MUST be called when user asks to change color (بدل اللون, mets en rouge).",
        parameters: {
          type: "OBJECT",
          properties: {
            slug: { type: "STRING", enum: ["c3-aircross", "c5-aircross", "berlingo"] },
            color: { type: "STRING" },
            trim: { type: "STRING" },
          },
        },
      },
      {
        name: "open_model",
        description: "Open a model detail page (بغيت نشوف, montre-moi).",
        parameters: {
          type: "OBJECT",
          properties: { slug: { type: "STRING", enum: ["c3-aircross", "c5-aircross", "berlingo"] } },
          required: ["slug"],
        },
      },
      {
        name: "start_reservation",
        description: "Open the reservation page to book this car.",
        parameters: {
          type: "OBJECT",
          properties: { slug: { type: "STRING" } },
          required: ["slug"],
        },
      },
      {
        name: "open_financing",
        description: "Open the financing advisor page or run a financing simulation.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "open_dealers",
        description: "Open the dealer locator page.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "calculate_financing",
        description: "Calculate monthly payment for a car. Call when user asks about price, mensualité, budget.",
        parameters: {
          type: "OBJECT",
          properties: {
            vehiclePrice: { type: "NUMBER" },
            downPayment: { type: "NUMBER" },
            termMonths: { type: "NUMBER" },
            annualRatePct: { type: "NUMBER" },
          },
          required: ["vehiclePrice"],
        },
      },
      {
        name: "show_model_image",
        description: "Display a photo of a specific model inline in the chat. Call when you recommend a model or the user asks to see one.",
        parameters: {
          type: "OBJECT",
          properties: {
            slug: { type: "STRING", description: "The model slug (e.g. 'wrangler', 'c3-aircross', '5008')." },
            caption: { type: "STRING", description: "Optional one-line caption shown under the image." },
          },
          required: ["slug"],
        },
      },
      {
        name: "open_brand_page",
        description: "Open the official brand-site page for a model in a new browser tab. Use when the user wants to see more details, specs, or configure on the official site.",
        parameters: {
          type: "OBJECT",
          properties: {
            slug: { type: "STRING", description: "The model slug." },
          },
          required: ["slug"],
        },
      },
      {
        name: "book_test_drive",
        description: "Book a TEST DRIVE for a qualified lead. Use when the user wants to drive the car. Call at the end of the flow after collecting first name, mobile number, city, and preferred time slot.",
        parameters: {
          type: "OBJECT",
          properties: {
            slug: { type: "STRING" },
            firstName: { type: "STRING" },
            phone: { type: "STRING" },
            city: { type: "STRING" },
            preferredSlot: { type: "STRING" },
          },
          required: ["slug", "firstName", "phone"],
        },
      },
      {
        name: "book_showroom_visit",
        description: "Schedule a SHOWROOM VISIT (the user wants to come see the cars in person, not test-drive). Call after collecting first name, phone, city, and preferred slot.",
        parameters: {
          type: "OBJECT",
          properties: {
            slug: { type: "STRING" },
            firstName: { type: "STRING" },
            phone: { type: "STRING" },
            city: { type: "STRING" },
            preferredSlot: { type: "STRING" },
          },
          required: ["firstName", "phone"],
        },
      },
      {
        name: "find_showrooms",
        description: "List nearby showrooms / dealers. CALL THIS whenever the user names a city ('I'm in Riyadh', 'Casablanca', 'Jeddah') or asks where to find the cars / book a visit / find a service centre. Renders a card list with names, addresses, phones, hours. After calling, briefly summarize ('I found 3 in Riyadh — would you like to visit one?').",
        parameters: {
          type: "OBJECT",
          properties: {
            city: { type: "STRING", description: "City name as the user said it. Empty/undefined to list all showrooms." },
          },
        },
      },
      {
        name: "end_call",
        description: "END THE CALL — call this IMMEDIATELY after your closing line whenever the user signals they're done. Triggers (any language, partial match): 'bye', 'goodbye', 'thanks', 'thank you', 'au revoir', 'merci', 'à bientôt', 'bonne journée', 'salut', 'شكرا', 'شكراً', 'بسلامة', 'في أمان الله', 'مع السلامة', 'يالله', 'يالاه', 'صافي', 'خلاص', 'تمام', 'تسلم', 'الله يعطيك العافية'. ALSO call after a successful book_test_drive + farewell. Never continue after a farewell — end_call is the only valid response.",
        parameters: { type: "OBJECT", properties: {} },
      },
    ],
  },
];

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useRihlaLive(
  locale: string,
  voiceName: string = "Zephyr",
  callbacks: LiveCallbacks,
  brandSlug?: string
) {
  const [state, setState] = useState<LiveState>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const shouldDisconnectRef = useRef(false);
  const disconnectRef = useRef<(() => void) | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  // Voice persistence — server-issued conversation id, plus rolling buffers
  // for the currently-streaming user and assistant turns. Both are flushed on
  // each model turnComplete so persistence doesn't depend on Gemini setting
  // a `finished` flag (which it doesn't always set).
  const conversationIdRef = useRef<string | null>(null);
  const userBufferRef = useRef<string>("");
  const assistantBufferRef = useRef<string>("");

  const persistEvent = useCallback(async (payload: Record<string, unknown>) => {
    if (!conversationIdRef.current) return;
    try {
      await fetch("/api/rihla/voice/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversationIdRef.current, ...payload }),
      });
    } catch {
      // Best-effort; never break the call flow on persistence failure.
    }
  }, []);

  const updateState = useCallback((s: LiveState) => {
    setState(s);
    callbacksRef.current.onStateChange?.(s);
  }, []);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // ─── Play received audio ────────────────────────────────────────────────

  const playNextChunk = useCallback(() => {
    if (isPlayingRef.current || playQueueRef.current.length === 0) return;
    isPlayingRef.current = true;

    const ctx = getAudioCtx();
    // Merge all queued chunks into one buffer for gapless playback
    const totalLength = playQueueRef.current.reduce((s, c) => s + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of playQueueRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    playQueueRef.current = [];

    const buffer = ctx.createBuffer(1, merged.length, 24000);
    buffer.getChannelData(0).set(merged);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      isPlayingRef.current = false;
      if (playQueueRef.current.length > 0) playNextChunk();
    };
    src.start();
    updateState("speaking");
  }, [getAudioCtx, updateState]);

  const enqueueAudio = useCallback(
    (base64: string) => {
      const raw = atob(base64);
      const pcm = new Int16Array(raw.length / 2);
      for (let i = 0; i < pcm.length; i++) {
        pcm[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
      }
      const float = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) float[i] = (pcm[i] ?? 0) / 32768;
      playQueueRef.current.push(float);
      // Start playback after a small buffer (200ms worth of audio = 4800 samples at 24kHz)
      const totalQueued = playQueueRef.current.reduce((s, c) => s + c.length, 0);
      if (!isPlayingRef.current && totalQueued > 4800) {
        playNextChunk();
      }
    },
    [playNextChunk]
  );

  // ─── WebSocket message handler ──────────────────────────────────────────

  const handleMessage = useCallback(
    (data: string) => {
      let msg: GeminiMsg;
      try {
        msg = JSON.parse(data);
      } catch {
        return;
      }

      if ("setupComplete" in msg) {
        updateState("listening");
        return;
      }

      if ("toolCall" in msg && msg.toolCall) {
        for (const fc of msg.toolCall.functionCalls) {
          // Persist every tool call (incl. end_call, book_test_drive).
          if (brandSlug) {
            void persistEvent({
              kind: "tool_call",
              brandSlug,
              name: fc.name,
              input: fc.args ?? {},
            });
          }
          if (fc.name === "end_call") {
            // 1. Mark for disconnect when audio drains.
            shouldDisconnectRef.current = true;
            // 2. Forward to caller so the UI can navigate (bubble switches off CallView).
            try { callbacksRef.current.onToolCall({ name: fc.name, id: fc.id, args: fc.args }); }
            catch { /* swallow */ }
            // 3. Hard backstop: after 6s, force disconnect even if turnComplete never arrives
            //    or the audio queue gets stuck. This is the safety net for the freeze the user hit.
            window.setTimeout(() => {
              if (shouldDisconnectRef.current) {
                shouldDisconnectRef.current = false;
                disconnectRef.current?.();
              }
            }, 6000);
            // 4. Ack the tool so the model can emit one final farewell turn.
            wsRef.current?.send(
              JSON.stringify({
                toolResponse: {
                  functionResponses: [
                    { name: fc.name, id: fc.id, response: { result: "call ended" } },
                  ],
                },
              })
            );
            continue;
          }
          const result = callbacksRef.current.onToolCall({
            name: fc.name,
            id: fc.id,
            args: fc.args,
          });
          wsRef.current?.send(
            JSON.stringify({
              toolResponse: {
                functionResponses: [
                  { name: fc.name, id: fc.id, response: { result } },
                ],
              },
            })
          );
        }
        return;
      }

      if ("serverContent" in msg && msg.serverContent) {
        const sc = msg.serverContent;

        // User speech transcript chunks (inputAudioTranscription must be
        // enabled in the setup payload). Buffer until turnComplete.
        if (sc.inputTranscription?.text) {
          const t = sc.inputTranscription.text;
          userBufferRef.current += t;
          callbacksRef.current.onTranscript?.(t, true);
        }
        // Model speech transcript chunks.
        if (sc.outputTranscription?.text) {
          const t = sc.outputTranscription.text;
          assistantBufferRef.current += t;
          callbacksRef.current.onTranscript?.(t, false);
        }

        const parts = sc?.modelTurn?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            enqueueAudio(part.inlineData.data);
          }
          if (part.text) {
            assistantBufferRef.current += part.text;
            callbacksRef.current.onTranscript?.(part.text, false);
          }
        }
        if (sc?.turnComplete) {
          // Flush BOTH buffers once per completed model turn. Persisting user
          // text first preserves chronological order in the transcript view.
          if (userBufferRef.current.trim()) {
            void persistEvent({ kind: "user_text", text: userBufferRef.current.trim() });
            userBufferRef.current = "";
          }
          if (assistantBufferRef.current) {
            void persistEvent({ kind: "assistant_text", text: assistantBufferRef.current });
            assistantBufferRef.current = "";
          }
          // Flush remaining audio
          if (playQueueRef.current.length > 0 && !isPlayingRef.current) {
            playNextChunk();
          }
          // After playback finishes: either disconnect (end_call was called) or
          // go back to listening.
          const checkDone = () => {
            if (!isPlayingRef.current) {
              if (shouldDisconnectRef.current) {
                shouldDisconnectRef.current = false;
                disconnectRef.current?.();
              } else {
                updateState("listening");
              }
            } else {
              setTimeout(checkDone, 100);
            }
          };
          setTimeout(checkDone, 200);
        }
      }
    },
    [enqueueAudio, playNextChunk, updateState]
  );

  // ─── Mic capture → send PCM to Gemini ───────────────────────────────────

  const startMic = useCallback(
    async (ws: WebSocket) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Use ScriptProcessor as a simple cross-browser fallback
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, Math.round((input[i] ?? 0) * 32767)));
        }
        const bytes = new Uint8Array(pcm16.buffer);
        let b64 = "";
        for (let i = 0; i < bytes.length; i++) b64 += String.fromCharCode(bytes[i]!);
        ws.send(
          JSON.stringify({
            realtimeInput: {
              audio: { data: btoa(b64), mimeType: "audio/pcm;rate=16000" },
            },
          })
        );
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      workletRef.current = processor as unknown as AudioWorkletNode;
    },
    []
  );

  // ─── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("[rihla-live] NEXT_PUBLIC_GOOGLE_API_KEY not set");
      updateState("error");
      return;
    }

    updateState("connecting");
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    // Kick off prompt + voice-session fetches in PARALLEL with the WS open
    // and with mic permission. Previously these were sequential inside
    // ws.onopen, costing ~2-4s before the agent could hear the user.
    const promptParams = new URLSearchParams({
      locale,
      voice: "1",
      ...(brandSlug ? { brand: brandSlug } : {}),
    });
    const promptPromise = fetch(`/api/rihla/system-prompt?${promptParams}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null) as Promise<{ systemPrompt: string; voiceName?: string; locale?: string } | null>;

    const voiceStartPromise = brandSlug
      ? fetch("/api/rihla/voice/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandSlug, locale }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null) as Promise<{ id?: string } | null>
      : Promise.resolve(null);

    // Request mic permission and warm the audio context immediately.
    // (The processor sends nothing until the WS is open — see startMic.)
    const ws = new WebSocket(url);
    wsRef.current = ws;
    const micPromise = startMic(ws).catch((err) => {
      console.warn("[rihla-live] mic start failed", err);
    });

    ws.onopen = async () => {
      const [promptResult, voiceResult] = await Promise.all([promptPromise, voiceStartPromise]);
      const systemPrompt = promptResult?.systemPrompt ?? "";
      const resolvedVoice = promptResult?.voiceName ?? voiceName;
      if (voiceResult?.id) conversationIdRef.current = voiceResult.id;
      // Wait for mic to be ready so the very first setup ack -> first audio
      // chunks the user produces aren't dropped.
      await micPromise;

      ws.send(
        JSON.stringify({
          setup: {
            model: "models/gemini-3.1-flash-live-preview",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: resolvedVoice } },
              },
            },
            // Transcribe both sides so we can persist them.
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: { parts: [{ text: systemPrompt }] },
            tools: LIVE_TOOLS,
          },
        })
      );
    };

    ws.onmessage = async (e) => {
      let text: string;
      if (typeof e.data === "string") {
        text = e.data;
      } else if (e.data instanceof Blob) {
        text = await e.data.text();
      } else {
        return;
      }
      handleMessage(text);
    };
    ws.onerror = () => updateState("error");
    ws.onclose = () => {
      updateState("idle");
      stopMic();
    };
  }, [locale, voiceName, brandSlug, handleMessage, startMic, updateState]);

  // ─── Disconnect ───────────────────────────────────────────────────────────

  const stopMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      workletRef.current?.disconnect();
    } catch { /* */ }
  }, []);

  const disconnect = useCallback(() => {
    // Mark the voice conversation closed (best effort).
    if (conversationIdRef.current) {
      void persistEvent({ kind: "end" });
    }
    wsRef.current?.close();
    wsRef.current = null;
    stopMic();
    playQueueRef.current = [];
    isPlayingRef.current = false;
    shouldDisconnectRef.current = false;
    assistantBufferRef.current = "";
    userBufferRef.current = "";
    conversationIdRef.current = null;
    updateState("idle");
  }, [persistEvent, stopMic, updateState]);

  disconnectRef.current = disconnect;

  // Send text through the live session (uses realtimeInput which works, unlike clientContent).
  // For voice, we also persist the typed text immediately as a user message so
  // it appears in the conversation transcript even though Gemini's input
  // transcription only covers audio.
  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ realtimeInput: { text } }));
    }
  }, []);

  /** Forward a typed-by-user line to listeners + persistence. Used by the
   *  CallView keyboard so the typed turn appears in the transcript. */
  const notifyUserText = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    callbacksRef.current.onTranscript?.(t, true);
    if (conversationIdRef.current) {
      void persistEvent({ kind: "user_text", text: t });
    }
  }, [persistEvent]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendText,
    notifyUserText,
    isConnected: state !== "idle" && state !== "error",
  };
}
