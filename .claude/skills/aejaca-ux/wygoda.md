# Wygoda i dostepnosc na aejaca.com

To jest to, co swiat wie o wygodzie serwisow, przelozone na ten serwis.
Zrodla, z ktorych to pochodzi: dziesiec heurystyk Nielsena, WCAG 2.2 AA,
badania kasy i formularzy Baymard Institute, wytyczne Google dla urzadzen
dotykowych, i nasz wlasny rejestr wpadek na koncu. Nie cytujemy ich
proza; mowimy, co z nich wynika tutaj.

## Dziesiec heurystyk, po naszemu

| Heurystyka | Co znaczy na aejaca.com |
|---|---|
| Widocznosc stanu | Po "Zapisz wycene" jest komunikat, ktory zostaje; koszyk w pasku ma licznik; kolejka pracowni pokazuje etap i termin liczbowo (`PROJECT_RULES.md` 5a) |
| Zgodnosc ze swiatem | "Wycena", "oferta", "zamowienie" to trzy rozne rzeczy i kazda ma jedno slowo; nie "kalkulacja" tu, "wycena" tam |
| Kontrola i wolnosc | Z kazdego kroku kasy da sie wrocic bez utraty pol; usuniecie pozycji z koszyka pyta albo da sie cofnac |
| Spojnosc | Ten sam przycisk wyglada tak samo na obu dzialach; bursztyn i blekit rozroznia dzial, nie wage dzialania |
| Zapobieganie bledom | Pole rozmiaru pierscionka ma zakres i jednostke; plik do druku sprawdza `check-printability` PRZED wycena |
| Rozpoznawanie zamiast pamietania | Numer oferty stoi w ramce z odnosnikami do regulaminu i obu procesow (ADR-0017); klient nie szuka, gdzie to bylo |
| Elastycznosc | Kalkulator prosty i zaawansowany; oba prowadza do tej samej wyceny |
| Estetyka minimalna | Jedna sprawa na ekran; `aejaca-design` ma reszte |
| Bledy z wyjsciem | Komunikat mowi, co zrobic, nie co sie stalo: "Plik ma 0 trojkatow, wyeksportuj jako STL binarny", nie "Blad pliku" |
| Pomoc w miejscu | `Tips` pod kalkulatorem, FAQ na stronie uslugi; nie osobna strona pomocy |

## WCAG 2.2 AA: kryteria, ktore tu naprawde gryza

Pelna lista ma 50 pozycji. Te dziesiec wraca w tym serwisie i te mierzy
`dostepnosc.mjs` (axe-core) albo trzeba je sprawdzic reka:

| Kryterium | Prog | Gdzie u nas boli | Kto sprawdza |
|---|---|---|---|
| 1.4.3 Kontrast tekstu | 4,5:1 (3:1 dla duzego) | **dwa motywy, dwie palety**: `text-neutral-500` na kremowym tle jasnego motywu | axe, oba motywy |
| 1.4.11 Kontrast nietekstowy | 3:1 | obramowanie kafelka `border-white/10` na jasnym tle; ikony w przyciskach | axe (czesciowo), oko |
| 2.4.7 Widoczny fokus | zawsze | `outline-none` bez zamiennika; klawiatura na kalkulatorze | axe + reka (Tab przez strone) |
| 2.4.11 Fokus niezasloniety | nie pod paskiem | pasek nawigacji jest przyklejony; element z fokusem pod nim jest niewidoczny | reka |
| 2.5.8 Rozmiar celu | 24 px min, 44 zalecane na telefonie | ikony w stopce, przelacznik motywu, krzyzyk w koszyku | axe `target-size`, 390 px |
| 1.3.5 Cel pola | `autocomplete` | kasa: imie, e-mail, telefon, adres, kod pocztowy | axe |
| 3.3.1 / 3.3.3 Bledy | wskaz pole i podaj poprawke | formularz wyceny i kasa | reka |
| 3.3.7 Bez powtarzania | nie pytaj drugi raz | kasa nie pyta o e-mail, ktory juz jest w wycenie | reka |
| 2.4.1 Pomijanie blokow | skip link | pierwszy element z fokusem ma byc "przejdz do tresci" | axe |
| 4.1.3 Komunikaty stanu | `aria-live` | "dodano do koszyka", "wycena zapisana", zmiana ceny w kalkulatorze | reka |

