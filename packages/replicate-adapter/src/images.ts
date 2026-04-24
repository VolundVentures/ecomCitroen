import Replicate from "replicate";
import { REPLICATE_MODELS } from "./models";
import { describeBackdrop, type BackdropKey } from "./backdrops";

export type CarImageInput = {
  modelName: string;
  trimName: string;
  colorName: string;
  colorHex: string;
  wheels?: string;
  backdrop: BackdropKey | "user-upload";
  userImageUrl?: string;
};

export type CarImageResult =
  | { ok: true; url: string; modelId: string }
  | { ok: false; error: string };

export function getReplicateClient(apiToken = process.env.REPLICATE_API_TOKEN) {
  if (!apiToken) {
    throw new Error(
      "REPLICATE_API_TOKEN missing. Set it in .env.local before calling Replicate."
    );
  }
  return new Replicate({ auth: apiToken });
}

function buildPrompt(input: CarImageInput): string {
  const scene =
    input.backdrop === "user-upload"
      ? "the exact location captured in the reference image, matching its lighting, perspective, and mood"
      : describeBackdrop(input.backdrop);

  return [
    `Photorealistic automotive editorial photograph of a ${input.colorName} (${input.colorHex}) Citroën ${input.modelName} ${input.trimName}, parked in ${scene}.`,
    input.wheels ? `Wheels: ${input.wheels}.` : "",
    "Shot on 50mm lens, natural ambient light matching the scene, crisp reflections, realistic tire contact shadows, no text, no logos added, no people unless subtle in background.",
    "Composition: 3/4 front angle unless the backdrop calls for side profile.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateCarImage(
  client: Replicate,
  input: CarImageInput
): Promise<CarImageResult> {
  try {
    const prompt = buildPrompt(input);
    const modelId = REPLICATE_MODELS.image;
    const output = await client.run(modelId, {
      input: {
        prompt,
        aspect_ratio: "16:9",
        output_format: "webp",
        ...(input.backdrop === "user-upload" && input.userImageUrl
          ? { image_input: [input.userImageUrl] }
          : {}),
      },
    });

    const url = Array.isArray(output)
      ? typeof output[0] === "string"
        ? (output[0] as string)
        : null
      : typeof output === "string"
        ? output
        : null;

    if (!url) {
      return { ok: false, error: "Replicate returned no image URL" };
    }
    return { ok: true, url, modelId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
