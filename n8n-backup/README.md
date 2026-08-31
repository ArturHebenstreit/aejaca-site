# Kopia przepływów n8n

Katalog trzyma siedem aktywnych przepływów n8n jako pliki JSON, wersjonowane
razem z kodem. Odtworzenie sprowadza się do wgrania pliku w n8n przez
**Import from File** i uzupełnienia miejsc wypisanych w `ODTWORZENIE.md`.

`ODTWORZENIE.md` i `index.json` powstają automatycznie przy każdym uruchomieniu
`npm run backup:n8n`. Ten plik jest pisany ręcznie i skrypt go nie dotyka, więc
uwagi trwałe zapisuj tutaj.

## Skąd pochodzi obecna zawartość

Pliki powstały w sierpniu 2026 z danych pobranych przez połączenie MCP do n8n,
a nie przez REST API n8n, bo klucz API nie był dostępny w sesji. Przeszły
następnie przez ten sam skrypt kopii co zwykle, więc formatowanie, zamiana
sekretów, skaner i `index.json` pochodzą z produkcyjnego kodu.

Różnica dotyczy wyłącznie tego, jak dane trafiły do skryptu: zostały przepisane,
a nie przeniesione bajt w bajt. Każdy plik sprawdzono maszynowo pod kątem
poprawności JSON, zgodności grafu połączeń z listą węzłów i braku sekretów, ale
to nie jest to samo co porównanie znak po znaku z oryginałem.

**Wniosek praktyczny:** przy pierwszej okazji uruchom `npm run backup:n8n`
z kluczem API. Jeśli `git diff` nic nie pokaże, kopia jest wierna i sprawa
zamknięta. Jeśli coś pokaże, wersja ze skryptu jest tą właściwą.

## Wyceny: szkic z edytora poszedł na produkcję (31 sierpnia 2026)

Do 31 sierpnia 2026 w `AEJaCA — Quote Email Follow-up` leżał niewypublikowany
szkic, inny niż to, co obsługiwało ruch: wstawiał węzeł `Strip Binary` między
`Upload to Drive` a powiadomienie właściciela i przestawiał to powiadomienie
z `$('Prepare File for Upload')` na `$json`. Kopia trzymała wtedy wersję
działającą, bo kopia zapasowa ma odtwarzać stan, który obsługiwał klientów.

Publikacja przepływu przy przestawianiu maili na chat-api promowała cały szkic,
bo `publish_workflow` publikuje bieżącą wersję roboczą, a nie wybrane zmiany.
Od tej pory `Strip Binary` stoi na produkcji i kopia zawiera właśnie ten układ.
Zmiana jest w tym przepływie nieszkodliwa: `Prepare File for Upload` oddaje tu
jedną pozycję, więc zwijanie nie ma czego zwijać, a powiadomienie czyta te same
dane inną drogą. Wniosek na przyszłość: wiszący szkic to stan, w którym pierwsza
publikacja wypycha na produkcję cudzą porzuconą zmianę razem z własną.

## Kontakt: komplet załączników zamiast pierwszego (sierpień 2026)

21 sierpnia 2026 w `AEJaCA — Contact Form` wypublikowano zmianę naprawiającą cichą
stratę plików. Formularz kalkulatora przyjmuje do sześciu załączników i backend
wysyła je wszystkie w polu `files`, ale przepływ czytał wyłącznie `file`, czyli
pojedynczy plik dokładany dla zgodności ze starszymi formularzami. Skutek:
na Dysk trafiał pierwszy plik, a właściciel dostawał mail z jedną nazwą i
odnośnikiem do folderu, w którym rzeczywiście leżał jeden plik. Nic nie
zgłaszało błędu, a widok był spójny, więc nie było czego zauważyć.

Zmiana dotyczy czterech węzłów: `Prepare Attachment` buduje listę (`files`, a gdy
puste, `file`), `Prepare File for Upload` oddaje po jednej pozycji na plik,
`Upload to Drive` bierze nazwę z pozycji zamiast z `body.file.name`, a
`Strip Binary` zwija wynik z powrotem do jednej pozycji. To ostatnie jest
warunkiem koniecznym: węzeł Dysku oddaje pozycję na każdy wgrany plik, więc
bez zwinięcia właściciel dostałby sześć osobnych powiadomień o jednym
zapytaniu. Mail podaje teraz liczbę plików obok nazw, bo to liczba pozwala
zauważyć brak.

Logikę sprawdzono symulacją sześciu przypadków (sześć plików, jeden plik pod
`files`, stare pole `file` z prefiksem `data:`, brak plików, `files` puste przy
obecnym `file`, pozycja bez `data`). Nie sprawdzono jej przeciwko prawdziwemu
Dyskowi ani Gmailowi, bo próbne uruchomienie wysyła prawdziwe maile.

Plik kopii został **poprawiony ręcznie**, bo w tej sesji nie było klucza API do
n8n. Podmieniono w nim dokładnie te pięć wartości, które poszły na produkcję,
i nic poza nimi; `git diff` pokazał sześć zmienionych linii. To nadal nie jest
to samo co zrzut ze skryptu, więc przy pierwszej okazji z kluczem uruchom
`npm run backup:n8n`. Pusty `git diff` zamyka sprawę, a niepusty znaczy, że
właściwa jest wersja ze skryptu.

## Identyfikatory folderów Google Drive

Trzy przepływy mają wpisane identyfikatory folderów na Dysku: `Zamowienia`
(pliki zamówień), `Kontakty` (formularz kontaktowy) i `Wyceny` (kalkulatory).
Po odtworzeniu Dysku od zera identyfikatory będą inne i trzeba je podmienić,
inaczej przepływ wgra się bez błędu i będzie zapisywał pliki donikąd.

