# AEJaCA, audyt zgodności z prawem polskim

Data: 2026-08-03. Zakres: obowiązki sklepu internetowego wobec konsumenta,
obowiązki informacyjne usługodawcy, ochrona danych osobowych, przechowywanie
danych w przeglądarce, praktyki rynkowe (dyrektywa Omnibus), płatności.

**To nie jest opinia prawna.** To przegląd tego, co jest w serwisie, zestawiony
z obowiązkami wynikającymi z przepisów. Zmiany w Regulaminie i Polityce
Prywatności warto przed publikacją dać do przejrzenia prawnikowi.

Podstawy odniesienia: ustawa o prawach konsumenta (upk), ustawa o świadczeniu
usług drogą elektroniczną (uśude), ustawa Prawo przedsiębiorców, RODO,
ustawa Prawo komunikacji elektronicznej (PKE, obowiązuje od 10.11.2024),
ustawa o przeciwdziałaniu nieuczciwym praktykom rynkowym w brzmieniu po
wdrożeniu dyrektywy Omnibus, ustawa o informowaniu o cenach.

Ocena ogólna: fundament jest zrobiony dobrze i wyraźnie z głową. Regulamin ma
17 sekcji w trzech językach i jest merytorycznie poprawny, łącznie z rzeczami,
które sklepy zwykle mylą: zwrot kosztu najtańszej dostawy, bieg terminu od
otrzymania oświadczenia, wyliczenie wyjątków z art. 38, rozdzielenie gwarancji
od odpowiedzialności ustawowej. Dane sprzedawcy siedzą w jednym pliku, razem
z uzasadnieniem, dlaczego brak NIP jest stanem zgodnym z prawem. Limit obrotu
działalności nierejestrowanej jest pilnowany w kodzie, a nie w pamięci.

Problemy leżą tam, gdzie tekst wiążący rozjechał się z tekstem, który klient
faktycznie czyta, oraz w Polityce Prywatności, która nie nadąża za tym, ile
usług obcych obsługuje dziś ten serwis.

Uwaga do czytającego: punkt W4 pierwszej wersji tego audytu był błędny, co
opisuję przy nim wprost zamiast po cichu poprawiać. Zostawiam ślad, bo audyt bez
śladu po własnych pomyłkach jest mniej wart niż audyt, który je pokazuje.

---

## Krytyczne

### K1. Mail po zakupie odbiera prawo odstąpienia każdemu, także tym, którym przysługuje

`chat-api/orderMail.js:43`, tekst wysyłany bezwarunkowo przy każdym zamówieniu:

> „Zamówienie dotyczy rzeczy wykonywanej według Twojej specyfikacji, więc zgodnie
> z art. 38 ustawy o prawach konsumenta i złożonym przez Ciebie oświadczeniem
> prawo odstąpienia od umowy nie przysługuje po rozpoczęciu wykonania."

Sklep sprzedaje dziś także **produkty gotowe z półki**, przy których prawo
odstąpienia w terminie 14 dni przysługuje w pełni. Katalog rozróżnia trzy reżimy
(`src/data/offerKinds.js`: `STANDARD`, `MADE_TO_ORDER`, `DIGITAL`) i koszyk je
przenosi, ale mail ich nie czyta i drukuje jedno zdanie dla wszystkich.

Dlaczego to jest krytyczne, a nie redakcyjne:

- Ten mail jest **potwierdzeniem zawarcia umowy na trwałym nośniku** w rozumieniu
  art. 21 upk. To jego treść liczy się jako informacja udzielona konsumentowi.
- Informowanie konsumenta, że nie ma prawa, które ma, to wprowadzenie w błąd co
  do jego uprawnień. Nieudzielenie informacji o prawie odstąpienia wydłuża
  ponadto sam termin odstąpienia do 12 miesięcy (art. 29 upk).
- Kupujący, który uwierzy mailowi, nie skorzysta z przysługującego mu prawa.

Naprawa: mail dobiera akapit do reżimu zamówienia. Trzy warianty: standardowy
(14 dni, jak odstąpić, wzór formularza), rzecz na zamówienie (brak prawa, ze
wskazaniem podstawy i złożonego oświadczenia), treść cyfrowa (brak prawa po
rozpoczęciu pobierania, za wyraźną zgodą). Zamówienie mieszane wymienia jedno
i drugie ze wskazaniem, których pozycji dotyczy.

---

## Wysokie

### W1. Polityka Prywatności nie realizuje obowiązku z art. 13 RODO

