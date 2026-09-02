---
name: aejaca-ux
description: Wygoda, uklad tresci i dostepnosc serwisu aejaca.com. Uzyj przy pytaniach "czy to jest wygodne", "gdzie to powinno stac", "ile klikniec do wyceny", przy nowej stronie albo sekcji, przy nawigacji, formularzach, koszyku i kasie, przy WCAG i kontrascie, przy tekstach w interfejsie. Niesie pomiar `npm run ux:pomiar` (crawl ze zrzutami, axe-core, wzorce bledow) i dwie instrukcje: uklad tresci i wygoda. Wyglad i marka to `aejaca-design`, nie ten skill.
user-invocable: true
---

# Wygoda i uklad tresci na aejaca.com

Serwis ma sto stron w trzech jezykach, dwa dzialy o roznym kolorze (bizuteria
bursztynowa, studio niebieskie), sklep, kalkulatory, kreator pierscionka
i sciezke od wyceny do zaplaty. Wyglad tego wszystkiego jest ustalony
i spojny; pilnuje go `aejaca-design`. Ten skill odpowiada na inne pytanie:
**czy odwiedzajacy robi u nas to, po co przyszedl, bez tarcia**, i czy tresc
stoi w kolejnosci, w ktorej on jej potrzebuje.

Trzy skille w tej warstwie i podzial pracy miedzy nimi:

| Skill | Odpowiada na | Wygrywa, gdy |
|---|---|---|
| `aejaca-design` | jak to ma WYGLADAC (tokeny, paleta, kroje, komponenty) | zawsze, gdy chodzi o marke |
| `frontend-design` | jak zaprojektowac cos NOWEGO, zeby nie bylo szablonem | nowa strona, nowy typ sekcji |
| `aejaca-ux` (ten) | czy to jest WYGODNE i czy stoi we wlasciwym MIEJSCU | kolejnosc, nawigacja, formularze, dostepnosc |
| `site-audit` | POMIAR: co naprawde widac i co naprawde jest zepsute | zawsze przed ocena |

## Najpierw: czego NIE sprawdzaj recznie

Build juz tego pilnuje. Powtarzanie tej pracy jest strata:

| Co juz jest pilnowane | Przez co |
|---|---|
| Najmniejsze pismo 12 px | `scripts/check-drobny-tekst.mjs` |
| Kazdy napis dla czlowieka ze slownika, takze `aria-label` i `alt` | `scripts/check-nazwy-dostepne.mjs`, ADR-0025 |
| Odnosnik wewnetrzny nie wyprowadza z jezyka strony | `scripts/prerender.mjs`, ADR-0023 |
| Obrazy w rozmiarze miejsca, hero i kafelki z wariantami | `check-hero-images`, `check-card-images`, ADR-0024 |
| Zaden rozjazd hydracji (nic zaleznego od chwili w renderze) | `scripts/check-czas-w-renderze.mjs`, ADR-0022 |
| Polski tekst nie zgaduje plci | `scripts/check-rodzaj-meski.mjs` |
| Jasny motyw ma klase dla kazdego elementu ciemnego | `scripts/check-light-theme.mjs` |
| Przelacznik jezyka klikniety naprawde, dwie szerokosci | `npm run check:jezyk` (poza buildem) |
| Kazda strona w przegladarce: obrazy, `alt`, hydracja, poziomy scroll | `scripts/audit-pages.mjs` (poza buildem) |

## Czego nikt nie pilnuje, czyli gdzie jest robota

Bramki wyzej ogladaja jeden element albo jedna strone. Wygoda mieszka
w relacjach:

- **kolejnosc**: czy oferta stoi przed dowodem, a dowod przed FAQ; czy dwie
  strony dzialow nie mowia tego samego w innej kolejnosci,
- **droga**: ile klikniec od wejscia do ceny i czy cena pojawia sie przed
  prosba o adres e-mail,
- **to, co widac, kontra to, co mowi kod**: strzalka na karcie przy poprawnym
  kodzie uciekala w lewo; nogi krap wisialy w powietrzu przy zielonym buildzie,
- **telefon kontra monitor, jasny kontra ciemny**: kontrast, cele dotyku
  i dlugosc niemieckich slow zmieniaja sie z szerokoscia i motywem,
- **strony osierocone**: istnieja w `dist/`, ale zadna sciezka klikniec do
  nich nie prowadzi.

Do tego sluzy pomiar:

