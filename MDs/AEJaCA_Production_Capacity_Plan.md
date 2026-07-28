# AEJaCA - Przepustowość, kolejka produkcyjna i magazyn materiałów

*Wersja robocza 1.2 | 2026-07-28 | branch `claude/shop-plan` | dokument towarzyszący `AEJaCA_Shop_Plan.md`, rozdz. 10*

*Zmiany w 1.1: wyliczenie sufitu na realnych danych (3.4), mechanizm samokalibrujący zamiast dwóch trybów (3.3), projektowanie pod szeroką bazę materiałów (4.4), zmieniona kolejność etapów (7), ustalenia i pytania otwarte (9).*

*Zmiany w 1.2: przeliczenie sufitu przy stawce 100 PLN/h, podziale czasu 50 na 50 i 5 dniach roboczych (3.4), znalezisko o niedoszacowaniu kosztu obróbki (3.6), potwierdzona wykonalność odczytu zużycia filamentu z AMS przez MQTT (4.4).*

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

### 1.3 Czego nie mamy

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

Przyjmuję czasy realistyczne, a nie te wynikające z obecnych stawek w kalkulatorze. Powód w rozdziale 3.6.

| Czynność | Czas | Co się na to składa |
|---|---|---|
| Obróbka platformy MSLA | ~25 min | spust, mycie w IPA, zdjęcie z platformy, filtrowanie żywicy, czyszczenie |
| Obróbka sztuki MSLA | ~3 min | usunięcie podpór, kontrola, doczyszczenie |
| Obsługa zlecenia FDM | ~12 min | zdjęcie z platformy, oczyszczenie, kontrola, pakowanie |

| Zużycie | Rachunek | Minuty |
|---|---|---|
| Obsługa zleceń FDM | 72 h ÷ 5 h średnio = 14 zleceń × 12 min | 168 |
| Obróbka MSLA | 20 platform × (25 min + 8 szt. × 3 min = 49 min) | 980 |
| **Razem** | | **1148 z 1200** |

**Wynikowy sufit przepustowości**

- FDM: około **14 zleceń tygodniowo**, ograniczenie stawiają godziny maszyny
- MSLA: około **20 platform tygodniowo**, ograniczenie stawiają wymiany platformy i obróbka
- Razem rzędu **34 zlecenia tygodniowo**, czyli około 7 dziennie

**Operator jest wykorzystany w 96 procentach.** To jest istotna zmiana względem wersji 1.1, gdzie przy 30 h produkcji zostawał spory zapas. Przy podziale 50 na 50 zapasu praktycznie nie ma, więc **druga osoba staje się potrzebna dokładnie w momencie osiągnięcia sufitu**, a nie długo po nim.

Gdyby popyt rósł szybciej, najtańszym ruchem nie jest kolejna drukarka, tylko pomoc przy obróbce żywicy albo przesunięcie proporcji 50 na 50. Tam siedzi 980 z 1148 minut, czyli 85 procent całego czasu produkcyjnego.

### 3.5 Wniosek, który zmienia priorytet całego systemu

Sufit wychodzi wyraźnie wyżej, niż zakładałem, i **wyżej niż realny popyt nowego sklepu w pierwszych miesiącach**. Praca nocna H2D robi tu największą różnicę: podwaja dostępne godziny maszynowe i przesuwa ograniczenie z drukarki na obróbkę żywicy.

To znaczy, że w krótkim terminie **kolejka nie jest narzędziem do racjonowania, tylko do trafnego obiecywania dat**. Nie budujemy jej po to, żeby odmawiać zamówień, tylko po to, żeby data na stronie odpowiadała rzeczywistości.

Zmienia to kolejność ważności funkcji: rezerwacja zasobów i twarde limity są mniej pilne, a kalibracja i uczciwość terminu są pilne od pierwszego dnia.

Sufit staje się istotny przy około 34 zleceniach tygodniowo. Wtedy pierwszą rzeczą, która pęknie, będzie obróbka żywicy, i to jest moment na pomoc operatorską, o której wspominasz. Ponieważ operator jest wtedy wykorzystany w 96 procentach, ostrzeżenie musi przyjść **zanim** sufit zostanie osiągnięty, a nie w chwili osiągnięcia. Stąd w kolejce potrzebny jest alarm progowy, na przykład przy 80 procentach obłożenia w oknie dwutygodniowym.

### 3.6 Znalezisko: obróbka jest wyceniona poniżej realnego kosztu pracy

Przy stawce 100 PLN/h obecne stałe w kalkulatorze przekładają się na czasy, które są nierealnie krótkie.

