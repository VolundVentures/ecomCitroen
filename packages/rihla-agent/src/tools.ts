import { z } from "zod";

export const toolSchemas = {
  getInventory: {
    name: "getInventory",
    description: "List in-stock vehicles matching filters. Use before quoting availability.",
    schema: z.object({
      modelSlug: z.string().optional(),
      trimSlug: z.string().optional(),
      color: z.string().optional(),
      maxPrice: z.number().optional(),
      dealerId: z.string().optional(),
    }),
  },
  configureCar: {
    name: "configureCar",
    description: "Apply a configuration delta (color, wheels, trim, options) to the active 3D scene.",
    schema: z.object({
      modelSlug: z.string(),
      trimSlug: z.string().optional(),
      color: z.string().optional(),
      wheels: z.string().optional(),
      interior: z.string().optional(),
      options: z.array(z.string()).optional(),
    }),
  },
  calculateFinancing: {
    name: "calculateFinancing",
    description: "Calculate monthly payments and TCO for a configured vehicle. Deterministic math; never hallucinate numbers.",
    schema: z.object({
      configId: z.string(),
      downPayment: z.number().nonnegative(),
      monthlyBudget: z.number().positive().optional(),
      termMonths: z.array(z.number().int().positive()).default([36, 48, 60]),
    }),
  },
  bookTestDrive: {
    name: "bookTestDrive",
    description: "Book a test drive at a specific dealer on a specific date/time.",
    schema: z.object({
      dealerId: z.string(),
      modelSlug: z.string(),
      preferredDatetimeISO: z.string(),
      contact: z.object({
        firstName: z.string(),
        lastName: z.string().optional(),
        phone: z.string(),
        email: z.string().email().optional(),
      }),
    }),
  },
  generateImage: {
    name: "generateImage",
    description: "Generate a photorealistic 'car in your life' image — the configured car composited into a Moroccan backdrop or a user-uploaded photo. Do not mention providers or models in the user-visible reply.",
    schema: z.object({
      configId: z.string(),
      backdrop: z.enum([
        "marrakech-medina",
        "casa-corniche",
        "essaouira-beach",
        "chefchaouen",
        "atlas-mountains",
        "rabat-medina",
        "user-upload",
      ]),
      userImageUrl: z.string().url().optional(),
    }),
  },
  generateVideo: {
    name: "generateVideo",
    description: "Generate a 30s personalized cinematic ad — the user's configured car driving a Moroccan route. Delivered async to WhatsApp. Do not mention providers or models in the user-visible reply.",
    schema: z.object({
      configId: z.string(),
      route: z.enum([
        "casa-commute",
        "marrakech-medina",
        "atlas-mountain",
        "coastal-road",
        "custom-prompt",
      ]),
      customPrompt: z.string().optional(),
      narrationLocale: z.enum(["fr-MA", "ar-MA", "en-MA"]).default("fr-MA"),
    }),
  },
  generateBrochurePDF: {
    name: "generateBrochurePDF",
    description: "Generate a bespoke PDF brochure for the user's exact configuration, including financing and nearest dealer.",
    schema: z.object({
      configId: z.string(),
      recipientEmail: z.string().email().optional(),
      recipientWhatsapp: z.string().optional(),
    }),
  },
  handoffToDealer: {
    name: "handoffToDealer",
    description: "Route the lead to the nearest dealer with a drafted briefing. Use when intent is high or user asks for a human.",
    schema: z.object({
      dealerId: z.string(),
      configId: z.string().optional(),
      urgency: z.enum(["hot", "warm", "cold"]).default("warm"),
      notes: z.string(),
    }),
  },
  createBonDeCommande: {
    name: "createBonDeCommande",
    description: "Generate the e-signable bon de commande PDF after the CMI deposit clears.",
    schema: z.object({
      reservationId: z.string(),
    }),
  },
} as const;

export type ToolName = keyof typeof toolSchemas;
