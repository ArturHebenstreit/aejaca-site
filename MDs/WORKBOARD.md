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
| TASK-010 | Kolejka pracowni: etap pracy po zaplacie, w panelu i u klienta | Claude Code | `claude/fix-api-error-oge1r` | `chat-api/productionQueue.js`, `chat-api/server.js` (kolejka i etap), `admin/server.js`, `admin/views/queue.ejs`, `src/pages/OrderStatus.jsx`, `scripts/orders-schema.sql`, `scripts/test-production-queue.mjs`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md`, ADR-0013 i handoff | review | `MDs/handoffs/TASK-010-kolejka-pracowni.md` |
| TASK-011 | Wejscie z numerem oferty w sklepie oraz poprawianie i usuwanie wierszy kolejki | Claude Code | `claude/fix-api-error-oge1r` | `chat-api/productionQueue.js`, `chat-api/server.js` (kolejka, poprawka, kasowanie), `admin/server.js`, `admin/views/queue.ejs`, `src/components/shop/OfferNumberEntry.jsx`, `src/pages/Shop.jsx`, `src/pages/Cart.jsx`, `scripts/test-production-queue.mjs`, `public/llms.txt`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md`, ADR-0014 i handoff | review | `MDs/handoffs/TASK-011-kolejka-i-wejscie-z-numerem-oferty.md` |
| TASK-012 | Kolba 80 x 80 mm, piec poziomow wykonczenia odlewu, karta odlewu takze w dziale Bizuteria | Claude Code | `claude/fix-api-error-oge1r` | `src/pricing/preciousMetalCasting.js` i mirror, `src/data/serviceCatalog.js`, `src/data/shopFacets.js`, `src/components/calculators/calcShared.jsx` (Chips), `src/components/calculators/SimpleStudioCalc.jsx` (teksty kolby), `src/components/shop/ServiceConfigurator.jsx`, `chat-api/orders.js` (komunikaty odlewu), `scripts/test-precious-metal-casting.mjs`, `scripts/test-simple-quote.mjs`, `public/llms.txt`, `public/sitemap.xml`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md`, `MDs/B2B_Architektura.md`, ADR-0016 i handoff | review | `MDs/handoffs/TASK-012-kolba-i-wykonczenie-odlewu.md` |
| TASK-013 | Uklad wyboru w ofercie: rodzaje pozycji, karty wariantow, dodatki i jeden formularz edytora wycen | Claude Code | `claude/fix-api-error-oge1r` | `chat-api/quotes.js`, `chat-api/server.js` (migracja i trasy wycen), `chat-api/orderMail.js` (mail oferty), `admin/server.js` (trasy wycen), `admin/views/quote-edit.ejs`, `admin/public/tailwind.css`, `admin/check-views.mjs`, `src/pages/Offer.jsx`, `scripts/quotes-schema.sql`, `scripts/test-quote-edit.mjs`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md`, ADR-0017 i handoff | review | `MDs/handoffs/TASK-013-uklad-wyboru-w-ofercie.md` |
| TASK-014 | Waluta zaplaty wybierana przez klienta, oferta w euro, diagram procedury platnosci | Claude Code | `claude/fix-api-error-oge1r` | `src/pricing/currency.js` i mirror, `src/shop/CurrencyContext.jsx`, `src/shop/money.js`, `src/main.jsx`, `src/entry-server.jsx`, `src/components/Navbar.jsx`, `src/pages/Checkout.jsx`, `src/pages/Offer.jsx`, `src/pages/Payments.jsx`, `chat-api/quotes.js`, `chat-api/server.js` (waluta i trasy oferty), `admin/server.js`, `admin/views/quotes.ejs`, `admin/views/quote-edit.ejs`, `scripts/quotes-schema.sql`, `scripts/test-offer-currency.mjs`, `scripts/test-offer-payment.mjs`, `scripts/it-offer-groups.mjs`, ADR-0018 i handoff | review | `MDs/handoffs/TASK-014-waluta-zaplaty.md` |
| TASK-015 | Edytor wycen bez przycisku zapisu: rekord to pozycja albo naglowek oferty | Claude Code | `claude/fix-api-error-oge1r` | `admin/views/quote-edit.ejs`, `admin/server.js` (trasy JSON wycen), `admin/check-views.mjs`, `chat-api/quotes.js` (zaznaczenie z biezacego zapisu), `scripts/test-quote-edit.mjs`, `scripts/it-offer-groups.mjs`, ADR-0019 | review | `MDs/handoffs/TASK-013-uklad-wyboru-w-ofercie.md` |
| TASK-016 | Jeden domyslny termin waznosci oferty: siedem dni na kazdej drodze, zmienny przez administratora | Claude Code | `claude/fix-api-error-oge1r` | `src/pricing/config.js` i mirror, `chat-api/quotes.js`, `chat-api/server.js` (wersja API), `public/llms.txt`, `chat-api/context.js`, `src/pages/Payments.jsx`, `scripts/test-quote-edit.mjs`, `scripts/it-offer-groups.mjs`, `scripts/it-quotes-db.mjs`, ADR-0020, Brand Reference | review | `MDs/decisions/ADR-0020-jeden-termin-waznosci-oferty.md` |
| TASK-017 | Wdrozenie audytu calego serwisu: kroje u siebie, hydracja na wszystkich stu stronach, obrazy responsywne, preload trasy, drobne poprawki UX | Claude Code | `claude/fix-api-error-oge1r` | `index.html`, `src/index.css`, `public/fonts/`, `public/img/hero/`, `public/_headers`, `vite.config.js`, `scripts/prerender.mjs`, `scripts/build-hero-images.mjs`, `scripts/check-czas-w-renderze.mjs`, `scripts/check-kraje.mjs`, `scripts/check-hydration.mjs`, `scripts/audit-pages.mjs`, `src/components/HeroObraz.jsx`, `src/components/GoogleReviews.jsx`, `src/components/Footer.jsx`, `src/components/Breadcrumb.jsx`, `src/components/ProcessGallery.jsx`, `src/components/shop/ConfigControls.jsx`, `src/data/countryNames.js`, `src/data/heroObrazy.js`, `src/pages/*` (obrazy hero i lista krajow), ADR-0021, ADR-0022 | review | ADR-0021, ADR-0022, ADR-0023, ADR-0024 |
| TASK-018 | Adresy z prefiksem jezyka, jeden slownik na wizyte, obrazy w rozmiarze miejsca | Claude Code | `claude/fix-api-error-oge1r` | `src/routes.js`, `src/i18n/nav.jsx`, `src/i18n/LanguageContext.jsx`, `src/i18n/slowniki.js`, `src/components/JezykPodpowiedz.jsx`, `src/components/Obraz.jsx`, `src/data/obrazyWarianty.js`, `src/main.jsx`, `src/entry-server.jsx`, `src/seo/SEOHead.jsx`, `scripts/prerender.mjs`, `scripts/build-sitemap.mjs`, `scripts/build-card-images.mjs`, `scripts/check-card-images.mjs`, `scripts/check-drobny-tekst.mjs`, `public/_redirects`, `public/sitemap.xml`, `public/llms.txt`, `chat-api/context.js`, ADR-0023, ADR-0024, Brand Reference | review | `MDs/decisions/ADR-0023-adresy-z-prefiksem-jezyka.md` |

