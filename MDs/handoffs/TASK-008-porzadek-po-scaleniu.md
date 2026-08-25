# TASK-008: porzadek po scaleniu siedmiu zadan

```yaml
task_id: TASK-008
status: review
author: Claude Code
branch: claude/fix-api-error-oge1r
base_commit: 001c95f
last_commit: f961e69
updated: 2026-08-25
```

## Cel

Zamknac stan po scaleniu TASK-001 do TASK-007: naprawic jedyna wpadke widoczna
dla klienta, zamknac droge, ktora ja przepuscila, i doprowadzic dokumentacje
koordynacyjna do stanu zgodnego z jej wlasnymi regulami.

## Stan przed zmiana

1. **Rozpiska odlewu mieszala waluty.** `src/pricing/preciousMetalCasting.js`
   wpisywalo koncowke "PLN" na sztywno w dwoch wierszach, podczas gdy reszta
   rozpiski szla przez `fmtCost(kwota, lang)`. Klient czytajacy strone po
   angielsku albo po niemiecku rozwijal "Show the breakdown" i widzial kruszec
   oraz robocizne w euro, a przygotowanie wzorca i wykonczenie w zlotowkach.
   Odtworzenie: karta `/shop/service/precious_metal_casting/` w `en`, model
   miesczacy sie w kolbie, kruszec AEJaCA, rozwinieta rozpiska.
2. **Format ADR sie rozjechal.** `MDs/decisions/README.md` opisuje front matter
   YAML ze statusem. ADR-0005, 0006 i 0007 mialy status wpisany proza, ADR-0010
   punktem listy. Nic tego nie pilnowalo.
3. **Workboard nie nadazal za rzeczywistoscia.** Siedem zadan bylo scalonych do
   `main`, a tabela pokazywala `review`, kolejka integracji wszedzie "oczekuje",
   TASK-007 nigdy do niej nie trafil, archiwum bylo puste mimo reguly 7.
4. **Wyscig w migracji startowej.** Indeks czesciowy `idx_orders_payment_review`
   startowal rownolegle z `ALTER TABLE ... ADD COLUMN payment_review_at`, a jego
   blad ladowal w pustym `.catch`. Przegrany wyscig oznaczal brak indeksu bez
   jakiegokolwiek sladu.

## Zalozenia i decyzje

- Kwoty w rozpisce ida przez `fmtCost`, tak samo jak wiersze odziedziczone po
  `calcNew`. Zrodlo: `PROJECT_RULES.md`, sekcja `Waluta`.
- Statusow ADR nie zmieniam. `MDs/decisions/README.md` mowi, ze decyzje
  akceptuje wlasciciel projektu. Normalizuje wylacznie ksztalt naglowka, co nie
  zmienia sensu zadnej decyzji.
- `scripts/check-adr.mjs` sprawdza format, a nie tresc. Odrzucona alternatywa:
  walidator wymuszajacy komplet sekcji. Odrzucony, bo ADR bywa krotki z sensem,
  a nadmiar wymagan konczy sie wypelniaczem.
- Wyscig migracji naprawiam lancuchem obietnic dla trzech kolumn i indeksu, a
  nie przerabianiem calego bloku startowego na `await`. Blok ma okolo czterdziestu
  zapytan i opoznianie nasluchu portu byloby wieksza zmiana niz naprawiany blad.

## Zakres

### Zmienione pliki

- `src/pricing/preciousMetalCasting.js` oraz mirror `chat-api/pricing/`: kwoty
  przygotowania wzorca i wykonczenia przez `fmtCost`.
- `scripts/test-precious-metal-casting.mjs`: test zbiera waluty ze wszystkich
  wierszy rozpiski i wymaga jednej dla `pl`, `en` i `de`.
- `scripts/check-adr.mjs`: nowy guard formatu ADR.
- `package.json`: guard w `npm run build` oraz skrot `npm run check:adr`.
- `MDs/decisions/ADR-0005,0006,0007,0010`: naglowek na front matter YAML.
- `chat-api/server.js`: kolumny `payment_review_*` i indeks nad nimi w lancuchu.
- `MDs/WORKBOARD.md`: archiwum siedmiu zadan, wynik recenzji po scaleniu, lista
  otwartych punktow dla Codexa.

### Swiadomie poza zakresem

- Statusy ADR-0002 i ADR-0010 pozostaja `draft`, do decyzji Artura.
- Handoffy TASK-003 i TASK-004 zostaja bez sekcji `Ryzyka`. To dokumenty Codexa
  i poprawia je autor, a nie recenzent.
- Geometria pierscionkow: nie recenzowalem bryly, oparlem sie na zestawie testow.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Test bledu przed poprawka | przywrocona koncowka "PLN", `node scripts/test-precious-metal-casting.mjs` | fail: `rozpiska odlewu w en miesza waluty: EUR, PLN` |
| Test po poprawce | `node scripts/test-precious-metal-casting.mjs` | pass |
| Kontrola negatywna guardu ADR | `status: zaakceptowany` w ADR-0006, `node scripts/check-adr.mjs` | fail, exit 1, potem przywrocone |
| Testy backendu | `cd chat-api && npm test`, czternascie zestawow | pass |
| Mirrory cenowe | `npm run sync:pricing`, potem `--check` w buildzie | zgodne |
| Build | `npm run build` | pass, 98 stron, zero bledow |

## Ryzyka i otwarte pytania

- Nie uruchomilem prawdziwej transakcji ani sandboxa Autopay. Srodowisko nie ma
  wyjscia na zewnatrz.
- Nie zajrzalem do produkcyjnej bazy, wiec nie wiem, czy blok migracji przeszedl
  na Railway. Do sprawdzenia w logach po `[migracja]`.
- `fmtCost` przelicza euro po stalym kursie z `CONFIG.EUR_PLN_RATE`, a nie po
  zywym kursie NBP. Tak dziala cala rozpiska od dawna, wiec nie zmienialem tego
  przy okazji, ale to jest rozjazd wart osobnej decyzji.
- Decyzja Artura: czy ADR-0002 i ADR-0010 przechodza w `accepted`.

## Instrukcja dla recenzenta

1. Podwaz hipoteze, ze `fmtCost` jest tu wlasciwym formaterem. Sprawdz, czy
   przygotowanie wzorca i wykonczenie nie powinny isc przez `netCostFmt`, ktorego
   uzywaja silniki laserowe i drukarskie. Twierdze, ze nie, bo obie kwoty sa
   doklejane po pelnej wycenie jubilerskiej, poza rabatem rynku polskiego.
2. Granica do sprawdzenia: `calculate()` zwraca `{type:"custom"}` dla wariantow
   innych niz model 3D z kruszcem AEJaCA. Te sciezki nie maja rozpiski w ogole,
   wiec test waluty ich nie dotyka i nie moze ich chronic.
3. Dokumenty do potwierdzenia: `MDs/WORKBOARD.md` (archiwum zgadza sie z historia
   `main`) oraz `MDs/decisions/README.md` (guard nie wymaga wiecej, niz szablon).

## Warunek uznania zadania za gotowe

- `npm run build` przechodzi z zerem bledow.
- Rozpiska odlewu w `en` i `de` nie zawiera ciagu "PLN".
- `node scripts/check-adr.mjs` przechodzi, a zepsuty status wywala go z kodem 1.
- Workboard nie zawiera zadnego wiersza `review` dla zadania juz scalonego.
