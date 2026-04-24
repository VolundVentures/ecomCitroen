# Rihla — AI Sales Consultant for Citroën Maroc

**Stellantis validation brief — End-to-end workflow, capabilities, and technical architecture**

*Prepared by Völund Ventures · April 2026*

---

## 1. Executive summary

Rihla (رحلة — "journey" in Arabic) is a voice-first AI sales consultant embedded in the Citroën Maroc e-commerce platform (store.citroen.ma). She replaces the current form-based reservation flow with a conversational experience that mirrors the best human salesperson — available 24/7, fluent in four languages (Darija, French, Classical Arabic, English), and capable of driving a customer from first hello to refundable deposit in under twelve minutes.

**Why this matters for Stellantis.** Morocco is the proof point. The same architecture — brand-themeable, market-configurable — can be re-deployed for any Stellantis brand (Peugeot, Jeep, DS, Fiat, Opel, Alfa Romeo) in any market (GCC, EU, LATAM) within weeks rather than months. Morocco demonstrates the template; subsequent markets cost 20% of the first.

**Conversion hypothesis.** The current Citroën Maroc site converts 0.3% of sessions into dealer leads. Industry benchmarks for conversational commerce suggest a 3-5× lift on conversational funnels. At even a conservative 1.5% conversion, Rihla represents a 5× lead volume increase for the Citroën Maroc dealer network with zero additional marketing spend.

---

## 2. What Rihla does — customer-visible capabilities

Rihla operates across four primary channels on the Citroën Maroc platform:

### 2.1 Text chat

A persistent chat widget in the bottom-right corner of every page. Users type in Darija (Arabic script), French, Classical Arabic, or English. Rihla responds in kind, code-switching naturally when users mix languages (common in Morocco).

### 2.2 Voice call

A dedicated voice mode accessed via a green phone button. Once activated, the chat panel transforms into a call UI featuring Rihla's avatar with real-time audio visualization — rings pulse blue when she speaks, green when she listens. Users hear Rihla's voice via Gemini 3.1 Flash TTS (the latest Google voice model) with sub-second latency. There is no "press to talk" — it is a continuous bidirectional conversation, indistinguishable from speaking with a human advisor.

### 2.3 UI control

Rihla does not merely advise — she drives the interface. When she recommends a model, the page navigates to that model. When she suggests a colour, the 3D-style configurator updates live. When she computes a monthly payment, the financing simulator fills its fields automatically. The customer never has to click.

### 2.4 End-to-end transaction

Rihla closes the loop. She initiates the reservation, routes the customer to secure Stripe checkout for the refundable deposit, and triggers the post-payment confirmation, complete with appointment scheduling and a branded email invoice.

---

## 3. The complete customer workflow — seven phases

Rihla is built on a consultative-selling framework inspired by the best luxury automotive salespeople in the world. She follows a seven-phase conversation architecture that feels natural to the customer but is highly structured under the hood.

### Phase 1 — Welcome & human connection (2-3 turns)

The goal is to establish rapport before discussing the product. Rihla opens with a warm greeting, asks for the customer's first name, and inquires about their city — not about their budget or their use case. This mirrors how a top salesperson at a flagship dealership would greet a walk-in: handshake first, questions later.

> **Example**
> *Customer:* Bonjour
> *Rihla:* Merhba ! Bienvenue chez Citroën. Moi c'est Rihla. Et vous, c'est comment ?
> *Customer:* Yassine
> *Rihla:* Enchantée Yassine ! Vous êtes d'où au Maroc ?

### Phase 2 — Discovery (2-3 turns)

Rihla moves into consultative discovery. Critically, she asks about the customer's **life**, not their specifications. "Vous êtes combien à monter dedans régulièrement ?" rather than "How many passengers do you need?". Budget is framed as a comfortable monthly payment rather than a sticker price — this is psychologically less intimidating and anchors the conversation on a smaller number.

After each answer, Rihla validates before advancing. This is a core consultative-selling technique: "Ok, famille de cinq avec des enfants en bas âge, je vois très bien le tableau." The customer feels heard.

