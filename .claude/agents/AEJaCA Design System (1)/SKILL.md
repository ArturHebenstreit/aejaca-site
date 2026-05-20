---
name: aejaca-design
description: Use this skill to generate well-branded interfaces and assets for AEJaCA — a premium Polish studio combining handcrafted jewelry (AEJaCA Jewelry, amber/Playfair) with digital fabrication (AEJaCA sTuDiO, blue/Inter). Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping or production work.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

- **Two light brand themes:**
  - **AEJaCA Jewelry** — cream `#F8F4ED`, champagne `#A87425`, Playfair Display
  - **AEJaCA sTuDiO** — blueprint `#F4F6F9`, cobalt `#2563EB`, Inter
- **Night mode alternate** — flip any subtree to the original dark palette by setting `data-theme="dark"` on `<html>` or an ancestor element.
- **Brand classes:** wrap content in `<body class="brand-jewelry">` or `<body class="brand-studio">`. All CSS variables (`--bg-page`, `--fg-1`, `--accent`, etc) resolve automatically.
- **Hero pattern:** dark scrim over photo → white text + accent-light eyebrow (#E6C580 / #93C5FD). Below hero: light page + dark text.
- **Section eyebrows** are flanked by hairlines on light themes — `— ARTISTIC & LUXURY —`. This is a signature element.
- **Cards:** `rounded-2xl` (16px), double-layer shadow, no shadow at rest, lift `-translate-y-1` on hover with accent-tinted border. No glass morphism on light themes.
- **Motion:** `cubic-bezier(0.16, 1, 0.3, 1)` — editorial ease, 300ms hover, 700ms reveal.
- **Icons:** Lucide only. Use `Icon.jsx` from the UI kit for inline SVGs without the React package.
- **Brand wordmarks are stylized:** `AEJaCA`, `AEJaCA Jewelry`, `AEJaCA sTuDiO` — preserve the lowercase `T`, `D`, `i` in sTuDiO.

## Files

- `README.md` — full content/visual/iconography reference. Start here.
- `colors_and_type.css` — drop-in token file + Google Fonts import.
- `assets/` — brand mark, heroes, favicons, OG imagery. Copy, don't redraw.
- `preview/` — small specimen cards that populate the Design System tab.
- `ui_kits/website/` — clickable site recreation with reusable JSX components.
