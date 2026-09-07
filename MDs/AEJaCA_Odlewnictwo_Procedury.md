# AEJaCA - Procedury odlewnicze: masa formierska, wypalanie, odlew

*Wersja 1.0 | wrzesień 2026 | dokument towarzyszący `AEJaCA_Inwentarz_Sprzet_Procesy.md`, rozdz. 4*

> **Miejsce w repozytorium.** Ten dokument jest źródłem prawdy o procesie odlewniczym:
> parametry sprzętu, masa formierska, krzywe wypalania, temperatury, wsad i studzenie.
> Inwentarz mówi, CO stoi w warsztacie, ten dokument mówi, JAK się tym pracuje.
> Wartości, które trafiają do klienta przez kalkulator (skurcz, gęstość stopu, limit
> wielkości modelu), mają swoje źródło w kodzie, nie tutaj: `src/data/castingAlloys.js`
> i `src/pricing/preciousMetalCasting.js`. Rozjazd między tym dokumentem a kodem jest
> błędem po jednej ze stron i trzeba go rozstrzygnąć, a nie zostawić.

> **Status wartości.** Pozycje oznaczone **[POTWIERDZONE]** pochodzą z udanego cyklu lost-PLA wykonanego w warsztacie. Pozycje **[KARTA]** pochodzą z dokumentacji producenta. Pozycje **[DO WERYFIKACJI]** to wartości wyprowadzone lub szacowane, wymagające pomiaru przy pierwszym użyciu. Nie awansować wartości między kategoriami bez pomiaru.

---

## 1. SPRZĘT - PARAMETRY OBOWIĄZUJĄCE

### 1.1 Kolba odlewnicza (AKTUALNA)

**RADIANCE3.5, perforowana, stalowa**

| Parametr | Wartość |
|---|---|
| Średnica wewnętrzna | 83 mm |
| Wysokość | 100 mm |
| Objętość wewnętrzna | ~525 cm³ |
| Perforacja | tak, cały płaszcz |
| Masa gotowej formy | ~1,3 kg |

**Przestrzeń użytkowa na model:**

| Wymiar | Wartość |
|---|---|
| Max średnica modelu (min. 10 mm od ścianek) | **60 mm** |
| Odjęcie: masa nad koroną (min. 15-20 mm) | -20 mm |
| Odjęcie: podstawa wlewowa i guzik | -20 mm |
| **Max wysokość modelu z wlewem** | **~60 mm** |

> Kolba starsza (30 x 50 mm, lita, blacha 0,4 mm) pozostaje w warsztacie jako pozostałość po setupie grawitacyjnym. **Do odlewu próżniowego nie jest używana.**

**Jak z tych wymiarów wychodzi limit w kalkulatorze [decyzja właściciela 2026-09-07]:**

Kolba jest walcem, więc limit też. Światło to 83 mm minus 2 x 10 mm masy przy
ściance, czyli **koło o średnicy 63 mm**, a liczy się **przekątna podstawy
modelu**, nie każda oś z osobna. Model 59 x 22 mm ma przekątną 63,0 mm i mieści
się; reguła kwadratu wpisanego w to koło (44 x 44 mm) odrzucała go, chociaż
fizycznie wchodził. Rzecz długa i cienka mieści się też **położona**, po
przekątnej podstawy.

Wysokość to **62 mm**: 60 mm z samej kolby (100 minus 20 na podstawę wlewową
z guzikiem, minus 20 masy nad koroną) plus 2 mm, które daje pochył przy układaniu
modelu. **Te 2 mm są prawdziwe dla rzeczy cienkich.** Model masywny pochylony
o 30% zajmuje w pionie WIĘCEJ, nie mniej, bo do cosinusa długości dochodzi sinus
własnej grubości: kostka 44 x 44 x 60 mm pochylona o 30% zajmuje 70 mm. Przy
takich modelach 60 mm jest granicą prawdziwą, a 62 mm optymistyczną.

Podstawa pomiaru: klucze 59 mm odlane przy pochyle 10%, wyszły bez pęknięcia.
Źródło liczb w kodzie: `src/pricing/preciousMetalCasting.js`.

### 1.2 Piec wypalający VEVOR KD-Z6652B

| Parametr | Wartość |
|---|---|
| Moc | 1650 W |
| Komora | 203 x 127 x 152 mm |
| Zakres | 30-1200°C (±5°C) |
| Profile programowalne | 9 |
| Timer na profil | 1-60 min |

**Mechanika sterownika [POTWIERDZONE]:**

- **Odliczanie timera startuje dopiero po osiągnięciu zadanej temperatury.** Rampa nagrzewania nie zajmuje czasu timera. To pozwala zmieścić pełną krzywę w 9 slotach bez ręcznych interwencji.
- Timer = 0 działa jako tryb bezterminowy **tylko w profilu 1**. W profilach 2-9 timer = 0 powoduje pominięcie profilu.
- Start zawsze od profilu 1. Nie da się wystartować od środka krzywej.
- Po zakończeniu wszystkich profili piec wraca do profilu 1 i wyłącza grzanie.
- Krótkie P = start/pauza. **Długie P (3-4 s) = reset do profilu startowego.** Nie dotykać w trakcie cyklu.
- Na koniec cyklu ustawić temperaturę docelową na 0 zamiast wyłączać piec. Wentylatory pracują przy schładzaniu i chronią elektronikę.

