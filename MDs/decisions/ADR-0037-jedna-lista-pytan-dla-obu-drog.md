---
status: draft
owner: Artur
date: 2026-09-03
deciders: Artur
supersedes: null
related:
  - src/components/shop/PolaUslugi.jsx
  - src/components/shop/ServiceConfigurator.jsx
  - src/components/calculators/MetalCastCalc.jsx
  - src/components/calculators/EpoxyCastCalc.jsx
  - src/components/calculators/FiberLaserCalc.jsx
  - src/components/calculators/CO2LaserCalc.jsx
  - src/components/calculators/Print3DCalc.jsx
  - src/components/calculators/JewelryCalc.jsx
  - src/components/calculators/CalcToCart.jsx
  - src/data/orderCatalog.js
  - src/data/describeParams.js
  - scripts/test-quantity.mjs
  - scripts/check-hooki-po-wyjsciu.mjs
---

# ADR-0037: Jedna lista pytan dla obu drog do zamowienia

## Kontekst

Do tej samej uslugi prowadza dwie drogi. Karta uslugi w sklepie
(`/shop/service/<id>/`) i zakladka kalkulatora (`/studio/?tab=<id>`,
`/jewelry/`) zamawiaja to samo: obie wkladaja do koszyka pozycje
`kind: "service"` z tym samym `serviceId`, a kwota wiazaca w obu wypadkach
pochodzi z `/api/price`, czyli z jednego rdzenia w `src/pricing/`. Klient nie
zamawia dwoch roznych rzeczy i nie zaplaci dwoch roznych kwot.

Rozjezdzalo sie natomiast to, o co pytamy. Sklep czytal opis pol z
`orderCatalog.js`. Kalkulator mial wlasny JSX i wlasny slownik etykiet
w trzech jezykach. Dla odlewu byly to te same siedem pytan w tej samej
kolejnosci, opisane dwa razy.

Wpadka, ktora to ujawnila: regule "przy kruszcu AEJaCA nie wydajemy odlewu
z kanalami wlewowymi, a powloke galwaniczna kladziemy tylko na wykonczenie
jubilerskie" napisalismy w jednym commicie DWA RAZY, raz w katalogu, raz
w kalkulatorze. Nic w repozytorium nie porownuje tych dwoch list, wiec
nastepna taka regula rozjechalaby sie po cichu i zauwazylibysmy to dopiero
z zamowienia klienta.

Wlasciciel nazwal to wprost (2026-09-03): "zamawianie produktow tu i w sklepie
wyglada inaczej, klient bedzie sie zastanawial, czy zamawiam inna usluge".

## Decyzja

**Lista pytan, ich kolejnosc, etykiety i zaleznosci miedzy nimi stoja
wylacznie w `src/data/orderCatalog.js`. Rysuje je jeden komponent,
`src/components/shop/PolaUslugi.jsx`, w jednej z dwoch skor.**

Rozni sie tylko oprawa:

- `wyglad="sklep"`: pola jedno pod drugim, etykieta nad kontrolka.
- `wyglad="kalkulator"`: kazde pole w ponumerowanej kartce.

Wspolne sa: `polaWidoczne` (jeden filtr `hiddenWithFile` i `ukryjGdy`),
`wariantyPola` (`options` albo `optionsFrom`) i `poprawkiWyboru`, ktore
przystawia wybor spoza listy do najblizszej dostepnej wartosci, w renderze,
a nie efektem.

Trzy rzeczy, ktore z tego wynikaja i sa czescia decyzji:

1. **Zdjecie jest wlasnoscia pola, nie ekranu.** `widok: "zdjecia"` razem
   z `obrazy` stoi przy polu w katalogu, wiec kafelki wariantow odlewu
   pokazuja sie teraz takze na karcie uslugi w sklepie, gdzie wczesniej byly
   trzy napisy. Ujednolicenie idzie w gore, do lepszej wersji, a nie w dol.
2. **Numeracja krokow liczy sie z tego, co naprawde widac.** Wczesniej numery
   byly wpisane recznie, wiec przy schowanej powloce ekran szedl od ⑤ do ⑦.
3. **Wstawki maja swoje miejsce w ciagu.** Pole modelu i suwak skali nie sa
   pytaniem z katalogu, tylko narzedziem pomiaru, wiec wchodza jako `wstawki`
   wskazujace pole, za ktorym staja, i dostaja numer razem z reszta.

## Konsekwencje

Regula biznesowa dopisana do katalogu dociera na oba ekrany naraz i nie da sie
jej dopisac tylko na jednym. Kalkulator stracil wlasny slownik etykiet: dla
odlewu bylo to siedem pozycji razy trzy jezyki.

Bramka `scripts/test-quantity.mjs` sprawdza teraz droge dwojako: ekran rysuje
licznik sztuk sam albo oddaje pola wspolnej warstwie i podaje jej `tierKey`
razem z `onQty`. Osobno sprawdza, ze `PolaUslugi.jsx` licznik naprawde rysuje,
bo inaczej usuniecie go tam przeszloby przy zielonych obu drogach.

## Co przeniesienie ujawnilo

