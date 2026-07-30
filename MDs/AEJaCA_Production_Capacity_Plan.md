# AEJaCA - Przepustowość, kolejka produkcyjna i magazyn materiałów

*Wersja robocza 1.6 | 2026-07-29 | branch `claude/shop-plan` | dokument towarzyszący `AEJaCA_Shop_Plan.md`, rozdz. 10*

> **Faza przedrejestracyjna, czytaj przed liczbami.** Do czasu założenia spółki działamy jako **działalność nierejestrowana**. Od 2026-01-01 limit rozliczany jest **kwartalnie i wynosi 10 813,50 PLN** (225 proc. kwartalnego wynagrodzenia minimalnego), co potwierdził Autopay przy weryfikacji serwisu. To około **3 600 PLN miesięcznie** i **43 250 PLN rocznie**. Sufit ~130 sztuk i ~27 zleceń tygodniowo opisuje **stan docelowy po rejestracji**, a nie cel na dziś. Dziś te liczby służą wyłącznie do kalibracji mechanizmu terminów i cennika, żeby po rejestracji nie trzeba było ich wyznaczać od zera. Kolejność jest świadoma: najpierw zbudować popyt, potem zarejestrować spółkę, potem zdjąć ograniczenie.

*Zmiany w 1.1: wyliczenie sufitu na realnych danych (3.4), mechanizm samokalibrujący zamiast dwóch trybów (3.3), projektowanie pod szeroką bazę materiałów (4.4), zmieniona kolejność etapów (7), ustalenia i pytania otwarte (9).*

*Zmiany w 1.2: przeliczenie sufitu przy stawce 100 PLN/h, podziale czasu 50 na 50 i 5 dniach roboczych (3.4), znalezisko o niedoszacowaniu kosztu obróbki (3.6), potwierdzona wykonalność odczytu zużycia filamentu z AMS przez MQTT (4.4).*

*Zmiany w 1.3: obróbka 15 min na sztukę przeliczona na sufit w sztukach (3.4), maszyny okazują się wykorzystane w ~30 proc. (3.5), termin jako bufor liczony z obłożenia (3.5a), rabat seryjny działa odwrotnie do założenia (3.6a), liczenie sztuk na platformie już w kodzie (1.3).*

*Zmiany w 1.4: czasy obróbki rozdzielone na technologie (FDM 6 min, MSLA 10 min), sufit ~107 sztuk i ~24 zlecenia tygodniowo (3.4), wąskie gardło różne dla FDM i MSLA (3.5), wycena FDM okazuje się poprawna, korekta dotyczy wyłącznie żywicy (3.6).*

*Zmiany w 1.5: czasy obróbki MSLA rozbite na kategorie 5/7/10 min, cennik obróbki per kategoria 8/12/17 PLN (3.6), sufit ~130 sztuk tygodniowo (3.4), zmiana priorytetu na popyt zamiast podaży (9.3).*

*Zmiany w 1.6: dopisana ramka o fazie przedrejestracyjnej i limicie przychodu działalności nierejestrowanej.*

---

## 0. Streszczenie

Trzy podsystemy, w tej kolejności zależności:

1. **Pomiar przepustowości** - musi być pierwszy, bo wszystko inne opiera się na jego liczbach
2. **Kolejka produkcyjna** - zamienia godziny maszynowe na konkretną datę wysyłki
3. **Magazyn filamentów i żywic** - decyduje, czy zlecenie startuje od ręki, czy czeka na dostawę

Najważniejsza obserwacja z audytu kodu: **godziny maszynowe już liczymy.** Kalkulator robi to przy każdej wycenie. Nie trzeba budować silnika estymacji, trzeba zacząć zapisywać to, co i tak wyliczamy.

Najważniejsze ostrzeżenie: **wąskim gardłem nie są drukarki, tylko człowiek.** Plan, który liczy tylko godziny maszynowe, obieca terminy nie do dotrzymania.

---

## 1. Co już mamy

### 1.1 Model czasu druku istnieje w kodzie

`src/components/calculators/Print3DCalc.jsx`:

**Żywica (Elegoo Saturn 4 Ultra 16K):**
```js
const printTimeH = (heightCm * 10) / layer.speed;   // 35 mm/h @0,05 mm, 20 mm/h @0,03 mm
const totalTimeH = (printTimeH * platesNeeded) + 0.5;
```

**FDM (Bambu Lab H2D):**
```js
const printTime  = size.timeBase * prec.speedMul * color.timeMul;
const totalTimeH = (printTime * platesNeeded) + 0.5 + (handlePerPc * qty);
```

Znamy więc dla każdej wyceny: czas druku na sztukę, liczbę platform, czas całkowity. To są dokładnie te dane, które kolejka musi rezerwować.

### 1.2 Koszty postprocessingu też są w kodzie

```js
POST_PLATFORM_PLN: 20.0,   // obróbka jednej platformy MSLA
POST_PC_PLN: 3.0,          // obróbka jednej sztuki
HANDLING_FEE: 8.0,         // obsługa zlecenia FDM
```

To są dziś **koszty**, ale pochodzą z czasu pracy człowieka. Trzeba je rozdzielić na dwie osobne wielkości: złotówki (do wyceny) i minuty (do kolejki). Dziś minuty są ukryte wewnątrz złotówek i przez to niewidoczne dla planowania.

### 1.3 Liczenie sztuk na platformie też już istnieje

Postulat, żeby przy zamawianiu liczyć, ile sztuk wejdzie za jednym razem i w jakiej technologii, jest w kodzie zrealizowany w połowie:

