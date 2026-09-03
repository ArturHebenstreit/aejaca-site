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
  - src/data/orderCatalog.js
  - scripts/test-quantity.mjs
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

Czego ta decyzja NIE zalatwia, a co dalej rozni obie drogi:

- Kalkulator wpisuje do koszyka `packagingId: "paper"` i zero groszy, wiec ta
  sama usluga zamowiona z kalkulatora traci krok opakowania.
- Skora zostaje rozna z wyboru: kalkulator prowadzi krok po kroku i pokazuje
  widelki szacunku, sklep jest krotka droga do koszyka.
- Piec pozostalych kalkulatorow (druk 3D, laser CO2, laser fiber, odlew
  zywiczny, jubilerka) nadal ma wlasne listy pol.
