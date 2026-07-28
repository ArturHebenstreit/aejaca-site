# AEJaCA - Plan sklepu internetowego

*Wersja robocza 1.1 | 2026-07-28 | branch `claude/shop-plan` | nic nie jest jeszcze implementowane*

*Zmiany w 1.1: analiza Mapi-Tech (rozdz. 2.3), korekta oceny konkurencji (2.4), rozdzielenie decyzji o platformie (5.3), zamiana kolejności Fazy 1 i 2 (rozdz. 9).*

---

## 0. Streszczenie dla niecierpliwych

Nie potrzebujemy "sklepu internetowego" w klasycznym sensie. Potrzebujemy **trzech różnych mechanizmów sprzedaży pod jednym dachem**, bo sprzedajemy trzy zupełnie różne rzeczy:

| Co sprzedajemy | Czy da się podać cenę wiążącą? | Mechanizm |
|---|---|---|
| Gotowe wyroby (portfolio, powtarzalne) | Tak, z góry | Zwykły katalog + koszyk |
| Usługa z pliku klienta (druk 3D, laser) | **Tak, wyliczalna z geometrii** | Kreator z wyceną wiążącą |
| Biżuteria na zamówienie | Nie przed projektem | Kreator + płatna zaliczka projektowa |

Największa wartość i największa przewaga konkurencyjna leży w środkowym wierszu. Mamy już silniki wyceny, których nie ma żaden lokalny konkurent. Problem w tym, że dziś zwracają **widełki**, a sklep wymaga **liczby**.

Rekomendacja startowa: **zacząć od środkowego wiersza**, nie od katalogu. Zamówienie z pliku nie ma koszyka, stanu magazynowego ani prawa zwrotu, więc da się je uruchomić na samym Stripe, bez wdrażania platformy sklepowej. Katalog i biżuteria autorska dochodzą później.

Kolejność: usługa z pliku → wyroby gotowe → biżuteria autorska. Nie wszystko naraz.

---

## 1. Punkt wyjścia: co już mamy

Audyt repozytorium na commicie `51b5615`. To jest mocniejszy fundament, niż wygląda z zewnątrz.

### 1.1 Frontend

- 19 kalkulatorów, około 11 000 linii kodu (`src/components/calculators/`)
- `JewelryCalc.jsx` (1550 linii) - parametryczny model wyceny biżuterii: metal, próba, masa, kamienie, robocizna, oprawa, powlekanie, grawer
- `Print3DCalc.jsx` (781 linii) - model kosztowy MSLA/FDM z żywicą, czasem druku, amortyzacją maszyny, energią, postprocessingiem, rabatem seryjnym i progiem minimalnego zlecenia 49 PLN
- `SimpleJewelryCalc.jsx` i `SimpleStudioCalc.jsx` - uproszczone warianty, **gotowa baza pod kreator sklepowy**
- `STLViewer.jsx` - liczy bounding box i objętość z wgranego STL
- `SVGUploadCard.jsx` - obsługa plików wektorowych pod laser
- Trójjęzyczność pl/en/de, reguła walutowa PLN/EUR, prerender SSR, SEO

### 1.2 Backend (Railway, Express + Postgres)

Istnieje realny backend z 23 endpointami, między innymi:

- `POST /api/quote` - przyjmuje wycenę z kalkulatora wraz z plikiem do 50 MB, zapisuje do tabeli `leads`, wypycha webhook do n8n
- `POST /api/contact` - formularz kontaktowy z załącznikami
- `GET /api/market-rates` - **żywe kursy NBP i ceny metali**
- `GET /api/gemstone-prices` - ceny kamieni
- `GET /api/filaments`, `/api/laser-matrix` - bazy materiałowe z głosowaniem społeczności
- Integracja Gmail, śledzenie statusu kontaktu z leadem

### 1.3 Czego nie ma

Koszyka, checkoutu, płatności, katalogu produktów jako danych, stanów magazynowych, zarządzania zamówieniami, faktur, etykiet nadawczych, kont klienta.

### 1.4 Kanał sprzedaży, który już działa

