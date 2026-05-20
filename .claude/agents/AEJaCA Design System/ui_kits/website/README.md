# AEJaCA Website — UI Kit

A clickable recreation of the AEJaCA marketing site (`aejaca.com`) using
the design-system tokens. Built as React-via-Babel components served
from a single `index.html`.

## What's here

- `index.html` — interactive prototype of the home page. Includes a
  mock language switcher (PL/EN/DE) and the Jewelry/Studio navigation.
- `tokens.css` — local copy of the design system tokens, included for
  portability.
- Components (loaded as `<script type="text/babel">` files):
  - `Navbar.jsx` — fixed translucent nav with brand dropdowns + language
    picker.
  - `Footer.jsx` — newsletter block, quick links, social icons, market
    rates ticker.
  - `GatewayTile.jsx` — 3:4 photographic gateway card (Jewelry / sTuDiO).
  - `QuickQuoteCard.jsx` — the dual-brand calculator entry cards.
  - `GlassFeatureCard.jsx` — `.glass-amber` / `.glass-blue` Two Worlds
    panels with bullet feature lists.
  - `RatingPill.jsx` — Google reviews ★4.9 · 127 pill.
  - `GradientDivider.jsx` — the signature 1 px white-to-transparent
    section break.
  - `Eyebrow.jsx` — uppercase eyebrow tag.
  - `Icon.jsx` — minimal Lucide-style inline SVG icons we use across
    the kit (no runtime dependency on lucide-react).

## What's NOT here

- Real form submission, real i18n strings beyond the home page, real
  blog/CMS content, or the dozen specialised calculators (laser
  matrix, ring sizing, jewelry estimator, etc) that ship on the live
  site. This kit is cosmetic; if you need that depth, lift it from
  [`ArturHebenstreit/aejaca-site`](https://github.com/ArturHebenstreit/aejaca-site).

## Usage

Open `index.html` in any modern browser. Edit a component file, refresh.
Each component exports to `window` so the host `index.html` can compose
them — see the bottom of each `.jsx` file.
