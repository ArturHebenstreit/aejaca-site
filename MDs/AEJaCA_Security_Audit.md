# AEJaCA, audyt bezpieczeństwa

Data: 2026-08-03. Zakres: `chat-api` (54 punkty wejścia), panel `admin` (63 trasy),
integracja Autopay, moduł kodów rabatowych, nagłówki serwisu, zależności obu usług.
Metoda: przegląd kodu. Bez testów penetracyjnych na żywej usłudze.

Ocena ogólna: rdzeń pieniężny jest zrobiony dobrze. Ceny liczą się na serwerze,
podpisy Autopay sprawdzane są porównaniem odpornym na atak czasowy, ITN weryfikuje
kwotę i działa idempotentnie, rezerwacje towaru i kodów chodzą pod blokadą wiersza,
zapytania SQL są parametryzowane, w szablonach panelu nie ma ani jednego niefiltrowanego
wyjścia. Problemy leżą gdzie indziej: w tym, co się dzieje, gdy zabraknie zmiennej
środowiskowej, w losowaniu kodów rabatowych i w tym, że limity zapytań opierają się
na nagłówku, który każdy może sobie wpisać.

---

## Krytyczne

### K1. Brak zmiennej środowiskowej otwiera panel administracyjny

`admin/server.js:21`

```js
secret: process.env.SESSION_SECRET || "aejaca-admin-secret-change-me",
```

Jeżeli `SESSION_SECRET` kiedykolwiek zniknie z Railway, przy przenoszeniu usługi,
przy zakładaniu środowiska testowego, przy literówce w nazwie, sekret podpisujący
ciasteczka sesji staje się napisem z repozytorium. Kto go zna, podpisuje sobie
ciasteczko zalogowanego administratora i wchodzi do panelu bez Google. A w panelu
jest wszystko: leady z adresami, subskrybenci, kody rabatowe, potwierdzanie przelewów.

Naprawa: brak sekretu ma zatrzymać start usługi, a nie podstawić wartość zastępczą.

### K2. Ten sam wzorzec w API, w czternastu miejscach

`chat-api/server.js:1880, 1957, 1977, 1993, 2097, 2119, 2172, 2197, 2219, 2242, 2499, 2513, 3002`

```js
if (req.headers["x-admin-token"] !== process.env.ADMIN_API_TOKEN) return res.status(401)...
```

Gdy `ADMIN_API_TOKEN` jest nieustawiony, `undefined !== undefined` daje fałsz i
warunek przepuszcza żądanie **bez żadnego nagłówka**. Zapis produktów, wystawianie
kodów rabatowych, lista zamówień czekających na przelew i ich potwierdzanie stają
się publiczne.

Sprawdzone w Railway 2026-08-03: `ADMIN_API_TOKEN` jest ustawiony w obu usługach,
`SESSION_SECRET` w panelu też, więc żadne z tych drzwi nie stało otworem. To jest
wada odporności, nie czynne włamanie: koszt jednej literówki przy przenoszeniu
usługi albo zakładaniu środowiska testowego to publiczny dostęp do zapisu produktów
i wystawiania kodów rabatowych, bez żadnego ostrzeżenia po drodze.

Przy okazji wyszła usterka, która siedziała cicho od dawna.
`MATRIX_INVALIDATE_TOKEN` był ustawiony w `chat-api`, ale nie w panelu, a panel
przy braku tej zmiennej po prostu nie wysyła żądania i nic nie mówi. Czyszczenie
pamięci podręcznej nie działało nigdy. Przy matrycy lasera i filamentach było to
niewidoczne, bo one i tak odświeżają się co pięć minut, ale ceny kamieni leżą
w pamięci **dobę** (`server.js:2744`), więc zmiana ceny kamienia w panelu dochodziła
do kalkulatora biżuterii nawet po dwudziestu czterech godzinach. Naprawione
dodaniem zmiennej w panelu jako odwołania do usługi `chat-api`, sprawdzone na żywo.