Dwa sklepy Etsy: `aejacashop.etsy.com` i `aejaca2studio.etsy.com`. To jest istotne dla decyzji w rozdziale 8.

---

## 2. Czego uczy rynek

Przejrzałem trzy grupy referencji. Nie kopiujemy żadnej w całości, ale każda rozwiązuje jeden z naszych problemów.

### 2.1 Wycena natychmiastowa z pliku: Xometry, Ponoko, Sculpteo, Craftcloud

Model: klient wgrywa plik, wybiera materiał i wykończenie, dostaje **cenę i termin od ręki**, bez kontaktu z człowiekiem. Xometry buduje to na uczeniu maszynowym i geometrii obliczeniowej, Ponoko na deterministycznym modelu materiał plus czas cięcia.

Trzy rzeczy warte przeniesienia:

1. **Gwarancja ceny w oknie czasowym.** Xometry trzyma cenę 30 dni. To rozwiązuje konflikt między "cena wiążąca" a "koszty się zmieniają".
2. **Instant proof / DFM feedback.** Ponoko po wgraniu pliku od razu pokazuje podgląd i ostrzega o problemach wykonawczych. To odcina zamówienia niemożliwe do wykonania, zanim staną się reklamacją.
3. **Brak minimum zamówienia jako argument marketingowy**, przy jednoczesnym progu minimalnej wartości zlecenia w kalkulacji. My mamy już próg 49 PLN w `Print3DCalc`.

### 2.2 Konfiguratory jubilerskie: Taylor & Hart, Frank Darling, Brilliant Earth

Model: kreator prowadzi przez wybór oprawy, kamienia, metalu, a cena aktualizuje się na żywo przy każdej zmianie. Dla prac w pełni autorskich ścieżka jest inna: quiz lub konsultacja, potem szkice, dobór kamienia, model 3D, akceptacja CAD, dopiero wtedy produkcja.

Dwie rzeczy warte przeniesienia:

1. **Rozdzielenie "konfigurowalne" od "w pełni autorskie".** Konfigurowalne ma cenę natychmiast. Autorskie ma płatny etap projektowy przed ceną finalną. Mieszanie tych dwóch ścieżek w jednym formularzu jest głównym powodem, dla którego konfiguratory jubilerskie bywają nieczytelne.
2. **Cena widoczna zawsze**, od pierwszego kroku, aktualizowana natychmiast. Klient, który musi kliknąć "wyceń", żeby zobaczyć liczbę, w połowie przypadków nie klika.

### 2.3 Mapi-Tech: najbliższy wzorzec operacyjny

Polski warsztat druku 3D z Łodzi, który rozwiązał dokładnie ten problem, o który nam chodzi, i zrobił to prościej, niż zakładałem.

Ich ścieżka:

1. Klient wgrywa plik STL lub STEP do kalkulatora na stronie
2. Wybiera materiał i parametry, **albo opisuje zastosowanie i dostaje rekomendację**
3. Dostaje wycenę w kilka chwil, bez rejestracji i bez zobowiązania
4. Zatwierdza wycenę i płaci online: BLIK, karta lub przelew, obsługa przez **Stripe**
5. Odbiera przesyłkę kurierem, standardowo 3 do 5 dni roboczych

Deklarują wprost: cały proces online, bez wizyt, bez telefonów, bez zbędnych formalności. Przyjmują zamówienia **od jednej sztuki**, bez minimum. Jeśli klient nie jest pewien materiału lub parametrów, może wgrać pliki i wybrać opcję **ręcznej weryfikacji wyceny**.

Cztery rzeczy, które warto z tego wziąć wprost:

1. **Opcja "opisz zastosowanie, doradzimy" obok wyboru parametrów.** To jest dokładnie ta furtka, którą opisałem w regułach kreatora, tyle że sprawdzona w praktyce na polskim kliencie. Klient, który nie wie, czy chce PETG czy PA6-CF, nie odpada z lejka.
2. **Ręczna weryfikacja jako świadomy element ścieżki, a nie awaria.** Automat wycenia większość, człowiek wchodzi tam, gdzie automat się nie nadaje. To rozwiązuje problem z rozdziału 3.2 bez budowania sztucznej inteligencji.
3. **Stripe z BLIK-iem jako pełny checkout.** To jest twardy dowód, że dla zamówienia jednopozycyjnego z pliku **nie potrzeba żadnej platformy sklepowej**. Konsekwencje opisuję w rozdziale 5.3.
4. **Rozróżnienie STL i STEP.** STL jako standard eksportu, STEP tam, gdzie liczy się precyzja wymiarowa. Drobiazg, ale buduje wiarygodność techniczną, a nasz `STLViewer` obsługuje dziś tylko STL.

### 2.4 Uczciwa ocena konkurencji, korekta wcześniejszego założenia

Przy okazji Mapi-Tech wyszła rzecz, którą muszę sprostować względem pierwszej wersji tego planu. Napisałem tam, że kreator plikowy to coś, czego lokalna konkurencja nie ma w ogóle. **To nieprawda.**

W polskim internecie działa co najmniej kilka warsztatów z natychmiastową wyceną z pliku: Mapi-Tech, LayerTech, Drukex, Send3D, Geometry Hustlers, Druk3D Kraków, AM3D, Werk3D. Segment natychmiastowej wyceny druku 3D jest w Polsce **nasycony**.

To zmienia pozycjonowanie, ale nie unieważnia pomysłu. Nasza przewaga nie może brzmieć "wyceniamy od ręki", bo to już nie wyróżnia. Realne wyróżniki, które faktycznie mamy:

- **Druk 3D i laser i biżuteria pod jednym dachem.** Żaden z wymienionych nie robi jednocześnie odlewów jubilerskich, grawerowania fiber i druku. Klient, który chce prototyp, a potem ten sam kształt w srebrze, u nas przechodzi całą drogę.
- **Głębia wiedzy materiałowej.** Mamy bazę filamentów z głosowaniem społeczności, matrycę parametrów laserowych, kalkulatory skurczu i ustawień druku. To są narzędzia, po które klient wraca, zanim jeszcze cokolwiek zamówi.
- **Żywe ceny surowców.** `GET /api/market-rates` z kursami NBP i cenami metali to rzecz, której nie ma nikt z tej listy, bo nikomu poza jubilerem nie jest potrzebna.

Wniosek: kreator plikowy budujemy nie dlatego, że jest unikalny, tylko dlatego, że jest **warunkiem wejścia do gry**. Wyróżniamy się dopiero tym, co jest obok niego.

### 2.5 Platforma i płatności w Polsce

BLIK obsługuje ponad 60 procent checkoutów w polskim e-commerce i ma ponad 16 milionów aktywnych użytkowników. To nie jest opcja dodatkowa, to jest warunek konieczny. Podobnie Paczkomaty InPost jako domyślna forma dostawy.

Wniosek dla wyboru platformy: **dostępność BLIK i InPost jest twardym kryterium filtrującym**, ważniejszym niż elegancja architektury.

---

## 3. Problem centralny: cena wiążąca zamiast szacunkowej

To jest sedno zadania i miejsce, w którym plan może się wywrócić, jeśli potraktujemy je pobieżnie.

### 3.1 Dlaczego dziś mamy widełki

W `jewelryConfig.js`:

```js
export const TOL_LOW = 0.15;   // -15%
export const TOL_HIGH = 0.12;  // +12%
```

Kalkulator świadomie zwraca przedział, bo model parametryczny nie zna rzeczywistej masy wyrobu ani realnego czasu pracy przy konkretnym projekcie. Dla wyceny orientacyjnej to jest uczciwe. Dla sklepu to jest bezużyteczne, bo klient nie może zapłacić "od 1200 do 1500 PLN".

### 3.2 Trzy kategorie i trzy różne odpowiedzi

**Kategoria A: produkt gotowy.** Cena znana, bo wyrób istnieje. Zero problemu. To jest powód, dla którego ta kategoria powinna być pierwsza we wdrożeniu.

