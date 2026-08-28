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

Shared writing rule: see `PROJECT_RULES.md`, section `Twarde niezmienniki`.

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

Zasady walutowe: patrz `PROJECT_RULES.md`, sekcja `Waluta`.

## Linkowanie narzędzi - HARD RULE

Zasady linkowania narzędzi: patrz `PROJECT_RULES.md`, sekcja `Linkowanie narzędzi`.

## Key conventions

Wspólne konwencje inżynierskie: patrz `PROJECT_RULES.md`, sekcja `Konwencje inżynierskie`.

### Rzeczy, których build pilnuje, a łatwo o nich zapomnieć (od 2026-08-27)

- **Odnośnik wewnętrzny pisze się przez `Link` z `src/i18n/nav.jsx`, nigdy przez
  `<a href="/...">`.** Każdy język stoi pod własnym adresem (`/studio/`,
  `/en/studio/`, `/de/studio/`), a `Link` dokłada prefiks sam. Zwykłe `<a>`
  wyrzuca Niemca z powrotem na polską wersję i nic przy tym nie wygląda na
  zepsute. Kiedy odnośnik musi być zwykłym `<a>` (nowa karta), użyj
  `sciezkaJezyka(adres, lang)`. Prerender czyta wszystkie strony `/en/` i `/de/`
  i pada, jeśli choć jeden odnośnik wychodzi z języka. Trasy: `src/routes.js`,
  jedna lista dla przeglądarki, prerenderu i mapy witryny. Decyzja: ADR-0023.

- **Obraz wstawia się przez `<Obraz>` (kafelki) albo `<HeroObraz>` (pierwszy
  ekran), nie przez `<img>`.** Nowy plik graficzny wymaga `npm run img:cards`
  albo `npm run img:hero`, inaczej build pada na bramce. Bramka jest, bo brak
  wariantu jest cichy: `srcset` wskazujący nieistniejący plik po prostu wraca do
  oryginału i nikt nie widzi, że coś przestało działać. Decyzja: ADR-0024.

- **Nic zależnego od chwili oglądania nie trafia do JSX.** `Date.now()` i
  `new Date()` w renderze dają inną wartość przy buildzie i inną u klienta,
  React uznaje to za rozjazd i wyrzuca cały prerender. Pilnuje tego
  `scripts/check-czas-w-renderze.mjs`. To samo dotyczy `Intl.DisplayNames` i
  `localeCompare`: dane ICU w Node i w przeglądarce bywają z różnych wersji
  (nazwy krajów: `src/data/countryNames.js`). Decyzja: ADR-0022.

- **Najmniejsze pismo w serwisie to 12 px** (`text-xs`). Bez wyjątków, pilnuje
  `scripts/check-drobny-tekst.mjs`. Nie mieści się? Poszerz kratkę albo skróć
  napis.

- **Słownik z `useLanguage()` jest obiektem, nie funkcją: `t.nav.currency`, nie
  `t("nav.currency")`.** Zapis funkcyjny, znany z bibliotek i18n, przechodzi
  build i lint, a wywala się w przeglądarce. Wyjątek leci w trakcie renderu,
  więc React nie gasi jednego napisu, tylko odmontowuje całe drzewo: klient
  widzi biały ekran. Pilnuje `scripts/check-slownik-jako-funkcja.mjs`. Uwaga na
  drugie `t`: pomocnik `t(pl, en, de)` we wpisach blogowych i `t(etykieta, lang)`
  w kalkulatorach **ma** być funkcją, dlatego bramka patrzy na to, co naprawdę
  wyszło z `useLanguage()` w danym pliku.

- **Każdy napis docierający do człowieka idzie ze słownika, także niewidoczny.**
  `aria-label` wpisany wprost jest zawsze w jednym języku, czyli dla dwóch
  trzecich odwiedzających w złym. Pilnuje `scripts/check-nazwy-dostepne.mjs`,
  łapie też nazwę sklejoną z szablonu. Wyjątek: nazwa języka zostaje w swoim
  języku ("Deutsch", nie "niemiecki"). Decyzja: ADR-0025.

