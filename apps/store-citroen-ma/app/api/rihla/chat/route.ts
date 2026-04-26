import { NextRequest } from "next/server";
import { GoogleGenAI, Type, type Tool, type Content } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { RIHLA_MODELS, buildSystemPrompt, type BrandContext } from "@citroen-store/rihla-agent";
import { getBrandContext, toAgentContext } from "@/lib/brand-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatRequest = {
  /** Required for widget mode — the brand whose prompt + catalog to use. */
  brandSlug?: string;
  locale?: "fr" | "ar" | "darija" | "en" | "ar-SA" | "en-SA";
  messages: ChatMessage[];
  dealerCityHint?: string;
  returningUser?: boolean;
  sessionSummary?: string;
  pageContext?: { path: string; modelSlug?: string };
  /** Voice mode → plain text only, short sentences, no markdown. */
  voice?: boolean;
};

const FALLBACK_BY_LOCALE = {
  fr: "Je suis Rihla. Vous cherchez une voiture pour la ville, la famille, ou un usage précis ?",
  ar: "أنا رحلة. هل تبحثون عن سيارة للمدينة، للعائلة، أم لاستخدام محدد ؟",
  darija: "أنا رحلة. كتقلب على طوموبيل للمدينة، للعائلة، ولا لاستعمال معين ؟",
  en: "I'm Rihla. Are you looking for a car for the city, the family, or a specific use?",
} as const;

function mapLocaleToRihla(l?: string, market?: string): "fr-MA" | "ar-MA" | "darija-MA" | "en-MA" | "ar-SA" | "en-SA" {
  // Saudi market resolves to KSA locales
  if (market === "SA") {
    if (l === "ar" || l === "ar-SA") return "ar-SA";
    return "en-SA";
  }
  if (l === "darija") return "darija-MA";
  if (l === "ar") return "ar-MA";
  if (l === "en") return "en-MA";
  return "fr-MA";
}

/** Minimal brand fallback for legacy citroen-ma calls without brandSlug. */
const CITROEN_FALLBACK: BrandContext = {
  brandSlug: "citroen-ma",
  brandName: "Citroën Maroc",
  agentName: "Rihla",
  market: "MA",
  defaultCurrency: "MAD",
  models: [
    { slug: "c3-aircross", name: "C3 Aircross", priceFrom: 234900, currency: "MAD", fuel: "Hybrid", seats: 5 },
    { slug: "c5-aircross", name: "C5 Aircross", priceFrom: 295900, currency: "MAD", fuel: "PHEV", seats: 5 },
    { slug: "berlingo", name: "Berlingo", priceFrom: 195900, currency: "MAD", fuel: "Diesel", seats: 7 },
  ],
};

/* ───────────────────────────── Navigation tools ───────────────────────────── */

/** Gemini function declarations (native format). */
const GEMINI_NAV_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "navigate_to",
        description:
          "Navigate the browser to a site path (/models, /dealers, /financing, /account, /orders, /service, /legal, /privacy, /terms).",
        parameters: {
          type: Type.OBJECT,
          properties: { path: { type: Type.STRING } },
          required: ["path"],
        },
      },
      {
        name: "open_model",
        description:
          "Open a specific model detail page when the user shows interest in one model.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            slug: {
              type: Type.STRING,
              enum: ["c3-aircross", "c5-aircross", "berlingo"],
            },
          },
          required: ["slug"],
        },
      },
      {
        name: "configure_car",
        description:
          "Update the configurator preview (color, trim, angle). MUST be called when the user asks to change color (بدل اللون, mets en rouge, change color), trim, or viewing angle. If the user is already on a model detail page, use THIS tool — do NOT also call open_model.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            slug: {
              type: Type.STRING,
              enum: ["c3-aircross", "c5-aircross", "berlingo"],
            },
            color: { type: Type.STRING },
            trim: { type: Type.STRING },
            angle: { type: Type.NUMBER },
          },
        },
      },
      {
        name: "start_reservation",
        description: "Start the reservation flow for a model.",
        parameters: {
          type: Type.OBJECT,
          properties: { slug: { type: Type.STRING } },
          required: ["slug"],
        },
      },
      {
        name: "open_dealers",
        description: "Open the dealer locator page.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "open_financing",
        description: "Open the financing advisor page.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "scroll_to",
        description:
          "Scroll to a named section on the current page. Sections: 'range', 'configurator', 'gallery', 'features', 'specs', 'cta'.",
        parameters: {
          type: Type.OBJECT,
          properties: { section: { type: Type.STRING } },
          required: ["section"],
        },
      },
      {
        name: "show_model_image",
        description: "Display a photo of a specific model inline in the chat. Call whenever you mention or recommend a model.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            slug: { type: Type.STRING },
            caption: { type: Type.STRING },
          },
          required: ["slug"],
        },
      },
      {
        name: "open_brand_page",
        description: "Open the official brand-site page for a model in a new browser tab.",
        parameters: {
          type: Type.OBJECT,
          properties: { slug: { type: Type.STRING } },
          required: ["slug"],
        },
      },
      {
        name: "book_test_drive",
        description:
          "Book a test drive for a qualified lead. Call at the end of the flow once you have first name, mobile number, city, and preferred slot.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            slug: { type: Type.STRING },
            firstName: { type: Type.STRING },
            phone: { type: Type.STRING },
            city: { type: Type.STRING },
            preferredSlot: { type: Type.STRING },
          },
          required: ["slug", "firstName", "phone"],
        },
      },
      {
        name: "end_call",
        description:
          "End the conversation. Call this IMMEDIATELY after your farewell phrase when: (1) a booking is confirmed, (2) the user says goodbye / thanks / bye, (3) the user clearly refuses to continue. Never keep the session open after saying goodbye.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
    ],
  },
];

