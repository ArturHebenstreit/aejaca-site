# AEJaCA - workboard Claude Code i Codex

Ten plik koordynuje rownolegla prace. Nie jest backlogiem produktu.

## Reguly

1. Przed rozpoczęciem zadania zarezerwuj je bezpośrednio w `main`, w commicie zmieniającym wyłącznie `MDs/WORKBOARD.md`. Jest to jedyny wyjątek od zasady, że modele nie zapisują do `main`.
2. Przed pierwszą edycją w zadaniu wykonaj `git fetch origin main` i przeczytaj workboard z `origin/main`, a nie kopię ze swojego brancha. Rezerwacja, która nie została wypchnięta do zdalnego `main`, nikogo nie wiąże.
3. Tabela aktywnych zadań jest append-only: nowe wiersze dopisuj na końcu. Przy konflikcie scalania zachowaj wiersze z obu stron.
4. Jeden plik może mieć jednego aktywnego właściciela.
5. Drugi model może recenzować, ale nie edytuje zastrzeżonego pliku.
6. Stan `review` zwalnia pliki dopiero po przekazaniu handoffu.
7. Zakończone wiersze przenosimy do archiwum po scaleniu.

Workboard jest koordynacją umowną między uczestnikami, a nie techniczną blokadą plików ani gałęzi.

## Aktywne zadania

| ID | Cel | Wlasciciel | Branch i worktree | Zastrzezone pliki | Stan | Handoff |
|---|---|---|---|---|---|---|
| TASK-009 | Odlew z metali szlachetnych w kalkulatorze sTuDiO i w szybkiej wycenie | Claude Code | `claude/fix-api-error-oge1r` | `src/components/calculators/MetalCastCalc.jsx`, `src/components/StudioCalculator.jsx`, `src/pricing/preciousMetalCasting.js` i mirror, `scripts/test-precious-metal-casting.mjs`, `public/llms.txt`, `public/sitemap.xml`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md`, ADR-0011 i handoff | review | `MDs/handoffs/TASK-009-odlew-w-kalkulatorze.md` |

Dozwolone stany: `planned`, `active`, `blocked`, `review`, `done`.

## Kolejka integracji

| ID | Branch | Recenzent | Wymagane kontrole | Wynik |
|---|---|---|---|---|
| TASK-009 | `claude/fix-api-error-oge1r` | Codex | zgodnosc kwoty kalkulatora i sklepu, widelki obejmujace kwote wiazaca, slownik progow ilosci, synchronizacja dokumentacji, pelny build | oczekuje |

## Archiwum

Po scaleniu zachowaj jeden krotki wiersz: ID, data, branch, commit scalajacy i ADR.

| ID | Data scalenia | Branch | Commit scalajacy | ADR |
|---|---|---|---|---|
| TASK-001 | 2026-08-23 | `codex/model-coordination-layer` | `fa62624` (PR #271) | ADR-0001 |
| TASK-002 | 2026-08-23 | `codex/payment-failure-retry` | `ca5dbd9` (PR #272) | ADR-0002, ADR-0003, ADR-0004 |
| TASK-003 | 2026-08-24 | `codex/ring-production-geometry` | `c5d5da8` (PR #277) | ADR-0005 |
| TASK-004 | 2026-08-24 | `codex/ring-setting-refinement` | `9f40b5c` (PR #278) | ADR-0006 |
| TASK-005 | 2026-08-24 | `codex/ring-ux-signet-refinement` | `d2d07ce` (PR #281) | ADR-0007, ADR-0008 |
| TASK-006 | 2026-08-24 | `codex/ring-ux-signet-refinement` | `d2d07ce` (PR #281) | ADR-0009 |
| TASK-007 | 2026-08-24 | `codex/precious-metal-casting-service` | `001c95f` (PR #284) | ADR-0010 |
| TASK-008 | 2026-08-25 | `claude/fix-api-error-oge1r` | `ea34c61` (PR #285) | brak, porzadki i guard formatu |

Recenzja po scaleniu, 2026-08-25, `001c95f`, Claude Code: pelny build przechodzi
(98 stron, zero bledow), czternascie zestawow testow `chat-api` zielonych, mirrory
cenowe zgodne, `WORKER_VERSION` podniesiony do 35, dziennik geometrii uzupelniony,
synchronizacja `llms.txt`, `sitemap.xml`, `chat-api/context.js`, `seoData.js`,
regulaminu i Brand Reference dla odlewu kompletna. Kreator `/toolsjewelry/kreator/`
slusznie nie jest w sitemapie ani w `llms.txt`, bo jest szkicem z `noindex`.
Znaleziska poszly do TASK-008 oraz do listy dla Codexa nizej.

## Stan TASK-009

Scalony w czesci. `ea34c61` (PR #285) i `226a98c` (PR #286) wniosly kalkulator,
szybka wycene i synchronizacje dokumentacji. Poza `main` zostaje jeszcze
ostrzezenie o kolbie w szybkiej wycenie, zdjecia kafelkow wariantu i poprawka
obwodki napisu w `HeroCards`, razem z uzupelnieniem SEO strony `/studio/`.

## Otwarte punkty dla Codexa

Wynikaja z przegladu po scaleniu i nie sa blokujace dla produkcji.

1. Handoffy TASK-003 i TASK-004 nie maja sekcji `Ryzyka i otwarte pytania`
   wymaganej przez `MDs/HANDOFF_TEMPLATE.md`. TASK-004 nie ma tez listy
   zmienionych plikow. To jest sekcja, dla ktorej handoff istnieje.
2. ADR-0002 i ADR-0010 maja status `draft`, chociaz obie decyzje sa scalone
   i dzialaja na produkcji. Status zmienia wylacznie Artur, wiec do jego decyzji.
3. `scripts/orders-schema.sql` opisuje `payment_review` poprawnie, ale przez
   `CREATE TABLE IF NOT EXISTS` nie migruje istniejacej bazy. Robi to blok
   startowy w `chat-api/server.js`. Warto to dopisac do dokumentacji Autopay,
   zeby nikt nie szukal migracji tam, gdzie jej nie ma.