**Kategoria B: usługa z pliku klienta.** Cena **jest deterministycznie wyliczalna**, bo geometria jest znana. Objętość STL daje zużycie żywicy lub filamentu. Bounding box daje liczbę sztuk na platformie. Wysokość daje czas druku. Długość ścieżek SVG daje czas cięcia. Wszystkie te wielkości już liczymy. Widełki w tej kategorii nie biorą się z niewiedzy, tylko z ostrożności. **Można je zwinąć do jednej liczby, jeśli dołożymy trzy zabezpieczenia:**

1. Bufor ryzyka wliczony w cenę zamiast pokazywany jako górna granica widełek
2. Automatyczna walidacja pliku, która odrzuca geometrie poza możliwościami maszyny, zamiast wyceniać je optymistycznie
3. Próg wartości, powyżej którego zamówienie trafia do ręcznej akceptacji przed pobraniem płatności

**Kategoria C: biżuteria autorska.** Cena finalna nie istnieje przed projektem i żadna sztuczka tego nie zmieni. Uczciwa odpowiedź to model dwuetapowy, taki jak u Taylor & Hart: klient płaci ustaloną, niewielką kwotę za etap projektowy, dostaje wizualizację i wycenę finalną, i dopiero wtedy decyduje o produkcji. Zaliczka zalicza się na poczet zamówienia.

### 3.3 Ryzyko, które trzeba nazwać wprost

Złoto w naszej konfiguracji to 645 PLN za gram. Pierścionek 5-gramowy z próby 585 zawiera około 1900 PLN samego kruszcu. Ruch ceny złota o 15 procent to 285 PLN różnicy na jednej sztuce, czyli więcej niż cała marża warsztatowa na tym zleceniu.

Wniosek: **cena wiążąca na wyroby ze złota i platyny musi mieć krótkie okno ważności**, rzędu 24 do 72 godzin, albo być przeliczana na żywo w momencie płatności. Mamy do tego gotowe `GET /api/market-rates`. Dla srebra i dla usług studia, gdzie udział surowca w cenie jest niski, okno może być znacznie dłuższe, na przykład 30 dni jak u Xometry.

To nie jest szczegół techniczny, tylko decyzja biznesowa o tym, gdzie leży ryzyko cenowe.

---

## 4. Model danych: co jest produktem

Proponuję trzy typy pozycji, bo próba zmieszczenia wszystkiego w jednym typie produktu jest typowym błędem, który później blokuje rozwój.

### 4.1 `PRODUCT` - wyrób gotowy

Stała cena, zdjęcie, opis, stan magazynowy (najczęściej 1, bo to sztuki unikatowe), rozmiar, materiał. Źródło danych: nasze własne portfolio, 26 zdjęć już jest w `public/img/portfolio/`.

Podlega pełnemu prawu odstąpienia (14 dni).

### 4.2 `CONFIGURABLE` - wyrób z kreatora, cena wyliczana

Zestaw parametrów (metal, próba, rozmiar, kamień, grawer) plus funkcja ceny. Cena znana natychmiast, wiążąca w oknie ważności.

Personalizowany, więc **bez prawa odstąpienia**, ale tylko wtedy, gdy personalizacja jest realna (grawer, indywidualny rozmiar), a nie pozorna.

### 4.3 `MADE_TO_ORDER` - usługa z pliku lub projekt autorski

Wymaga uploadu (STL, STEP, SVG, DXF) albo briefu. Dla plików cena natychmiastowa. Dla projektu autorskiego dwuetapowa, z zaliczką projektową.

Bez prawa odstąpienia z tego samego powodu.

---

## 5. Wybór platformy

### 5.1 Kryteria

1. Obsługa BLIK, Przelewy24 lub równoważnych, Apple/Google Pay
2. Integracja InPost (Paczkomaty) z generowaniem etykiet
3. Możliwość wstrzyknięcia własnego, złożonego konfiguratora do koszyka wraz z parametrami i plikiem klienta
4. Faktury i rozliczenie VAT, w tym VAT OSS przy sprzedaży do Niemiec i reszty UE
5. Realistyczny nakład utrzymania dla jednoosobowego zespołu
6. Nie wymaga przepisania istniejącej strony