`html lang`, tytul strony i `alt` sa juz pilnowane w buildzie (ADR-0025,
prerender). Nie mierzymy ich drugi raz.

## Formularze i kasa

Z badan kasy wynika jedna rzecz wazniejsza od reszty: **klient odchodzi,
gdy dowiaduje sie czegos nowego po wlozeniu wysilku**. Stad reguly:

- **Cena przed danymi.** Kalkulator liczy bez e-maila. E-mail jest do
  zapisania wyceny, nie do jej zobaczenia.
- **Koszt wysylki przed kasa.** Prog darmowej wysylki i cena paczkomatu
  stoja przy koszyku, z jednego zrodla w kodzie, nie proza.
- **Bez konta.** Zamowienie jako gosc; status po numerze sprawy (ADR-0032),
  nie po logowaniu.
- **Etykieta nad polem, nie w polu.** Placeholder znika po kliknieciu
  i klient nie pamieta, co wpisywal.
- **Jedna kolumna.** Dwie kolumny na telefonie to zgadywanie kolejnosci.
- **Blad przy polu, wartosci zostaja.** Formularz, ktory czysci wszystko
  po jednym bledzie, jest karany porzuceniem.
- **Wymagane oznaczone, opcjonalne tez.** Sama gwiazdka bez legendy nie
  wystarcza; napisz "(opcjonalnie)" przy polach, ktorych nie trzeba.
- **Klawiatura pod pole**: `inputmode="numeric"` dla kodu pocztowego
  i telefonu, `type="email"` dla e-maila, `autocomplete` na wszystkim.
- **Pola 16 px na telefonie.** Mniejsze pismo w polu kaze iOS powiekszyc
  strone przy kliknieciu i klient traci widok.
- **Przycisk mowi, co sie stanie**: "Zapisz wycene", "Zaplac 240 zl",
  nie "Wyslij" ani "OK".

## Telefon

Dwie trzecie ruchu. Reguly, ktore nie wynikaja z kodu, tylko z kciuka:

- **Strefa kciuka.** Glowne dzialanie w dolnej polowie ekranu; przyklejony
  przycisk wyceny na stronie uslugi jest w porzadku, przyklejony baner nie.
- **Nic tylko po najechaniu.** Menu, podpowiedz, powiekszenie zdjecia:
  wszystko ma wersje na dotyk. `bledy.mjs` (typ `hover-only-menu`) to mierzy.
- **Cel 44 px** dla wszystkiego, co klient klika w drodze do pieniedzy;
  24 px to minimum WCAG, nie cel.
- **Bez poziomego przewijania.** `audit-pages.mjs` to mierzy; najczesciej
  winna jest tabela albo kod w `<pre>`.
- **Zrzut na cala wysokosc** (`*-telefon.png`) pokazuje, ile ekranow dzieli
  teze od dzialania. Trzy to duzo, piec to za duzo.

## Ruch i czas

- **`prefers-reduced-motion` jest szanowane.** `useScrollReveal` i przejscia
  gasna, gdy system o to prosi.
- **Nic nie rusza sie samo**: bez karuzel, bez autoodtwarzania, bez
  przewijajacych sie opinii.
- **Stan ladowania widoczny od 300 ms.** Kalkulator licza cene z API pokazuje,
  ze liczy; inaczej klient klika drugi raz.
- **Komunikat sukcesu zostaje** co najmniej 5 s albo do zamkniecia.
  Komunikat, ktory znika po dwoch sekundach, nie zostal przeczytany.
- **Dzialanie niszczace pyta** (usun pozycje, anuluj oferte) albo da sie
  cofnac. Jedno z dwojga, nie zadne.

## Pisanie w interfejsie

- **Czasownik na przycisku**, rzeczownik w naglowku. "Wycen druk", nie
  "Wycena"; "Sprawdz rozmiar", nie "Rozmiar".
- **Polski nie zgaduje plci** (bramka `check-rodzaj-meski.mjs`): "wycena
  zapisana", nie "zapisales".
- **Terminy liczbowo** ("3 dni robocze"), nie przymiotnikiem ("szybko").
- **Jedno slowo na jedna rzecz** w trzech jezykach. Slownik pojec do trzech
  slownikow `src/i18n/*.js`: wycena / quote / Angebot, oferta / offer /
  Offerte, zamowienie / order / Bestellung. Zamiana jednego na drugie
  w polowie sciezki to najczesciej zglaszana niejasnosc.
