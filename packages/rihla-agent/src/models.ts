export const RIHLA_MODELS = {
  primary: "claude-sonnet-4-6",
  offlineEval: "claude-opus-4-6",
} as const;

export type RihlaModel = (typeof RIHLA_MODELS)[keyof typeof RIHLA_MODELS];
