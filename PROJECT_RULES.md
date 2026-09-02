# AEJaCA - wspólne reguły projektu

Ten dokument jest wspólnym źródłem reguł dla Claude Code, Codex i innych agentów.
Instrukcje narzędziowe pozostają w `CLAUDE.md` i `AGENTS.md`, ale nie mogą zmieniać
poniższych zasad biznesowych bez zaakceptowanej decyzji ADR.

## 1. Hierarchia źródeł prawdy

W razie sprzeczności obowiązuje kolejność:

1. Jawna, najnowsza decyzja właściciela projektu.
2. Zaakceptowany ADR w `MDs/decisions/`.
3. Reguła domenowa oznaczona jako aktualna w `MDs/README.md`.
4. `MDs/AEJaCA_Brand_Reference.md` dla faktów o marce, ofercie i cenach.
5. Aktualny kod i jego testy dla rzeczywistego zachowania systemu.
6. Plany i audyty historyczne, wyłącznie jako kontekst.

Sprzeczności trzeba nazwać i rozstrzygnąć. Nie wolno wybierać wygodniejszej wersji
bez zapisania powodu.

## 2. Zasady pracy równoległej

- Każdy model pracuje w osobnym worktree i na osobnej gałęzi.
- Jeden aktywny właściciel na plik. Własność zapisuje `MDs/WORKBOARD.md`.
- Wspólny problem dzielimy według odpowiedzialności, na przykład API, interfejs,
  testy, dokumentacja. Nie dzielimy go przypadkowo po kilku liniach tego samego pliku.
- Agent spoza zadania może czytać i recenzować zastrzeżony plik, ale go nie edytuje.
- Artur jest integratorem. Modele nie scalają zmian do `main` ani nie otwierają pull requestów z własnej inicjatywy. Model kończy zadanie informacją, że jego branch jest gotowy do integracji.
- Jedynym wyjątkiem od zakazu zapisu modeli do `main` jest rezerwacja zadania w `MDs/WORKBOARD.md`, wykonana zgodnie z regułami tego pliku.
- Artur scala dopiero po niezależnym review i po przejściu wymaganych kontroli.
- Ustalenia z rozmowy stają się obowiązujące dopiero po zapisaniu w ADR, handoffie
  albo aktualnym dokumencie domenowym.

## 3. Jak podejmujemy decyzje

Przed implementacją zmiany wysokiego ryzyka trzeba zapisać:

- problem i mierzalny stan obecny;
- wybraną decyzję oraz odrzucone alternatywy;
- konsekwencje dla klienta, biznesu, bezpieczeństwa, SEO i utrzymania;
- wymagane testy, w tym kontrole negatywne;
- dokumenty i kopie kodu wymagające synchronizacji.

Zmiana wysokiego ryzyka obejmuje płatności, ceny, zamówienia, dane osobowe,
geometrię wyrobu, prawo konsumenckie, routing i publiczne fakty o ofercie.

### Sprzeczność w zleceniu nazywa się przed kodem, nie po (od 2026-08-29)

Polecenie właściciela: model ma czytać zlecenie jak recenzent, a nie jak
wykonawca. Zanim cokolwiek powstanie, wskazuje miejsca nielogiczne, sprzeczne
z tym, co już stoi w systemie, albo po prostu niedokończone, i proponuje, jak
je rozstrzygnąć. Wskazanie jest materiałem do rozmowy, a nie odmową pracy.

Szukamy pięciu rzeczy, bo tych pięć wraca najczęściej:

1. **Dwie nazwy na jeden stan.** Osobne nazwy sugerują osobne stany, więc kod
   dostaje dwa, a użytkownik do końca życia zgaduje, czym się różnią.
2. **Sprzeczność z decyzją już zapisaną.** Nowe zlecenie bywa cofnięciem
   wcześniejszego, tylko nikt tego tak nie nazwał. Wtedy trzeba to nazwać
   i zmienić ADR, a nie zostawiać w kodzie dwóch reguł naraz.
3. **Obietnica dana klientowi, która przestaje być prawdą.** Data, kwota
   i termin raz wysłane mailem są zobowiązaniem. Zmiana mechaniki, która je
   po cichu przesuwa, jest zmianą umowy, a nie zmianą panelu.
4. **Stan wyliczalny zapisany jako osobne pole.** Znacznik trzymany obok
   statusu rozjeżdża się ze statusem w pierwszym tygodniu. Patrz ADR-0013.
