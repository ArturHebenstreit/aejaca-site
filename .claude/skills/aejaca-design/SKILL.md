---
name: aejaca-design
description: Use this skill to generate well-branded interfaces and assets for AEJaCA - a premium Polish studio combining handcrafted jewelry (AEJaCA Jewelry, amber/Playfair) with digital fabrication (AEJaCA sTuDiO, blue/Inter). Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping or production work.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, read the production section below first, then use this folder for tone, palette intent and imagery.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Read this before you write a single class name

This folder holds **two different systems**, and mixing them produces markup
that renders unstyled. Pick the right one first.

| Target | Use | Never use |
|---|---|---|
| Production code in `src/` of `aejaca-site` | `--ds-*` tokens and `[data-theme="light"]`, as described below | `brand-jewelry`, `brand-studio`, `--bg-page`, `--fg-1`, `--accent` |
| Standalone mock, artifact, slide, throwaway prototype | `colors_and_type.css` and the v2 kit in `ui_kits/` | anything that assumes the site build |

`brand-jewelry`, `brand-studio`, `--bg-page`, `--fg-1` and `--accent` appear
**nowhere in `src/`**. They belong to the v2 proposal (see `ui_kits/website/README.md`),
which was never implemented in the site. A production component built on them
falls back to no background and no color.

## Quick reference: production (`src/`)

- **Light is the default mode.** `src/i18n/ThemeContext.jsx` returns `"light"`
  unless the visitor explicitly saved `"dark"`, and writes `data-theme` onto
  `<html>`. There is no system-preference sniffing.
- **The CSS default is dark.** `:root` in `src/index.css` carries the dark
  palette, and `[data-theme="light"]` overrides it. Both directions exist,
  so never assume one canvas.
- **Semantic tokens** (both themes define the same names):
  `--ds-bg`, `--ds-bg-soft`, `--ds-text-1` to `--ds-text-4`, `--ds-border`,
  `--ds-border-hi`, `--ds-navbar-bg`, `--ds-navbar-bg-s`, `--ds-divider`,
  `--ds-amber-text`, `--ds-amber-hi`, `--ds-blue-text`, `--ds-blue-hi`.
- **Canvas:** dark `#0a0a0a` / `#171717`, light `#faf7f2` / `#f0ece4` (warm cream).
- **Accents flip per theme:** amber `#fbbf24` on dark, `#92400e` on light;
  blue `#60a5fa` on dark, `#1e40af` on light. Do not hardcode an accent hex.
- **Light mode does not use Tailwind `dark:` variants.** It works through an
  override list in `src/index.css` shaped `[data-theme="light"] .some-class { ... }`,
  and those overrides carry `!important`. A Tailwind class outside that list keeps
  its dark-canvas color and becomes invisible on cream. `scripts/check-light-theme.mjs`
  fails the build on light text (shades 50-300), dark panel backgrounds (700-950)
  and `hover:` states left without an override. Deliberate exceptions live in
  `scripts/light-theme-allow.json` and each needs a reason.
- **Static tokens** shared by both themes: `--border-amber`, `--border-blue`,
  `--shadow-amber-glow`, `--shadow-blue-glow`, `--ease-editorial`.

## Quick reference: brand language (both targets)

- **Two identities under one site:** AEJaCA Jewelry (amber, Playfair Display,
  editorial voice) and AEJaCA sTuDiO (blue, Inter, technical voice).
- **Hero pattern:** dark scrim over photo, white text, accent-light eyebrow
  (`#E6C580` jewelry, `#93C5FD` studio). The page below the hero follows the
  active theme.
- **Section eyebrows** are flanked by hairlines on light backgrounds. Signature element.
- **Cards:** `rounded-2xl` (16px), no shadow at rest, tinted shadow and
  `-translate-y-1` lift on hover. No glass morphism on light backgrounds.
- **Motion:** `cubic-bezier(0.16, 1, 0.3, 1)`, 300ms hover, 700ms reveal.
- **Icons:** Lucide only. In production import from `lucide-react`; in mocks use
  `ui_kits/website/Icon.jsx` to avoid the React package.
- **Emoji:** only inside calculator step pickers, never in marketing copy.
- **Brand wordmarks are stylized:** `AEJaCA`, `AEJaCA Jewelry`, `AEJaCA sTuDiO`.
  Preserve the lowercase `T`, `D`, `i` in sTuDiO.
- **No long dashes anywhere.** Project hard rule, enforced by `scripts/check-emdash.mjs`.

## Files

- `README.md` - full content/visual/iconography reference, written for the v2
  light system. Read it for voice, imagery and layout intent.
- `colors_and_type.css` - drop-in token file plus Google Fonts import. Mocks only.
- `assets/` - brand mark, heroes, favicons, OG imagery. Copy, don't redraw.
- `preview/` - specimen cards for the Design System tab.
- `ui_kits/website/` - v2 proposal, clickable but **not the shipped architecture**.
  Read its `README.md` before borrowing anything.
- `explorations/light-jewelry/` - the five-variant palette study the light
  direction was chosen from. Historical, kept because it explains the decision.
