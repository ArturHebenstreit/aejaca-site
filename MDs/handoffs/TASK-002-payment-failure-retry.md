---
task_id: TASK-002
status: review
author: Codex
branch: codex/payment-failure-retry
base_commit: 8ee461cd06435a47643129438fe22fa0698ad21e
last_commit: ac6fc9a81f7251bbeedf22b51448a962bfd9e712
updated: 2026-08-23
---

# Handoff: nieudana platnosc i bezpieczne ponowienie

## Cel

Klient widzi nieudana platnosc Autopay i moze bezpiecznie rozpoczac kolejna probe
na tym samym, nadal waznym zamowieniu, bez duplikowania zamowienia. Ta sama droga
pozwala zaplacic po zamknieciu bramki w stanie `PENDING` albo przed pierwsza
proba, a prywatny status pozostaje dostepny po F5 i po powrocie wyprzedzonym
przez ITN.

## Stan przed zmiana

Backend zapisywal `FAILURE`, ale endpoint `GET /api/orders/:ref` nie zwracal
`payment_status`. Strona statusu sprawdzala nieistniejace pole
`order.payment_status`, wiec stan nieudanej platnosci byl nieosiagalny. Komunikat
zapowiadal mozliwosc ponowienia, lecz interfejs nie mial takiej czynnosci.

Po pierwszej rundzie dwie osobno poprawne zmiany zlozyly sie w regresje: token
stal sie warunkiem pelnego statusu, a jednoczesnie byl usuwany z jedynego nosnika,
czyli URL. F5 odcinal klienta od zamowienia. Dodatkowo ITN mogl ustawic `paid`
albo `payment_review` przed powrotem przegladarki, a filtr `awaiting_payment`
nie pozwalal wtedy dokleic tokenu do podpisanego powrotu.

## Zalozenia i decyzje

- Ponowienie korzysta z tego samego `OrderID`; proby rozroznia `remoteID` Autopay.
- Start kolejnej proby wymaga tajnego tokenu zamowienia i nie jest dostepny na
  podstawie samego publicznego numeru.
- Ponowienie jest mozliwe tylko w stanie `awaiting_payment`, dla Autopay, przed
  wygasnieciem i przed realizacja zamowienia.
- Akcja zaplaty jest dostepna dla pustego statusu, `PENDING` i `FAILURE`, ale
  czerwony stan bledu pozostaje zarezerwowany dla rzeczywistego `FAILURE`.
- Nowa proba ustawia `PENDING` i usuwa szczegoly poprzedniego `FAILURE`.
- Token z URL ma pierwszenstwo, jest zapisywany pod kluczem numeru zamowienia w
  `sessionStorage` przed `replaceState`, a potem znika z adresu. F5 w tej samej
  sesji karty odzyskuje token. Niezalezna sesja z samym `ref` nie dostaje dostepu.
- Pierwszy render czeka na rozstrzygniecie obu zrodel tokenu, dlatego po F5 nie
  miga ekran odmowy. Niedostepny storage nie wywraca strony; biezacy token z URL
  dziala, ale trwalosc po F5 nie jest wtedy gwarantowana.
- Poprawny podpis powrotu Autopay uwierzytelnia `OrderID`, dlatego lookup tokenu
  zalezy tylko od `order_ref`, rowniez po wczesniejszym `paid` lub
  `payment_review`. Niepoprawny podpis konczy obsluge przed zapytaniem do bazy.
- Podpisany `FAILURE` po `SUCCESS` zostaje potwierdzony i zapisany w dzienniku
  powiadomien, ale nie zmienia opłaconego zamowienia.
- Podpisany `SUCCESS` uruchamia realizacje tylko dla pierwszego potwierdzenia,
  zgodnej kwoty i aktualnego stanu `awaiting_payment`. Pozostale przypadki
  trafiaja do `payment_review`, bez maila o zaplacie, plikow, zdjecia stanu,
  zuzycia rabatu ani rozpoczecia produkcji.
- Pelny status zamowienia wymaga tokenu w naglowku `Authorization: Bearer`.
  Brak lub bledny token daje ten sam ogolny blad `404`, a odpowiedz nie moze
  byc zapisana w pamieci podrecznej.
- Decyzje opisuje projekt `MDs/decisions/ADR-0002-ponowienie-nieudanej-platnosci.md`.
  Status pozostaje `draft`, poniewaz akceptuje go Artur.
