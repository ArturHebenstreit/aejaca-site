# Prompty grafik do odlewu żywicznego (formy i zatopienia)

Status: DO WYGENEROWANIA. Powstały 10 września 2026, razem z przebudową pola formy
(ADR-0047). Trzy kafelki dróg powstania formy używają na razie zdjęć po wycofanych
wariantach rozmiarowych: pokazują formy silikonowe, więc nie kłamią, ale nie pokazują
tego, czym te drogi się różnią. Dwa sposoby na napis nie mają zdjęcia w ogóle i rysują
się jako sześciokątny znak zastępczy.

## Styl domowy

Ten sam co w `Prompty_Grafiki_MSLA.md` i co w polu `imagePrompt` w `serviceCatalog.js`:
czarne tło, jedno światło kluczowe z góry-lewej, premium product photography, bez ludzi
poza kadrami, w których dłonie są sensem zdjęcia, bez napisów nałożonych na obraz, bez
logo, bez znaku wodnego. Odlew żywiczny należy do AEJaCA sTuDiO, więc światło obrysowe
jest chłodne, niebieskie, a ciepłe refleksy zostają na samym materiale.

Ustawienia: **aspectRatio `1:1`, imageSize `1K`** (1024 × 1024). Pliki docelowe w
repozytorium mają 512 × 512, przeskalowanie robimy po odebraniu, żeby katalog został
jednorodny.

## Gdzie co ląduje

Pięć kafelków formy rysuje `HeroCards`, czyli zdjęcie przycięte do pasa poziomego,
z czarnym gradientem od dołu i napisem na nim. **Dolna jedna trzecia kadru zniknie pod
napisem**, więc sens zdjęcia ma być w środku i w górnej części.

Kafelki zatopień rysuje `MaterialCards`, czyli pełny kwadrat z podpisem POD obrazem.
Tam nic nie zasłania kadru, przedmiot ma stać centralnie.

## Prompty

| Plik docelowy | Co ma pokazać | Prompt (EN) |
|---|---|---|
| `public/img/calc/resin_molds/from_object.webp` | Przedmiot KLIENTA w ramce, zalewany silikonem | A small heirloom object, a carved bone charm, resting face-up at the bottom of a 3D-printed rectangular casting frame, blue-grey liquid silicone being poured around it from a mixing cup, silicone surface glossy and level, the object still visible under the rising silicone, matte black bench, cool blue rim light from upper left, warm highlight on the object, black background, premium macro product photography, no text, no logo, no watermark |
| `public/img/calc/resin_molds/from_file.webp` | Wydrukowany wzorzec, polerowany do lustra | A small 3D-printed master pattern in glossy black resin, an oval pendant shape with crisp edges, half of its surface already polished to a mirror and half still matte from sanding, fine abrasive pads and a polishing cloth beside it, matte black jeweler bench, cool blue rim light from upper left, sharp specular reflection on the polished half, black background, premium macro product photography, no text, no logo, no watermark |
| `public/img/calc/resin_molds/from_design.webp` | Projekt 3D obok wydrukowanego z niego wzorca | A faceted crystal-shaped pendant rendered as a blue wireframe CAD model glowing on a dark screen in the background, softly out of focus, and in sharp focus in the foreground the same shape as a physical 3D-printed master pattern in dark grey resin standing on a matte black bench, cool blue rim light from upper left, black background, shallow depth of field, premium macro product photography, no text, no logo, no watermark |
| `public/img/calc/resin_inclusions/text_plate.webp` | Srebrna blaszka z grawerem, zatopiona w bryle | A small rectangular plate of polished sterling silver, cool white metal with a bright mirror surface, engraved with fine evenly spaced flowing lines, suspended inside a small block of perfectly clear cured epoxy resin, the block filling most of the frame, standing upright on a matte black surface, light refracting through the clear edges, cool blue rim light from upper left, black background, premium macro product photography, no hands, no gloves, no mold, no frame, no tools, the metal must read as cool silver and never as gold or brass, engraving must read as clean deliberate fine lines and not as lettering and not as random scratches, no text, no logo, no watermark |
| `public/img/calc/resin_inclusions/text_print.webp` | Napis drukowany w żywicy, zatopiony w bryle | A thin translucent white 3D-printed resin plaque with a raised relief pattern, suspended inside a block of perfectly clear cured epoxy resin, the plaque almost the same material as the block so it reads as soft and integrated rather than as a foreign object, resin block upright on a matte black surface, cool blue rim light from upper left, black background, premium macro product photography, relief must read as clean abstract raised lines and not as lettering, no text, no logo, no watermark |