| Stała w kodzie | Kwota | Opłacone minuty przy 100 PLN/h | Realny czas (szacunek) | Niedobór |
|---|---|---|---|---|
| `POST_PLATFORM_PLN` | 20 PLN | 12 min | ~25 min | ~13 PLN |
| `POST_PC_PLN` | 3 PLN | 1,8 min | ~3 min | ~2 PLN |
| `HANDLING_FEE` | 8 PLN | 4,8 min | ~12 min | ~12 PLN |

Na typowej platformie MSLA z ośmioma sztukami: kalkulator liczy 20 + 8 × 3 = **44 PLN**, a realny koszt pracy przy 100 PLN/h to 49 minut, czyli **82 PLN**. Różnica około 38 PLN na platformie.

Konsekwencja jest poważniejsza, niż wygląda. Dopóki wycena jest orientacyjna, niedoszacowanie robocizny wychodzi w praniu przy negocjacji. **Przy cenie wiążącej w sklepie zamienia się w systematyczną stratę na zleceniach pracochłonnych**, i to tym większą, im więcej drobnych sztuk na platformie.

Trzy możliwe reakcje:

1. **Podnieść stałe do realnych czasów.** Uczciwe wobec kosztu, ale podnosi cenę drobnych serii żywicznych o kilkadziesiąt procent.
2. **Zaakceptować niższą efektywną stawkę na obróbce**, traktując ją jako świadomą inwestycję w konkurencyjność wejścia. Wymaga jednak, żeby to była decyzja, a nie przypadek.
3. **Zmienić strukturę ceny**: niższa stawka za sztukę, wyższa opłata wejściowa za zlecenie. Odzwierciedla to, że koszt stały platformy jest niezależny od liczby sztuk.

Rekomendacja: wariant 3 dla żywicy, bo najlepiej opisuje rzeczywistą strukturę kosztu, plus podniesienie `HANDLING_FEE` dla FDM, gdzie niedobór jest największy proporcjonalnie (8 PLN wobec 20 PLN realnego kosztu).

**Wszystkie te liczby czekają na pomiar.** Moje szacunki 25, 3 i 12 minut to punkt wyjścia do stopera, a nie ustalenie. Ale kierunek rozbieżności jest na tyle wyraźny, że warto to sprawdzić przed uruchomieniem cen wiążących, a nie po.

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
| Czas operatora | 40 h tygodniowo, podział 50 na 50 | 20 h na produkcję, wykorzystane w 96 procentach przy suficie |
| Wsparcie | Możliwa druga osoba | Potrzebna w momencie osiągnięcia sufitu, nie później |
| Stawka robocizny | Około 100 PLN/h | Ujawnia niedoszacowanie obróbki w kalkulatorze, rozdz. 3.6 |
| Praca nocna H2D | Tak, standardowo | Około 72 h druku FDM tygodniowo |
| Dni robocze | 5 | Sufit około 34 zlecenia tygodniowo |
| Baza materiałów | Dziś kilkanaście pozycji, projektujemy pod szeroką | Rozdział katalogu od magazynu, automatyczne odejmowanie |
| Dostawa od dostawcy | 2 dni robocze | Szeroka oferta bez szerokiego magazynu |
| Odczyt z AMS | Technicznie dostępny przez lokalne MQTT | Kontrola krzyżowa dla FDM, rozdz. 4.4 |
| Tryb uruchomienia | Mechanizm od początku, szeroki bufor, korekta w trakcie | Brak momentu przełączenia, jedna ścieżka kodu |

### 9.2 Otwarte

1. **Ile realnie sztuk mieści się na typowej platformie MSLA.** Przyjąłem 8 jako średnią. Ta liczba wpływa wprost na minuty obróbki, a przez nie na cały sufit MSLA. Zależy od tego, co klienci zamówią, więc realnie ustali ją dopiero pomiar na pierwszych zleceniach.
2. **Rzeczywiste czasy obróbki:** 25 min na platformę, 3 min na sztukę, 12 min na zlecenie FDM. Mój szacunek, punkt wyjścia do stopera. Rozstrzyga zarówno sufit, jak i wycenę z rozdziału 3.6.
3. **Która z trzech reakcji na niedoszacowanie obróbki** (rozdz. 3.6). Rekomenduję wariant 3, ale to decyzja cenowa, nie techniczna.
4. **Ile realnie platform MSLA da się przerobić dziennie.** Przyjąłem 4. Przy pracy nocnej Saturna może być więcej, ale wymiany i tak wymagają człowieka.

---

*Dokument roboczy. Nie modyfikuje kodu produkcyjnego.*
