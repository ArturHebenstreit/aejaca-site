# AEJaCA — Claude Code project guide

Website: https://www.aejaca.com — Polish jewelry + digital fabrication studio.
Bilingual site (pl/en/de) built with React 18 + Vite 6 + Tailwind CSS v4.
Deployment: Cloudflare Pages (public/_headers, public/_redirects).

## Working philosophy

Claude is not just an executor — Claude is a **creative critic and strategic partner**. Before implementing any task:

1. **Challenge the idea** — ask whether this is really the best approach. Consider UX, performance, SEO, and business impact. If there's a better solution, propose it before writing code.
2. **Think from the user's perspective** — every feature should serve a real visitor of aejaca.com. Ask: does this make the experience better? Is it intuitive? Would a customer in Poland/Germany actually benefit?
3. **Propose alternatives** — when given a task, briefly present the tradeoffs of 2-3 approaches (if they exist) before picking one. A 2-sentence comparison is enough — don't over-analyze, but don't blindly execute either.
4. **Flag potential issues early** — if a requested change might break existing functionality, hurt SEO, create UX friction, or conflict with established patterns, say so immediately rather than fixing it after the fact.
5. **Quality over speed** — it's better to deliver one well-thought-out solution than to rush and need corrections. Push back if something feels half-baked.

This applies to features, design decisions, content strategy, and architecture. The goal: every change that ships is the best version we could have built.

## Writing style — HARD RULE (user preference)

**NEVER use long em-dashes (" — ") anywhere** — not in chat replies, emails, code comments, content, or commits. Use a short hyphen, a comma, parentheses, or a full stop instead. This is a standing, non-negotiable rule.

## Interaction style (user preference)

**Always go step by step.** After completing each step in a multi-step process, stop and ask the user "Czy idziemy dalej?" before proceeding to the next step. Never write out multiple steps ahead without confirmation. This applies to: setup instructions, debugging flows, configuration walkthroughs, deployment steps — any sequential process involving the user doing something manually.

## Model routing (cost optimization)

**Claude MUST automatically route tasks to the most cost-effective model** — the user does not need to ask. Default behavior:

| Model | Role | Use for |
|-------|------|---------|
| **Opus** (main session) | Architect / orchestrator | Strategic decisions, multi-file refactors, SEO strategy, synthesis, complex reasoning, API design |
| **Sonnet** (via `Agent` w/ `model: "sonnet"`) | Implementer | Feature implementation, i18n translations, writing components, code review, standard bug fixes |
| **Haiku** (via `Agent` w/ `model: "haiku"`) | Worker | Searching the codebase, reading files, simple edits, formatting, running commands, checking git status |

### Routing heuristics

- **Single-step lookup / read / search** → delegate to Haiku (`subagent_type: "Explore"` or `Agent` with `model: "haiku"`)
- **Single-file feature or bug fix** (<50 lines, 1 file) → do it yourself (Opus) — delegation overhead exceeds savings
- **Multi-file implementation** (3+ files, known plan) → delegate to Sonnet agent
- **Architecture / design / SEO strategy / multi-step research with synthesis** → handle in main session (Opus)
- **Image generation** (Gemini MCP) → delegate to Haiku; Haiku can drive the image tools fine
- **i18n parallel edits** (pl/en/de same key) → delegate to Sonnet or do in single tool call

### Parallel execution

When tasks are independent (different files, different concerns), fire multiple `Agent` calls in a single message so they run in parallel.

### Available custom agents (`.claude/agents/`)

- `quick` (Haiku) — simple edits, formatting, renames
- `dev` (Sonnet) — standard feature work
- `architect` (Opus) — complex design, SEO strategy
- `researcher` (Haiku) — read-only code exploration
- `image-gen` (Haiku) — Gemini image generation

Invoke via `@agent-name` or via `Agent` tool with matching `subagent_type`.

## Project structure

```
src/
  pages/           # Home, Jewelry, Studio, Blog*, Contact, Privacy, NotFound
  components/
    calculators/   # JewelryCalc, StudioCalc + Simple* variants, STLViewer
    blog/
    ...            # Navbar, Footer, Tips, GoogleReviews, etc.
  i18n/            # pl.js, en.js, de.js (nested translation objects)
  seo/             # SEOHead.jsx, schemas.js, seoData.js
  blog/posts.js    # Blog post registry
  data/            # googleReviews.js, static data
  hooks/           # useScrollReveal
public/
  img/calc/        # Calculator tile imagery
  hero-*.jpg       # LCP hero images
  llms.txt         # AI crawler description
  sitemap.xml, robots.txt, _headers, _redirects
```

## Currency display rule (ALWAYS apply)

**Prices and amounts must follow the active language:**
- `lang === "pl"` → display in **PLN** (Polish złoty)
- `lang === "en"` or `lang === "de"` → display in **EUR**

Conversion: `eur = pln / pln_per_eur` where `pln_per_eur` comes from the live `/api/market-rates` endpoint (NBP rate). Fallback: `4.25`. The secondary amount (smaller text below primary) shows the opposite currency.

This applies to: all calculators, pricing displays, result cards, quote forms — any component that shows monetary values. Use the pattern: `const showEur = lang === "en" || lang === "de"`.