## Kiedy zdjęcie odrzucamy

- **Widać zniekształcone litery.** Dwa ostatnie prompty celowo proszą o kreski,
  a nie o napis, bo generator prawie zawsze psuje pismo, a kafelek ze zniekształconym
  słowem wygląda gorzej niż kafelek bez napisu. Podpis pod kafelkiem mówi klientowi,
  co widzi, więc zdjęcie nie musi tego literować.
- **Sens zdjęcia siedzi w dolnej jednej trzeciej** (dotyczy trzech kafelków formy).
  Tam wejdzie czarny gradient i biały napis.
- **Bryła żywicy ma pęcherzyki w widocznym miejscu.** Karta usługi mówi wprost, że
  nie obiecujemy odlewu bez pęcherzyków, ale zdjęcie poglądowe pokazuje wynik, do
  którego dążymy, a nie wynik przeciętny.
- **Zdjęcie jest ciepłe, żółte.** Odlew żywiczny to sTuDiO, czyli światło chłodne.

## Co robimy po odebraniu plików

1. Pliki zapisujemy pod dokładnie tymi nazwami, które stoją w tabeli.
2. `npm run img:cards` tnie każdy na warianty 256, 384, 512 w AVIF i WebP i dopisuje
   je do `src/data/obrazyWarianty.js`. Bez tego kroku build pada na bramce obrazów.
3. W `src/pricing/epoxy.js` trzy drogi formy dostają `img` wskazujący nowe pliki
   zamiast `new_s`, `new_m` i `new_l`, a `text_plate` i `text_print` dostają `img`
   w ogóle, bo dziś go nie mają.
4. `npm run build` i sprawdzenie kafelków w przeglądarce w dwóch szerokościach.

## Gotowe polecenia, gdyby generować u siebie

`scripts/gemini-image.mjs` bierze prompt i ścieżkę wyjściową, więc pliki lądują od razu
pod właściwą nazwą. Wymaga `GEMINI_API_KEY` **w powłoce lokalnej**.

> **Klucz nie idzie do pola „Environment variables" środowiska w chmurze.** To pole widzi
> każdy, kto z tego środowiska korzysta. Dlatego generujemy lokalnie albo przez interfejs
> Gemini, a do repozytorium wracają same pliki.