/** Anthropic tool schemas (fallback path). */
const ANTHROPIC_NAV_TOOLS: Anthropic.Messages.Tool[] = [
  { name: "navigate_to", description: "Navigate to a site path.", input_schema: { type: "object" as const, properties: { path: { type: "string" as const } }, required: ["path"] } },
  { name: "open_model", description: "Open a model detail page.", input_schema: { type: "object" as const, properties: { slug: { type: "string" as const, enum: ["c3-aircross", "c5-aircross", "berlingo"] } }, required: ["slug"] } },
  { name: "configure_car", description: "Update configurator on the CURRENT page without reloading.", input_schema: { type: "object" as const, properties: { slug: { type: "string" as const }, color: { type: "string" as const }, trim: { type: "string" as const }, angle: { type: "number" as const } }, required: [] } },
  { name: "start_reservation", description: "Start reservation.", input_schema: { type: "object" as const, properties: { slug: { type: "string" as const } }, required: ["slug"] } },
  { name: "open_dealers", description: "Open dealers.", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "open_financing", description: "Open financing.", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "scroll_to", description: "Scroll to section.", input_schema: { type: "object" as const, properties: { section: { type: "string" as const } }, required: ["section"] } },
  { name: "show_model_image", description: "Display a photo of a specific model inline in the chat.", input_schema: { type: "object" as const, properties: { slug: { type: "string" as const }, caption: { type: "string" as const } }, required: ["slug"] } },
  { name: "open_brand_page", description: "Open the official brand-site page for a model in a new browser tab.", input_schema: { type: "object" as const, properties: { slug: { type: "string" as const } }, required: ["slug"] } },
  { name: "book_test_drive", description: "Book a test drive once you have firstName + phone + city + slot.", input_schema: { type: "object" as const, properties: { slug: { type: "string" as const }, firstName: { type: "string" as const }, phone: { type: "string" as const }, city: { type: "string" as const }, preferredSlot: { type: "string" as const } }, required: ["slug", "firstName", "phone"] } },
  { name: "end_call", description: "End the conversation right after a farewell phrase. Never keep the session open after saying goodbye.", input_schema: { type: "object" as const, properties: {}, required: [] } },
];

/* ─────────────────────────── System prompt build ─────────────────────────── */

function buildPromptSuffix(
  pageContext: ChatRequest["pageContext"],
  voice: boolean
) {
  const parts: string[] = ["", "NAVIGATION + ACTION TOOLS"];
  parts.push(
    "- You have tools to drive the UI. CALL A TOOL whenever the user intent maps to a navigation or configurator change. Do not just describe — act.",
    "- One SHORT sentence of natural-language context BEFORE the tool call.",
    "- If the user is ALREADY on a model detail page, use `configure_car` (not `open_model`) to change color/trim/angle.",
    "- Never mention the words 'tool', 'function', 'API'.",
    "",
    "TOOL CALL EXAMPLES (bilingual — always call the tool, in any language):",
    "- FR: 'Mets-la en rouge' → say 'Je vous la mets en rouge.' then call configure_car(slug='c3-aircross', color='red')",
    "- AR/Darija: 'بدل اللون للحمر' → say 'واخا، غادي نبدلها بالحمر!' then call configure_car(slug='c3-aircross', color='red')",
    "- FR: 'Montre-moi le Berlingo' → say 'Je vous ouvre le Berlingo.' then call open_model(slug='berlingo')",
    "- AR/Darija: 'بغيت نشوف البرلينجو' → say 'واخا، هاهو البرلينجو!' then call open_model(slug='berlingo')",
    "- FR: 'Je veux réserver' → say 'Allez, on y va!' then call start_reservation(slug='...')",
    "- AR/Darija: 'بغيت نحجز' → say 'يالاه!' then call start_reservation(slug='...')"
  );
  if (pageContext?.path) parts.push(`- Current page: ${pageContext.path}.`);
  if (pageContext?.modelSlug) parts.push(`- Viewing model: ${pageContext.modelSlug}.`);

  if (voice) {
    parts.push(
      "",
      "VOICE MODE — YOU ARE BEING SPOKEN ALOUD",
      "- ABSOLUTELY NO markdown, NO asterisks **, NO bullet lists, NO emojis, NO hashtags.",
      "- Plain conversational prose, 1 to 2 short sentences per turn (max 20 words each).",
      "- Numbers: spell out currencies and measurements in words.",
      "- Phone numbers: repeat back digit by digit to confirm.",
      "- Do not repeat the user's question verbatim; acknowledge briefly and answer.",
      "- Stick to the language block rules in the system prompt. Do NOT mix languages."
    );
  }
  parts.push(
    "",
    "END OF CONVERSATION",
    "- When the user says goodbye / thanks / bye, or after a booking is confirmed, say ONE warm farewell sentence and immediately call end_call.",
    "- Never continue after a farewell. The end_call tool is the only way to end the session cleanly."
  );
  return parts.join("\n");
}

