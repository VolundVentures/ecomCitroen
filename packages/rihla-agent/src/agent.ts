import Anthropic from "@anthropic-ai/sdk";
import { RIHLA_MODELS } from "./models";
import { buildSystemPrompt, type SystemPromptInput } from "./prompt";

export type RihlaMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RihlaStreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_use"; name: string; input: unknown }
  | { type: "done" };

export type RihlaRequest = {
  messages: RihlaMessage[];
  context: SystemPromptInput;
};

export function createRihlaClient(apiKey = process.env.ANTHROPIC_API_KEY) {
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY missing. Set it in .env.local before calling Rihla."
    );
  }
  return new Anthropic({ apiKey });
}

export async function* streamRihlaResponse(
  client: Anthropic,
  request: RihlaRequest
): AsyncGenerator<RihlaStreamEvent> {
  const stream = client.messages.stream({
    model: RIHLA_MODELS.primary,
    max_tokens: 1024,
    system: buildSystemPrompt(request.context),
    messages: request.messages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield { type: "text", delta: event.delta.text };
    }
  }
  yield { type: "done" };
}
