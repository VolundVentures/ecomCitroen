// Hand-rolled Supabase row types matching supabase/migrations/00001_init.sql.
// Replace with generated types (`supabase gen types typescript`) once the
// CLI is wired up locally.

export type Locale = "fr-MA" | "ar-MA" | "darija-MA" | "en-MA" | "ar-SA" | "en-SA";
export type Channel = "chat" | "voice";
export type ConversationStatus = "open" | "closed_lead" | "closed_no_lead" | "abandoned";
export type MessageRole = "user" | "assistant" | "system";
export type MessageKind = "text" | "image_card" | "tool_use";

export type Brand = {
  id: string;
  slug: string;
  name: string;
  homepage_url: string;
  market: string;
  default_currency: string;
  locales: Locale[];
  primary_color: string | null;
  logo_url: string | null;
  voice_name: string;
  agent_name: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Model = {
  id: string;
  brand_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  body_type: string | null;
  price_from: number | null;
  currency: string | null;
  fuel: string | null;
  transmission: string | null;
  seats: number | null;
  hero_image_url: string;
  gallery_images: string[];
  key_features: string[];
  specs: Record<string, string>;
  page_url: string;
  display_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type PromptVersion = {
  id: string;
  brand_id: string;
  version: number;
  body: string;
  is_active: boolean;
  notes: string | null;
  edited_by: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  brand_id: string;
  prompt_id: string | null;
  locale: Locale;
  channel: Channel;
  status: ConversationStatus;
  reached_usage: string | null;
  reached_budget: string | null;
  reached_recommendation: string | null;
  captured_name: string | null;
  captured_phone: string | null;
  captured_city: string | null;
  captured_slot: string | null;
  booked_test_drive: string | null;
  lead_name: string | null;
  lead_phone: string | null;
  lead_city: string | null;
  lead_slot: string | null;
  lead_model_slug: string | null;
  ip_country: string | null;
  user_agent: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

export type ImageCardPayload = {
  imageUrl: string;
  caption?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  modelSlug?: string;
};

export type ToolUsePayload = {
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  kind: MessageKind;
  content: string | null;
  payload: ImageCardPayload | ToolUsePayload | null;
  created_at: string;
};

export type ToolCall = {
  id: string;
  conversation_id: string;
  message_id: string | null;
  name: string;
  input: Record<string, unknown>;
  result: unknown;
  succeeded: boolean | null;
  created_at: string;
};

export type AnalyticsEvent = {
  id: string;
  conversation_id: string | null;
  brand_id: string | null;
  name: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type Lead = {
  id: string;
  brand_id: string;
  conversation_id: string;
  model_slug: string;
  first_name: string;
  phone: string;
  city: string | null;
  preferred_slot: string | null;
  notes: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
};
