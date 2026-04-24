export const REPLICATE_MODELS = {
  image: "google/nano-banana-pro",
  video: "kwaivgi/kling-v3-omni",
  threeD: "tencent/hunyuan-3d-3.1",
} as const;

export type ReplicateModelKey = keyof typeof REPLICATE_MODELS;