- **Komunikat bledu ma trzy czesci**: co jest nie tak, dlaczego, co zrobic.
  Jedno zdanie na kazda.
- **Zadnych "kliknij tutaj"**: tekst odnosnika mowi, dokad prowadzi, bo
  czytnik ekranu czyta odnosniki lista.
- `frontend-design` ma osobny rozdzial o pisaniu; obowiazuje przy nowym.

## Zaufanie

- **Opinie tylko prawdziwe** i przypisane do tego, czego dotycza. Ocena
  firmy z Google nalezy do `Organization`, nie do wyrobu (usterka z 2026-09-02:
  szesc schematow `Product` z ocena firmy). Placeholder ikony opinii
  w `public/img/mail/` czeka na wymiane; do tego czasu jest wpadka.
- **Adres jeden.** Odbior opisany jako Warszawa i adres Jozefoslaw w danych
  strukturalnych to sprzecznosc, ktora klient zauwazy przy odbiorze.
- **Cena bez niespodzianki.** Waluta z `PROJECT_RULES.md` sekcja 5; VAT
  w cenie; wysylka przed kasa.

## Rzeczy, ktore juz raz zrobilismy

Rejestr wpadek, kazda z jedna linia o tym, czemu przeszla i co ja teraz lapie.
Nowa klasa z pomiaru laduje tutaj, zanim trafi do kodu.