**Limit 2 h ciągłej pracy z instrukcji [POTWIERDZONE - NIE DOTYCZY]:** limit odnosi się do topienia metali przy 1200°C. Przy wypalaniu masy formierskiej (max 720°C) piec przepracował empirycznie 9 h bez przerwy bez problemów. Dla wypalania limit ignorujemy.

**Praktyka użytkowania:**

- Kolba na cegle szamotowej wewnątrz komory, nie bezpośrednio na dnie
- Otwór wentylacyjny w pokrywie zawsze drożny
- Drobne spękania wewnętrznych ścianek komory to zjawisko normalne
- Blacha ofiarna pod kolbą na wypływkę wzorca

### 1.3 Piec topienia VEVOR GF1150ND2-3KG-Y

| Parametr | Wartość |
|---|---|
| Tygiel grafitowy, średnica wewnętrzna | 35,8 mm |
| Głębokość | 113 mm |
| Temperatura maksymalna | 1150°C |
| Czas rozgrzania od zimna do 1000°C | **25-40 min** [POTWIERDZONE] |

### 1.4 Odlew próżniowy VEVOR DMJ-0001

Pojemność 400 ml, pompa 4,3 CFM, 290 W, dzwon akrylowy, płyta robocza 28 x 28 cm. Olej: Matrix Vacumax 46 (ISO VG 46).

Funkcje: degassing masy formierskiej, vacuum casting, wspomaganie komory Resiners przy większych kolbach.

---

## 2. MASA FORMIERSKA - WHIP MIX OMNI-II

### 2.1 Proporcje, rozdzielone na technologie

**To jest miejsce, w którym łatwo o pomyłkę. Proporcje NIE są wspólne.**

| Technologia | Proporcja woda:proszek | Pełna kolba 83 x 100 |
|---|---|---|
| **Lost-PLA** | **40:100** [POTWIERDZONE] | 610 g proszku + 244 ml wody |
| **Lost-resin (BlueCast)** | **38:100** [KARTA] | 625 g proszku + 237 ml wody |

Uzasadnienie różnicy: PLA nie wytapia się, tylko mięknie i rozpycha formę. Rzadsza masa jest tam świadomym wyborem, bo daje bardziej porowatą formę z możliwością oddania gazów. Żywice BlueCast zawierają niskotopliwy polimer woskowy, wypływają w niskiej temperaturze i nie rozpychają formy, więc wraca się do proporcji katalogowej producenta, która daje mocniejszą formę.

**Przelicznik roboczy:** ok. 1,22 g proszku na 1 ml objętości formy przy 40:100; ok. 1,19 g/ml przy 38:100. [DO WERYFIKACJI przy kolejnych zalaniach]

**Warianty zalania:**

| Wariant | Proszek (40:100) | Woda | Wysokość masy | Wolne nad masą |
|---|---|---|---|---|
| Pełne zalanie | 610 g | 244 ml | ~95 mm | ~5 mm |
| Test 2026-09 | 480 g | 192 ml | ~73 mm | ~27 mm |
| Kompromis | 550 g | 220 ml | ~84 mm | ~16 mm |

**Do każdego zarobu doliczyć 12-15% rezerwy** na miskę i dolewkę. Przy pełnym zalaniu: zarób 700 g + 280 ml.

**Minimum 15-20 mm masy nad koroną modelu.** Niedobór oznacza zapadnięcie ścian pod próżnią.

### 2.2 Harmonogram mieszania ręcznego [KARTA]

| Minuta | Czynność |
|---|---|
| 0 | Odważ proszek i wodę |
| 0 | **Wsyp proszek do wody**, nigdy odwrotnie |
| 0-4 | Mieszanie, 4 min |
| 4-6 | Odgazowanie miski, 2 min |
| 6-7 | Wlanie do kolby, 1 min |
| 7-9 | Odgazowanie kolby, 2 min |
| **9** | **Koniec czasu roboczego** |

**Woda:** destylowana lub dejonizowana. Zakres producenta 21-24°C. **Przy zarobach powyżej 500 g stosować 20-21°C**, bo cieplejsza woda skraca czas roboczy, a przy tej ilości masy każda sekunda jest potrzebna.

**Sprzęt przy zarobie 600-800 g:**

- Miska 4-5 l (masa mocno rośnie pod próżnią)
- Mieszadło na wiertarkę, wolne obroty; ręcznie nie da się rozbić grudek w 4 minuty
- Wszystko odważone i ustawione **przed** wsypaniem proszku

