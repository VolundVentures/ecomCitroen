export const RIHLA_MODELS = {
  // Opus 4.7 is the strongest reasoning model available — chat needs the
  // smarter qualification flow, intent detection, and tool-call discipline.
  // Sonnet was visibly weaker: it fired the wrong tool ("show_model_video"
  // on a "test drive" intent) and dead-ended on missing-price questions.
  primary: "claude-opus-4-7",
  offlineEval: "claude-opus-4-7",
} as const;

export type RihlaModel = (typeof RIHLA_MODELS)[keyof typeof RIHLA_MODELS];