```js
const MSLA_BUILD_VOL_CM = { x: 21.8, y: 12.3, z: 25.0 };   // Saturn 4 Ultra
const BUILD_VOL_CM      = { x: 30.0, y: 32.0, z: 32.5 };   // H2D

function estimatePcsPerPlateMSLA(bbox) {
  const partW = bbox.x + 0.3, partD = bbox.y + 0.3;
  if (partW > MSLA_BUILD_VOL_CM.x || partD > MSLA_BUILD_VOL_CM.y) return 1;
  return Math.max(1, Math.min(
    Math.floor(MSLA_BUILD_VOL_CM.x / partW) * Math.floor(MSLA_BUILD_VOL_CM.y / partD), 30));
}

const platesNeeded = Math.ceil(qTier.qty / (pcsPerPlate || 1));
```

Czyli z bounding boxa wgranego pliku wyliczamy już liczbę sztuk na platformie i liczbę platform, osobno dla obu technologii. **Brakuje wyłącznie przekazania tego do kolejki**, bo dziś wynik służy tylko do podziału kosztu maszyny.

Trzy rzeczy do domknięcia:

1. **Pole robocze H2D do zweryfikowania.** W kodzie jest 30,0 × 32,0 cm. Nominalne pole H2D to 35 × 32 cm przy jednej dyszy i 32,5 × 32 cm przy dwóch. Jeśli 30,0 jest świadomym marginesem na pracę dwudyszową, to w porządku, ale warto to zapisać w komentarzu, bo zaniża liczbę sztuk na platformie.
2. **Ograniczenia dwudyszowe.** Druk dwumateriałowy zmniejsza pole robocze i wydłuża czas przez wieżę czyszczącą. To osobny mnożnik czasu, którego dziś nie ma.
3. **Upakowanie liczone siatkowo.** `floor(X/w) × floor(Y/d)` to prostokątna siatka, więc dla kształtów nieregularnych zaniża upakowanie. Na starcie wystarczy, ale to kandydat do poprawy, bo każda dodatkowa sztuka na platformie skraca termin.

### 1.4 Czego nie mamy

Rejestru maszyn, kolejki, kalendarza dostępności, stanu magazynowego, historii rzeczywistych czasów wykonania.

Uwaga na marginesie: baza `filament_types` i `filament_brands` w Postgresie to **baza wiedzy o parametrach druku**, tworzona wspólnie ze społecznością. To nie jest magazyn i nie wolno tych dwóch rzeczy mieszać w jednej tabeli. Magazyn to osobny byt, który tylko wskazuje na tamtą bazę.

---

## 2. Gdzie naprawdę jest wąskie gardło

To jest sedno i miejsce, w którym większość planów przepustowości się myli.

### 2.1 Drukarka pracuje bez nadzoru, człowiek nie

Druk MSLA modelu o wysokości 5 cm przy warstwie 0,05 mm to według naszego wzoru `50 / 35 = 1,43 h`. Ale **czas druku jest niemal niezależny od liczby sztuk na platformie**, bo MSLA naświetla całą warstwę naraz. Platforma z 12 sztukami drukuje się tyle samo, co z jedną.

Za to mycie, doświetlanie, zdejmowanie z platformy i usuwanie podpór dla 12 sztuk trwa dwanaście razy dłużej niż dla jednej. Nasz własny model kosztowy to potwierdza: `POST_PC_PLN` jest naliczane od sztuki, nie od platformy.

Wniosek: **przy żywicy przepustowość ogranicza obróbka, nie druk.**

### 2.2 Przy FDM jest odwrotnie

Druk FDM trwa długo (godziny na jedną sztukę), obróbka jest krótka. Tu ograniczeniem są godziny maszynowe. Ale H2D ma jedną platformę, więc dwa równoległe zlecenia się wykluczają.

### 2.3 Konsekwencja dla modelu

Każde zlecenie musi rezerwować **dwa niezależne zasoby**:

| Zasób | Jednostka | Ograniczenie |
|---|---|---|
| Maszyna | godziny na konkretnej drukarce | 1 × H2D, 1 × Saturn 4 |
| Operator | minuty pracy człowieka | jedna osoba, godziny dzienne |

Termin realizacji to najwcześniejszy moment, w którym **oba** zasoby są wolne. Planowanie tylko po maszynach da terminy zbyt optymistyczne, planowanie tylko po człowieku zbyt pesymistyczne.

---

## 3. Jak zmierzyć realną przepustowość

Nie zgaduję tych liczb i odradzam zgadywanie. Automatyczny system terminów zbudowany na zgadniętych parametrach produkuje **pewne siebie błędne daty**, co jest gorsze niż uczciwe "3 do 5 dni roboczych".

### 3.1 Co trzeba zmierzyć

| Wielkość | Po co | Jak |
|---|---|---|
| Rzeczywisty czas druku vs czas ze slicera | Kalibracja wzoru | Bambu Studio i panel Saturna podają oba |
| Współczynnik wykorzystania maszyny | Ile ze 168 h tygodnia realnie drukuje | Log startów i stopów |
| Odsetek nieudanych druków | Rezerwa w terminach | Log zdarzeń |
| Minuty operatora na platformę i na sztukę | Rezerwacja czasu człowieka | Stoper przy obróbce, przez 4 tygodnie |
| Rzeczywiste zużycie materiału vs wyliczone | Kalibracja magazynu | Waga przed i po |

### 3.2 Metoda

Prosty log każdego zlecenia przez cztery tygodnie. Jedna tabela, kilkanaście pól, wypełniane w minutę po zakończeniu zlecenia. Po 30 do 50 zleceniach mamy rozkłady, a nie pojedyncze punkty.

Dopiero wtedy ustawiamy parametry silnika terminów.

### 3.3 Mechanizm samokalibrujący zamiast dwóch trybów