**Kontrola jakości partii:** gloss-off powinien nastąpić ok. 10 minuty od wsypania proszku. Szybciej niż minuta po zalaniu = skrócić mieszanie. Wolniej niż dwie minuty = wydłużyć.

### 2.3 Kolba perforowana - procedura

1. **Owinąć płaszcz taśmą przed zalaniem.** Bez tego rzadka masa wychodzi przez perforacje.
2. Zalać, odgazować.
3. **Taśma zostaje na czas wiązania i przechowywania** (działa też jako bariera przeciw wysychaniu).
4. **Zdjąć taśmę do czysta bezpośrednio przed piecem.** Resztki kleju przetrzeć alkoholem, sprawdzić perforacje pod światło. Taśma w piecu stopi się i zatka otwory sadzą oraz klejem, co likwiduje główną zaletę tej kolby.

### 2.4 Czas wiązania i przechowywanie

| Czas od zalania | Stan |
|---|---|
| ~10 min | Gloss-off, masa przestaje płynąć |
| 20-30 min | Wiązanie wstępne, ok. 22% docelowej wytrzymałości. **Za wcześnie na przenoszenie** |
| **2-3 h** | **Gotowość do pieca. Przy kolbie 83 mm stosować 3 h** |
| 2-8 h | Optymalne okno startu wypału |

**Przechowywanie przed wypałem:**

| Okres | Ryzyko | Postępowanie |
|---|---|---|
| do 4 h | pomijalne | nic |
| do 12 h | niskie | folia na czoło |
| 24 h | umiarkowane | folia + wilgotny ręcznik papierowy w worku |
| 48 h | wysokie | jw. + wydłużyć slot 1 o 1-2 h |
| >48 h | duże | rozważyć ponowne zalanie |

Kolba z zaklejonymi perforacjami oddaje wilgoć wyłącznie czołem, czyli ok. 5x wolniej niż odsłonięta. To istotnie obniża ryzyko przy dłuższym staniu.

**Nigdy nie polewać ani nie zanurzać formy w wodzie.** Chodzi o utrzymanie wilgotności powietrza wokół formy, nie o dowilżanie masy. Całkowicie wysuszona forma daje wysokie ryzyko pęknięć, rozerwania i wyrzutów podczas odlewu.

---

## 3. KRZYWE WYPALANIA

### 3.1 Lost-PLA [POTWIERDZONE - działa]

Kolba 83 x 100 mm, VEVOR KD-Z6652B.

| Slot | Temp | Timer | Faza |
|---|---|---|---|
| 1 | 150°C | 60 min | Rampa + odparowanie wilgoci powierzchniowej |
| 2 | 220°C | 60 min | Odwodnienie gipsu (1/2) |
| 3 | 220°C | 60 min | Odwodnienie gipsu (2/2) |
| 4 | 400°C | 60 min | Wypalanie PLA |
| 5 | 720°C | 60 min | Główne wypalanie (1/3) |
| 6 | 720°C | 60 min | Główne wypalanie (2/3) |
| 7 | 720°C | 60 min | Główne wypalanie (3/3) |
| 8 | temp. odlewu | 60 min | Schładzanie do temp. odlewu |
| 9 | temp. odlewu | 60 min | Utrzymanie, **okno na odlew** |

**Zasady krzywej:**

- Odwodnienie (sloty 1-3) to najważniejszy etap bezpieczeństwa. Wolne dochodzenie plus 2 h przy 220°C zapobiega pęknięciu formy od pary wodnej.
- Wypalanie PLA (slot 4): 400°C przez godzinę, plus dopalanie podczas rampy 400 do 720°C w slocie 5.
- Plateau 720°C (sloty 5-7): 3 h wystarcza przy jednym pierścionku bez wosku. Z woskiem wydłużyć do 4 h.
- Wszystkie 9 timerów musi mieć wartość różną od zera.

### 3.2 Lost-resin BlueCast X-One V2 [DO WERYFIKACJI]

Identyczna z lost-PLA z **jedną zmianą w slocie 1**.

| Slot | Temp | Timer | Faza |
|---|---|---|---|
| 1 | **170°C** | 60 min | **Wytopienie X-One (dewax) + odparowanie wilgoci** |
| 2 | 220°C | 60 min | Odwodnienie gipsu (1/2) |
| 3 | 220°C | 60 min | Odwodnienie gipsu (2/2) |
| 4 | 400°C | 60 min | Dopalanie pozostałości |
| 5-7 | 720°C | 3 x 60 min | Główne wypalanie |
| 8-9 | temp. odlewu | 2 x 60 min | Schładzanie i okno odlewu |

**Uzasadnienie slotu 1:** X-One zawiera niskotopliwy polimer woskowy, który ma się wytopić i wypłynąć, nie tylko zmięknąć. To odpowiednik dewaxu, którego przy PLA nie ma. Przy 150°C część zostaje w formie i idzie do spalenia w slocie 4, zwiększając ilość popiołu.

BlueCast rekomenduje ostatni etap 700°C; materiał wypala się całkowicie już przy 650°C. 720°C mieści się w zapasie.