Wszystkie przepływy dotykające Dysku i Gmaila wymagają też wskazania poświadczeń
Google po wgraniu.

## Podział pracy między n8n a chat-api (od 2026-08-31)

Sześć wiadomości do klienta powstawało w węzłach n8n, każda z własnym HTML-em
wpisanym w pole `message`: szacunek z kalkulatora, dwa przypomnienia do niego,
potwierdzenie formularza kontaktowego, powitanie w newsletterze i autoodpowiedź
na maila. Miały ciemną kopertę, znak wstawiony filtrem CSS, którego klient
pocztowy nie wykonuje, i podpis w trzech linijkach. Klient dostawał w jednym
tygodniu dwie firmy.

**Treść i wysyłka mieszkają teraz w `chat-api/leadMail.js`** (ADR-0030).
Przepływy w n8n wołają jedną trasę:

```
POST https://aejacachatapi-production.up.railway.app/api/mail/lead
Nagłówek: x-admin-token: <ADMIN_API_TOKEN>
Ciało:    { "rodzaj": "...", "lang": "pl", "to": "klient@example.com", ... }
```

| `rodzaj` | zastępuje węzeł | dodatkowe pola |
|---|---|---|
| `kalkulator` | Send Quote Email | `kalkulator`, `parametry`, `plik`, `cenaPln`, `cenaEur` |
| `followup48` | Follow-up 48h | brak |
| `rabat7` | Discount offer (7d) | `procent` (domyślnie 5), `dni` (domyślnie 14); kod wystawia trasa sama |
| `kontakt` | Send Confirmation to User | `wiadomosc` |
| `newsletter` | Send Welcome + Discount | `kod`, `procent`, `waznyDo` |
| `autoodpowiedz` | Send Thank-You Reply | `temat`, `inReplyTo`, `threadId` |

W n8n zostaje wszystko, co nie jest treścią: webhooki, wgrywanie na Dysk,
powiadomienia dla pracowni i odliczanie 48 godzin oraz 7 dni.

**Kolejność wdrożenia jest wiążąca.** Railway buduje `chat-api` z gałęzi
`main`, więc przepływy wolno przestawić dopiero po scaleniu i wdrożeniu.
Przestawiony wcześniej przepływ przestałby wysyłać cokolwiek.

## Sześć maili na chat-api: co zmieniło się w kopii (31 sierpnia 2026)

Przestawienie opisane niżej dotknęło trzech przepływów i wszystkie trzy pliki
zostały tu zaktualizowane: w każdym doszedł węzeł `httpRequest` wołający
`/api/mail/lead`, a stary węzeł Gmaila jest wyłączony, nie skasowany. Wyłączony
węzeł n8n przepuszcza dane dalej, więc odliczanie 48 godzin i 7 dni działa jak
przedtem. `AEJaCA Auto-reply (thank you)` został zarchiwizowany i znika z kopii:
odpowiedź na pierwszego maila wysyła teraz sam chat-api (ADR-0030).

Pliki poprawiono **ręcznie**, na danych z połączenia MCP, bo w tej sesji nie było
klucza API do n8n, a sieć środowiska i tak nie sięga instancji. Przy okazji
wyszło, ile warte są starsze przepisane kopie: w `Wait 5 more days` kopia miała
`amount: 5`, a w n8n tego pola nie było w ogóle, czyli węzeł czekał domyślną dobę
i mail o rabacie wychodził trzeciego dnia ze zdaniem o wycenie sprzed tygodnia.
Pole zostało 31 sierpnia 2026 ustawione na 5 i przepływ opublikowany (decyzja
właściciela). Prawie każdy `webhookId` w tym przepływie też różnił się od
prawdziwego. Struktura i parametry się zgadzały, drobne identyfikatory nie. **Przy pierwszej okazji
z kluczem API uruchom `npm run backup:n8n`**: pusty `git diff` zamyka sprawę,
a niepusty znaczy, że właściwa jest wersja ze skryptu.

## Czego celowo nie ma w kopii

W sierpniu 2026 zarchiwizowano szesnaście przepływów pomocniczych: piętnaście
z rodziny `Laser Matrix` oraz `Chat API — diagnostic`. Były to jednorazowe
narzędzia do zasypania tabeli `laser_matrix` w maju 2026 i do sprawdzenia
wyniku. Żaden nie miał wyzwalacza, więc strona nie miała jak ich zawołać.

Nie odtwarzamy ich, bo zasyp tabeli robi się dziś z repozytorium jednym
poleceniem:

```
DATABASE_URL="…" node scripts/import-laser-matrix.mjs
```

Źródłem jest `docs/Laser_Matryca_Materialowa_20260509_v.1.0.xlsx`, schemat
tabeli leży w `scripts/laser-matrix-schema.sql`. To jest pełniejsze niż tamte
przepływy: obejmuje wszystkie 1034 wiersze naraz, zamiast pięciu wstawek po
dwieście i łatki na brakujące pięćdziesiąt dwa.

Doszedł przy okazji drugi powód. Wśród zarchiwizowanych siedział przepływ
kasujący wiersz z produkcyjnej bazy po ręcznym uruchomieniu, sąsiadujący na
liście z przepływami uruchamianymi naprawdę.

## Zasada na przyszłość

Sekret w parametrze węzła to usterka, nie szczegół. Wartość ma siedzieć
w poświadczeniach n8n, a w parametrze ma stać odwołanie do nich. Skrypt kopii
tego pilnuje: wartość przy nazwie mówiącej o sekrecie zamienia na znacznik,
a klucz w polu o nazwie niemówiącej niczego zatrzymuje całą kopię z komunikatem,
gdzie go szukać.
