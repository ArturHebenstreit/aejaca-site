# AEJaCA — audyt UI/UX, SEO i AIEO

*Przeprowadzono: 2026-08-04 i 2026-08-05 · Zakres: aejaca.com, pięć etapów*

Cel postawiony na wejściu: zwiększyć liczbę odwiedzających i maksymalizować konwersję sprzedażową. Audyt prowadzony „na zimno", na zbudowanym serwisie oglądanym w przeglądarce Chromium na szerokościach 390 px i 1440 px, w obu motywach, oraz na danych z Google Search Console.

---

## 1. Metoda i jej granice

Każde znalezisko w tym dokumencie było **mierzone**, a nie oszacowane. Tam, gdzie pomiar czegoś nie objął, jest to napisane wprost.

**Czego nie dało się sprawdzić:**

| Ograniczenie | Skutek |
|---|---|
| Brak dostępu do żywego aejaca.com (403 przez pośrednika sieciowego) | Oceniana jest wersja zbudowana z repozytorium. Dla UI i treści bez różnicy, ale realnych czasów ładowania z Cloudflare tak nie zmierzono. |
| Brak dostępu do bazy danych | Nie wykorzystano własnej analityki (`events`), która pokazałaby realne ścieżki i miejsca wyjścia. |
| Strony InPost niedostępne (403) | Ceny przesyłek pochodzą z doniesień o cenniku z 1 marca 2026, nie z odczytu u źródła. **Do potwierdzenia w aplikacji InPost Mobile.** |
| Brak eksportu ze Skuteczności w Search Console | Nie wiadomo, na jakich zapytaniach serwis jest widoczny i nieklikany. To zwykle najtańsze wygrane. |

**Pomyłki popełnione w trakcie i złapane przed zgłoszeniem.** Zapisane, bo pokazują, których wniosków nie należy przyjmować bez sprawdzenia:

- Pierwszy zrzut całej strony pokazał wielkie puste pasy. To była wina metody: sekcje odsłaniają się przy przewijaniu, a zrzut ich nie wyzwalał.
- Brak ceny i przycisku „Dodaj do koszyka" na karcie usługi wyglądał na zepsutą ścieżkę zakupową. Okazał się brakiem `VITE_CHAT_API_URL` w środowisku testowym.
- Strona B2B pokazała zero linków wychodzących. Ma własny formularz zapytania i konwertuje u siebie.
- Hasła słownika wyglądały na pozbawione danych strukturalnych. Mają `DefinedTerm` i `DefinedTermSet`; agregat testował pięć typów i tych dwóch nie obejmował.
- Hipoteza, że błędy hydracji powoduje leniwe ładowanie tras, została **zmierzona i obalona**.

---

## 2. Lista priorytetowa, stan na koniec audytu

### Wdrożone

| # | Znalezisko | Efekt zmierzony |
|---|---|---|
| 1 | Na komputerze żaden przycisk nie był widoczny bez przewijania (CTA na 1017 px, zgięcie na 900) | CTA na **805 px**, strona krótsza o 372 px |
| 2 | Nagłówek obiecywał wyłącznie biżuterię, przy połowie firmy w druku 3D i laserze | Nowy nagłówek obejmuje obie połowy, w trzech językach |
| 3 | Kalkulator „wycena w 30 sekund", jedyna przewaga nad konkurencją, leżał na trzecim ekranie | Przeniesiony nad sekcję o marce |
| 4 | Trustpilot z 2 opiniami eksponowany obok Google z 25, plus pusta sekcja widgetu | Próg `TRUSTPILOT_MIN_REVIEWS`, wracają samoczynnie |
| 5 | Strona główna nie miała żadnej ścieżki zakupowej, tylko wyceny | Sekcja „Zamów online" z realnym asortymentem |
| 6 | Sklep prowadził 1 gotowym produktem i 0 personalizowanych, chowając 12 usług na trzecim ekranie | Usługi na 740 px, ubogie sekcje pod nimi |
| 7 | Koszyk chował koszt dostawy do następnego kroku; przy zamówieniu 33 zł Paczkomat to połowa wartości | Koszty i pasek postępu do progu 400 zł w koszyku |
| 8 | **Trzy bloki na stronie wysyłki były trwale niewidoczne** (`reveal` bez `ref`): baner darmowej wysyłki, obowiązkowa informacja o cle, sekcja FAQ | Widoczne; strażnik `check-reveal` w buildzie |
| 9 | Blog i słownik były zamkniętą pętlą: 0 linków do oferty z listy wpisów i ze słownika | Domknięcia treści; wpisy 1 → 2–3 linki |
| 10 | 16 stron sklepu miało 499 linków przychodzących i nie oddawało z nich nic | Wpisy **5,6 → 7,9** linku, hasła **8,7 → 10,7** |
| 11 | `Disallow: /admin/` nie obowiązywał Googlebota ani botów AI (własne grupy w `robots.txt`) | Reguła w każdej z 13 grup |
| 12 | Niezgodność hydracji w pasku nawigacji (`/about` kontra `/about/`) | Drzewa 504 do 504, wcześniej 503 do 504 |
| 13 | 29 haseł słownika niosło definicję bez wskazania wydawcy | `publisher` i `inLanguage` w `DefinedTerm` |
| 14 | Terminy dostaw i ceny InPost nieaktualne, odbiór osobisty opisany jako Józefosław | UE i Wielka Brytania 5–10 dni, reszta świata 5–18, „Warszawa i najbliższe okolice" |