Naprawa: jedna funkcja `requireAdmin`, która najpierw sprawdza, czy token w ogóle
istnieje, potem porównuje go `crypto.timingSafeEqual`.

### K3. Kody rabatowe losowane `Math.random()`

`chat-api/discounts.js:241`

```js
out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
```

`Math.random()` w V8 to xorshift128+, generator przewidywalny, nie kryptograficzny.
Kod rabatowy to pieniądze na okaziciela. Napastnik zdobywa jeden kod legalnie,
zapisując się do newslettera, i ma punkt zaczepienia do odtworzenia stanu generatora,
a przez to kolejnych kodów wystawianych przez ten sam proces. Wystarczy kilka kodów,
żeby to przestało być teoretyczne.

Naprawa: `crypto.randomInt`. Zmiana jednej linii, żadnych skutków ubocznych.

---

## Wysokie

### W1. Wszystkie limity zapytań da się obejść jednym nagłówkiem

`chat-api/server.js:33, 451`

```js
app.set("trust proxy", true);
...
const raw = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]?.split(",")[0] || ...
```

`trust proxy: true` każe Expressowi wierzyć całemu łańcuchowi `X-Forwarded-For`, a
`extractIP` bierze `cf-connecting-ip` wprost z żądania. Kto uderza w Railway
bezpośrednio, z pominięciem Cloudflare, podaje dowolny adres i zmienia go co żądanie.
Wtedy limit czatu, limit wyceny, limit formularza kontaktowego i limity głosowania
na filamenty przestają cokolwiek znaczyć. To podnosi ciężar każdego następnego punktu.

Naprawa: `trust proxy` ustawiony na liczbę rzeczywistych warstw pośredniczących,
`cf-connecting-ip` honorowany tylko wtedy, gdy ruch faktycznie przyszedł przez
Cloudflare, w pozostałych wypadkach `req.ip`.

### W2. Sprawdzanie kodu rabatowego bez żadnego limitu

`chat-api/server.js:2014`

Punkt końcowy odpowiada wprost, czy kod istnieje, i nie ma ani limitu, ani opóźnienia.
Kody powitalne mają znany przedrostek `AEJ10-` i sześć znaków z alfabetu 27-znakowego.
Zgadywanie na ślepo jest kosztowne, ale w połączeniu z K3 przestaje być zgadywaniem.
Poza tym sam punkt końcowy działa jak wyrocznia: pozwala sprawdzić, które hasła
kampanii są już aktywne, zanim je ogłosimy.

Naprawa: limit na adres i na kod, wspólny licznik nietrafionych prób, jednakowa
odpowiedź dla kodu nieistniejącego i wygasłego.

### W3. Składanie zamówień bez limitu, trzy skutki naraz

`chat-api/server.js:1519`

Nikt nie musi się uwierzytelniać, żeby złożyć zamówienie, i słusznie. Ale brak limitu
daje trzy rzeczy jednocześnie:

1. **Blokada towaru.** Rezerwacja trzyma sztukę dwadzieścia minut. Przy nakładzie
   jednej sztuki wystarczy skrypt składający zamówienie co kilkanaście minut, żeby
   pierścionek był trwale niedostępny do kupienia i żeby nikt tego nie zauważył.
2. **Zasypywanie cudzej skrzynki.** Zamówienie z płatnością przelewem wysyła dane do
   przelewu na podany adres, bez potwierdzenia tego adresu. To gotowe narzędzie do
   wysyłania poczty na cudzy adres, naszym nadawcą i naszą reputacją.
3. **Zapychanie bazy** porzuconymi zamówieniami i pozycjami.

Naprawa: limit na adres IP i na adres e-mail, krótsza rezerwacja dla zamówień
z niepotwierdzonego adresu, sprzątanie porzuconych zamówień.

---

## Średnie

