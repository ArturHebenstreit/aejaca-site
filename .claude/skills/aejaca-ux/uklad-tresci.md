# Uklad tresci na aejaca.com

Tresc jest ulozona dobrze wtedy, gdy odwiedzajacy znajduje nastepny krok bez
szukania. Nie "ladnie", nie "kompletnie": **nastepny krok**. Ten plik mowi,
kto przychodzi, po co, i w jakiej kolejnosci ma dostac odpowiedzi.

## Trzej odwiedzajacy i ich jedna sprawa

| Kto | Z czym przychodzi | Czego potrzebuje w tej kolejnosci | Gdzie konczy |
|---|---|---|---|
| **Kupujacy bizuterie** (prezent, pierscionek, obraczki) | pomysl albo zdjecie z Pinteresta | zobaczyc, ze umiemy (portfolio); zaufac (opinie, marka); orientacyjna cene; jak sie zamawia i ile trwa; rozmiar | `/shop/jewelry/`, kreator `/toolsjewelry/kreator/`, wycena |
| **Zlecajacy studio** (druk 3D, laser, odlew, skan) | plik STL/DXF albo opis | czy to zrobimy (technologie, materialy); ile to kosztuje (kalkulator, bez maila); ile trwa; jak wyslac plik | strona uslugi `/shop/service/<id>/`, kalkulator, wycena |
| **Firma / pracownia** (B2B, powtarzalne zlecenia) | seria, faktura, terminy | warunki wspolpracy; ceny hurtowe; kontakt do czlowieka | `/b2b/`, `/contact/` |

Strona glowna ma **jedna sprawe dla kazdego z nich**: rozdzielic ruch na dwa
dzialy w pierwszym ekranie i pokazac, ze wycena jest online i od razu.
Wszystko ponizej pierwszego ekranu jest dowodem, nie oferta.

## Mapa stron wedlug roli

Trasy stoja w `src/routes.js` (jedna lista dla przegladarki, prerenderu
i mapy witryny). Role, nie sciezki, mowia, co gdzie wolno:

| Rola | Strony | Co ma stac na gorze |
|---|---|---|
| **Wejscie** | `/`, `/jewelry/`, `/studio/`, `/druk-3d-warszawa/`, `/druk-3d-piaseczno/` | teza w jednym zdaniu i jedno dzialanie |
| **Sprzedaz** | `/shop/`, `/shop/jewelry/`, `/shop/studio/`, `/shop/<slug>/`, `/shop/service/<id>/`, `/quote/`, `/oferta/`, `/cart/`, `/checkout/`, `/order/` | cena albo droga do ceny, zanim cokolwiek innego |
| **Dowod** | sekcje `#portfolio`, `#testimonials`, `/reviews/`, `/about/` | prawdziwe zdjecia, prawdziwe opinie, zaden placeholder |
| **Wiedza** | `/blog/`, `/blog/<slug>/`, `/glossary/`, `/glossary/<id>/`, `/toolsjewelry/*`, `/toolstudio/*` | odpowiedz na pytanie, a pod nia narzedzie i usluga (`ToolLinks`, `OdnosnikiUslug`) |
| **Obsluga** | `/faq/`, `/shipping/`, `/payments/`, `/order-process/`, `/order/status/`, `/terms/`, `/warranty/`, `/returns/`, `/privacy/` | konkret, liczby z kodu, zero marketingu |
| **B2B** | `/b2b/` | warunki i kontakt |

Strona nie zmienia roli po drodze. Strona obslugi nie sprzedaje, strona
sprzedazy nie tlumaczy regulaminu (linkuje do niego; ADR-0017 i rama z numerem
oferty pokazuja, jak).

## Kolejnosc sekcji na stronie

Regula w jednym zdaniu: **teza, oferta, dowod, zastrzezenia, narzedzia**.

1. **Teza** (hero): jedno zdanie o tym, co tu jest, i jedno dzialanie. Bez
   liczby z etykieta, bez gradientu z hasla; `frontend-design` mowi, dlaczego.
2. **Oferta**: co mozna kupic albo zlecic, z droga do ceny. To jest sekcja,
   dla ktorej odwiedzajacy przyszedl, wiec stoi zaraz po tezie.
3. **Dowod**: portfolio, opinie, proces. Odpowiada na "czy im ufam", ktore
   pojawia sie dopiero po "czy to jest to, czego szukam".