Pierwotnie proponowałem termin ręczny przez cztery tygodnie, a potem przełączenie na automat. **Wersja właściciela jest lepsza i ją przyjmuję:** jeden mechanizm od pierwszego dnia, uruchomiony z szerokim marginesem, który zwęża się w miarę napływu danych.

Zaleta jest praktyczna. Nie ma momentu przełączenia, czyli nie ma ryzyka, że automat wystartuje z parametrami, których nikt nie sprawdził w boju. System od początku liczy tak samo, zmienia się wyłącznie szerokość bufora.

**Bufor terminu**

```
promised_ship_date = computed_ready_date + buffer(n, p90, otd)
```

| Liczba zamkniętych zleceń `n` | Bufor |
|---|---|
| < 10 | +100 proc. czasu produkcji, nie mniej niż 3 dni robocze |
| 10 do 29 | p90 ze stosunku czas rzeczywisty / szacowany, nie mniej niż 2 dni |
| 30 i więcej | p90, nie mniej niż 1 dzień |

**Pętla korygująca.** Liczymy wskaźnik terminowości (odsetek zleceń wysłanych do obiecanej daty) z ostatnich 20 zleceń. Jeśli spadnie poniżej 95 procent, bufor **automatycznie się rozszerza** o jeden poziom i alarmuje. To jest zabezpieczenie przed sytuacją, w której zwężamy margines na podstawie dobrego okresu, a potem systematycznie się spóźniamy.

**Ten sam schemat dla ceny wiążącej**

```
binding_price = estimate_mid × (1 + risk_margin)
```

`risk_margin` startuje szeroko (rzędu 20 procent) i zbiega do zmierzonego p90 ze stosunku koszt rzeczywisty / szacowany. Niezależnie od tego działa próg wartości, powyżej którego zlecenie idzie do ręcznej weryfikacji, wzorem Mapi-Tech.

**Czego pilnować.** Bufor zwęża się wyłącznie na danych z tej samej kategorii zleceń. Trzydzieści udanych druków FDM nie uprawnia do zwężenia marginesu na żywicy odlewniczej, bo to inny proces i inne ryzyko. Kalibracja musi być prowadzona osobno dla FDM, MSLA standard i MSLA castable.

### 3.4 Wyliczenie sufitu na realnych danych wejściowych

Dane od właściciela: operator 40 h tygodniowo w podziale 50 procent produkcja i 50 procent reszta, docelowa stawka robocizny w okolicach 100 PLN/h, H2D pracuje w nocy bez nadzoru, 5 dni roboczych, dostawa materiałów 2 dni robocze, możliwe wsparcie drugą osobą.

**Maszyny**

- H2D, praca nocna, 5 dni: 120 h nominalnie. Po odliczeniu awarii, przerw na wymianę platformy i ogona bezczynności (druk kończy się o 3 w nocy, maszyna stoi do rana) realistycznie **około 72 h druku tygodniowo**.
- Saturn 4: druk MSLA jest krótki, wzór daje 1,4 h dla modelu 5 cm przy warstwie 0,05 mm. Ograniczeniem nie jest czas druku, tylko liczba wymian platformy, bo każda wymaga człowieka. Realistycznie **około 4 platformy dziennie, czyli 20 tygodniowo**.

**Operator: 20 h tygodniowo na produkcję (1200 minut)**

Czasy obróbki przyjęte przez właściciela, **rozdzielone na technologie**:

| Czynność | Czas | Co się na to składa |
|---|---|---|
| Obróbka sztuki FDM | **6 min** | zdjęcie z platformy, usunięcie podpór, kontrola, pakowanie |
| Obróbka sztuki MSLA, wzorzec odlewniczy (`casting`) | **5 min** | mały, rzadkie podpory |
| Obróbka sztuki MSLA, prototyp (`prototype`) | **7 min** | średnia złożoność |
| Obróbka sztuki MSLA, figurka (`figurine`) | **10 min** | duża, gęsto podparta |
| Narzut na platformę MSLA | ~25 min | spust, mycie w IPA, zdjęcie z platformy, filtrowanie żywicy |

Podział na kategorie odpowiada temu, co już mamy w `APPLICATIONS` w `Print3DCalc.jsx`, więc nie wymaga nowego wymiaru danych. Przy mieszanym obłożeniu średnia wychodzi około **7 minut na sztukę MSLA**.

Potwierdza się przypuszczenie z wersji 1.3: **wzorce odlewnicze są dwukrotnie tańsze w obróbce niż figurki**. To akurat ten segment, w którym połączenie druku z jubilerstwem daje nam największą przewagę, więc rozdzielenie kategorii poprawia rentowność dokładnie tam, gdzie chcemy rosnąć.

Rozdzielenie technologii jest istotne, bo odbudowuje różnicę, którą jedna uśredniona liczba zacierała: przy FDM praca rąk jest krótka i ograniczeniem zostaje maszyna, przy MSLA jest odwrotnie.

**MSLA: sufit liczony w sztukach**

Czas platformy z `p` sztukami: `25 + 10p` minut.

| Sztuk na platformie | Minut na platformę | Sztuk tygodniowo, gdyby cały czas szedł na MSLA |
|---|---|---|
| 1 | 35 | 34 |
| 4 | 65 | 74 |
| 8 | 105 | 91 |
| 20 | 225 | 107 |

Granica teoretyczna to `1200 / 10 = 120 sztuk`.

**Scenariusz mieszany**

| Zużycie | Rachunek | Minuty |
|---|---|---|
| FDM: 14,4 platformy po ~2 szt. = 29 szt. | 29 × 6 min | 174 |
| MSLA: 12,7 platformy po 8 szt. = 101 szt. | 101 × 7 min + 12,7 × 25 min | 1026 |
| **Razem** | **130 sztuk, ~27 zleceń** | **1200 z 1200** |