- Artur zaakceptowal obie decyzje z recenzji: `ADR-0003` o recznej weryfikacji
  nietypowego `SUCCESS` i `ADR-0004` o prywatnym statusie zamowienia.

## Zakres

### Zmienione pliki

- `chat-api/paymentState.js`: czyste reguly rozpoczecia platnosci, ITN i stanu publicznego.
- `chat-api/paymentState.test.mjs`: regresje pozytywne i negatywne.
- `chat-api/server.js`: walidacja ponowienia, token po podpisanym powrocie,
  atomowa ochrona przed wskrzeszeniem zamowienia, kolejka recznej weryfikacji
  i prywatny stan platnosci.
- `chat-api/orderAccess.js`: scisla walidacja tokenu Bearer.
- `chat-api/orderMail.js`: pilny alert wewnetrzny o platnosci do wyjasnienia.
- `admin/server.js`, `admin/views/transfers.ejs`: kolejka platnosci wymagajacych
  recznej decyzji.
- `scripts/orders-schema.sql`: stan i pola audytowe `payment_review`.
- `chat-api/package.json`: wlaczenie testow platnosci i dostepu do zestawu serwera.
- `chat-api/orderStatusAccess.test.mjs`: testy pamieci sesji, F5, osobnych
  zamowien, zablokowanego storage i czyszczenia adresu.
- `src/shop/orderStatusAccess.js`: bezpieczne rozwiazanie tokenu URL albo
  `sessionStorage`, klucz per zamowienie i czyszczenie tylko parametru `token`.
- `src/pages/OrderStatus.jsx`: rzeczywisty `FAILURE`, przycisk ponowienia,
  komunikaty bledow i dwuetapowe rozwiazanie prywatnego dostepu.
- `scripts/check-browser-storage.mjs`: uzasadnienie niezbednego zapisu tokenu na
  czas sesji karty.
- `src/i18n/pl.js`, `src/i18n/en.js`, `src/i18n/de.js`: teksty interfejsu.
- `MDs/AEJaCA_Autopay_Integration.md`: zasady ponowienia i obslugi ITN.
- `MDs/decisions/ADR-0002-ponowienie-nieudanej-platnosci.md` oraz zaakceptowane
  `ADR-0003` i `ADR-0004`: zapis decyzji i ich powiazan.
- `chat-api/context.js`, `public/llms.txt`, `MDs/AEJaCA_Brand_Reference.md`:
  synchronizacja publicznych i asystenckich faktow o platnosci.

### Swiadomie poza zakresem

- Nie wykonano rzeczywistej transakcji w srodowisku Autopay.
- ADR-0002 nie zostal zaakceptowany za Artura.
- Nie dodano automatycznego przycisku realizacji ani zwrotu dla
  `payment_review`: decyzja pozostaje reczna, poniewaz wymaga sprawdzenia
  faktycznego wplywu i ewentualnego zwrotu w Autopay.
- Nie wykonano scenariusza E2E w prawdziwej przegladarce z dzialajacym API i
  baza: wejscie z tokenem, F5, `paid`, `payment_review` i `invalid_signature`.
- `public/sitemap.xml` pozostaje bez zmian: prywatna strona `/order/status/` ma
  `noindex` i celowo nie wystepuje w mapie witryny.
- Nie zmieniano niezwiązanych ostrzezen istniejacego builda.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Test bledu przed poprawka | inspekcja kontraktu endpointu i `OrderStatus.jsx` | fail zgodnie z oczekiwaniem: brak pola i brak czynnosci ponowienia |
| Test bledu z recenzji | test `PENDING` i `NULL` przed zmiana reguly | fail zgodnie z oczekiwaniem: `PENDING` zwracal `canRetryPayment: false` |
| Reguly stanu platnosci | `node chat-api/paymentState.test.mjs` | pass dla `FAILURE`, `PENDING`, `NULL` i przypadkow zabronionych |
| Test bledu spoznionego SUCCESS | stara regula wobec anulowanego zamowienia | fail zgodnie z oczekiwaniem: zwracala `fulfill` zamiast `review` |
| Dostep do statusu | `node chat-api/orderAccess.test.mjs` | pass: tylko poprawny naglowek Bearer |
| Token strony statusu | `node chat-api/orderStatusAccess.test.mjs` | pass: F5, klucz per ref, pierwszenstwo URL, bledy storage i czyszczenie URL |
| Bezpieczenstwo integracji | `node chat-api/paymentSafety.test.mjs` | pass: kontrola okablowania CORS, Bearer, return, no-store i atomowych bramek |
| Alert recznej weryfikacji | `node chat-api/orderMail.test.mjs` | pass: alert wewnetrzny bez maila do klienta |
| Zestaw serwera | `cd chat-api && npm test --silent` | pass, 14 skryptow testowych |
| Kontrola negatywna | `FAILURE` po `SUCCESS` w `paymentState.test.mjs` | pass |
| Niezdefiniowane wywolania | `npm run --silent lint:undef` | pass |
| Zakaz dlugich myslnikow | `node scripts/check-emdash.mjs` | pass |
| Biale znaki i konflikt patcha | `git diff --check` | pass |
| Build po recenzji | `npm run build` | pass, 97 stron, 0 bledow |
| Niezalezny przeglad diffu | 3 agentow odczytowych: frontend, backend, testy i dokumentacja | pass, brak problemow blokujacych |
| F5 i powrot w prawdziwej przegladarce | dzialajace API i baza | nie uruchomiono |
| Prawdziwy Autopay lub sandbox | podpisany return oraz ITN | nie uruchomiono |