### Otwarte, wymagające decyzji właściciela

| # | Sprawa | Dlaczego nie zamknięte |
|---|---|---|
| A | **Trzy linki zewnętrzne do całego serwisu** (trustpilot ×2, reddit ×1), wszystkie z kotwicą ogólną | Największe ograniczenie widoczności. Nie da się tego naprawić kodem. |
| B | Błędy hydracji 418/423 na każdej stronie | Przyczyna zawężona do wnętrza granicy Suspense. Wariant „bez leniwych tras" zmierzony: **3,7× większa paczka i błędy zostają**. Odrzucony. |
| C | Ceny InPost do potwierdzenia | Paczkomat 16,49 zł, kurier 19,49 zł. Kurier **tanieje o 5,41 zł**, czyli zmienia się to, ile płaci klient. |
| D | Siedem stron blokowanych przez `robots.txt` wg Search Console | Jedyna reguła blokująca to `/admin/`. Potrzebna lista adresów z panelu. |
| E | Katalog: **1 gotowy produkt** ze stanem 1 | Siatka zaczyna wyglądać na ofertę od około sześciu pozycji ze zdjęciami. To praca po stronie studia, nie kodu. |
| F | Hasła słownika są cienkie: 1 nagłówek H2, brak dat i FAQ | Praca redakcyjna na 29 haseł. |
| G | Odbiór opisany jako Warszawa, adres w danych strukturalnych to Józefosław | **Nie zmieniać adresu w wizytówce Google.** Ustawić obszar działalności. Schemat już to obsługuje: promień 30 km. |

---

## 3. Dane wyjściowe warte zapamiętania

### Rozkład linków wewnętrznych (na zbudowanym serwisie)

| Grupa | Stron | Śr. linków na stronę |
|---|---|---|
| Oferta | 3 | 226,3 |
| Regulaminowe | 5 | 210,8 |
| Strony lokalne | 2 | 94,0 |
| Sklep | 16 | 31,2 |
| Hasło słownika | 29 | 10,7 |
| Wpis blogowy | 18 | 7,9 |

Polityka prywatności ma nadal **27 razy więcej linków wewnętrznych niż wpis blogowy** (przed audytem 38 razy). Regulaminów nie da się odlinkować, bo część musi być dostępna przy zamawianiu, więc jedyną dźwignią jest podnoszenie treści.

Miernik: `npm run link-graph`. Świadomie **nie jest wpięty w build**: nie ma tu progu, który dałoby się uczciwie ustawić.

### Cytowalność przez asystentów AI

| Grupa | Schematy | Autor | Daty | H2 na stronę |
|---|---|---|---|---|
| Wpisy blogowe (18) | Article + FAQPage + Organization | tak | tak | **7,8** |
| Karty usług (12) | Service + Offer + Organization | tak | nie | 4,8 |
| Hasła słownika (29) | DefinedTerm + DefinedTermSet + Organization | tak | nie | **1,0** |

Blog jest wzorowy i nie wymaga zmian. Słabym ogniwem są hasła słownika: właściwy typ schematu, ale zbyt mało treści, żeby konkurować o cytowanie.

### Search Console, stan zastany

- Zindeksowane 63 z 90 stron w mapie witryn
- Mapa witryn: pięć zgłoszeń, cztery błędne (w tym literówka `sitemap.xlm` z sierpnia 2025); właściwa czytana ostatnio 23 kwietnia i widziała 20 adresów zamiast 90
- Linki zewnętrzne: **3**

---

## 4. Co robić dalej, w kolejności wpływu

1. **Zbudować linki zewnętrzne.** Trzy linki to statystycznie zero. Bez tego w konkurencyjnych frazach („druk 3D Warszawa", „grawerowanie laserowe") sam serwis nie wystarczy.
2. **Uzupełnić katalog gotowych produktów.** Pas na stronie głównej i sekcja w sklepie wskoczą same po przekroczeniu progu.
3. **Podesłać eksport ze Skuteczności w Search Console.** Pokaże strony widoczne i nieklikane, czyli najtańsze wygrane.
4. **Potwierdzić ceny InPost** i zdecydować o obniżce kuriera.
5. **Ustawić obszar działalności w wizytówce Google**, bez zmiany adresu.
6. **Rozbudować hasła słownika** o zastosowanie, jedno pytanie FAQ i datę aktualizacji.
7. **Dokończyć diagnozę hydracji**, gdy będzie na to spokojna głowa. Wymaga budowy z prawdziwą wersją rozwojową Reacta.

---

## 5. Narzędzia zostawione w repozytorium

| Narzędzie | Do czego |
|---|---|
| `npm run link-graph` | Rozkład linków wewnętrznych, do porównywania w czasie |
| `npm run audit:serve` | Serwer podający `dist/` wraz z prawdziwym `/api/price`, pozwala przejść ścieżkę zakupową lokalnie |
| `scripts/check-reveal.mjs` | Strażnik w buildzie: `reveal` bez `ref` przerywa budowanie |

Serwer audytowy uruchamiać z `VITE_CHAT_API_URL` wskazującym na niego, inaczej paczka nie wie, dokąd wołać, i konfigurator milczy.
