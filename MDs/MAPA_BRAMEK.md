# Mapa bramek buildu

> **Ten plik jest generowany.** Nie poprawiaj go recznie: zmiany zniknie przy
> nastepnym `node scripts/mapa-bramek.mjs`. Tytul i powod bierza sie
> z naglowka kazdego skryptu, kolejnosc z lancucha `build` w `package.json`.
> Chcesz zmienic opis bramki, zmien komentarz na jej gorze.

`npm run build` uruchamia **87** sprawdzianow, zanim cokolwiek
zbuduje. Kazdy powstal po konkretnej awarii i pilnuje, zeby ta sama awaria nie
wrocila. Build zatrzymuje sie na pierwszym, ktory padnie, wiec kolejnosc ma
znaczenie: najtansze i najczestsze stoja z przodu.

Wszystkie sa **twarde**. Nie ma tu ostrzezen, ktore mozna zignorowac: bramka
albo przepuszcza, albo zatrzymuje wdrozenie.

| # | Skrypt | Czego pilnuje | Dlaczego powstal |
|---|---|---|---|
| 1 | `scripts/sync-pricing.mjs` | SYNC PRICING CORE -> chat-api/pricing/ | Railway buduje chat-api z katalogu chat-api jako root, wiec backend nie widzi src/. Zamiast duplikowac formuly, kopiujemy tu rdzen z src/pricing i src/data/resins.js, a `--check` pilnuje, zeby kopie nie odjechaly od oryginalu. |
| 2 | `scripts/test-precious-metal-casting.mjs` | **brak naglowka** | KOLBA JEST JEDYNYM ZRODLEM ROZMIARU. Limit modelu ma sie z niej liczyc, a nie stac obok niej wpisany z reki: przy poprzedniej wersji te dwie liczby zyly osobno i rozjechaly sie po pierwszej zmianie sprzetu. |
| 3 | `scripts/test-binding-basis.mjs` | KWOTA WIAZACA WYMAGA PODSTAWY, KTORA DA SIE ZMIERZYC | Awaria, ktora ten test zamyka, byla cicha i kosztowna po naszej stronie. |
| 4 | `scripts/test-offer-payment.mjs` | ZAPLATA ZA OFERTE: PIENIADZE, KOD RABATOWY I TRANSAKCJA | Ta sciezka jest jedynym miejscem w serwisie, w ktorym klient placi za kwote ustalona przez czlowieka, a nie policzona przez silnik. |
| 5 | `scripts/check-undefined-calls.mjs` | KONTROLA WYWOLAN NIEZADEKLAROWANYCH FUNKCJI | Powod powstania: brakujacy import w chat-api/server.js przeszedl przez `node --check`, bo skladnia byla poprawna, i ujawnil sie dopiero jako ReferenceError przy zamowieniu klienta, na produkcji. |
| 6 | `scripts/check-light-theme.mjs` | KONTROLA CZYTELNOSCI W TRYBIE JASNYM | Tryb jasny nie dziala tu przez warianty `dark:`, tylko przez liste nadpisan w src/index.css: `[data-theme="light"] .jakas-klasa { ... }`. Klasa spoza tej listy zostaje w kolorze przeznaczonym na czarne tlo, wiec jasny tekst albo ciemne tlo staja sie na kremowym tle niewidoczne. |
| 7 | `scripts/check-browser-storage.mjs` | CO SERWIS ZAPISUJE W URZADZENIU ODWIEDZAJACEGO | Art. 398 Prawa komunikacji elektronicznej wymaga zgody na przechowywanie informacji w urzadzeniu koncowym, poza tym, co niezbedne do wykonania uslugi zadanej przez uzytkownika. |
| 8 | `scripts/check-reveal.mjs` | STRAZNIK ODSLONIEC PRZY PRZEWIJANIU | `.reveal` w src/index.css ustawia `opacity: 0` i przesuniecie. |
| 9 | `scripts/check-lazy-hydration.mjs` | HYDRATACJA NIE MOZE PORZUCAC PRERENDERU | Kazda strona poza glowna wchodzi przez `lazy()`. Gdy hydratacja rusza, zanim fragment trasy sie sciagnie, granica `Suspense` zawiesza sie w jej trakcie, React porzuca gotowy HTML i rysuje strone od nowa po stronie klienta. |
| 10 | `scripts/check-drobny-tekst.mjs` | DOLNA GRANICA WIELKOSCI PISMA | Przeglad wszystkich stu stron w przegladarce (27 sierpnia 2026) naliczyl 1033 napisy mniejsze niz dwanascie pikseli, na kazdej stronie serwisu. |
| 11 | `scripts/check-hero-images.mjs` | CZY WARIANTY OBRAZOW BOHATERSKICH NAPRAWDE LEZA | `src/data/heroObrazy.js` sklada `srcset` z listy szerokosci. |
| 12 | `scripts/check-card-images.mjs` | WARIANTY OBRAZOW W KAFELKACH: CZY LEZA I CZY KTOS Z NICH KORZYSTA | `src/data/obrazyWarianty.js` jest generowany przez `scripts/build-card-images.mjs` i mowi, w jakich szerokosciach lezy kazdy obraz. |
| 13 | `scripts/check-kraje.mjs` | LISTA KRAJOW: WYSYLKA KONTRA NAZWY | `src/pricing/shipping.js` mowi, DOKAD wysylamy. |
| 14 | `scripts/check-czas-w-renderze.mjs` | CZAS W RENDERZE, CZYLI CICHY ZABOJCA PRERENDERU | Sto stron tego serwisu jest rysowanych przy buildzie i wysylanych gotowe. |
| 15 | `scripts/check-slownik-jako-funkcja.mjs` | SLOWNIK JEST OBIEKTEM, NIE FUNKCJA | `useLanguage()` oddaje `t` jako zwykly obiekt: pisze sie `t.nav.currency`. Napisane jak w bibliotekach i18n, czyli `t("nav.currency")`, przechodzi build, przechodzi lint i wywala sie dopiero w przegladarce. |
| 16 | `scripts/check-hooki-po-wyjsciu.mjs` | HOOK PO WCZESNYM WYJSCIU Z KOMPONENTU | Komponent, ktory ma `return` w polowie, a hook ponizej niego, dziala dopoki warunek wyjscia sie nie zmieni przy zywym komponencie. |
| 17 | `scripts/check-nazwy-dostepne.mjs` | NAZWA DLA CZYTNIKA EKRANU JEST W JEZYKU STRONY | Kontrolka bez widocznego napisu (ikona, strzalka, krzyzyk, plus) musi miec `aria-label`, bo inaczej czytnik ekranu przeczyta "przycisk" i tyle. |
| 18 | `scripts/check-emdash.mjs` | STRAZNIK DLUGICH MYSLNIKOW | Wlasciciel ma twarda zasade pisowni: zaden dlugi myslnik (U+2014) ani ani encja HTML nie ma prawa pojawic sie w tresci, w komentarzach, w kodzie ani w commitach. |
| 19 | `scripts/check-rodzaj-meski.mjs` | POLSKI TEKST DO KLIENTA NIE ZGADUJE PLCI | Klientka Anna dostala maila ze zdaniem "wycena, ktora zapisales" i to nie byla literowka, tylko wzorzec: "odebrales przesylke" w pouczeniu o odstapieniu, "potwierdziles polecenie wykonania wydruku" przy uwagach do modelu, "zgubiles link" na stronie procesu, "jak wybrales przy zamowieniu" w FAQ. Dwadziescia dwa miejsca naraz (poprawione 2026-08-30, polecenie wlasciciela). |
| 20 | `scripts/check-csp-wasm.mjs` | STRAZNIK: CSP kontra WebAssembly | Serwis uruchamia WebAssembly w przegladarce w dwoch miejscach: `occt-import-js` czyta pliki STEP wgrywane przez klienta, a `manifold-3d` buduje bryle w kreatorze pierscionkow. |
| 21 | `scripts/check-tool-links.mjs` | STRAZNIK REJESTRU ODNOSNIKOW DO NARZEDZI | Powstal, bo `src/data/toolLinks.js` mial trzy klucze wskazujace na slugi wpisow, ktore nie istnieja: "pierscionek-zareczynowy" zamiast "pierscionek-zareczynowy-na-zamowienie" i dwa podobne. |
| 22 | `scripts/check-adresy-seo.mjs` | STRAZNIK PELNYCH ADRESOW W DANYCH STRUKTURALNYCH | `SITE.url` z `src/seo/seoData.js` to goly adres serwisu, czyli adres POLSKI. Kazde miejsce, ktore skleja `${SITE.url}/about/` z reki, produkuje adres polski takze na stronie niemieckiej. |
| 23 | `scripts/check-faq-zbior.mjs` | KTO WOZI CALY ZBIOR PYTAN | Pytania mieszkaja przy swoich dziedzinach, a `src/data/faq/index.js` scala je w komplet. |
| 24 | `scripts/check-terms-parity.mjs` | STRAZNIK ZGODNOSCI REGULAMINU MIEDZY JEZYKAMI | Regulamin zyje w trzech wersjach jezykowych w jednym pliku i kazda zmiana dotyka wszystkich trzech. |
| 25 | `scripts/check-adr.mjs` | FORMAT DECYZJI ARCHITEKTONICZNYCH | `MDs/decisions/README.md` opisuje jeden szablon: front matter YAML ze statusem, wlascicielem i data. |
| 26 | `admin/check-styles.mjs` | KONTROLA ARKUSZA PANELU | Panel przestal ciagnac Tailwind z cudzego serwera i buduje arkusz u siebie (`npm run build:css`). |
| 27 | `admin/check-views.mjs` | KONTROLA SZABLONOW PANELU | Szablon panelu nie przechodzi przez zaden build: EJS kompiluje sie dopiero przy zadaniu. |
| 28 | `scripts/check-shop-images.mjs` | KONTROLA ZDJEC PRODUKTOW | Zdjecia produktow leza w repozytorium, a baza trzyma do nich sciezki. |
| 29 | `scripts/test-payment-groups.mjs` | **brak naglowka** | Podzial kanalow platnosci. Pilnowana regula jest jedna: BLIK stoi na wierzchu, a banki schodza pod zwijany wiersz. |
| 30 | `scripts/test-customer-fields.mjs` | **brak naglowka** | Kontrola danych klienta. Ta sama funkcja pilnuje formularza i zamowienia na serwerze, wiec bledny przypadek tutaj to bledna paczka w realu. |
| 31 | `scripts/test-price-history.mjs` | **brak naglowka** | Najnizsza cena z 30 dni. Liczba pokazywana klientowi jako fakt, wiec test pilnuje przede wszystkim tego, KIEDY jej NIE pokazywac: informacja o obnizce przy cenie, ktora nie zostala obnizona, wprowadza w blad. |
| 32 | `scripts/test-backup-n8n.mjs` | **brak naglowka** | Kopia przeplywow n8n. Dwie rzeczy moga tu zawiesc po cichu i obie sa grozne: wpisanie sekretu do repozytorium oraz kopia, ktora przy kazdym uruchomieniu wyglada jak zmiana, przez co nikt jej nie oglada. |
| 33 | `scripts/test-mesh-formats.mjs` | **brak naglowka** | Ten sam szescian 20x10x5 mm zapisany jako STL, OBJ i 3MF musi dac identyczna objetosc, pole i gabaryty. |
| 34 | `scripts/test-printability.mjs` | **brak naglowka** | Analiza drukowalnosci: topologia, gabaryty, grubosc scianek, nawisy. |
| 35 | `scripts/test-print-consent.mjs` | KOLEJNOSC: NAJPIERW NAPRAWA, POTEM POKWITOWANIE | Bramka zaczynala od alarmu i zadania podpisu. |
| 36 | `scripts/test-saved-quote.mjs` | ZAPISANA WYCENA: CO SIE PRZELICZA, A CO ZOSTAJE | Obietnica zlozona klientowi brzmi: robocizna jest wiazaca przez caly okres waznosci, a kruszec liczy sie z dnia zamowienia. |
| 37 | `scripts/test-order-seam.mjs` | SZEW MIEDZY KOSZYKIEM A ZAMOWIENIEM | 2026-08-16 przyszlo oplacone BLIKiem zlecenie na znakowanie laserem, w ktorym byl sam plik i ani jednego zdania o tym, co z nim zrobic. |
| 38 | `scripts/test-mail-klienta.mjs` | MAILE DO KLIENTA: JEDNA SZATA, JEDEN PODPIS, WLASCIWE ODNOSNIKI | Maile wychodzily w trzech roznych wygladach i z trzema roznymi podpisami, a klient dostaje je jeden po drugim od tej samej firmy. |
| 39 | `scripts/test-inbound-delivery.mjs` | DEKLARACJA DOSTARCZENIA PRZEDMIOTU PRZEZ KLIENTA | Zasada wlasciciela z 2026-08-16: gdy klient ma nam COS PRZYSLAC (wlasna deska pod grawer, wlasne kamienie, bizuteria do naprawy), musi PRZED ZAPLATA powiedziec, jak to zrobi. |
| 40 | `scripts/test-laser-substrate.mjs` | PODLOZE USLUGI LASEROWEJ | Wlasciciel zglosil 2026-08-18: przy grawerze na bizuterii albo innym przedmiocie klienta dalo sie wybrac "wasz material". To nie byla usterka formularza, tylko modelu: jedno pole logiczne `ownMaterial` opisywalo dwie rozne sytuacje, przedmiot klienta i material klienta, i przez to trzecia, bezsensowna, byla wyrazalna. |
| 41 | `scripts/test-laser-bed.mjs` | LASER TEZ MA POLE ROBOCZE, I TEZ NIE WOLNO GO PRZEKROCZYC | Druk 3D mial te granice od dawna. Lasery nie mialy jej w ogole, wiec rysunek 573,9 x 901,0 mm dostal kwote wiazaca 497,83 zl. |
| 42 | `scripts/test-our-stock.mjs` | WYBOR MATERIALU Z MAGAZYNU MUSI ZMIENIAC CENE | Przy "Na waszym materiale" bylo puste pole tekstowe. |
| 43 | `scripts/test-material-stock.mjs` | TABELA MATERIALOW: czy liczby w niej i w kodzie mowia to samo | Ceny materialow to jedyne dane w wycenie, ktore pochodza SPOZA nas: rynek je ustala, my je tylko przepisujemy. |
| 44 | `scripts/test-cart-contract.mjs` | POZYCJA W KOSZYKU JEST TRESCIA UMOWY | Klient placi za to, co widzi w koszyku, i tylko na to sie zgadza. |
| 45 | `scripts/test-laser-capabilities.mjs` | CO MASZYNA UMIE ZROBIC, A CZEGO NIE | Ten test pilnuje jednej rzeczy: zeby oferta nie obiecala roboty, ktorej maszyna nie wykona. |
| 46 | `scripts/test-advanced-options.mjs` | PODPOWIEDZ O TRYBIE ZAAWANSOWANYM: czy mowi prawde | Podpowiedz obiecuje klientowi konkret: tyle a tyle filamentow, takie a takie parametry, przycisk prowadzacy do wlasciwej zakladki. |
| 47 | `scripts/test-vector-preview.mjs` | PODGLAD RYSUNKU: czy pokazuje rysunek, czy arkusz | Podglad rysunku ma jedno zadanie: pozwolic klientowi sprawdzic, ze wgral ten plik, ktory chcial. |
| 48 | `scripts/test-dxf.mjs` | DXF MUSI LICZYC TO SAMO, CO SVG DLA TEGO SAMEGO KSZTALTU | Kafelek wyboru pliku obiecywal "SVG, DXF, AI, PDF", a wycenic umielismy sam SVG. Reszta szla do wyceny recznej, mimo ze DXF jest formatem tekstowym stworzonym wprost do maszyn i niesie dokladnie te dane, ktore sa potrzebne. |
| 49 | `scripts/test-quantity.mjs` | LICZBA SZTUK I PROG NAKLADU | Do 2026-08-18 klient wybieral PROG, a liczba sztuk ustawiala sie sama na dolnej granicy przedzialu. |
| 50 | `scripts/test-terminy.mjs` | SZACOWANY CZAS REALIZACJI | Termin jest obietnica wobec klienta i jednoczesnie danymi, z ktorych kolejka pracowni liczy, co jest spoznione. |
| 51 | `scripts/test-grawer.mjs` | CENNIK GRAWERU: prog, polowa ceny i doplata od sztuki | Polecenie wlasciciela, 2026-09-03: powyzej 400 zl ceny sztuki inicjaly wchodza w cene, a grafika i dluzszy tekst kosztuja polowe; ponizej progu jest to 50 i 100 zl. |
| 52 | `scripts/test-prezent.mjs` | KOD PREZENTOWY: wystawianie i wreczanie | Polecenie wlasciciela, 2026-09-03: jeden formularz ma wystawic kod i albo wyslac go mailem, albo zapisac do wreczenia inna droga. |
| 53 | `scripts/test-opis-pozycji.mjs` | CO KLIENT ZAMOWIL, TAK SAMO W KOSZYKU, W MAILU I NA STRONIE | Zgloszenie wlasciciela z 2026-09-03, po prawdziwym zamowieniu AE20260903: mail do pracowni niosl surowy JSON parametrow, a potwierdzenie dla klientki nie nioslo ich wcale. |
| 54 | `scripts/test-wiedza-asystenta.mjs` | ASYSTENT MOWI TO, CO ROBI SERWIS | Wiedza asystenta (`chat-api/context.js`) to szescdziesiat kilobajtow tekstu pisanego recznie, w ktorym stoja KWOTY I TERMINY. Kod obok zmienia sie dalej, a tekst nie ma jak sie o tym dowiedziec. |
| 55 | `scripts/test-print-scale.mjs` | WIELKOSC WYDRUKU A POLE ROBOCZE MASZYNY | Po wgraniu pliku cena liczy sie z JEGO wymiarow, a nie z listy rozmiarow. |
| 56 | `scripts/test-dim-scale.mjs` | SKALA W OSOBNYCH OSIACH: czy liczby mowia to, co pokazujemy | Skala nierownomierna psuje sie po cichu na cztery sposoby i za kazdym razem kwota oraz podglad wygladaja poprawnie:. |
| 57 | `scripts/test-engrave-coverage.mjs` | POKRYCIE RYSUNKU W GRAWERZE: czy liczymy droge glowicy, a nie kartke | Do 2026-08-21 grawer liczyl sie z PROSTOKATA OPISANEGO na rysunku. |
| 58 | `scripts/test-model-handoff.mjs` | PRZEKAZANIE MODELU I SKALA, W KTOREJ GO ANALIZUJEMY | Dwie rzeczy, ktore latwo rozjechac, bo obie zyja po dwoch stronach szwu. |
| 59 | `scripts/test-simple-quote.mjs` | SZYBKA WYCENA MUSI LICZYC Z WGRANEGO PLIKU | Awaria, ktora ten test zamyka, byla cicha i kosztowna. |
| 60 | `scripts/test-size-slider.mjs` | TEST LOGIKI SUWAKA WIELKOSCI (bez React) | Sprawdza wylacznie funkcje wyeksportowane z SizeSlider.jsx: categoryForCm, posToCm, cmToPos, RANGE_STEPS. |
| 61 | `scripts/test-price-breakdown.mjs` | ROZPISKA CENY NIE MOZE NAZYWAC RABATU, ALE MUSI GO ZAWIERAC | Rynek polski ma 15 procent taniej. Wczesniej stalo to w rozpisce osobnym wierszem "Rabat rynek polski (-15%)". Sprzedawalo to zle: klient czyta taki wiersz jako cene wyjsciowa podbita po to, zeby bylo co odejmowac, i zaczyna szukac haczyka. |
| 62 | `scripts/test-quote-summary.mjs` | PODSUMOWANIE W MAILU MUSI NIESC TO, CO KLIENT WIDZIAL | Do maila szedl jeden string obciety do tysiaca znakow: sama lista wyborow. |
| 63 | `scripts/test-mesh-units.mjs` | PLIK W METRACH NIE MOZE PRZEJSC ZA MODEL DWUMILIMETROWY | STL i OBJ nie niosa jednostki, wiec czytamy je jak milimetry. |
| 64 | `scripts/test-live-pricing.mjs` | ZYWE DANE MUSZA DOCIERAC DO KWOTY WIAZACEJ | Kalkulatory jubilerskie biora dane rynkowe DODATKOWYMI ARGUMENTAMI:. |
| 65 | `scripts/test-production-queue.mjs` | KOLEJKA PRACOWNI: ETAPY, PRZEJSCIA I KOLUMNY POD NIMI | `chat-api/productionQueue.js` zostal wydzielony z serwera po to, zeby regule przejsc dalo sie sprawdzic bez stawiania bazy. |
| 66 | `scripts/test-wlasny-ruch.mjs` | WLASNY RUCH: WIDAC GO, DA SIE GO WYLACZYC, I NIKT NIE UDAJE, ZE WIE WIECEJ | Wlasciciel oglada swoj serwis czesciej niz ktokolwiek inny, wiec jego wejscia zawyzaja kazdy wykres. |
| 67 | `scripts/test-zamkniecie-sprawy.mjs` | CZTERY DROGI WYJSCIA ZE SPRAWY, KAZDA Z INNA KWOTA | "Anulowane" bylo jednym slowem na cztery zdarzenia, ktore regulamin rozroznia: odstapienie konsumenta w 14 dni, nasze niedowiezienie, nasza odmowa i rezygnacja z rzeczy robionej na zamowienie. |
| 68 | `scripts/check-daty.mjs` | DATA Z BAZY NIE JEST NAPISEM | Sterownik bazy oddaje kolumne DATE i TIMESTAMPTZ jako OBIEKT Date. |
| 69 | `scripts/test-daty-z-bazy.mjs` | DATA Z BAZY DOCHODZI DO KLIENTA JAKO DATA | Sterownik bazy oddaje kolumne DATE jako OBIEKT Date. |
| 70 | `scripts/test-lead-z-maila.mjs` | MAIL STAJE SIE SPRAWA DOPIERO Z NASZEJ DECYZJI | Do 1 wrzesnia 2026 dzialaly tu dwa mechanizmy naraz i zaden nie robil tego, co trzeba. |
| 71 | `scripts/test-lista-zgloszen.mjs` | LISTA ZGLOSZEN: LICZNIKI FILTRUJA, WIERSZ SIE ROZWIJA | Kafelki u gory strony byly ozdoba: mowily "Skontaktowano 36" i nic sie po nich nie dzialo. |
| 72 | `scripts/test-quote-edit.mjs` | EDYCJA OFERTY: POZYCJE, KWOTY I UKLAD WYBORU | Wycena powstaje z zapytania przepisanego ze skrzynki albo z rozmowy, wiec literowka w adresie i zla ilosc sa tu norma. |
| 73 | `scripts/test-offer-currency.mjs` | WALUTA OFERTY I ZAPLATY | Do tej pory walute rozstrzygal jezyk: pl znaczylo zlotowki, en i de euro. |
| 74 | `scripts/test-ring-generator.mjs` | GENERATOR PIERSCIONKOW: prog akceptacji etapu pierwszego | Cztery rzeczy, ktore musza sie zgadzac, zanim powstanie jakikolwiek ekran:. |
| 75 | `scripts/test-ring-pricing.mjs` | KREATOR PIERSCIONKOW: prog akceptacji etapu drugiego | Wycena ma jedna wlasciwosc, ktorej nie da sie sprawdzic okiem: czy liczby, od ktorych zalezy, w ogole do niej docieraja. |
| 76 | `chat-api/rates.test.mjs` | KURSY KRUSZCOW: kontrola wieku | `currentMetalRates` bierze najnowsza niepusta wartosc, nie patrzac na jej wiek. |
| 77 | `chat-api/kodyRabatowe.test.mjs` | KOD RABATOWY PAMIETA, W JAKIM JEZYKU GO WYSTAWILISMY | Przypomnienie o kodzie wychodzi czterdziesci dni po zapisie. |
| 78 | `chat-api/zrodlaRuchu.test.mjs` | SKAD PRZYSZLA WIZYTA: SPRAWDZIAN KLASYFIKACJI | Kanal ruchu jest liczba, na ktorej opiera sie decyzja "gdzie pisac dalej". Zle przypisany kanal nie wyglada na blad: wyglada na to, ze Instagram nie dziala, a wyszukiwarka dowozi, albo odwrotnie. |
| 79 | `chat-api/numerSprawy.test.mjs` | KAZDA SPRAWA MA NUMER, I TO JEDEN | Zgloszenie z formularza dostawalo numer od poczatku, ale mail przyslany wprost na skrzynke juz nie, a numeru nie bylo widac ani w panelu, ani w potwierdzeniu do klienta. |
| 80 | `admin/analityka.test.mjs` | ANALITYKA: CZEGO PILNUJEMY W ZAPYTANIACH KOKPITU | Zapytania analityczne maja te wlasciwosc, ze BLAD W NICH JEST NIEWIDOCZNY. Zle policzona konwersja nie wywala strony, tylko pokazuje liczbe, ktora wyglada wiarygodnie, i na jej podstawie zapada decyzja. |
| 81 | `scripts/test-chat-api.mjs` | TESTY BACKENDU IDA RAZEM Z BUILDEM STRONY | `chat-api` ma wlasny zestaw testow i wlasny `npm test`, ktory trzeba bylo pamietac, zeby uruchomic. |
| 82 | `scripts/test-chat-api-boot.mjs` | CZY SERWER API W OGOLE WSTAJE | Awaria, ktora ten test zamyka, polozyla `chat-api` na produkcji i nie zauwazyl jej ani build, ani eslint, ani zaden z pozostalych piecdziesieciu skryptow. |
| 83 | `scripts/derive-service-prices.mjs` | CENY "OD" NA KARTACH USLUG, WYPROWADZONE Z SILNIKA | Etykieta "od X PLN" byla wpisywana recznie i rozjechala sie z cennikiem: jedne uslugi obiecywaly cene, ktorej nie dalo sie kupic, inne odstraszaly progiem dwa razy wyzszym niz prawdziwy. |
| 84 | `scripts/build-sitemap.mjs` | MAPA WITRYNY DLA TRZECH JEZYKOW | Od 27 sierpnia 2026 kazda strona stoi pod trzema adresami: polskim golym, angielskim pod `/en/` i niemieckim pod `/de/`. Mapa witryny musi wymienic wszystkie trzy i przy kazdym powiedziec, gdzie sa pozostale dwa, inaczej wyszukiwarka potraktuje je jak trzy osobne strony o tej samej tresci. |
| 85 | `scripts/mapa-bramek.mjs` | SPIS BRAMEK BUILDU, PISANY PRZEZ BRAMKI | `npm run build` uruchamia kilkadziesiat sprawdzianow, zanim cokolwiek zbuduje. |
| 86 | `scripts/copy-occt-wasm.mjs` | JADRO CAD DLA PRZEGLADARKI | occt-import-js sklada sie z modulu JS i pliku .wasm, ktory ten modul sciaga w czasie dzialania. |
| 87 | `scripts/prerender.mjs` | **brak naglowka** | SZABLONEM JEST WYNIK `vite build`, A NIE POPRZEDNI WYNIK TEGO SKRYPTU. `dist/index.html` sluzy tu za szablon i jest zarazem pierwszym plikiem, ktory ten skrypt nadpisuje. |

