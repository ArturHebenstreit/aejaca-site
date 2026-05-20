# AEJaCA Design System — v2 (Light premium)

A design system for **AEJaCA** — a premium Polish studio that combines
handcrafted jewelry (custom rings, pendants, earrings in silver and gold)
with digital fabrication (FDM/SLA 3D printing, fiber and CO2 laser
engraving, epoxy resin casting). Based in Chełmża, Poland; trades in
PLN at home and EUR for EN/DE customers.

> **Two brand identities under one site at [aejaca.com](https://www.aejaca.com).**
>
> - **AEJaCA Jewelry** → Warm cream `#F8F4ED` canvas, champagne gold accent `#A87425`, **Playfair Display** serif, editorial voice. Mejuri / Catbird / Missoma aesthetic family.
> - **AEJaCA sTuDiO** → Blueprint cool white `#F4F6F9` canvas, cobalt blue `#2563EB`, **Inter** sans-serif, technical voice. Bambu Lab / Formlabs / Prusa aesthetic family.
>
> Both ship with a **dark "night mode" alternate** that mirrors the original
> high-contrast site (#0a0a0a + amber/blue + neutral chrome). Activate by
> setting `data-theme="dark"` on any ancestor; the same CSS variable names
> resolve to dark values automatically.

This rewrite swaps the original dark-only site for two distinct **light premium**
themes — based on global trends in the jewelry market (where ~80% of
premium brands sit on cream/white) and the digital-fab market (where
clarity wins over atmosphere). The brand split is now reinforced by
**temperature**: Jewelry is warm (cream + gold + serif), sTuDiO is cool
(blueprint + blue + sans).

---

## Source materials this system was built from

- **GitHub** — primary source of truth: [`ArturHebenstreit/aejaca-site`](https://github.com/ArturHebenstreit/aejaca-site). React 18 + Vite + Tailwind CSS v4 + Cloudflare Pages. The `CLAUDE.md` and `src/index.css` files were the most concentrated brand brief. `src/i18n/{pl,en,de}.js` is the canonical copy bank used here.
- **Uploaded brand assets** — `brand-sign.webp` (knotwork mark), `hero-home-jewelry.webp` (workshop with gems on slate), `hero-home-studio.webp` (Bambu Lab printer in the workshop). All assets imported from the repo are in `assets/`.

Open the repo for full SEO schemas, all calculators, market-rate APIs,
and the blog posts. None of that is duplicated here — this folder is the
**visual brief**, not a fork.

---

## CONTENT FUNDAMENTALS

Copy on AEJaCA is **warm, declarative, and confident** — never breezy,
never salesy. Two voices, one shared cadence.

### Voice — Jewelry side
- **Editorial and emotive.** Headlines are short, almost aphoristic: _"Wear what matters. Not what's mass-made."_ / _"Your vision. Our precision."_ / _"Where art meets craftsmanship."_
- **Story-led.** Process is described as a "conversation, not a catalog." Pieces "carry meaning," "tell a story," become "timeless companions." Values come in single nouns with a one-line definition — _Uniqueness · Emotion · Symbolism · Timelessness._
- **Romance without flowery prose.** No "exquisite," no "luxurious." The work earns those words by being shown.

### Voice — sTuDiO side
- **Technical, plainspoken, helpful.** _"Innovation Meets Precision."_ / _"From idea to physical product."_ Maker's-manual tone — measured, specific, never breathless.
- **Numbers over adjectives.** Body copy quotes layer heights (0.1 / 0.2 / 0.3 mm), Shore hardness (20A / 40A), Mohs scale, wavelengths (1064 nm vs 10600 nm), tolerances, fulfilment windows.
- **"We" + "you", never "I" or "our team" alone.** The brand speaks as a small studio of practitioners.

### Shared mechanics
- **Casing.** Sentence-case for headlines and buttons. **UPPERCASE eyebrows** above section titles, tracked **0.32em** (was 0.20–0.25em in v1 — bumped up for stronger presence on light backgrounds). Wordmarks are stylised: **AEJaCA**, **AEJaCA Jewelry**, **AEJaCA sTuDiO** — preserve the lowercase `T`, `D`, `i` in sTuDiO everywhere.
- **Emoji.** Sparingly, only inside calculator step pickers (💍 ring, ⚡ fiber laser, 🖨️ 3D print). Never in marketing copy, headings, body, or CTAs.
- **Punctuation.** Em dashes (—) and typographic ellipsis (…). Polish keeps its diacritics; German uses real umlauts.
- **Currency.** Active language drives it: PL → PLN, EN/DE → EUR. Secondary currency appears smaller below. Rates from NBP feed with fallback `pln_per_eur = 4.25`.
- **CTAs.** Verb-first, no exclamation marks: _"Discover jewelry"_, _"Enter sTuDiO"_, _"Calculate jewelry price"_, _"Get in Touch"_, _"Start a Custom Project"_, _"Quote a project online"_.

### Eyebrow flanking rules
A signature element of the v2 light system: every section eyebrow is
flanked by two hairline rules:

`— ARTISTIC & LUXURY —`

This is a classic premium-jewelry pattern (Cartier, Bvlgari) that
disappears on dark themes (where the eyebrow stands alone in glowing
amber) but is essential on cream — without the hairlines an uppercase
tag fades into the warm background.

---

## VISUAL FOUNDATIONS

### Canvas
- **Jewelry** lives on `#F8F4ED` (warm cream). Second-tier sections use `#F3EDDF` for banded separation. Cards float on pure white `#FFFFFF`.
- **sTuDiO** lives on `#F4F6F9` (cool blueprint white). Second-tier `#EAEFF6`. Cards on `#FFFFFF`.
- **Night mode** flips both to `#0a0a0a` with original amber/blue accents. Toggle via `data-theme="dark"` on `<html>` or `<body>`. The CSS variable names stay identical, so components don't change.

### Hero pattern
The signature opening for every page: **dark scrim over photo, white text, accent-light eyebrow**. Even on cream and blueprint themes, the hero darkens the image with a 55% black scrim at the top fading to bg color at the bottom, so the title reads regardless of the photo. This is the same approach Cartier and Mejuri use — light page everywhere except the hero, where the photo gets to breathe.

- Hero h1: white 48px, Playfair (Jewelry) or Inter 600 (sTuDiO), with a 16px shadow
- Hero subtitle: 14px white at 88% opacity with an 8px shadow
- Hero eyebrow: 12px in `--accent-light` (#E6C580 for Jewelry, #93C5FD for sTuDiO), flanked by 28px hairlines

### Color in use
- **Jewelry accent token chain**: `--accent #A87425` (base), `--accent-hover #7A5217` (eyebrow + hover), `--accent-soft #EDDDB6` (tinted bg), `--accent-light #E6C580` (luminous, hero only)
- **sTuDiO accent token chain**: `--accent #2563EB`, `--accent-hover #1D4ED8`, `--accent-soft #DBEAFE`, `--accent-light #93C5FD`
- **Semantic** are theme-aware: success `#16A34A`, warning `#D97706`, danger `#DC2626`, info `#2563EB` on light; legacy emerald/amber/red/blue in night mode.
- **Metal ticker** (footer): Au champagne `#A87425`, Ag slate `#94A3B8`, Pt purple `#7C3AED`, Pd cyan `#0891B2`.

### Typography
- **Display** (Playfair Display 600, -0.025em tracking, line-height 1.05) is the Jewelry voice. Hero h1 = 48px, section h2 = 42px, card h3 = 24px.
- **Sans** (Inter 500-600, -0.015em tracking) carries sTuDiO + all UI. Body 16/26, body-sm 14/21, caption 12/18.
- **Eyebrows** are always Inter 600 uppercase tracked 0.32em.

### Cards
- Default radius `--radius-2xl` = **16px** (unchanged from v1).
- Cards on light themes have **double-layer shadows**: a 1px inner key shadow + a long soft ambient. On hover: lift `-translateY(2px)` + grow shadow + border accent tint. No glass morphism in v2 light — that was a dark-only flourish; on cream it muddies.
- Card background is always `--bg-elevated` (white), border is `--border-default` (warm tan or cool gray). Brand-tinted on hover via `--border-accent`.

### Borders & dividers
- Warm tan `#E0D5BC` on Jewelry, cool gray `#D9DFE8` on sTuDiO. Strong variants for hover.
- Section breaks use `--divider` (a hairline gradient transparent → border-strong → transparent). Same trick as v1, just over light bg now.

### Buttons
- **Primary** — espresso pill `#1F1A14` on Jewelry (slate `#0F172A` on sTuDiO) with white text. Hover: lighten background + accent glow shadow.
- **Accent** — outlined gold/cobalt pill. Hover: fills with accent color.
- **Ghost** — accent text + arrow that translates +4px on hover.

### Hover vocabulary
- **Cards** lift `-translate-y-1` + shadow grows + border deepens to `--border-accent`.
- **Text links** go from `--accent` → `--accent-hover`.
- **Photos inside cards** scale 1.05 over 700ms.
- **Arrows** translate +4px X on group hover.

### Focus
Always uses `--accent` for the outline ring, brand-aware (gold on Jewelry pages, cobalt on sTuDiO pages).

### Motion
- Easing `cubic-bezier(0.16, 1, 0.3, 1)` ("ease-editorial") — fast initial, long settle.
- Durations: 200 / 300 / 500 / 700 ms.
- No bouncing, no parallax. Things move like a turning page.

### Layout
- Max widths: 1280 (top-level container), 1024 (services grid), 720 (about / hero copy column).
- Section vertical padding: 88px between major sections, 64px between sub-sections.

---

## ICONOGRAPHY

The site uses **`lucide-react`** exclusively — there is no custom icon
font, no SVG sprite sheet, no PNG icon set. The UI kit ships inline
SVGs in `Icon.jsx` that mirror Lucide's defaults exactly (stroke 2,
fill none, currentColor) so the kit runs without the React package.

**Common icons:** `ArrowRight`, `ChevronDown`, `Menu`, `X`, `Globe`,
`Star`, `Sparkles`, `FileUp`, `Printer`, `Flame`, `Cpu`, `Scissors`,
`Zap`, `Mail`, `Instagram`, `Music2`, `Facebook`, `Youtube`,
`MessageCircleMore`, `Store`.

**Emoji** — only inside calculator step pickers (`💍 Ring`, `🖨️ 3D`,
`⚡ Fiber Laser`, `💎 Resin`, `📡 NFC`). Never in headlines, body,
or CTAs.

**Unicode** appears as the **★** star in the Google reviews pill (we
use Lucide's filled `Star`, not the literal char) and the **•** bullet
in feature lists (rendered with the active accent color).

**Brand mark.** Single asset: `assets/brand-sign.webp` — the Celtic-style
knotwork roundel containing AEJaCA letterforms. Four treatments:

- **Navbar / footer** — 32-42px. On light → `filter: brightness(0)` (pure black at 88% opacity). On dark night-mode → `brightness(0) invert(1) drop-shadow(0 0 8px white/30%)`.
- **Brand-statement hero** (home page) — 120px, same treatments scaled up.
- **Favicon** — full-colour PNG variants in `assets/`.

**Do not redraw the knotwork.** Always use `assets/brand-sign.webp`.

---

## Day / Night toggle (`data-theme="dark"`)

The UI kit's navbar includes a moon/sun icon that toggles
`document.documentElement.setAttribute('data-theme', 'dark')`. CSS does
the rest:

```css
.brand-jewelry { --bg-page: #F8F4ED; --accent: #A87425; ... }
[data-theme="dark"] .brand-jewelry { --bg-page: #0a0a0a; --accent: #f59e0b; ... }
```

For production: persist in `localStorage` and read on init. For
ephemeral demos / mocks: React state is fine.

---

## Fonts

Both Playfair Display and Inter load from **Google Fonts** via the
`@import` at the top of `colors_and_type.css`. No local `.ttf/.woff2`
files. For offline / print builds, drop the official archives into a
new `fonts/` folder.

---

## Index — files in this folder

| Path | What it is |
|---|---|
| `README.md` | This document. |
| `SKILL.md` | Agent-Skill entrypoint — compatible with Claude Code skills. |
| `colors_and_type.css` | All design tokens (CSS variables) + Google Fonts import. Two themes (`.brand-jewelry`, `.brand-studio`) + `data-theme="dark"` override. **Import this in any HTML mock.** |
| `assets/` | Brand mark, hero photography, favicons, OG imagery — copy from here, don't redraw. |
| `preview/` | 19 specimen cards driving the Design System tab (colors, type, spacing, components, brand). All rebuilt for v2 light. |
| `ui_kits/website/` | Clickable site recreation with day/night toggle, three-language switcher, and full Jewelry + sTuDiO sub-page templates. Open `index.html`. |
| `explorations/light-jewelry/` | Side-by-side comparison of Museum white / Warm cream / Champagne boutique / Dark variants that the v2 system was selected from. Useful reference. |

### UI kit components

- `Atoms.jsx` — Eyebrow (with hairlines), GradientDivider, RatingPill, Button (primary / accent / ghost)
- `Navbar.jsx` — sticky nav with brand-aware accents, language menu, day/night toggle
- `Footer.jsx` — newsletter + 3-col + market-rates ticker
- `HomeCards.jsx` — GatewayTile, QuickQuoteCard, GlassFeatureCard (now light "feature card"), StlTile, BrandScope wrapper
- `HomePage.jsx` — composed jewelry-themed home with embedded studio cards
- `SubPages.jsx` — full Jewelry and sTuDiO title pages (hero + about + pricing + services + process)
- `Icon.jsx` — Lucide-style inline SVGs (no React-package dependency)

---

## How to use this design system (for Claude Code or any agent)

1. **Read `SKILL.md` first.**
2. For any new HTML artifact, copy `colors_and_type.css` next to it. Apply `.brand-jewelry` or `.brand-studio` to the root to pick a theme. Add `data-theme="dark"` for night mode.
3. For React mocks, copy whichever components you need out of `ui_kits/website/`.
4. **Never mix the two accents in one card.** The brand boundary is a hard one.
5. Need iconography? Pull from `Icon.jsx` or directly from Lucide React.
6. Need imagery? Use `assets/` or placeholder rectangles — do not invent visuals.

---

_v2 generated as a light-premium snapshot of [aejaca.com](https://www.aejaca.com), with the original dark site preserved as the night-mode alternate._
