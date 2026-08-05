# Prototyp konfiguratora pierścionka (ODŁOŻONY)

Badanie zamknięte 2026-08-05. Temat wraca później, ten katalog ma pozwolić
podjąć go bez powtarzania odkryć.

Plan biznesowo-techniczny: `MDs/AEJaCA_Konfigurator_Pierscionka_Plan.md`.
Kod nie jest wpięty w serwis, nie wchodzi do builda i nie ma zależności
w głównym `package.json`.

## Jak wrócić do tematu

```
cd parked/ring-poc
npm install
npm start
```

Wypisuje pomiary i nadpisuje `pierscionek.stl`. Generator jest
**deterministyczny**: ten sam kod daje bajt w bajt ten sam plik, więc
`git status` po uruchomieniu pokaże czysto, dopóki nie zmienisz geometrii.
Jeśli STL się zmienił, to znaczy że zmieniłeś kształt.

Kontrola wyniku: wrzuć `pierscionek.stl` na `/toolstudio/printability/`.
Powinno wyjść „model gotowy do druku" dla MSLA.

`render-ring.png` to podgląd z naszego `STLViewer` - punkt odniesienia,
gdyby po zmianach coś zaczęło wyglądać inaczej, niż powinno.

## Zmierzone (manifold-3d 3.5.1, Node 22)

- generowanie: **14 ms** rozgrzane, 29 ms na zimno; 3088 trójkątów
- objętość 0,207 cm3 → **2,71 g w Au 585**, 2,14 g w Ag 925
- kamień 6,5 mm → **0,99 ct** (podręcznikowo 1,00 ct)
- średnica wewnętrzna 17,19 mm dla rozmiaru EU 54
- werdykt naszej sprawdzarki: **model gotowy do druku** (MSLA bez uwag,
  FDM 0.2 tylko `small_base`)
- koszt w przeglądarce: **529 kB WASM + 73 kB JS** (OpenCascade, którego
  używamy do STEP, waży 7 MB - stąd wybór)

## Czego prototyp NIE rozwiązuje

Głowica siedzi w złym miejscu względem obrączki, a bryła ma **4 składowe
zamiast jednej** (`decompose().length === 4`). To pierwsza rzecz do zrobienia
po powrocie i jedyna niewiadoma techniczna, jaka została. Wszystko inne
zostało zmierzone i działa.

Model z 4 składowymi wygląda poprawnie na podglądzie, a po odlaniu część
odpada. Dlatego `czy jedna spojna bryla: false` w wyjściu jest **oczekiwane
na dziś** i musi się zmienić na `true`, zanim cokolwiek pójdzie dalej.

## Pułapki, które już kosztowały

Każda **nie zgłasza błędu**, tylko po cichu psuje wynik:

1. `revolve` przy profilu nawiniętym zgodnie z zegarem zwraca bryłę **pustą**.
   Stąd helper `ccw()` - pole liczymy sami i w razie czego odwracamy.
2. `scale` skaluje względem **początku układu**, nie względem środka bryły.
   Kamień osadzony na wysokości 9,8 mm i powiększony o 2% podskakuje o 0,2 mm
   i przecina łapki. Stąd luz robimy większą średnicą, nie skalowaniem.
3. Spójność bryły trzeba **mierzyć** (`decompose().length`), bo na podglądzie
   jej nie widać.
4. Szerokość obrączki ogranicza, gdzie mogą stać słupki galerii. Przy obrączce
   2,2 mm słupki w `y = ±1,6 mm` mijają ją w powietrzu.

## Co jest do decyzji, zanim zaczniemy budować

Telefon do **Pencil** (pencildesign.co) po cennik - nie podają go publicznie.
Jeśli abonament wychodzi poniżej kilkuset złotych miesięcznie, tydzień pracy
nad własnym rozwiązaniem się nie zwraca.

Największe ryzyko nie jest techniczne: prototyp dowiódł, że geometria się
liczy i drukuje, ale **nie dowiódł, że wygląda ładnie**.