### Phase 3 — Recommendation (1 turn)

Rihla recommends **one** model, explicitly tied to the customer's stated context. Not a catalogue — one targeted match. She closes this turn with "Je vous le montre ?" and immediately invokes the `open_model` tool, navigating the customer's screen to the product detail page.

> **Example**
> *Rihla:* Pour votre famille de cinq avec ce budget, le Berlingo c'est exactement ce qu'il vous faut. Imaginez : portes coulissantes pour les petits, un coffre où vous mettez poussette ET courses, et tout ça pour moins de 200 000 dirhams. Je vous le montre ?
> *[Page navigates to /models/berlingo]*

### Phase 4 — Projection & configuration (2-4 turns)

This is where emotional attachment is created. Rihla uses sensory language — "Fermez les yeux deux secondes. Vous êtes sur la route de Marrakech, les enfants dorment à l'arrière, la clim tourne..." — and walks the customer through colour and trim selection. Each choice is immediately reflected in the configurator via the `configure_car` tool, so the customer sees their future car transform in real time.

### Phase 5 — Financial anchoring (1-2 turns)

Rihla never leads with the sticker price. She leads with the monthly payment. "Sur 60 mois, ça fait environ 4 200 dirhams par mois — c'est à peu près le prix d'un dîner au restaurant par jour." This technique, well-documented in luxury sales training, transforms a large, intimidating number into a small, digestible one. Rihla invokes `calculate_financing` to compute the exact figure and `open_financing` to show the customer the three-option comparison (Citroën Finance, bank partner, cash).

### Phase 6 — Objection handling

Rihla is trained on five scripted responses to the most common objections:

- **"It is expensive."** → Pivot to monthly. "Sur 60 mois, c'est 4 200 par mois — faisable, non ?"
- **"Dacia is cheaper."** → Acknowledge and reframe. "Vrai, mais sans le confort suspension Citroën et l'hybride, le coût total sur 5 ans est quasiment pareil."
- **"I need to think about it."** → Validate and create soft urgency. "Bien sûr. Je sauvegarde votre config. Par contre, le Rouge Elixir part vite — on en a que trois en stock."
- **"I don't trust online purchases."** → Remove risk. "L'acompte est 100% remboursable tant que vous ne signez pas. Zéro risque."
- **"My spouse needs to see."** → Enable continuity. "Parfait ! On garde tout en mémoire. Votre conjoint peut revenir et retrouver exactement cette config."

### Phase 7 — Natural closing (1 turn)

Rihla never forces a close. When interest signals are clear (repeated questions about delivery, financing, or availability), she proposes: "Si vous voulez sécuriser votre Berlingo, je peux ouvrir la réservation — un petit acompte remboursable, et le concessionnaire vous appelle dans les 2 heures." The `start_reservation` tool is invoked, bringing the customer to the reservation page.

### Phase 8 — Transaction, confirmation, and graceful closure

The customer reviews their configured vehicle on the reservation page, is redirected to Stripe (sandbox mode for the pilot) for the refundable deposit, and upon successful payment lands on a custom confirmation page displaying:

- A unique reference number
- The exact vehicle configuration
- A pre-scheduled visit date and time (next business day window)
- Dealer contact details (name, address, phone)
- A four-step "next steps" checklist
- An automatic branded email invoice sent via Resend

When the customer signals the end of the conversation (says goodbye, thanks, or simply stops), Rihla closes gracefully: "Merci Yassine ! Bonne journée inshallah !" and does not relaunch the conversation. No pushy follow-up.

---

## 4. Technical architecture

### 4.1 AI stack

