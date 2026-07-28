# AEJaCA - Diagnoza popytu

*Wersja 1.0 | 2026-07-28 | branch `claude/shop-plan` | dane: Google Search Console, 3 miesiące do 28.07.2026*

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

## 7. Czego jeszcze nie wiem

1. **Statystyki Google Business Profile.** Mogą pokazać, że ruch lokalny istnieje i po prostu nie przechodzi przez wyszukiwarkę.
2. **Raport "Linki" w Search Console.** Rozstrzyga hipotezę o braku autorytetu.
3. **Wiek domeny i historia.** Jeśli witryna jest młoda, część słabości jest naturalna i minie.
4. **Skąd przychodzą obecni klienci.** 24 opinie Google oznaczają, że klienci są. Warto wiedzieć, którą drogą trafili, bo to jest kanał, który już działa i można go zwiększyć.

Punkt 4 uważam za najważniejszy. Mamy 24 zadowolonych klientów przy dwóch wejściach tygodniowo z Google, więc **oni przyszli skądś indziej**. Ta droga jest odpowiedzią na pytanie o popyt.

---

*Dokument roboczy. Nie modyfikuje kodu produkcyjnego.*