## Bramki bez naglowka (8)

Konwencja projektu mowi, ze kazda bramka niesie u gory ramke z tytulem i akapit
o tym, co poszlo zle. Ponizsze go nie maja, wiec ich powodu nie da sie
odczytac inaczej niz czytajac caly kod. Kto bedzie przy nich pracowal, niech
dopisze naglowek: regula, ktorej powodu nikt nie pamieta, zostaje przy pierwszej
okazji wylaczona jako uciazliwa.

- `scripts/test-precious-metal-casting.mjs`
- `scripts/test-payment-groups.mjs`
- `scripts/test-customer-fields.mjs`
- `scripts/test-price-history.mjs`
- `scripts/test-backup-n8n.mjs`
- `scripts/test-mesh-formats.mjs`
- `scripts/test-printability.mjs`
- `scripts/prerender.mjs`


## Bramki spoza tego lancucha

Trzy sprawdziany NIE stoja w `npm run build`, bo wymagaja przegladarki,
a build leci na Cloudflare Pages, gdzie przegladarki nie ma. Uruchamia sie je
na maszynie lokalnej:

| Polecenie | Co robi |
|---|---|
| `npm run check:jezyk` | klika w przelacznik jezyka naprawde, w dwoch szerokosciach ekranu |
| `npm run ux:pomiar` | crawl ze zrzutami kazdej strony, axe-core w obu motywach, martwe klikniecia |
| `npm run seo:audyt` | porownuje strony ze soba: hreflang, dane strukturalne, mapa witryny |
