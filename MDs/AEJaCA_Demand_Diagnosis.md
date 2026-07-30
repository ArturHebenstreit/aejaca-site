# AEJaCA - Diagnoza popytu

*Wersja 1.2 | 2026-07-28 | branch `claude/shop-plan` | dane: Google Search Console, 3 miesiące do 28.07.2026*

---

## 0. Wniosek w jednym zdaniu

**Problemem nie jest konwersja, tylko to, że praktycznie nikt nie przychodzi.** Sklep zbudowany dziś obsługiwałby dwie osoby tygodniowo.

---

## 1. Dane

| Wskaźnik | Wartość (3 miesiące) | W przeliczeniu |
|---|---|---|
| Kliknięcia | **26** | ~2 tygodniowo, 0,3 dziennie |
| Wyświetlenia | **545** | ~6 dziennie |
| CTR | 4,8 proc. | przyzwoity jak na pozycję |
| Średnia pozycja | **11,7** | dół pierwszej strony, częściej druga |
| Liczba zapytań | **52** | dla witryny z 70 stronami to bardzo mało |

Dziesięć najczęstszych zapytań:

| Zapytanie | Kliknięcia | Wyświetlenia |
|---|---|---|
| lost resin casting | 1 | 4 |
| ejaca | 0 | 13 |
| artisan jewelry | 0 | 12 |
| msla | 0 | 10 |
| msla 3d | 0 | 7 |
| msla printing | 0 | 7 |
| msla resin | 0 | 6 |
| chain patterns | 0 | 5 |
| crafted | 0 | 4 |
| msla hartsi | 0 | 4 |

---

## 2. Co z tego wynika

### 2.1 Ruch z wyszukiwarki jest zerowy w sensie biznesowym

26 kliknięć przez kwartał to dwa wejścia tygodniowo. Przy hojnie liczonej konwersji 2 procent daje to **0,5 zamówienia na kwartał**. Drukarki nie stoją dlatego, że coś jest źle ustawione w lejku. Stoją, bo lejek jest pusty na samej górze.

### 2.2 Ani jedno zapytanie nie ma intencji zakupowej

W pierwszej dziesiątce nie ma **żadnego** zapytania typu "druk 3d warszawa", "grawerowanie laserowe", "pierścionek na zamówienie", "wydruk 3d cena". Są za to ogólne terminy techniczne, w większości po angielsku.

To nie są ludzie chcący coś zamówić. To ludzie chcący się czegoś dowiedzieć, i w dodatku najczęściej spoza Polski.

### 2.3 Rankujemy po angielsku, a sprzedajemy po polsku

Osiem z dziesięciu zapytań jest angielskich: `msla`, `msla printing`, `msla resin`, `artisan jewelry`, `lost resin casting`, `chain patterns`, `crafted`. To znaczy, że Google zaindeksował głównie **słownik i narzędzia**, czyli treści edukacyjne, i wystawia je na zapytania globalne, gdzie konkurujemy z ogromnymi serwisami i gdzie i tak nikt nie kliknie w warsztat z Józefosławia.

Polskie strony komercyjne nie rankują w ogóle.

### 2.4 Nawet zapytania o markę nie konwertują

`ejaca` to 13 wyświetleń i **zero kliknięć**. Ktoś szuka nas z pamięci, z błędem w nazwie, widzi wynik i nie klika. To sygnał, że tytuł i opis w wynikach nie przekonują, albo że wynik pokazuje się na dalekiej pozycji pod błędnie wpisaną nazwą.

### 2.5 Pozycja 11,7 przy 545 wyświetleniach oznacza brak autorytetu

Treści są, indeksacja od dziś naprawiona, ale strona siedzi na granicy drugiej strony wyników. Przy dobrej treści i poprawnej technice zostaje jedna główna przyczyna: **brak linków przychodzących i brak sygnałów zaufania**. To wymaga potwierdzenia w raporcie "Linki".