**Wynikowy sufit: około 130 sztuk i 27 zleceń tygodniowo.** Przy obłożeniu samymi wzorcami odlewniczymi (5 min) rośnie do jakichś 160 sztuk, przy samych figurkach (10 min) spada do 107.

Saturn przy 12,7 platformy tygodniowo z możliwych 20 jest wykorzystany w około 64 procentach, czyli więcej niż przy jednolitych 10 minutach, ale nadal z zapasem.

### 3.5 Wąskie gardło przesuwa się zależnie od technologii

Po rozdzieleniu czasów obraz przestaje być jednorodny i to jest praktycznie użyteczne.

| | Zasób ograniczający | Wykorzystanie maszyny |
|---|---|---|
| **FDM (H2D)** | **godziny maszyny** | ~100 proc. z 72 h dostępnych |
| **MSLA (Saturn 4)** | **minuty operatora** | ~49 proc. (9,8 z 20 możliwych platform) |

Konsekwencje, w kolejności ważności:

1. **Przy FDM druga drukarka faktycznie coś dałaby**, bo H2D pracuje na styk. Obróbka 6 minut na sztukę zajmuje tylko 174 z 1200 minut operatora, więc druga maszyna FDM miałaby kto obsłużyć.
2. **Przy MSLA druga drukarka nie dałaby nic.** Saturn stoi w połowie czasu, bo operator nie nadąża z obróbką. Tu dźwignią jest wyłącznie skrócenie 10 minut albo druga para rąk.
3. **Każda minuta ścięta z obróbki MSLA daje 120 minut tygodniowo**, czyli 12 dodatkowych sztuk. Stacja mycia i doświetlania nadal zwraca się szybciej niż sprzęt drukujący, ale argument jest teraz słabszy niż przy 15 minutach.
4. **Kolejka musi rezerwować oba zasoby**, bo żaden nie jest już oczywistą formalnością. Przy FDM wiąże maszyna, przy MSLA człowiek.

Odpowiedź na pytanie o drugą osobę: **od momentu, w którym zlecenia MSLA zaczną regularnie przekraczać 70 sztuk tygodniowo.** Wtedy zaczniemy odrzucać pracę, którą Saturn spokojnie by wykonał.

### 3.5a Termin jako obietnica, nie deklaracja marketingowa

Ustalenie właściciela, które przyjmuję jako zasadę projektową: **bufor realizacyjny zamiast ciasnej deklaracji**, ale bufor liczony na bieżąco z warunków i z pozostałych zleceń w kolejce, a nie doklejony ryczałtem.

Różnica jest zasadnicza. Ryczałtowe "3 do 5 dni" jest puste, bo nie wie nic o tym, co już stoi w kolejce. Bufor liczony ma sens tylko wtedy, gdy silnik zna aktualne obłożenie, dlatego rezerwacja minut operatora musi być zapisywana **w chwili przyjęcia zamówienia**, a nie dopiero przy rozpoczęciu produkcji.

Zamówienie jest zobowiązaniem, więc data pokazana klientowi musi wynikać z tego, co realnie da się wykonać po uwzględnieniu wszystkiego, co już przyjęliśmy.

Ponieważ operator jest wykorzystany blisko sufitu, ostrzeżenie musi przyjść **zanim** sufit zostanie osiągnięty. Stąd alarm progowy przy 80 procentach obłożenia w oknie dwutygodniowym, a przy 100 procentach automatyczne wydłużanie podawanych terminów zamiast przyjmowania zleceń, których nie ma kto zrobić.

### 3.6 Znalezisko: obróbka jest wyceniona poniżej realnego kosztu pracy

Po rozdzieleniu czasów na technologie okazuje się, że problem nie dotyczy całego kalkulatora, tylko **wyłącznie żywicy**. To ważne, bo zawęża zakres poprawki.

| Stała w kodzie | Kwota | Opłacone minuty przy 100 PLN/h | Przyjęty czas realny | Niedobór |
|---|---|---|---|---|
| `HANDLING_FEE` (FDM) | 8 PLN | 4,8 min | **6 min** | ~2 PLN, w granicach błędu |
| `POST_PC_PLN` (MSLA) | 3 PLN | 1,8 min | **10 min** | **~14 PLN na sztukę** |
| `POST_PLATFORM_PLN` (MSLA) | 20 PLN | 12 min | ~25 min | ~22 PLN na platformę |

**FDM jest wyceniony poprawnie.** Osiem złotych za sześć minut pracy przy stawce 100 PLN/h to niedobór rzędu dwóch złotych, czyli mniej niż niepewność samego szacunku. Tu nie ma czego naprawiać.

**MSLA jest niedoszacowany pięciokrotnie na sztuce.**

Przykład na platformie z ośmioma sztukami:

- kalkulator liczy `20 + 8 × 3 = 44 PLN` obróbki
- realna praca to `25 + 8 × 10 = 105 minut`, czyli przy 100 PLN/h **175 PLN**
- różnica: **około 130 PLN na jednej platformie**

Skala jest mniejsza niż przy 15 minutach (było 200 PLN), ale nadal przewyższa całą marżę warsztatową na takim zleceniu. Dopóki wycena jest orientacyjna, wychodzi to w negocjacji. Przy cenie wiążącej w sklepie każde wielosztukowe zamówienie z żywicy jest stratne, a to są dokładnie te zamówienia, które sklep przyciąga najlepiej.

Próg `MIN_ORDER_PLN` (49 PLN) chroni zamówienia jednosztukowe. **Nie chroni wielosztukowych**, bo tam cena rośnie liniowo z ilości, a koszt pracy rośnie szybciej.

