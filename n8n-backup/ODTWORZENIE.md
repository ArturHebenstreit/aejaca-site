# Odtworzenie przepływów n8n

Pliki JSON w tym katalogu wgrywa się w n8n przez **Import from File**.

Wartości sekretów są zamienione na `__USTAW_PRZY_ODTWARZANIU__`. Po wgraniu
trzeba je uzupełnić, najlepiej przenosząc do poświadczeń n8n (Credentials)
zamiast wpisywać wprost, bo wpisana wartość wróci do kopii przy następnym
eksporcie.

## Stan kopii

**Ta kopia jest niepełna i to jest świadome.** Zawiera dwa przepływy obsługujące
pliki zamówień, przepisane ręcznie w trakcie pracy nad kopią zapasową i
sprawdzone maszynowo (poprawność JSON, liczba węzłów, brak sekretu).

Pozostałych sześć aktywnych przepływów czeka na uruchomienie `npm run backup:n8n`.
Powód jest konkretny: one niosą w sobie szablony wiadomości HTML długości tysięcy
znaków, z wyrażeniami n8n w środku. Przepisywanie takiej treści ręcznie to
dokładnie ten rodzaj pracy, przy którym powstaje kopia wyglądająca dobrze
i niedająca się odtworzyć. Skrypt przenosi bajty zamiast je przepisywać.

Brakuje: newslettera z kodami rabatowymi, formularza kontaktowego, wycen,
automatycznej odpowiedzi, raportu tygodniowego i alertu anomalii.

## Czego celowo nie ma w kopii

W sierpniu 2026 zarchiwizowano szesnaście przepływów pomocniczych: piętnaście
z rodziny `Laser Matrix` oraz `Chat API — diagnostic`. Były to jednorazowe
narzędzia do zasypania tabeli `laser_matrix` w maju 2026 i do sprawdzenia
wyniku. Żaden nie miał wyzwalacza, więc strona nie miała jak ich zawołać.

Nie odtwarzamy ich, bo zasyp tabeli robi się dziś z repozytorium i jednym
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

## Miejsca do uzupełnienia po wgraniu

- **AEJaCA: pliki zamowien na Dysk / Oddzwonienie do AEJaCA**: nagłówek
  `x-upload-token`. Wartość: zmienna `UPLOAD_CALLBACK_TOKEN` z usługi chat-api
  w Railway.

Poza tym oba przepływy wymagają wskazania **poświadczeń Google Drive** oraz
sprawdzenia, czy identyfikator folderu `Zamowienia` zgadza się z tym na Dysku.
Identyfikator jest wpisany w plikach i po odtworzeniu Dysku od zera będzie inny.

## Zasada na przyszłość

Sekret w parametrze węzła to usterka, nie szczegół. Wartość ma siedzieć
w poświadczeniach n8n, a w parametrze ma stać odwołanie do nich. Skrypt kopii
pilnuje tego: wartość przy nazwie mówiącej o sekrecie zamienia na znacznik,
a klucz w polu o nazwie niemówiącej niczego zatrzymuje całą kopię z komunikatem,
gdzie go szukać.