### 3.3 Budżet czasu

| Składnik | Czas |
|---|---|
| Suma 9 timerów | 9 h 00 min |
| Rampy grzania | ~2 h 00 min |
| Schładzanie 720 do temp. odlewu (bierne) | ~1 h 00-1 h 10 min |
| **Razem** | **~12 h** |

**Okno odlewu otwiera się w 10. godzinie i trwa 2 h.**

| Start | Okno odlewu |
|---|---|
| 19:00 | 05:05 - 07:05 |
| 21:00 | 07:05 - 09:05 |
| **23:00** | **09:05 - 11:05** (zalecany, odlew po przespanej nocy) |

Schładzanie jest najbardziej niepewną pozycją. Piec nie chłodzi aktywnie. Timer slotu 8 nie ruszy przed osiągnięciem temperatury, więc program sam się koryguje; przesuwa się tylko zegar.

---

## 4. TEMPERATURY ODLEWU

### 4.1 Temperatura kolby (sloty 8-9)

| Stop | Temperatura kolby |
|---|---|
| Au 585 (14K) | **550-600°C** |
| **Ag 925, wyroby średnie i masywne** | **450-480°C** |
| Ag 925, filigran i cienkie ścianki | 500-550°C |

Srebro jest bardziej płynne od złota. Zbyt gorąca kolba daje szorstką, przypaloną powierzchnię odlewu i reakcję z masą.

> **Notatka z odlewu 2026-09:** wykonano odlew Ag 925 przy kolbie 550°C (krzywa ustawiona pod Au 585). Odlew wyszedł. Do oceny: chropowatość powierzchni względem odlewów przy 480°C.

### 4.2 Temperatura metalu

| Stop | Temperatura lania | Maksimum |
|---|---|---|
| Au 585 | 1000°C | 1050°C |
| **Ag 925** | **980-1020°C** | **1030°C** |

Ag 925 ma likwidus ok. 900°C. Potrzebne przegrzanie 80-120°C ponad tę wartość. Każde dodatkowe 50°C zwiększa ilość tlenu rozpuszczonego w ciekłym srebrze, który wraca przy krzepnięciu jako porowatość gazowa.

### 4.3 Skurcz (kompensacja w CAD)

| Stop | Mnożnik |
|---|---|
| Ag 925 | x1,016 |
| Au 9K | x1,021 |
| Au 585 (14K) | x1,0196 |
| Au 750 (18K) | x1,018 |

---

## 5. TOPIENIE SREBRA - PROCEDURA

### 5.1 Kluczowa różnica względem złota

**Przy srebrze NIE topi się z wyprzedzeniem.** Ciekłe srebro pochłania tlen z powietrza, do ok. dwudziestokrotności własnej objętości, i oddaje go gwałtownie przy krzepnięciu. Skutek: porowatość gazowa i "plucie" na powierzchni odlewu. Im krócej srebro stoi stopione, tym lepszy odlew.

### 5.2 Harmonogram, liczony wstecz od momentu lania

| Przed laniem | Czynność |
|---|---|
| **-45 min** | Włącz piec topiący, **pusty tygiel**, ustaw 1000°C |
| -45 do -15 min | Przygotowanie DMJ-0001, szczypce, rękawice, osłona twarzy. Odważ wsad. Boraks otwarty |
| **-15 min** | **Wrzuć wsad do rozgrzanego tygla** |
| -15 min | **Od razu szczypta boraksu na wierzch** (topi się ~740°C, czyli przed srebrem) |
| -5 do -3 min | Srebro płynne, kontrola wzrokowa |
| **0** | Wyjmij kolbę, odwróć wlotem do góry, lej |

**Boraks:** ok. 1/4 łyżeczki na 25-30 g wsadu. Ma powstać cienki szklisty film, nie kożuch. Nadmiar wpłynie do formy i da wtrącenia. Sypać od razu na wsad, nie po stopieniu.

**Nie mieszać.** Mieszanie zaciąga tlen i rozbija warstwę osłonową.

### 5.3 Kontrola wzrokowa przed laniem

| Obraz | Ocena |
|---|---|
| Powierzchnia lustrzana, ruchliwa, faluje przy poruszeniu tyglem | gotowe |
| Metal płynny, ale ospały, gęsty, z widoczną błoną | poczekać 2-3 min |
| Bryły widoczne pod powierzchnią | zdecydowanie za wcześnie |

Przy gęstym metalu mimo 1000°C na sterowniku: **poczekać, nie podkręcać temperatury.**

### 5.4 Moment wyjęcia kolby

**Nie na początku okna odlewu.** Odlewać ok. 30-60 min po starcie timera slotu 8, czyli w połowie slotu 8 albo na początku slotu 9.

Powód: sterownik pokazuje temperaturę komory, nie rdzenia formy. Przy kolbie 83 x 100 mm i 1,3 kg masy środek dochodzi z opóźnieniem ok. pół godziny.

