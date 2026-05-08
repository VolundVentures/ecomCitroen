// Append a transcript chunk or tool call to a voice conversation. Best-effort.

import { NextRequest } from "next/server";
import {
  appendUserMessage,
  appendAssistantMessage,
  recordToolCall,
  captureLeadFromBooking,
  closeConversation,
} from "@/lib/persistence";
import { persistAppointment, persistComplaint } from "@/lib/apv-persistence";

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
    console.log(
      `[voice/tool] ${body.name} brand=${body.brandSlug} conv=${body.conversationId} keys=${Object.keys(body.input).join(",")}`
    );

    await recordToolCall({
      conversationId: body.conversationId,
      name: body.name,
      input: body.input,
      succeeded: true,
    });

    if (body.name === "book_test_drive" || body.name === "book_showroom_visit") {
      const i = body.input;
      if (typeof i.firstName === "string" && typeof i.phone === "string") {
        // book_showroom_visit may not carry a model slug (the customer is
        // visiting the maison, not necessarily a specific car) — pass empty
        // string in that case rather than refusing to sync.
        const modelSlug = typeof i.slug === "string" ? i.slug : "";
        const kindNote = body.name === "book_showroom_visit" ? "kind: showroom-visit" : undefined;
        console.log(
          `[voice/tool] ${body.name} → captureLeadFromBooking firstName=${i.firstName} model=${modelSlug || "-"}`
        );
        await captureLeadFromBooking({
          conversationId: body.conversationId,
          brandSlug: body.brandSlug,
          modelSlug,
          firstName: i.firstName,
          phone: i.phone,
          city: typeof i.city === "string" ? i.city : undefined,
          preferredSlot: typeof i.preferredSlot === "string" ? i.preferredSlot : undefined,
          showroomName: typeof i.showroomName === "string" ? i.showroomName : undefined,
          notes: kindNote,
        });
      } else {
        console.warn(
          `[voice/tool] ${body.name} skipped — missing firstName or phone (got keys=${Object.keys(i).join(",")})`
        );
      }
    } else if (body.name === "book_service_appointment") {
      const result = await persistAppointment({
        brandSlug: body.brandSlug,
        conversationId: body.conversationId,
        input: body.input,
      });
      console.log(
        `[voice/tool] book_service_appointment ok=${result.ok} ref=${result.refNumber} warnings=${result.warnings.join("|") || "-"}`
      );
      // We deliberately do NOT return `warnings` to the voice model — these
      // are backend validation flags (e.g. "vin-format: too-long") meant for
      // the dealer back-office, NOT for the customer. The model was reading
      // them as a failure and announcing an error to a customer whose case
      // had actually been created successfully.
      return Response.json({
        ok: true,
        refNumber: result.refNumber,
        message: `Appointment saved. Reference: ${result.refNumber}.`,
      });
    } else if (body.name === "submit_complaint") {
      const result = await persistComplaint({
        brandSlug: body.brandSlug,
        conversationId: body.conversationId,
        input: body.input,
      });
      console.log(
        `[voice/tool] submit_complaint ok=${result.ok} ref=${result.refNumber} warnings=${result.warnings.join("|") || "-"}`
      );
      return Response.json({
        ok: true,
        refNumber: result.refNumber,
        message: `Complaint saved. Reference: ${result.refNumber}.`,
      });
    }
  } else if (body.kind === "end") {
    await closeConversation(body.conversationId, "closed_no_lead");
  }

  return Response.json({ ok: true });
}