| Component | Technology | Purpose |
|---|---|---|
| Primary LLM | Google Gemini 2.5 Flash | Conversational reasoning + tool use (text channel) |
| Real-time voice | Google Gemini 3.1 Flash Live Preview | Bidirectional audio streaming (voice calls) |
| Text-to-speech | Google Gemini 3.1 Flash TTS Preview | Voice output (Aoede, female, warm) |
| Fallback LLM | Anthropic Claude Sonnet 4.6 | Automatic failover if Gemini returns 503 |
| Speech-to-text | Gemini Live native STT | In-call voice recognition |
| Image generation | Google Nano Banana Pro (via Replicate) | Generated Moroccan hero imagery, product shots |
| 3D asset generation | Tencent Hunyuan 3D 3.1 (via Replicate) | Mesh generation from product photography |

### 4.2 Architecture

The platform is a Next.js 15 application (React 19, TypeScript strict) deployed on Vercel. It is structured as a Turborepo monorepo with workspace packages:

- `apps/store-citroen-ma` — the consumer-facing application
- `packages/rihla-agent` — Rihla's personality, system prompt, tool schemas
- `packages/brand-citroen` — Citroën-specific design tokens (swappable for other brands)
- `packages/market-config` — Morocco-specific settings (swappable for other markets)
- `packages/ui` — shared UI component library

Rihla's voice calls connect directly from the browser to Google's Gemini Live WebSocket endpoint (`wss://generativelanguage.googleapis.com`) using an ephemeral-token pattern in production. Text chats go through a server-side ND-JSON streaming endpoint at `/api/rihla/chat` which proxies to Gemini or Claude and emits tool-use events to the client.

### 4.3 Tool system

Rihla has six core tools that let her drive the UI:

| Tool | What it does |
|---|---|
| `open_model` | Navigates to a specific model detail page |
| `configure_car` | Updates the live configurator (colour, trim, angle) |
| `calculate_financing` | Computes monthly payment server-side and returns the figure |
| `open_financing` | Navigates to the financing advisor page with pre-filled parameters |
| `start_reservation` | Launches the reservation flow for a specific model |
| `open_dealers` | Opens the dealer locator |

Tool calls are declared in both the Gemini Live session (native `functionDeclarations`) and the standard Gemini chat endpoint. A server-side fast-path intent detector (regex + Arabic keyword matching) emits tool calls deterministically for common phrases ("بدل اللون للحمر" → `configure_car(color='red')`) even before the LLM streams its response — reducing tool-call latency to near-zero for the most common actions.

### 4.4 Languages

Rihla's language layer is built around a first-run language selector offering four options:

- **Français** — Moroccan-accented French, the primary commercial language in Morocco
- **Darija (الدارجة)** — Moroccan Arabic written in Arabic script, using masculine singular form (the neutral form in Moroccan Arabic)
- **العربية الفصحى** — Modern Standard Arabic, for formal preferences
- **English** — For international users

Each selection configures the speech-to-text recognizer language (fr-FR, ar-MA, ar-SA, en-US respectively), so voice input is transcribed in the correct phonology. The system prompt explicitly forbids Egyptian dialect drift (a common failure mode in Arabic LLMs) and mandates masculine singular verb conjugation — the neutral register in Moroccan Arabic.

---

## 5. Performance & latency

### 5.1 Voice call latency

The Gemini Live integration eliminates the traditional three-step pipeline (STT → LLM → TTS) in favour of a single bidirectional audio stream. This yields:

- **First-word latency:** 400-800ms from end of user utterance to start of Rihla's response audio
- **Turn-to-turn latency:** near-zero — as soon as Rihla finishes speaking, the microphone resumes without any handoff
- **Interruption handling:** native — the user can interrupt Rihla mid-sentence and she stops immediately

### 5.2 Text chat streaming

For typed interactions, responses stream in ND-JSON format. The first token typically arrives within 400ms. Tool calls are emitted as first-class events in the stream — the UI can react (navigate, configure, scroll) before the assistant has finished speaking.

### 5.3 Asset generation