Ostatnie 15-20 min okna zostawić jako rezerwę na drugie podejście.

**Od wyjęcia kolby do zalania: 30-60 sekund.** Wszystko nieprzygotowane wcześniej zostanie pominięte.

---

## 6. WSAD - KALKULACJA

**Wzór:**

```
masa odlewu     = objętość modelu z drzewem [cm³] x gęstość stopu
guzik zasilający = 35% masy odlewu
zapas procesowy  = 12% (zgar, resztka w tyglu)
```

Gęstości: Ag 925 = 10,36 g/cm³; Au 585 = 13,1 g/cm³.

**Przykład [POTWIERDZONE 2026-09]:**

| Pozycja | Wartość |
|---|---|
| Objętość modelu z drzewem (Rhino) | 1 625,97 mm³ = 1,626 cm³ |
| Masa odlewu Ag 925 | 16,84 g |
| Guzik (35%) | 5,90 g |
| Zapas 12% | 2,73 g |
| **Do odważenia** | **25,5 g, zaokrąglić do 26 g** |

**Guzik nie jest odpadem, tylko elementem konstrukcji odlewu.** Przy odlewie próżniowym zasila skurcz krzepnięcia. Za mały guzik = jama skurczowa w najgrubszej części, zwykle u nasady wlewu.

**Asymetria ryzyka:** nadmiar wraca do przetopu bez straty. Niedomiar to zmarnowana kolba, wzorzec, 12 h wypału i dzień pracy. W razie wahania brać więcej.

**Metal z przetopu:** maksymalnie 50% wsadu. Srebro traci cynk z ligatury przy każdym topieniu, a stary metal ma rozpuszczony tlen i zanieczyszczenia z masy. Guziki i wlewy przed ponownym użyciem: wytrawić, wyszczotkować z gipsu, obejrzeć pod lupą.

**Kontrola po odlewie:** zważyć odlew z drzewem. Przy powyższym przykładzie powinno wyjść ok. 17 g. Wyraźnie mniej = niedolew, sprawdzić cienkie partie przed odcinaniem wlewów.

---

## 7. UKŁAD WLEWOWY

**Vacuum-assist (DMJ-0001) - AKTUALNY:**

| Element | Wymiar |
|---|---|
| Main sprue | 2,0-2,5 mm (start: 2,2 mm) |
| Dedykowane wenty | zbędne (masa porowata + perforacja kolby) |
| Wenty backup (głębokie kieszenie) | 0,6-0,8 mm opcjonalnie |
| Feedery pośrednie | zbędne |

**Grawitacyjny - tylko do porównania:** main sprue 2,6-3,0 mm, feedery 1,4-1,8 mm, wenty 0,8-1,0 mm.

**Orientacja:** kolba w piecu **wlotem do dołu**. Przy odlewie po wyjęciu **odwrócić wlotem do góry**.

---

## 8. STUDZENIE I ROZFORMOWANIE

| Od zalania | Stan |
|---|---|
| 0-3 min | Guzik jasno świeci, metal płynny w środku |
| 3-8 min | Świecenie gaśnie, powierzchnia matowieje |
| **10-15 min** | **Guzik ciemny, kolba gorąca. Moment na quench** |
| >30 min | Za późno, gips twardnieje i trudniej schodzi |

Przy odlewie ok. 17 g w kolbie 83 x 100 mm celować w **12-15 min**.

**Test dźwiękowy:** dotknąć kolbę od góry czymś metalowym. Póki guzik jest miękki, dźwięk jest głuchy. Po zakrzepnięciu robi się dzwoniący.

**Quench:** wiadro min. 5 l zimnej wody, kolba wchodzi w całości i szybko. Nie polewać, nie zanurzać częściowo, nie wahać się w połowie ruchu. Osłona twarzy i rękawice obowiązkowo.

Zanurzenie z płynnym rdzeniem guzika = jama skurczowa u nasady wlewu, widoczna dopiero po odcięciu drzewa.

**Woda z osadem gipsowym nie idzie do zlewu** (gips wiąże w syfonie).

Dalej: myjka ultradźwiękowa na resztki w zakamarkach, potem obróbka wg `AEJaCA_Inwentarz_Sprzet_Procesy.md` rozdz. 5.

---

## 9. CHECKLISTA PRZED WYPAŁEM

- [ ] Forma związana min. 3 h (kolba 83 mm)
- [ ] Taśma zdjęta z perforacji do czysta, klej usunięty alkoholem
- [ ] Perforacje sprawdzone pod światło
- [ ] Podstawa wlewowa zdjęta
- [ ] Piec rozgrzany do temperatury slotu 1
- [ ] Kolba na cegle szamotowej, **wlotem do dołu**
- [ ] Blacha ofiarna pod kolbą
- [ ] Otwór wentylacyjny drożny
- [ ] Wszystkie 9 timerów ustawione (żaden nie może być 0)
- [ ] Sloty 8-9 ustawione na temperaturę właściwą dla stopu (Ag 480, Au 550-600)

