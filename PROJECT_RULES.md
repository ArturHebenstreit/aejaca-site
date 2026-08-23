# AEJaCA - wspolne reguly projektu

Ten dokument jest wspolnym zrodlem regul dla Claude Code, Codex i innych agentow.
Instrukcje narzedziowe pozostaja w `CLAUDE.md` i `AGENTS.md`, ale nie moga zmieniac
ponizszych zasad biznesowych bez zaakceptowanej decyzji ADR.

## 1. Hierarchia zrodel prawdy

W razie sprzecznosci obowiazuje kolejnosc:

1. Jawna, najnowsza decyzja wlasciciela projektu.
2. Zaakceptowany ADR w `MDs/decisions/`.
3. Regula domenowa oznaczona jako aktualna w `MDs/README.md`.
4. `MDs/AEJaCA_Brand_Reference.md` dla faktow o marce, ofercie i cenach.
5. Aktualny kod i jego testy dla rzeczywistego zachowania systemu.
6. Plany i audyty historyczne, wylacznie jako kontekst.

Sprzecznosci trzeba nazwac i rozstrzygnac. Nie wolno wybierac wygodniejszej wersji
bez zapisania powodu.

## 2. Zasady pracy rownoleglej

- Kazdy model pracuje w osobnym worktree i na osobnej galezi.
- Jeden aktywny wlasciciel na plik. Wlasnosc zapisuje `MDs/WORKBOARD.md`.
- Wspolny problem dzielimy wedlug odpowiedzialnosci, na przyklad API, interfejs,
  testy, dokumentacja. Nie dzielimy go przypadkowo po kilku liniach tego samego pliku.
- Agent spoza zadania moze czytac i recenzowac zastrzezony plik, ale go nie edytuje.
- Integrator scala dopiero po niezaleznym review i po przejsciu wymaganych kontroli.
- Ustalenia z rozmowy staja sie obowiazujace dopiero po zapisaniu w ADR, handoffie
  albo aktualnym dokumencie domenowym.

## 3. Jak podejmujemy decyzje

Przed implementacja zmiany wysokiego ryzyka trzeba zapisac:

- problem i mierzalny stan obecny;
- wybrana decyzje oraz odrzucone alternatywy;
- konsekwencje dla klienta, biznesu, bezpieczenstwa, SEO i utrzymania;
- wymagane testy, w tym kontrole negatywne;
- dokumenty i kopie kodu wymagajace synchronizacji.

Zmiana wysokiego ryzyka obejmuje platnosci, ceny, zamowienia, dane osobowe,
geometrie wyrobu, prawo konsumenckie, routing i publiczne fakty o ofercie.

## 4. Twarde niezmienniki

**NEVER use long em-dashes (" - ") anywhere** - not in chat replies, emails, code comments, content, or commits. Use a short hyphen, a comma, parentheses, or a full stop instead. This is a standing, non-negotiable rule.

Pilnuje tego `scripts/check-emdash.mjs` i **wywala build**, więc złamanie zasady zatrzymuje deploy. Wyłączone są dwa katalogi, oba z tego samego powodu: `n8n-backup` (zrzut z żywej instancji) i pliki obcych skilli w `.claude/skills/` (kopie 1:1 cudzych repozytoriów). Zasada dotyczy tego, co **piszemy**, a nie tego, co wciągamy w niezmienionej postaci. `ORIGIN.md` przy każdym skillu piszemy sami, więc podlega zasadzie normalnie.

- Cena wiążaca jest liczona na serwerze. Dane cenowe z przegladarki nie sa zaufane.
- Status platnosci zmienia tylko poprawnie podpisany komunikat ITN.
- `FAILURE` po `SUCCESS` nie cofa oplaconego zamowienia.
- Test topologiczny nie zastępuje testu warsztatowego wyrobu.
- Nie ujawniamy sekretow w repozytorium, frontendzie ani logach.
- Brak wymaganego sekretu ma zamykac dostep, a nie wlaczac wartosc domyslna.

## 5. Waluta

**Prices and amounts must follow the active language:**
- `lang === "pl"` → display in **PLN** (Polish złoty)
- `lang === "en"` or `lang === "de"` → display in **EUR**

Conversion: `eur = pln / pln_per_eur` where `pln_per_eur` comes from the live `/api/market-rates` endpoint (NBP rate). Fallback: `4.25`. The secondary amount (smaller text below primary) shows the opposite currency.

This applies to: all calculators, pricing displays, result cards, quote forms - any component that shows monetary values. Use the pattern: `const showEur = lang === "en" || lang === "de"`.

## 6. Linkowanie narzędzi

**Jeżeli treść dotyka tematu, który mamy obsłużony narzędziem, ta treść MUSI do niego prowadzić.** Dotyczy wpisów blogowych, haseł słownika, kalkulatorów, sklepu, kart usług i strony B2B. Zbudowane i nielinkowane narzędzie nie istnieje dla czytelnika.

Mapowanie leży w **jednym pliku**: `src/data/toolLinks.js` (`TOOLS_BY_POST`, `TOOLS_BY_TERM`, `audience`). Renderuje je komponent `src/components/ToolLinks.jsx`, używany przez `BlogPost`, `GlossaryTerm`, `RelatedContent` (sklep i karty usług), `B2B`, `Jewelry` i `Studio`.

