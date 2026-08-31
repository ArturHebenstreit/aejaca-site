---
status: accepted
owner: Artur
date: 2026-08-26
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0017-uklad-wyboru-w-ofercie.md
  - src/pricing/config.js
  - chat-api/quotes.js
  - public/llms.txt
  - src/data/termsContent.js
---

# ADR-0020: Jeden domyslny termin waznosci, siedem dni, zmienny przez administratora

## Kontekst

Do 2026-08-26 w rdzeniu cenowym staly dwie liczby o tym samym znaczeniu:
`QUOTE_VALIDITY_DAYS = 14` dla wyceny zapisanej z kalkulatora i
`OFFER_VALIDITY_DAYS = 7` dla oferty ulozonej recznie. Roznica byla swiadoma
i opisana, ale zla z trzech powodow.

1. **Regulamin obiecywal juz siedem.** § o wycenie mowi "nie krocej niz 7 dni",
   a strony kalkulatorow, konfigurator sklepu i kreator zamowienia od dawna
   pisaly wprost "Cena wiazaca, wazna 7 dni". Czternastka zyla tylko w
   `llms.txt` i w bazie, czyli tam, gdzie klient jej nie widzial, a asystent
   powtarzal ja jako fakt.
2. **Czternascie dni to otwarta pozycja na kruszcu.** Zloto potrafi ruszyc sie
   o kilka procent w dwa tygodnie. Dluzszy termin dla wyceny liczonej z naszego
   cennika nie byl uprzejmoscia, tylko ryzykiem, ktorego nikt nie wycenil.
3. **Dwie stale o tym samym znaczeniu rozjezdzaja sie przy pierwszej zmianie.**
   Wlasnie to sie stalo: termin recznej oferty zmienil sie na siedem dni, a
   `llms.txt` dalej mowil czternascie.

## Decyzja

**Jedna stala, `QUOTE_VALIDITY_DAYS = 7`, dla kazdej drogi.** Wycena zapisana
z kalkulatora, oferta z rozmowy i oferta ze skrzynki dostaja ten sam termin.
`OFFER_VALIDITY_DAYS` znika; test pilnuje, ze nie wraca.

**Termin jest domyslny, nie sztywny.** Administrator ustawia wlasny na
konkretnej ofercie w panelu, w polu daty albo w polu liczby dni. Obowiazuje
zawsze data zapisana przy tej ofercie, nie stala. Wpisanie kwot nie nadpisuje
recznie ustawionego terminu.

**Oferty juz wyslane zostaja nietkniete** (decyzja wlasciciela, 2026-08-26).
Zadnej migracji terminow wstecz nie robimy. Data wiazaca klienta siedzi w
wierszu `quotes.valid_until`, nie w kodzie, wiec zmiana stalej sama z siebie
niczego nie skraca. Skrocenie terminu, ktory klient juz od nas dostal, byloby
wycofaniem sie z obietnicy handlowej, a oszczedza to najwyzej kilka dni
ekspozycji na kurs kruszcu. Gdyby ktos kiedys chcial "posprzatac" stare
wiersze zapytaniem na bazie: to jest wlasnie ta rzecz, ktorej nie robimy.

**Termin wchodzi przy zakladaniu numeru, na kazdej drodze.** Wczesniej wycena
z kalkulatora dostawala go dopiero przy wycenianiu, a przy zakladaniu miala
`valid_until = NULL`. Przerwane wycenianie zostawialo wtedy w bazie oferte bez
daty konca, czyli wiazaca nas bez ograniczenia. Teraz `createQuote` stempluje
termin zawsze, a `priceQuote` nadpisuje go swoim, rownym.

## Konsekwencje

- Klient, ktory zapisal wycene z kalkulatora, ma na nia tydzien zamiast dwoch.
  Robocizna zostaje w tym okresie wiazaca, kruszec dalej liczy sie z dnia
  otwarcia linku. Wyceny zapisane przed ta zmiana zachowuja swoja date, bo
  termin siedzi w wierszu, a nie w kodzie.
- `llms.txt`, strona `/payments/` i kontekst asystenta mowia teraz jedna liczbe
  i dodaja, ze obowiazuje data z konkretnej oferty.
- Regulamin nie wymaga zmiany: "nie krocej niz 7 dni" byl i zostaje prawda.
  Gdyby termin mial kiedys zejsc ponizej siedmiu, regulamin trzeba poprawic
  RAZEM z ta stala, bo wtedy przestanie byc prawda.

## Alternatywy odrzucone

- **Zostawic dwie stale i tylko wyrownac teksty.** Rozjazd wrocilby przy
  nastepnej zmianie jednej z nich.
- **Zejsc do trzech dni przy wyrobach z kruszcu.** Krotszy termin ma sens, ale
  nie jako liczba w kodzie: zalezy od wyrobu, a nie od drogi zamowienia. Do
  tego sluzy pole terminu w panelu.