## 10. CHECKLISTA PRZED ODLEWEM

- [ ] Piec topiący włączony 45 min wcześniej, tygiel pusty, 1000°C
- [ ] Wsad odważony wg kalkulacji z rozdz. 6
- [ ] Boraks otwarty i pod ręką
- [ ] DMJ-0001 pod napięciem, uszczelka czysta, dzwon sprawdzony
- [ ] Szczypce do kolby, rękawice, osłona twarzy w zasięgu ręki
- [ ] Wiadro z wodą przygotowane na quench
- [ ] Wsad wrzucony 15 min przed laniem, boraks od razu na wierzch
- [ ] Kontrola wzrokowa metalu przed laniem
- [ ] Kolba wyjęta i odwrócona wlotem do góry

---

# CZĘŚĆ II: ODLEWY Z ŻYWICY EPOKSYDOWEJ

> **Status: dokument w budowie.** Rozdziały 11-13 zawierają ustalenia z etapu analizy. Rozdział 14 to lista otwartych pozycji do uzupełnienia w miarę postępu prac.

## 11. WYBÓR TECHNOLOGII FORMY

Rozważano dwie ścieżki. **Wybrano ścieżkę B.**

| | A: forma drukowana elastyczna | B: master drukowany + silikon |
|---|---|---|
| Nakład wejściowy | 948 zł | **719 zł** |
| Praca na starcie | 7,6 h | 6,4 h |
| Do pierwszej sztuki | ~4 dni | **~2 dni** |
| Koszt 1 pierścionka | 463 zł | **326 zł** |
| Praca na 1 pierścionek | 4,5 h | **3,2 h** |
| Seria 10 szt. | 5 578 zł | **3 979 zł** |
| Seria 30 szt. | 14 838 zł | **10 499 zł** |

**Nie ma punktu przecięcia. Wariant B wygrywa już na pierwszej sztuce.**

**Źródło różnicy: 1,3 h polerowania na sztukę.** W formie drukowanej wnętrza wnęki nie da się wypolerować, więc linie warstw lądują na każdym odlewie i trzeba je zdejmować ręcznie po każdym cyklu. W silikonie poleruje się raz, master, na starcie; lustro kopiuje się na każdy odlew za darmo. Przy przezroczystym epoksydzie to warunek klarowności, nie kosmetyka.

**Drugi argument:** odtworzenie zużytej formy. Wariant A: 134 zł materiału, 7 h drukarki, 1,3 h pracy. Wariant B: master jest niezniszczalny, nowa forma to 35 zł silikonu i 0,8 h.

**Kiedy wariant A mimo to wygrywa:**

1. Geometria nie do rozformowania z silikonu bez rozerwania, ale możliwa jako forma drukowana rozbieralna na 3+ części
2. Wnęki o proporcji głębokość/szerokość powyżej ~8:1
3. Powierzchnia odlewu i tak idzie do matowienia lub piaskowania

## 12. SILIKON - ŚCIEŻKA PODSTAWOWA

### 12.1 Decyzja: platyna czy cyna

**Addycyjny (platynowy):** praktycznie zerowy skurcz, najdłuższa żywotność formy, ale wrażliwy na zatrucie katalizatora. Monomer z wydruku potrafi zahamować utwardzanie i zostawić lepką powierzchnię. Lekarstwo: dokładne domycie i pełne dopalenie mastera plus powłoka ochronna.

**Kondensacyjny (cynowy):** nie daje się zatruć niczym. Kosztem jest skurcz 0,3-0,6% i krótsza trwałość gotowej formy. **Na pierwszy odlew z drukowanego mastera to bezpieczniejszy wybór.**

### 12.2 Materiały - ceny PL

| Produkt | Typ | Shore A | Opakowanie / cena | zł/kg | Sklep |
|---|---|---|---|---|---|
| **Zhermack Elite Double 22** | addycyjny | 22 | 2 kg (1+1) / 238-285 zł<br>4 kg / 469 zł<br>10 kg / 1259 zł | **119-143** | sklep.hasmed.pl, dentaleshop.pl, cezal.pl |
| Smooth-On Mold Star 15 Slow | addycyjny | 15 | 0,90 kg / 229,90 zł | ~255 | kauposil.com |
| Smooth-On Mold Max 25 | kondensacyjny | 25 | od 250,08 zł | ~250 | kauposil.com |
| Smooth-On OOMOO 30 | kondensacyjny | 30 | 226,23 zł | ~226 | kauposil.com |
| Silikon formierski Sh20-25 | kondensacyjny | 20-25 | 1 kg / 84-119 zł | 84-119 | Allegro |

**Wybór podstawowy: Zhermack Elite Double 22 Normal.** Dentystyczny silikon do powielania modeli, addycyjny, bardzo płynny, 22 Shore A. Płynność ma znaczenie krytyczne przy geometriach z wąskimi zaułkami. Brać wariant Normal, nie Fast (Fast ma kilka minut czasu pracy).