**Dodając nowe narzędzie:** dopisz je do `TOOL_LINKS`, ustaw `audience` (`buyer` / `maker` / `both`), a potem przypisz do pasujących wpisów i haseł. To jedna edycja, nie obchodzenie czterdziestu siedmiu plików.

`audience` rozdziela odbiorców i trzeba to uszanować: kupujący nie potrzebuje kalkulatora blanku obrączki ani tabeli parametrów lasera, ale na stronie B2B to są najważniejsze pozycje.

**Nie doklejaj narzędzia na siłę.** Wpisy o projektowaniu z AI i o wyposażeniu pracowni celowo nie mają przypisanych narzędzi, bo żadne im nie odpowiada. Wypełniacz szkodzi bardziej niż brak.

## 7. Konwencje inżynierskie

- **i18n**: every user-facing string lives in `src/i18n/{pl,en,de}.js`. When adding a key, add it to ALL THREE files - they must stay in sync.
- **Google reviews** (`src/data/googleReviews.js`): every review that has `text` MUST also carry a `translations: { en, de }` object (or `{ pl, ... }` when `originalLang` is en/de). Without it, the translation block silently fails to render for visitors in other languages while every other card shows one. The reviews list cites only reviews with text, newest first; keep `GOOGLE_BUSINESS.totalReviews` equal to the real Google count (rating-only entries count toward it but are not displayed). Never fake a review's `date` to reorder it - dates must match Google.
- **SEO**: every page uses `<SEOHead pageKey="..." path="..." schemas={[...]} />` at the top. Schemas from `src/seo/schemas.js`: Organization, Service, FAQ, Breadcrumb, Article, HowTo.
- **Images**: `/public/img/calc/<category>/<id>.png`. Product style: black background, upper-left key light, premium photography aesthetic. Use Gemini MCP (`mcp__nano-banana-pro__generate_image`) with `aspectRatio: "1:1"` (tiles) or `"21:9"` (banners), `imageSize: "1K"`.
- **Tailwind themes**: Jewelry = amber/rose, Studio = blue/emerald, Tips = amber (jewelry) / blue (studio).
- **Calculators**: shared primitives in `src/components/calculators/calcShared.jsx` (MaterialCards, HeroCards, ResultDisplay, InquiryForm, CalcCard, t() helper).
- **Geometria kreatora pierścionków** (`src/geometry/ring/`): **przeczytaj `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` PRZED każdą zmianą bryły.** Plik zbiera reguły warsztatowe, pułapki jądra manifold-3d, klasę awarii cichych (objętość i topologia poprawne, wyrób nie do użycia) i dziennik wniosków. Buduj z wiedzy, nie z eksperymentu.
- **Routing / prerender**: there is no SPA catch-all in `public/_redirects`. Every route must be prerendered to its own `index.html`, otherwise Cloudflare Pages serves a real 404. When adding a page, add the route to `src/main.jsx`, `src/entry-server.jsx` AND `STATIC_ROUTES` in `scripts/prerender.mjs`. The prerender script cross-checks those lists and fails the build on drift; blog slugs and glossary IDs are derived automatically from `POSTS_META` / `GLOSSARY`, so they need no manual entry. `dist/404.html` is generated from the `NotFound` component. **Nową stronę deklaruj przez `strona(() => import(...))`, nie przez `lazy(...)`.** Zwykłe `lazy` znaczy, że hydratacja rusza przed fragmentem trasy, React porzuca prerender i rysuje stronę od nowa. Pilnuje tego `scripts/check-lazy-hydration.mjs`, mierzy `scripts/check-hydration-race.cjs`.

## 8. Obowiazkowe dokumenty domenowe

| Obszar | Dokument do przeczytania przed zmiana |
|---|---|
| Marka, oferta, ceny, sprzet | `MDs/AEJaCA_Brand_Reference.md` |
| Platnosci Autopay | `MDs/AEJaCA_Autopay_Integration.md` |
| Geometria pierscionkow | `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` |
| Prawo i dane osobowe | `MDs/AEJaCA_Legal_Audit.md` |
| Bezpieczenstwo API i panelu | `MDs/AEJaCA_Security_Audit.md` |
| Sklep i modele produktow | `MDs/AEJaCA_Shop_Plan.md` |
| B2B | `MDs/B2B_Architektura.md` |
| Sprzet i procesy | `MDs/AEJaCA_Inwentarz_Sprzet_Procesy.md` |

## 9. Config file synchronization rule - MANDATORY before every deploy

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

## 10. Bramka jakosci przed review

Minimalnie:

1. Test, ktory odtwarza naprawiany blad albo mierzy nowy wymog.
2. Kontrola negatywna dla zmian wysokiego ryzyka.
3. Testy obszaru zmiany.
4. `npm run build` po zmianach strukturalnych lub przed integracja.
5. Przeglad diffu przez model, ktory nie byl autorem implementacji.
6. Handoff z wynikami testow, ryzykami i tym, czego nie sprawdzono.

Przejscie builda nie dowodzi poprawnosci biznesowej. Dokument domenowy i test
musza opisywac ten sam stan docelowy.
