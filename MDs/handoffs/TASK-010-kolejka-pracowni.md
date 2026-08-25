# Handoff zadania

```yaml
task_id: TASK-010
status: review
author: Claude Code
branch: claude/fix-api-error-oge1r
base_commit: 0833dcaac8eec6ee4a9c3269561ed7ac23a3405a
last_commit: fb00c94993e61c3880f702b0a7dc31e08d6c9252
updated: 2026-08-25
```

## Cel

Zamowienie oplacone ma dalszy ciag: pracownia widzi, co jest do zrobienia i co
czeka najdluzej, a klient widzi, na jakim etapie jest jego rzecz.

## Stan przed zmiana

Dwa mierzalne braki.

1. Statusy `in_production`, `shipped` i `completed` staly w ograniczeniu tabeli
   `orders`, ale zadna sciezka w kodzie ich nie ustawiala. Zamowienie zostawalo
   w `paid` na zawsze. Odtworzenie: `SELECT DISTINCT status FROM orders` na
   bazie sprzed zmiany nie zwracal zadnego z tych trzech.
2. `src/pages/OrderStatus.jsx` rozgalezial sie wylacznie na `paid`,
   `payment_review`, `awaiting_transfer` i blad podpisu. Odtworzenie: ustaw
   zamowieniu status `in_production` i otworz jego strone statusu. Przed
   zmiana klient widzial zegar i komunikat `pendingTitle`, czyli
   "czekamy na potwierdzenie platnosci", za rzecz, ktora juz oplacil i ktora
   juz robimy.

## Zalozenia i decyzje

- Kolejka jest widokiem nad `orders`, bez osobnej tabeli. Zrodlo: ADR-0013.
  Odrzucona alternatywa: tabela `production_jobs`, bo tworzy drugie zrodlo
  prawdy o tym samym zamowieniu.
- Kolejnosc wedlug daty zaplaty, nie zlozenia. Zlozenie bez zaplaty nie
  rezerwuje czasu pracowni.
- Przejscia wypisane w `chat-api/productionQueue.js`, nie dowolne. Odrzucona
  alternatywa: lista rozwijana ze statusami, bo jedno klikniecie w zlym
  wierszu robiloby z zamowienia nieoplaconego zamowienie wyslane, bez zmiany
  jakiejkolwiek kwoty.
- `paid -> shipped` z pominieciem `in_production` zostaje dozwolone swiadomie.
- Etapy pracy stoja w lancuchu galezi PRZED `failed`, zgodnie z niezmiennikiem
  z `PROJECT_RULES.md`: pozniejszy `FAILURE` nie cofa oplaconego zamowienia.

## Zakres

### Zmienione pliki

- `chat-api/productionQueue.js`: reguly przejsc, `znanyEtap()` na `Object.hasOwn`.
- `chat-api/server.js`: `/api/orders/queue`, `/api/orders/:ref/production`,
  etap pracy w odpowiedzi dla klienta, walidacja etapu przez `znanyEtap()`.
- `admin/server.js`, `admin/views/queue.ejs`, `admin/views/partials/header.ejs`,
  `admin/check-views.mjs`: zakladka `/queue` w panelu i dane probne.
- `src/pages/OrderStatus.jsx`: trzy etapy pracy w pl, en i de, data wysylki,
  numer przesylki, koniec odpytywania na etapach pracy.
- `scripts/orders-schema.sql`: piec kolumn kolejki, indeks `idx_orders_queue`
  i nota o tym, ze plik nie migruje istniejacej bazy.
- `scripts/test-production-queue.mjs`: nowy test, wpiety w `npm run build`.
- `MDs/decisions/ADR-0013-kolejka-pracowni.md`, `MDs/AEJaCA_Brand_Reference.md`
  (wersja 5.4), `chat-api/context.js`: dokumentacja i wiedza asystenta.

### Swiadomie poza zakresem

- **Powiadomienie klienta mailem o zmianie etapu.** Etap widac na stronie
  statusu, ale zaden mail o nim nie wychodzi. Nastepny agent nie moze zalozyc,
  ze klient dowiaduje sie o wysylce sam z siebie.
- **Terminy realizacji i planowanie obciazenia.** Kolejka mowi, co czeka
  najdluzej, i nie liczy, kiedy co bedzie gotowe.
