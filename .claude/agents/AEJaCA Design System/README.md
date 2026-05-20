# AEJaCA Design System

A design system for **AEJaCA** — a premium Polish studio that combines
handcrafted jewelry (custom rings, pendants, earrings in silver and gold)
with digital fabrication (FDM/SLA 3D printing, fiber and CO2 laser
engraving, epoxy resin casting). Located in Chełmża, Poland; trades in
PLN at home and EUR for EN/DE customers.

> Two brand identities live under one site at **[aejaca.com](https://www.aejaca.com)**:
>
> - **AEJaCA Jewelry** — artistic, luxury, editorial. Amber / gold accent (`#f59e0b`), **Playfair Display** serif.
> - **AEJaCA sTuDiO** — technical, engineering, precise. Blue accent (`#3b82f6`), **Inter** sans-serif.
>
> They share a single dark canvas (`#0a0a0a`) and the same neutral chrome,
> nav, footer, and motion language. The split is enforced almost entirely
> by **typeface** and **accent colour**.

The design direction is "premium, editorial, like Cartier or Bang &
Olufsen" — dark mode is a feature, not a fad: it makes gemstones and
metals look alive, and lets workshop photography breathe.

---

## Source materials this system was built from

- **GitHub repository** — primary source of truth.
  [`ArturHebenstreit/aejaca-site`](https://github.com/ArturHebenstreit/aejaca-site) — React 18 + Vite 6 + Tailwind CSS v4 deployed on Cloudflare Pages. The `CLAUDE.md` and `src/index.css` files are the most concentrated brand brief; pages under `src/pages/` show how the rules are applied; `src/i18n/{pl,en,de}.js` is the canonical copy bank in all three languages.
- **Uploaded brand assets** — `brand-sign.webp` (knotwork mark), `hero-home-jewelry.webp` (emerald ring on slate), `hero-home-studio.webp` (Bambu Lab 3D printer in the workshop). All three live in `assets/` along with the favicons and Open Graph imagery imported from the repo.

The repo is worth exploring further to do deeper work — most calculator
behaviour, blog content style, schema markup, and i18n keys are not
duplicated here.

---

## CONTENT FUNDAMENTALS

Copy on AEJaCA is **warm, declarative, and confident** — never breezy,
never salesy. Two voices, one shared cadence.

### Voice — Jewelry side
- **Editorial and emotive.** Headlines are short, almost aphoristic, often a sentence with a period: _"Wear what matters. Not what's mass-made."_ / _"Your vision. Our precision."_ / _"Where art meets craftsmanship."_
- **Story-led.** Process is described as a "conversation, not a catalog." Pieces "carry meaning," "tell a story," become "timeless companions." Values come in single nouns with a one-line definition — _Uniqueness · Emotion · Symbolism · Timelessness._
- **Romance without flowery prose.** No "exquisite," no "luxurious." The work earns those words by being shown.

### Voice — sTuDiO side
- **Technical, plainspoken, helpful.** Headlines name a capability: _"Innovation Meets Precision."_ / _"From idea to physical product."_ The maker's manual tone — measured, specific, never breathless.
- **Numbers over adjectives.** Body copy quotes layer heights (0.1 / 0.2 / 0.3 mm), Shore hardness (20A / 40A), Mohs scale (10, 9, 7.5), wavelengths (1064 nm vs 10600 nm), tolerances ("0.5–1% shrinkage"), fulfilment windows ("3–5 business days").
- **"We" + "you", never "I" or "our team" alone.** _"We accept STL, STEP, OBJ…"_ / _"You see the 3D render before anything is made."_ This applies to both sides — the brand speaks as a small studio of practitioners, never as a corporation.

### Shared mechanics
- **Casing.** Sentence-case for headlines and buttons. **UPPERCASE eyebrows** above section titles, tracked 0.20–0.25 em. The product wordmarks are stylised: **AEJaCA** is the parent, **AEJaCA Jewelry** is the jewelry sub-brand, and **AEJaCA sTuDiO** is the studio sub-brand — note the lowercase _T_, _D_, _i_ — that intercap is intentional and must be preserved everywhere (i18n strings, nav labels, headlines).
- **Emoji.** Sparingly, never decorative. They appear inside calculator configurators as glyph affordances (💍 ring, ✨ earrings, 🖨️ 3D print, ⚡ fiber laser) but never inside marketing copy, headings, or body. Treat them as tiny icons inside step pickers only.
- **Punctuation.** Em dashes — used liberally — and the typographic ellipsis (…), not three dots. Polish copy keeps its diacritics (ł, ą, ę, ó, ż, ź, ś, ć, ń); German uses real umlauts.
- **Currency.** Always responds to the active language: PL → PLN, EN/DE → EUR. The secondary currency appears below in smaller text. Rates come from the live NBP feed (`/api/market-rates`) with a hard fallback of `pln_per_eur = 4.25`.
- **CTAs.** Verb-first, no exclamation marks: _"Discover jewelry"_, _"Enter sTuDiO"_, _"Calculate jewelry price"_, _"Get in Touch"_, _"Start a Custom Project"_, _"Quote a project online"_.
- **Trust signals.** Google reviews badge (★ rating · N reviews) appears twice on the home page — once in the hero, once below the brand statement. Trustpilot is the second layer below social proof.
- **Process language.** Always numbered, narrative, and tactile: _"Hand sketches evolve into precise 3D CAD models"_, _"The cast piece is filed, soldered, textured, and shaped by hand."_ Steps are 01–06 zero-padded numerals, not bullet dots.

### Microcopy examples to pattern-match
- Hero subtitle: _"Jewelry and objects designed for you — from idea to finished piece."_
- Section eyebrow: _"From Idea to Masterpiece"_, _"Our Capabilities"_, _"AEJaCA Advises"_.
- Empty / loading: _"Loading rates…"_ — sentence case, ellipsis.
- Form thank-you: _"Thank you! We'll get back to you shortly. For urgent matters, email us directly at contact@aejaca.com."_
- Disclaimer: _"This is a rough estimate. Final price depends on design complexity and specifications."_

---

## VISUAL FOUNDATIONS

### Canvas
- The page sits on **`neutral-950` (#0a0a0a)** everywhere. The second tier is `neutral-900` for soft section bands (`bg-neutral-900/50`), and gradient bands (`neutral-950 → neutral-900/30 → neutral-950`) gently separate large sections. There is **no white-mode**; printed/light surfaces appear only on the contact form's accept-light states.
- Sections are typically `py-16` to `py-20` (64–80 px vertical), with a `gradient-divider` (1 px wide, transparent → white 10% → transparent) hairline between major bands instead of solid rules. That divider is a signature element — use it.

### Two-brand split
- **Jewelry surfaces** introduce themselves with the amber eyebrow + Playfair Display heading + `glass-amber` card or `from-amber-950/20` gradient panel.
- **sTuDiO surfaces** swap to the blue eyebrow + Inter heading + `glass-blue` / `from-blue-950/20`.
- Both share the same neutral chrome (navbar, footer, dividers, brand mark) and the same iconography — only the accent token changes. Buttons that live in shared chrome (e.g. bottom-of-page contact CTA) use **white-on-black pill** rather than picking a side.

### Color in use
- **Primary accent** is `amber-500 #f59e0b` (Jewelry, plus default for any cross-brand chrome — navbar active state, focus rings, skip-to-content, Google rating star).
- **Secondary accent** is `blue-500 #3b82f6` (sTuDiO; technical UI).
- **Emerald-400 #34d399** is the "instant / file upload / quote" accent — used for the green STL/SVG band and any "quick quote" affordance.
- Background gradients are **dark-on-dark**, never bright: `from-amber-950/20 to-neutral-950` and `from-blue-950/20 to-neutral-950`. They look like a colored shadow leaking from a corner — not a glow.

### Typography
- Two families only. **Playfair Display** is reserved for editorial moments: the H1 hero on home/about, Jewelry section headings, brand statement, contact heading. **Inter** is everything else (sTuDiO headings, all UI labels, body, navbar, footer).
- **Letter-spacing rules.** Headings use `tracking-tight` (≈ -0.02 em). Eyebrows are uppercased with **0.20 em** (`tracking-[0.2em]`) or **0.25 em** for extra-emphatic ones (`tracking-[0.25em]`). Body text uses default tracking.
- **Leading.** `leading-tight` (1.1) on large display headlines; `leading-relaxed` (~1.625) on body. The combination is what makes the editorial rhythm feel right.

### Imagery
- **Low-key, atmospheric, real.** Jewelry imagery uses warm dark tones (slate, walnut, candlelight) with a single golden rim light catching the gemstone. Studio imagery uses cool tones (tungsten + cyan rim) and shows machines in context — a Bambu Lab printer mid-extrude, a fiber laser at work, smoke and steam visible. The mood is closer to a documentary still than to a product catalogue.
- **Always cropped portrait or square.** Home gateway tiles are **3:4** with a `from-black/90 via-black/30 to-transparent` bottom-to-top scrim so foreground text remains readable. STL/SVG tile thumbnails are **square**, scrim is `from-black/90 via-black/60 to-black/30` (denser because text sits on top).
- **No illustrated marketing imagery.** No iconographic vector banners, no flat illustrations, no faked 3D renders. Either it's a photograph of real work, or it's a placeholder.

### Cards
- Default radius is **`rounded-2xl` (16 px)**. Only the navbar dropdown and small chips use `rounded-xl`/`rounded-full`.
- Cards usually have **no shadow at rest** — they show structure with a 1 px border (`border-white/8` or accent-tinted `border-amber-400/20` / `border-blue-400/20`). On hover they lift via `hover:-translate-y-1` and gain a tinted shadow (`shadow-amber-900/20` or `shadow-blue-900/20`). The effect is "the card has just been picked up off the page" rather than "the card now has a glow under it."
- The `.glass` variants pair the dark canvas with a tinted blurred surface (`backdrop-filter: blur(12–16px)`); use them when stacking content over busy imagery or when the section already has its own gradient background.

### Borders and dividers
- Borders are universally white-with-low-opacity (`border-white/5`, `/8`, `/10`). Section breaks use the gradient divider, not a solid line.
- Tinted borders mark brand territory: `border-amber-400/20` on Jewelry, `border-blue-400/20` on sTuDiO, both deepening to `/40` on hover.

### Buttons
- **Primary** — white-filled pill, black text, used for the single most important conversion on the page (`Get in Touch`). `hover:bg-neutral-200` + `shadow-white/10`.
- **Branded outlined pill** — translucent + 1 px tinted border + accent-colored text. Used for "Discover jewelry" / "Enter sTuDiO". On hover the pill **fills with the accent color** and switches to black or white text — a deliberate confidence move, not a subtle tint.
- **Ghost text link** — just the accent color text + an arrow that translates 4 px right on hover. Most internal CTAs use this.
- Press state is universally a tiny darken (`hover:bg-neutral-200`) — there is no "click shrink" or scale animation.

### Hover states (universal vocabulary)
- **Text** lightens to a `300` shade (amber-500 → amber-300, blue-500 → blue-300).
- **Cards** translate up 4 px and grow their tinted shadow over 300–500 ms.
- **Images inside cards** scale 1.05 over 700 ms.
- **Borders** deepen from `/20` to `/40` on accent-tinted borders.
- **Arrows** translate `+4 px` on the X axis on group-hover.

### Focus
- Keyboard focus rings are **always amber** (`outline: 2px solid #f59e0b; outline-offset: 2px;`) regardless of which brand surface they sit on. This is one of the few places amber wins outright on sTuDiO pages — accessibility trumps theming.

### Motion
- Easing for everything is **`cubic-bezier(0.16, 1, 0.3, 1)`** — an "ease-out-quint" feel: fast initial, long graceful settle. Hover transitions on cards run at 300–500 ms; scroll reveals run at 600–700 ms.
- Four reveal classes: `.reveal` (Y+24 → 0), `.reveal-scale` (0.95 → 1), `.reveal-left` (X-32 → 0), `.reveal-right` (X+32 → 0). All are gated by `data-visible="true"` set via IntersectionObserver. On `prefers-reduced-motion`, all reveals fade in instantly.
- No bouncing, no springiness, no parallax. The site moves like a turning page, not a UI.

### Transparency & blur
- Glass surfaces only in two places: **fixed navbar/footer chrome** (blur 12–20 px) and **the Two Worlds feature cards** (blur 16 px with brand-tinted border). Glass is never used decoratively over photographs — that's what the scrim gradient is for.

### Layout
- Wide layouts top out at `max-w-7xl` (1280 px). Most content is centered at `max-w-5xl` or `max-w-6xl`. Hero copy lives within `max-w-4xl`, body paragraphs within `max-w-2xl–3xl` — the column is intentionally narrow.
- The site has one fixed element: the navbar (`fixed top-0`, transitions border opacity on `scrollY > 20`). Floating CTAs (`.floating-cta`) appear on mobile for contact only.

### Iconography
- **Lucide React (`lucide-react ^0.536`)** is the single icon library. Stroke icons, default 1.5 px stroke weight, sized at 4–7 px units (16–28 px in practice). Common ones: `ArrowRight`, `Sparkles`, `FileUp`, `Printer`, `Flame`, `Cpu`, `Scissors`, `Star`, `Menu`, `X`, `Globe`, `ChevronDown`, `Mail`, `Instagram`, `Facebook`. The arrow-right is the brand's most-used icon — it appears after almost every CTA.
- Icons inherit text color, never appear in a colored badge. Use them at the same color as their adjacent text.

---

## ICONOGRAPHY

The site uses **`lucide-react` exclusively** — there is no custom icon
font, no SVG sprite sheet, no PNG icon set. The Lucide CDN is the
authoritative source for any HTML mock or external slide that needs an
icon — load it like:

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

…or just embed the inline SVG (Lucide's GitHub is the source of truth).
Match the live site's defaults: **`stroke-width="2"`** (Lucide default
when imported via React; the prop is overridden to `1.5` only inside
hero cards for a more delicate feel), `fill="none"`, `stroke="currentColor"`,
`width="16–28px"`. Always inherit the surrounding text colour.

**Common Lucide icons used:**
`ArrowRight`, `ChevronDown`, `Menu`, `X`, `Globe`, `Star`, `Sparkles`,
`FileUp`, `Printer`, `Flame`, `Cpu`, `Scissors`, `Zap`, `Mail`,
`MessageCircleMore`, `Store`, `Instagram`, `Music2` (TikTok), `Facebook`, `Youtube`.

**Emoji usage** is strictly utilitarian — only inside calculator and
configurator step pickers (`💍 Ring`, `✨ Earrings`, `🖨️ 3D Printing`,
`⚡ Fiber Laser`, `🔆 CO2 Laser`, `💎 Resin Casting`, `📡 NFC`,
`🔧 Custom Project`). They are tiny glyphs at body size that visually
anchor a label. **Never use emoji in headlines, body copy, CTAs, or
section eyebrows.**

**Unicode characters** appear in two places: the **★** star in the
Google reviews rating pill (rendered through Lucide's `Star` filled
amber, not a literal ★), and the **&bull;** bullet in feature lists
(rendered as `<span>•</span>` colored to the active accent).

**Brand mark / logo.** The wordmark is the word **AEJaCA** set in
Playfair Display 600. The standalone sign — a Celtic-style knotwork
roundel containing the letters AEJaCA, supplied as `brand-sign.webp`
(512×512, RGBA, ~46 % transparency) — is the only graphic device. It
appears in three treatments:

- **Navbar / footer** — 32–44 px, white via `filter: brightness(0)
  invert(1)` with a subtle 8 px white drop shadow at 30 %.
- **Brand-statement hero on the home page** — 144 px, same white
  inversion but with a `20 px / 0.15` glow.
- **Favicon** — full-colour line art, served via the imported PNG
  variants (`favicon-32`, `favicon-192`, `favicon-512`,
  `apple-touch-icon`).

**Do not redraw the knotwork.** Always use `assets/brand-sign.webp`.

---

## Fonts — substitution flag

Both Playfair Display and Inter are loaded from **Google Fonts** by the
live site (see `index.html` `<link rel="stylesheet">` with
`Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400` and
`Inter:wght@300;400;500;600;700`). No `.ttf`/`.woff2` files exist in the
repo — Google's CDN is the source of truth.

`colors_and_type.css` imports both via `@import url(...)`. **No
substitution was needed.** If you need to ship completely offline or
for print, download the official Google Fonts archives and place under
`fonts/` — the file names are stable.

---

## Index — files in this folder

| Path | What it is |
|---|---|
| `README.md` | This document. |
| `SKILL.md` | Agent-Skill entrypoint — copy-paste compatible with Claude Code skills. |
| `colors_and_type.css` | Single CSS file with all design tokens (custom properties) and a `@import` for the Google Fonts pair. Import this at the top of any HTML mock. |
| `assets/` | Brand assets imported from the live repo: knotwork brand sign, hero photography for jewelry and studio, favicons, Open Graph imagery. **Copy these out instead of redrawing.** |
| `preview/` | Small HTML cards that populate the Design System tab of this project — colour palettes, type specimens, component states. Each is registered with a viewport hint. |
| `ui_kits/website/` | A clickable recreation of the AEJaCA site shell with reusable React components — Navbar, Footer, GatewayTile, QuickQuoteCard, GlassFeatureCard, RatingPill, GradientDivider, etc. Open `ui_kits/website/index.html` to view the prototype. |

### UI kits

- **`ui_kits/website/`** — the AEJaCA marketing site (the only product
  surface). Includes JSX components, an interactive `index.html`, and a
  short kit README. There is no separate mobile app, dashboard, or
  admin product to recreate — the marketing site _is_ the product.

---

## How to use this design system

1. **Read `SKILL.md` first** if you arrived here as an agent — it
   tells you what to do.
2. For any new HTML artifact, copy `colors_and_type.css` next to it and
   `<link rel="stylesheet" href="./colors_and_type.css">`. The CSS
   variables and the two-font import are everything you need to be
   on-brand.
3. For React mocks, copy whichever components you need out of
   `ui_kits/website/` — they are intentionally cosmetic, not wired to a
   backend.
4. For Jewelry-side surfaces, lead with `--amber-500`, Playfair, and a
   `glass-amber` panel. For sTuDiO-side surfaces, lead with `--blue-500`,
   Inter, and `glass-blue`. **Never mix the two accents inside one
   card** — the brand boundary is a hard one.
5. Need iconography? Pull from Lucide. Need a graphic? Use the brand
   sign or a placeholder rectangle — do not invent visuals.

---

_Generated as a design-system snapshot of [aejaca.com](https://www.aejaca.com) circa late 2025/early 2026._