### 5.2 Rozważane warianty

**Wariant A: Shopify jako silnik handlowy, nasza strona jako warstwa konfiguracyjna**

Strona zostaje na Cloudflare Pages. Kreatory zostają nasze. Po skompletowaniu konfiguracji tworzymy koszyk przez Storefront API z parametrami zapisanymi jako atrybuty pozycji i przekierowujemy na checkout Shopify.

Za: checkout, płatności, faktury, VAT OSS, etykiety, zwroty i bezpieczeństwo płatnicze są cudzym problemem. Ekosystem integracji z InPost istnieje. Najkrótsza droga do pierwszej sprzedaży.

Przeciw: abonament plus prowizja, zależność od zewnętrznego dostawcy, ograniczona kontrola nad wyglądem checkoutu.

**Wariant B: własny checkout na Stripe, oparty o istniejący Express i Postgres**

Za: pełna kontrola, zerowy abonament, idealne dopasowanie do obecnego stosu, dane zostają u nas, Stripe obsługuje BLIK i Przelewy24 w Polsce.

Przeciw: musimy sami zbudować i **utrzymywać** zarządzanie zamówieniami, faktury, VAT OSS, obsługę zwrotów, wymagany od 19 czerwca 2026 przycisk odstąpienia od umowy, oraz integrację z InPost. To jest kilka miesięcy pracy i stałe zobowiązanie prawne.

**Wariant C: polska platforma SaaS (Shoper, IdoSell, Sky-Shop)**

Za: BLIK, InPost, faktury i zgodność z polskim prawem od ręki.

Przeciw: monolityczne, walczyłyby z naszą stroną w Reakcie, a wstrzyknięcie naszych kreatorów byłoby uciążliwe. Ryzyko, że skończymy z dwiema niespójnymi stronami.

### 5.3 Rekomendacja, zrewidowana po analizie Mapi-Tech

Pierwotnie rekomendowałem wariant A dla całości. **Wycofuję się z tego** i proponuję rozdzielenie decyzji, bo Mapi-Tech pokazuje, że dla części zakresu platforma sklepowa jest po prostu zbędna.

Kluczowa obserwacja: **zamówienie z pliku nie jest zakupem w sklepie.** Nie ma koszyka, bo pozycja jest jedna. Nie ma stanu magazynowego, bo nic nie leży na półce. Nie ma prawa odstąpienia, bo rzecz jest personalizowana. Nie ma katalogu, bo katalogiem jest plik klienta. Zostaje jedna płatność za jedną, świeżo wyliczoną kwotę, czyli dokładnie to, do czego służy Stripe Checkout.

Stąd rekomendacja rozdzielona:

**Dla kreatora plikowego: wariant B, czyli Stripe na istniejącym backendzie.** Mamy już `POST /api/quote`, który przyjmuje wycenę wraz z plikiem do 50 MB i zapisuje ją do Postgresa. Brakuje właściwie tylko utworzenia sesji płatności i webhooka potwierdzającego. Zero abonamentu, zero nowej platformy, zero migracji. Stripe obsługuje BLIK, karty i Apple/Google Pay w Polsce, co Mapi-Tech potwierdza w praktyce.

**Dla katalogu wyrobów gotowych: wariant A, czyli platforma.** Tu dopiero pojawia się to, czego Stripe sam nie daje: stany magazynowe, zwroty w 14 dni, korekty faktur, wysyłka wielopozycyjna, wymagany prawem przycisk odstąpienia od umowy. Budowanie tego samemu jest dokładnie tą pułapką, przed którą ostrzegałem.

Praktyczna konsekwencja: **te dwie decyzje nie muszą zapaść jednocześnie.** Kreator plikowy może ruszyć bez rozstrzygania, na jakiej platformie stanie kiedyś katalog.

**Do zweryfikowania dopiero przed katalogiem:** dostępność BLIK na wybranym planie Shopify w Polsce oraz konkretna integracja z InPost. Nie przesądzam tego z pamięci, bo to warunek konieczny wariantu A.