```
npm run build                     # potrzebny gotowy dist/
npm run ux:pomiar                 # 25 stron: mapa + zrzuty, axe, bledy -> audyt-ux/
npm run ux:pomiar -- --wszystko   # caly serwis (kilkanascie minut)
npm run ux:pomiar -- --start=https://www.aejaca.com/   # produkcja, tylko z maszyny lokalnej
```

Wynik w `audyt-ux/` (poza repozytorium): `sitemap.json`, `zrzuty/` (kazda
strona w 390 px na cala wysokosc i w 1280 px pierwszy ekran),
`dostepnosc.json`, `bledy.json`. Skill `site-audit` sklada z tego raport
z agentem, ktory OGLADA zrzuty; ten skill bierze raport i naprawia u zrodla.

Pomiar nie stoi w `npm run build` swiadomie: build leci na Cloudflare Pages
bez przegladarki, a pomiar jest miernikiem, nie straznikiem. **Kiedy jedna
klasa bledu wraca drugi raz, TEN JEDEN sprawdzian idzie do bramki
w `scripts/`.** Kryterium z `aejaca-seo` obowiazuje i tu: nie "drugi raz",
tylko "czy stac nas na to, zeby to wrocilo".

## Procedura przegladu

1. `npm run build`, potem `npm run ux:pomiar`.
2. **Najpierw zrzuty, potem kod.** Otworz `audyt-ux/zrzuty/` i przejrzyj
   strony na telefonie w calosci. Czytanie kodu jest drozsze i widzi mniej.
3. Czytaj `dostepnosc.json` i `bledy.json` **klasami, nie sztukami**:
   `by_rule` i `by_type` sa na poczatku pliku po to. Jedna regula na
   dziewiecdziesieciu stronach to jeden blad w jednym wspolnym komponencie.
4. Napraw u ZRODLA. Poprawka w dwudziestu stronach jest podejrzana; zwykle
   brakuje jednego komponentu albo jednej reguly w `src/index.css`.
5. Powtorz pomiar na nowym buildzie. Klasa znika z pomiaru, albo nie jest
   zamknieta.
6. Rzeczy, ktorych pomiar nie mierzy (kolejnosc sekcji, droga do wyceny,
   nazwy w menu), oceniaj z `uklad-tresci.md` i `wygoda.md`, a wnioski
   zapisuj: decyzja o kolejnosci to ADR, nie akapit w rozmowie.

## Trzy obszary i gdzie o nich czytac

- **Uklad tresci**: `uklad-tresci.md`. Trzej odwiedzajacy i ich jedna sprawa,
  mapa stron wedlug roli, kolejnosc sekcji, nawigacja, droga do wyceny,
  odnosniki kontekstowe kontra stopka, strony osierocone.
- **Wygoda i dostepnosc**: `wygoda.md`. Dziesiec heurystyk Nielsena
  przelozonych na ten serwis, kryteria WCAG 2.2, ktore tu naprawde gryza,
  formularze i kasa, telefon, ruch, komunikaty, pisanie w interfejsie,
  i rejestr wpadek, ktore juz raz zrobilismy.
- **Pomiar**: `pomiar/`. `mapa.mjs`, `dostepnosc.mjs`, `bledy.mjs`,
  `pomiar.mjs` (serwer i kolejnosc), `wspolne.mjs` (przegladarka, lista slow,
  ktorych nie klikamy, w trzech jezykach). Listy kontrolne, z ktorych
  skrypty biora wzorce i powagi: `.claude/skills/site-audit/references/`.

## Rzeczy, ktorych na tym serwisie nie robimy

- **Nie przemalowujemy marki pod pretekstem wygody.** Kolor, kroj i kafelek
  sa w `aejaca-design`. Wygoda zmienia kolejnosc, rozmiar celu, tekst
  i kontrast w granicach tokenow, nie tozsamosc.
- **Nie dodajemy pozycji do menu glownego bez usuniecia innej.** Szesc
  pozycji to gorna granica dla nawigacji, ktora ma sie zmiescic w 390 px
  w trzech jezykach.
- **Nie robimy karuzel, autoodtwarzania ani niczego, co rusza sie samo.**
  Odwiedzajacy nie prosil o ruch. `useScrollReveal` jest w porzadku, bo
  odpowiada na jego przewijanie.
- **Nic nie odslania sie tylko po najechaniu.** Dwie trzecie ruchu to telefon,
  a telefon nie ma najechania.
- **Nie prosimy o dane przed pokazaniem ceny.** Kalkulator liczy bez adresu
  e-mail; adres jest potrzebny do zapisania wyceny, nie do jej zobaczenia.
