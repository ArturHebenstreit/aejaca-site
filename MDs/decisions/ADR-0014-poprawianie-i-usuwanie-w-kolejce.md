---
status: draft
owner: Artur
date: 2026-08-26
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0013-kolejka-pracowni.md
  - MDs/decisions/ADR-0012-zaplata-za-oferte.md
  - chat-api/productionQueue.js
  - chat-api/retention.js
  - admin/views/queue.ejs
  - scripts/test-production-queue.mjs
---

# ADR-0014: Poprawianie i usuwanie wierszy w kolejce pracowni

## Kontekst

ADR-0013 dal kolejce jeden kierunek: naprzod, wedlug wypisanych przejsc. Bylo to
sluszne wobec pomylki grozniejszej, czyli wyslania zamowienia nieoplaconego, ale
zostawilo dwie dziury w codziennej pracy.

Pierwsza: pomylki nie dalo sie cofnac. Klikniecie "zrobione" w zlym wierszu
zamykalo zamowienie, ktore znikalo z ekranu razem z jedynym miejscem, w ktorym
mozna by je poprawic. Bledny numer przesylki zostawal na zawsze, bo `COALESCE`
w trasie etapu nie nadpisuje wartosci juz zapisanej.

Druga: nie dalo sie niczego usunac. Wpisy testowe, powstale przy sprawdzaniu
toru oferty, mieszaja sie w kolejce z prawdziwa praca.

## Decyzja

**Korekta etapu** jest osobna operacja od pchniecia naprzod, w osobnej trasie
i pod osobna regula (`korekta()`), a nie rozluznieniem `przejscie()`. Wpuszcza
wylacznie zamowienie, ktore juz jest oplacone, wiec niezmiennik z ADR-0013
zostaje w mocy: ze stanu nieoplaconego, anulowanego ani zwroconego nie da sie
tedy zrobic zamowienia w robocie.

Cofniecie **kasuje stemple etapow, ktore przestaly byc prawda**. Zamowienie
wycofane z "wyslane" traci date wysylki i list przewozowy, bo nic nie wyjechalo.
Stempel etapu docelowego zostaje: praca ruszyla wtedy, kiedy ruszyla, a nie
w chwili poprawiania pomylki.

**Usuwanie jest trwale.** Panel kasuje wiersz z tabeli `orders`, bez wzgledu na
stan platnosci. Wymaga przepisania numeru zamowienia i oddaje zuzycie
jednorazowego kodu rabatowego, ktory zamowienie spalilo.

Idzie to **istniejaca trasa** `DELETE /api/orders/:ref`, przez nowy znacznik
`force`, a nie osobna trasa obok. Domyslne zachowanie zostaje nietkniete:
`deletionBlockers()` z `orderCleanup.js` dalej odmawia skasowania zamowienia,
przy ktorym cokolwiek sie wydarzylo, i dalej obsluguje panel przelewow.
`force` wylacznie **lamie te warunki na wyrazne zadanie** i zapisuje w logu,
ktore z nich przelamano.

Pierwsza wersja tej zmiany dokladala druga trase o tej samej sciezce. Express
bierze zarejestrowana wczesniej, wiec cale zabezpieczenie z `orderCleanup.js`
przestawalo odpowiadac na cokolwiek, i to bez jednego bledu w buildzie. Stad
w tescie stoi teraz jawne liczenie tras.

Kolejka dostaje **filtr stanu**, bo bez widocznosci zamowien zakonczonych
i anulowanych ani korekta, ani usuwanie nie mialyby jak dosiegnac wiersza.

## Sprzecznosc, ktora ta decyzja rozstrzyga

`chat-api/retention.js` mowi wprost, ze zamowienie **anonimizujemy, a nie
usuwamy**, i trzymamy szesc lat: dluzszy z dwoch terminow, pieciu lat
podatkowych i szesciu lat przedawnienia roszczen.

