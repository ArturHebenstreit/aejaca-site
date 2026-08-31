---
status: draft
owner: Artur
date: 2026-08-31
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0013-etap-jest-statusem.md
  - MDs/decisions/ADR-0026-zaplata-zamyka-pozycje.md
  - chat-api/drogiZamkniecia.js
  - chat-api/orderMail.js
  - admin/views/queue.ejs
  - src/data/termsContent.js
---

# ADR-0033: Cztery drogi wyjscia ze sprawy, kazda z inna kwota

## Kontekst

Kolejka pracowni prowadzila zlecenie wylacznie do przodu: zaplata, ustalenia,
praca, wydanie, odbior. Wyjscia w bok nie bylo prawie wcale. Jedyne, co
istnialo, to `POST /api/orders/:ref/cancel`, dostepne w trzech stanach
sprzed wplaty (`draft`, `awaiting_payment`, `awaiting_transfer`). Po zaplacie
nie dalo sie zamknac sprawy w ogole, a wlasnie po zaplacie zdarza sie to,
o co chodzi: klient sie rozmysla, my nie dowozimy, plik okazuje sie nie do
wykonania.

Rzecz nie sprowadza sie do jednego przycisku, bo **regulamin rozroznia cztery
zdarzenia, ktore roznia sie tym, ile pieniedzy wraca**:

1. **Odstapienie konsumenta w 14 dni.** Prawo z ustawy, przy towarze
   kupionym na odleglosc. Wraca wszystko razem z najtansza wysylka.
2. **Odstapienie, bo nie dowiezlismy.** Klient nie przyjal nowego terminu
   (regulamin, rozdzial o terminach) albo plik mial wade uniemozliwiajaca
   wykonanie. Regulamin obiecuje zwrot wszystkich kwot w 14 dni.
3. **Anulowanie nasza decyzja.** Nie podejmujemy sie roboty. Wraca wszystko.
4. **Rezygnacja klienta z rzeczy robionej na zamowienie.** Prawa odstapienia
   tu NIE MA (regulamin par. 11, art. 38 pkt 3 UPK) i mowimy o tym przed
   zamowieniem. Kwota zwrotu jest decyzja handlowa, bo material bywa juz
   kupiony, a wydruk zrobiony.

Jeden przycisk "Anuluj" sklejalby te cztery w jedno. Po pol roku nie dalo by
sie odpowiedziec, czemu przy jednej sprawie wrocilo wszystko, a przy drugiej
nic, ani czy zwrot byl obowiazkiem, czy naszym gestem.

## Decyzja

### 1. Cztery drogi, wybierane swiadomie

`chat-api/drogiZamkniecia.js` trzyma liste: nazwa, opis, zasada zwrotu
i etapy, na ktorych droga stoi otworem. Lista jedzie do panelu razem
z kolejka, tak samo jak lista przewoznikow: druga kopia w panelu rozjechalaby
sie przy pierwszej zmianie regulaminu.

**Zadna droga nie jest zaznaczona z gory.** Wybor ma byc decyzja, a nie
skutkiem przeoczenia przy zamykaniu cudzego zamowienia.

### 2. Etap decyduje, ktore drogi widac

Przed wydaniem rzeczy otwarte sa wszystkie cztery. **Po wydaniu zostaje samo
odstapienie konsumenta**, bo to jest wlasnie ten przypadek, w ktorym klient
odsyla paczke. Pozostale trzy po wydaniu nie sa juz zamknieciem sprawy, tylko
reklamacja albo zwrotem, a to inna droga i inne terminy.

### 3. Ostrzegamy, zamiast blokowac

Przy odstapieniu w 14 dni panel pisze, ze przy rzeczy robionej na zamowienie
to prawo nie przysluguje. Nie blokuje: czy dana sztuka byla robiona na miare,
wie czlowiek, a nie kolumna w tabeli. Zamowienie ze sklepu bywa i towarem
z polki, i usluga wykonana wedlug pliku klienta.

### 4. Kwota stoi OSOBNO od stanu sprawy

Stan konczy sie na jednym: `cancelled`. To, ile sie nalezy i czy pieniadze
poszly, mowia `refund_grosze` i `refunded_at`.

Drugi stan koncowy ("zwrocone") znaczylby, ze `cancelled` zaczyna znaczyc
"anulowane, ale pieniadze jeszcze wisza": dwie nazwy na jedna rzecz i pytanie
bez odpowiedzi przy kazdej z nich. Sprawa zamknieta z pelnym zwrotem i sprawa
zamknieta bez zwrotu sa na tym samym etapie i roznia sie wylacznie kwota.

**Podpowiedz kwoty idzie za obowiazkiem**: przy trzech pierwszych drogach cala
wplata, przy czwartej zero. Pole zostaje do reki, bo ile materialu poszlo, wie
czlowiek. Sufitem jest to, co klient naprawde zaplacil.