5. **Brakujące zakończenie ścieżki.** Kto zamyka, kto anuluje, co widzi klient,
   co się dzieje przy dwóch kartach otwartych naraz.

Forma jest krótka: co jest nie tak, dlaczego to zaboli, jedna rekomendacja
i alternatywa. Nie robimy z tego audytu i nie blokujemy prostych zadań.
Gdy uwaga dotyczy rzeczy odwracalnej i taniej, model podaje ją jednym zdaniem
i robi swoje. Gdy dotyczy pieniędzy, terminu albo tego, co klient już dostał
na piśmie, czeka na decyzję.

Rozstrzygnięcie właściciela wchodzi do `MDs/decisions/` razem z odrzuconą
alternatywą. Uwaga zgłoszona i odrzucona też jest wynikiem: zapisuje się ją
jako świadomie przyjętą konsekwencję, żeby za pół roku nikt jej nie odkrywał
drugi raz jako błędu.

## 3a. Praca równoległa agentów (polecenie właściciela, 2026-09-02)

**Zadania, które da się rozdzielić, rozdziela się agentom i puszcza
równolegle.** Sesja główna trzyma decyzję, diagnozę i ocenę wyniku; wykonanie
schodzi w dół. To rozwinięcie reguły delegowania z `CLAUDE.md`: tam było
„zlecaj proste zadania", tutaj dochodzi **równoległość jako domyślny kształt
pracy** wszędzie, gdzie jest skuteczniejsza i tańsza.

### Kiedy rozdzielamy

- **Badanie o kilku niezależnych wątkach** (dwa obszary wiedzy, dwa katalogi
  do przeszukania, kilka plików do przeczytania na raz).
- **Zmiany w rozłącznych plikach**, gdzie żadna nie zależy od wyniku drugiej.
- **Powtarzalna robota na wielu wierszach**: i18n w trzech językach, ta sama
  poprawka w kilkunastu miejscach, przegląd listy pod jednym kątem.

### Kiedy NIE rozdzielamy

- **Zadania na jednym pliku**, gdzie dwie równoległe edycje zdepczą się
  nawzajem. Rozłączność plików jest warunkiem, nie życzeniem.
- **Wysokie ryzyko błędnej diagnozy**: geometria kreatora, wycena, płatności,
  prawo konsumenckie. Tam sesja główna pracuje sama.
- **Zadanie krótsze niż jego opisanie.** Zlecenie i kontrola też kosztują.

### Co agent dostaje w zleceniu, zawsze

1. **Zakaz długich myślników.**
2. **Nazwę gałęzi** i zakaz wychodzenia poza nią.
3. **Zakres plików**, których wolno mu dotknąć, i wprost: czego ma nie ruszać.
4. `npm run sync:pricing` po dotknięciu `src/geometry`.
5. Regułę zgłaszania sprzeczności przed kodem (sekcja `Jak podejmujemy
   decyzje`).

### Co sesja główna robi z wynikiem

**Sprawdza go sama, zawsze.** Agent raportuje własną pracę i bywa w tym
optymistą: „gotowe" znaczy „skończyłem", a nie „działa". Spójność całości jest
po stronie sesji głównej, bo agent widzi swój wycinek i nie wie, że akurat ta
zmiana kłóci się z decyzją zapisaną trzy tygodnie temu w innym ADR.

## 4. Twarde niezmienniki

**NEVER use long em-dashes (" - ") anywhere** - not in chat replies, emails, code comments, content, or commits. Use a short hyphen, a comma, parentheses, or a full stop instead. This is a standing, non-negotiable rule.

Pilnuje tego `scripts/check-emdash.mjs` i **wywala build**, więc złamanie zasady zatrzymuje deploy. Wyłączone są dwa katalogi, oba z tego samego powodu: `n8n-backup` (zrzut z żywej instancji) i pliki obcych skilli w `.claude/skills/` (kopie 1:1 cudzych repozytoriów). Zasada dotyczy tego, co **piszemy**, a nie tego, co wciągamy w niezmienionej postaci. `ORIGIN.md` przy każdym skillu piszemy sami, więc podlega zasadzie normalnie.