**Na pierwszy test z drukowanym masterem:** coś kondensacyjnego za 84-119 zł. Jeśli master okaże się źle dopalony, strata 100 zł zamiast 250, i od razu wiadomo, czy procedura post-processingu wystarcza dla silikonów platynowych.

### 12.3 Kalkulacja ilości

Master pierścionka ~25 x 25 x 12 mm w bloczku 60 x 60 x 40 mm: ok. 140 cm³ po odjęciu objętości modelu, czyli przy gęstości ~1,15 g/cm³ **160-170 g na jedną formę**.

| Opakowanie | Liczba form | Koszt silikonu na formę |
|---|---|---|
| Mold Star 0,90 kg | ~5 | ~46 zł |
| Elite Double 2 kg | ~12 | ~20-24 zł |

Przy takich liczbach forma zapasowa z tego samego mastera jest bezkosztowa. To najlepsza polisa przy zleceniu klienckim.

### 12.4 Materiały pomocnicze

- Separator do silikonu (Ease Release 200 lub odpowiednik), ok. 80-150 zł. Konieczny na styku silikon-silikon przy formie dwuczęściowej
- Lakier akrylowy w sprayu do zabezpieczenia mastera przed kontaktem z silikonem platynowym
- Kubki miarowe i mieszadła jednorazowe (resztka poprzedniej mieszanki zatruwa następną porcję)

### 12.5 Procedura

1. Master sztywny na Saturn 4 Ultra 16K. ABS-like 3.0 lub Ultracur3D ST 45 B (czarna, bez light bleedingu, HDT 63°C). Warstwa 0,03 mm
2. Wykończenie mastera do lustra: szlif 800-2000, polerowanie, cienki lakier akrylowy
3. Pełne dopalenie UV i odstanie 24-48 h (warunek konieczny przy silikonie platynowym)
4. Odlew silikonu, odgazowanie w DMJ-0001
5. Odlew epoksydu: DMJ-0001 do odgazowania mieszanki przed zalaniem, nie do utwardzania

## 13. ŻYWICE ELASTYCZNE - RANKING (ścieżka alternatywna)

Kryterium: **wytrzymałość na rozdarcie ASTM D624.** Poprzeczka to 20-30 kN/m, czyli poziom dobrego silikonu dublującego.

| # | Materiał | Shore A | Rozdarcie | Wydłuż. | zł/kg | Sklep |
|---|---|---|---|---|---|---|
| 1 | **Ultracur3D EL 4000** | 90 | **37 N/mm** | 172% | 726 | global3d.pl |
| 2 | **Phrozen EL400** | 70-75 | **22 kN/m** | 391% | 577<br>(100 g / 79 zł) | 3dpartnershop.pl<br>3duv.pl |
| 3 | Ultracur3D EL 60 | 75 | 18 N/mm (Graves)<br>**3 kN/m (Trouser)** | 95% | 560 | global3d.pl |
| 4 | **Liqcreate Flexible-X** | 55 | 14,9 kN/m | 120-160% | 735 | 2b3d.pl |
| 5 | Ultracur3D EL 150 | 75-78 | 14 N/mm | 182% | 640-710 | blackfrog.pl, 2b3d.pl |
| 6 | Ultracur3D FL 60 | 60-73 | ~13 kN/m | 84% | 424 | global3d.pl |
| 7 | Liqcreate Elastomer-X | 43 | 10-12 kN/m | 140-180% | 790 | 2b3d.pl |
| 8 | Ultracur3D FL 300 | 39-40 | 9 N/mm | 245% | 649-695 | get3d.pl |
| 9 | Siraya Tech Tenacious Flex | 70 | brak danych | - | 222 | 3dpartnershop.pl |
| 10 | SUNLU Flexible | 70 | brak danych | 130% | 130 | 3duv.pl |

### 13.1 Materiały zdyskwalifikowane i dlaczego

| Materiał | Powód |
|---|---|
| **Ultracur3D EL 60** | **Tg = 29°C** (DMA tan δ, ASTM D4065). Egzoterma epoksydu w zamkniętej formie przekroczy to przy każdym odlewie; materiał przechodzi w stan gumowaty i traci stabilność wymiarową. Dodatkowo rozdarcie Trouser tylko 3 kN/m, a Rossflex 23°C oznaczony jako "Failed after". Marketing ("szybka reakcja elastyczna") opisuje aplikacje dynamiczne: obuwie, wkładki amortyzujące, uchwyty |
| **Liqcreate Premium Flex** | Rozdarcie 4,3 kN/m |
| **SUNLU Flexible** | Deklarowany skurcz formy 7,38% |
| **Ultracur3D ST 45 / ST 45 B** | To żywica sztywna, **81 Shore D**, nie elastomer. Producenci nie podają rozdarcia, bo materiał pęka zamiast się rozdzierać. **Przydatna natomiast jako lepsza ABS-like do masterów i sztywnych płaszczy**: HDT 63°C, moduł 2040 MPa, lepkość 230 mPas, wersja B czarna (bez light bleedingu) |
| Formlabs Elastic 50A / Silicone 40A | System zamknięty, nie na Saturna |