All hero and lifestyle imagery on the site is generated by Nano Banana Pro (Google's state-of-the-art image model, released 2026-02). The pipeline composites the actual Citroën studio renders with Moroccan backdrops (Marrakech medina, Atlas mountains, Chefchaouen, Essaouira corniche, Rabat plaza, Casablanca corniche) to create campaign-quality photography at scale, in-brand, in-market. Average generation time: 30-60 seconds per image.

---

## 6. End-to-end validation journey

Here is the exact journey a Stellantis validator can follow to experience the full platform:

1. **Visit the homepage.** Observe the warm amber Rihla avatar in the bottom-right. Click it.
2. **Select a language** — try Darija to stress-test the multilingual capability.
3. **Green phone button** — Rihla initiates the call with a warm greeting in the selected language. The call UI takes over with an animated avatar.
4. **Say** "Bghit chi tomobil familiya, ميزانيتي حوالي 200 ألف درهم" (mixed Darija: I need a family car, budget around 200k).
5. **Observe:** Rihla replies in Darija, validates the need, recommends the Berlingo, and the page navigates to the Berlingo model detail in real time.
6. **Say** "Bedel lloun lel azrek" (change the colour to blue). The configurator updates live, the page scrolls to the configurator section.
7. **Say** "Chhal ghadi nkhlleç fellchhar?" (how much per month?). Rihla quotes a monthly figure, navigates to the financing page, and pre-fills the model and down payment.
8. **Say** "Wakhkha, bghit nreserve" (ok, I want to reserve). Rihla opens the reservation page.
9. **Click** "Pay with Stripe". Complete the sandbox checkout with test card `4242 4242 4242 4242`.
10. **Land** on the confirmation page. See the reference number, appointment date, dealer details, and next-steps timeline. An email is dispatched to the provided address (once `RESEND_API_KEY` is configured in production).

Total time from first click to confirmation: **under 12 minutes** for a first-time user.

---

## 7. Current scope & what is live

### Implemented and working

- Full Next.js 15 application with three model detail pages (C3 Aircross, C5 Aircross, Berlingo) with real Citroën Maroc pricing and specs
- AI-generated editorial imagery for every model and six Moroccan backdrops
- Four-language i18n with full RTL support for Arabic
- Real-time voice conversation via Gemini Live
- Text chat with streaming and tool use
- Configurator, financing advisor, reservation page, confirmation page
- Stripe Payment Link sandbox integration
- Email invoice scaffold via Resend (production-ready when key is provisioned)
- Citroën 2022 brand logo and design tokens applied throughout
- Consultative-selling conversation framework in seven phases

### Scaffolded, ready for production wiring

- CMI payment integration (Morocco's local card network) — requires merchant credentials
- Hunyuan 3D mesh generation pipeline — one model generated, two pending compression
- WhatsApp Business Cloud API integration for dealer handoff — requires Meta Business account
- Supabase persistence for user sessions, saved configurations, and analytics
- Sanity CMS for content management (currently hardcoded)

### Morocco-specific considerations handled

- Moroccan Darija linguistic nuances (masculine singular neutral, no Egyptian drift)
- CNDP (Moroccan data protection) compliant architecture
- Dealer network configured (Casablanca, Rabat, Marrakech starter set)
- MAD currency formatting throughout

---

## 8. Multi-brand, multi-market architecture

The platform is designed for Stellantis-wide rollout from day one. The `brand-citroen` package exposes a single token file (colours, typography, voice personality, imagery treatment). To deploy for another brand, a partner agency produces a new `brand-peugeot` or `brand-jeep` package — typically a one-week effort. The application code never references Citroën directly.

Similarly, the `market-config` package defines locale, currency, payment providers, dealer network, financing partners, and regulatory flags. A new market (Saudi Arabia, UAE, Egypt) is a new market-config file. The application is market-agnostic in its code paths.

**Estimated rollout velocity:** first new brand in the same market (e.g., Peugeot Maroc) in 2-3 weeks. First new market for an existing brand (e.g., Citroën KSA) in 3-4 weeks. The economics improve sharply: each new brand-market pair costs roughly 15-20% of the Morocco build.

---

## 9. Success metrics to track

We propose the following KPIs for the Stellantis validation period:

| Metric | Current baseline | MVP target (6 months) |
|---|---|---|
| Session → reservation conversion | 0.3% | 1.5% |
| Test drive booking rate | N/A | 4% |
| Configurator completion rate | N/A | 35% |
| Lead → sold (dealer side) | ~5% | 12% |
| Average time from first visit to reservation | unknown | < 12 min |
| Customer satisfaction (NPS proxy) | N/A | ≥ 50 |
| Dealer NPS (is Rihla helping or competing?) | N/A | ≥ 40 |

Key AI economics:

| Cost per event | Target |
|---|---|
| AI concierge session (text + voice) | < 4 MAD |
| Generated image | < 0.5 MAD |
| Gemini Live voice minute | < 1 MAD |
| AI cost as % of attributed revenue | < 1% |

---

## 10. Next steps for Stellantis validation

**Week 1.** Stellantis team performs the validation journey in §6 across three browsers (Chrome, Safari, Edge) and two devices (desktop, mobile). Feedback logged to the project Linear workspace.

**Week 2.** Citroën Maroc legal & compliance review: CNDP filing, CMI merchant agreement, Stripe Morocco setup, Resend domain verification.

**Week 3.** Dealer pilot selection. We recommend three dealers (one each in Casablanca, Rabat, Marrakech) to pilot the full handoff flow, including the WhatsApp Business integration.

**Week 4.** Production launch with feature flags for graduated rollout. A/B test against the current citroen.ma funnel for four weeks to measure conversion lift.

**Month 2-3.** Rollout decision. On validated lift, Stellantis commits to the next brand-market pair (our recommendation: Peugeot Maroc or Citroën KSA).

---

## 11. Team & delivery

This engagement is led by Völund Ventures, an AI product studio specialising in agentic commerce.

**Build team.** Eight to ten engineers and designers across product, AI, frontend, 3D, and dealer integration. Full team composition per the master sprint plan (18 weeks to MVP). Roles include a staff engineer as tech lead, two senior full-stack engineers, a 3D/WebGL engineer, an AI/ML engineer, a motion-focused frontend engineer, a product designer, a product manager, and specialist consultants for dealer operations, legal, and localisation.

**Budget envelope for the Morocco MVP.** Approximately 5.0 to 7.5 million MAD over 18 weeks, including the core team, AI usage (Gemini, Nano Banana Pro, Kling, Hunyuan), infrastructure, third-party APIs (Stripe, Resend, Mapbox, DocuSign), legal & compliance, and a 15% contingency reserve.

**Runtime cost per converting customer** (post-launch steady state, fully loaded): approximately 10-15 MAD, including AI inference, WhatsApp messaging, and infrastructure. Against the average Citroën deal margin in tens of thousands of MAD, AI cost as a percentage of attributed revenue holds below 1%.

---

## 12. Appendix — technical quick reference

### 12.1 Key URLs

- Production (staging): `http://localhost:3100/fr` during demo; `https://store.citroen.ma` at launch
- Model detail: `/[locale]/models/[slug]` — slugs: `c3-aircross`, `c5-aircross`, `berlingo`
- Reservation: `/[locale]/reserve/[slug]`
- Confirmation: `/[locale]/reserve/[slug]/confirmation`
- Financing: `/[locale]/financing`
- Dealers: `/[locale]/dealers`

### 12.2 API endpoints

- `POST /api/rihla/chat` — streaming ND-JSON text chat
- `POST /api/rihla/tts` — Gemini 3.1 Flash TTS text-to-audio
- `POST /api/reserve/confirm` — post-payment email dispatch via Resend
- `WSS` direct to Google for voice calls (client-side ephemeral token)

### 12.3 Repository

- Monorepo: Turborepo + pnpm
- Frontend: Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4, Framer Motion 11
- AI SDKs: `@google/genai`, `@anthropic-ai/sdk`
- Deployment: Vercel (Frankfurt edge for CNDP compliance in Morocco)

---

*End of brief. Any questions, direct to Zakaria Sabti · zakaria@volund-ventures.com.*