| # | Rzecz | Miejsce |
|---|-------|---------|
| S1 | Treść błędu bazy wraca do przeglądarki (`detail: e.message`), zdradza nazwy kolumn i ograniczeń | `server.js:1845, 1951` |
| S2 | Panel pokazuje `err.message` na stronie błędu | `admin/server.js`, wszystkie `catch` |
| S3 | Osiem podatności w zależnościach `chat-api`: `body-parser` (odmowa usługi), `qs` (zanieczyszczenie prototypu), `form-data`, `uuid` | `chat-api/package-lock.json` |
| S4 | ~~`admin` bez pliku blokady zależności~~ dodany w etapie 4 | `admin/package-lock.json` |
| S5 | Brak nagłówków bezpieczeństwa na obu usługach, panel bez polityki treści | obie usługi |
| S6 | Eksport CSV nie neutralizuje formuł, komórka zaczynająca się od `=` wykona się po otwarciu pliku u Ciebie | `admin/server.js:311` |
| S7 | `GET /api/orders/:ref` bez żetonu dostępu wydaje status i dane do przelewu, choć `/pay` żetonu wymaga | `server.js:2458` |
| S8 | `/api/debug-ip` publicznie odbija nagłówki żądania | `server.js:492` |
| S9 | Ciasteczko sesji `sameSite: "lax"`, przy panelu wyłącznie do klikania wystarczy `strict` | `admin/server.js:24` |
| S10 | Polityka treści dopuszcza `https://api.aejaca.com`, nazwę, która nie istnieje w DNS i nigdy nie została uruchomiona. Martwy wpis w regule bezpieczeństwa jest gorszy niż jego brak, bo sugeruje, że coś tam stoi | `public/_headers:13` |

## Niskie

Porównania żetonów operatorem `!==` zamiast porównania stałoczasowego (`access_token`
zamówienia, żetony administracyjne). Wyrażenie sprawdzające ścieżkę zdjęcia produktu
dopuszcza `..`, choć kontrola przy budowaniu i tak by to złapała. Numer zamówienia ma
32 bity losowości, co przy limicie zapytań wystarcza, a bez limitu jest cieńsze,
niż się wydaje.

## Sprawdzone i czyste

Wstrzyknięcie SQL: wszystkie zapytania parametryzowane, dwa miejsca z wstawianiem
napisu do zapytania mają wartość ze stałej listy. Wstrzyknięcie skryptu: w szablonach
panelu nie ma niefiltrowanego wyjścia, w serwisie nie ma `dangerouslySetInnerHTML`.
Podszycie się pod płatność: podpisy Autopay liczone i sprawdzane poprawnie, kwota
z ITN porównywana z zamówieniem, powtórzony komunikat nie zmienia statusu drugi raz.
Podmiana ceny przez przeglądarkę: ceny produktów czytane z bazy, usługi liczone
ponownie tym samym kodem, koszt wysyłki liczony z kraju, znizka liczona dwa razy
i rozjazd przerywa zamówienie. Sekrety w repozytorium: brak, żadnego klucza, numeru
rachunku ani hasła. Fałszowanie żądań międzywitrynowych w panelu: wszystkie zmiany
stanu idą metodą POST, a ciasteczko `lax` nie pojedzie z obcej witryny.

---

## Plan naprawy

**Etap 1, zrobiony.** Sprawdzanie żetonów wyprowadzone do `chat-api/auth.js`:
brak zmiennej środowiskowej daje odmowę 503 zamiast przepuszczenia żądania,
porównanie idzie `timingSafeEqual`. Podpięte w siedemnastu miejscach, w tym pod
żeton unieważniający pamięć podręczną (K2) i żeton przepływu newslettera.
Sekret sesji panelu bez wartości zapasowej wpisanej w kod: gdy zmiennej brakuje,
losuje się przy starcie, więc panel działa, a ciasteczka nie da się podrobić (K1).
Kody rabatowe losowane `crypto.randomInt` (K3). Sprawdzenia w `chat-api/auth.test.mjs`,
uruchamiane przez `npm test`, z osobnym przypadkiem na to, co przepuszczała stara
wersja: brak nagłówka przy braku zmiennej.

