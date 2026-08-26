---
status: draft
owner: Artur
date: 2026-08-26
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0010-odlewy-z-metali-szlachetnych.md
  - MDs/decisions/ADR-0011-odlew-w-kalkulatorze-studio.md
  - src/pricing/preciousMetalCasting.js
  - src/data/serviceCatalog.js
  - chat-api/orders.js
  - scripts/test-precious-metal-casting.mjs
---

# ADR-0016: Kolba, zakres wykonczenia i miejsce odlewu w sklepie

## Kontekst

Cztery sprawy zglosil wlasciciel 2026-08-26, ogladajac karte uslugi "Odlew
z metali szlachetnych".

1. **Rozmiar kolby byl nieprawdziwy.** W kodzie stalo `24 x 24 x 35 mm`,
   a pracownia pracuje na kolbie o srednicy 80 mm i glebokosci 80 mm.
   Ta sama liczba byla przy tym wpisana z reki w dziewieciu miejscach:
   w silniku wyceny, w trzech jezykach szybkiej wyceny, w trzech jezykach
   komunikatu z serwera, w specyfikacji karty uslugi, w `llms.txt`,
   w kontekscie asystenta i w dokumencie marki.
2. **Klient bez pliku dostawal zdanie "Parametry sa niekompletne".** Zdanie
   prawdziwe i bezuzyteczne: nie mowilo, ze chodzi o plik 3D, ani ze bez
   niego nie ma z czego policzyc masy kruszcu.
3. **Zakres wykonczenia mial trzy poziomy**, a pracownia sprzedaje piec.
4. **Odlew wisial tylko w dziale sTuDiO.** Klient szukajacy odlanego
   pierscionka zaglada do dzialu Bizuteria i tam go nie znajdowal.

## Decyzja

### 1. Kolba jest jedynym zrodlem rozmiaru

`CASTING_FLASK_MM = { diameter: 80, depth: 80 }` to jedyna liczba wpisana
z reki. Limit modelu liczy sie z niej, a nie stoi obok niej:

```
swiatlo   = 80 - 2 x 10 mm masy formierskiej przy scianie = 60 mm
bok       = floor(60 / sqrt(2))                           = 42 mm
wysokosc  = 80 - 15 mm stozka i kanalu - 10 mm masy nad modelem = 55 mm
```

Stad `CASTING_ENVELOPE_MM = [42, 42, 55]`. Kazdy komunikat o limicie, takze
te trzy na serwerze, czyta `CASTING_ENVELOPE_LABEL`, wiec nastepna zmiana
kolby jest zmiana jednej linii, a nie polowaniem na milimetry po repozytorium.

**Trzy zapasy sa oszacowaniem warsztatowym, nie pomiarem.** Kazdy z nich ma
inny powod: masa formierska musi utrzymac sciane miedzy modelem a blacha
kolby, przy dnie stoi stozek i kanal glowny, a nad najwyzszym punktem modelu
musi zostac warstwa masy, inaczej forma peka przy wypalaniu. Jesli pracownia
wie, ze ktoras wartosc jest za ostrozna albo za smiala, poprawia sie ja
w `preciousMetalCasting.js` i limit przelicza sie sam.

### 2. Komunikat o brakach nazywa braki

`describeMissingCastingParams()` wylicza po kolei to, czego brakuje, w jezyku
klienta. Plik jest wymagany TYLKO na sciezce "model 3D + kruszec AEJaCA",
bo tylko ona w ogole dostaje kwote z automatu; na pozostalych dwoch wycena
i tak idzie do czlowieka, wiec zadanie pliku byloby zadaniem rzeczy, ktorej
klient jeszcze nie ma. Na karcie uslugi to samo zdanie stoi pod polem pliku,
zanim klient zdazy zobaczyc blad.

Pozostale kalkulatory zostaja przy ogolnym komunikacie: maja komplet pol
widoczny na jednym ekranie, wiec puste pole widac golym okiem.

### 3. Piec poziomow wykonczenia

| Poziom | Identyfikator | Doplata |
|---|---|---|
| Surowy odlew z kanalami wlewowymi | `raw` | 0 PLN |
| Surowy odlew z odcietymi kanalami | `sprue_cut` | 30 PLN |
| Odciete kanaly wlewowe (slad zlicowany) | `clean` | 70 PLN |
| Wyszlifowany | `ground` | 110 PLN |
| Wykonczenie jubilerskie (szlifowanie i polerowanie) | `polished` | 160 PLN |

**Identyfikatory `raw`, `clean` i `polished` sa te same co przed zmiana.**
Leza w zapisanych zamowieniach i w `CAST_FINISH_MAP` z szybkiej wyceny,
a serwer wycenia koszyk od nowa przy kazdej platnosci: przemianowanie ich
zabiloby wycene kazdego starego koszyka bez jednego bledu w buildzie.
Dwa nowe poziomy dostaly nowe identyfikatory i weszly miedzy istniejace,
wiec skrajne kwoty (0 i 160 PLN) nie drgnely.

### 4. Karta uslugi wisi w dwoch dzialach

`alsoIn` na karcie uslugi pozwala jej pojawic sie w drugim dziale pod inna
nazwa i inna zajawka, ale pod TYM SAMYM adresem. W AEJaCA Bizuteria nazywa
sie "Odlew bizuterii", w AEJaCA sTuDiO zostaje "Odlew z metali szlachetnych".

Drugi adres bylby druga strona z tym samym opisem, tymi samymi danymi
strukturalnymi i ta sama wycena, czyli dwoma wynikami wyszukiwania walczacymi
o to samo zapytanie. Jeden adres, dwie polki.

Przy okazji odlew trafil do filtra "Jubilerstwo" zamiast do "Projektowanie",
gdzie wpadal przez sam brak przedrostka `jewelry` w identyfikatorze.

## Konsekwencje

- **Automat obejmuje teraz znacznie wieksze modele.** Bryla 42 x 42 x 55 mm
  ma okolo szesciu razy wieksza objetosc niz 24 x 24 x 35 mm, wiec kwoty
  wiazace siegna wyzej niz dotad. Rezerwa procesowa i gestosc stopu licza to
  tak samo jak wczesniej, ale warto sprawdzic na zywym ruchu, czy pierwsza
  duza sztuka nie zaskoczy pracowni.
- **Modele, ktore wczoraj szly do oceny indywidualnej, dzis dostana kwote
  z automatu.** To jest cel zmiany, ale znosi ludzka kontrole nad ta grupa.
- Wyceny zapisane przed zmiana pozostaja wazne: zadnego identyfikatora nie
  usunieto.
- Karta uslugi liczona jest teraz dwa razy przy budowaniu listy dzialu.
  Kart uslug jest kilkanascie, wiec koszt jest niemierzalny.

## Do rozstrzygniecia przez wlasciciela

1. **Poziomy 2 i 3 brzmia podobnie.** "Surowy odlew z odcietymi kanalami"
   i "Odciete kanaly wlewowe" moga oznaczac to samo. Przyjeta wykladnia:
   poziom 2 to odciecie od drzewka ze sladem po kanale, poziom 3 to slad
   zlicowany z powierzchnia. Jesli chodzilo o cos innego, poprawiamy same
   nazwy i podpisy, bo ceny i identyfikatory sa od nich niezalezne.
2. **Trzy zapasy kolby** (10 mm przy scianie, 15 mm na stozek, 10 mm nad
   modelem) sa moim oszacowaniem. Pracownia wie to lepiej.
3. Status tego ADR.