---

## 3. Skala problemu, policzona uczciwie

Żeby mieć **10 zamówień tygodniowo**:

| Założona konwersja | Potrzebny ruch tygodniowo | Krotność obecnego |
|---|---|---|
| 2 proc. (typowy e-commerce) | 500 wejść | **250 razy** |
| 5 proc. (ruch lokalny o wysokiej intencji) | 200 wejść | **100 razy** |

Nie da się tego osiągnąć w kilka tygodni samym SEO. **SEO jest właściwą inwestycją, ale nie jest odpowiedzią na pytanie, skąd wziąć zlecenia w tym kwartale.**

To jest najważniejsze zdanie w tym dokumencie i konsekwencja dla planu sklepu jest bezpośrednia.

---

## 4. Rewizja planu sklepu

W `AEJaCA_Shop_Plan.md` rekomendowałem zacząć od kreatora plikowego z płatnością. Przy dwóch wejściach tygodniowo **kolejność trzeba zmienić**, bo najlepszy checkout świata nie sprzeda nic, jeśli nikt go nie zobaczy.

Nowa kolejność:

1. **Dystrybucja** - kanały, które dają zlecenia teraz, niezależnie od Google
2. **Widoczność lokalna** - budowana równolegle, efekt za 3 do 6 miesięcy
3. **Sklep** - dopiero gdy ruch uzasadnia automatyzację

Sklep nie znika z planu. Zmienia się moment. Dopóki zleceń jest kilka miesięcznie, **ręczna obsługa wyceny mailem jest wystarczająca i tańsza** niż budowanie checkoutu.

Wyjątek: poprawki cenowe z `AEJaCA_Production_Capacity_Plan.md` (rozdz. 3.6) robimy niezależnie, bo są tanie i dotyczą też wycen wysyłanych ręcznie.

---

## 5. Kanały, które mogą dać zlecenia w tym kwartale

Uszeregowane według stosunku efektu do czasu wdrożenia.

### 5.1 Google Business Profile i Mapy

**Search Console nie mierzy Map.** Profil z 24 opiniami i oceną 5,0 to poważny atut, którego wartości nie widać w powyższych danych. Trzeba sprawdzić statystyki samego profilu: wyświetlenia, kliknięcia w telefon, prośby o trasę.

Jeśli profil jest niedopracowany (brak zdjęć realizacji, brak listy usług, brak postów, brak odpowiedzi na pytania), to najtańsza możliwa poprawa, bo działa na zapytania lokalne o najwyższej intencji.

Do naprawienia przy okazji: `geoRadius: "5000"` w `buildLocalBusinessSchema`. Pięć kilometrów deklarowanego obszaru obsługi przy wysyłce kurierskiej po całym kraju.

### 5.2 Podzlecenia przychodzące z platform

Craftcloud, Treatstock i podobne kierują zlecenia do warsztatów partnerskich. Zero kosztu marketingowego, zlecenia przychodzą same, marża niższa, ale **maszyny i tak stoją, więc alternatywą jest zero**.

To jest najszybsza droga od "drukarki stoją" do "drukarki pracują".

### 5.3 Allegro

Największy zasięg konsumencki w Polsce. Nadaje się dla wyrobów gotowych i dla usług szablonowych (grawer na prezent, personalizowane drobiazgi). Zupełnie inna publiczność niż Etsy.

### 5.4 Bezpośredni kontakt B2B

Nasza realna przewaga to **wzorce odlewnicze**, czyli styk druku i jubilerstwa. Odbiorcy: warsztaty jubilerskie bez własnej drukarki żywicznej, projektanci, pracownie modelarskie, architekci. To jest sprzedaż telefoniczna i mailowa, nie SEO, i przy naszym suficie 130 sztuk tygodniowo wystarczy kilku stałych klientów, żeby zapełnić maszyny.

### 5.5 Etsy

