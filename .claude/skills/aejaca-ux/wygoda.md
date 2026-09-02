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
| Kafelki kalkulatora bez `aria-pressed`: czytnik ekranu nie wie, co jest wybrane, a pomiar liczyl je jako martwe klikniecia | wybrany kafelek WYGLADA na wybrany; stan byl tylko w klasach CSS | `bledy.mjs` pomija opcje ze stanem ARIA, wiec kafelek bez stanu dalej wychodzi jako martwe klikniecie |
