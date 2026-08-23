# AEJaCA - Claude Code project guide

Website: https://www.aejaca.com - Polish jewelry + digital fabrication studio.
Bilingual site (pl/en/de) built with React 18 + Vite 6 + Tailwind CSS v4.
Deployment: Cloudflare Pages (public/_headers, public/_redirects).

## Shared project protocol - read first

Before planning or editing, read:

1. `PROJECT_RULES.md` - shared business, quality and collaboration rules.
2. `MDs/README.md` - documentation map and source-of-truth hierarchy.
3. `MDs/WORKBOARD.md` - active owners and reserved files.
4. The domain documents selected by `MDs/README.md` for the task.

When Codex works in parallel, Claude uses a separate worktree and a `claude/*`
branch. Reserve files in the workboard before editing them. Do not edit files
reserved by Codex. Durable decisions go to `MDs/decisions/`; completed or paused
work is transferred with `MDs/HANDOFF_TEMPLATE.md`. These shared files govern
cross-model coordination. The remaining sections of this file govern Claude's
own interaction, delegation and tooling behavior.

## Working philosophy

Claude is not just an executor - Claude is a **creative critic and strategic partner**. Before implementing any task:

1. **Challenge the idea** - ask whether this is really the best approach. Consider UX, performance, SEO, and business impact. If there's a better solution, propose it before writing code.
2. **Think from the user's perspective** - every feature should serve a real visitor of aejaca.com. Ask: does this make the experience better? Is it intuitive? Would a customer in Poland/Germany actually benefit?
3. **Propose alternatives** - when given a task, briefly present the tradeoffs of 2-3 approaches (if they exist) before picking one. A 2-sentence comparison is enough - don't over-analyze, but don't blindly execute either.
4. **Flag potential issues early** - if a requested change might break existing functionality, hurt SEO, create UX friction, or conflict with established patterns, say so immediately rather than fixing it after the fact.
5. **Quality over speed** - it's better to deliver one well-thought-out solution than to rush and need corrections. Push back if something feels half-baked.

This applies to features, design decisions, content strategy, and architecture. The goal: every change that ships is the best version we could have built.

## Writing style - HARD RULE (user preference)

**NEVER use long em-dashes (" - ") anywhere** - not in chat replies, emails, code comments, content, or commits. Use a short hyphen, a comma, parentheses, or a full stop instead. This is a standing, non-negotiable rule.

Pilnuje tego `scripts/check-emdash.mjs` i **wywala build**, więc złamanie zasady zatrzymuje deploy. Wyłączone są dwa katalogi, oba z tego samego powodu: `n8n-backup` (zrzut z żywej instancji) i pliki obcych skilli w `.claude/skills/` (kopie 1:1 cudzych repozytoriów). Zasada dotyczy tego, co **piszemy**, a nie tego, co wciągamy w niezmienionej postaci. `ORIGIN.md` przy każdym skillu piszemy sami, więc podlega zasadzie normalnie.

## Interaction style (user preference)

**Always go step by step.** After completing each step in a multi-step process, stop and ask the user "Czy idziemy dalej?" before proceeding to the next step. Never write out multiple steps ahead without confirmation. This applies to: setup instructions, debugging flows, configuration walkthroughs, deployment steps - any sequential process involving the user doing something manually.

## Model routing (cost optimization)

### Delegowanie - HARD RULE (polecenie właściciela, 2026-08-16, obowiązuje do odwołania)

**Proste zadania zlecaj agentom. Ty jesteś mózgiem.** Sesja główna trzyma
decyzje, diagnozę i pomiar, a wykonanie idzie w dół: wyszukiwanie, edycje
jednoplikowe, i18n, powtarzalne poprawki, sprawdzanie stanu. Nie rób ręcznie
tego, co da się opisać agentowi w trzech zdaniach.

Doprecyzowanie właściciela (2026-08-16): kryterium jest **stosunek jakości do
zużytych tokenów**. Sesja główna wykonuje zadanie sama tylko wtedy, gdy zrobi
je taniej niż zlecenie i kontrola agenta razem wzięte, albo gdy zadanie leży
w obszarze wysokiego ryzyka błędnej diagnozy (geometria kreatora, wycena).

Agent dostaje w zleceniu trzy rzeczy, inaczej odda pracę do wyrzucenia:
zakaz długich myślników, wymóg `npm run sync:pricing` po dotknięciu
`src/geometry`, i nazwę gałęzi. Wynik zawsze sprawdzamy sami, bo agent
raportuje własną pracę i bywa w tym optymistą.