| Wpadka | Czemu przeszla | Co ja lapie dzis |
|---|---|---|
| Strzalka na karcie uslugi uciekala w lewo (2026-09-02) | kod byl poprawny, brakowalo `flex-1` na tekscie; widac tylko na zrzucie | zrzuty w `mapa.mjs`, agent UX oglada je pierwszy |
| Nogi krap wisialy w powietrzu w kreatorze | cztery rundy czytania kodu, jeden zrzut | jak wyzej; `npm run ring:preview` |
| Cztery kafelki strony glownej wreczaly przekierowanie (`/studio?tab=` bez ukosnika) | 301 jest niewidoczne dla oka i dla builda | `bledy.mjs`, typ `redirect-link` |
| `/studio/` nie linkowalo do zadnej z dziesieciu stron uslug, ktore mialo w `ItemList` | schemat nie ma reprezentacji wizualnej | `OdnosnikiUslug` jedno zrodlo dla odnosnikow i schematu; `seo:audyt` |
| Przelacznik jezyka: bialy ekran po kliknieciu przez dwa dni | prerender i przeglad widza tylko pierwszy ekran | `npm run check:jezyk` klika naprawde |
| `<a href="/studio/">` na `/de/` wyrzucalo Niemca na polska wersje | nic nie wygladalo na zepsute | prerender pada na odnosniku poza jezykiem, ADR-0023 |
| 23 napisy do klienta zgadywaly plec ("zapisales") | po polsku brzmi naturalnie dla polowy klientow | `check-rodzaj-meski.mjs` |
| Pismo ponizej 12 px w kilku miejscach | Tailwind ma `text-[10px]` pod reka | `check-drobny-tekst.mjs` |
| `t("nav.currency")` zamiast `t.nav.currency`: bialy ekran w przegladarce | build i lint przechodza, wyjatek jest w renderze | `check-slownik-jako-funkcja.mjs` |
| `aria-label` wpisany wprost, w jednym jezyku | niewidoczny, wiec nikt nie widzial, ze jest po polsku | `check-nazwy-dostepne.mjs`, ADR-0025 |
| Szesc schematow `Product` z ocena firmy i cena w euro, ktorej nikt nie liczy | JSON-LD nie ma reprezentacji wizualnej | `seo:audyt`, regula "dwa schematy jednego typu pod jednym adresem" |
| Polityka prywatnosci z 38x wiecej odnosnikow niz wpis blogowy | stopka linkuje wszedzie, nikt tego nie liczyl | `scripts/link-graph.mjs`, `links[].area` w mapie |
| Szarosc `text-neutral-500` na kazdej stronie ponizej 4,5:1: w jasnym #a3a3a3 na kremie (2,4:1), w ciemnym #737373 na karcie #0f0f0f (4,2:1) | kolor wygladal "subtelnie", a nikt nie mierzyl; w jasnym motywie nadpisanie dawalo ODWROTNOSC hierarchii (pieciosetka jasniejsza od czterysetki) | `dostepnosc.mjs` w obu motywach; zrodlo to `--color-neutral-500` w `@theme` i `--ds-text-4`, nie sto plikow |
| Bialy napis na `bg-blue-500` w przycisku plywajacym (3,8:1), najechanie jeszcze jasniejsze | przycisk jest "marki", wiec nikt nie pytal o kontrast | jak wyzej; regula: stan po najechaniu idzie ciemniej, nie jasniej |
| Pasek galerii przewijany poziomo bez fokusa klawiatury; strzalki widoczne dopiero po najechaniu myszka | klawiatura nie ma myszki, a testowal ja tylko autor z myszka | `dostepnosc.mjs`, regula `scrollable-region-focusable` |
| Zdjeto kolor z zaznaczenia w dwoch kalkulatorach "bo kontrast", chociaz pomiar tego nie zglaszal (2026-09-02, cofniete tego samego dnia) | opinia estetyczna ("mgla brudzi zdjecie") i opinia o marce ("roz klóci sie z bursztynem") zostaly podane jako wynik pomiaru; kafelki NIE byly wsrod 194 znalezisk kontrastu, bo `index.css` mial juz nadpisanie `button:has(.from-black/95) .text-rose-300`. Efekt: dwie strony sprzedazowe zrobily sie szare, wlasciciel nazwal to "jak z cmentarza" | **Przed zdjeciem koloru sprawdz, czy ten konkretny wezel jest w `dostepnosc.json`.** Nie ma go tam? To jest propozycja estetyczna i idzie formularzem jako propozycja, nie jako naprawa. Poswiata i tint na zdjeciu NIOSA jasnosc zaznaczenia, nie tylko barwe: zdjecie ich kosztuje czytelnosc, ktorej axe nie mierzy |
| Pomiar mowil "zero bledow kontrastu", a dwa dopiski byly nieczytelne (2026-09-02) | `dostepnosc.mjs` czytal z axe tylko `violations`. Tekst z przezroczystoscia i tekst na gradiencie axe wrzuca do `incomplete` i nie zglasza jako blad | skrypt liczy teraz takze `incomplete` i drukuje jedna linie: ile wezlow automat NIE umial rozstrzygnac i dlaczego. To nie sa bledy, ale mowia, ile strony pomiar naprawde sprawdzil |
| Trzy wlasne sposoby na zmierzenie koloru z rzedu podaly smieci (2026-09-02) | Tailwind v4 zwraca kolory jako `oklch()` i `color(srgb ...)`: `canvas.fillStyle` je milczaco odrzuca (zostaje poprzedni kolor), a regex `[\d.]+` rozbija ujemna skladowa oklab i ulamki srgb na osobne liczby. Wyniki wygladaly wiarygodnie: 2,99 dla wszystkiego, potem 1,00 dla wszystkiego | kolor mierzy sie PIKSELAMI: rysujemy `<rect fill="...">` w SVG na kanwie i czytamy `getImageData`. Przegladarka rozwiazuje oklch sama, parsowania nie ma. Jednakowa wartosc dla kilkunastu roznych elementow to sygnal, ze miernik jest zepsuty, a nie ze strona jest spojna |
| Poprawka kontrastu zalatana tam, gdzie ja WIDZIALEM, a nie tam, gdzie klasa stoi (2026-09-02) | probka 25 stron pokazala `text-neutral-600` i biel na `bg-blue-500` w kalkulatorach, wiec poprawilem kalkulatory. Pelny przebieg 318 stron znalazl te same dwie klasy na 177 stronach: `text-neutral-600` siedzi w 39 plikach, `bg-blue-500` w 30 | **zasieg klasy sprawdza sie `grep`em po `src/`, ZANIM sie ja naprawi.** Jesli klasa jest w wiecej niz kilku plikach, poprawka idzie do `index.css` albo do tokenu, nigdy do komponentu |
| Sprawdzian wycieku szablonu zglosil trzy strony `/de/`, bo `null` po niemiecku znaczy ZERO (2026-09-02) | wzorzec `\bnull\b` szukal slowa, a nie skladni; "Ein Rabatt geht nie unter null" to poprawne zdanie | wzorzec wymaga sasiedztwa skladniowego (`: null`, `{ null }`, `= null`), wiec zdanie przechodzi, a wyciek nie. **Sprawdzian tekstu na serwisie wielojezycznym testuje sie na kazdym jezyku**, bo slowo techniczne w jednym bywa zwyklym slowem w drugim |
| Kafelki kalkulatora bez `aria-pressed`: czytnik ekranu nie wie, co jest wybrane, a pomiar liczyl je jako martwe klikniecia | wybrany kafelek WYGLADA na wybrany; stan byl tylko w klasach CSS | `bledy.mjs` pomija opcje ze stanem ARIA, wiec kafelek bez stanu dalej wychodzi jako martwe klikniecie |
| Napis nad polem udawal etykiete w szesciu miejscach: 93 wezly na 72 stronach (2026-09-03) | `<label>` bez `htmlFor` wyglada jak etykieta i stoi tam, gdzie etykieta, ale nie nalezy do zadnego pola; licznik sztuk mial nad soba zwykly `div`. Czytnik ekranu oglaszal "pole edycji" i "suwak", bez slowa o tym, czego dotycza. Widac to tylko w axe, bo na ekranie wszystko jest na swoim miejscu | regula `label` w `dostepnosc.mjs`. **Napis obok pola nie jest etykieta, dopoki nie ma `htmlFor` albo nie obejmuje pola.** Identyfikator sklada `useId`, nigdy `field.id`: to samo pole potrafi stanac na stronie dwa razy. Suwak i pole liczbowe opisujace TE SAMA wartosc dziela jedna etykiete przez `aria-labelledby`, zamiast miec dwie |

