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

### W4. Brak zgody na przechowywanie informacji w urządzeniu

Art. 398 PKE (od 10.11.2024, wcześniej art. 173 Prawa telekomunikacyjnego)
wymaga zgody na przechowywanie informacji w urządzeniu końcowym i dostęp do
nich, poza tym, co jest niezbędne do wykonania usługi żądanej przez użytkownika.

Serwis zapisuje w przeglądarce: koszyk, ustawienia kalkulatorów, wybrany motyw
(to jest niezbędne albo wprost żądane przez użytkownika, bez zgody) oraz
**kolejkę zdarzeń analitycznych `aejaca_events` razem z identyfikatorem sesji**,
wysyłaną potem na własny serwer. Analityka nie jest niezbędna do świadczenia
usługi, więc wymaga zgody, a zgody nie ma, bo nie ma żadnego mechanizmu jej
zbierania.

Do rozstrzygnięcia jest tylko sposób: albo baner zgody wyłącznie dla analityki
(reszta bez zgody, bo niezbędna), albo rezygnacja z identyfikatora sesji na rzecz
zliczania bez przechowywania czegokolwiek w urządzeniu. Druga droga jest tańsza
w utrzymaniu i nie psuje pierwszego wrażenia ze strony.

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

**Etap 2.** Nowa Polityka Prywatności realizująca art. 13 RODO, z tabelą celów,
podstaw, odbiorców i okresów przechowywania (W1), plus jedno zdanie
informacyjne w oknie czatu (S5).

**Etap 3.** Strona Zwroty zgodna z Regulaminem, z wzorem formularza (W3),
oraz informacja o weryfikacji opinii (S1).

**Etap 4.** Zgoda na analitykę albo rezygnacja z identyfikatora w przeglądarce
(W4). Do decyzji właściciela, bo to wybór między banerem a dokładnością danych.

**Etap 5.** Drobiazgi: nazwa przycisku zamówienia (S3), teksty newslettera (S4),
reklamacje treści cyfrowych (S6), mechanizm najniższej ceny z 30 dni na czas
akcji rabatowych (S2).