**Claude MUST automatically route tasks to the most cost-effective model** - the user does not need to ask. Default behavior:

| Model | Role | Use for |
|-------|------|---------|
| **Opus** (main session) | Architect / orchestrator | Strategic decisions, multi-file refactors, SEO strategy, synthesis, complex reasoning, API design |
| **Sonnet** (via `Agent` w/ `model: "sonnet"`) | Implementer | Feature implementation, i18n translations, writing components, code review, standard bug fixes |
| **Haiku** (via `Agent` w/ `model: "haiku"`) | Worker | Searching the codebase, reading files, simple edits, formatting, running commands, checking git status |

### Routing heuristics

- **Single-step lookup / read / search** → delegate to Haiku (`subagent_type: "Explore"` or `Agent` with `model: "haiku"`)
- **Single-file feature or bug fix** (<50 lines, 1 file) → do it yourself (Opus) - delegation overhead exceeds savings
- **Multi-file implementation** (3+ files, known plan) → delegate to Sonnet agent
- **Architecture / design / SEO strategy / multi-step research with synthesis** → handle in main session (Opus)
- **Image generation** (Gemini MCP) → delegate to Haiku; Haiku can drive the image tools fine
- **i18n parallel edits** (pl/en/de same key) → delegate to Sonnet or do in single tool call

### Parallel execution

When tasks are independent (different files, different concerns), fire multiple `Agent` calls in a single message so they run in parallel.

### Available custom agents (`.claude/agents/`)

- `quick` (Haiku) - simple edits, formatting, renames
- `dev` (Sonnet) - standard feature work
- `architect` (Opus) - complex design, SEO strategy
- `researcher` (Haiku) - read-only code exploration
- `image-gen` (Haiku) - Gemini image generation

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

This applies to: all calculators, pricing displays, result cards, quote forms - any component that shows monetary values. Use the pattern: `const showEur = lang === "en" || lang === "de"`.

## Linkowanie narzędzi - HARD RULE

**Jeżeli treść dotyka tematu, który mamy obsłużony narzędziem, ta treść MUSI do niego prowadzić.** Dotyczy wpisów blogowych, haseł słownika, kalkulatorów, sklepu, kart usług i strony B2B. Zbudowane i nielinkowane narzędzie nie istnieje dla czytelnika.

Mapowanie leży w **jednym pliku**: `src/data/toolLinks.js` (`TOOLS_BY_POST`, `TOOLS_BY_TERM`, `audience`). Renderuje je komponent `src/components/ToolLinks.jsx`, używany przez `BlogPost`, `GlossaryTerm`, `RelatedContent` (sklep i karty usług), `B2B`, `Jewelry` i `Studio`.

**Dodając nowe narzędzie:** dopisz je do `TOOL_LINKS`, ustaw `audience` (`buyer` / `maker` / `both`), a potem przypisz do pasujących wpisów i haseł. To jedna edycja, nie obchodzenie czterdziestu siedmiu plików.

`audience` rozdziela odbiorców i trzeba to uszanować: kupujący nie potrzebuje kalkulatora blanku obrączki ani tabeli parametrów lasera, ale na stronie B2B to są najważniejsze pozycje.

**Nie doklejaj narzędzia na siłę.** Wpisy o projektowaniu z AI i o wyposażeniu pracowni celowo nie mają przypisanych narzędzi, bo żadne im nie odpowiada. Wypełniacz szkodzi bardziej niż brak.

## Key conventions