- Cena wiążąca jest liczona na serwerze. Dane cenowe z przeglądarki nie są zaufane.
- Status płatności zmienia tylko poprawnie podpisany komunikat ITN.
- `FAILURE` po `SUCCESS` nie cofa opłaconego zamówienia.
- Test topologiczny nie zastępuje testu warsztatowego wyrobu.
- Nie ujawniamy sekretów w repozytorium, frontendzie ani logach.
- Brak wymaganego sekretu ma zamykać dostęp, a nie włączać wartość domyślną.

### Trójjęzyczność obowiązuje też tam, gdzie nie widać (od 2026-08-28)

Serwis stoi pod trzema adresami i ma trzy komplety treści. Każdy napis, który
dociera do człowieka, musi umieć mówić trzema językami, także wtedy, gdy nie
widać go na ekranie.

- **Nazwa dla czytnika ekranu idzie ze słownika.** `aria-label` wpisany wprost
  jest zawsze w jednym języku, czyli dla dwóch trzecich odwiedzających w złym.
  Dotyczy to również nazwy sklejonej z szablonu. Pilnuje
  `scripts/check-nazwy-dostepne.mjs`, bramka w buildzie.
- **Opis obrazu należy do obrazu, nie do strony.** `alt` bierze się
  z `opisObrazu("klucz", lang)` (`src/data/opisyObrazow.js`), bo ten sam obraz
  bywa na kilku stronach i opis przypięty do strony po cichu się rozjedzie.
  Obraz ozdobny ma `alt=""`, czyli "pomiń mnie". Piszemy, co widać, krótko, bez
  "zdjęcie" na początku i bez upychania słów kluczowych: `alt` powtarzający
  tytuł strony z dopiskiem marki nie mówi niewidomemu niczego, bo tytuł
  przeczytał chwilę wcześniej. Ta sama bramka.
- **Słownik z `useLanguage()` jest obiektem: `t.nav.currency`.** Zapis funkcyjny
  `t("nav.currency")` przechodzi build i lint, a w przeglądarce rzuca wyjątkiem
  w trakcie renderu, więc React odmontowuje całe drzewo i zostaje biały ekran.
  Pilnuje `scripts/check-slownik-jako-funkcja.mjs`. Osobny pomocnik
  `t(pl, en, de)` we wpisach blogowych i `t(etykieta, lang)` w kalkulatorach
  **ma** być funkcją i bramka o tym wie.
- **Kod, który pokazuje się dopiero po kliknięciu, potrzebuje własnego
  sprawdzianu.** Prerender i przegląd stron widzą wyłącznie pierwszy ekran, więc
  listy, panele i okna otwierane interakcją leżą poza ich zasięgiem. Wzór:
  `scripts/check-menu-jezyka.mjs` (`npm run check:jezyk`), który naprawdę klika,
  w dwóch szerokościach ekranu. Nie wchodzi do `npm run build`, bo build leci na
  Cloudflare Pages, gdzie nie ma przeglądarki.
- **Nazwa języka zostaje w swoim języku.** "Deutsch", nie "niemiecki", z
  `lang` i `hreflang` przy odnośniku. To jedyny wyjątek od reguły wyżej i
  wynika z tego samego powodu: ma być zrozumiała dla tego, kto jej szuka.

### Zapłata zamyka pozycję oferty, a nie ofertę (od 2026-08-29)

Oferta bywa kupowana po kawałku: klient bierze jeden dodatek dziś, wraca pod
ten sam link i dokupuje drugi. Rozstrzyga o tym **pozycja**, nie nagłówek.

- **Stan pozycji wynika ze stanu jej zamówienia, i nie ma obok żadnej flagi.**
  `quote_items.order_id` mówi, kto ją wziął; czy jest wolna, zajęta czy
  zamknięta, liczy `stanPozycji()` ze statusu tego zamówienia. Dzięki temu
  porzucona płatność oddaje pozycję do oferty sama, gdy zamówienie wygasa.
  Flaga „opłacona" wymagałaby drugiego zapisu przy każdym przejściu zamówienia
  i rozjechałaby się przy pierwszym, o którym ktoś zapomni.
- **Kwota do zapłaty liczy się z pozycji, nigdy z `quotes.total_grosze`.**
  Nagłówek po częściowym zleceniu mówi o RESZCIE oferty, więc przelew opiewałby
  na inną sumę niż pozycje, które do zamówienia weszły. Jedna reguła
  (`selectedQuoteItems`) obsługuje wszystkie cztery bramki.