- **Nie udajemy pilnosci.** Zadnych licznikow "oferta wygasa za", zadnych
  "3 osoby ogladaja". Termin waznosci oferty jest prawdziwy i jeden
  (ADR-0020), i tylko taki pokazujemy.
- **Nie wpisujemy liczb proza, ktorych nie pilnuje kod.** Cena, termin, prog
  darmowej wysylki maja jedno zrodlo (`PROJECT_RULES.md`, sekcja 5a).
- **Nie stawiamy modala tam, gdzie klient oczekiwal strony.** Odnosnik
  prowadzi na strone; modal jest dla decyzji w miejscu (usun, potwierdz).

## Pierwszy przebieg (2026-09-02, `dist/` z 318 stron, 25 stron pomiaru)

Szesc minut. 25 stron w trzech jezykach (9 pl, 8 en, 8 de), 75 zrzutow,
zero bledow konsoli, zero nieudanych zadan, 255 odnosnikow sprawdzonych
i zaden nie wrecza przekierowania ani 404, 189 klikniec.

Klasy, nie sztuki (10 stron przez axe, 40 przebiegow):

| Klasa | Powaga | Zasieg | Gdzie naprawic |
|---|---|---|---|
| Kontrast tekstu ponizej 4,5:1 | high | 10/10 stron, ok. 4 100 wezlow; 99 wpisow tylko w jasnym motywie, 88 w obu | jedno zrodlo: szarosci `text-neutral-400/500` (#737373 i #a3a3a3 na kremie #faf7f2) i bursztyn `#b45309` na kremie; poprawka w tokenach `--ds-text-3/4`, nie w stu plikach |
| Pasek przewijany poziomo bez fokusa klawiatury | high | 6 stron | jeden komponent z `overflow-x-auto snap-x`: `tabindex="0"` i nazwa |
| Landmark `role="region"` bez unikalnej nazwy | medium | 9 stron | panele FAQ `#faq-panel-0` i formularz opinii |
| `alt` powtarza sasiedni tekst | low | 10 stron | logo w pasku (`alt="AEJaCA"` obok napisu AEJaCA), kafelki kalkulatora |
| Martwe klikniecie: kafelek juz wybrany bez stanu ARIA | medium | 6 na `/jewelry/` x 3 jezyki | `SimpleJewelryCalc`: `aria-pressed` na kafelkach wyboru (WCAG 4.1.2); wtedy pomiar sam je pominie |

Rzeczy widoczne tylko na zrzutach i w konspekcie:

- **Strona dzialu na telefonie ma 24 ekrany** (`/studio/`, wszystkie trzy
  jezyki), `/jewelry/` 20 do 21. Koszyk ma 3, kontakt 5. To jest liczba do
  decyzji z `uklad-tresci.md`, nie usterka kodu.
- Menu glowne nie wrecza przekierowan: "Galeria" i "Narzedzia i Wiedza" sa
  wylacznie przyciskami (`isDropdownOnly`), a ich `to` to martwa dana.

Trzy poprawki w samym pomiarze, ktore wyszly z tego przebiegu i sa juz w kodzie:
crawl zasiewa trzy korzenie jezykowe i przeplata je (bez tego 23 z 25 stron
bylo polskich); jezyk przegladarki idzie za jezykiem strony (bez tego kazda
strona `/en/` i `/de/` miala polski pasek podpowiedzi, a axe liczyl go jako
tresc poza landmarkiem); zrzut telefonu ma wersje pierwszego ekranu, bo pelna
strona dzialu ma 19 000 px i nie da sie jej ogladac.

Kazdy kolejny przebieg, ktory znajdzie nowa klase, dopisuje ja do rejestru
w `wygoda.md`, sekcja "Rzeczy, ktore juz raz zrobilismy".

## Zasady projektu, ktore obowiazuja takze tutaj

- Zaden dlugi myslnik (U+2014) w niczym, co piszemy, takze w komentarzach
  i w tym skillu. Pilnuje `scripts/check-emdash.mjs`.
- Polski tekst do klienta nie zgaduje plci. Nie "zapisales", tylko "zapisane".
- Kazde pytanie i kazda decyzja do wlasciciela to formularz (`AskUserQuestion`),
  rekomendacja pierwsza i oznaczona. Kolejnosc sekcji na stronie dzialu jest
  taka decyzja.
- Waluta, terminy liczbowo, linkowanie narzedzi: `PROJECT_RULES.md`.
- Obraz przez `<Obraz>` albo `<HeroObraz>`, odnosnik przez `Link`, adres pelny
  przez `adresStrony`: lista bramek w `CLAUDE.md`.
