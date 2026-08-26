# Handoff zadania

```yaml
task_id: TASK-012
status: review
author: Claude Code
branch: claude/fix-api-error-oge1r
base_commit: 08e93aa
last_commit: (uzupelnic po commicie)
updated: 2026-08-26
```

## Cel

Karta uslugi odlewu ma mowic prawde o kolbie, nazywac to, czego brakuje do
wyceny, sprzedawac piec poziomow obrobki zamiast trzech i wisiec takze tam,
gdzie klient jej szuka, czyli w dziale Bizuteria.

## Stan przed zmiana

Cztery mierzalne braki, wszystkie zglosil wlasciciel, ogladajac karte.

1. **Kolba w kodzie miala 24 x 24 x 35 mm, a w pracowni ma 80 x 80 mm.**
   Ta sama liczba stala wpisana z reki w dziewieciu miejscach: silnik wyceny,
   trzy jezyki szybkiej wyceny, trzy jezyki komunikatu z serwera, specyfikacja
   karty uslugi, `llms.txt`, kontekst asystenta, dokument marki i
   `B2B_Architektura.md`. Odtworzenie: `grep -rn "24 x 24 x 35"`.
2. **Klient bez pliku dostawal "Parametry sa niekompletne".** Odtworzenie:
   karta uslugi odlewu, nie wgrywac nic, zostawic ustawienia domyslne.
   Komunikat nie mowil, ze chodzi o plik, ani dlaczego jest potrzebny.
3. **Zakres wykonczenia mial trzy pozycje**, pracownia sprzedaje piec.
4. **Odlew wisial tylko w dziale sTuDiO**, i to w filtrze "Projektowanie",
   bo `serviceFacet()` zgaduje dzial z przedrostka identyfikatora, a
   `precious_metal_casting` przedrostka `jewelry` nie ma.

## Zalozenia i decyzje

- Kolba jest jedynym zrodlem rozmiaru, limit modelu liczy sie z niej.
  Zrodlo: ADR-0016, punkt 1.
- Plik jest wymagany TYLKO na sciezce "model 3D + kruszec AEJaCA", bo tylko
  ona dostaje kwote z automatu. Zrodlo: ADR-0016, punkt 2.
- Identyfikatory `raw`, `clean` i `polished` zostaja te same, dwa nowe poziomy
  wchodza miedzy nie. Powod nizej, w ryzykach. Zrodlo: ADR-0016, punkt 3.
- Karta gosci w drugim dziale pod inna nazwa, ale pod tym samym adresem.
  Zrodlo: ADR-0016, punkt 4.

## Zakres

### Zmienione pliki

- `src/pricing/preciousMetalCasting.js` i mirror `chat-api/pricing/`:
  `CASTING_FLASK_MM`, wyliczany `CASTING_ENVELOPE_MM`, `CASTING_ENVELOPE_LABEL`,
  piec poziomow w `CASTING_FINISHES`, `missingCastingParams()`,
  `describeMissingCastingParams()`, build 1.007.
- `chat-api/orders.js`: limit w trzech komunikatach czytany z modulu wyceny,
  konkretny komunikat o brakach dla odlewu.
- `src/components/calculators/SimpleStudioCalc.jsx`: trzy teksty o kolbie
  interpolowane z `CASTING_ENVELOPE_LABEL`.
- `src/components/calculators/calcShared.jsx`: `Chips` tlumaczy `sub` przez `t()`.
- `src/components/shop/ServiceConfigurator.jsx`: zdanie o pliku pod polem
  wgrywania, w trzech jezykach.
- `src/data/serviceCatalog.js`: `alsoIn`, `serviceCardsByCategory()` wpuszcza
  karty goscinne, specyfikacja karty czyta stale zamiast liczb wpisanych z reki.
- `src/data/shopFacets.js`: odlew w filtrze "Jubilerstwo".
- `scripts/test-precious-metal-casting.mjs`, `scripts/test-simple-quote.mjs`.
- `public/llms.txt`, `public/sitemap.xml`, `chat-api/context.js`,
  `MDs/AEJaCA_Brand_Reference.md` (wersja 6.0), `MDs/B2B_Architektura.md`,
  `MDs/decisions/ADR-0016-kolba-i-zakres-wykonczenia-odlewu.md`.

### Swiadomie poza zakresem

- **Kalkulator sTuDiO zostaje bez zmian**, tak jak prosil wlasciciel. Zakladka
  "Odlew w metalu" i kafelek w szybkiej wycenie czytaja te same stale, wiec
  nowa kolba i nowe poziomy wykonczenia weszly tam same, bez dotykania widoku.
- **Osobna strona uslugi dla dzialu Bizuteria.** Karta gosci, adres zostaje
  jeden. Powod w ADR-0016, punkt 4.
- **Rozbicie limitu na ksztalt walca.** Limit dalej jest prostopadloscianem
  wpisanym w kolbe, wiec model plaski i szeroki, ktory realnie by sie zmiescil,
  nadal moze trafic do oceny indywidualnej. To jest zapas na nasza korzysc.