Już działa. Pytanie, czy jest aktywnie prowadzone, czy tylko istnieje.

---

## 6. Co robić w SEO, skoro i tak trzeba

Równolegle, ze świadomością, że efekt przyjdzie za kilka miesięcy.

### 6.1 Strony lokalne, których nie mamy ani jednej

Wzorem `/druk-3d-lodz/` u Mapi-Tech. Kandydaci: Warszawa, Piaseczno, Konstancin, Józefosław, ewentualnie Ursynów i Wilanów. Każda strona z realną treścią o obsłudze tego rejonu, nie klonowana.

### 6.2 Przestawienie tytułów z markowych na zapytaniowe

Dziś:
```
"AEJaCA sTuDiO, Druk 3D, Laser, Modelowanie 3D, Odlewy"
```
Nikt nie szuka frazy "AEJaCA sTuDiO". Marka na początku tytułu marnuje najcenniejsze miejsce, dopóki marka nie jest rozpoznawalna.

### 6.3 Uporządkowanie relacji treści edukacyjnych do komercyjnych

Słownik i narzędzia ściągają ruch informacyjny, w dodatku anglojęzyczny. To jest wartościowe dla autorytetu i dla cytowań w asystentach AI, ale nie sprzedaje. Trzeba się upewnić, że z każdej takiej strony istnieje wyraźna droga do oferty, a nie tylko do kolejnego artykułu.

### 6.4 Linki przychodzące

Do zweryfikowania w raporcie "Linki". Przy pozycji 11,7 przy dobrej treści to najbardziej prawdopodobna brakująca składowa.

---

## 6a. Dane z Google Business Profile i raportu Linki (28.07.2026)

### Profil firmy, 6 miesięcy

| Wskaźnik | Wartość |
|---|---|
| Wyświetlenia profilu | **363** |
| Interakcje na profilu | **13** (przez pół roku) |
| Wyszukiwarka Google, mobile | 120 (33 proc.) |
| Wyszukiwarka Google, desktop | 88 (24 proc.) |
| Mapy, mobile | 84 (23 proc.) |
| Mapy, desktop | 71 (20 proc.) |
| Liczba fraz | < 50 |
| Fraza numer 1 | **"aejaca - artisan elegance jewelry and crafted art"** (< 15) |

**To jest rozstrzygające.** Najczęstsza fraza prowadząca do profilu to **pełna nazwa firmy**. W języku Google Business to są wyszukiwania "bezpośrednie", czyli ludzie, którzy już nas znają. Wyszukiwań "z odkrycia", czyli po kategorii ("jubiler Piaseczno", "druk 3D Warszawa"), praktycznie nie ma.

Jednocześnie: **363 wyświetlenia profilu wobec 26 kliknięć z wyszukiwarki na stronę**. Profil firmy jest dziś **czternaście razy większym kanałem niż cała witryna**, mimo że nikt się nim nie zajmuje.

### Linki przychodzące

| Wskaźnik | Wartość |
|---|---|
| Linki zewnętrzne, łącznie | **4** |
| Domeny linkujące | 2: `trustpilot.com` (3 strony), `reddit.com` (1) |
| Teksty linków | "odwiedź tę stronę", "visit website", *(pusta)*, "aejaca ... logo" |
| Linki wewnętrzne wg Google | 39, tylko na 6 stronach |

Cztery linki zewnętrzne to w praktyce zero. **To wyjaśnia średnią pozycję 11,7 lepiej niż cokolwiek innego.** Treść jest, technika od dziś naprawiona, ale bez sygnałów zaufania Google nie ma powodu stawiać nas wyżej.

Żaden z tekstów linków nie zawiera słowa opisującego usługę. Same "odwiedź tę stronę" i logo.

