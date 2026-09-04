---
status: draft
owner: Artur
date: 2026-09-04
deciders: Artur
supersedes: null
related:
  - chat-api/narzedziaAsystenta.js
  - chat-api/server.js
  - chat-api/context.js
  - scripts/test-narzedzia-asystenta.mjs
  - MDs/MAPA_CEN.md
---

# ADR-0040: Asystent liczy tym samym kodem, co koszyk

## Problem

Asystent na stronie znał ceny wyłącznie z tekstu wklejonego do polecenia
systemowego: kilkaset linii tabel, widełek i przykładów. To wystarcza na pytanie
„od ilu zaczynają się ceny druku". Nie wystarcza na pytanie „ile kosztuje
dwadzieścia breloczków z PETG", bo na nie odpowiada wyłącznie rachunek. Model
językowy odpowiadał wtedy z pamięci i mylił się: przegląd z 3 września złapał
cztery odpowiedzi o pieniądzach niezgodne z kalkulatorem.

Do tego dochodziła druga rodzina błędów, tego samego rodzaju. Warunki kodów
rabatowych też stały w tekście polecenia, obok tabeli `RODZAJE_KODOW`
w `chat-api/discounts.js`, i już się z nią rozjechały: polecenie mówiło o 90
dniach ważności kodu powitalnego, gdy kod od 31 sierpnia żyje 45 (ADR-0038).

**Liczba stojąca w dwóch miejscach rozjedzie się.** Rozmowa z asystentem nie
przechodzi przez żadną bramkę, więc rozjazd był całkowicie cichy.

## Decyzja

**Asystent dostaje trzy narzędzia i to one, a nie tekst polecenia, są źródłem
kwot i warunków kodów.**

| Narzędzie | Co zwraca | Skąd bierze |
|---|---|---|
| `lista_uslug` | identyfikatory usług, klucze parametrów, warianty | `orderCatalog.js` |
| `policz_cene` | szacunek ceny dla usługi i parametrów | `priceItem`, ten sam kod, który wystawia kwotę w koszyku |
| `warunki_kodu` | procent, ważność w dniach, powtarzalność | `RODZAJE_KODOW` |

Trzy zasady, które przy tym obowiązują.

**Nie ma drugiej formuły cenowej.** `chat-api/narzedziaAsystenta.js` woła
`priceItem` i nie ma własnej tabeli stawek. Własna rozjechałaby się z rdzeniem
cenowym przy pierwszej zmianie i nikt by tego nie zobaczył.

**Asystent nigdy nie wystawia kwoty wiążącej.** Kwota wiążąca powstaje
w koszyku, ma numer i termin siedmiu dni, a jej podstawa musi dać się zmierzyć
(`bindingBasis`). Rozmowa nie niesie pliku klienta, więc każda odpowiedź wraca
jako szacunek razem z powodem, którego brakuje, i z adresem karty usługi.

**Parametry dobrane za klienta są wymienione w odpowiedzi.** Cicho dobrany
wariant to kwota policzona za co innego, niż klient pytał, a on nie ma jak tego
zauważyć. Osobno traktujemy próg nakładu: **liczba sztuk rządzi, próg z niej
wynika**, tak samo jak na karcie usługi. Bez tego kroku dwadzieścia sztuk liczyło
się po cenie progu „prototyp", czyli **drożej** niż w sklepie za to samo
zamówienie.

## Jak to jest zrobione

Runda narzędziowa jest osobna i nie strumieniuje się: pytamy raz, bez strumienia,
czy model chce coś policzyć, wykonujemy wywołania, a dopiero odpowiedź końcowa
idzie do przeglądarki po kawałku. Dzięki temu nie trzeba składać wywołań narzędzi
z fragmentów strumienia, co jest źródłem cichych błędów, a klient i tak widzi
tekst tak samo płynnie.

Rund jest najwyżej dwie. Model, który po dwóch nadal woli liczyć, zapętliłby
rozmowę na nasz koszt.

Kursy kruszców i ceny kamieni ściągamy tylko wtedy, gdy model naprawdę chce
liczyć. Bez nich biżuteria policzyłaby się z kursu zapasowego, czyli z innej ceny
niż ta, którą widzi klient w sklepie.

## Konsekwencje

Pytanie o cenę dostaje odpowiedź policzoną, a nie zapamiętaną. Odpowiedź niesie
przy tym trzy rzeczy, których wcześniej nie było: konfigurację, za którą ta kwota
jest, powód, dla którego to jeszcze nie jest kwota wiążąca, i adres, pod którym
klient domyka wycenę sam.

Cena: każde pytanie o kwotę to jedno dodatkowe wywołanie modelu (runda
narzędziowa) plus wywołanie strumieniowe. Runda narzędziowa idzie na
`temperature: 0` i `max_tokens: 400`, więc jest tania, ale nie darmowa.

Pilnuje tego `scripts/test-narzedzia-asystenta.mjs` w `npm run build`: każda
usługa z katalogu odpowiada kwotą albo powodem, nigdy ciszą; żadna odpowiedź nie
podaje się za wiążącą; dwadzieścia sztuk jest tańsze za sztukę niż jedna; warunki
kodu zgadzają się z tabelą rodzajów co do liczby; a trasa czatu naprawdę podaje
narzędzia modelowi, bo moduł może być doskonały i nieużywany.

## Czego ta decyzja NIE rozstrzyga

Odlew z metalu szlachetnego i druk z pliku nadal wymagają modelu 3D, więc
asystent zwraca dla nich powód i adres zamiast kwoty. Tak ma zostać: bez
zmierzonej bryły nie ma obronialnej masy, a przedział rozmiarów opisuje obrys,
nie objętość kruszcu.

Asystent nadal nie dodaje niczego do koszyka i nie zakłada zamówienia. Rozmowa
kończy się odnośnikiem, a decyzję o zakupie podejmuje człowiek na stronie usługi.