**Wartości docelowe, zatwierdzone, rozbite na kategorie**

Skoro czasy obróbki różnią się per kategoria, płaska stawka 17 PLN byłaby błędem w drugą stronę: przepłacalibyśmy za wzorce odlewnicze. Stąd:

| Kategoria | Czas | `POST_PC_PLN` docelowe |
|---|---|---|
| `casting` (wzorzec odlewniczy) | 5 min | **8 PLN** |
| `prototype` | 7 min | **12 PLN** |
| `figurine` | 10 min | **17 PLN** |

`POST_PLATFORM_PLN`: **42 PLN** (25 min), wspólne dla wszystkich kategorii.

To jest ulepszenie względem zatwierdzonej płaskiej stawki 17 PLN. Wzorce odlewnicze dla jubilerstwa, czyli nasz najmocniejszy segment, drożeją o 5 PLN zamiast o 14, a figurki płacą tyle, ile realnie kosztują.

`HANDLING_FEE` dla FDM zostaje bez zmian (8 PLN).

### 3.6a Rabat seryjny działa w odwrotną stronę, niż zakłada

To jest konsekwencja, którą trzeba nazwać osobno, bo siedzi w `QUANTITY_TIERS`.

```js
{ id: "micro",  qty: 6,  discount: 0.05 },
{ id: "small",  qty: 15, discount: 0.10 },
{ id: "medium", qty: 35, discount: 0.15 },
```

Rabat ilościowy zakłada, że przy większej serii koszt jednostkowy spada. **To prawda dla maszyny i częściowo dla materiału. Dla pracy rąk nie jest prawdą w ogóle.** Każda kolejna sztuka to te same 10 minut przy żywicy albo 6 minut przy FDM.

Efekt: przy 35 sztukach udzielamy 15 procent rabatu na koszt, którego znaczna część w ogóle nie maleje. Przy MSLA pogłębia to stratę z rozdziału 3.6 dokładnie tam, gdzie jest ona największa. Przy FDM rabat jest mniej szkodliwy, bo tam robocizna to niewielka część ceny, ale logika pozostaje ta sama.

### 3.6b Możliwe reakcje

1. **Podnieść `POST_PC_PLN` do 17 PLN i `POST_PLATFORM_PLN` do 42 PLN.** Uczciwe wobec kosztu, podnosi cenę figurki o jakieś 16 PLN na sztuce. Przy obecnym progu 49 PLN na zamówienie to zmiana odczuwalna, ale nie wypychająca z rynku.
2. **Rozdzielić rabat na dwie składowe:** rabat ilościowy stosowany wyłącznie do kosztu maszyny i materiału, robocizna liczona liniowo bez rabatu. Technicznie to jedna zmiana w `applyPricing`.
3. **Skrócić 10 minut obróbki MSLA.** Stacja mycia i doświetlania, lepsze ustawienia podpór, szlifierka wibracyjna. Każda minuta to 120 minut tygodniowo, czyli 12 dodatkowych sztuk.
4. **Świadomie ograniczyć ofertę zamówień wielosztukowych z żywicy**, albo wycenić je z jawną informacją, że obróbka jest ręczna.

Rekomendacja: **punkty 1 i 2 razem, przed uruchomieniem cen wiążących.** Punkt 2 to błąd logiczny, nie decyzja cenowa. Punkt 1 bez punktu 2 podniesie ceny, a rabat i tak zje część korekty. Punkt 3 jako priorytet inwestycyjny, bo poprawia jednocześnie marżę i przepustowość. Punkt 4 tylko wtedy, gdy po pomiarze okaże się, że korekta cen nie wystarcza.

FDM zostawiamy bez zmian poza rozdzieleniem rabatu.

**Zastrzeżenie do liczb 6 i 10 minut.** To średnie podane przez właściciela i uznaję je za punkt wyjścia, ale przy żywicy rozpiętość jest duża: wzorzec odlewniczy dla jubilerstwa (mały, mało podpór) i figurka kolekcjonerska (duża, gęsto podparta) to inne procesy. Skoro ta liczba rozstrzyga i sufit, i rentowność, **warto mierzyć ją osobno dla kategorii, które już mamy w `APPLICATIONS`**: prototyp, figurka, wzorzec odlewniczy. Podejrzewam, że wzorce jubilerskie schodzą poniżej 10 minut, co poprawiłoby rentowność akurat tego segmentu, w którym mamy największą przewagę.

---

## 4. Model danych

### 4.1 Maszyny i kalendarz

```
machines
  id, name, kind ('fdm'|'msla'|'co2'|'fiber')
  build_x_mm, build_y_mm, build_z_mm
  daily_hours          -- realne godziny pracy na dobę
  utilization          -- współczynnik z pomiaru, np. 0.60
  is_active

capacity_blackouts
  id, machine_id (NULL = wszystkie), date_from, date_to, reason
  -- urlop, awaria, przegląd, święta
```

`capacity_blackouts` to nie jest ozdobnik. Warsztat jednoosobowy musi umieć **zamknąć kolejkę**, a kreator musi to natychmiast odzwierciedlić w podawanych terminach.

### 4.2 Kolejka

```
production_jobs
  id, order_id, machine_kind, machine_id
  est_machine_h        -- z kalkulatora
  est_operator_min     -- z kalkulatora, po rozdzieleniu od złotówek
  actual_machine_h, actual_operator_min, failed BOOLEAN   -- uzupełniane po fakcie
  material_kind ('filament'|'resin'), material_item_id, est_grams
  planned_start, planned_end
  promised_ship_date   -- to, co obiecaliśmy klientowi, niezmienne
  status ('reserved'|'queued'|'printing'|'post'|'done'|'shipped'|'cancelled')
```