- **i18n**: every user-facing string lives in `src/i18n/{pl,en,de}.js`. When adding a key, add it to ALL THREE files - they must stay in sync.
- **Google reviews** (`src/data/googleReviews.js`): every review that has `text` MUST also carry a `translations: { en, de }` object (or `{ pl, ... }` when `originalLang` is en/de). Without it, the translation block silently fails to render for visitors in other languages while every other card shows one. The reviews list cites only reviews with text, newest first; keep `GOOGLE_BUSINESS.totalReviews` equal to the real Google count (rating-only entries count toward it but are not displayed). Never fake a review's `date` to reorder it - dates must match Google.
- **SEO**: every page uses `<SEOHead pageKey="..." path="..." schemas={[...]} />` at the top. Schemas from `src/seo/schemas.js`: Organization, Service, FAQ, Breadcrumb, Article, HowTo.
- **Images**: `/public/img/calc/<category>/<id>.png`. Product style: black background, upper-left key light, premium photography aesthetic. Use Gemini MCP (`mcp__nano-banana-pro__generate_image`) with `aspectRatio: "1:1"` (tiles) or `"21:9"` (banners), `imageSize: "1K"`.
- **Tailwind themes**: Jewelry = amber/rose, Studio = blue/emerald, Tips = amber (jewelry) / blue (studio).
- **Calculators**: shared primitives in `src/components/calculators/calcShared.jsx` (MaterialCards, HeroCards, ResultDisplay, InquiryForm, CalcCard, t() helper).
- **Geometria kreatora pierścionków** (`src/geometry/ring/`): **przeczytaj `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` PRZED każdą zmianą bryły.** Plik zbiera reguły warsztatowe, pułapki jądra manifold-3d, klasę awarii cichych (objętość i topologia poprawne, wyrób nie do użycia) i dziennik wniosków. Buduj z wiedzy, nie z eksperymentu.
- **Routing / prerender**: there is no SPA catch-all in `public/_redirects`. Every route must be prerendered to its own `index.html`, otherwise Cloudflare Pages serves a real 404. When adding a page, add the route to `src/main.jsx`, `src/entry-server.jsx` AND `STATIC_ROUTES` in `scripts/prerender.mjs`. The prerender script cross-checks those lists and fails the build on drift; blog slugs and glossary IDs are derived automatically from `POSTS_META` / `GLOSSARY`, so they need no manual entry. `dist/404.html` is generated from the `NotFound` component. **Nową stronę deklaruj przez `strona(() => import(...))`, nie przez `lazy(...)`.** Zwykłe `lazy` znaczy, że hydratacja rusza przed fragmentem trasy, React porzuca prerender i rysuje stronę od nowa. Pilnuje tego `scripts/check-lazy-hydration.mjs`, mierzy `scripts/check-hydration-race.cjs`.
- **Skille projektu** (`.claude/skills/`): jadą z repozytorium, więc działają w każdej sesji, także zdalnej. Każdy ma obok `ORIGIN.md` ze źródłem, licencją, datą pobrania i wynikiem przeglądu bezpieczeństwa. **Dodając skill z zewnątrz: przeczytaj go w całości, załóż `ORIGIN.md`, dopiero potem commituj.** Skill to instrukcja, którą agent wykonuje, więc obcy skill jest obcym kodem.
  - `find-skills` - proponuje skille pasujące do repozytorium, sam niczego nie instaluje.
  - `playwright-skill` - steruje przeglądarką: klika, wypełnia, robi zrzuty. **Zobaczyć podgląd u siebie jest tańsze niż czytać kod**: tak znalazłem wiszące nogi krap po czterech rundach czytania. W tym środowisku wymaga `PW_HEADLESS=true` i `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, i **nigdy `npm run setup`**.
  - `browser-automation` - warstwa głębsza: przechwytywanie ruchu strony, konsola, profilowanie, CDP. Do weryfikowania hipotez o zachowaniu serwisów.
  - **Sieć w środowisku zdalnym sięga tylko `localhost` i wąskiej białej listy.** Przeglądanie internetu działa dopiero na maszynie lokalnej. Szczegóły w `ORIGIN.md` obu skilli.
  - `task-observer` - zbiera wnioski z sesji. **Log jest przypięty do `MDs/skill-observations/`**, a nie do domyślnego `~/.claude/projects/<id>/`: to środowisko jest ulotne i domyślna lokalizacja znika po sesji. W repozytorium log jest wersjonowany razem z resztą wiedzy o projekcie.
- **Scroll reveal**: `useScrollReveal()` hook + `.reveal` class.
- **Branch**: work on `claude/review-repository-*` branches. All commits include session footer link.
- **Build**: `npm run build` after structural changes. Dev server: `npm run dev`.

## Config file synchronization rule - MANDATORY before every deploy

**This is a hard rule. Every content change MUST be followed by updating ALL applicable files below before committing. No exceptions.**

### Full sync checklist (6 files)

| File | What to update | When |
|------|----------------|------|
| `public/llms.txt` | Entity facts, FAQ answers, services list, pricing examples, chain weave data, glossary links | Any content/pricing/service change |
| `public/robots.txt` | Keep crawler list in sync with `llms.txt` Crawl policy - same bots, same grouping | When adding/removing crawlers |
| `public/sitemap.xml` | Add new pages; update `<lastmod>` on changed pages (today's date `YYYY-MM-DD`) | Any page content or structure change |
| `chat-api/context.js` | AI assistant system prompt - must reflect current calculator options, prices, weave types, blog articles, tools | Any new feature, new blog post, new calculator option, price change |
| `src/seo/` (`seoData.js`, `schemas.js`) | Page meta titles/descriptions, structured data schemas (FAQ, Service, HowTo, Article) | New pages, changed page content, new FAQs |
| `MDs/AEJaCA_Brand_Reference.md` | **Kompletny dokument referencyjny marki** - ceny, oferta, kalkulatory, narzędzia, SEO, equipment, opinie, copywriting. Update the relevant section(s) and set the "Wygenerowano" date at the top. | Any change to: offer, prices, equipment, tools, calculators, copy, SEO strategy, shipping, reviews count |

### Trigger → action mapping

| What changed | Files to update |
|-------------|----------------|
| New page added | `sitemap.xml` (new URL) + `llms.txt` (Key pages) + `chat-api/context.js` (Key pages & anchors) + `seoData.js` + `Brand_Reference.md` (section 8 SEO + relevant offer section) |
| New blog post | `sitemap.xml` + `llms.txt` (Blog entry) + `chat-api/context.js` (Blog articles table) + `Brand_Reference.md` (section 8 Blog) |
| New glossary term | `sitemap.xml` + `llms.txt` (Glossary section) + `chat-api/context.js` (Glossary terms) + `Brand_Reference.md` (section 8 Glossary) |
| Calculator option changed (new weave, metal, service…) | `llms.txt` (relevant section) + `chat-api/context.js` (calculator section + use-case routing) + `Brand_Reference.md` (section 6) |
| Prices / shipping changed | `llms.txt` (FAQ + Pricing) + `chat-api/context.js` (pricing ballparks) + `Brand_Reference.md` (section 3/4/5/10) |
| New tool / free resource added | `llms.txt` + `chat-api/context.js` (add full tool section with inline-calc capability if applicable) + `Brand_Reference.md` (section 7) |
| New AI crawler | `llms.txt` (Crawl policy) + `robots.txt` + `Brand_Reference.md` (section 8 Crawlers) |
| Page content significantly updated | `sitemap.xml` (`<lastmod>`) + `llms.txt` if factual content changed + `Brand_Reference.md` if factual content changed |
| New equipment / machine | `About.jsx` + `Brand_Reference.md` (section 4 Equipment) |
| Zmiana geometrii kreatora (`src/geometry/ring/`) | `npm run sync:pricing` + `WORKER_VERSION` w `src/workers/ringGenerator.worker.js` + **wpis w dzienniku na końcu `MDs/AEJaCA_Geometria_Kreatora_Zasady.md`** (co było, co jest, czego się nauczyliśmy) |
| New review (Google) | `googleReviews.js` + `Brand_Reference.md` (section 11, update total count) |

### Pre-deploy verification checklist

Before every `git push`, confirm:
- [ ] `sitemap.xml` - `<lastmod>` updated for all changed pages, new pages added
- [ ] `llms.txt` - facts match the live site; "Last updated" date is today
- [ ] `robots.txt` - crawler list matches `llms.txt` Crawl policy
- [ ] `chat-api/context.js` - assistant knows about every new feature, blog post, calculator option, price range
- [ ] `src/seo/seoData.js` - meta title/description correct for changed pages
- [ ] `MDs/AEJaCA_Brand_Reference.md` - relevant sections updated, "Wygenerowano" date updated
- [ ] `npm run build` passes with 0 errors

### IndexNow (after deploy, when pages changed/added)

After a deploy that changes page content, adds/removes pages, or updates `sitemap.xml`, run `npm run indexnow` from a machine with normal network access (this pings Bing/Yandex to recrawl faster - sandboxed Claude Code sessions can't reach `api.indexnow.org`, their egress is allowlisted). Verification key file: `public/1cc7ba768716151f4028f5c9d6127177.txt`.

## Commit & push guidelines

- Descriptive English commit messages (1-2 lines why, not what)
- Footer: `https://claude.ai/code/session_...`
- Push via `git push -u origin <branch>`; branch must start with `claude/` for push to succeed

### Kto scala do `main` - HARD RULE (user preference)

**Claude pracuje wyłącznie na gałęziach `claude/*` i pushuje tam.** Scalanie do `main`
oraz kontrolę nad tym, co trafia na produkcję, prowadzi użytkownik. Claude scala do `main`
albo tworzy pull request **tylko na wyraźną prośbę**, nigdy z własnej inicjatywy.

Po zakończeniu zadania Claude mówi, co jest gotowe do scalenia, i na tym kończy.

Uwaga na pułapkę, w którą już raz wpadłem: merge potrafi pojawić się kilkanaście sekund
po pushu i wygląda to jak automat. To użytkownik scala ręcznie. Pole `merged_by` w PR
rozstrzyga, więc czytaj je, zamiast wnioskować z czasu.
