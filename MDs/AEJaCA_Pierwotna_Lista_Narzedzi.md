# Pierwotna lista narzędzi: status

*Lista powstała z badania rynku i luk w serwisie. Ten plik istnieje dlatego, że
dotąd żyła wyłącznie w rozmowie, a rozmowa się kończy. Aktualizuj status przy
każdej zamkniętej pozycji.*

*Ostatnia aktualizacja: 2026-08-05.*

---

## Stan

| # | Pozycja | Status | Gdzie to jest |
|---|---|---|---|
| 1 | Miarka do pierścionków do wydruku (PDF + pasek) | **gotowe** | `/toolsjewelry/ring-sizer` |
| 2 | Kalkulator „ile warte jest moje złoto" + przelicznik prób | **gotowe** | `/toolsjewelry/metal-pricing` |
| 3 | Sprawdzarka pliku STL („czy to się wydrukuje") | **gotowe** | `/toolstudio/printability` + brama przy zamawianiu |
| 4 | Konfigurator obrączek / pierścionka z podglądem | **odłożone po prototypie** | `parked/ring-poc/`, plan w `MDs/AEJaCA_Konfigurator_Pierscionka_Plan.md` |
| 5 | Karta podarunkowa | **odłożona, wycofana z kodu** | `parked/gift-card/` |
| 6 | Zapisana wycena z linkiem | **do zrobienia** | silnik istnieje w `chat-api/quotes.js`, nie jest wpięty w serwis |

---

## Treść pozycji, tak jak zostały opisane

**1. Miarka do pierścionków do wydruku.** Najtańsza pozycja i najwyższy stosunek
efektu do pracy. Osobna, mocno wyszukiwana fraza, którą ma każdy liczący się
sklep jubilerski jako oddzielną stronę lądowania. Konwerter tabel jest dla kogoś,
kto **zna** swój rozmiar; ruch jest tam, gdzie ktoś go nie zna.

**2. Kalkulator wartości kruszcu.** Silnik (spot XAU/XAG/XPT, kurs NBP) już stał.
Brakowało strony w języku, jakim pyta klient. Zastrzeżenie, które zostało wdrożone:
jawnie piszemy, że to wartość kruszcu, a **nie cena skupu** (realnie 70 do 90 procent).

**3. Sprawdzarka STL.** Nasz wyróżnik. W polskim segmencie małych usługodawców
nie ma tego nikt. Efekt nie jest tylko SEO: zdejmuje lęk przed kliknięciem
„zamawiam" i wycina nieudane zlecenia, które kosztują materiał i czas.

**4. Konfigurator z podglądem.** W polskim jubilerstwie to standard kategorii,
nie przewaga. Najdroższa pozycja z listy. Prototyp dowiódł, że geometria się liczy
i drukuje; nie dowiódł, że wygląda ładnie.

**5. Karta podarunkowa.** Zbudowana, poprawiona prawnie i wycofana bez wdrożenia.
Wymaga popytu, którego nie widać, a bon to zobowiązanie w księgach na 12 miesięcy.

**6. Zapisana wycena z linkiem.** Konfiguracja druku z plikiem to kilka minut
pracy klienta i dziś ginie przy zamknięciu karty. „Wyślij wycenę na maila lub
skopiuj link" daje powód do powrotu i adres e-mail przy okazji.

---

## Czego świadomie nie ma na liście

Kolejnych wpisów blogowych. Blog jest już wzorowy pod kątem danych strukturalnych,
a wąskim gardłem z audytu pozostają **linki zewnętrzne**, nie ilość treści.

---

## Źródła badania

[Jubisfera, przelicznik prób](https://www.jubisfera.pl/PL-H113/przelicznik-prob-zlota.html) ·
[Kalkula, kalkulator złota](https://kalkula.pl/finanse/zloto/) ·
[Blue Nile / RingSizePro, miarki do druku](https://ringsizepro.com/printable-ring-sizer) ·
[Protolabs Network, analiza DFM](https://www.hubs.com/knowledge-base/dfm-tips-for-3d-printed-parts-with-thin-walls/) ·
[Protolabs ProDesk](https://www.3printr.com/protolabs-launches-prodesk-instant-quotes-with-ai-driven-dfm-for-3d-printing-cnc-and-injection-molding-0286963/) ·
[Jubiler Sezam, konfigurator 3D](https://www.jubilersezam.pl/konfigurator-obraczek-3d) ·
[Geselle, konfigurator](https://geselle.pl/personalizowane-obraczki-konfigurator/) ·
[Goldrun, FAQ o korekcie rozmiaru](https://goldrun.pl/faq)
