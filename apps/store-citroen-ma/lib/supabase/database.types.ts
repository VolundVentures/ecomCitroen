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
  lead_showroom: string | null;
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
  seq: number;
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
  showroom_name: string | null;
  notes: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

export type AppointmentStatus =
  | "new"
  | "qualified"
  | "assigned"
  | "confirmed"
  | "completed"
  | "cancelled";

export type InterventionType = "mechanical" | "bodywork";
export type AppointmentSlot = "morning" | "afternoon";

export type ServiceAppointment = {
  id: string;
  brand_id: string;
  conversation_id: string | null;
  ref_number: string;
  full_name: string;
  phone: string;
  email: string;
  vehicle_brand: string;
  vehicle_model: string;
  vin: string;
  intervention_type: InterventionType;
  city: string;
  preferred_date: string;       // ISO yyyy-mm-dd
  preferred_slot: AppointmentSlot;
  comment: string | null;
  cndp_consent_at: string;
  source: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplaintStatus =
  | "new"
  | "qualified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed_no_resolution";

export type Complaint = {
  id: string;
  brand_id: string;
  conversation_id: string | null;
  ref_number: string;
  full_name: string;
  phone: string;
  email: string;
  vehicle_brand: string;
  vehicle_model: string;
  vin: string;
  intervention_type: InterventionType;
  site: string;
  service_date: string | null;
  reason: string;
  attachment_url: string | null;
  cndp_consent_at: string;
  source: string;
  status: ComplaintStatus;
  crc_notes: string | null;
  created_at: string;
  updated_at: string;
};

/* ─────────────────── Knowledge Bases (RAG — Phase 1) ─────────────────── */

export type KbSourceType = "file" | "url" | "text";
export type KbDocStatus = "pending" | "processing" | "ready" | "failed";

export type KnowledgeBase = {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  /** Number of chunks retrieved per query (Phase 3). */
  top_k: number;
  /** Max characters per chunk (Phase 2). */
  chunk_size: number;
  /** Overlapping characters between adjacent chunks (Phase 2). */
  chunk_overlap: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type KnowledgeDocument = {
  id: string;
  kb_id: string;
  name: string;
  source_type: KbSourceType;
  /** Path inside the `knowledge-base` Storage bucket — set when source_type='file'. */
  storage_path: string | null;
  /** External URL — set when source_type='url'. */
  source_url: string | null;
  mime_type: string | null;
  size_bytes: number;
  /** Extracted plain text used for chunking + retrieval. */
  raw_text: string | null;
  status: KbDocStatus;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** Aggregate stats joined onto a KnowledgeBase row for the admin list view. */
export type KnowledgeBaseSummary = KnowledgeBase & {
  document_count: number;
  total_size_bytes: number;
  chunk_count: number;
};

/* ─────────────────── Knowledge Chunks (RAG — Phase 2) ─────────────────── */

export type KnowledgeChunk = {
  id: string;
  document_id: string;
  kb_id: string;
  chunk_index: number;
  content: string;
  /** 768-dim Gemini embedding. Null until the embed pass completes. */
  embedding: number[] | null;
  tokens: number;
  created_at: string;
};

/** A KnowledgeDocument augmented with chunk-pipeline stats — used by the
 *  admin UI to show "12 chunks · 4 200 tokens" next to each row. */
export type KnowledgeDocumentWithChunks = KnowledgeDocument & {
  chunk_count: number;
  chunk_tokens: number;
};

/** Result row of the `match_brand_chunks` / `match_kb_chunks` RPCs. */
export type RetrievedChunk = {
  id: string;
  document_id: string;
  document_name: string;
  kb_id?: string;
  kb_name?: string;
  chunk_index: number;
  content: string;
  similarity: number;
};