`paymentSafety.test.mjs` czyta tekst zrodla. Potwierdza obecnosc uzgodnionych
bramek w aktualnym okablowaniu, ale nie dowodzi wykonania wlasciwej galezi,
semantyki PostgreSQL ani zachowania przy rzeczywistych rownoleglych zadaniach HTTP.

## Ryzyka i otwarte pytania

- Przeplyw wymaga niezaleznej recenzji Claude Code przed integracja.
- Nie sprawdzono pelnego przejscia z prawdziwa bramka Autopay ani jej sandboxem.
- Build nadal wyswietla istniejace ostrzezenia o duplikatach kluczy w
  `src/pages/ToolsStudio.jsx` oraz podziale modulow; nie dotycza TASK-002.
- ADR-0002 nadal wymaga osobnej decyzji Artura o zmianie statusu z `draft`.
- Rozstrzygniete: spozniony, kwotowo niezgodny albo nieoczekiwany `SUCCESS`
  trafia do recznej weryfikacji i nie uruchamia realizacji.
- Rozstrzygniete: `GET /api/orders/:ref` nie ujawnia pelnego statusu bez tokenu
  Bearer. F5 tej samej sesji odzyskuje token z `sessionStorage`, a sam
  oczyszczony adres w niezaleznej sesji pokazuje prosbe o kontakt.
- Nie sprawdzono operacji na rzeczywistej bazie ani pelnego przejscia w
  sandboxie Autopay.
- `sessionStorage` moze zostac skopiowany do karty utworzonej z `opener`, wiec
  izolacja dotyczy niezaleznej sesji przegladania, nie kazdego sposobu utworzenia
  nowej karty.
- Otwarte pytanie do Artura: sekcja `payment_review` w panelu jest tylko do
  odczytu, a rozstrzygniecie nadal wymaga operacji w bazie. Nie dodano przycisku
  realizacji ani zwrotu bez decyzji wlasciciela.

## Instrukcja dla recenzenta

1. Potwierdz, ze `PENDING`, pusty status i `FAILURE` dostaja akcje tylko przy
   waznym `awaiting_payment` z tokenem, a stany zabronione jej nie dostaja.
2. Sprawdz wyscig anulowania z `SUCCESS`, niezgodna kwote oraz powtorzony ITN:
   tylko poprawny pierwszy `SUCCESS` moze wywolac skutki realizacji.
3. Potwierdz w przegladarce: token znika z adresu, F5 zachowuje status i akcje,
   a sam `ref` bez wpisu sesji pokazuje ekran odmowy.
4. Sprawdz podpisany powrot po wczesniejszym `paid` i `payment_review` oraz
   niepoprawny podpis bez tokenu.
5. Sprawdz, ze status bez poprawnego naglowka Bearer zwraca ogolne `404` i
   `Cache-Control: no-store, private`.
6. Sprawdz kolejke i alert `payment_review` oraz brak skutkow realizacji.
7. Sprawdz synchronizacje `MDs/AEJaCA_Autopay_Integration.md`, ADR-0002-0004,
   kontekstu asystenta, dokumentu marki i publicznego `llms.txt`.

## Warunek uznania zadania za gotowe

- Claude Code nie znajduje regresji bezpieczenstwa ani niespojnosci stanow.
- Testy serwera i pelny build przechodza.
- Artur podejmuje decyzje o ADR-0002 i samodzielnie integruje branch z `main`.
