"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildSystemPrompt } from "@citroen-store/rihla-agent";

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
        name: "book_test_drive",
        description: "Book a test drive for a qualified lead. Call at the end of the flow after collecting first name, mobile number, city, and preferred time slot.",
        parameters: {
          type: "OBJECT",
          properties: {
            slug: { type: "STRING", enum: ["c3-aircross", "c5-aircross", "berlingo"] },
            firstName: { type: "STRING" },
            phone: { type: "STRING" },
            city: { type: "STRING" },
            preferredSlot: { type: "STRING" },
          },
          required: ["slug", "firstName", "phone"],
        },
      },
      {
        name: "end_call",
        description: "END THE CALL. Call this IMMEDIATELY after your closing phrase when: (1) a booking is confirmed, (2) the user says goodbye / thanks / bye / يالاه / بسلامة, (3) the user clearly refuses to continue, or (4) the conversation has naturally ended. Never keep the call open after saying goodbye.",
        parameters: { type: "OBJECT", properties: {} },
      },
    ],
  },
];

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useRihlaLive(
  locale: string,
  voiceName: string = "Zephyr",
  callbacks: LiveCallbacks
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
          if (fc.name === "end_call") {
            // Flag disconnect to happen after the current audio finishes playing.
            shouldDisconnectRef.current = true;
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
        const parts = msg.serverContent?.modelTurn?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            enqueueAudio(part.inlineData.data);
          }
          if (part.text) {
            callbacksRef.current.onTranscript?.(part.text, false);
          }
        }
        if (msg.serverContent?.turnComplete) {
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
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      const promptLocale: "fr-MA" | "ar-MA" | "darija-MA" | "en-MA" =
        locale === "darija" ? "darija-MA"
        : locale === "ar" ? "ar-MA"
        : locale === "en" ? "en-MA"
        : "fr-MA";
      const systemPrompt = buildSystemPrompt({
        locale: promptLocale,
        marketId: "ma",
      });

      const openingByLocale: Record<typeof promptLocale, string> = {
        "fr-MA": "Bonjour ! Je suis Rihla, conseillère Citroën. Vous cherchez une voiture pour la ville, la famille, ou un usage précis ?",
        "darija-MA": "مرحبا بيك ! أنا رحلة من سيتروين. كتقلب على طوموبيل للمدينة، للعائلة، ولا لاستعمال معين ؟",
        "ar-MA": "أهلاً وسهلاً ! أنا رحلة، مستشارتكم في سيتروين. هل تبحثون عن سيارة للمدينة، للعائلة، أم لاستخدام محدد ؟",
        "en-MA": "Hello! I'm Rihla from Citroën. Are you looking for a car for the city, for the family, or a specific use?",
      };
      const languageReminderByLocale: Record<typeof promptLocale, string> = {
        "fr-MA": "LANGUAGE: Speak in CLEAN STANDARD FRENCH only. No Moroccan accent. No darija words. No 'Merhba', no 'Hamdulillah', no 'Inshallah'. Pronounce like a French radio presenter.",
        "darija-MA": "LANGUAGE: Speak in Moroccan Darija only. Arabic script in transcripts.",
        "ar-MA": "LANGUAGE: Speak in Modern Standard Arabic (fus'ha). No Moroccan dialect words.",
        "en-MA": "LANGUAGE: Speak in clean neutral English only. No Moroccan/Arabic greetings mixed in.",
      };

      const voicePromptSuffix = `\n\nVOICE MODE — YOU ARE ON A LIVE PHONE CALL:

${languageReminderByLocale[promptLocale]}

SPEECH RULES:
- NO markdown, asterisks, emojis, bullet lists. Plain spoken words only.
- 1 to 2 short sentences per turn. Like a real phone call.
- NEVER say technical parameter names: no "slug", "c3-aircross", "color red". Say "le C3 Aircross", "en rouge Elixir".
- Spell numbers and prices in words.
- Repeat phone numbers back digit by digit to confirm ("zéro six six un, deux trois, quatre cinq, six sept, c'est bien ça ?").

CALL BEHAVIOR:
- YOU speak FIRST when the call connects. Start with this EXACT opening: "${openingByLocale[promptLocale]}"
- Follow the 8-turn qualification flow from the system prompt STRICTLY. One question per turn.
- Collect in order: usage → budget → recommendation + open_model → first name → mobile → city → time slot → book_test_drive + end_call.
- When the user says goodbye, thanks, or after a booking confirmation: say a warm farewell in ONE sentence, then IMMEDIATELY call end_call. Never keep the call open.

TOOL USE:
- Say one natural sentence BEFORE each tool call. Never expose parameter names.
- Call end_call right after any farewell. Call book_test_drive once you have first name + phone + city + slot.`;

      ws.send(
        JSON.stringify({
          setup: {
            model: "models/gemini-3.1-flash-live-preview",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
            },
            systemInstruction: { parts: [{ text: systemPrompt + voicePromptSuffix }] },
            tools: LIVE_TOOLS,
          },
        })
      );

      startMic(ws);
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
  }, [locale, voiceName, handleMessage, startMic, updateState]);

  // ─── Disconnect ───────────────────────────────────────────────────────────

  const stopMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      workletRef.current?.disconnect();
    } catch { /* */ }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    stopMic();
    playQueueRef.current = [];
    isPlayingRef.current = false;
    shouldDisconnectRef.current = false;
    updateState("idle");
  }, [stopMic, updateState]);

  disconnectRef.current = disconnect;

  // Send text through the live session (uses realtimeInput which works, unlike clientContent)
  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ realtimeInput: { text } }));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { state, connect, disconnect, sendText, isConnected: state !== "idle" && state !== "error" };
}
