# Decyzje architektoniczne AEJaCA

ADR zapisuje decyzje, ktore musza przetrwac dluzej niz jedna sesja i obowiazuja
wiecej niz jeden plik albo model.

## Kiedy tworzyc ADR

- platnosci, ceny, zamowienia i dostep do danych;
- zmiana kontraktu frontend i backend;
- geometria i kryterium poprawnosci wyrobu;
- publiczne fakty o ofercie albo zobowiazania prawne;
- nowa technologia, trasa lub istotny wzorzec architektoniczny;
- rozstrzygniecie sprzecznosci pomiedzy dokumentami.

Nie tworz ADR dla formatowania, prostego refaktoru bez zmiany zachowania ani
lokalnej nazwy zmiennej.

## Nazwa

`ADR-NNNN-krotka-nazwa.md`, numer rosnacy bez ponownego uzycia.

## Cykl zycia

`draft` -> `accepted` -> opcjonalnie `superseded`.

Tylko Artur akceptuje decyzje zmieniajaca produkt, cene, prawo lub ryzyko.
Agent moze przygotowac `draft`. Zaakceptowanego ADR nie edytujemy tak, aby zmienic
jego sens. Tworzymy nowy ADR z polem `supersedes`.

## Szablon

```md
---
status: draft
owner: Artur
date: YYYY-MM-DD
deciders: Artur
supersedes: null
related:
  - sciezka/do/dokumentu.md
---

# ADR-NNNN: Tytul decyzji

## Kontekst

Mierzalny problem, ograniczenia i stan obecny.

## Decyzja

Jednoznaczny stan docelowy.

## Alternatywy

- Wariant: powod odrzucenia.

## Konsekwencje

- Korzysc.
- Koszt albo ryzyko.

## Niezmienniki i testy

- Warunek, ktory musi pozostac prawdziwy.
- Test pozytywny i kontrola negatywna.

## Synchronizacja

- Pliki, dokumenty i uslugi wymagajace aktualizacji.
```