4. **Zastrzezenia**: FAQ, terminy, materialy, tolerancje. Odpowiada na
   pytania, ktore blokuja decyzje; ma sens dopiero, gdy decyzja jest blisko.
5. **Narzedzia i porady**: dla tych, ktorzy chca sie douczyc, i dla
   wyszukiwarek. Na koncu, bo nie sa nastepnym krokiem dla nikogo z trzech
   odwiedzajacych.

Nie wszystko musi byc na jednej stronie. Strona dzialu, ktora ma dziewiec
sekcji, jest dluga na telefonie jak trzy ekrany na kazda sekcje; to jest
argument za wyniesieniem "wiedzy" na osobne strony, nie za skroceniem oferty.

**Stan zastany do rozstrzygniecia (2026-09-02).** Dwie strony dzialow ukladaja
te same sekcje inaczej:

| `/jewelry/` | `/studio/` |
|---|---|
| about, services, precision, pricing, faq, portfolio, values, testimonials, tips | about, technologies, pricing, faq, portfolio, services, process, testimonials, tips |

Na `/studio/` uslugi stoja PO FAQ i PO portfolio, czyli oferta po
zastrzezeniach i po dowodzie. Menu rozwijane powtarza ten porzadek, bo lista
w `src/i18n/*.js` (`nav.studioSections`) jest ulozona po stronie. To jest
decyzja wlasciciela, nie poprawka w locie: formularz z rekomendacja "uslugi
zaraz po technologiach, jak na `/jewelry/` uslugi po about" i z uczciwym
opisem alternatywy (zostawic, bo FAQ studia odpowiada na "czy to sie da",
ktore poprzedza "co zamowic").

## Nawigacja

Szesc pozycji glownych: Bizuteria, sTuDiO, Galeria, Marka, Narzedzia
i Wiedza, Kontakt. Kazda z lista sekcji w `nav.<dzial>Sections` w trzech
slownikach. Reguly, ktore juz obowiazuja i sa zapisane w komentarzach
w `src/i18n/pl.js`:

- **Sklep pierwszy** w menu dzialu, bo to jedyna pozycja prowadzaca do zakupu.
- **Kolejnosc w menu = kolejnosc na stronie.** Kotwica `#faq` w menu stoi tam,
  gdzie sekcja FAQ na stronie; inaczej menu klamie o stronie.
- **FAQ ostatnie** w menu marki: to miejsce, do ktorego sie wraca po konkret,
  nie punkt wyjscia.
- **Platnosc tuz pod sklepem, realizacja osobno od platnosci** (zgloszenie
  2026-08-30): dwie rozne sprawy, klient szukajacy jednej nie przewija drugiej.
- **Waluta w tym samym menu co jezyk**, bo domyslnie idzie za nim.

Pulapki nawigacji, ktore trzeba sprawdzic pomiarem, nie z kodu:

- Etykiety "Galeria" i "Narzedzia i Wiedza" maja w `navLinks` adresy
  `to: "/gallery/"` i `to: "/resources/"`, ktorych nie ma w `src/routes.js`
  (produkcja przekierowuje je 301 przez `public/_redirects`). Sprawdzone
  pomiarem 2026-09-02: obie renderuja sie WYLACZNIE jako `<button>`
  (`isDropdownOnly` w `Navbar.jsx`), w zadnej szerokosci nie ma `<a href>`
  z tym adresem, wiec menu nie wrecza przekierowania. Te dwa `to` sa martwa
  dana i myla przy czytaniu; kandydat na sprzatanie, nie usterka.
- Menu w 390 px w trzech jezykach: niemieckie etykiety sa najdluzsze
  ("Werkzeuge und Wissen"). Zrzuty `*-telefon.png` na `/de/` pokazuja, czy
  cos sie lamie.

## Droga do wyceny

Miara: **liczba klikniec od wejscia do liczby**. Cel: najwyzej dwa
z kazdej strony wejscia, i liczba PRZED prosba o e-mail.

| Wejscie | Droga | Klikniec |
|---|---|---|
| `/` | kafelek dzialu, kalkulator na stronie dzialu | 1 + przewiniecie |
| `/studio/` | `#calculator` (kotwica) | 0 + przewiniecie |
| `/shop/service/<id>/` | konfigurator `#konfigurator` na stronie | 0 |
| `/blog/<slug>/` | `ToolLinks` pod tekstem, potem narzedzie | 2 |
| `/glossary/<id>/` | jak wyzej | 2 |

