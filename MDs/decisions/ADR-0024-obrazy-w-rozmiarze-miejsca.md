---
status: draft
owner: Artur
date: 2026-08-27
deciders: Artur
supersedes: null
related:
  - src/components/HeroObraz.jsx
  - src/components/Obraz.jsx
  - src/data/heroObrazy.js
  - src/data/obrazyWarianty.js
  - scripts/build-hero-images.mjs
  - scripts/build-card-images.mjs
  - scripts/check-hero-images.mjs
  - scripts/check-card-images.mjs
---

# ADR-0024: Obraz idzie w rozmiarze miejsca, w ktorym stoi

## Kontekst

Serwis wysylal kazdy obraz w jednej wersji, tej najwiekszej, na kazde urzadzenie.
Trzy pomiary z 27 sierpnia 2026:

- `hero-studio.webp` wazyl 663 kB przy 2752 px szerokosci. Na telefonie rysowal
  sie na 390 px i byl obrazem LCP, wiec placilo za to KAZDE wejscie na `/studio/`.
- Pierwsze wejscie na strone glowna z telefonu pobieralo 699 kB samych kafelkow,
  prawie w calosci niewidocznych na pierwszym ekranie. `loading="lazy"` tego nie
  zalatwia: przegladarka pobiera kilka ekranow do przodu, tyle ze kazdy w pelnej
  rozdzielczosci.
- `public/img` wazylo 37 MB, z czego 23 MB to pliki PNG, ktore mialy juz swoje
  odpowiedniki WebP. Cztery z nich byly jeszcze uzywane w kodzie, reszta lezala
  martwa. Wszystkie jechaly na serwer przy kazdym wdrozeniu.

Osobno: obraz spolecznosciowy strony "O nas" wskazywal zdjecie warsztatu w pelnej
rozdzielczosci (2048 x 1536, 796 kB), ktore kazdy podglad linku musial pobrac w
calosci i tak samo przyciac.

## Decyzja

**Kazdy obraz istnieje w kilku szerokosciach, w AVIF i WebP, a wybor nalezy do
przegladarki.** Sluza do tego dwa komponenty i dwa skrypty:

| | obrazy pierwszego ekranu | obrazy w kafelkach |
|---|---|---|
| komponent | `HeroObraz` | `Obraz` |
| lista | `src/data/heroObrazy.js` | `src/data/obrazyWarianty.js` (generowana) |
| skrypt | `scripts/build-hero-images.mjs` | `scripts/build-card-images.mjs` |
| bramka | `scripts/check-hero-images.mjs` | `scripts/check-card-images.mjs` |
| warianty ida do | `public/img/hero/` | `public/img/w/` |

Bramki sa istotne, bo rozjazd jest tu CICHY: `srcset` wskazujacy plik, ktorego
nie ma, nie wywala strony, tylko po cichu wraca do oryginalu. Wszyscy widza
obraz, nikt nie widzi, ze wariantow nie ma.

Do tego:

- **Oryginaly obrazow bohaterskich wyprowadzone poza `public`**, do
  `assets-zrodla/hero/`. Nie ida na serwer, sluza wylacznie do przeliczenia
  wariantow. Zapasowe `src` w `<img>` wskazuje wariant sredniej wielkosci,
  a nie plik 2752 px.
- **Preload obrazu bohaterskiego czyta sie z gotowej strony.** `HeroObraz`
  oznacza obraz pierwszego ekranu przez `fetchpriority="high"`, a prerender
  przepisuje jego `srcset` do `<link rel="preload" imagesrcset>`. Zastapilo to
  recznie pisana mape "obraz do tras", ktora wczesniej preladowala 465 kB na
  95 stronach, ktore tych obrazow nie pokazuja.
- **Pliki PNG i JPEG majace odpowiednik WebP sa usuniete**, a cztery uzycia
  przestawione na WebP. `public/img` schudlo z 37 MB do 16 MB.
- **Osobny obraz spolecznosciowy dla strony "O nas"**, 1200 x 630 i 110 kB.
- **Znak marki w pasku i w stopce w wersji 128 px** (9 kB zamiast 48 kB),
  bo rysuje sie na 40 do 44 pikseli, na kazdej stronie serwisu.

## Konsekwencje

Telefon otwierajacy `/studio/` pobiera 29 kB zamiast 663 kB obrazu, a kafelki
na stronie glownej schodza z 699 kB do ulamka tego.

Kosztem sa dwie rzeczy. Po pierwsze, wariantow jest w repozytorium ponad tysiac
plikow: sa male, ale sa. Po drugie, dodanie nowego obrazu wymaga uruchomienia
`npm run img:cards` (albo `img:hero`), inaczej build padnie na bramce. To jest
zamierzone: lepiej, zeby przypomnial build niz klient.
