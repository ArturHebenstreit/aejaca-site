---
name: aejaca-design
description: Use this skill to generate well-branded interfaces and assets for AEJaCA — a premium Polish studio combining handcrafted jewelry (AEJaCA Jewelry, amber/Playfair) with digital fabrication (AEJaCA sTuDiO, blue/Inter). Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping or production work.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

- **Dark canvas:** `#0a0a0a` everywhere. No light mode.
- **Two brand identities under one site:**
  - **AEJaCA Jewelry** — amber `#f59e0b`, Playfair Display, editorial voice.
  - **AEJaCA sTuDiO** — blue `#3b82f6`, Inter, technical voice.
- **Shared chrome** uses neutral whites with low opacity for borders/dividers.
- **Cards:** `rounded-2xl` (16px), no shadow at rest, tinted shadow on hover, `-translate-y-1` lift.
- **Motion:** `cubic-bezier(0.16, 1, 0.3, 1)` — editorial ease.
- **Icons:** Lucide only. Stroke 1.5–2px. Inherit text color.
- **Emoji:** only inside calculator step pickers, never in marketing copy.
- **Brand wordmarks are stylized:** `AEJaCA`, `AEJaCA Jewelry`, `AEJaCA sTuDiO` — preserve the lowercase `T`, `D`, `i` in sTuDiO.

## Files

- `README.md` — full content/visual/iconography reference. Start here.
- `colors_and_type.css` — drop-in token file + Google Fonts import.
- `assets/` — brand mark, heroes, favicons, OG imagery. Copy, don't redraw.
- `preview/` — small specimen cards that populate the Design System tab.
- `ui_kits/website/` — clickable site recreation with reusable JSX components.