---

## 6. Ścieżka klienta i kreatory

### 6.1 Zasada nadrzędna

Klient wchodzi na aejaca.com nie wiedząc, czy chce biżuterię, czy grawer na prezent. Sklep musi go rozgałęzić w jednym kroku, a potem prowadzić bez rozgałęzień.

### 6.2 Wejście: trzy drzwi, nie dwadzieścia

```
                    Czego szukasz?
                          |
    +---------------------+---------------------+
    |                     |                     |
Kup gotowe          Zrób mi coś           Wykonaj z mojego
(katalog)           (kreator)             pliku (upload)
```

### 6.3 Reguły kreatora

Wszystkie wynikają z tego, co działa u Taylor & Hart i Ponoko, plus z ograniczeń, które już mamy w kodzie.

1. **Maksymalnie 5 kroków.** Więcej znaczy porzucony koszyk.
2. **Cena widoczna od kroku pierwszego** i aktualizowana natychmiast po każdej zmianie. Nie ma przycisku "oblicz".
3. **Każdy krok ma opcję "nie wiem" lub "doradź mi"**, która nie kończy ścieżki, tylko przełącza na konsultację z zachowaniem dotychczasowych wyborów.
4. **Podgląd na żywo** tam, gdzie to możliwe. Dla plików mamy już `STLViewer`. Dla biżuterii wystarczą zdjęcia wariantów, mamy je w `public/img/calc/`.
5. **Zero ślepych zaułków.** Jeśli konfiguracja jest niewykonalna, kreator mówi dlaczego i proponuje najbliższą wykonalną, zamiast pokazywać błąd.
6. **Podsumowanie przed płatnością** zawiera wszystkie parametry w formie czytelnej dla człowieka, bo to samo podsumowanie trafi później na zlecenie warsztatowe.

### 6.4 Trzy konkretne kreatory

**Kreator "Wykonaj z mojego pliku"** (najwyższy priorytet, przed katalogiem)

Kroki: wgraj plik → technologia i materiał → wykończenie i ilość → dostawa → płatność.
Cena wiążąca od razu po wgraniu pliku. Bazuje na `Print3DCalc` i `CO2LaserCalc`.

Wzorzec ścieżki bierzemy z Mapi-Tech, łącznie z dwiema rzeczami, które warto skopiować świadomie:

- obok wyboru materiału zawsze dostępne "opisz zastosowanie, doradzimy"
- opcja ręcznej weryfikacji wyceny jako normalny wybór klienta, nie komunikat o błędzie

Do domknięcia zakresu: obsługa **STEP** obok STL. Dziś `STLViewer` czyta tylko STL, a STEP jest formatem preferowanym tam, gdzie liczy się precyzja wymiarowa. To osobna pozycja pracy, nie drobiazg.

**Kreator "Biżuteria konfigurowalna"**

Kroki: typ wyrobu → metal i próba → kamień → rozmiar i grawer → podsumowanie.
Cena wiążąca w oknie 48 godzin, przeliczana z żywych cen metali.
Bazuje na `SimpleJewelryCalc`, ograniczonym do wariantów, które faktycznie umiemy wykonać w powtarzalny sposób.

**Ścieżka "Projekt autorski"**

Krok 1: brief i inspiracje. Krok 2: płatna zaliczka projektowa. Krok 3 (poza sklepem): projekt, wizualizacja, wycena finalna. Krok 4: dopłata i produkcja.
Bazuje na pełnym `JewelryCalc` jako narzędziu wewnętrznym, nie klienckim.

---

## 7. Płatności, dostawa, prawo

### 7.1 Płatności

Obowiązkowo: BLIK, karta, Apple Pay, Google Pay, szybki przelew. Opcjonalnie PayPal dla rynku niemieckiego.

Dla zamówień powyżej ustalonego progu warto rozważyć płatność dwuetapową: zaliczka przy zamówieniu, reszta przed wysyłką. To jest standard w rzemiośle na zamówienie i chroni warsztat przed porzuconymi zleceniami.

### 7.2 Dostawa