- **Kod za kliknięciem jest poza zasięgiem prerenderu i przeglądu stron.**
  Prerender rysuje 300 stron, `scripts/audit-pages.mjs` je ogląda, ale obie
  siatki widzą tylko pierwszy ekran. Lista wyboru języka pojawia się dopiero po
  kliknięciu i przez dwa dni stała zepsuta przy zielonym buildzie i zielonym
  przeglądzie. Cokolwiek otwiera się dopiero po interakcji, potrzebuje własnego
  sprawdzianu: wzór to `scripts/check-menu-jezyka.mjs` (`npm run check:jezyk`),
  który naprawdę klika, w dwóch szerokościach ekranu. Nie stoi w `npm run build`,
  bo build leci na Cloudflare Pages, gdzie nie ma przeglądarki.
- **Skille projektu** (`.claude/skills/`): jadą z repozytorium, więc działają w każdej sesji, także zdalnej. Każdy ma obok `ORIGIN.md` ze źródłem, licencją, datą pobrania i wynikiem przeglądu bezpieczeństwa. **Dodając skill z zewnątrz: przeczytaj go w całości, załóż `ORIGIN.md`, dopisz nazwę katalogu do `SKILLE_ZEWNETRZNE` w `scripts/check-emdash.mjs`, dopiero potem commituj.** Bez tego kroku build pada na cudzej pisowni, bo reguła długich myślników jest bramką: obowiązuje nasz tekst, a nie tekst, który tylko u nas leży (`ORIGIN.md` zostaje objęty regułą, bo to już nasze pisanie). Skill to instrukcja, którą agent wykonuje, więc obcy skill jest obcym kodem.
  - `find-skills` - proponuje skille pasujące do repozytorium, sam niczego nie instaluje.
  - `frontend-design` - wiedza o projektowaniu interfejsów (Anthropic, Apache 2.0). Plan przed kodem: tokeny koloru, kroje do 2+ ról, układ, jeden element sygnaturowy, a potem krytyka tego planu. Ma osobny rozdział o pisaniu w interfejsie i listę wyglądów, po których poznaje się projekt zrobiony przez AI. **Na aejaca.com `aejaca-design` wygrywa**: marka jest ustalona i spójna na stu prerenderowanych stronach, więc ten skill służy rzeczom nowym, a nie przemalowywaniu tego, co stoi.
  - `playwright-skill` - steruje przeglądarką: klika, wypełnia, robi zrzuty. **Zobaczyć podgląd u siebie jest tańsze niż czytać kod**: tak znalazłem wiszące nogi krap po czterech rundach czytania. W tym środowisku wymaga `PW_HEADLESS=true` i `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, i **nigdy `npm run setup`**.
  - `browser-automation` - warstwa głębsza: przechwytywanie ruchu strony, konsola, profilowanie, CDP. Do weryfikowania hipotez o zachowaniu serwisów.
  - **Sieć w środowisku zdalnym sięga tylko `localhost` i wąskiej białej listy.** Przeglądanie internetu działa dopiero na maszynie lokalnej. Szczegóły w `ORIGIN.md` obu skilli.
  - `task-observer` - zbiera wnioski z sesji. **Log jest przypięty do `MDs/skill-observations/`**, a nie do domyślnego `~/.claude/projects/<id>/`: to środowisko jest ulotne i domyślna lokalizacja znika po sesji. W repozytorium log jest wersjonowany razem z resztą wiedzy o projekcie.
- **Scroll reveal**: `useScrollReveal()` hook + `.reveal` class.
- **Branch**: work on `claude/review-repository-*` branches. All commits include session footer link.
- **Build**: `npm run build` after structural changes. Dev server: `npm run dev`.

## Config file synchronization rule - MANDATORY before every deploy

Pełne zasady synchronizacji: patrz `PROJECT_RULES.md`, sekcja `Config file synchronization rule`.

## Commit & push guidelines

- Descriptive English commit messages (1-2 lines why, not what)
- Footer: `https://claude.ai/code/session_...`
- Push via `git push -u origin <branch>`; branch must start with `claude/` for push to succeed

### Kto scala do `main` - HARD RULE (user preference)

Zasada integracji z `main`: patrz `PROJECT_RULES.md`, sekcja `Zasady pracy rownoleglej`.
