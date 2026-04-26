/**
 * Seed ~150 synthetic conversations across the 3 brands so the analytics dash
 * has realistic numbers during the demo. Realistic funnel drop-offs:
 *   - 100% reach usage
 *   - ~80% reach budget
 *   - ~70% reach recommendation
 *   - ~50% provide name
 *   - ~35% provide phone
 *   - ~30% provide city
 *   - ~25% provide slot
 *   - ~22% book a test drive (lead conversion)
 *   - 10% abandon mid-call
 *
 * Usage: pnpm tsx scripts/seed-synthetic.ts
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Brand = { id: string; slug: string; locales: string[] };
type Model = { id: string; brand_id: string; slug: string; name: string; price_from: number | null };

const PER_BRAND = 50;

const FIRST_NAMES_MA = ["Youssef", "Aymane", "Salma", "Karim", "Nada", "Mehdi", "Sara", "Hamza", "Khadija", "Reda", "Fatima", "Othmane", "Yasmine", "Rania", "Ilyas", "Zineb"];
const FIRST_NAMES_SA = ["Mohammed", "Khalid", "Abdullah", "Fahad", "Sultan", "Noura", "Reem", "Lina", "Yara", "Saud", "Faisal", "Layla", "Hessa", "Hamad", "Salem"];
const CITIES_MA = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Fès", "Agadir", "Mohammedia", "Salé", "Kenitra"];
const CITIES_SA = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar", "Tabuk", "Taif"];
const SLOTS = ["samedi matin", "samedi après-midi", "dimanche matin", "lundi soir", "vendredi après-midi", "Saturday morning", "Sunday afternoon", "weekday evening"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function chance(p: number): boolean { return Math.random() < p; }
function maPhone(): string {
  return `06${Math.floor(10000000 + Math.random() * 89999999)}`;
}
function saPhone(): string {
  return `+9665${Math.floor(10000000 + Math.random() * 89999999)}`;
}
function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 3600 * 1000 + Math.random() * 24 * 3600 * 1000).toISOString();
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  const supa: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });

  const { data: brandsData } = await supa.from("brands").select("id, slug, locales");
  const brands = (brandsData as unknown as Brand[]) ?? [];
  if (brands.length === 0) {
    console.error("No brands. Run seed-supabase.ts first.");
    process.exit(1);
  }

  const { data: modelsData } = await supa.from("models").select("id, brand_id, slug, name, price_from");
  const models = (modelsData as unknown as Model[]) ?? [];

  for (const brand of brands) {
    const brandModels = models.filter((m) => m.brand_id === brand.id);
    if (brandModels.length === 0) continue;
    const isSA = brand.slug.endsWith("-ksa");
    console.log(`\n=== Generating ${PER_BRAND} conversations for ${brand.slug} ===`);

    for (let i = 0; i < PER_BRAND; i++) {
      const startedAt = daysAgo(Math.random() * 30);
      const channel = chance(0.4) ? "voice" : "chat";
      const locale = pick(brand.locales);
      const targetModel = pick(brandModels);
      const firstName = pick(isSA ? FIRST_NAMES_SA : FIRST_NAMES_MA);
      const city = pick(isSA ? CITIES_SA : CITIES_MA);
      const phone = isSA ? saPhone() : maPhone();
      const slot = pick(SLOTS);

      // Decide how far the conversation got.
      const stage = (() => {
        const r = Math.random();
        if (r < 0.10) return "abandoned";  // walked away
        if (r < 0.20) return "no-budget";  // 10% drop after usage
        if (r < 0.30) return "no-rec";     // 10% drop after budget
        if (r < 0.50) return "no-name";    // 20% drop at name ask
        if (r < 0.65) return "no-phone";   // 15% drop at phone ask
        if (r < 0.70) return "no-city";    // 5% drop at city ask
        if (r < 0.78) return "no-slot";    // 8% drop at slot ask
        return "booked";                   // 22% book
      })();

      const checkpoints: Record<string, string | null> = {
        reached_usage: null,
        reached_budget: null,
        reached_recommendation: null,
        captured_name: null,
        captured_phone: null,
        captured_city: null,
        captured_slot: null,
        booked_test_drive: null,
      };

      // Stage 1+: usage reached
      const ts = (offsetSec: number) => new Date(new Date(startedAt).getTime() + offsetSec * 1000).toISOString();
      checkpoints.reached_usage = ts(20);
      if (stage !== "abandoned" && stage !== "no-budget") checkpoints.reached_budget = ts(50);
      if (stage !== "abandoned" && stage !== "no-budget" && stage !== "no-rec") checkpoints.reached_recommendation = ts(85);
      if (["no-phone", "no-city", "no-slot", "booked"].includes(stage)) checkpoints.captured_name = ts(110);
      if (["no-city", "no-slot", "booked"].includes(stage)) checkpoints.captured_phone = ts(140);
      if (["no-slot", "booked"].includes(stage)) checkpoints.captured_city = ts(165);
      if (stage === "booked") {
        checkpoints.captured_slot = ts(190);
        checkpoints.booked_test_drive = ts(220);
      }

      const status = stage === "booked" ? "closed_lead" : stage === "abandoned" ? "abandoned" : "closed_no_lead";
      const endedAt = stage === "booked" ? ts(245) : stage === "abandoned" ? ts(45 + Math.random() * 60) : ts(120 + Math.random() * 180);

      const { data: convRow } = await (supa.from("conversations") as any)
        .insert({
          brand_id: brand.id,
          locale,
          channel,
          status,
          started_at: startedAt,
          ended_at: endedAt,
          ...checkpoints,
          lead_name: stage === "booked" ? firstName : null,
          lead_phone: stage === "booked" ? phone : null,
          lead_city: stage === "booked" ? city : null,
          lead_slot: stage === "booked" ? slot : null,
          lead_model_slug: stage === "booked" ? targetModel.slug : null,
        })
        .select("id")
        .single();
      const convId = (convRow as { id?: string } | null)?.id;
      if (!convId) continue;

      // Insert a couple of synthetic transcript messages — just enough to make
      // the conversation detail page look real.
      const turns: Array<{ role: "user" | "assistant"; content: string }> = [
        { role: "assistant", content: greetingFor(locale) },
        { role: "user", content: usageReplyFor(locale) },
      ];
      if (checkpoints.reached_budget) {
        turns.push({ role: "assistant", content: budgetQuestion(locale) });
        turns.push({ role: "user", content: budgetReply(locale) });
      }
      if (checkpoints.reached_recommendation) {
        turns.push({ role: "assistant", content: recommendation(locale, targetModel.name, targetModel.price_from) });
      }
      if (checkpoints.captured_name) turns.push({ role: "assistant", content: askName(locale) }, { role: "user", content: firstName });
      if (checkpoints.captured_phone) turns.push({ role: "assistant", content: askPhone(locale, firstName) }, { role: "user", content: phone });
      if (checkpoints.captured_city) turns.push({ role: "assistant", content: askCity(locale) }, { role: "user", content: city });
      if (checkpoints.captured_slot) turns.push({ role: "assistant", content: askSlot(locale) }, { role: "user", content: slot });
      if (checkpoints.booked_test_drive) {
        turns.push({ role: "assistant", content: confirmBooking(locale, firstName) });
      }

      const messageRows = turns.map((t, idx) => ({
        conversation_id: convId,
        role: t.role,
        kind: "text",
        content: t.content,
        created_at: ts(15 + idx * 25),
      }));
      if (messageRows.length > 0) {
        await (supa.from("messages") as any).insert(messageRows);
      }

      // Lead row for booked conversations
      if (stage === "booked") {
        await (supa.from("leads") as any).insert({
          brand_id: brand.id,
          conversation_id: convId,
          model_slug: targetModel.slug,
          first_name: firstName,
          phone,
          city,
          preferred_slot: slot,
          status: "new",
          created_at: endedAt,
        });
        await (supa.from("tool_calls") as any).insert({
          conversation_id: convId,
          name: "book_test_drive",
          input: { slug: targetModel.slug, firstName, phone, city, preferredSlot: slot },
          succeeded: true,
          created_at: ts(220),
        });
      }
    }
    console.log(`  ✓ ${PER_BRAND} conversations`);
  }
  console.log("\nDone.");
}

// ─── Locale-aware fillers (terse — for demo only) ────────────────────────────

function greetingFor(loc: string): string {
  if (loc.startsWith("ar")) return "أهلاً وسهلاً ! هل تبحثون عن سيارة للمدينة، للعائلة، أم لاستخدام محدد ؟";
  if (loc === "darija-MA") return "مرحبا بيك ! كتقلب على طوموبيل للمدينة، للعائلة، ولا لاستعمال معين ؟";
  if (loc.startsWith("en")) return "Hello! Are you looking for a car for the city, the family, or a specific use?";
  return "Bonjour ! Vous cherchez une voiture pour la ville, la famille, ou un usage précis ?";
}
function usageReplyFor(loc: string): string {
  if (loc.startsWith("ar")) return "للعائلة، خمسة أشخاص.";
  if (loc === "darija-MA") return "للعائلة ديالي، خمسة أفراد.";
  if (loc.startsWith("en")) return "For the family, we're 5.";
  return "Pour la famille, on est 5.";
}
function budgetQuestion(loc: string): string {
  if (loc.startsWith("ar")) return "ممتاز. ما هو ميزانيتكم الشهرية المريحة ؟";
  if (loc === "darija-MA") return "زوين. شحال هو الميزانية الشهرية اللي مرتاح بيها ؟";
  if (loc.startsWith("en")) return "Got it. What monthly budget would feel comfortable?";
  return "Parfait. Côté budget, vous avez une idée de la mensualité confortable ?";
}
function budgetReply(loc: string): string {
  if (loc.startsWith("ar")) return "حوالي ٤٠٠٠ شهرياً.";
  if (loc === "darija-MA") return "تقريباً ٤٠٠٠ ف الشهر.";
  if (loc.startsWith("en")) return "Around 4000 a month.";
  return "Autour de 4000 par mois.";
}
function recommendation(loc: string, name: string, price: number | null): string {
  const p = price ? `à partir de ${price.toLocaleString()}` : "";
  if (loc.startsWith("ar")) return `بالنسبة لكم، ${name} هو الخيار الأمثل. ${p}. أعرض لكم الصورة.`;
  if (loc === "darija-MA") return `ليكم، ${name} هو الأنسب. ${p}. غادي نوريك الصورة.`;
  if (loc.startsWith("en")) return `For you, the ${name} is the right pick. ${p}. Let me show you.`;
  return `Pour vous, c'est le ${name}. ${p}. Je vous montre.`;
}
function askName(loc: string): string {
  if (loc.startsWith("ar")) return "ما اسمكم الكريم ؟";
  if (loc === "darija-MA") return "أشنو سميتك ؟";
  if (loc.startsWith("en")) return "Your first name?";
  return "Votre prénom ?";
}
function askPhone(loc: string, n: string): string {
  if (loc.startsWith("ar")) return `شكراً ${n}. رقم الجوال للتأكيد ؟`;
  if (loc === "darija-MA") return `شكراً ${n}. رقم الهاتف للتأكيد ؟`;
  if (loc.startsWith("en")) return `Thanks ${n}. Mobile number for confirmation?`;
  return `Merci ${n}. Un numéro mobile pour la confirmation ?`;
}
function askCity(loc: string): string {
  if (loc.startsWith("ar")) return "في أي مدينة أنتم ؟";
  if (loc === "darija-MA") return "ف أي مدينة كنتي ؟";
  if (loc.startsWith("en")) return "Which city are you in?";
  return "Vous êtes sur quelle ville ?";
}
function askSlot(loc: string): string {
  if (loc.startsWith("ar")) return "متى تفضلون الاختبار ؟";
  if (loc === "darija-MA") return "إمتى كتفضل تجي للتجربة ؟";
  if (loc.startsWith("en")) return "Weekend or weekday for the test drive?";
  return "Vous préférez en semaine ou le weekend ?";
}
function confirmBooking(loc: string, n: string): string {
  if (loc.startsWith("ar")) return `تم ${n} ! المعرض سيتصل بكم في الساعتين القادمتين. شكراً.`;
  if (loc === "darija-MA") return `تم ${n} ! المعرض غادي يتصل بيك ف الساعتين الجاية. شكراً.`;
  if (loc.startsWith("en")) return `Done ${n}! The dealer will call you in the next 2 hours. Thanks.`;
  return `C'est bon ${n} ! Le concessionnaire vous appelle dans les 2 heures. Merci.`;
}

main().catch((e) => { console.error(e); process.exit(1); });
