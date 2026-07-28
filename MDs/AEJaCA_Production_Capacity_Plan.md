# AEJaCA - Przepustowość, kolejka produkcyjna i magazyn materiałów

*Wersja robocza 1.0 | 2026-07-28 | branch `claude/shop-plan` | dokument towarzyszący `AEJaCA_Shop_Plan.md`, rozdz. 10*

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

### 3.3 Co robić w międzyczasie

Sklep nie musi na to czekać. Startujemy z **ręcznie ustawionym, konserwatywnym terminem** (na przykład 5 do 7 dni roboczych), logujemy dane od pierwszego zamówienia, i przełączamy na terminy wyliczane automatycznie dopiero wtedy, gdy dane to uzasadnią.

To jest ważne: pomiar nie blokuje uruchomienia sklepu, tylko blokuje **automatyzację terminów**.

### 3.4 Liczby poglądowe, do zastąpienia pomiarem

Żeby pokazać rząd wielkości, nie żeby na nich planować:

- H2D przy 16 h dziennie przez 6 dni to 96 h tygodniowo nominalnie; przy realistycznym wykorzystaniu 60 procent zostaje około 58 h druku tygodniowo
- Saturn 4 przy 2 do 3 platformach dziennie to około 15 platform tygodniowo, przy czym limit stawia obróbka, nie druk
- Jedna osoba przy 4 h dziennie na samą produkcję to około 20 h operatora tygodniowo

**Te trzy liczby są zmyślone.** Wpisuję je tylko po to, żeby pokazać, że to operator (20 h) jest ciaśniejszy niż maszyny, a nie odwrotnie.

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

### Etap 1: log i pomiar (bez kodu na stronie)

Tabele `production_jobs` i `inventory_moves` plus prosty panel do wpisywania rzeczywistych czasów i zużycia. Cztery tygodnie zbierania danych. Sklep w tym czasie podaje termin konserwatywny, ustawiony ręcznie.

### Etap 2: magazyn

`inventory_items` z realnym stanem, rezerwacje przy zamówieniu, statusy dostępności w kreatorze. To można wdrożyć **przed** automatycznymi terminami, bo informacja "mamy na stanie" jest wartościowa nawet przy ręcznym terminie.

### Etap 3: kolejka i automatyczne terminy

Silnik z rozdziału 5, uruchomiony na parametrach z pomiaru. Przełączenie z terminu ręcznego na wyliczany.

### Etap 4: kalibracja ciągła

Porównywanie `est_*` z `actual_*`, automatyczne korygowanie współczynników. Alarm, gdy odchylenie rośnie.

### Etap 5: zamówienia do dostawców

Automatyczna lista braków na podstawie `reorder_point_g` i rezerwacji w kolejce.

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

## 9. Co wymaga Twojej decyzji

1. **Ile godzin dziennie realnie poświęcasz na samą produkcję?** To jest liczba, która ustawia sufit całego systemu, i podejrzewam, że jest ciaśniejsza niż godziny maszynowe.
2. **Czy H2D pracuje w nocy bez nadzoru?** Zmienia dostępne godziny maszynowe o współczynnik dwa.
3. **Ile pozycji materiałowych realnie trzymasz na stanie?** Jeśli to kilkanaście, magazyn jest prosty. Jeśli kilkadziesiąt kolorów, potrzebna jest inna ergonomia wprowadzania danych.
4. **Jakie masz realne czasy dostawy filamentów i żywic od dostawców?** To wprost wchodzi do obiecywanych terminów.
5. **Czy zgadzasz się na cztery tygodnie pomiaru przed automatycznymi terminami?** Alternatywa to szybszy start z ryzykiem obiecywania dat, których nie dowozimy.

---

*Dokument roboczy. Nie modyfikuje kodu produkcyjnego.*