## Dwie drogi do tej samej rzeczy (2026-09-03)

Usluge da sie u nas zamowic dwiema drogami: karta w sklepie i zakladka
kalkulatora. Przeniesienie ich na jedna liste pytan (ADR-0037) wyciagnelo
osiem usterek, ktorych zadna bramka nie widziala, bo kazda byla widoczna
DOPIERO PRZEZ POROWNANIE dwoch ekranow ze soba. Stad regula:

- **Kiedy do jednej rzeczy prowadza dwie drogi, sprawdza sie je obok siebie,
  ta sama sekwencja klikniec, i porownuje wyniki.** Nie po kolei, nie osobno.
  Sklep sprzedawal grawer L za 110,37 zl przy wlasnej wycenie 150,00 zl przez
  jedno pole wpisane na sztywno w wartosciach startowych.
- **Pytanie, w ktorym zawsze dokladnie jedna odpowiedz jest klikalna, nie jest
  pytaniem.** To stan wyliczalny udajacy wybor. Liczymy go u zrodla i piszemy
  jako zdanie o skutku, nie jako krok.
- **Suwak nie umie wylaczyc przystanku.** Pole, ktorego czesc wariantow odbiera
  inne pole, nie moze byc suwakiem: klient dojedzie do wartosci, ktorej maszyna
  nie wykona, i zobaczy za nia cene.
- **Wybor pokazany na ekranie musi dojechac do zamowienia, i to w DWOCH
  miejscach.** Dopisanie go do parametrow pozycji nie wystarcza: `describeParams`
  wypisuje tylko pola z katalogu plus liste wyjatkow, wiec wybor bywa
  w pozycji i niewidoczny w koszyku, w mailu i w panelu.
- **Ta sama usluga musi startowac od tych samych wartosci.** Trzy uslugi mialy
  dwie rozne kwoty startowe, zaleznie od tego, ktoredy klient wszedl.

### Hook po wczesnym wyjsciu gasi cale drzewo

Wybor lancuszka w zaawansowanym kalkulatorze jubilerskim gasil caly kalkulator
i robil to **przed** ta praca, przy zielonym buildzie i zielonym prerenderze.
`CalcToCart` ma wczesne wyjscie dla konfiguracji bez wyceny wiazacej, a ponizej
niego stal efekt zglaszajacy kwote: gdy warunek przeszedl z falszu w prawde
przy zywym komponencie, React zglosil "Rendered fewer hooks than expected"
i odmontowal drzewo. Prerender tego nie zlapie, bo rysuje pierwszy ekran,
a usterka wymaga klikniecia. Pilnuje `scripts/check-hooki-po-wyjsciu.mjs`,
ktory przy pierwszym przebiegu znalazl jeszcze jedno takie miejsce.

### Trzy razy zmierzylem zly ekran

