# ShopQuote — CNC & Fabrication Quoting

A quoting tool for a mixed machine shop: CNC milling & turning **plus** welding, press-brake
bending, pipe bending and steel structures. Built around the workflow of quoting from
**2D engineering drawings** (a STEP file is a bonus, not a requirement).

Bright, iPad-style UI. Runs entirely in the browser for now (state persists in
`localStorage`) — no backend needed to demo it.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

## What's inside

| Layer | File(s) | Status |
| --- | --- | --- |
| Data model | `src/types.ts` | ✅ machines, materials, operation templates, quotes/parts/ops |
| Cost engine | `src/engine/costEngine.ts` | ✅ deterministic, auditable: setup + run time × rates, material by mass + markup, tolerance factors, finish costs, margin/discount |
| Seed rates | `src/engine/defaults.ts` | ✅ placeholder numbers — replace with the shop's real rates in Settings |
| Drawing extraction | `src/engine/extraction.ts` | 🟡 **stubbed**: same contract a vision-model backend will fulfil (structured fields + confidence + suggested operations); returns realistic sample data today |
| UI | `src/components/*` | ✅ quote list, quote editor with AI-prefill review flow, settings, printable quote document |

## Design decisions (deliberate)

1. **No gcode.** Quoting needs *time & cost estimates*, not toolpaths. The engine prices
   operations (facing, pocketing, drilling per hole, welding per metre, bends per bend…)
   against machine rates — the way estimators have always worked, just faster.
2. **Human-in-the-loop is the product.** Drawing extraction *pre-fills* a part and marks
   every suggested operation `needsReview`. The estimator confirms or corrects in seconds.
   Nothing AI-derived prices silently.
3. **The extraction stub defines the API.** `extractFromDrawing(file) → DrawingExtraction`
   returns typed fields with confidence scores. Swapping the mock for a real
   vision-language-model call (send the PDF, ask for this JSON schema) changes nothing else.

## Roadmap

- [ ] Real extraction backend (VLM reads title block, dims, holes, threads, welds, GD&T)
- [ ] Quantity-break pricing (1 / 10 / 100 tiers on the quote document)
- [ ] Customer database + quote history / win-loss tracking
- [ ] STEP file path: real feature recognition when 3D is available
- [ ] Multi-user backend + auth (SaaS)

## Discovery-meeting checklist

The seed numbers in `defaults.ts` are placeholders. The 3-hour session with the shop owner
should replace them: machine hourly rates (run vs setup), material purchase prices & markup,
how he estimates welding (per metre?), bending (per bend?), structures (per kg?), tolerance
premiums, margin policy, and 10–20 past drawings **with the quotes he actually sent** to
calibrate against.
