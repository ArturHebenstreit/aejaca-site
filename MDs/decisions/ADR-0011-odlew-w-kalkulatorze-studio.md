---
status: accepted
owner: Artur
date: 2026-08-25
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0010-odlewy-z-metali-szlachetnych.md
  - src/components/calculators/MetalCastCalc.jsx
  - src/pricing/preciousMetalCasting.js
  - MDs/handoffs/TASK-009-odlew-w-kalkulatorze.md
---

# ADR-0011: Odlew z metali szlachetnych jako piata zakladka kalkulatora sTuDiO

## Kontekst

ADR-0010 wprowadzil odlew z metali szlachetnych jako usluge sklepu. Klient
trafial na wycene tylko wtedy, gdy wszedl na karte uslugi. Kalkulator projektowy
sTuDiO, czyli miejsce, do ktorego prowadzi strona `/studio/` i wiekszosc
odnosnikow z tresci, tej uslugi nie znal wcale.

Rdzen cenowy `src/pricing/preciousMetalCasting.js` juz istnial i liczyl
poprawnie, wiec brakowalo wylacznie powierzchni.

## Decyzja

Odlew dostaje piata zakladke kalkulatora zaawansowanego sTuDiO
(`?tab=metal_cast`), zbudowana na tym samym rdzeniu cenowym co karta sklepu.
Pole pliku i suwak skali sa brane z komponentow sklepu (`ConfigControls`),
a nie pisane drugi raz, wiec ostrzezenia o limicie kolby i o wplywie skalowania
na grubosc scianek maja jedno zrodlo.

Wiazaca cena automatyczna dziala wylacznie dla wariantu z modelem 3D i kruszcu
AEJaCA. Kazda inna kombinacja konczy sie wycena indywidualna i tak jest nazwana
na ekranie.

Odlew wchodzi takze do szybkiej wyceny, jako szosty kafelek materialu. Szybka
wycena dokłada tam JEDNO pytanie, o kruszec, bo srebro i zloto 18k dzieli
kilkadziesiat razy i tego jednego nie wolno zgadnac za klienta. Bez pliku 3D ta
sciezka nie podaje kwoty wcale: przedzial wielkosci opisuje gabaryt, a nie
objetosc kruszcu, wiec liczba wzieta z niego bylaby zmyslona.

Przy okazji rdzen dostaje dwie poprawki, bez ktorych ta powierzchnia klamalaby:

1. Widelki przesuwaja sie o doplaty za przygotowanie wzorca i wykonczenie.
   `calcNew` liczy zakres z ceny sprzed tych doplat, wiec kalkulator pokazywalby
   zakres nizszy od kwoty do zaplaty o stale 120 do 280 zlotych.
2. Rdzen przyjmuje `qty`, czyli rzeczywista liczbe sztuk, i podaje ja dalej.
   Bez tego obowiazywalby naklad reprezentatywny progu, wbrew regule 6.0g.

## Alternatywy

- Osobny kalkulator jubilerski dla odlewu: odrzucone, bo w sklepie usluga nalezy
  do sTuDiO, a droga wiedzie przez model 3D i wydruk wzorca. Dwa wejscia do tej
  samej uslugi w dwoch dzialach to rozjazd, a nie wygoda.
- Wlasne pole pliku i wlasny suwak w kalkulatorze: odrzucone, bo ostrzezenia
  o kolbie i o skalowaniu rozjechalyby sie ze sklepem przy pierwszej zmianie.

## Konsekwencje

- Jedno zrodlo ceny dla sklepu i kalkulatora, wiec dwie liczby nie moga sie
  rozjechac.
- Kalkulator sTuDiO ma piec zakladek, wiec siatka kafelkow idzie na piec kolumn.
- Rdzen odlewu jest teraz wrazliwy na to, z ktorej listy pochodzi `qtyId`.
  Progi sTuDiO daja `null`, co pilnuje test.

## Niezmienniki i testy

- Widelki zawsze obejmuja kwote wiazaca. Test: `scripts/test-precious-metal-casting.mjs`.
- Kazdy prog ilosci dostepny w kalkulatorze daje cene, a prog studyjny daje `null`.
- Rozpiska trzyma jedna walute na jezyk.
- Kontrola negatywna: usuniecie przesuniecia widelek wywala test komunikatem
  o kwocie poza zakresem.

## Synchronizacja

- `public/llms.txt`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md` (6.4b),
  `public/sitemap.xml` (`lastmod` dla `/studio/`).
- `npm run sync:pricing` po kazdej zmianie rdzenia, bo `chat-api/pricing/` to kopia.