W jednej sesji, trzy razy, moje narzedzie pomiarowe klamalo, a nie kod:

1. `/jewelry/` otwiera sie w trybie szybkiej wyceny, wiec mierzylem
   `SimpleJewelryCalc`, a przenosilem `JewelryCalc`. **Zanim uwierzysz
   w wynik, sprawdz, ze patrzysz na ten komponent, ktory zmieniasz**: poszukaj
   na ekranie napisu, ktory istnieje tylko w nim.
2. Skrypt pytal starego `dist` na porcie, ktorego nie podmienilem razem
   z pozostalymi. **Adres serwera trzymaj w jednej stalej i wypisuj go
   w wyniku.**
3. Panel koszyka renderuje sie dopiero, gdy `/api/price` odpowie, a w tym
   srodowisku nie ma backendu. **Zeby obejrzec cokolwiek za `price`, postaw
   atrape wyceny i serwer deweloperski**: `dist` sam z siebie nigdy tego nie
   pokaze, i przez chwile bralem to za brak swojej zmiany.

### Szosta skarga na to samo znaczy, ze poprawiam jedna kopie z pieciu

„Kafelek wybrany i ten pod myszka sa ciemne" wrocilo od wlasciciela szesc razy.
Za kazdym razem poprawka byla prawdziwa. Za kazdym razem trafiala w JEDNA
rodzine kafelkow, a rodzin jest kilkanascie, bo znacznik kafelka powstawal
przez kopiowanie: piec plikow wygasza zdjecia, warstwe swiatla mial jeden.

**Skarga, ktora wraca po poprawce, nie jest skarga na te poprawke. Jest skarga
na to, ze poprawka objela mniej miejsc, niz mysialem.** Zanim dotknesz kodu,
policz KOPIE: `grep -rl` po klasie, ktora odpowiada za objaw. Jesli wynik ma
wiecej niz jeden plik, poprawka w komponencie jest z gory za waska i regula
nalezy do arkusza stylow albo do bramki.

Dwie rzeczy, ktore ten pomiar pokazal, a czytanie kodu nie:

1. Warstwa `tile-lift` byla renderowana warunkowo, `{active && ...}`. Regula
   `button:hover .tile-lift` wygladala poprawnie i nie mogla zadzialac nigdy,
   bo pod niewybranym kafelkiem tego elementu w ogole nie bylo. **Regula CSS
   celujaca w element renderowany warunkowo jest martwa i wyglada na zywa.**
2. W motywie jasnym zaznaczenie bylo CIEMNIEJSZE od reszty siatki (0,777 wobec
   0,938). Paleta ma dwa konce i `amber-700` rozni sie w kodzie od `amber-100`
   jedna cyfra. **Odcien sprawdza sie liczac jasnosc, nie czytajac nazwe.**

Pomiar: `npm run ux:kafelki`. Bramka, zeby nie wrocilo po raz siodmy:
`scripts/check-kafelki-jasnosc.mjs`. Decyzja: ADR-0039.

### Mapa serwisu starzeje sie szybciej niz serwis

`audyt-ux/sitemap.json` trzyma adresy bezwzgledne razem z portem, a port
statycznego serwera zmienia sie miedzy sesjami. Uruchomiony na starej mapie
`bledy.mjs` oddal 186 znalezisk: 180 razy "odnosnik nie odpowiada" i szesc razy
"strona sie nie wczytala", przy ZERO wykonanych klikniec, bo nie bylo w co
klikac. Wygladalo to jak awaria serwisu i bylo awaria pomiaru.

**Pomiar, ktory nie umie odroznic martwego serwera od zepsutej strony, jest
gorszy od braku pomiaru**, bo oddaje liczby, ktore wyglądają na prawdziwe.
`bledy.mjs` pyta teraz HEAD-em o pierwszy adres z mapy i przerywa z wyjasnieniem,
zamiast liczyc martwy port jako wady. `--host=127.0.0.1:4210` przestawia mape na
zywy adres bez crawlowania jej od nowa.

Ta sama mapa na zywym adresie znalazla jedna prawdziwa rzecz: w pasku nawigacji
najechanie kursorem rozwijalo liste, a klikniecie w te sama etykiete zamykalo ja
w tej samej chwili i nie otwieralo ponownie, dopoki kursor nie wyszedl poza
element. Bez klikania tego nie widac: HTML jest poprawny w kazdej chwili.
