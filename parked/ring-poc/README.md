# Prototyp konfiguratora pierścionka

Kod, na którym oparty jest `MDs/AEJaCA_Konfigurator_Pierscionka_Plan.md`.
Nie jest wpięty w serwis i nie wchodzi do builda.

## Uruchomienie

```
npm install manifold-3d
node ring.mjs
```

Wypisuje pomiary i zapisuje `pierscionek.stl`, który można wrzucić
do `/toolstudio/printability/`.

## Zmierzone

- generowanie: **14 ms**, 3088 trójkątów
- objętość 0,207 cm3 → **2,71 g w Au 585**, 2,14 g w Ag 925
- kamień 6,5 mm → **0,99 ct** (podręcznikowo 1,00 ct)
- werdykt naszej sprawdzarki: **model gotowy do druku**
- koszt w przeglądarce: **529 kB WASM + 73 kB JS**

## Czego prototyp NIE rozwiązuje

Głowica siedzi w złym miejscu względem obrączki, a bryła ma 4 składowe zamiast
jednej. To jest praca do fazy 1, nie wątpliwość co do koncepcji.

## Pułapki, które już kosztowały

1. `revolve` przy profilu nawiniętym zgodnie z zegarem zwraca bryłę **pustą**, bez błędu.
2. `scale` skaluje względem początku układu, **nie** względem środka bryły.
3. Spójność bryły trzeba mierzyć (`decompose().length`), bo na podglądzie nie widać.
4. Szerokość obrączki ogranicza, gdzie mogą stać słupki galerii.