Uwaga wdrożeniowa: dopóki `MATRIX_INVALIDATE_TOKEN` nie jest ustawiony w obu
usługach, czyszczenie pamięci podręcznej cen kamieni i filamentów po zmianie
w panelu nie zadziała. Wcześniej było ono otwarte dla wszystkich, teraz jest
zamknięte dla wszystkich, łącznie z nami. Ceny i tak odświeżają się same po
wygaśnięciu wpisu, więc jedynym skutkiem jest opóźnienie.

**Etap 2, zrobiony.** Ustalanie adresu wyprowadzone do `chat-api/clientIp.js`.
`trust proxy` z `true` na liczbę rzeczywistych warstw (`TRUSTED_PROXY_HOPS`,
domyślnie 1), adres brany z `req.ip`, czyli od końca łańcucha, a nie z nagłówka
podanego przez klienta. `cf-connecting-ip` honorowany dopiero po włączeniu
`TRUST_CLOUDFLARE_HEADERS`, w dniu w którym API faktycznie stanie za Cloudflare.
Sprawdzenia w `chat-api/clientIp.test.mjs` idą przez prawdziwy serwer, bo rzecz
dotyczy tego, jak Express przycina łańcuch, czego atrapa żądania by nie odtworzyła.

Liczba warstw ustalona pomiarem na żywej usłudze, nie założeniem. Pierwsze
ustawienie, jedna warstwa, było błędne: brało adres węzła krawędziowego Railway
zamiast adresu klienta, przez co wielu odwiedzających wpadłoby do wspólnego
licznika i limit uderzałby w niewinnych. Dowód rozstrzygający: żądanie puszczone
z konsoli Railway przez publiczny adres usługi dało łańcuch
`152.55.185.159, 152.233.12.242`, a niezależnie sprawdzony adres wyjściowy tego
kontenera to `152.55.185.159`, czyli wpis **pierwszy**. To samo mówi `x-real-ip`,
który w każdym pomiarze równa się pierwszemu wpisowi. Stąd dwie warstwy.

Przy okazji potwierdzone, że podszycie się odpada niezależnie od liczby warstw:
krawędź Railway kasuje `x-forwarded-for` przysłany przez klienta i pisze łańcuch
od nowa. Dwa żądania z podstawionym nagłówkiem, jedno spoza sieci i jedno z jej
wnętrza, nie doniosły podstawionej wartości ani razu.

**Etap 3, zrobiony.** Licznik wyprowadzony do `chat-api/rateLimit.js`, jeden
zamiast siedmiu kopii tego samego kodu rozsianych po pliku (pięć ręcznych plus
dwie na `express-rate-limit`, którego już nie potrzebujemy). Wszystkie progi
stoją teraz obok siebie i dają się porównać wzrokiem.

Dołożone tam, gdzie nie było nic:

- **sprawdzanie kodu rabatowego**, 30 prób na godzinę, a osobno 15 **nietrafień**,
  bo nadużycie wygląda inaczej niż użycie: klient wpisuje kod raz, może dwa razy
  przy literówce, a skrypt strzela bez końca i samymi nietrafieniami. Po
  wyczerpaniu puli odpowiadamy dokładnie tak, jak na kod nieznany, żeby sam
  komunikat nie mówił zgadującemu, że jest na tropie czegoś istniejącego.
- **składanie zamówienia**, 10 na godzinę z adresu i 5 na skrzynkę, bo zasypywanie
  cudzej poczty danymi do przelewu chodzi z jednego adresu, a zapychanie bazy
  potrafi chodzić z wielu.
