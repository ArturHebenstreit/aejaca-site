# Kopia przepływów n8n

Katalog trzyma osiem aktywnych przepływów n8n jako pliki JSON, wersjonowane
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

## Wyceny: kopia zawiera wersję działającą, nie szkic

W `AEJaCA — Quote Email Follow-up` `versionId` różni się od `activeVersionId`.
W n8n leży niewypublikowany szkic, inny niż to, co obsługuje ruch.

Szkic wstawia węzeł `Strip Binary` między `Upload to Drive` a powiadomienie
właściciela i przestawia to powiadomienie na `$json`. Wersja działająca idzie
z `Upload to Drive` prosto do powiadomienia i sięga po dane przez
`$('Prepare File for Upload')`.

W kopii jest **wersja działająca**, bo kopia zapasowa ma odtwarzać stan, który
obsługiwał klientów, a nie zmianę porzuconą w edytorze. Zdecyduj przy okazji,
czy szkic wypublikować, czy porzucić. Szkic wiszący bez końca to stan, w którym
kopia i n8n rozjeżdżają się cicho.

## Kontakt: szkic z sierpnia 2026, komplet załączników

21 sierpnia 2026 w `AEJaCA — Contact Form` powstał szkic naprawiający cichą
stratę plików. Formularz kalkulatora przyjmuje do sześciu załączników i backend
wysyła je wszystkie w polu `files`, ale przepływ czytał wyłącznie `file`, czyli
pojedynczy plik dokładany dla zgodności ze starszymi formularzami. Skutek:
na Dysk trafiał pierwszy plik, a właściciel dostawał mail z jedną nazwą i
odnośnikiem do folderu, w którym rzeczywiście leżał jeden plik. Nic nie
zgłaszało błędu, a widok był spójny, więc nie było czego zauważyć.

Szkic zmienia cztery węzły: `Prepare Attachment` buduje listę (`files`, a gdy
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

W kopii jest **wersja działająca**, zgodnie z zasadą opisaną wyżej. Po
wypublikowaniu szkicu uruchom `npm run backup:n8n`, żeby kopia dogoniła n8n.

## Identyfikatory folderów Google Drive

Trzy przepływy mają wpisane identyfikatory folderów na Dysku: `Zamowienia`
(pliki zamówień), `Kontakty` (formularz kontaktowy) i `Wyceny` (kalkulatory).
Po odtworzeniu Dysku od zera identyfikatory będą inne i trzeba je podmienić,
inaczej przepływ wgra się bez błędu i będzie zapisywał pliki donikąd.

Wszystkie przepływy dotykające Dysku i Gmaila wymagają też wskazania poświadczeń
Google po wgraniu.

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
