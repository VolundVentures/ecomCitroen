// Conversation + message + tool-call + event persistence to Supabase.
// All functions are best-effort — a Supabase outage must not break the agent.

import { adminClient } from "@/lib/supabase/admin";
import type {
  Conversation,
  Channel,
  ConversationStatus,
  ImageCardPayload,
  Locale,
  ToolUsePayload,
} from "@/lib/supabase/database.types";

function client() {
  try {
    return adminClient();
  } catch {
    return null;
  }
}

/** Create a conversation row. Returns the new row id, or null on failure. */
export async function createConversation(args: {
  brandSlug: string;
  promptId?: string | null;
  locale: Locale;
  channel: Channel;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<string | null> {
  const supa = client();
  if (!supa) return null;
  try {
    const { data: brandRow } = await supa.from("brands").select("id").eq("slug", args.brandSlug).single();
    const brandId = (brandRow as unknown as { id?: string } | null)?.id;
    if (!brandId) return null;
    const { data, error } = await (supa.from("conversations") as any)
      .insert({
        brand_id: brandId,
        prompt_id: args.promptId ?? null,
        locale: args.locale,
        channel: args.channel,
        ip_country: args.ip ?? null,
        user_agent: args.userAgent ?? null,
        status: "open",
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return (data as { id: string }).id;
  } catch (err) {
    console.warn("[persistence] createConversation failed:", (err as Error).message.slice(0, 100));
    return null;
  }
}

export async function appendUserMessage(conversationId: string, text: string): Promise<void> {
  const supa = client();
  if (!supa) return;
  try {
    await (supa.from("messages") as any).insert({
      conversation_id: conversationId,
      role: "user",
      kind: "text",
      content: text,
    });
  } catch { /* swallow */ }
}

export async function appendAssistantMessage(conversationId: string, text: string): Promise<void> {
  if (!text) return;
  const supa = client();
  if (!supa) return;
  try {
    await (supa.from("messages") as any).insert({
      conversation_id: conversationId,
      role: "assistant",
      kind: "text",
      content: text,
    });
  } catch { /* swallow */ }
}

export async function appendImageCard(conversationId: string, payload: ImageCardPayload): Promise<void> {
  const supa = client();
  if (!supa) return;
  try {
    await (supa.from("messages") as any).insert({
      conversation_id: conversationId,
      role: "assistant",
      kind: "image_card",
      content: payload.caption ?? null,
      payload,
    });
  } catch { /* swallow */ }
}

export async function recordToolCall(args: {
  conversationId: string;
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
  succeeded?: boolean;
}): Promise<void> {
  const supa = client();
  if (!supa) return;
  try {
    const { data: msg } = await (supa.from("messages") as any)
      .insert({
        conversation_id: args.conversationId,
        role: "assistant",
        kind: "tool_use",
        payload: { name: args.name, input: args.input, output: args.result } as ToolUsePayload,
      })
      .select("id")
      .single();
    await (supa.from("tool_calls") as any).insert({
      conversation_id: args.conversationId,
      message_id: (msg as unknown as { id?: string } | null)?.id ?? null,
      name: args.name,
      input: args.input,
      result: args.result ?? null,
      succeeded: args.succeeded ?? null,
    });
  } catch { /* swallow */ }
}

export async function recordEvent(args: {
  conversationId?: string | null;
  brandSlug?: string;
  name: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const supa = client();
  if (!supa) return;
  try {
    let brandId: string | null = null;
    if (args.brandSlug) {
      const { data } = await supa.from("brands").select("id").eq("slug", args.brandSlug).single();
      brandId = (data as unknown as { id?: string } | null)?.id ?? null;
    }
    await (supa.from("events") as any).insert({
      conversation_id: args.conversationId ?? null,
      brand_id: brandId,
      name: args.name,
      payload: args.payload ?? {},
    });
  } catch { /* swallow */ }
}

/**
 * Detect funnel checkpoint progress from a fresh user/assistant turn and stamp
 * the corresponding column on the conversation row. Cheap heuristics — good
 * enough for analytics, not used for any control-flow decisions.
 */
export async function updateFunnelCheckpoints(args: {
  conversationId: string;
  userText: string;
  assistantText: string;
}): Promise<void> {
  const supa = client();
  if (!supa) return;
  const u = args.userText.toLowerCase();
  const a = args.assistantText.toLowerCase();
  const updates: Partial<Conversation> = {};
  // Usage answered → first user message after greeting typically mentions city/family/work.
  if (/famille|enfant|ville|usage|trajet|بغيت|للعائلة|للمدينة|family|city|kids|commute/.test(u)) {
    updates.reached_usage = new Date().toISOString();
  }
  // Budget mentioned in user message
  if (/\d{3,}.*(mad|dh|sar|riyal|dirham)|mensualité|monthly|budget|ميزانية|شهري/.test(u)) {
    updates.reached_budget = new Date().toISOString();
  }
  // Recommendation given by assistant (mentions a model name and price)
  if (/\d{3,}\s*(mad|dh|sar|dhs|dirham|riyal)/.test(a)) {
    updates.reached_recommendation = new Date().toISOString();
  }
  if (Object.keys(updates).length === 0) return;
  try {
    await (supa.from("conversations") as any).update(updates).eq("id", args.conversationId);
  } catch { /* swallow */ }
}

export async function captureLeadFromBooking(args: {
  conversationId: string;
  brandSlug: string;
  modelSlug: string;
  firstName: string;
  phone: string;
  city?: string;
  preferredSlot?: string;
  showroomName?: string;
  notes?: string;
}): Promise<void> {
  const supa = client();
  if (!supa) return;
  try {
    const { data: brandRow } = await supa.from("brands").select("id").eq("slug", args.brandSlug).single();
    const brandId = (brandRow as unknown as { id?: string } | null)?.id;
    if (!brandId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leadRow: any = {
      brand_id: brandId,
      conversation_id: args.conversationId,
      model_slug: args.modelSlug,
      first_name: args.firstName,
      phone: args.phone,
      city: args.city ?? null,
      preferred_slot: args.preferredSlot ?? null,
      status: "new",
    };
    if (args.showroomName) leadRow.showroom_name = args.showroomName;
    if (args.notes) leadRow.notes = args.notes;
    await (supa.from("leads") as any).insert(leadRow);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convUpdate: any = {
      status: "closed_lead",
      booked_test_drive: new Date().toISOString(),
      captured_name: new Date().toISOString(),
      captured_phone: new Date().toISOString(),
      captured_city: args.city ? new Date().toISOString() : null,
      captured_slot: args.preferredSlot ? new Date().toISOString() : null,
      lead_name: args.firstName,
      lead_phone: args.phone,
      lead_city: args.city ?? null,
      lead_slot: args.preferredSlot ?? null,
      lead_model_slug: args.modelSlug,
      ended_at: new Date().toISOString(),
    };
    if (args.showroomName) convUpdate.lead_showroom = args.showroomName;
    await (supa.from("conversations") as any).update(convUpdate).eq("id", args.conversationId);
  } catch { /* swallow */ }
}

export async function closeConversation(
  conversationId: string,
  status: ConversationStatus = "closed_no_lead"
): Promise<void> {
  const supa = client();
  if (!supa) return;
  try {
    // Don't downgrade an already-closed_lead conversation: read first.
    const { data } = await supa.from("conversations").select("status").eq("id", conversationId).single();
    const current = (data as unknown as { status?: ConversationStatus } | null)?.status;
    if (current === "closed_lead") return;
    await (supa.from("conversations") as any)
      .update({ status, ended_at: new Date().toISOString() })
      .eq("id", conversationId);
  } catch { /* swallow */ }
}