- **rezerwacje towaru**, najwyżej dwie naraz z jednego adresu. To odpowiedź na
  najcichszy z trzech scenariuszy: przy nakładzie jednej sztuki wystarczyło
  składać zamówienie co kwadrans, żeby pierścionek był trwale niedostępny.
  Kupujący tego nie odczuje, bo płaci od razu, a zapłata zamienia rezerwację
  w sprzedaż i zwalnia miejsce.
- **zapis miniatury podglądu**, 30 na dziesięć minut, jedyne miejsce gdzie ktoś
  z ulicy wkładał do bazy kilkaset kilobajtów na żądanie bez żadnego licznika.

Sprawdzenia w `chat-api/rateLimit.test.mjs`, razem z odpowiedzią 429 i nagłówkiem
`Retry-After`, żeby uczciwy klient wiedział, kiedy wrócić, zamiast próbować w kółko.

**Etap 4, zrobiony.** Treść błędów bazy zdjęta z odpowiedzi (zostaje w logu),
nagłówki bezpieczeństwa na obu usługach, `/api/debug-ip` za żetonem, formuły
w eksporcie CSV zneutralizowane, `httpOnly` na ciasteczku sesji, `..` odrzucane
w ścieżce zdjęcia produktu, porównanie żetonu zamówienia i wyceny stałoczasowe,
martwy `api.aejaca.com` usunięty z polityki treści.

**Znalezione przy okazji, poważniejsze niż połowa tej listy.** Każda strona panelu
ładowała Tailwind z `cdn.tailwindcss.com`, bez przypiętej wersji i bez sumy
kontrolnej. Kto kontrolowałby tamten skrypt, kontrolowałby panel: czytałby leady
i subskrybentów, a wysyłając formularze z sesją zalogowanego potwierdzałby przelewy
i wystawiał kody rabatowe. Arkusz jest teraz budowany u nas (`npm run build:css`,
24 kB zamiast kilkuset) i leży w repozytorium, więc wdrożenie niczego nie ściąga,
a polityka treści panelu dopuszcza wyłącznie własne skrypty. Przy okazji doszedł
brakujący plik blokady zależności panelu (S4).

**Dwie rzeczy zrobione inaczej, niż zapowiadał plan.**

`sameSite: "strict"` (S9) **wycofane po napisaniu**. Przy `strict` przeglądarka nie
wysyła ciasteczka przy wejściu z obcej strony, a powrót z logowania Google jest
właśnie takim wejściem, więc groziło to zamknięciem się na zewnątrz własnego panelu.
Zysk byłby zresztą żaden: `lax` już teraz nie przepuszcza żądania POST z cudzej
strony, a każda zmiana w panelu idzie przez POST.

Żeton przy odczycie zamówienia (S7) **nie został wprowadzony**, i to jest korekta
samego ustalenia. Strona statusu dostaje wyłącznie numer zamówienia, bo klient
trafia na nią z powrotu z bramki płatniczej, gdzie żetonu nie ma. Wymaganie go
zepsułoby ten przepływ. Sprawdzone, co ten punkt naprawdę wydaje: status, kwotę
i nasz numer rachunku. Ani nazwiska, ani adresu, ani zawartości zamówienia,
a numer rachunku i tak podajemy każdemu, kto ma zapłacić. Przy 32 bitach
losowości numeru i limicie zapytań zgadywanie jest nierealne. Punkt zamknięty
jako nadmierny, a nie odłożony.

**Etap 5, zależności.** Aktualizacja `chat-api`.

**Poza kodem, do zrobienia w Railway:** sprawdzić, że `SESSION_SECRET` i
`ADMIN_API_TOKEN` są rzeczywiście ustawione i różne w każdej usłudze, dołożyć
`MATRIX_INVALIDATE_TOKEN`, obrócić `NEWSLETTER_CODE_TOKEN`, jeżeli kiedykolwiek
przeszedł przez kanał, którego nie kontrolujesz.