Wszystkie szesc kalkulatorow czyta teraz pytania z katalogu. Po drodze wyszlo
osiem rzeczy, ktorych nikt nie szukal, bo kazda z nich byla widoczna dopiero
przez porownanie dwoch drog:

1. **Stol lasera CO2 nie byl wyborem, a mimo to byl pytaniem.** Kalkulator mial
   krok "Obszar roboczy", w ktorym ZAWSZE dokladnie jedna kafelka byla
   klikalna, bo stol wynika z wielkosci pracy. Karta uslugi w sklepie nie
   pytala wcale i miala `extended: false` wpisane w wartosciach startowych,
   wiec sprzedawala grawer L za 110,37 zl przy wlasnej wycenie 150,00 zl
   i ciecie L za 73,21 zl przy 101,59 zl. Liczy to teraz
   `wymagaRozszerzonego` w rdzeniu cenowym i IGNORUJE to, co poda ekran.
   Decyzja wlasciciela: wyliczamy, nie pytamy.
2. **Obiektyw lasera fiber ogranicza pole znakowania** i ta regula stala tylko
   w kalkulatorze. Sklep pozwalal wybrac pole poza zasiegiem soczewki. Regula
   przeniosla sie do `areaOptionsForLens`. Przy okazji: sklepowe kafelki
   w ogole nie czytaly `disabled`, a pole znakowania bylo tam SUWAKIEM, a suwak
   nie umie wylaczyc przystanku. Przy ograniczonym zestawie schodzimy na
   kafelki, ktore potrafia byc nieklikalne i podac powod.
3. **Kalkulator wpisywal do koszyka opakowanie papierowe za zero groszy**, wiec
   ta sama usluga zamowiona z kalkulatora po cichu tracila krok, ktory karta
   uslugi oferuje. Opakowanie liczy sie ZA SZTUKE, wiec nalezy do pozycji,
   nie do przesylki: stoi teraz w panelu koszyka kalkulatora.
4. **Wybrany kolor zywicy nie dociera do zamowienia.** Byl na ekranie i w mailu
   z zapytaniem, ale nie w parametrach pozycji. Dopisanie go do parametrow nie
   wystarczylo: `describeParams.js` wypisuje tylko pola z katalogu plus krotka
   liste wyjatkow, wiec kolor bylby w pozycji i niewidoczny w koszyku, w mailu
   i w panelu. Trzeba bylo dopisac go w obu miejscach.
5. **Zlozonosc ksztaltu istniala tylko w sklepie** i blokowala tam koszyk, a
   kalkulator o nia nie pytal i nigdy nie blokowal. Teraz pyta i przekazuje.
6. **Trzy uslugi startowaly od innych wartosci po obu stronach**: obiektyw
   fiber (70 mm w katalogu, 150 mm w kalkulatorze), wypelnienie FDM (`medium`
   kontra `low`), zywica i wykonczenie odlewu zywicznego. Ta sama usluga miala
   dwie rozne kwoty startowe, zaleznie od tego, ktoredy klient wszedl.
7. **Trzynascie zywic w jednej siatce.** Karta uslugi MSLA wykladala je naraz,
   kalkulator pytal najpierw o rodzaj. Segment przeniosl sie do katalogu, wiec
   obie drogi pytaja dwa razy po cztery, a nie raz o trzynascie.
8. **Wybor lancuszka gasil caly kalkulator jubilerski.** `CalcToCart` ma
   wczesne wyjscie dla konfiguracji, ktorej nie wycenimy wiazaco, a ponizej
   niego stal efekt zglaszajacy kwote. W chwili, gdy warunek przechodzil
   z falszu w prawde przy zywym komponencie, React liczyl mniej hookow niz
   w poprzednim renderze i odmontowywal drzewo. **Ten blad byl w serwisie
   przed cala ta praca**, przy zielonym buildzie i zielonym prerenderze, bo
   prerender rysuje pierwszy ekran, a usterka wymaga klikniecia. Pilnuje tego
   teraz `scripts/check-hooki-po-wyjsciu.mjs`, ktory przy pierwszym przebiegu
   znalazl jeszcze jedno takie miejsce, w `ServiceConfigurator`.

## Konsekwencje, ciag dalszy

Czego ta decyzja NIE zalatwia:

- Skora zostaje rozna z wyboru: kalkulator prowadzi krok po kroku i pokazuje
  widelki szacunku, sklep jest krotka droga do koszyka.
- Narzedzia obslugujace wylacznie sciezke zapytania (projektant lancuszka,
  wiersze kamieni, masa z kruszcu powierzonego, wymiary wyrobu, pole pliku)
  zostaja przy kalkulatorach jako `wstawki` i `dodatki`. Nie sa pytaniami
  katalogu, bo sklep tej sciezki nie prowadzi: wycena wiazaca istnieje tylko
  dla odlewu prostej bryly z naszego kruszcu.
- `/studio/?tab=<cokolwiek>` wyrzuca okolo czterdziestu bledow hydratacji na
  KAZDEJ zakladce, takze przed ta praca: prerender rysuje strone z zakladka
  domyslna, a przegladarka natychmiast przestawia ja na te z adresu. Osobna
  sprawa, nietknieta.
