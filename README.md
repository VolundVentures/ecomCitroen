# Citroën Store — AI-native e-commerce

Multi-brand, multi-market e-commerce platform for Stellantis. Morocco is the proof point; global rollout is the goal.

## Structure

```
apps/store-citroen-ma   Next.js 15 storefront for Citroën Maroc
packages/
  ui                    Brand-agnostic UI primitives (Button, Container, Chip)
  brand-citroen         Citroën design tokens + voice/tone config
  market-config         Per-market config (locales, payments, dealers, features)
  atlas-agent           Claude Agent SDK wrapper (Sonnet 4.6 + Opus 4.6)
  configurator-3d       React Three Fiber scene (CAD or Hunyuan 3D 3.1)
```

## Commands

```bash
pnpm install
pnpm dev          # turbo runs all `dev` tasks
pnpm build
pnpm typecheck
```

Dev server: <http://localhost:3000> → redirects to `/fr`. Switch locale via top-right pill.

## Environment

Create `apps/store-citroen-ma/.env.local`:

```
ANTHROPIC_API_KEY=...         # Claude Sonnet 4.6 / Opus 4.6
REPLICATE_API_TOKEN=...       # Nano Banana Pro, Kling V3 Omni, Hunyuan 3D 3.1
DEEPGRAM_API_KEY=...          # STT
GOOGLE_API_KEY=...            # Gemini 3.1 Flash TTS
WHATSAPP_BUSINESS_ID=...
CMI_MERCHANT_ID=...
CMI_STORE_KEY=...
```

No keys → the UI still renders; Atlas chat falls back to a scaffold response.

## Plan

The strategic plan lives at `C:\Users\Zakaria\.claude\plans\vivid-juggling-eclipse.md`.