- **Zapłata za wariant zamyka całą jego grupę, zapłata za dodatek nie.**
  Warianty były alternatywami („klucz 56 albo 68 mm"), więc kupienie jednego
  kasuje pozostałe. Dodatki są niezależne i zostają do dokupienia. Jeżeli
  klient ma móc dokupić resztę później, to są dodatki, a nie warianty.
- **Konwersja blokuje wiersze pozycji przed jakimkolwiek zapisem** i przelicza
  koszyk od nowa z zablokowanego stanu. Dwie karty otwarte na tej samej ofercie
  to zwykły poniedziałek, a nie teoria.
- **Częściowa zapłata nie przedłuża terminu ważności.** Kruszec rusza się, a
  `rates_snapshot` jest z chwili wyceny. Po terminie na resztę wystawiamy nową
  ofertę. Decyzja: ADR-0026.

### Termin realizacji jest daną, a zegar biegnie tylko w jednym etapie (od 2026-08-29)

- **Etap pracy jest statusem zamówienia, nie osobną kolumną obok.** ADR-0013
  rozstrzygnął to raz. Dwie osie, które widzi klient (płatność i realizacja),
  to sposób pokazania jednej wartości, a nie dwa zapisy do trzymania w zgodzie.
- **Termin liczy się z tego samego zaznaczenia co kwota**, jedną funkcją
  (`terminGrupy`), i jest **najdłuższym** z wybranych: paczka wychodzi jedna.
  Zamraża się na zamówieniu przy zapłacie, razem z kwotą i kursem.
- **`lead_days` trzyma umowę, `deadline_at` trzyma jej skutek.** Liczba dni
  przeliczana przy każdym odczycie przesuwałaby termin razem z datą odczytu.
- **Ile dni zostało, liczy serwer.** Data w JSX wychodzi inna przy buildzie
  i inna u klienta, więc React wyrzuca całe poddrzewo (ADR-0022). Panel i
  strona klienta czytają tę samą liczbę, bo dwa miejsca licząc to samo
  pokazałyby dwie różne.
- **Zegar startuje w „Gotowe do pobrania”, a nie przy wzięciu zlecenia do
  ręki.** Termin stemplowany dopiero przy pobraniu przesuwałby się o każdy
  dzień leżenia w kolejce, a klient ma datę w mailu. Zwłoka w kolejce zjada
  nasz zapas, nie termin klienta. W ustalaniu szczegółów zegar stoi, bo
  czekamy wtedy na klienta, a nie on na nas. Decyzja: ADR-0028.
- **Zegar biegnie w trzech etapach: gotowe do pobrania, w realizacji,
  gotowe do wysyłki.** Rzecz zrobiona i niewysłana ma przed sobą ten termin,
  o który chodzi najbardziej: dzień nadania.
- **Data terminu nazywa się „Planowana finalizacja”**, a nie „Planowana
  wysyłka”: ta sama data stoi przy zamówieniu odbieranym osobiście i przy
  zamówieniu, które w całości jest plikiem. Mówi też, czego nie obejmuje, bo
  jest dniem końca pracy i przekazania paczki, a nie dniem doręczenia.
  Angielski: „Planned completion”, niemiecki: „Geplante Fertigstellung”.
- **Zdanie o wydaniu bierze się z `delivery_method`**, a nie wylicza klientowi
  obu możliwości naraz i nie podmienia słów w gotowym tekście. Trzy drogi:
  wysyłka, odbiór osobisty, pliki. Decyzja: ADR-0028, punkt 13.
- **Ostatni przystanek zapala się dopiero po potwierdzeniu doręczenia.**
  Paczka włożona do paczkomatu to jeszcze nie paczka odebrana. Przycisk
  w panelu nazywa się „Dostarczone", bo pracownia ma wiedzieć, co potwierdza.
- **Przewoźnika wybiera się przy nadaniu, z białej listy** (`pricing/shipping.js`).
  Strefa tylko podpowiada, bo strefy światowe niosą dwie nazwy naraz, a paczka
  jedzie jedna. Adres śledzenia buduje jeden pomocnik, wspólny dla maila
  i strony zamówienia. Decyzja: ADR-0028, punkt 14.
- **Próg przypomnienia zapisuje się dopiero po udanej wysyłce maila.** Zapis
  przed nią zamyka próg na zawsze przy pierwszej awarii poczty, po cichu.
  Na przebieg wychodzi najwyżej jeden mail, o progu najbliższym prawdzie.
  Decyzja: ADR-0027.

### Kody rabatowe wysyłane mailem (od 2026-08-31)

- **Każdy kod jest jednorazowy i wystawiony na adres klienta.** Kod stały
  w treści maila jest kodem publicznym w chwili, w której ktokolwiek go
  przeklei. Wystawia je jedna funkcja, `issueSingleUseCode` w `discounts.js`.
- **Kod powitalny żyje 45 dni**, rabat doklejony do wyceny 14.
- **Każdy mail niosący kod podaje datę końca ważności i zapowiada
  przypomnienie.** Kod bez daty jest obietnicą bez terminu.
- **Pięć dni przed końcem idzie jedno przypomnienie**, tylko o kodzie
  nietkniętym, i nigdy tego samego dnia co inna nasza wiadomość. Reguła
  dotyczy wyłącznie tego, co może poczekać: potwierdzenie zamówienia, dane do
  przelewu i zmiana etapu idą zawsze i natychmiast. Decyzja: ADR-0030.

### Czekanie na pieniądze jest częścią kolejki (od 2026-08-30)

- **Kolejka pokazuje wszystko, co czeka na ruch z naszej strony**, razem
  z zamówieniami czekającymi na przelew w euro i płatnościami odesłanymi do
  ręcznej decyzji. Osobna strona przelewów zniknęła: dwa miejsca o tych samych
  zamówieniach rozjeżdżają się przy pierwszej zmianie.
- **Potwierdzenie wpłaty jest pierwszym krokiem kolejki**, pod przystankiem
  „Zapłata", a nie osobnym formularzem gdzie indziej.
- **Oś czasu klienta zaczyna się przy zapłacie, a nie po niej.** Pierwsza kropka
  świeci, dopóki wpłata nie jest zaksięgowana, i to jest odpowiedź na pytanie
  „czy potwierdziliście przelew". Decyzja: ADR-0029.

### Wpłata inna niż kwota zamówienia (od 2026-08-30)

- **Próg drobnej różnicy: 5 EUR albo 2% kwoty, co mniejsze.** Poniżej progu
  wpłata liczy się jak zgodna, a potwierdzenie mówi wprost, że różnicę bierzemy
  na siebie. Prowizja banku pośredniczącego nie jest winą klienta.
- **Powyżej progu piszemy o dopłatę i dajemy trzy dni**, licząc od wysłania
  prośby. Termin siedzi w tym samym `expires_at`, który wygasza zamówienia
  nieopłacone: drugi zegar rozjechałby się z pierwszym.
- **Nadwyżkę zwracamy na rachunek nadawcy**, a realizacja rusza od razu.
  Nadpłata nie blokuje pracy, która jest już opłacona.
- **Wygaśnięcie nie jest ciche.** Klient dostaje wiadomość: gdy nic nie
  wpłynęło, o tym, że przelew wysłany po terminie wróci do niego; gdy wpłynęła
  część, o zwrocie tej kwoty. Decyzja: ADR-0029, punkt 5.

### Polski tekst do klienta nie zgaduje płci (od 2026-08-30)

Klientka dostała maila ze zdaniem „wycena, którą zapisałeś", i to nie była
literówka, tylko wzorzec: 23 miejsca w serwisie mówiły do czytającego
w rodzaju męskim. Biżuteria nie jest branżą, w której można założyć, że po
drugiej stronie stoi mężczyzna.

- **Nie piszemy „zapisałeś/zapisałaś".** Tak pisze urząd, nie pracownia.
- **Zdanie przestawiamy tak, żeby czasownik nie miał rodzaju**: „wycena
  zapisana na aejaca.com", „od dnia odebrania przesyłki", „zgodnie z wyborem
  przy zamówieniu", „Nie ma linku?", „Grawer jest wybrany, więc...".
- **Dotyczy też przymiotników**: „Nie jestem pewien" to „Jeszcze nie wiem",
  „Czy byłeś zadowolony" to „Jak nam poszło".
- Pilnuje `scripts/check-rodzaj-meski.mjs`, w `npm run build`. Bramka patrzy
  tylko na treść napisów, komentarze wycina. Angielski i niemiecki tego
  problemu nie mają.

## 5. Waluta

**Prices and amounts must follow the active language:**
- `lang === "pl"` → display in **PLN** (Polish złoty)
- `lang === "en"` or `lang === "de"` → display in **EUR**

Conversion: `eur = pln / pln_per_eur` where `pln_per_eur` comes from the live `/api/market-rates` endpoint (NBP rate). Fallback: `4.25`. The secondary amount (smaller text below primary) shows the opposite currency.

This applies to: all calculators, pricing displays, result cards, quote forms - any component that shows monetary values. Use the pattern: `const showEur = lang === "en" || lang === "de"`.

## 5a. Terminy podajemy liczbowo

**Każda data, która jest terminem, ma jeden kształt: `DD.MM.RRRR`, z zerem
wiodącym** (decyzja właściciela, 2026-09-02). Dotyczy planowanej finalizacji,
ważności oferty, terminu przelewu, dat na osi zlecenia i wszystkich stempli
w mailach.

Formatery są dwa i tylko dwa:
- serwis: `dzienNumerycznie()` z `src/utils/dataDnia.js`,
- maile: `dzien()` z `chat-api/mailSzata.js`.

**`toLocaleDateString` jest w serwisie zakazane** poza tekstem redakcyjnym
(wpis blogowy, opinie), gdzie miesiąc słownie jest właściwy i nie jest
obietnicą złożoną klientowi. Powody są dwa: daje inny kształt w każdym języku,
a przy tym opiera się na danych ICU, które w Node i w przeglądarce bywają
z różnych wersji, więc rozjazd wyrzuca całe poddrzewo przy hydracji (ADR-0022).
Pilnuje `scripts/check-czas-w-renderze.mjs`.

**Pole `<input type="date">` w panelu przyjmuje wyłącznie `RRRR-MM-DD`**
i bierze wartość z `dataPola()`. Data po polsku w takim polu nie wyświetla się
wcale, więc pole wygląda na puste mimo zapisanej wartości, a następny zapis
kasuje ją naprawdę. Pilnuje `admin/check-views.mjs`.

## 6. Linkowanie narzędzi

**Jeżeli treść dotyka tematu, który mamy obsłużony narzędziem, ta treść MUSI do niego prowadzić.** Dotyczy wpisów blogowych, haseł słownika, kalkulatorów, sklepu, kart usług i strony B2B. Zbudowane i nielinkowane narzędzie nie istnieje dla czytelnika.

Mapowanie leży w **jednym pliku**: `src/data/toolLinks.js` (`TOOLS_BY_POST`, `TOOLS_BY_TERM`, `audience`). Renderuje je komponent `src/components/ToolLinks.jsx`, używany przez `BlogPost`, `GlossaryTerm`, `RelatedContent` (sklep i karty usług), `B2B`, `Jewelry` i `Studio`.

**Dodając nowe narzędzie:** dopisz je do `TOOL_LINKS`, ustaw `audience` (`buyer` / `maker` / `both`), a potem przypisz do pasujących wpisów i haseł. To jedna edycja, nie obchodzenie czterdziestu siedmiu plików.

`audience` rozdziela odbiorców i trzeba to uszanować: kupujący nie potrzebuje kalkulatora blanku obrączki ani tabeli parametrów lasera, ale na stronie B2B to są najważniejsze pozycje.

**Nie doklejaj narzędzia na siłę.** Wpisy o projektowaniu z AI i o wyposażeniu pracowni celowo nie mają przypisanych narzędzi, bo żadne im nie odpowiada. Wypełniacz szkodzi bardziej niż brak.

## 7. Konwencje inżynierskie

- **i18n**: every user-facing string lives in `src/i18n/{pl,en,de}.js`. When adding a key, add it to ALL THREE files - they must stay in sync.
- **Google reviews** (`src/data/googleReviews.js`): every review that has `text` MUST also carry a `translations: { en, de }` object (or `{ pl, ... }` when `originalLang` is en/de). Without it, the translation block silently fails to render for visitors in other languages while every other card shows one. The reviews list cites only reviews with text, newest first; keep `GOOGLE_BUSINESS.totalReviews` equal to the real Google count (rating-only entries count toward it but are not displayed). Never fake a review's `date` to reorder it - dates must match Google.
- **SEO**: every page uses `<SEOHead pageKey="..." path="..." schemas={[...]} />` at the top. Schemas from `src/seo/schemas.js`: Organization, Service, FAQ, Breadcrumb, Article, HowTo.
- **Images**: `/public/img/calc/<category>/<id>.png`. Product style: black background, upper-left key light, premium photography aesthetic. Use Gemini MCP (`mcp__nano-banana-pro__generate_image`) with `aspectRatio: "1:1"` (tiles) or `"21:9"` (banners), `imageSize: "1K"`.
- **Tailwind themes**: Jewelry = amber/rose, Studio = blue/emerald, Tips = amber (jewelry) / blue (studio).
- **Calculators**: shared primitives in `src/components/calculators/calcShared.jsx` (MaterialCards, HeroCards, ResultDisplay, InquiryForm, CalcCard, t() helper).
- **Geometria kreatora pierścionków** (`src/geometry/ring/`): **przeczytaj `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` PRZED każdą zmianą bryły.** Plik zbiera reguły warsztatowe, pułapki jądra manifold-3d, klasę awarii cichych (objętość i topologia poprawne, wyrób nie do użycia) i dziennik wniosków. Buduj z wiedzy, nie z eksperymentu.
- **Routing / prerender**: there is no SPA catch-all in `public/_redirects`. Every route must be prerendered to its own `index.html`, otherwise Cloudflare Pages serves a real 404. When adding a page, add the route to `src/main.jsx`, `src/entry-server.jsx` AND `STATIC_ROUTES` in `scripts/prerender.mjs`. The prerender script cross-checks those lists and fails the build on drift; blog slugs and glossary IDs are derived automatically from `POSTS_META` / `GLOSSARY`, so they need no manual entry. `dist/404.html` is generated from the `NotFound` component. **Nową stronę deklaruj przez `strona(() => import(...))`, nie przez `lazy(...)`.** Zwykłe `lazy` znaczy, że hydratacja rusza przed fragmentem trasy, React porzuca prerender i rysuje stronę od nowa. Pilnuje tego `scripts/check-lazy-hydration.mjs`, mierzy `scripts/check-hydration-race.cjs`.

- **Analityka**: nowa ścieżka klienta dostaje zdarzenie **razem z kodem**, a nie „kiedyś potem". Sklep, koszyk i kasa powstały bez ani jednego licznika i przez pół roku statystyka kończyła się na kalkulatorze, więc na pytanie, gdzie ludzie odpadają, nie było odpowiedzi. Zdarzenia wysyła `src/utils/analytics.js` (bez ciasteczek, bez zapisu w urządzeniu), kanał ruchu nazywa `chat-api/zrodlaRuchu.js`, a raporty liczy `admin/analityka.js`. Zamówienie i wycena niosą `session_id`, żeby dało się powiedzieć, które źródło ruchu przynosi pieniądze. Decyzja: ADR-0031.

## 8. Obowiązkowe dokumenty domenowe

| Obszar | Dokument do przeczytania przed zmianą |
|---|---|
| Marka, oferta, ceny, sprzęt | `MDs/AEJaCA_Brand_Reference.md` |
| Płatności Autopay | `MDs/AEJaCA_Autopay_Integration.md` |
| Geometria pierścionków | `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` |
| Prawo i dane osobowe | `MDs/AEJaCA_Legal_Audit.md` |
| Bezpieczeństwo API i panelu | `MDs/AEJaCA_Security_Audit.md` |
| Sklep i modele produktów | `MDs/AEJaCA_Shop_Plan.md` |
| B2B | `MDs/B2B_Architektura.md` |
| Sprzęt i procesy | `MDs/AEJaCA_Inwentarz_Sprzet_Procesy.md` |

## 9. Config file synchronization rule - MANDATORY before every deploy

**This is a hard rule. Every content change MUST be followed by updating ALL applicable files below before committing. No exceptions.**

### Full sync checklist (6 files)

| File | What to update | When |
|------|----------------|------|
| `public/llms.txt` | Entity facts, FAQ answers, services list, pricing examples, chain weave data, glossary links | Any content/pricing/service change |
| `public/robots.txt` | Keep crawler list in sync with `llms.txt` Crawl policy - same bots, same grouping | When adding/removing crawlers |
| `public/sitemap.xml` | Add new pages; update `<lastmod>` on changed pages (today's date `YYYY-MM-DD`) | Any page content or structure change |
| `chat-api/context.js` | AI assistant system prompt - must reflect current calculator options, prices, weave types, blog articles, tools | Any new feature, new blog post, new calculator option, price change |
| `src/seo/` (`seoData.js`, `schemas.js`) | Page meta titles/descriptions, structured data schemas (FAQ, Service, HowTo, Article) | New pages, changed page content, new FAQs |
| `MDs/AEJaCA_Brand_Reference.md` | **Kompletny dokument referencyjny marki** - ceny, oferta, kalkulatory, narzędzia, SEO, equipment, opinie, copywriting. Update the relevant section(s) and set the "Wygenerowano" date at the top. | Any change to: offer, prices, equipment, tools, calculators, copy, SEO strategy, shipping, reviews count |

### Trigger → action mapping

| What changed | Files to update |
|-------------|----------------|
| New page added | `sitemap.xml` (new URL) + `llms.txt` (Key pages) + `chat-api/context.js` (Key pages & anchors) + `seoData.js` + `Brand_Reference.md` (section 8 SEO + relevant offer section) |
| New blog post | `sitemap.xml` + `llms.txt` (Blog entry) + `chat-api/context.js` (Blog articles table) + `Brand_Reference.md` (section 8 Blog) |
| New glossary term | `sitemap.xml` + `llms.txt` (Glossary section) + `chat-api/context.js` (Glossary terms) + `Brand_Reference.md` (section 8 Glossary) |
| Calculator option changed (new weave, metal, service…) | `llms.txt` (relevant section) + `chat-api/context.js` (calculator section + use-case routing) + `Brand_Reference.md` (section 6) |
| Prices / shipping changed | `llms.txt` (FAQ + Pricing) + `chat-api/context.js` (pricing ballparks) + `Brand_Reference.md` (section 3/4/5/10) |
| New tool / free resource added | `llms.txt` + `chat-api/context.js` (add full tool section with inline-calc capability if applicable) + `Brand_Reference.md` (section 7) |
| New AI crawler | `llms.txt` (Crawl policy) + `robots.txt` + `Brand_Reference.md` (section 8 Crawlers) |
| Page content significantly updated | `sitemap.xml` (`<lastmod>`) + `llms.txt` if factual content changed + `Brand_Reference.md` if factual content changed |
| New equipment / machine | `About.jsx` + `Brand_Reference.md` (section 4 Equipment) |
| Zmiana geometrii kreatora (`src/geometry/ring/`) | `npm run sync:pricing` + `WORKER_VERSION` w `src/workers/ringGenerator.worker.js` + **wpis w dzienniku na końcu `MDs/AEJaCA_Geometria_Kreatora_Zasady.md`** (co było, co jest, czego się nauczyliśmy) |
| New review (Google) | `googleReviews.js` + `Brand_Reference.md` (section 11, update total count) |

### Pre-deploy verification checklist

Before every `git push`, confirm:
- [ ] `sitemap.xml` - `<lastmod>` updated for all changed pages, new pages added
- [ ] `llms.txt` - facts match the live site; "Last updated" date is today
- [ ] `robots.txt` - crawler list matches `llms.txt` Crawl policy
- [ ] `chat-api/context.js` - assistant knows about every new feature, blog post, calculator option, price range
- [ ] `src/seo/seoData.js` - meta title/description correct for changed pages
- [ ] `MDs/AEJaCA_Brand_Reference.md` - relevant sections updated, "Wygenerowano" date updated
- [ ] `npm run build` passes with 0 errors

### IndexNow (after deploy, when pages changed/added)

After a deploy that changes page content, adds/removes pages, or updates `sitemap.xml`, run `npm run indexnow` from a machine with normal network access (this pings Bing/Yandex to recrawl faster - sandboxed Claude Code sessions can't reach `api.indexnow.org`, their egress is allowlisted). Verification key file: `public/1cc7ba768716151f4028f5c9d6127177.txt`.

## 10. Bramka jakości przed review

Minimalnie:

1. Test, który odtwarza naprawiany błąd albo mierzy nowy wymóg.
2. Kontrola negatywna dla zmian wysokiego ryzyka.
3. Testy obszaru zmiany.
4. `npm run build` po zmianach strukturalnych lub przed integracją.
5. Przegląd diffu przez model, który nie był autorem implementacji.
6. Handoff z wynikami testów, ryzykami i tym, czego nie sprawdzono.

Przejście builda nie dowodzi poprawności biznesowej. Dokument domenowy i test
muszą opisywać ten sam stan docelowy.
