# Sekcja z Brand Reference (odlozone)

Wraca do rozdzialu 7, przed "### Pozostali straznicy w buildzie".

---

### Karta podarunkowa (od 2026-08-05)

Strona: `/gift-card/`. Nominał 100 do 10 000 zł, ważność **12 miesięcy** od wydania.

**Fundamentalna różnica wobec kodu rabatowego, i wynikają z niej wszystkie pozostałe:**
karta jest **przedpłatą**, czyli naszym zobowiązaniem, a nie zniżką od ceny.

| | Kod rabatowy | Karta podarunkowa |
|---|---|---|
| Pokrywa wysyłkę | nigdy | **tak** |
| Reszta przy mniejszym zamówieniu | nie dotyczy | **zostaje na karcie** |
| Kolejność naliczania | od pozycji koszyka | **na końcu, od kwoty do zapłaty** |
| Kolizja z drugim mechanizmem | jeden kod na zamówienie | **można łączyć z kodem** |

Kolejność jest twarda i pilnuje jej test `scripts/test-giftcards.mjs`:
**rabat od pozycji → plus wysyłka → karta od kwoty do zapłaty**. Odwrotna kolejność kazałaby karcie
dopłacać rabat, którego nikt nie kupił.

**Sprzedaż idzie ręcznie, realizacja automatycznie.** Klient wypełnia formularz na stronie karty
(idzie tym samym kanałem, co formularz kontaktowy, `subject: giftcard`), dostaje dane do przelewu,
a kartę wystawiasz z panelu po zaksięgowaniu wpłaty. Odbiór karty w kasie działa już w pełni
automatycznie. Karta w koszyku wymagałaby obejścia wysyłki (katalog nie zna dziś pojęcia towaru
cyfrowego) i osobnej ścieżki w Autopay, więc czekamy na sygnał, że popyt istnieje.

**Zamówienie pokryte kartą w całości** omija bramkę: serwer oznacza je jako opłacone, uruchamia te
same haki co potwierdzona płatność (maile, zdjęcie ze stanu, obciążenie karty) i prowadzi klienta
prosto na stronę statusu. Autopay z kwotą zero kończy się błędem, a klient zostałby z zamówieniem,
którego nie da się opłacić, mimo że już za nie zapłacił, kupując kartę.

**Rezerwacja, nie obciążenie.** Saldo schodzi dopiero przy potwierdzonej zapłacie, tak samo jak
towar i kod rabatowy. Porzucony koszyk nie zjada karty, a rezerwacja wygasa sama: 20 minut przy
płatności natychmiastowej, 3 dni robocze przy przelewie.

**Księgowo to bon różnego przeznaczenia** (sprzedajemy towary i usługi o różnych stawkach VAT),
więc podatek rozlicza się przy realizacji bonu, a nie przy jego sprzedaży. **Do potwierdzenia
z księgową.**

Panel: `POST /api/admin/giftcards` wydaje kartę i zwraca numer **raz**, `GET` listuje karty z saldem
i historią obciążeń, `PATCH` blokuje kartę zgłoszoną jako zgubioną. Numer losujemy generatorem
kryptograficznym, bo karta jest pieniądzem na okaziciela.

#### Regulamin karty: sekcja 7a

Karta nie mogła wejść na produkcję bez dokumentu, który wiąże strony. Sekcja „Zasady bez gwiazdek"
i FAQ na stronie karty to materiał informacyjny, nie regulamin. **Wiążąca jest sekcja 7a
`/terms/#sec-7a`**, 15 ustępów w trzech językach, obowiązuje od 2026-08-05.

Warunki, których nie wolno zgubić przy żadnej późniejszej zmianie, bo każdy z nich chroni albo
klienta, albo nas:

| Warunek | Dlaczego jest w dokumencie |
|---|---|
| Bon różnego przeznaczenia (art. 2 pkt 44 ustawy o VAT) | rozstrzyga moment powstania obowiązku podatkowego; **do potwierdzenia z księgową** |
| Karta **na okaziciela** | realizujemy dla każdego, kto poda numer, i nie badamy uprawnienia; bez tego zapisu każde wręczenie karty dalej byłoby sporne |
| Po 12 miesiącach karta nie działa w kasie, ale **środki nie przepadają** | patrz niżej: klauzula o przepadku jest w Polsce uznawana za abuzywną |
| Brak wymiany na gotówkę | inaczej karta byłaby instrumentem płatniczym, a to zupełnie inny reżim prawny |
| **14 dni na odstąpienie** od zakupu karty, o ile niewykorzystana | prawo konsumenta przy sprzedaży na odległość; wcześniej strona obiecywała to jako dobrą wolę |
| Zwrot rzeczy kupionej kartą wraca **na kartę** | bez tego zapisu klient płacący kartą byłby w gorszej sytuacji niż płacący przelewem, co jest niedozwolone |
| Kolejność: rabat → wysyłka → karta | ta sama reguła co w kodzie i w teście, żeby dokument i program mówiły to samo |

Strona karty linkuje do sekcji 7a w dwóch miejscach, a formularz zamówienia ma **wymagane
potwierdzenie zapoznania się z regulaminem**. Bez zaznaczenia nie da się wysłać zapytania.

Kartą nie można kupić innej karty. To jedyne wyłączenie przedmiotowe.

#### Przegląd rynku i korekta klauzuli o przepadku (2026-08-05)

Porównanie z praktyką rynkową potwierdziło konstrukcję, ale wykryło **jeden realny błąd prawny
w pierwszej wersji regulaminu**, który sam wprowadziłem.

**Zgodne z rynkiem, bez zmian:** 12 miesięcy ważności (Martes Sport, sklepzrowerami.pl, Gatta, DUKA
mają dokładnie tyle), karta na okaziciela, brak wymiany na gotówkę, częściowe wykorzystanie
z resztą na karcie. To standard, a nie eksperyment.

**Błąd:** pierwsza wersja § 7a ust. 5 mówiła, że po terminie ważności niewykorzystane środki
„nie podlegają zwrotowi ani wypłacie". To jest dokładnie ta klauzula, którą polskie sądy uznają za
**niedozwoloną** (art. 385(1) k.c.) i za **bezpodstawne wzbogacenie** (art. 405 k.c.):

- Sąd Rejonowy w Słupsku, 6 marca 2020, sprawa przeciwko Empik
- Sąd Rejonowy dla Warszawy-Mokotowa, 2022, przeciwko innej dużej sieci

Uzasadnienie jest krótkie i trudne do podważenia: zatrzymanie pieniędzy klienta bez żadnego
świadczenia wzajemnego rażąco narusza dobre obyczaje. Stosowanie klauzuli abuzywnej to również
ryzyko postępowania UOKiK, z karą do 10% obrotu.

**Poprawka:** upływ ważności odbiera możliwość zapłaty kartą bezpośrednio w kasie, ale **nie
powoduje przepadku**. Na wniosek przedłużamy ważność, wydajemy nową kartę na pozostałą kwotę albo
zwracamy środki. Zapis jest w regulaminie, w zasadach na stronie i w FAQ.

To nie jest ustępstwo, tylko przewaga: większość sieciówek te pieniądze zabiera, a my możemy
napisać wprost, że tego nie robimy. Data na karcie ma przypominać, a nie zarabiać.

**Dla porównania poza Polską:** Shopify domyślnie ustawia karty jako bezterminowe, bo w części
jurysdykcji termin ważności jest wprost nielegalny; w USA minimum ustawowe to 5 lat.

---