### 5. Decyzja to nie przelew

`refunded_at` stawia osobne potwierdzenie, a nie zamkniecie sprawy. Miedzy
decyzja a wykonaniem stoi czlowiek przy koncie bankowym, czasem nastepnego
dnia. Zapisanie obu naraz robiloby z zamiaru fakt.

Dopoki zwrot sie nalezy i nie poszedl, **kolejka pokazuje go na czerwono nad
lista**, poza filtrem. Sprawa zamknieta nie stoi w domyslnym widoku, wiec bez
tego paska zobowiazanie znikaloby z ekranu razem z wierszem, a nie widac go
nigdzie indziej w panelu.

### 6. Kazda droga ma wlasny mail

Cztery rozne zdarzenia, cztery rozne teksty i cztery rozne tematy, w kazdym
z trzech jezykow. Jeden wspolny brzmialby jak formularz, a przy naszej winie
wygladalby na obojetnosc.

O pieniadzach piszemy w tej samej wiadomosci, bo pierwsze pytanie po jej
przeczytaniu brzmi zawsze tak samo. Trzy przypadki maja trzy zdania: wraca
calosc, wraca czesc, nie wraca nic. Milczenie o pieniadzach czyta sie jak zla
wiadomosc, nawet gdy nia nie jest.

## Alternatywy i powody odrzucenia

- **Jeden przycisk "Anuluj" z polem na powod.** Najtanszy i najszybszy do
  zrobienia. Odrzucony: powod wpisany recznie nie da sie policzyc ani
  sprawdzic, a to on decyduje, czy zwrot byl obowiazkiem. Przy sporze
  z klientem "klient zrezygnowal" i "nie dowiezlismy" to dwa rozne swiaty.
- **Drugi stan koncowy `refunded`.** Kusi, bo stan `refunded` stoi
  w ograniczeniu tabeli od poczatku i nic go nigdy nie ustawialo. Odrzucony
  z powodu z punktu 4: rozmywa znaczenie `cancelled` zamiast cokolwiek
  wyjasniac. Wartosc zostaje w ograniczeniu jako slad po niedokonczonym
  pomysle i nadal nikt jej nie ustawia.
- **Automatyczny zwrot przez bramke platnicza.** Kuszace, bo pieniadze
  wracaja same. Odrzucone na teraz: wymaga trasy zwrotow u operatora
  i osobnych uprawnien, a bledny zwrot automatyczny jest trudniejszy do
  cofniecia niz recznie zrobiony przelew. Zapis "do zwrotu" plus recznie
  potwierdzony przelew daje ten sam efekt bez tego ryzyka.
- **Blokowanie odstapienia przy rzeczy na zamowienie.** Odrzucone: system nie
  wie na pewno, ktora sztuka byla robiona na miare, a blokada oparta na
  zgadywaniu kazalaby ja obchodzic i uczyla, ze panelu nie warto sluchac.

## Konsekwencje

- **Zamknac sprawe da sie teraz na kazdym etapie**, takze po zaplacie i po
  wydaniu. Dotad po zaplacie nie dalo sie wcale.
- **Filtr "Zamkniete bez zaplaty" nazywa sie teraz "Zamkniete"**, bo stara
  nazwa mowilaby nieprawde o polowie wierszy.
- **Towar i kod rabatowy wracaja do puli**, ale tylko te niezuzyte. Sztuka
  wydana z magazynu do gotowego wyrobu nie wraca na polke przez zapis
  w tabeli.
- **Pojawilo sie zobowiazanie, ktore da sie przegapic**: sprawa zamknieta
  z niezwroconymi pieniedzmi. Stad czerwony pasek nad kolejka.

## Niezmienniki i testy

- Drog jest cztery, kazda z opisem i etapami; po wydaniu rzeczy zostaje samo
  odstapienie konsumenta. Test: `scripts/test-zamkniecie-sprawy.mjs`.
- Podpowiedz kwoty: pelna wplata przy obowiazku, zero przy decyzji, nigdy
  wiecej niz zaplacono. Test: jak wyzej.
- Zamkniecie nie ustawia `refunded_at`; robi to osobne potwierdzenie.
  Test: jak wyzej.
- Pieniadze do oddania licza sie POZA filtrem kolejki. Test: jak wyzej.
- Kazda droga ma wlasny temat maila w pl, en i de. Test: jak wyzej.

## Synchronizacja

- `scripts/orders-schema.sql`: kolumny `cancel_kind`, `refund_grosze`,
  `refunded_at` razem z powodem, dla ktorego stoja osobno.
- `chat-api/context.js`: asystent wie, ze sprawe da sie zamknac na kazdym
  etapie i ze zwrot zalezy od drogi.