Rozdzielenie `planned_*` od `promised_ship_date` jest celowe. Plan wewnętrzny może się przesuwać, obietnica dana klientowi nie. Różnica między nimi to nasz bufor i warto ją mierzyć.

Pola `actual_*` zamykają pętlę: to z nich bierze się kalibracja z rozdziału 3.

### 4.3 Magazyn

```
inventory_items
  id, kind ('filament'|'resin')
  filament_brand_id  -- FK do istniejącej bazy wiedzy
  resin_id           -- FK do src/data/resins.js
  color, package_size_g
  qty_on_hand_g
  qty_reserved_g
  reorder_point_g
  supplier, supplier_lead_days
  price_per_kg, last_restock_at

inventory_moves           -- księga, tylko dopisywanie
  id, item_id, job_id, delta_g
  reason ('reserve'|'release'|'consume'|'restock'|'waste'|'stocktake')
  created_at, note
```

### 4.4 Projektowanie pod szeroką bazę materiałów

Właściciel trzyma dziś kilkanaście pozycji, ale chce projektować pod bazę znacznie szerszą. To zmienia dwie rzeczy.

**Dostawa 2 dni robocze wywraca problem magazynu do góry nogami.** Przy tak krótkim czasie dostawy **szerokość oferty przestaje zależeć od tego, co leży na półce**. Możemy pokazywać w kreatorze bardzo szeroki katalog materiałów i uczciwie oznaczać: część "od ręki", resztę "plus 2 dni robocze". Magazynujemy tylko to, co się kręci, a nie wszystko, co oferujemy.

To jest realna przewaga nad warsztatem, który ogranicza wybór do własnej półki, i kosztuje nas tylko dyscyplinę w oznaczaniu dostępności.

**Wprowadzanie danych staje się głównym ryzykiem.** Przy kilkunastu pozycjach ręczne odejmowanie gramów jest do zniesienia. Przy stu pozycjach (typ × marka × kolor) nikt tego nie utrzyma i magazyn umrze śmiercią naturalną. Trzy sposoby, żeby temu zapobiec, w kolejności opłacalności:

1. **Automatyczne odejmowanie z szacunku zlecenia.** Zlecenie zna gramaturę, więc po zakończeniu odejmuje ją samo. Zero pracy ręcznej, kosztem dryfu, który koryguje okresowa inwentaryzacja.
2. **AMS i RFID w Bambu Lab. Sprawdzone, jest wykonalne.** Drukarki Bambu wystawiają lokalnego brokera MQTT na porcie 8883 (użytkownik `bblp`, hasło z panelu drukarki), a AMS raportuje przez niego, jaka szpula jest założona i ile filamentu zostało. Istnieją gotowe integracje robiące dokładnie to, czego potrzebujemy: `bambulab-ams-spoolman-filamentstatus` nasłuchuje MQTT i automatycznie odejmuje zużycie w Spoolmanie, czyli otwartoźródłowym magazynie szpul. Sterowanie drukarką wymaga trybu LAN i trybu deweloperskiego, ale samo **czytanie danych przez MQTT tego nie wymaga**.

   Dwa zastrzeżenia. Po pierwsze, AMS **szacuje** pozostały filament z liczby obrotów szpuli odniesionej do znanej geometrii szpul Bambu, więc dla szpul innych producentów jest to przybliżenie. Po drugie, to dotyczy wyłącznie FDM. Dla żywicy odpowiednika nie ma.

   Wniosek: MQTT z H2D nadaje się jako **kontrola krzyżowa** dla filamentów, a nie jako jedyne źródło prawdy. Zestawienie odczytu z AMS z naszym odejmowaniem z szacunku zlecenia da nam przy okazji darmową kalibrację modelu zużycia.

3. **Kod QR na szpuli i butelce**, skanowany przy zakładaniu. Tanie, działa dla materiałów spoza Bambu i dla żywic.

Realistycznie: punkt 1 od razu, punkt 3 dla żywic (tam zużycie jest najmniej przewidywalne i nie ma automatyki), punkt 2 jako kontrola krzyżowa dla FDM w drugiej kolejności.

**Rozdział katalogu od magazynu.** Przy szerokiej bazie tym bardziej trzeba trzymać osobno:

- **katalog oferowany** - co klient może wybrać w kreatorze (szeroki, oparty o `filament_types` i `resins.js`)
- **magazyn** - co fizycznie mamy (wąski, `inventory_items`)

Pozycja w magazynie wskazuje na pozycję w katalogu, nigdy odwrotnie. Materiał bez wpisu magazynowego jest po prostu oznaczony jako "plus 2 dni robocze", a nie znika z oferty.

**Dlaczego księga, a nie sam licznik.** Licznik stanu magazynowego w warsztacie rozjeżdża się z rzeczywistością w kilka tygodni, bo zawsze jest jakiś nieudany druk, resztka na dnie butelki albo szpula zważona na oko. Księga pozwala odtworzyć, skąd wzięła się różnica, i skorygować ją wpisem `stocktake` zamiast nadpisywać liczbę. Bez tego magazyn po miesiącu przestaje być wiarygodny, a wtedy przestaje być używany.

Dostępność liczymy jako `qty_on_hand_g - qty_reserved_g`, nigdy jako sam stan.

---

## 5. Algorytm obietnicy terminu

Wejście: rodzaj maszyny, `est_machine_h`, `est_operator_min`, materiał, gramatura, ilość.