Przewiniecie jest kosztem: na telefonie sekcja `#calculator` na stronie dzialu
lezy pod czterema innymi. Zrzut `*-telefon.png` pokazuje, ile ekranow
dzieli teze od kalkulatora. To jest liczba do pilnowania w kazdym przebiegu.

E-mail pojawia sie dopiero przy **zapisaniu** wyceny (`/quote/`), nie przy
jej **policzeniu**. To jest zasada, nie stan; `wygoda.md` ma ja w formularzach.

## Odnosniki: kontekstowe kontra stopka

`scripts/link-graph.mjs` liczy odnosniki wchodzace do kazdej grupy stron,
osobno wszystkie i osobno spoza naglowka i stopki. Wynik z audytu, ktory
uzasadnil ten skrypt: **polityka prywatnosci dostawala 38 razy wiecej
odnosnikow niz wpis blogowy**, bo stopka linkuje do pietnastu miejsc
z kazdej strony. Regulaminow nie da sie odlinkowac, wiec jedyna dzwignia
jest tresc:

- kazdy wpis blogowy i kazde haslo slownika linkuje do narzedzia
  (`ToolLinks`) i do uslugi (`OdnosnikiUslug`) w tresci, nie w stopce;
- strona dzialu linkuje do KAZDEJ swojej strony uslugi widocznym
  odnosnikiem (`OdnosnikiUslug`), nie tylko w `ItemList` dla wyszukiwarki
  (to byla usterka z 2026-09-02: `/studio/` nie linkowalo do zadnej z dziesieciu
  stron uslug, ktore mialo w schemacie);
- `links[].area` w `sitemap.json` mowi, skad odnosnik pochodzi; strona,
  ktora ma wejscia tylko ze stopki, jest w praktyce nieodlinkowana.

**Strony osierocone.** `unreached` w `sitemap.json` to strony zobaczone
w odnosnikach, ale nieodwiedzone z powodu budzetu; to NIE sa osierocone.
Osierocona jest strona, ktora stoi w `dist/`, a crawl `--wszystko` jej nie
odwiedzil: `pomiar.mjs` liczy te roznice i zapisuje ja jako `osierocone`
w `sitemap.json`. Strony sesyjne (`/cart/`, `/checkout/`, `/order/status/`,
`/oferta/`) maja prawo tam byc; kazda inna to usterka ukladu.

## Trzy jezyki, jeden uklad

Uklad jest jeden. Roznia sie dlugosci slow i kierunek uwagi (Niemiec czyta
o terminie i o fakturze wczesniej niz Polak). Sprawdziany:

- kazda sekcja i kazda pozycja menu istnieje w trzech slownikach pod tym
  samym `id` (prerender pada, gdy odnosnik wychodzi z jezyka, ale nie pada,
  gdy sekcji nie ma);
- zrzuty `/de/` w 390 px: naglowki, przyciski i kafelki z najdluzszymi
  slowami;
- sciezki nie sa tlumaczone (`/de/studio/`, nie `/de/atelier/`), ADR-0023.

## Naglowki

Jeden `h1`, ktory mowi, czym jest strona, w jezyku odwiedzajacego, nie
w naszym ("Druk 3D z pliku w 3 dni", nie "AEJaCA sTuDiO"). Kazda sekcja ma
`h2` rowny etykiecie w menu, bo to ta sama rzecz nazwana raz. `headings[]`
w `sitemap.json` jest konspektem strony do przeczytania bez otwierania jej:
jesli konspekt nie mowi, po co ta strona jest, strona tez nie mowi.

## Jak ocenic nowa strone albo sekcje

1. Ktory z trzech odwiedzajacych po nia przyjdzie i z jakim pytaniem?
2. Ktora role ma (wejscie, sprzedaz, dowod, wiedza, obsluga) i czy nie
   miesza dwoch?
3. Gdzie w kolejnosci teza, oferta, dowod, zastrzezenia, narzedzia stoi
   kazda jej sekcja?
4. Ile klikniec i ile ekranow na telefonie od wejscia do liczby?
5. Skad prowadza do niej odnosniki poza stopka?
6. Czy `h1` i `h2` sa etykietami menu, i czy sa w trzech slownikach?
7. Zrzut w 390 px po niemiecku. Dopiero potem kod.