`src/i18n/{pl,en,de}.js`, klucz `privacy`: cztery ogólne akapity o tym, że dane
są zbierane i chronione.

Brakuje praktycznie całego wymaganego zestawu:

| Wymóg | Stan |
|---|---|
| Tożsamość i dane kontaktowe administratora | jest marka „AEJaCA", nie ma osoby ani adresu |
| Cele przetwarzania i **podstawy prawne** dla każdego | brak |
| Odbiorcy danych | brak, a jest ich kilkunastu |
| Przekazywanie poza EOG i zabezpieczenia | brak, a występuje |
| Okresy przechowywania | „tak długo, jak to konieczne" |
| Prawa: dostęp, sprostowanie, usunięcie, ograniczenie, przenoszenie, sprzeciw | wymieniono tylko usunięcie |
| Prawo skargi do Prezesa UODO | brak |
| Czy podanie danych jest wymogiem umownym | brak |
| Zautomatyzowane decyzje i profilowanie | brak wzmianki (nie występują, ale to też trzeba napisać) |

Odbiorcy, których realnie mamy i których trzeba wymienić: Railway (hosting
aplikacji i bazy), Cloudflare (serwis i sieć dostarczania), Google (poczta,
logowanie do panelu, opinie), OpenAI (asystent na stronie), n8n (przepływy
i poczta), Autopay (płatności), InPost i przewoźnicy (dostawa), dostawca
wyszukiwarki paczkomatów. **OpenAI oznacza przekazanie treści rozmowy poza EOG**,
co wymaga wskazania podstawy przekazania.

Osobno: chat zapisuje treść rozmowy razem ze skrótem adresu IP, a rozmowa bywa
„gorącym leadem" trafiającym do tabeli leadów. To przetwarzanie, o którym
rozmówca nie jest informowany w oknie czatu.

### W2. Brak wzoru formularza odstąpienia od umowy

Art. 12 ust. 1 pkt 9 upk wymaga udzielenia informacji o prawie odstąpienia
**przy użyciu wzoru pouczenia**, a wraz z nim udostępnienia wzoru formularza
odstąpienia (załącznik nr 2 do ustawy). W serwisie nie ma go w żadnej postaci.

Regulamin poprawnie mówi, że oświadczenie nie wymaga szczególnej formy, i to
zostaje. Wzór trzeba jednak udostępnić: jako sekcję na stronie Zwroty, do
skopiowania, oraz w mailu potwierdzającym przy zamówieniach objętych prawem
odstąpienia.

### W3. Strona Zwroty przeczy Regulaminowi w kwestii pieniędzy

`src/pages/Returns.jsx`: „Zwrot środków w ciągu 14 dni od otrzymania towaru".

Regulamin (§ 10) mówi poprawnie: 14 dni **od otrzymania oświadczenia**
o odstąpieniu, wraz ze zwrotem kosztu najtańszej oferowanej dostawy. Strona
podaje inny moment rozpoczęcia biegu terminu i przemilcza zwrot kosztu dostawy,
czyli akurat te dwie rzeczy, które są dla klienta pieniędzmi.