```bash
export GEMINI_API_KEY="..."   # tylko w tej powloce, nie w pliku, nie w repozytorium

node scripts/gemini-image.mjs "A small heirloom object, a carved bone charm, resting face-up at the bottom of a 3D-printed rectangular casting frame, blue-grey liquid silicone being poured around it from a mixing cup, silicone surface glossy and level, the object still visible under the rising silicone, matte black bench, cool blue rim light from upper left, warm highlight on the object, black background, premium macro product photography, no text, no logo, no watermark" public/img/calc/resin_molds/from_object.webp 1:1

node scripts/gemini-image.mjs "A small 3D-printed master pattern in glossy black resin, an oval pendant shape with crisp edges, half of its surface already polished to a mirror and half still matte from sanding, fine abrasive pads and a polishing cloth beside it, matte black jeweler bench, cool blue rim light from upper left, sharp specular reflection on the polished half, black background, premium macro product photography, no text, no logo, no watermark" public/img/calc/resin_molds/from_file.webp 1:1

node scripts/gemini-image.mjs "A faceted crystal-shaped pendant rendered as a blue wireframe CAD model glowing on a dark screen in the background, softly out of focus, and in sharp focus in the foreground the same shape as a physical 3D-printed master pattern in dark grey resin standing on a matte black bench, cool blue rim light from upper left, black background, shallow depth of field, premium macro product photography, no text, no logo, no watermark" public/img/calc/resin_molds/from_design.webp 1:1

node scripts/gemini-image.mjs "A small rectangular polished silver plate with fine crisp laser-engraved lines catching the light, suspended inside a block of perfectly clear cured epoxy resin, the resin block standing upright on a matte black surface, light refracting through the clear edges, cool blue rim light from upper left with a warm highlight on the silver, black background, premium macro product photography, engraving must read as clean abstract fine lines and not as lettering, no text, no logo, no watermark" public/img/calc/resin_inclusions/text_plate.webp 1:1

node scripts/gemini-image.mjs "A thin translucent white 3D-printed resin plaque with a raised relief pattern, suspended inside a block of perfectly clear cured epoxy resin, the plaque almost the same material as the block so it reads as soft and integrated rather than as a foreign object, resin block upright on a matte black surface, cool blue rim light from upper left, black background, premium macro product photography, relief must read as clean abstract raised lines and not as lettering, no text, no logo, no watermark" public/img/calc/resin_inclusions/text_print.webp 1:1
```

Po wygenerowaniu wystarczy wrzucić pliki na gałąź albo przysłać je tutaj: przeskalowanie
do 512 × 512, podpięcie w `epoxy.js`, `npm run img:cards` i sprawdzenie w przeglądarce
jest po naszej stronie.

## Poprawki po pierwszym podejsciu (10 września 2026)

**`text_print`: przyjete, do przyciecia.** Bryla zajmowala 43% szerokosci kadru,
a sama plytka z reliefem okolo 25%. Kafelek zatopienia rysuje sie na jakies 180 px,
wiec relief schodzil do 45 px i znikal. Przycinamy `scripts/kadruj-kafelek.mjs`.

**`text_plate`: odrzucone, prompt poprawiony.** Pierwsze podejscie dalo cztery wady
naraz i wszystkie cztery sa teraz zapisane w promptcie wprost:

- blaszka wyszla **zlota**, a opcja nazywa sie „Napis na srebrnej blaszce",
- kadr zdominowaly **dlonie w rekawiczkach**, ktorych prompt nie zamawial,
- bryle wyjmowano z **drukowanej ramki**, czyli kafelek opowiadal historie robienia
  formy, a nie zatopienia,
- grawer wyszedl jako **kanciasty zygzak**, ktory czyta sie jak rysa albo kod
  kreskowy, a nie jak celowy wzor.

**`object.webp`: nieplanowana, ale lepsza od tego, co mamy.** Bryla z zatopiona
stokrotka i listkami paproci, chlodne swiatlo obrysowe, czarne tlo. Obecny plik to
plaski krazek widziany z gory. Podmieniamy, chociaz nie bylo tego w planie.

## Co juz stoi w repozytorium

| Plik | Skad | Kadr |
|---|---|---|
| `resin_inclusions/text_print.webp` | pierwsze podejscie, przyjete | przedmiot z 64% kadru na 86% |
| `resin_inclusions/object.webp` | podmiana starego plaskiego krazka | przedmiot z 70% kadru na 86% |

Oba przyciete `scripts/kadruj-kafelek.mjs` z marginesem 0.08. Surowe pliki 2048 x 2048
nie zostaja w repozytorium: kazdy wazyl 2 MB, a lezaly w `public/`, wiec szlyby do
`dist/` i na produkcje, nie bedac nigdzie uzyte.

## Czego nadal brakuje

`from_object`, `from_file`, `from_design` (trzy drogi powstania formy) oraz
`text_plate` po poprawce promptu. Do czasu ich dostarczenia kafelek
„Napis na srebrnej blaszce" rysuje sie jako szesciokatny znak zastepczy,
a trzy kafelki formy uzywaja zdjec po wycofanych wariantach rozmiarowych.
