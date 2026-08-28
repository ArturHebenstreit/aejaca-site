---
status: draft
owner: Artur
date: 2026-08-27
deciders: Artur
supersedes: null
related:
  - index.html
  - src/index.css
  - public/fonts/
  - public/_headers
---

# ADR-0021: Kroje pisma stoja u nas, nie na serwerze Google

## Kontekst

Do 2026-08-27 `index.html` wciagalo arkusz z `fonts.googleapis.com` i laczylo
sie wczesniej z `fonts.gstatic.com`. Audyt calego serwisu z tego dnia pokazal
dwa niezalezne koszty tej wygody.

**Pierwsze malowanie czekalo na obcy host.** Serwer oddaje gotowy dokument w
siedem milisekund, a arkusz stylow z definicji blokuje rysowanie. W piaskownicy
z odcieta siecia dawalo to pierwszy piksel po dwunastu sekundach. W produkcji
Google odpowiada w kilkadziesiat milisekund i klient tego nie widzi, ale
zaleznosc jest prawdziwa i nie ma zapasowego wyjscia: gdy host zwolni albo
zablokuje go firmowa zapora, odwiedzajacy oglada biala strone tak dlugo, jak
trwa czekanie. Gotowy dokument lezy w tym czasie w przegladarce.

**Adres IP odwiedzajacego szedl do Google przed jakakolwiek zgoda.** Polityka
prywatnosci wymienia Google Ireland przy statystykach, opiniach i logowaniu,
o czcionkach nie mowila nic. Sprzedajemy do Niemiec, z niemieckim regulaminem
i niemiecka polityka, a Sad Krajowy w Monachium zasadzil za takie osadzenie
fontow odszkodowanie (3 O 17493/20, 20 stycznia 2022).

## Decyzja

Oba kroje leza w `public/fonts` jako pliki zmienne woff2:

- `inter-v20-latin.woff2` i `inter-v20-latin-ext.woff2`,
- `playfair-v40-latin.woff2` i `playfair-v40-latin-ext.woff2`.

Podzial na `latin` i `latin-ext` jest ten sam, ktorego uzywa Google, wiec drugi
plik pobiera sie dopiero przy znaku spoza latin-1. Nasz `latin-ext` jest
zawezony do Latin Extended-A (U+0100-017F), bo tylko stamtad bierzemy polskie
znaki: wazy przez to 14 kB zamiast 85 kB. Jeden plik zmienny zastepuje piatke
osobnych wag.

`index.html` preladuje wylacznie podzbiory `latin` obu krojow, bo to one rysuja
pierwszy ekran. Definicje `@font-face` stoja w `src/index.css`.

Nazwa pliku niesie wersje z Google Fonts (v20, v40), bo `_headers` cachuje
woff2 na rok jako `immutable`. Aktualizacja kroju wymaga nowej nazwy.

Polityka CSP stracila `https://fonts.googleapis.com` w `style-src` i
`https://fonts.gstatic.com` w `font-src`. Serwis nie prosi juz o nic z zewnatrz
poza tym, co bylo tam wczesniej z innych powodow.

## Konsekwencje

Znika obce polaczenie, znika zaleznosc pierwszego malowania od cudzego serwera
i znika sprawa do dopisania w polityce prywatnosci. Pliki ida z tego samego
polaczenia co reszta strony, wiec jest szybciej niz bylo.

Kosztem jest utrzymanie: aktualizacja kroju to recznie pobrany plik, nowa nazwa
z wersja i przeliczony podzbior. Robi sie to raz na kilka lat.

Licencje obu krojow (SIL OFL 1.1) leza razem z plikami w `public/fonts`.