/* ─────────────────── Fast-path intent detector ───────────────────────── */
// Gemini's tool calling is unreliable in Arabic. This catches common action
// patterns and emits tool calls directly, so the LLM only needs to generate
// the verbal confirmation.

type DetectedIntent = { name: string; input: Record<string, unknown> } | null;

function detectIntent(
  msg: string,
  pageContext?: ChatRequest["pageContext"]
): DetectedIntent {
  const text = msg.toLowerCase().trim();
  const slug = pageContext?.modelSlug;

  // Color change patterns (FR + AR + EN) — broad match, color word anywhere
  const isColorIntent = /(?:mets|change|passe|couleur|color|بدل|لون|بال|بغيت)/i.test(text);
  const colorMatch = isColorIntent
    ? text.match(/(rouge|حمر|أحمر|الحمر|bleu|أزرق|زرق|الزرق|blanc|أبيض|بيض|الأبيض|gris|رمادي|الرمادي|vert|أخضر|خضر|الأخضر|noir|أسود|كحل|الأسود|red|blue|white|grey|gray|green|black)/i)
    : null;
  if (colorMatch && slug) {
    const rawColor = (colorMatch[1] ?? "").replace(/^ال/, "").toLowerCase();
    const colorMap: Record<string, string> = {
      rouge: "red", حمر: "red", أحمر: "red", red: "red",
      bleu: "blue", أزرق: "blue", زرق: "blue", blue: "blue",
      blanc: "white", أبيض: "white", بيض: "white", white: "white",
      gris: "grey", رمادي: "grey", grey: "grey", gray: "grey",
      vert: "green", أخضر: "green", خضر: "green", green: "green",
      noir: "black", أسود: "black", كحل: "black", black: "black",
    };
    return { name: "configure_car", input: { slug, color: colorMap[rawColor] ?? rawColor } };
  }

  // Model open patterns
  const modelMatch = text.match(/(?:montre|ouvre|بغيت نشوف|ورّيني|show|open).+?(c3.?aircross|c5.?aircross|berlingo|بيرلينجو|برلينجو)/i);
  if (modelMatch) {
    const raw = (modelMatch[1] ?? "").toLowerCase();
    const slugMap: Record<string, string> = {
      berlingo: "berlingo", بيرلينجو: "berlingo", برلينجو: "berlingo",
    };
    const matched = raw.includes("c3") ? "c3-aircross" : raw.includes("c5") ? "c5-aircross" : slugMap[raw] ?? "berlingo";
    return { name: "open_model", input: { slug: matched } };
  }

  // Reservation intent
  if (/(?:réserv|حجز|بغيت نحجز|reserve|book)/i.test(text) && slug) {
    return { name: "start_reservation", input: { slug } };
  }

  return null;
}

/* ─────────────────────────── Stream helpers ─────────────────────────── */

function emit(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  obj: unknown
) {
  controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
}

/* ─────────────────────────── Gemini handler ─────────────────────────── */

async function streamWithGemini(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  systemInstruction: string,
  messages: ChatMessage[]
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction,
      tools: GEMINI_NAV_TOOLS,
      // @ts-expect-error — FunctionCallingConfigMode enum not exported by SDK
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      temperature: 0.7,
    },
  });

  for await (const chunk of response) {
    const parts = chunk?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (typeof part.text === "string" && part.text.length > 0) {
        emit(controller, encoder, { type: "text", text: part.text });
      }
      if (part.functionCall) {
        const name = part.functionCall.name ?? "unknown";
        const input = (part.functionCall.args ?? {}) as Record<string, unknown>;
        emit(controller, encoder, { type: "tool", name, input });
      }
    }
  }
}

/* ─────────────────────────── Anthropic handler (fallback) ─────────────────────────── */

