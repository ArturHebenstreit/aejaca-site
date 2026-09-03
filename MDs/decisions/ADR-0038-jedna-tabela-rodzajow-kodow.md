---
status: draft
owner: Artur
date: 2026-09-03
deciders: Artur
supersedes: null
related:
  - chat-api/discounts.js
  - chat-api/server.js
  - chat-api/context.js
  - scripts/test-prezent.mjs
  - scripts/test-wiedza-asystenta.mjs
  - MDs/MAPA_CEN.md
---

# ADR-0038: Warunki kodu rabatowego stoją w tabeli, nie w trasie

## Problem

Serwis wystawia kody rabatowe czterema drogami: powitanie w newsletterze, rabat
doklejony do wyceny sprzed tygodnia, prezent od pracowni i kod założony ręcznie
w panelu. Każda z trzech pierwszych miała swoje warunki **wpisane w treść trasy,
która ją obsługiwała**: procent, ważność, granice ważności, nazwę kampanii,
przedrostek i sposób budowania notatki.

Trzy skutki, wszystkie potwierdzone w kodzie 2026-09-03:

1. **Pytanie „ile jest ważny kod powitalny" wymagało czytania kodu.** Nie było
   miejsca, w którym ta liczba stoi jako fakt. Wiedza asystenta odpowiadała na
   nie samodzielnie i odpowiadała źle: mówiła 90 dni, gdy kod od 31 sierpnia
   żyje 45.

2. **Przedrostek kodu potrafił skłamać o jego wartości.** Trasa kodu
   powitalnego miała `prefix: "AEJ10"` wpisane na sztywno, a procent brała
   z żądania. Wystarczyło, żeby n8n przysłał `percent: 15`, i klient dostawał
   kod o nazwie `AEJ10-XXXXXX` wart piętnaście procent. Przy `percent: 5`
   działało to w drugą stronę: nazwa obiecywała dziesięć, kod dawał pięć.
   Nazwa kodu jest pierwszą rzeczą, którą klient czyta.

3. **Czwarty rodzaj znaczył czwartą kopię tych samych walidacji.** Prezent,
   dołożony 3 września, powtórzył sprawdzenie zakresu procentu, obcięcie liczby
   dni i obsługę kolizji losowania, bo nie było gdzie ich odziedziczyć.

## Decyzja

**Rodzaje kodów opisuje jedna tabela `RODZAJE_KODOW` w `chat-api/discounts.js`,
a wystawia je jedna funkcja `wystawKod`.** Trasa podaje nazwę rodzaju i to, co
odbiega od jego warunków domyślnych, a nie całą regułę od nowa.

| Rodzaj | Kampania | Domyślnie | Ważność | Powtarzalny |
|---|---|---|---|---|
| `newsletter` | `newsletter` | 10% | 45 dni (7 do 365) | tak |
| `rabat_do_wyceny` | `quote-followup` | 5% | 14 dni (7 do 365) | tak |
| `prezent` | `prezent` | 10% albo kwota | 90 dni (1 do 730) | **nie** |

Dwie rzeczy wynikają z tej tabeli, a nie stoją obok niej:

**Przedrostek wynika z wartości.** `AEJ${wartość}` dla procentu, `AEJP` dla
prezentu. Nazwy i wartości nie da się już rozjechać.

**`powtarzalny` jest jedyną rzeczą, która różni te rodzaje mechanicznie.** Kod
powitalny i rabat do wyceny są powtarzalne: ten sam adres pytany drugi raz
dostaje **ten sam** kod, bo inaczej wystarczyłoby zapisać się pięć razy albo
poprosić o pięć wycen. Prezent powtarzalny nie jest: dwa prezenty dla tej samej
osoby to dwa różne prezenty, często o różnej wartości, więc drugi przejmowałby
po cichu wartość pierwszego, a panel pokazywałby jeden kod zamiast dwóch.

## Konsekwencje

Dołożenie piątego rodzaju to jeden wpis w tabeli, bez nowej trasy i bez kopii
walidacji. Odpowiedź na pytanie o ważność stoi w jednym miejscu i czyta ją
także bramka wiedzy asystenta (`scripts/test-wiedza-asystenta.mjs`), więc tekst
dla klienta nie może już powiedzieć innej liczby niż kod.

Cena tej zmiany: rodzaj kodu jest teraz pojęciem, które trzeba znać, zanim się
kod wystawi. Wywołanie `wystawKod` bez znanego rodzaju oddaje `null`, a nie
kod o domyślnych warunkach. To jest zamierzone: kod bez rodzaju nie ma
kampanii, więc nie dałoby się go później znaleźć ani policzyć.

## Czego ta decyzja NIE rozstrzyga

Kod zakładany ręcznie w panelu nadal nie ma rodzaju: właściciel wpisuje mu
wszystkie warunki sam i tak ma zostać, bo to jest droga na rzeczy nietypowe.
Gdyby okazało się, że pewne układy powtarzają się w panelu, będą kolejnym
wpisem w tej samej tabeli, a nie osobnym mechanizmem.
