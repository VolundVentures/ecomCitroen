export const MOROCCAN_BACKDROPS = {
  "marrakech-medina":
    "the narrow terracotta-walled streets of the Marrakech medina at golden hour, warm sunset light, vibrant spice-market energy, shallow depth of field",
  "casa-corniche":
    "the Casablanca Corniche at dusk with the Atlantic ocean and palm trees, cinematic lighting, wet coastal road reflections",
  "essaouira-beach":
    "a windswept Essaouira beach with the medina walls in the background, soft blue overcast ocean light, gulls overhead",
  chefchaouen:
    "a cobblestone street in the blue city of Chefchaouen, blue-washed buildings on both sides, morning sunlight, Moroccan warmth",
  "atlas-mountains":
    "a mountain road switchback in the High Atlas with snow-dusted peaks and clear blue sky, dry dust, dramatic",
  "rabat-medina":
    "an archway in the Rabat medina framing the view toward the Kasbah of the Udayas, late afternoon sun, calm",
} as const;

export type BackdropKey = keyof typeof MOROCCAN_BACKDROPS;

export function describeBackdrop(key: BackdropKey): string {
  return MOROCCAN_BACKDROPS[key];
}