Uwaga do 39 linków wewnętrznych: sprawdziłem kod i **markup jest poprawny**. `BlogCard`, słownik i nawigacja używają prawdziwych `<Link>`. Wyjątkiem są pozycje rozwijane bez własnej trasy oraz kotwice sekcji, renderowane jako `<button>`, ale to nie są osobne strony. Niska liczba w raporcie odzwierciedla raczej to, że Google przeczołgał witrynę płytko, co jest spójne z blokadami indeksacji naprawionymi 28.07. Nie traktuję tego jako błędu do naprawy, tylko jako wskaźnik do obserwacji.

### Wniosek łączny

Oba kanały, wyszukiwarka i Mapy, obsługują wyłącznie ludzi, **którzy już znają nazwę**. To dokładnie odpowiada opisowi właściciela: klienci przychodzą z polecenia i z pracy. Internet tego nie wzmacnia, tylko odnotowuje.

**Nie mamy problemu z konwersją ani z treścią. Nie istniejemy dla nikogo, kto nas nie zna.**

## 6b. Trzy dźwignie w kolejności szybkości działania

### 1. Kategorie w profilu firmy (dni)

W Google Business to **kategoria główna i kategorie dodatkowe decydują, na jakie zapytania kategorialne profil w ogóle się pokazuje**. Skoro fraz "z odkrycia" nie ma, pierwsze podejrzenie pada na kategorie: albo są zbyt wąskie, albo nie ma dodatkowych.

Kandydaci: usługa druku 3D, grawerowanie, jubiler, projektowanie, warsztat rzemieślniczy. Do tego lista usług, zdjęcia realizacji i posty.

Ranking w Mapach na zapytania lokalne jest nieporównanie łatwiejszy niż ranking w wynikach webowych. **To jest najszybsza dostępna droga do pierwszych zleceń.**

### 2. Reklama Google z kredytem 1200 zł (dni)

W panelu widnieje oferta 1200 zł na start dla nowych reklamodawców. Przy zerowym ruchu organicznym i braku czasu na akwizycję bezpośrednią to jedyny kanał, który **kupuje ruch od razu**, i to na frazy o wysokiej intencji ("druk 3d warszawa", "grawerowanie laserowe piaseczno").

Kredyt pozwala przetestować, czy takie zapytania w ogóle konwertują u nas, zanim wydamy własne pieniądze na SEO pod te same frazy.

### 3. Linki i strony lokalne (miesiące)

Cztery linki to sufit dla wszystkiego innego. Źródła realne i tanie: katalogi firm (Panorama Firm, Aleo, Oferteo), profile w mediach społecznościowych z linkiem, profile Etsy, lokalne grupy i fora, strony dostawców i partnerów.

Równolegle strony lokalne, których nie mamy ani jednej.

## 6c. Widoczność w asystentach AI (AIEO)

### Jak to naprawdę działa

Są dwa mechanizmy, przez które model językowy może wymienić firmę, i mylenie ich prowadzi do marnowania czasu.

**Dane treningowe.** Powolne, bez kontroli, liczą się coraz mniej. Nic tu nie zoptymalizujesz w skali kwartału.

**Pobieranie w momencie odpowiedzi.** ChatGPT z wyszukiwaniem, Gemini z osadzeniem w Google, Claude z wyszukiwaniem, Perplexity. Model **wykonuje zwykłe zapytanie do wyszukiwarki i czyta wyniki**. To jest dziś mechanizm dominujący.

Konsekwencja jest niewygodna, ale zasadnicza:

> **AIEO nie jest osobnym kanałem od SEO. To ten sam kanał z innym sposobem wyświetlania wyniku.** Jeśli nie rankujesz, nie zostaniesz pobrany, a jeśli nie zostaniesz pobrany, nie zostaniesz zacytowany.

Poszczególne asystenty korzystają z różnych wyszukiwarek: ChatGPT z Binga, Gemini z Google, Perplexity z własnego indeksu wspartego zewnętrznymi. Dlatego **Bing trzeba traktować osobno**, a nie zakładać, że skoro Google nas widzi, to widzi nas każdy.