Paczkomat InPost jako domyślny, kurier jako alternatywa, odbiór osobisty w Józefosławiu. Dla wysyłki zagranicznej trzeba ustalić progi wartości, powyżej których wymagane jest ubezpieczenie, bo wysyłamy złoto.

Uwaga: obecny schemat JSON-LD deklaruje darmową wysyłkę do dziesięciu krajów UE (`buildShippingDetails` w `src/seo/schemas.js`). Przy uruchomieniu sklepu trzeba zweryfikować, czy to nadal ma pokrycie w rzeczywistości, bo deklaracja w danych strukturalnych staje się wtedy obietnicą handlową.

### 7.3 Prawo, trzy rzeczy nie do pominięcia

1. **Przycisk "odstąp od umowy tutaj".** Od 19 czerwca 2026 sklepy internetowe muszą udostępniać łatwo dostępną funkcję odstąpienia online. To jest już obowiązujące prawo, nie plan na przyszłość.
2. **Rozróżnienie typów zamówień.** Towar personalizowany, wyprodukowany według specyfikacji konsumenta, jest wyłączony z prawa odstąpienia. Towar gotowy nie jest. Sklep musi obsłużyć obie ścieżki i **jasno komunikować brak prawa zwrotu przed złożeniem zamówienia**, a nie po.
3. **VAT OSS.** Sprzedaż do Niemiec i innych krajów UE powyżej progu wymaga rozliczenia w procedurze OSS. To argument za wariantem A, gdzie platforma to obsługuje.

Regulamin, polityka zwrotów i polityka prywatności wymagają aktualizacji. Mamy już `Returns.jsx`, `Shipping.jsx`, `Warranty.jsx`, `Privacy.jsx`, ale były pisane dla serwisu bez sprzedaży.

---

## 8. Co z Etsy

Etsy zostaje, ale zmienia rolę.

Dziś Etsy jest jedynym kanałem sprzedaży. Po uruchomieniu sklepu powinien zostać kanałem **pozyskiwania nowych klientów** dla produktów gotowych, podczas gdy zamówienia indywidualne i powtarzalni klienci przechodzą na własny sklep, gdzie nie płacimy prowizji i mamy kontakt do klienta.

Praktycznie: te same wyroby gotowe wystawiamy w obu miejscach, ale kreatory i zamówienia na miarę są dostępne wyłącznie u nas. To jest naturalny powód, dla którego klient przechodzi z Etsy na naszą stronę.

Ryzyko do pilnowania: rozjazd stanów magazynowych przy sztukach unikatowych. Sprzedanie tego samego pierścionka dwa razy jest gorsze niż brak sprzedaży.

---

## 9. Etapy wdrożenia

Kolejność jest celowa: każdy etap sprzedaje samodzielnie i finansuje następny.

### Faza 0: decyzje (przed jakimkolwiek kodem)

- Wybór platformy, po weryfikacji BLIK i InPost
- Polityka ceny wiążącej: okna ważności osobno dla złota, srebra i usług studia
- Progi ręcznej akceptacji zamówienia
- Zakres pierwszego katalogu

### Faza 1: kreator "z mojego pliku"

**Kolejność zmieniona po analizie Mapi-Tech.** Pierwotnie stawiałem tu katalog. Kreator plikowy jest jednak lżejszy, mimo że brzmi trudniej, bo omija cztery najbardziej pracochłonne elementy sklepu naraz: koszyk, stan magazynowy, zwroty w 14 dni i wybór platformy.

Wymaga: uploadu i walidacji plików (mamy), zwinięcia widełek do ceny wiążącej, sesji płatności Stripe, webhooka potwierdzającego, wyceny wysyłki, kolejki produkcyjnej. Rozszerzenie o STEP.

Efekt: pierwsza automatyczna sprzedaż bez wdrażania jakiejkolwiek platformy sklepowej.

### Faza 2: katalog wyrobów gotowych

Tu dopiero potrzebujemy platformy. Wymaga: modelu produktu, stron produktowych z SEO i schematem Product, koszyka, stanów magazynowych, zwrotów, faktur, regulaminu, przycisku odstąpienia.