- **ADR-0010 nietkniety.** Opisuje stan z dnia decyzji; ADR-0016 sie do niego
  odwoluje. Historii nie przepisujemy.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Limit liczony z kolby | `node scripts/test-precious-metal-casting.mjs` | pass |
| Kwadrat limitu miesci sie w swietle kolby | `Math.hypot(42, 42) <= 60` w tescie | pass |
| Piec poziomow, kazdy drozszy | ten sam test | pass |
| Stare identyfikatory wykonczenia zyja | ten sam test, petla po `raw`, `clean`, `polished` | pass |
| Komunikat o brakach nazywa plik, w trzech jezykach | ten sam test | pass |
| Kontrola negatywna: plik zadany tam, gdzie nie trzeba | `missingCastingParams` dla `ready_pattern` | pusta lista, zgodnie z oczekiwaniem |
| Oba tryby odrzucaja model ponad kolba | `node scripts/test-simple-quote.mjs` | pass |
| Karta w dwoch dzialach, jeden adres | `serviceCardsByCategory` dla obu dzialow | "Odlew bizuterii" i "Odlew z metali szlachetnych", ten sam `id` |
| Build | `npm run build` | pass, kod wyjscia 0 |

## Ryzyka i otwarte pytania

- **Poziomy 2 i 3 moga oznaczac to samo.** "Surowy odlew z odcietymi kanalami"
  i "Odciete kanaly wlewowe" brzmia jak jedna rzecz. Przyjalem, ze poziom 2 to
  odciecie ze sladem po kanale, a poziom 3 slad zlicowany z powierzchnia,
  i tak brzmia podpisy. Nazwy glowne sa doslownie takie, jak podal wlasciciel.
  Ceny i identyfikatory sa od nazw niezalezne, wiec poprawka jest tania.
- **Trzy zapasy kolby (10, 15, 10 mm) to moje oszacowanie**, nie pomiar. Z nich
  wychodzi 42 x 42 x 55 mm. Pracownia wie to lepiej i moze je poprawic w jednym
  miejscu.
- **Automat obejmuje teraz okolo szesc razy wieksza objetosc.** Modele, ktore
  wczoraj szly do czlowieka, dzis dostana kwote wiazaca. To jest cel zmiany,
  ale zdejmuje ludzka kontrole z tej grupy i podnosi gorna kwote zamowienia.
- **Przemianowanie identyfikatora wykonczenia bylo blisko.** Serwer wycenia
  koszyk od nowa przy kazdej platnosci, wiec `finishId` zapisany w starym
  zamowieniu musi dalej byc rozpoznawany. Nowe nazwy przy starych
  identyfikatorach kosztowaly zero, nowe identyfikatory kosztowalyby
  wycene kazdego lezacego koszyka, bez jednego bledu w buildzie.
- **`Chips` nie tlumaczyl podpisu.** Obiekt `{pl,en,de}` wstawiony wprost
  wywala React. Zadna dotychczasowa lista podawana `Chips` nie miala `sub`,
  wiec nikt tego nie zauwazyl; pierwsza taka lista wylozylaby kalkulator.
  Naprawione przy okazji, ale ten sam wzorzec warto sprawdzic w pozostalych
  wspolnych komponentach.

## Instrukcja dla recenzenta

1. **Najwazniejsza hipoteza do podwazenia:** czy limit 42 x 42 x 55 mm na pewno
   miesci sie w kolbie 80 x 80 mm razem ze stozkiem, kanalem glownym i masa
   formierska. To jest jedyna liczba w tej zmianie, ktora moze kosztowac
   zepsuty odlew, a nie zla cene.
2. **Granica systemu:** `priceItem` w `chat-api/orders.js`. Sprawdz, czy
   komunikat o brakach nie wycieka do kalkulatorow innych niz odlew i czy nie
   zada pliku na sciezkach idacych do wyceny indywidualnej.
3. **Zgodnosc wstecz:** wez zamowienie zapisane przed zmiana z `finishId`
   rownym `clean` i przelicz je. Kwota ma byc identyczna.
4. **Dokumenty do potwierdzenia:** ADR-0016, `Brand_Reference` sekcja o
   produkcie odlewu, `llms.txt`, `chat-api/context.js`.

## Warunek uznania zadania za gotowe

1. `grep -rn "24 x 24 x 35"` nie znajduje niczego poza handoffami i ADR-ami
   opisujacymi stan sprzed zmiany.
2. Zaden komunikat o limicie nie niesie liczby wpisanej z reki.
3. Karta uslugi bez pliku mowi, ze brakuje pliku 3D, i podaje formaty.
4. Ten sam komunikat nie pojawia sie na sciezce z gotowym wzorcem.
5. Zakres wykonczenia ma piec poziomow, kazdy drozszy od poprzedniego,
   a pierwszy bez doplaty.
6. Wycena zamowienia z `finishId` rownym `raw`, `clean` albo `polished`
   daje te sama kwote co przed zmiana.
7. `/shop/jewelry/` pokazuje "Odlew bizuterii", `/shop/studio/` pokazuje
   "Odlew z metali szlachetnych", oba odnosniki prowadza pod ten sam adres.
8. Odlew stoi w filtrze "Jubilerstwo", nie w "Projektowanie".