async function streamWithAnthropic(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  systemPrompt: string,
  messages: ChatMessage[]
) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const stream = client.messages.stream({
    model: RIHLA_MODELS.primary,
    max_tokens: 1024,
    system: systemPrompt,
    tools: ANTHROPIC_NAV_TOOLS,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const toolAccum: Record<number, { name: string; json: string; emitted: boolean }> = {};

  for await (const event of stream) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        toolAccum[event.index] = {
          name: event.content_block.name,
          json: "",
          emitted: false,
        };
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        emit(controller, encoder, { type: "text", text: event.delta.text });
      } else if (event.delta.type === "input_json_delta") {
        const slot = toolAccum[event.index];
        if (slot) slot.json += event.delta.partial_json;
      }
    } else if (event.type === "content_block_stop") {
      const slot = toolAccum[event.index];
      if (slot && !slot.emitted) {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = slot.json ? JSON.parse(slot.json) : {};
        } catch {
          parsed = {};
        }
        emit(controller, encoder, { type: "tool", name: slot.name, input: parsed });
        slot.emitted = true;
      }
    }
  }
}

/* ─────────────────────────── Handler ─────────────────────────── */

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest;
  const encoder = new TextEncoder();

  // Load brand context if a brandSlug is provided AND Supabase is configured.
  // Falls back to a minimal hard-coded Citroën catalog for legacy calls.
  let brand: BrandContext = CITROEN_FALLBACK;
  let customBody: string | undefined;
  if (body.brandSlug && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const ctx = await getBrandContext(body.brandSlug);
      if (ctx) {
        brand = toAgentContext(ctx);
        customBody = ctx.activePrompt?.body ?? undefined;
      }
    } catch (err) {
      console.warn("[chat] failed to load brand context, using fallback:", (err as Error).message);
    }
  }

  const locale = mapLocaleToRihla(body.locale, brand.market);

  const baseSystem = buildSystemPrompt({
    locale,
    brand,
    customBody,
    dealerCityHint: body.dealerCityHint,
    returningUser: body.returningUser,
    sessionSummary: body.sessionSummary,
  });
  const systemPrompt = baseSystem + buildPromptSuffix(body.pageContext, !!body.voice);

  const geminiKey = process.env.GOOGLE_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const provider: "gemini" | "anthropic" | "none" = geminiKey
    ? "gemini"
    : anthropicKey
    ? "anthropic"
    : "none";

  if (provider === "none") {
    const fallbackKey = (body.locale ?? "fr").startsWith("ar") ? "ar"
      : (body.locale ?? "fr").startsWith("en") ? "en"
      : body.locale === "darija" ? "darija"
      : "fr";
    const fallback = FALLBACK_BY_LOCALE[fallbackKey as keyof typeof FALLBACK_BY_LOCALE] ?? FALLBACK_BY_LOCALE.fr;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const token of fallback.split(/(\s+)/)) {
          emit(controller, encoder, { type: "text", text: token });
          await new Promise((r) => setTimeout(r, 18));
        }
        emit(controller, encoder, { type: "done" });
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Rihla-Mode": "scaffold-fallback",
      },
    });
  }

  // Fast-path: detect common action intents and emit tool calls before LLM runs.
  const lastUserMsg = [...body.messages].reverse().find((m) => m.role === "user");
  const fastIntent = lastUserMsg
    ? detectIntent(lastUserMsg.content, body.pageContext)
    : null;
  if (fastIntent) {
    console.log("[rihla/chat] fast-path:", fastIntent.name, JSON.stringify(fastIntent.input));
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Emit fast-path tool call BEFORE LLM generates text
        if (fastIntent) {
          emit(controller, encoder, {
            type: "tool",
            name: fastIntent.name,
            input: fastIntent.input,
          });
        }

        if (provider === "gemini") {
          try {
            await streamWithGemini(controller, encoder, systemPrompt, body.messages);
          } catch (geminiErr) {
            // Gemini failed — fall back to Claude if available
            const fallbackKey = process.env.ANTHROPIC_API_KEY;
            if (fallbackKey) {
              console.warn("[rihla/chat] Gemini failed, falling back to Claude:", (geminiErr as Error).message?.slice(0, 80));
              await streamWithAnthropic(controller, encoder, systemPrompt, body.messages);
            } else {
              throw geminiErr;
            }
          }
        } else {
          await streamWithAnthropic(controller, encoder, systemPrompt, body.messages);
        }
        emit(controller, encoder, { type: "done" });
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emit(controller, encoder, {
          type: "text",
          text: `\n[Rihla — moment technique: ${msg.slice(0, 140)}]`,
        });
        emit(controller, encoder, { type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Rihla-Mode": provider === "gemini" ? "gemini-2.5-flash" : "claude-sonnet-4-6",
    },
  });
}