Zdjęcia już mamy, 26 sztuk w `public/img/portfolio/`.

### Faza 3: kreator biżuterii konfigurowalnej

Wymaga: zawężenia oferty do wariantów powtarzalnych, przeliczania cen metali na żywo, okna ważności ceny, obsługi grawerowania jako personalizacji.

### Faza 4: konto klienta, historia zamówień, B2B

Ponowne zamówienia, cenniki B2B, śledzenie statusu produkcji. Mamy już stronę `B2B.jsx`, więc jest do czego to podpiąć.

Świadomie **nie podaję tu terminów**. Podam je dopiero po Fazie 0, bo wybór platformy zmienia pracochłonność każdej kolejnej fazy o rząd wielkości.

---

## 10. Ryzyka, które trzeba mieć na widoku

| Ryzyko | Dlaczego groźne | Jak ograniczamy |
|---|---|---|
| Cena wiążąca przy zmiennych cenach metali | Ruch złota o 15 proc. zjada całą marżę | Krótkie okno ważności, przeliczanie z `/api/market-rates` przy płatności |
| Pliki niewykonalne | Klient płaci, my nie umiemy wykonać | Walidacja geometrii przed wyceną, wzorem instant proof Ponoko |
| **Przepustowość warsztatu** | Sklep tworzy zobowiązanie dostawy, jednoosobowy warsztat ma sufit | Widoczny termin realizacji zależny od kolejki, limit zamówień w oknie czasowym |
| Podwójna sprzedaż unikatu (Etsy i sklep) | Trzeba anulować zamówienie, strata zaufania | Jedno źródło stanu magazynowego |
| Zwroty przy personalizacji | Spór z konsumentem o zasadność wyłączenia | Jednoznaczna informacja przed zamówieniem, personalizacja realna a nie pozorna |
| Rozrost zakresu | Cztery fazy naraz oznaczają zero faz skończonych | Faza 1 na produkcji, zanim zacznie się Faza 2 |
| **Nasycony rynek natychmiastowej wyceny druku 3D** | Co najmniej 8 polskich warsztatów ma już taki kalkulator, samo "wycena od ręki" nie sprzedaje | Pozycjonowanie na połączeniu druku, lasera i jubilerstwa oraz na głębi wiedzy materiałowej, nie na szybkości wyceny |

Ryzyko przepustowości jest moim zdaniem najbardziej niedoceniane. Kalkulator, który tylko wycenia, nie zobowiązuje do niczego. Sklep, który przyjmuje płatność, zobowiązuje.

Ten temat rozwija osobny dokument: **`MDs/AEJaCA_Production_Capacity_Plan.md`** (pomiar przepustowości, kolejka produkcyjna, magazyn filamentów i żywic, algorytm obietnicy terminu).

---

## 11. Co wymaga Twojej decyzji

Zanim ruszy Faza 0, potrzebuję odpowiedzi na cztery pytania:

1. **Czy akceptujesz zmienioną kolejność?** Kreator plikowy przed katalogiem. Jeśli zależy Ci na tym, żeby najpierw sprzedawać wyroby gotowe, kolejność wraca do pierwotnej, ale wtedy decyzja o platformie musi zapaść od razu.
2. **Czy godzisz się na Stripe jako jedyny checkout w pierwszej fazie?** To znaczy: bez koszyka wielopozycyjnego i bez konta klienta na starcie.
3. **Jaki próg wartości zamówienia ma trafiać do ręcznej akceptacji?** Poniżej tego progu sklep działa w pełni automatycznie.
4. **Jaki jest realny sufit przepustowości warsztatu na miesiąc?** Bez tej liczby nie da się ustawić terminów realizacji ani limitów.

---

*Dokument roboczy. Nie modyfikuje kodu produkcyjnego. Po zatwierdzeniu kierunku wymaga aktualizacji: `chat-api/context.js` (asystent musi wiedzieć o sklepie), `public/llms.txt`, `public/sitemap.xml`, `src/seo/seoData.js`, `MDs/AEJaCA_Brand_Reference.md`.*