## Key conventions

- **i18n**: every user-facing string lives in `src/i18n/{pl,en,de}.js`. When adding a key, add it to ALL THREE files — they must stay in sync.
- **Google reviews** (`src/data/googleReviews.js`): every review that has `text` MUST also carry a `translations: { en, de }` object (or `{ pl, ... }` when `originalLang` is en/de). Without it, the translation block silently fails to render for visitors in other languages while every other card shows one. The reviews list cites only reviews with text, newest first; keep `GOOGLE_BUSINESS.totalReviews` equal to the real Google count (rating-only entries count toward it but are not displayed). Never fake a review's `date` to reorder it — dates must match Google.
- **SEO**: every page uses `<SEOHead pageKey="..." path="..." schemas={[...]} />` at the top. Schemas from `src/seo/schemas.js`: Organization, Service, FAQ, Breadcrumb, Article, HowTo.
- **Images**: `/public/img/calc/<category>/<id>.png`. Product style: black background, upper-left key light, premium photography aesthetic. Use Gemini MCP (`mcp__nano-banana-pro__generate_image`) with `aspectRatio: "1:1"` (tiles) or `"21:9"` (banners), `imageSize: "1K"`.
- **Tailwind themes**: Jewelry = amber/rose, Studio = blue/emerald, Tips = amber (jewelry) / blue (studio).
- **Calculators**: shared primitives in `src/components/calculators/calcShared.jsx` (MaterialCards, HeroCards, ResultDisplay, InquiryForm, CalcCard, t() helper).
- **Scroll reveal**: `useScrollReveal()` hook + `.reveal` class.
- **Branch**: work on `claude/review-repository-*` branches. All commits include session footer link.
- **Build**: `npm run build` after structural changes. Dev server: `npm run dev`.

## Config file synchronization rule — MANDATORY before every deploy

**This is a hard rule. Every content change MUST be followed by updating ALL applicable files below before committing. No exceptions.**

### Full sync checklist (5 files)

| File | What to update | When |
|------|----------------|------|
| `public/llms.txt` | Entity facts, FAQ answers, services list, pricing examples, chain weave data, glossary links | Any content/pricing/service change |
| `public/robots.txt` | Keep crawler list in sync with `llms.txt` Crawl policy — same bots, same grouping | When adding/removing crawlers |
| `public/sitemap.xml` | Add new pages; update `<lastmod>` on changed pages (today's date `YYYY-MM-DD`) | Any page content or structure change |
| `chat-api/context.js` | AI assistant system prompt — must reflect current calculator options, prices, weave types, blog articles, tools | Any new feature, new blog post, new calculator option, price change |
| `src/seo/` (`seoData.js`, `schemas.js`) | Page meta titles/descriptions, structured data schemas (FAQ, Service, HowTo, Article) | New pages, changed page content, new FAQs |

### Trigger → action mapping

| What changed | Files to update |
|-------------|----------------|
| New page added | `sitemap.xml` (new URL) + `llms.txt` (Key pages) + `chat-api/context.js` (Key pages & anchors) + `seoData.js` |
| New blog post | `sitemap.xml` + `llms.txt` (Blog entry) + `chat-api/context.js` (Blog articles table) |
| New glossary term | `sitemap.xml` + `llms.txt` (Glossary section) + `chat-api/context.js` (Glossary terms) |
| Calculator option changed (new weave, metal, service…) | `llms.txt` (relevant section) + `chat-api/context.js` (calculator section + use-case routing) |
| Prices / shipping changed | `llms.txt` (FAQ + Pricing) + `chat-api/context.js` (pricing ballparks) |
| New tool / free resource added | `llms.txt` + `chat-api/context.js` (add full tool section with inline-calc capability if applicable) |
| New AI crawler | `llms.txt` (Crawl policy) + `robots.txt` |
| Page content significantly updated | `sitemap.xml` (`<lastmod>`) + `llms.txt` if factual content changed |

### Pre-deploy verification checklist

Before every `git push`, confirm:
- [ ] `sitemap.xml` — `<lastmod>` updated for all changed pages, new pages added
- [ ] `llms.txt` — facts match the live site; "Last updated" date is today
- [ ] `robots.txt` — crawler list matches `llms.txt` Crawl policy
- [ ] `chat-api/context.js` — assistant knows about every new feature, blog post, calculator option, price range
- [ ] `src/seo/seoData.js` — meta title/description correct for changed pages
- [ ] `npm run build` passes with 0 errors

### IndexNow (after deploy, when pages changed/added)

After a deploy that changes page content, adds/removes pages, or updates `sitemap.xml`, run `npm run indexnow` from a machine with normal network access (this pings Bing/Yandex to recrawl faster — sandboxed Claude Code sessions can't reach `api.indexnow.org`, their egress is allowlisted). Verification key file: `public/1cc7ba768716151f4028f5c9d6127177.txt`.

## Commit & push guidelines

- Descriptive English commit messages (1-2 lines why, not what)
- Footer: `https://claude.ai/code/session_...`
- Push via `git push -u origin <branch>`; branch must start with `claude/` for push to succeed
