import { NextRequest, NextResponse } from "next/server";
import {
  getReplicateClient,
  generateCarImage,
  MOROCCAN_BACKDROPS,
  type BackdropKey,
} from "@citroen-store/replicate-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type GenerateImageRequest = {
  modelName: string;
  trimName: string;
  colorName: string;
  colorHex: string;
  wheels?: string;
  backdrop: BackdropKey | "user-upload";
  userImageUrl?: string;
};

export async function POST(req: NextRequest) {
  let body: GenerateImageRequest;
  try {
    body = (await req.json()) as GenerateImageRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    body.backdrop !== "user-upload" &&
    !(body.backdrop in MOROCCAN_BACKDROPS)
  ) {
    return NextResponse.json(
      { error: `Unknown backdrop: ${body.backdrop}` },
      { status: 400 }
    );
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      {
        error:
          "REPLICATE_API_TOKEN not configured. Add it to .env.local to enable image generation.",
        mode: "not-configured",
      },
      { status: 503 }
    );
  }

  try {
    const client = getReplicateClient();
    const result = await generateCarImage(client, body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({
      url: result.url,
      modelId: result.modelId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
