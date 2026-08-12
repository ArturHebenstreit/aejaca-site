# Porownanie jader geometrycznych pod kreator pierscionkow

Odpowiada na jedno pytanie: na czym budowac kreator, skoro klient ma dostac
STL i 3MF od razu, a STEP w pozniejszym etapie.

    npm install
    node bench.mjs

Wynik ostatniego przebiegu lezy w `WYNIK.txt`. Nie wchodzi do builda serwisu.

## Wnioski

| | manifold-3d 3.5.1 | OpenCascade (replicad 0.23.1) |
|---|---|---|
| wasm | 0,5 MB | 10,3 MB |
| wczytanie | 28 ms | 282 ms |
| budowa pierscionka | **27 ms** | **1087 ms** |
| objetosc szyny wobec wzoru | -0,74 % | **-0,10 %** |
| STL, 3MF | tak | tak |
| STEP | **nie, i nigdy** | **tak, 115 kB** |
| zaokraglenia | brak operatora | tak, ale 2069 ms i tylko przed zlaczeniem bryl |
| praca w Node | bez zabiegow | wymaga podstawienia `__dirname` i `require` |
| gwarancja zamknietej siatki | tak, `genus()` to potwierdza | brak odpowiednika |

Czterdziestokrotna roznica w czasie budowy rozstrzyga podzial: manifold
liczy podglad i pliki siatkowe, OpenCascade robi STEP na zadanie po stronie
serwera, gdzie sekunda czekania nikomu nie przeszkadza.

## Trzy pulapki, ktore to odkrylo

Wszystkie trzy oddaly bryle wygladajaca poprawnie i zadna nie zglosila bledu.

1. **manifold, kierunek nawiniecia profilu.** Profil zgodny z ruchem wskazowek
   zegara daje bryle PUSTA. Bez ostrzezenia.
2. **manifold, kolejnosc operacji.** Gniazdo ciete przed zlaczeniem korony
   z szyna nie siega szyny. Bryla wychodzi o kilkanascie procent ciezsza,
   czyli tez drozsza.
3. **OpenCascade, flaga `sweep` w `halfEllipseTo`.** Odwrocona daje inny luk
   i pierscionek **lzejszy o 15 %**. Model wyglada dobrze, cena jest falszywa.

Stad ostatnia sekcja `bench.mjs`: objetosc szyny liczona wzorem
(twierdzenie Pappusa, `2*PI*Rsr*A`) i porownana z tym, co oddalo jadro.
**Ten test ma wejsc do builda.** Prog: 2 %.