Zglosilem te sprzecznosc przed implementacja i zaproponowalem wariant lagodniejszy:
zdjecie z kolejki przez status `cancelled` dla zamowien oplaconych, a trwale
kasowanie wylacznie dla tych, ktore nigdy nie byly oplacone. **Wlasciciel wybral
twarde kasowanie kazdego rekordu** (decyzja z 2026-08-26). Zapisuje to zgodnie
z `PROJECT_RULES.md` sekcja 1: sprzecznosc nazwana i rozstrzygnieta jawnie,
a nie przemilczana.

Zakres sprzecznosci jest ograniczony: dotyczy **recznej akcji pracownika**,
a nie automatycznej retencji, ktora dalej anonimizuje i niczego nie kasuje.

## Alternatywy

- **Tylko zdjecie z kolejki, bez kasowania.** Odrzucone przez wlasciciela.
  Zachowalo by pelna zgodnosc z polityka retencji, ale wpisy testowe zostalyby
  w bazie na zawsze.
- **Kasowanie tylko zamowien nieoplaconych.** Odrzucone przez wlasciciela.
  Zalatwialo by wpisy testowe bez dotykania sladu platnosci.
- **Rozluznienie `przejscie()` zamiast osobnej `korekta()`.** Odrzucone: jedna
  funkcja obslugujaca i prace, i poprawki przestaje bronic czegokolwiek, bo
  kazde przejscie staje sie dozwolone "w ramach poprawki".
- **Cofniecie bez kasowania stempli.** Odrzucone: zamowienie cofniete z wysylki
  dalej niosloby date wysylki i list przewozowy, wiec klient widzialby na
  stronie statusu paczke, ktorej nikt nie nadal.

## Konsekwencje

Po usunieciu zamowienia:

- **znikaja** `order_items`, `downloads`, `product_reservations`
  i `discount_redemptions`, wszystkie przez `ON DELETE CASCADE`;
- **wracaja do NULL** `quotes.converted_order_id` i `uploads.order_id`, wiec
  wycena zostaje i wraca do stanu sprzed konwersji;
- **zostaja** `payment_notifications`. Wiaza sie z zamowieniem po numerze,
  a nie kluczem obcym, wiec podpisane komunikaty ITN przezywaja usuniecie
  i slad wplaty istnieje dalej, tyle ze bez wiersza zamowienia obok;
- **nie wraca towar na stan**. Ze stanu zszedl przy zaplacie, a usuniecie
  wiersza nie jest zwrotem i nie udajemy, ze jest;
- **wraca do puli jednorazowy kod rabatowy**, bo licznik `used_count` stoi na
  kodzie, a nie liczy sie z wierszy rezerwacji, wiec kaskada zostawilaby kod
  spalony na zawsze;
- **log nazywa przelamane warunki** (`SKASOWANE MIMO WARUNKOW`), zeby dalo sie
  pozniej odtworzyc, co zniknelo i mimo czego.

Ryzyko, ktore zostaje po stronie wlasciciela: usuniecie oplaconego zamowienia
zabiera pozycje i kwoty, ktore moga byc potrzebne przy rozliczeniu podatkowym
albo reklamacji platnosci. Sam dowod wplaty zostaje, ale to, za co ta wplata
byla, juz nie.

## Niezmienniki i testy

- Korekta nie wpuszcza zadnego stanu spoza etapow pracy.
- Cofniecie kasuje stemple etapow po docelowym i nie kasuje stempla docelowego.
- Usuwanie wymaga przepisanego numeru, a sprawdzenie stoi PRZED siegnieciem
  do bazy.
- Bez `force` kasowanie dalej odmawia na warunkach z `orderCleanup.js`, a lista
  warunkow pochodzi z tego jednego miejsca, nie z kopii w trasie.
- Trasa kasowania jest DOKLADNIE JEDNA. Druga o tej samej sciezce uciszylaby
  pierwsza bez zadnego bledu.
- Pilnuje tego `scripts/test-production-queue.mjs`, sekcje 5 i 6, wpiety
  w `npm run build`.
