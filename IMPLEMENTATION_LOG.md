# Implementation log

## 2026-08-17 — Fix Vercel 404 by setting Next.js framework

Production alias 404ed because the project was created as Framework "Other" and served `public/` (empty). Set framework to Next.js, disabled deployment SSO, and re-pushed `GROQ_API_KEY` via `vercel env add`.

## 2026-08-17 — Switch chat AI from Gemini to Groq

Chat, context extraction, and comparison now run on Groq with `GROQ_API_KEY` from `.env.local` (not committed). Extraction uses `openai/gpt-oss-20b`; replies use `openai/gpt-oss-120b`. Image generation still uses Gemini if that key is set.

**Tested**
- Groq chat completion against this key — pass (`openai/gpt-oss-20b` and `openai/gpt-oss-120b`)
- `npx vitest run` — 18 passed
- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `npx playwright test` — 2 passed (checkout UPI + declined card)

## 2026-08-17 — Mock checkout, payments, and orders

Added an Indian-market checkout path so the shopping loop is complete without a live gateway.

**What changed**
- Mock payment processor: UPI, card, cash on delivery. Catalog prices are re-applied server-side. Cards ending in `0000` are declined.
- Checkout and orders sheets, wired from the bag, header, and chat (`checkout` / `view_orders`).
- GST (5%), free shipping over ₹499, and on-device order + delivery preference storage.

**Tested**
- `npx vitest run` — 16 passed (checkout totals/validation, matcher, `/api/checkout` reprice)
- `npx playwright test` — 2 passed (UPI success + declined card browser journey)
- `npx tsc --noEmit` — pass

## 2026-08-17 — Visual rebrand to a warm shopping atelier

Replaced the black, sharp-cornered, lime chatbot chrome with a light editorial identity so the product reads as a new app, not a restyle of the old one.

**What changed**
- Palette: warm ivory canvas, espresso ink, burnt saffron accent, sage/blush supporting tones
- Type: Fraunces display + Outfit UI
- Shell: floating pill header, flame mark, magazine welcome, paper chat bubbles, capsule composer
- Product cards, comparison table, and bag drawer restyled to match
- Added ESLint 8 + `eslint-config-next@14` so `next lint` can run (it previously prompted for setup)

**Tested**
- `npm run lint` — pass (no warnings or errors)
- `npm run build` — pass (compiled, 7/7 static pages)
- No unit or Playwright suite exists in this repo; `pnpm e2e:full` is an Astrazen command and was not run
