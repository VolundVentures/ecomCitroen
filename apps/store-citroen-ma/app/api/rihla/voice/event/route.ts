// Append a transcript chunk or tool call to a voice conversation. Best-effort.

import { NextRequest } from "next/server";
import {
  appendUserMessage,
  appendAssistantMessage,
  recordToolCall,
  captureLeadFromBooking,
  closeConversation,
} from "@/lib/persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventBody =
  | { conversationId: string; kind: "user_text"; text: string }
  | { conversationId: string; kind: "assistant_text"; text: string }
  | {
      conversationId: string;
      kind: "tool_call";
      brandSlug: string;
      name: string;
      input: Record<string, unknown>;
    }
  | { conversationId: string; kind: "end" };

export async function POST(req: NextRequest) {
  const body = (await req.json()) as EventBody;
  if (!body?.conversationId) return Response.json({ ok: false }, { status: 400 });

  if (body.kind === "user_text" && body.text) {
    await appendUserMessage(body.conversationId, body.text);
  } else if (body.kind === "assistant_text" && body.text) {
    await appendAssistantMessage(body.conversationId, body.text);
  } else if (body.kind === "tool_call") {
    await recordToolCall({
      conversationId: body.conversationId,
      name: body.name,
      input: body.input,
      succeeded: true,
    });
    if (body.name === "book_test_drive") {
      const i = body.input;
      if (typeof i.firstName === "string" && typeof i.phone === "string" && typeof i.slug === "string") {
        await captureLeadFromBooking({
          conversationId: body.conversationId,
          brandSlug: body.brandSlug,
          modelSlug: i.slug,
          firstName: i.firstName,
          phone: i.phone,
          city: typeof i.city === "string" ? i.city : undefined,
          preferredSlot: typeof i.preferredSlot === "string" ? i.preferredSlot : undefined,
        });
      }
    }
  } else if (body.kind === "end") {
    await closeConversation(body.conversationId, "closed_no_lead");
  }

  return Response.json({ ok: true });
}