Wiążący jest Regulamin, ale w razie sporu liczy się też to, co klient przeczytał
w miejscu, do którego go wysłaliśmy. Dodatkowo lista wyłączeń na stronie Zwroty
jest szersza niż w Regulaminie („produkty z elementami sprowadzonymi na specjalne
życzenie"), a wyłączenia z art. 38 są zamknięte i nie podlegają rozszerzaniu.

### W4. Zgoda na przechowywanie informacji w urządzeniu

**Ten punkt był w pierwszej wersji audytu napisany błędnie i to jest jego
korekta.** Napisałem, że analityka zapisuje w przeglądarce kolejkę zdarzeń
`aejaca_events` razem z identyfikatorem sesji, więc wymaga zgody. Sprawdzenie
kodu linia po linii pokazało co innego.

Kolejka zdarzeń żyje w zmiennej w pamięci strony i ginie razem z nią.
Identyfikator odwiedzin jest losowany przy wejściu, też wyłącznie w pamięci,
więc nie łączy dwóch wizyt tej samej osoby. Zapis do `localStorage` istniał
w kodzie jedynie jako ścieżka zapasowa na wypadek braku skonfigurowanego punktu
zbiorczego i na produkcji nigdy się nie wykonywał.

Wniosek: **baner zgody nie jest potrzebny** i nie był potrzebny. Art. 398 PKE
dotyczy przechowywania informacji w urządzeniu, a statystyka niczego tam nie
przechowywała.

Co zostało zrobione mimo to:

- Ścieżka zapasowa z zapisem do `localStorage` usunięta. Zdanie „statystyka nic
  nie zapisuje w Twoim urządzeniu" było prawdziwe **warunkowo**, zależnie od
  konfiguracji. Teraz jest prawdziwe z konstrukcji, bo w kodzie nie ma czym tego
  zapisać.
- Powstał `scripts/check-browser-storage.mjs`, wpięty w budowanie. Wypisuje
  każde miejsce, które sięga do pamięci przeglądarki, i wymaga, żeby każde miało
  wpisane uzasadnienie. Dziś jest ich osiem: koszyk, ustawienia dwóch
  kalkulatorów, przeniesienie wyceny do koszyka, okno czatu, wybrany motyw,
  wybrany język i pamięć podręczna publicznych cen kamieni. Wszystkie to rzeczy,
  o które odwiedzający sam prosi albo bez których usługa nie działa, czyli
  zwolnione z obowiązku zgody.
- Skrypt pilnuje też wpisów bez pokrycia w kodzie, żeby lista nie stała się po
  roku fikcją, której nikt nie ufa.

Dzięki temu dołożenie kiedyś narzędzia analitycznego innej firmy albo piksela
reklamowego zatrzyma budowanie z komunikatem, zamiast po cichu wprowadzić
obowiązek, o którym nikt się nie dowie do kontroli.

---

## Średnie

| # | Rzecz | Podstawa |
|---|-------|----------|
| S1 | Wyświetlamy opinie Google, nigdzie nie mówiąc, **czy i jak sprawdzamy, że pochodzą od osób, które kupiły**. Przy prezentowaniu opinii jest to obowiązek informacyjny, a brak informacji jest wymieniony wprost jako praktyka wprowadzająca w błąd | Omnibus, art. 12 ust. 1 pkt 21 upk i uznk |
| S2 | Kody akcyjne ogłaszane publicznie (typu MATKA15) to ogłoszenie obniżki ceny, przy której podaje się najniższą cenę z 30 dni przed obniżką. Kod osobisty wręczony jednej osobie tego nie wymaga. Dziś nie ma mechanizmu podawania takiej ceny | ustawa o informowaniu o cenach, art. 4 ust. 2 |
| S3 | Przycisk zamówienia przy przelewie brzmi „Zamawiam z płatnością przelewem", przy bramce „Zapłać 1290,00 zł". Ustawa wymaga oznaczenia jednoznacznie wskazującego na **obowiązek zapłaty** | art. 17 ust. 3 upk |
| S4 | Teksty newslettera dla powracających nadal mówią o kodzie `AEJACA10`, którego już nie wystawiamy. Klient dostaje informację niezgodną z tym, co ma w skrzynce | rzetelność informacji |
| S5 | Okno czatu nie informuje, że rozmowa jest zapisywana ani że przetwarza ją dostawca spoza EOG | art. 13 RODO |
| S6 | Brak informacji o zasadach reklamacji **treści cyfrowych** (osobny reżim od 2023) przy produktach cyfrowych | upk rozdział 5b |

## Niskie i do odnotowania

**Limit działalności nierejestrowanej** jest pilnowany w kodzie
(`chat-api/orders.js`, 10 813,50 PLN na kwartał z zapasem 200 PLN, liczone
z zamówień opłaconych w bieżącym kwartale). To dobra praktyka, rzadko spotykana.
Kwota zależy od minimalnego wynagrodzenia, więc wymaga przeglądu przy każdej
jego zmianie; warto dopisać przy stałej datę i podstawę wyliczenia.

**Prawo probiercze**: wyroby z metali szlachetnych podlegają obowiązkowi
cechowania w Urzędzie Probierczym powyżej progów wagowych. Dokument marki mówi,
że cechujemy i zgłaszamy, więc to tylko przypomnienie przy zmianie skali.

**Dostępność cyfrowa** (europejski akt o dostępności, obowiązuje od 28.06.2025):
mikroprzedsiębiorcy świadczący usługi są zwolnieni, więc dziś nie dotyczy.
Zmieni się to przy przekroczeniu progów, czyli razem z rejestracją działalności.

**KSeF**: obowiązek dotyczy podatników VAT. Przy zwolnieniu nie występuje, ale
to kolejna rzecz, która pojawi się razem z rejestracją.

## Sprawdzone i zgodne

Regulamin: 17 sekcji, trzy języki, data wejścia w życie, tryb zmian. Prawo
odstąpienia opisane poprawnie, z biegiem terminu, zwrotem kosztu najtańszej
dostawy, odpowiedzialnością za zmniejszenie wartości rzeczy i zamkniętą listą
wyjątków. Niezgodność towaru z umową na dwa lata, termin 14 dni na odpowiedź,
gwarancja wyraźnie oddzielona od uprawnień ustawowych. Pozasądowe rozwiązywanie
sporów opisane przez rzecznika konsumentów, Inspekcję Handlową i UOKiK, **bez
odesłania do unijnej platformy ODR, która została wyłączona 20 lipca 2025**.
Wiele sklepów nadal do niej odsyła, ten nie.

Dane sprzedawcy: imię i nazwisko, adres do korespondencji, e-mail, telefon,
status działalności nierejestrowanej wyjaśniony wprost, wszystko w jednym pliku
(`src/data/sellerInfo.js`) i w Regulaminie.

Kasa: cena całkowita widoczna przed zamówieniem, koszt dostawy wyliczany przed
zapłatą i nigdy nie przyjmowany od przeglądarki, zgoda na regulamin osobno,
osobne oświadczenie o utracie prawa odstąpienia przy rzeczach na zamówienie,
osobne przy treściach cyfrowych. Oświadczenia zapisywane ze znacznikiem czasu
przy zamówieniu (`accepted_terms_at`, `waived_withdrawal_at`,
`digital_immediate_at`), czyli dowód, a nie deklaracja.

Płatności: obsługiwane przez Autopay jako licencjonowaną instytucję płatniczą,
nie przechowujemy danych kart, nie jesteśmy dostawcą usług płatniczych. Kwota
w euro zamrażana razem z kursem przy zamówieniu, co usuwa spór o wysokość
należności. Zgoda marketingowa na newsletter zbierana osobno od regulaminu.

---

## Plan naprawy

**Etap 1, zrobiony.** Mail po zakupie dobiera pouczenie do tego, co faktycznie
jest w zamówieniu (K1). Rzecz z półki dostaje pełne pouczenie o 14 dniach razem
ze zwrotem kosztu najtańszej dostawy, rzecz wykonywana pod klienta i treść
cyfrowa dostają wyłączenie ze wskazaniem podstawy (art. 38 pkt 3 albo pkt 13),
a zamówienie mieszane wymienia z nazwy, których pozycji dotyczy które zdanie.
Przy zamówieniach objętych prawem mail niesie **wzór formularza odstąpienia**
z numerem zamówienia oraz danymi adresata (W2 w części dotyczącej maila).

Reguła doboru siedzi w `chat-api/withdrawal.js`, treści w `orderMail.js`,
sprawdzenia w `withdrawal.test.mjs` i `orderMail.test.mjs`, uruchamiane przez
`npm test`. Jeden z testów pilnuje wprost tego, co było błędem: mail dla rzeczy
z półki nie może zawierać zwrotu „nie przysługuje".

Przy okazji: dane sprzedawcy były w backendzie **ręcznym lustrem**
`src/data/sellerInfo.js` i zdążyły się rozjechać (brakowało adresu). Skoro stoją
w pouczeniu i we wzorze formularza, czyli w treści mającej moc wobec konsumenta,
jadą teraz przez `npm run sync:pricing` jak reszta rdzenia.

**Etap 2, zrobiony.** Polityka Prywatności napisana od nowa (W1): 11 sekcji
w trzech językach, administrator z imienia i adresu, pełne wyliczenie celów wraz
z podstawą prawną i okresem dla każdego, odbiorcy wymienieni z nazwy, osobna
sekcja o przekazywaniu poza EOG, komplet praw wraz ze skargą do Prezesa UODO,
informacja o braku profilowania i o tym, co serwis trzyma w przeglądarce.
Treść w `src/data/privacyContent.js`, strona renderuje ją tak jak Regulamin.

Okno czatu mówi teraz przed pierwszą wiadomością, że rozmowa jest zapisywana na
12 miesięcy i że odpowiedzi generuje dostawca spoza EOG, z odnośnikiem do
polityki (S5). Asystent dostał osobną sekcję o danych osobowych, żeby na pytanie
„co robicie z moimi danymi" odpowiadał zgodnie z polityką, a przy prośbie
o podanie danych osobowych kierował do formularza zamiast zbierać je w czacie.

**Rzecz, która wyszła przy pisaniu.** Polityka podaje konkretne terminy, a system
niczego nie kasował: wgrane pliki po 14 dniach dostawały tylko znacznik
„porzucony", rozmowy leżały bez końca. Termin, którego nikt nie egzekwuje, jest
przy kontroli gorszy niż brak terminu, bo dowodzi, że wiedzieliśmy. Powstało
więc `chat-api/retention.js` z zadaniem raz na dobę, z terminami jeden do jednego
z sekcją 3 polityki. Zamówień i dokumentacji sprzedaży zadanie nie rusza, bo
trzyma je obowiązek podatkowy i przedawnienie roszczeń. Testy pilnują przede
wszystkim tego, czego kasować NIE wolno.

**Etap 3, zrobiony.** Strona Zwroty przepisana tak, żeby mówiła to samo co
Regulamin (W3): bieg 14 dni od odebrania przesyłki na złożenie oświadczenia,
zwrot wszystkich płatności **wraz z kosztem najtańszej oferowanej dostawy**
w ciągu 14 dni od otrzymania oświadczenia, prawo wstrzymania zwrotu do czasu
otrzymania towaru albo dowodu odesłania, odpowiedzialność za zmniejszenie
wartości rzeczy. Lista wyłączeń zawężona do wyliczenia z art. 38; zniknął zapis
o „elementach sprowadzonych na specjalne życzenie" w brzmieniu szerszym niż
ustawa. Doszła sekcja ze **wzorem formularza odstąpienia** (załącznik nr 2),
z danymi adresata i przyciskiem kopiowania (W2 w części dotyczącej strony).

Opinie Google opatrzone informacją, skąd pochodzą i czego o nich nie wiemy (S1):
że pokazujemy je w całości bez wybierania korzystnych, że wystawić je może każdy
z kontem Google, że nie możemy ich usunąć ani sprawdzić, czy autor u nas kupił,
i że ich nie zamawiamy ani za nie nie płacimy. Napisanie „zweryfikowane" byłoby
tu gorsze niż milczenie, bo weryfikacji nie da się przeprowadzić.

Zsynchronizowane: `llms.txt` (nowa odpowiedź o zwrotach), `chat-api/context.js`
(sekcja o zwrotach z wyraźnym zakazem mówienia, że przy produkcie z półki prawo
nie przysługuje), `sitemap.xml`, dokument marki.

**Etap 4, zrobiony, z korektą ustalenia.** Okazało się, że wybór między banerem
a dokładnością danych w ogóle nie istniał: analityka niczego nie zapisywała
w urządzeniu, więc zgoda nie była potrzebna. Szczegóły przy W4. Zamiast banera
powstało zabezpieczenie na przyszłość: kontrola w budowaniu wypisująca każde
miejsce sięgające do pamięci przeglądarki i wymagająca uzasadnienia dla każdego.

**Etap 5, zrobiony.**

- **S3.** Przycisk zamówienia mówi teraz o obowiązku zapłaty: „Kupuję i płacę"
  przy bramce i „Zamawiam z obowiązkiem zapłaty przelewem" przy przelewie,
  w trzech językach, na obu ścieżkach zakupu.
- **S4.** Teksty dla powracających subskrybentów nie powołują się już na kod
  `AEJACA10`, którego nie wystawiamy od czasu wprowadzenia kodów osobistych.
- **S6.** Regulamin § 11 opisuje osobny reżim odpowiedzialności za treści
  cyfrowe (rozdział 5b upk), w tym roczne domniemanie przy dostarczeniu
  jednorazowym, w trzech językach.
- **S2.** Powstała historia cen produktów (`product_price_history`), zapisywana
  przy każdej realnej zmianie ceny, oraz kolumna **„Min. 30 dni"** w panelu
  produktów. Formularz tworzenia kodu akcyjnego przypomina, że hasło ogłoszone
  publicznie jest ogłoszeniem obniżki i wymaga podania najniższej ceny z 30 dni,
  a kod wręczony jednej osobie tego nie wymaga.

  Karty produktów i strony produktów pokazują tę cenę **same, gdy obniżka
  faktycznie jest**, czyli gdy cena bieżąca jest niższa od najwyższej z okna
  porównawczego. Przy cenie niezmienionej nie ma tam nic i to też jest wymóg,
  a nie oszczędność: napis „najniższa cena z 30 dni" obok ceny, która nie
  została obniżona, sugeruje promocję, której nie ma.

  Osobne zdanie dostaje pozycja w sprzedaży krócej niż 30 dni: wtedy podajemy
  cenę od rozpoczęcia sprzedaży, zgodnie z art. 4 ust. 3 ustawy o informowaniu
  o cenach, zamiast udawać, że mamy pełną historię.

  Reguła siedzi w `src/shop/priceHistory.js` z testami wpiętymi w budowanie,
  bo to liczba pokazywana klientowi jako fakt. Testy pilnują przede wszystkim
  przypadków, w których informacji pokazać NIE wolno: brak zmiany ceny, podwyżka,
  powrót do poprzedniego poziomu i brak historii.

---

## Uzupełnienie: dane kupujących (2026-08-03)

Pytanie właściciela po zamknięciu planu: czy retencja obejmuje też osoby, które
kupiły. Odpowiedź brzmiała „częściowo" i to była luka warta domknięcia.

Zadanie sprzątające celowo omijało zamówienia, bo trzyma je obowiązek podatkowy
i termin przedawnienia roszczeń. Skutek uboczny był jednak taki, że **dane
kupującego nie miały żadnej daty końcowej**: polityka mówiła o pięciu i sześciu
latach, a w praktyce imię, nazwisko, telefon, adres dostawy i skrót adresu IP
leżałyby w bazie w nieskończoność. Termin, którego nikt nie egzekwuje, jest przy
kontroli gorszy niż brak terminu.

Rozwiązaniem jest **anonimizacja zamiast kasowania**, bo dwa obowiązki idą tu
w przeciwne strony. Dokument sprzedaży ma przetrwać (kwoty, daty, numer
zamówienia, co kupiono), bo wymaga tego prawo podatkowe. Dane osoby mają zniknąć,
bo po upływie terminu nie mają już podstawy. Po sześciu latach od zapłaty
zamówienie traci więc imię i nazwisko, telefon, adres, skrót IP, a adres e-mail
zostaje zastąpiony adresem w domenie `.invalid`, która z definicji donikąd nie
prowadzi. Przebieg jest powtarzalny: wiersze już zanonimizowane wypadają z warunku.

Osobno: surowe komunikaty od operatora płatności (`payment_notifications.raw_xml`)
czyszczone po 12 miesiącach. Służą do wyjaśnienia spornej wpłaty, a nie do
archiwum, a niosą dane płatnika od bramki. Sam ślad, że płatność była i jaka,
zostaje przy zamówieniu.

Testy pilnują obu stron tej granicy: że dane osoby znikają, i że `total_grosze`,
`order_ref`, `paid_at` oraz `status` pozostają nietknięte. Polityka Prywatności
opisuje to teraz wprost w sekcji 3, w trzech językach, bo klient ma prawo
wiedzieć, że po latach zostaje po nim rachunek bez nazwiska, a nie że „usuwamy
wszystko", co byłoby nieprawdą.

### Co zostaje po Twojej stronie, poza kodem

Trzy rzeczy, których nie da się zrobić w repozytorium:

1. **Umowy powierzenia przetwarzania** z dostawcami wymienionymi w polityce
   (Railway, Cloudflare, Google, OpenAI, n8n). Zwykle akceptuje się je
   w ustawieniach konta jako DPA. Autopay i przewoźnicy występują jako odrębni
   administratorzy, więc tam powierzenia nie potrzeba.
2. **Rejestr czynności przetwarzania**. Przy tej skali wystarczy tabela na jednej
   stronie, a sekcja 3 polityki jest gotowym szkieletem: cel, podstawa, kategorie
   danych, odbiorcy, termin.
3. **Procedura na żądanie klienta** (dostęp, usunięcie, sprzeciw). Dziś odpowiada
   się ręcznie zapytaniem do bazy. Przy jednym zamówieniu miesięcznie to
   wystarcza; przy kilkudziesięciu warto dołożyć w panelu wyszukiwarkę po adresie
   e-mail, która pokaże wszystko, co o kimś mamy.

---

## Stan po pięciu etapach

Zamknięte: K1, W1, W2, W3, S1, S3, S4, S5, S6. W4 zamknięty korektą ustalenia,
bez potrzeby zmian w zachowaniu serwisu. S2 zamknięty: historia cen jest zbierana, panel pokazuje kolumnę „Min. 30 dni",
a sklep wystawia informację o obniżce sam, w chwili gdy obniżka się pojawi.

Do pilnowania przy zmianach: okresy w Polityce Prywatności muszą zgadzać się
z `chat-api/retention.js`, a strona Zwroty z § 10 Regulaminu. Obie pary już raz
się rozjechały.

Retencja danych kupujących domknięta osobno, patrz uzupełnienie powyżej.