Dozwolone stany: `planned`, `active`, `blocked`, `review`, `done`.

## Kolejka integracji

| ID | Branch | Recenzent | Wymagane kontrole | Wynik |
|---|---|---|---|---|
| TASK-009 | `claude/fix-api-error-oge1r` | Codex | zgodnosc kwoty kalkulatora i sklepu, widelki obejmujace kwote wiazaca, slownik progow ilosci, synchronizacja dokumentacji, pelny build | oczekuje |
| TASK-010 | `claude/fix-api-error-oge1r` | Codex | brak przejscia ze stanu nieoplaconego do etapu pracy, kolejnosc galezi na stronie statusu (etap przed FAILURE), kolumny w obu miejscach, kontrole negatywne testu kolejki, pelny build | oczekuje |
| TASK-011 | `claude/fix-api-error-oge1r` | Codex | korekta nie wpuszcza stanu nieoplaconego, kasowanie bez `force` dalej odmawia, dokladnie jedna trasa DELETE /api/orders/:ref, sam numer oferty nie wystarcza do jej zobaczenia, pelny build | oczekuje |
| TASK-012 | `claude/fix-api-error-oge1r` | Codex | limit modelu liczony z kolby, a nie wpisany z reki; zaden komunikat o limicie nie niesie liczby wlasnej; identyfikatory `raw`, `clean` i `polished` nadal wyceniaja stary koszyk; karta odlewu ma jeden adres mimo dwoch dzialow; komunikat o brakach nazywa plik; pelny build | oczekuje |
| TASK-013 | `claude/fix-api-error-oge1r` | Codex | kwote do zaplaty liczy jedna funkcja we wszystkich czterech bramkach; wariant z grupy wchodzi dokladnie jeden; odznaczony dodatek nie wchodzi do kwoty; pola wiersza formularza nie rozjezdzaja tablic przy usuwaniu i zaznaczaniu; oferta wyslana przed zmiana dziala tak samo; pelny build | oczekuje |
| TASK-014 | `claude/fix-api-error-oge1r` | Codex | kwota widziana przez klienta w euro jest ta zamrozona w zamowieniu; rabat schodzi z obu kwot; bramka dalej dostaje wylacznie PLN; waluta spoza listy odrzucana; starsza strona bez pola `currency` dalej sklada zamowienie; pelny build | oczekuje |
| TASK-015 | `claude/fix-api-error-oge1r` | Codex | zapis jednego pola nie kasuje pozostalych; klikniecie w wariant przestawia wybor w grupie; nowa pozycja trafia do bazy dopiero po zatwierdzeniu; w trakcie edycji krzyzyk i olowek sa nieczynne; jedna droga zapisu wyceny; pelny build | oczekuje |
| TASK-016 | `claude/fix-api-error-oge1r` | Codex | wycena zapisana z kalkulatora i oferta reczna maja ten sam termin; zalozenie numeru zawsze stempluje date, wiec zaden wiersz nie zostaje bez terminu; termin ustawiony recznie w panelu nie jest nadpisywany przez wpisanie kwot; regulamin, `llms.txt` i strona platnosci mowia te sama liczbe; pelny build | oczekuje |

## Uwaga do rezerwacji TASK-010

Wiersz TASK-010 powstal na gałęzi `claude/fix-api-error-oge1r`, a nie commitem
do `main`, bo sesja pracujaca nad zadaniem nie miala prawa zapisu do `main`.
Rezerwacja nie wiaze wiec drugiego modelu az do scalenia. Zastrzezone pliki
kroku 5 nie pokrywaja sie z niczym w TASK-009, wiec kolizji nie bylo.

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