- **Pozostale jedenascie kolumn `orders`**, ktore istnieja tylko w bloku
  startowym `chat-api/server.js` i nie ma ich w `scripts/orders-schema.sql`
  (`cancel_reason`, `cancelled_at`, `cancelled_by`, `credit_applied_grosze`,
  `credit_consumed_by`, `discount_code`, `discount_grosze`, `inbound_delivery`,
  `parent_order_id`, `revisions_included`, `revisions_used`). Uzupelnilem
  wylacznie kolumny tego zadania. Reszta to ten sam problem, co otwarty punkt 3
  dla Codexa w workboardzie.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Dziura w walidacji etapu przed poprawka | `node scripts/test-production-queue.mjs` na `8a7d44f` | fail: `TypeError` na `regula.z` dla etapu `__proto__` |
| Test po poprawce | `node scripts/test-production-queue.mjs` | pass, 4 grupy sprawdzen |
| Kontrola negatywna: wysylka bez zaplaty | dopisanie `awaiting_payment` do `z` etapu `shipped` | fail zgodnie z oczekiwaniem |
| Kontrola negatywna: brak kolumny | usuniecie `ADD COLUMN IF NOT EXISTS shipped_at` | fail zgodnie z oczekiwaniem |
| Testy chat-api | `node scripts/test-chat-api.mjs` | pass, 13 zestawow |
| Tryb jasny | `node scripts/check-light-theme.mjs` | pass, 188 klas z nadpisaniem |
| Format ADR | `node scripts/check-adr.mjs` | pass, 13 decyzji |
| Build | `npm run build` | pass, 99 stron, zero bledow |

## Ryzyka i otwarte pytania

- **Nie sprawdzilem strony statusu w przegladarce dla nowych etapow.** Weryfikacja
  jest statyczna: build, prerender, lint i kontrola trybu jasnego. Zeby zobaczyc
  etap `in_production` na zywo, trzeba bazy z takim zamowieniem, a tej w sandboksie
  nie ma.
- **Nazwa kolumny idzie do `UPDATE` przez interpolacje.** Jest to bezpieczne
  dopoki wartosc pochodzi z `ETAPY_PRACY`. Test pilnuje ksztaltu nazwy, ale
  nie zastapi ostroznosci przy dopisywaniu etapu.
- **Decyzja Artura:** ADR-0013 ma status `draft`. Status `accepted` ustawia
  wylacznie wlasciciel projektu.
- **Decyzja Artura:** czy klient ma dostawac maila przy wejsciu w `shipped`.
  Dzis nie dostaje, a numer przesylki jest juz zapisany, wiec mail jest tanim
  dodatkiem, ale to zmiana w komunikacji, nie w kodzie.

## Instrukcja dla recenzenta

1. **Najwazniejsza hipoteza do podwazenia:** czy lancuch galezi w
   `OrderStatus.jsx` na pewno nie da sie ustawic tak, ze oplacone zamowienie
   w robocie pokaze komunikat o nieudanej platnosci. Sprawdz kolejnosc
   `inProduction`, `shipped`, `completed`, `paid`, `failed`.
2. **Granica systemu:** `POST /api/orders/:ref/production`. Sprawdz, czy warunek
   statusu w samym `UPDATE` naprawde chroni przed wyscigiem z anulowaniem, i czy
   `requireAdmin` stoi przed czymkolwiek, co dotyka bazy.
3. **Dokumenty do potwierdzenia:** ADR-0013, `Brand_Reference.md` sekcja 10b
   (kolejka pracowni), `chat-api/context.js` punkt 8b. `llms.txt` i `sitemap.xml`
   celowo nietkniete: panel jest wewnetrzny, a strona statusu ma `noindex`.

## Warunek uznania zadania za gotowe

1. `npm run build` przechodzi z `scripts/test-production-queue.mjs` w srodku.
2. Zamowienie w `in_production`, `shipped` i `completed` pokazuje klientowi
   wlasciwy komunikat w kazdym z trzech jezykow, a nie galaz domyslna.
3. Zadne przejscie ze stanu nieoplaconego nie prowadzi do etapu pracy.
4. Kazda kolumna uzywana przez regule istnieje w obu miejscach: w schemacie
   i w bloku startowym serwera.