### Test empiryczny, 2026-07-28

Wykonałem dokładnie takie zapytania, jakie wykonałby asystent.

Zapytanie **"druk 3D Warszawa usługa wydruki na zamówienie"** zwróciło siedem firm: rudnik.agency, 3dprint.com.pl, 3dprodruk.pl, 3dstart.pl, hexagongroup.pl, 3d-innowacje.pl, proto3d.com.pl. **AEJaCA nie pojawiła się ani razu.**

Zapytanie **"AEJaCA jubiler druk 3D Józefosław Piaseczno"**, czyli z nazwą własną, zwróciło katalogi i konkurencję, w tym firmę Plastcore mającą siedzibę w samym Józefosławiu. **Naszej witryny nie było nawet przy zapytaniu o markę.**

To jest ta sama diagnoza co w rozdziale 6a, tylko widziana od strony asystenta.

### Co z tego wynika praktycznie

Wyniki zdominowały **agregatory**: `oferteo.pl`, `drukarnie3d.pl`, `strefadruku3d.pl`, `yellowpages.pl`. To są strony, które **już rankują** na frazy, o które walczymy.

Stąd najkrótsza droga do bycia wymienianym przez AI, i jednocześnie do rozwiązania problemu czterech linków:

**Wpis w katalogu, który już rankuje, działa dwukrotnie.** Po pierwsze jest linkiem przychodzącym. Po drugie, gdy asystent pobierze taką stronę, przeczyta na niej naszą nazwę i może ją wymienić, mimo że naszej witryny nie pobrał wcale.

To jest tańsze i szybsze niż próba wyprzedzenia siedmiu firm w wynikach organicznych.

### Lista działań, od najszybszych

| Działanie | Efekt | Kto |
|---|---|---|
| Wpisy w katalogach: Oferteo, Panorama Firm, Aleo, drukarnie3d.pl, strefadruku3d.pl, Yellow Pages | linki + cytowania w AI | właściciel |
| Bing Webmaster Tools: weryfikacja witryny i przesłanie sitemapy | ChatGPT pobiera z Binga | właściciel |
| Konto na Treatstock | link + zlecenia | właściciel |
| Utrzymanie `llms.txt` i schematów | higiena, warunek konieczny, nie wystarczający | zrobione |
| Treści odpowiadające wprost na pytania (FAQ, słownik, konkretne liczby) | łatwość cytowania | zrobione, do rozbudowy |
| Spójność danych firmy (nazwa, telefon, lokalizacja) wszędzie | rozpoznanie encji | do przeglądu |

### Czego nie robić

Nie ma sensu dalsza rozbudowa `llms.txt` ani dokładanie kolejnych schematów. To jest już zrobione dobrze i nie jest wąskim gardłem. Wąskim gardłem jest to, że **nikt nas nie pobiera**, a tego nie naprawi lepszy opis dla robota, który i tak nie przychodzi.

## 7. Czego jeszcze nie wiem

1. **Statystyki Google Business Profile.** Mogą pokazać, że ruch lokalny istnieje i po prostu nie przechodzi przez wyszukiwarkę.
2. **Raport "Linki" w Search Console.** Rozstrzyga hipotezę o braku autorytetu.
3. **Wiek domeny i historia.** Jeśli witryna jest młoda, część słabości jest naturalna i minie.
4. **Skąd przychodzą obecni klienci.** 24 opinie Google oznaczają, że klienci są. Warto wiedzieć, którą drogą trafili, bo to jest kanał, który już działa i można go zwiększyć.

Punkt 4 uważam za najważniejszy. Mamy 24 zadowolonych klientów przy dwóch wejściach tygodniowo z Google, więc **oni przyszli skądś indziej**. Ta droga jest odpowiedzią na pytanie o popyt.

---

*Dokument roboczy. Nie modyfikuje kodu produkcyjnego.*