1. **Sprawdź materiał.** Jeśli `dostępne >= potrzebne`, materiał gotowy dziś. Jeśli nie, najwcześniejszy start to dziś plus `supplier_lead_days`.
2. **Znajdź pierwsze okno maszyny** o długości `est_machine_h`, nie wcześniej niż z punktu 1, z pominięciem `capacity_blackouts`.
3. **Znajdź okno operatora** o długości `est_operator_min`, nie wcześniej niż koniec druku.
4. **Dodaj bufor ryzyka** wynikający ze zmierzonego odsetka nieudanych druków.
5. **Dodaj czas wysyłki** (Paczkomat, kurier).
6. **Zaokrąglij w górę do dnia roboczego.**

Wynik pokazujemy klientowi jako **konkretną datę**, nie widełki: "Wysyłka do 5 sierpnia".

To jest realna przewaga nad Mapi-Tech i resztą stawki, którzy podają sztywne "3 do 5 dni roboczych" niezależnie od tego, co akurat mają w kolejce. Data zależna od rzeczywistego obłożenia jest uczciwiejsza i buduje zaufanie, pod warunkiem że jest dotrzymywana.

### 5.1 Rezerwacja i jej wygasanie

Przy przejściu do płatności rezerwujemy okno i materiał ze znacznikiem czasu. **Rezerwacja musi wygasać**, na przykład po 30 minutach, jeśli płatność nie dojdzie do skutku. Bez tego porzucone koszyki zjedzą kalendarz i sklep zacznie podawać terminy odległe bez powodu.

Zwolnienie rezerwacji to wpis `release` w księdze, nie usunięcie wiersza.

### 5.2 Gdy plan się sypie

Awaria drukarki przesuwa całą kolejkę. System musi umieć:

- wykryć, które zlecenia stracą `promised_ship_date`
- wygenerować listę klientów do powiadomienia
- zaproponować nową datę

Powiadomienie o opóźnieniu wysłane samemu, zanim klient zapyta, kosztuje mniej niż jedna reklamacja.

---

## 6. Magazyn w kreatorze: co widzi klient

Trzy stany, każdy z inną komunikacją:

| Stan | Komunikat | Efekt |
|---|---|---|
| Materiał na stanie | "Dostępny od ręki" | Najkrótszy termin |
| Brak, ale dostawa znana | "Na zamówienie, wysyłka do 12 sierpnia" | Termin wydłużony o `supplier_lead_days` |
| Brak i brak dostawcy | Materiał niedostępny w wyborze | Nie da się zamówić |

### 6.1 Podpowiedź zamiennika

Jeśli wybrany materiał wymaga oczekiwania, a mamy na stanie inny o zbliżonych właściwościach, kreator proponuje:

> "PA6-CF czarny: wysyłka do 12 sierpnia. Mamy natomiast PETG czarny od ręki, wysyłka do 4 sierpnia. Do tego zastosowania sprawdzi się równie dobrze."

To zamienia porzucone zamówienie w zrealizowane. Podstawa do porównania materiałów już istnieje w bazie `filament_types` (kategoria, odporność termiczna, właściwości), więc nie trzeba jej budować od zera.

Ostrożnie z jednym: podpowiedź musi być **techniczna, a nie sprzedażowa**. Zaproponowanie gorszego materiału tylko dlatego, że leży na półce, wróci jako reklamacja.

---

## 7. Etapy wdrożenia

Kolejność zmieniona względem wersji 1.0, zgodnie z ustaleniem, że mechanizm ma działać od początku i korygować się w trakcie.

### Etap 1: silnik terminów z szerokim buforem plus log

Tabele `machines`, `production_jobs`, `capacity_blackouts`. Silnik z rozdziału 5 liczy datę od pierwszego dnia, ale z buforem +100 procent i minimum 3 dni roboczych. Równolegle każde zlecenie zapisuje `est_*`, a panel pozwala dopisać `actual_*` w minutę po zakończeniu.

Efekt: klient od razu widzi konkretną datę, my od razu zbieramy dane do zwężania.

### Etap 2: magazyn z automatycznym odejmowaniem

`inventory_items` i `inventory_moves`. Odejmowanie z szacunku zlecenia, inwentaryzacja korygująca. Statusy "od ręki" i "plus 2 dni robocze" w kreatorze.

### Etap 3: pętla kalibrująca

Automatyczne zwężanie bufora według progów `n`, wskaźnik terminowości, alarm i automatyczne rozszerzenie przy spadku poniżej 95 procent. Osobne serie dla FDM, MSLA standard i MSLA castable.

### Etap 4: zwężenie pasa cenowego

Zamiana `-30 / +40 procent` na cenę wiążącą z marginesem ryzyka wyliczonym z tych samych danych. Próg ręcznej weryfikacji dla wartości odstających.

### Etap 5: zamówienia do dostawców i integracje

Automatyczna lista braków na podstawie `reorder_point_g` i rezerwacji. Do zbadania: odczyt zużycia filamentu z AMS w H2D, kody QR dla żywic.

---

## 8. Ryzyka

| Ryzyko | Skutek | Ograniczenie |
|---|---|---|
| Terminy z parametrów zgadywanych | Systematyczne opóźnienia, utrata zaufania | Etap 1 przed etapem 3, bezwarunkowo |
| Planowanie tylko po maszynach | Kolejka wygląda na wolną, człowiek nie wyrabia | Rezerwacja obu zasobów |
| Rozjazd stanu magazynowego | Magazyn przestaje być używany | Księga ruchów plus okresowy `stocktake` |
| Rezerwacje z porzuconych koszyków | Sztucznie odległe terminy | Wygasanie rezerwacji |
| Jedna maszyna na technologię | Awaria zatrzymuje wszystko | Bufor w terminach, procedura powiadamiania |
| Urlop lub choroba jednej osoby | Zlecenia bez wykonawcy | `capacity_blackouts` respektowane przez kreator |
| Zbyt szeroki pas tolerancji w wycenie studia | Cena wiążąca oparta na `-30 / +40 procent` jest ryzykowna | Zawężenie po kalibracji na rzeczywistych zleceniach z wgranym plikiem |