### 13.2 Czego karty techniczne nie mówią

Trzy parametry decydujące o liczbie cykli, których nikt nie publikuje:

1. **Tg przy rzeczywistej egzotermie** (EL400 i Flexible-X nie podają Tg wcale, tylko bezużyteczne "degradation >250°C")
2. **Rzeczywisty skurcz po pełnym dopaleniu UV**
3. **Liczba cykli do utraty połysku powierzchni formy**

**Główny mechanizm zużycia to przyczepność epoksydu, nie rozdarcie.** Epoksyd aminowy wiąże się chemicznie z akrylanem i przy każdym wyjmowaniu wyrywa mikroskopijną warstwę powierzchni. Bez separatora semi-permanentnego 50 cykli nie osiągnie żaden z tych materiałów.

**Sztywna obudowa jest obowiązkowa.** Forma elastyczna sama z siebie nie daje precyzji, bo ugina się pod ciężarem żywicy. Sztywny płaszcz zewnętrzny (ABS-like lub ST 45 B) ze sworzniami pasowania to jedyne, co odlewany silikon w kartonowej ramce nigdy nie da.

### 13.3 Zestaw testowy, gdyby wracać do tej ścieżki

| Pozycja | Cena |
|---|---|
| Phrozen EL400 100 g (3duv.pl) | 79 zł |
| Liqcreate Flexible-X 250 g (2b3d.pl) | 248 zł |
| Separator semi-permanentny | 150-250 zł |

Protokół: ta sama forma dwuczęściowa, obrzeże 8-10 mm, stożkowy wlew, otwory odpowietrzające w każdym ślepym zaułku, wydruk 0,03 mm. Zalewanie cykliczne, notowanie co 5 odlewów: wymiar kontrolny suwmiarką, połysk powierzchni odlewu, mikropęknięcia w narożnikach. Koniec życia formy = moment, w którym odlew wymaga więcej polerowania niż na starcie.

## 14. POZYCJE OTWARTE - DO UZUPEŁNIENIA

- [ ] **Maksymalna głębokość jednorazowej wylewki Epodex** (z karty technicznej). Decyduje, czy odlew montażowy idzie na raz czy w dwóch warstwach, co zmienia czas cyklu o 24 h
- [ ] Rzeczywista objętość silikonu na konkretny gabaryt bloczka formy
- [ ] Wybór i cena separatora semi-permanentnego
- [ ] Konstrukcja formy dwuczęściowej: linia podziału poprowadzona tak, żeby nie ciąć widocznej szachownicy
- [ ] Test: czy master z ABS-like po standardowym dopaleniu zatruwa silikon platynowy
- [ ] Zmierzona liczba cykli formy silikonowej przy epoksydzie
- [ ] Procedura odgazowania epoksydu w DMJ-0001: czas, poziom próżni
- [ ] Ocena, czy potrzebny garnek ciśnieniowy (2-3 bar) do epoksydu; obecnie brak w warsztacie

---

## ERRATA DO `AEJaCA_Inwentarz_Sprzet_Procesy.md`

> **Zastosowana 7 września 2026.** Poprawki poniżej stoją już w inwentarzu, rozdz. 4.
> Tabela zostaje jako zapis tego, co i dlaczego zostało zmienione.

Poprawione w rozdz. 4:

| Pozycja | Jest | Ma być |
|---|---|---|
| Kolba odlewnicza | Średnica 30 mm, wysokość 50 mm, ściana 0,4 mm | **RADIANCE3.5: średnica wewn. 83 mm, wysokość 100 mm, perforowana, stalowa.** Kolba 30 x 50 mm pozostaje jako nieużywana pozostałość po setupie grawitacyjnym |
| Maks. średnica modelu | 24 mm (margines 3 mm) | **60 mm** (margines 10 mm od ścianek) |
| Omni-II, proporcje | 40:100 woda:proszek (mix ręczny) | **40:100 dla lost-PLA [POTWIERDZONE], 38:100 dla lost-resin [KARTA]** |
| Wypełnienie kolby | 480-610 g | **480-610 g dla kolby 83 x 100 mm**, przelicznik ~1,22 g proszku na 1 ml |
| Piec KD-Z6652B, limit 2 h | LIMIT OPERACYJNY: max 2h ciągłej pracy | **Limit dotyczy topienia metali przy 1200°C. Przy wypalaniu (max 720°C) potwierdzono empirycznie 9 h ciągłej pracy** |
| Piec KD-Z6652B, timery | brak informacji | **Odliczanie timera startuje dopiero po osiągnięciu zadanej temperatury; rampy nie zajmują czasu timera** |
| Temperatura kolby Ag 925 | brak | **450-480°C (wyroby średnie), 500-550°C (filigran)** |
| Temperatura metalu Ag 925 | brak | **980-1020°C, max 1030°C** |

---

*AEJaCA Studio | www.aejaca.com*
