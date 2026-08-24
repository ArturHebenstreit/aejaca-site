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
| TASK-001 | Wspolna warstwa komunikacji modeli | Codex | `codex/model-coordination-layer` | pliki protokolu i indeks `MDs` | review | `MDs/handoffs/TASK-001-model-coordination.md` |
| TASK-002 | Obsluga nieudanych platnosci i bezpieczne ponowienie | Codex | `codex/payment-failure-retry` | `chat-api/server.js`, `chat-api/paymentState.js`, `chat-api/orderAccess.js`, `chat-api/orderMail.js`, testy i konfiguracja `chat-api`, `chat-api/context.js`, `scripts/orders-schema.sql`, `scripts/check-browser-storage.mjs`, `admin/server.js`, `admin/views/transfers.ejs`, `src/pages/OrderStatus.jsx`, `src/shop/orderStatusAccess.js`, `src/i18n/{pl,en,de}.js`, `public/llms.txt`, `public/sitemap.xml`, dokumentacja Autopay i marki, ADR oraz handoff | review | `MDs/handoffs/TASK-002-payment-failure-retry.md` |
| TASK-003 | Produkcyjna geometria kreatora pierscionkow | Codex | `codex/ring-production-geometry` | `src/geometry/ring/`, `src/workers/ringGenerator.worker.js`, `src/components/calculators/RingConfigurator.jsx`, `src/components/calculators/jewelry/RingPriceBox.jsx`, `chat-api/ringExport.js`, mirrory `chat-api/geometry/`, `scripts/test-ring-generator.mjs`, dokumentacja geometrii, ADR i handoff | review | `MDs/handoffs/TASK-003-ring-production-geometry.md` |
| TASK-004 | Jubilerskie dopracowanie gniazd, kaset, halo i krap | Codex | `codex/ring-setting-refinement` | `src/geometry/ring/`, `src/workers/ringGenerator.worker.js`, mirrory `chat-api/geometry/`, `scripts/test-ring-generator.mjs`, dokumentacja geometrii i handoff | review | `MDs/handoffs/TASK-004-ring-setting-refinement.md` |
| TASK-005 | Odkryte gniazda, ergonomia kreatora i bryla sygnetow | Codex | `codex/ring-ux-signet-refinement` | `src/geometry/ring/`, `src/workers/ringGenerator.worker.js`, mirrory `chat-api/geometry/`, `scripts/test-ring-generator.mjs`, `src/components/calculators/RingConfigurator.jsx`, `src/components/calculators/jewelry/RingPreview3D.jsx`, `src/data/castingAlloys.js`, mirror `chat-api/pricing/castingAlloys.js`, dokumentacja geometrii i handoff | review | `MDs/handoffs/TASK-005-ring-ux-signet-refinement.md` |
| TASK-006 | Ksztalty halo, trylogia i rodziny ramion | Codex | `codex/ring-ux-signet-refinement` | `src/geometry/ring/`, `src/workers/ringGenerator.worker.js`, mirrory `chat-api/geometry/`, `scripts/test-ring-generator.mjs`, `src/components/calculators/RingConfigurator.jsx`, `src/data/ringPresets.js`, dokumentacja geometrii, ADR i handoff | review | `MDs/handoffs/TASK-006-ring-families-halo-cathedral.md` |
| TASK-007 | Odlew z metali szlachetnych w trzech wariantach | Codex | `codex/precious-metal-casting-service` | katalog i karta uslugi odlewniczej, silnik i mirrory wyceny, `ServiceConfigurator.jsx`, testy odlewu, grafika produktu, `termsContent.js`, `public/llms.txt`, `public/sitemap.xml`, `chat-api/context.js`, `src/seo/`, dokumentacja marki, ADR i handoff | active | `MDs/handoffs/TASK-007-precious-metal-casting.md` |

Dozwolone stany: `planned`, `active`, `blocked`, `review`, `done`.

## Kolejka integracji

| ID | Branch | Recenzent | Wymagane kontrole | Wynik |
|---|---|---|---|---|
| TASK-001 | `codex/model-coordination-layer` | Claude Code | zgodnosc z `MDs`, brak sprzecznosci instrukcji, `check-emdash`, `git diff --check` | oczekuje |
| TASK-002 | `codex/payment-failure-retry` | Claude Code | bezpieczenstwo tokenu, kolejnosc ITN, testy `chat-api`, pelny build, synchronizacja dokumentacji | oczekuje |
| TASK-003 | `codex/ring-production-geometry` | Claude Code | tryby eksportu, lokalne ograniczenia szyny, testy negatywne, testy geometrii i wyceny, pelny build | oczekuje |
| TASK-004 | `codex/ring-setting-refinement` | Claude Code | zakrycie kaset, kieszenie pod kamienie, skala krap, halo, testy geometrii i pelny build | oczekuje |
| TASK-005 | `codex/ring-ux-signet-refinement` | Claude Code | przeloty gniazd, ekspozycja kaset, wyglad stopow, ergonomia, sygnety, testy i pelny build | oczekuje |
| TASK-006 | `codex/ring-ux-signet-refinement` | Claude Code | kolizja galerii, szesc ksztaltow halo, 1-2 kamienie boczne, nowe rodziny ramion, ciaglosc katedry, testy i build | oczekuje |

## Archiwum

Po scaleniu zachowaj jeden krotki wiersz: ID, data, branch, commit scalajacy i ADR.