Ostatni wiersz wymaga komentarza. W `calcShared.jsx` mamy dziś `TOLERANCE_LOW: 0.30` i `TOLERANCE_HIGH: 0.40`, czyli pas znacznie szerszy niż w biżuterii (15 i 12 procent). Przy wycenie z presetu rozmiaru to uzasadnione, bo geometria jest nieznana. Przy wgranym pliku objętość i wysokość są znane, więc pas powinien się mocno zawęzić. **Ale tego trzeba dowieść pomiarem**, zanim zamienimy widełki na cenę wiążącą. To jest ta sama zależność co przy terminach: najpierw dane, potem automatyzacja.

---

## 9. Ustalenia i to, co zostało otwarte

### 9.1 Ustalone

| Parametr | Wartość | Konsekwencja |
|---|---|---|
| Czas operatora | 40 h tygodniowo, podział 50 na 50 | 20 h na produkcję, czyli 1200 minut |
| Wsparcie | Możliwa druga osoba | Potrzebna od około 50 sztuk tygodniowo, nie dopiero przy suficie |
| Stawka robocizny | Około 100 PLN/h | Ujawnia niedoszacowanie obróbki, rozdz. 3.6 |
| **Obróbka sztuki FDM** | **6 min** | Wycena `HANDLING_FEE` poprawna, ograniczeniem zostaje maszyna |
| **Obróbka sztuki MSLA** | **10 min** | `POST_PC_PLN` niedoszacowany pięciokrotnie, ograniczeniem zostaje operator |
| Praca nocna H2D | Tak, standardowo | Około 72 h druku FDM tygodniowo, wykorzystane w całości |
| Platformy MSLA dziennie | 4 | Możliwe 20 tygodniowo, operator obsłuży ~9,8 |
| Dni robocze | 5 | Sufit ~107 sztuk i ~24 zlecenia tygodniowo |
| Sztuk na platformie | Liczone z bounding boxa przy zamówieniu | Mechanizm już w kodzie, rozdz. 1.3 |
| Charakter terminu | Bufor liczony z obłożenia, nie ryczałt | Rezerwacja minut przy przyjęciu zamówienia, rozdz. 3.5a |
| Baza materiałów | Dziś kilkanaście pozycji, projektujemy pod szeroką | Rozdział katalogu od magazynu, automatyczne odejmowanie |
| Dostawa od dostawcy | 2 dni robocze | Szeroka oferta bez szerokiego magazynu |
| Odczyt z AMS | Technicznie dostępny przez lokalne MQTT | Kontrola krzyżowa dla FDM, rozdz. 4.4 |
| Tryb uruchomienia | Mechanizm od początku, szeroki bufor, korekta w trakcie | Brak momentu przełączenia, jedna ścieżka kodu |

### 9.2 Zatwierdzone decyzje cenowe i sprzętowe

| Decyzja | Stan |
|---|---|
| Czasy obróbki MSLA per kategoria: 5 / 7 / 10 min | Zatwierdzone |
| `POST_PC_PLN` per kategoria: 8 / 12 / 17 PLN | Wynika z powyższego, ulepszenie płaskiej stawki 17 PLN |
| `POST_PLATFORM_PLN` 42 PLN | Zatwierdzone |
| Rozdzielenie rabatu (ilościowy tylko na maszynę i materiał) | Zatwierdzone |
| Inwestycja w skrócenie obróbki MSLA | Zatwierdzona |
| Druga drukarka FDM | Odłożona do wzrostu zleceń, w razie potrzeby podzlecanie druku |

### 9.3 Zmiana priorytetu: problemem nie jest podaż, tylko popyt

Ustalenie właściciela z 2026-07-28, nadrzędne wobec całego tego dokumentu:

> "cały czas jednak na obecną chwilę drukarki stoją bezczynnie bo nie ma zleceń na wydruki i to na obecną chwilę trzeba zmienić"

To ustawia cały system przepustowości we właściwym miejscu. Sufit 130 sztuk tygodniowo jest nieistotny, dopóki realne obłożenie wynosi ułamek tej liczby. Możliwość podzlecania druku dodatkowo zdejmuje presję z podaży.

**Konsekwencja dla kolejności prac:**

- Z tego dokumentu wdrażamy **wyłącznie minimum potrzebne sklepowi**: wyliczenie daty wysyłki z szerokim buforem i zapis `est_*` do późniejszej kalibracji. To jest kilka tabel i jeden endpoint.
- Pełny magazyn, pętla kalibrująca, rezerwacje z wygasaniem, integracja z AMS i alarmy obłożenia **czekają na wolumen**. Budowanie ich teraz to optymalizacja problemu, którego nie mamy.
- Poprawki cenowe z rozdziału 3.6 wdrażamy mimo to, bo są tanie i muszą być gotowe przed pierwszą ceną wiążącą, a nie po niej.

Analiza samego problemu popytu wykracza poza zakres tego dokumentu i jest prowadzona osobno. To jedyne miejsce, gdzie sprzęt faktycznie podniósłby przepustowość.
4. **Pole robocze H2D w kodzie: 30,0 × 32,0 cm.** Czy to świadomy margines na pracę dwudyszową, czy wartość do poprawienia.
5. **Mnożnik czasu dla druku dwumateriałowego.** Wieża czyszcząca potrafi wydłużyć druk znacząco, a dziś w modelu tego nie ma.

---

*Dokument roboczy. Nie modyfikuje kodu produkcyjnego.*
