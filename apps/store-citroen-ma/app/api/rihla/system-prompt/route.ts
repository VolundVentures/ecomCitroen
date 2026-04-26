// Returns the assembled system prompt + greeting + agent settings for a brand.
// Used by the voice hook on connect, and by the chat route via buildSystemPrompt.

import { NextRequest } from "next/server";
import { buildSystemPrompt, type BrandContext, type Locale } from "@citroen-store/rihla-agent";
import { getBrandContext, toAgentContext } from "@/lib/brand-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function mapLocale(l: string | null, market: string): Locale {
  if (market === "SA") {
    if (l === "ar" || l === "ar-SA") return "ar-SA";
    return "en-SA";
  }
  if (l === "darija") return "darija-MA";
  if (l === "ar") return "ar-MA";
  if (l === "en") return "en-MA";
  return "fr-MA";
}

const OPENING_BY_LOCALE: Record<Locale, (brandName: string, agentName: string) => string> = {
  "fr-MA": (b, a) => `Bonjour ! Je suis ${a}, conseillère ${b}. Vous cherchez une voiture pour la ville, la famille, ou un usage précis ?`,
  "darija-MA": (b, a) => `مرحبا بيك ! أنا ${a} من ${b}. كتقلب على طوموبيل للمدينة، للعائلة، ولا لاستعمال معين ؟`,
  "ar-MA": (b, a) => `أهلاً وسهلاً ! أنا ${a}، مستشارتكم في ${b}. هل تبحثون عن سيارة للمدينة، للعائلة، أم لاستخدام محدد ؟`,
  "en-MA": (b, a) => `Hello! I'm ${a} from ${b}. Are you looking for a car for the city, for the family, or a specific use?`,
  "ar-SA": (b, a) => `أهلاً وسهلاً ! أنا ${a} من ${b}. هل تبحثون عن سيارة للمدينة، للعائلة، أم لاستخدام محدد ؟`,
  "en-SA": (b, a) => `Hello! I'm ${a} from ${b}. Are you looking for a car for the city, for the family, or a specific use?`,
};

const LANG_REMINDER: Record<Locale, string> = {
  "fr-MA": "LANGUAGE: Speak in CLEAN STANDARD FRENCH only. No Moroccan accent. No darija words. No 'Merhba', no 'Hamdulillah', no 'Inshallah'.",
  "darija-MA": "LANGUAGE: Speak in Moroccan Darija only. Arabic script in transcripts.",
  "ar-MA": "LANGUAGE: Speak in Modern Standard Arabic (fus'ha). No Moroccan dialect words.",
  "en-MA": "LANGUAGE: Speak in clean neutral English only. No Moroccan/Arabic greetings mixed in.",
  "ar-SA": "LANGUAGE: Speak in formal Modern Standard Arabic or polite Saudi dialect. No Moroccan or Egyptian dialect.",
  "en-SA": "LANGUAGE: Speak in clean professional English with a warm Gulf-friendly tone. No darija, no 'Inshallah'.",
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const brandSlug = url.searchParams.get("brand") ?? "citroen-ma";
  const localeParam = url.searchParams.get("locale");
  const voice = url.searchParams.get("voice") === "1";

  let brand: BrandContext = CITROEN_FALLBACK;
  let customBody: string | undefined;
  let voiceName = "Zephyr";

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const ctx = await getBrandContext(brandSlug);
      if (ctx) {
        brand = toAgentContext(ctx);
        customBody = ctx.activePrompt?.body ?? undefined;
        voiceName = ctx.brand.voice_name;
      }
    } catch (err) {
      console.warn("[system-prompt] brand load failed:", (err as Error).message.slice(0, 100));
    }
  }

  const locale = mapLocale(localeParam, brand.market);
  const baseSystem = buildSystemPrompt({ locale, brand, customBody });

  const voiceSuffix = voice
    ? `

VOICE MODE — YOU ARE ON A LIVE PHONE CALL:
${LANG_REMINDER[locale]}

SPEECH RULES:
- NO markdown, asterisks, emojis, bullet lists. Plain spoken words only.
- 1 to 2 short sentences per turn. Like a real phone call.
- Say one natural sentence BEFORE each tool call. Never expose parameter names.
- Repeat phone numbers back digit by digit to confirm before booking.
- Spell numbers and prices in words.

CALL BEHAVIOR:
- YOU speak FIRST. Open with: "${OPENING_BY_LOCALE[locale](brand.brandName, brand.agentName)}"
- Follow the qualification flow strictly. One question per turn.
- Never invent prices, specs, availability, financing rates, or discounts. Only use the catalog above.

ENDING THE CALL — ABSOLUTE RULE:
You MUST call end_call() the moment the user signals they're done — or right after a successful booking + farewell. Trigger words (case-insensitive, partial match):
  • EN: "bye", "goodbye", "thanks", "thank you", "i'm done", "that's all", "talk later", "no thanks"
  • FR: "au revoir", "merci", "à bientôt", "salut", "bonne journée", "non merci", "c'est bon"
  • AR/Darija: "شكرا", "شكراً", "بسلامة", "في أمان الله", "مع السلامة", "يالله", "يالاه", "صافي", "خلاص", "تمام", "بزاف", "مع السلامة"
  • Saudi: "تسلم", "الله يعطيك العافية", "وداعاً"

When ending: ONE short farewell sentence in the user's language, then IMMEDIATELY call end_call(). DO NOT continue. DO NOT ask another question after a farewell. DO NOT say "anything else?" — just end.`
    : "";

  return Response.json({
    systemPrompt: baseSystem + voiceSuffix,
    opening: OPENING_BY_LOCALE[locale](brand.brandName, brand.agentName),
    voiceName,
    brand: { slug: brand.brandSlug, name: brand.brandName, agentName: brand.agentName },
    locale,
  });
}
