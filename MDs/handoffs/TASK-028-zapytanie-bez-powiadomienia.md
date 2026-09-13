---
task_id: TASK-028
status: review
author: Claude Code
branch: claude/serwis-development-skills-3vuba9
base_commit: 9953ab2
last_commit: d6d8107
updated: 2026-09-13
---

# Handoff: zapytanie, o ktorym nikt sie nie dowiedzial

## Zgloszenie

Wlasciciel zobaczyl w panelu zapytanie `WY20260910-E12C31C4` z 10 wrzesnia,
23:58, o odlew 50 zawieszek w srebrze 925. Mailem nie przyszlo. Zauwazyl je
przypadkiem, trzy dni pozniej.

## Co ustalono

Zapytanie zapisalo sie w bazie, bo zapis i powiadomienie to dwie osobne drogi.
Powiadomienie nie doszlo do n8n, wiec mail nigdy nie powstal.

| Zrodlo | Co pokazuje |
|---|---|
| n8n, przeplyw "AEJaCA - Contact Form" | 7 uruchomien, zadnego 10 wrzesnia o 21:58 UTC |
| Skrzynka `contact@aejaca.com` | adresu `jakubgroth@gmail.com` nie ma nigdzie, takze w spamie i koszu |
| Sasiednie zapytania (9, 10 i 13 wrzesnia) | kazde ma i uruchomienie w n8n, i maila |
| Zmienna `N8N_CONTACT_WEBHOOK_URL` na Railwayu | ustawiona, wiec to nie byl brak konfiguracji |

Dokladnej przyczyny tej jednej nieudanej proby nie da sie juz odtworzyc: logi
Railwaya sa przypisane do wdrozenia, a biezace jest nowsze niz 10 wrzesnia.
I to jest sedno sprawy, a nie ciekawostka.

## Dwie usterki, obie naprawione

**1. Powiadomienie bylo wysylane i zapominane.** `fetch` bez ponowienia, bez
limitu czasu, bez sladu w bazie. Nieudana proba konczyla sie jedna linijka
w konsoli, a klient widzial na ekranie "wyslane". Teraz: `wyslijPowiadomienie`
robi trzy proby z rosnaca przerwa i limitem 15 s, a wynik zapisuje sie w nowych
kolumnach `leads.notified_at` i `leads.notify_error`. Zapis zgloszenia idzie
PRZED powiadomieniem, bo to on przetrwa restart kontenera.

**2. Poranny raport chowal to, co nowe.** Lista zapytan bez odpowiedzi idzie
`ORDER BY created_at ASC` i konczy sie po pietnastu pozycjach. Bez odpowiedzi
czekalo 27 zapytan, wiec wszystko z ostatniej doby wypadalo poza raport.
Mechanizm, ktory mial byc siatka bezpieczenstwa, byl posortowany tak, ze chowal
wlasnie to, co pilne. Teraz zapytania z ostatnich 48 godzin maja wlasna sekcje
nad lista zaleglosci, bez obcinania, a te bez powiadomienia sa oznaczone
napisem `[POWIADOMIENIE NIE DOSZLO]`, z licznikiem w naglowku.

**Przy okazji: numer sprawy powstawal PO wyslaniu powiadomienia**, wiec mail
nie mogl go niesc i wpisu w panelu nie dalo sie z nim polaczyc inaczej niz po
adresie i godzinie. Teraz numer powstaje pierwszy. Sciezka `/api/quote` miala
to poprawnie od poczatku i dostala tylko ponowienie oraz slad.

## Pliki

- `chat-api/server.js`: migracja `leads`, `wyslijPowiadomienie`,
  `zapiszStanPowiadomienia`, przebudowa `/api/contact` i `/api/quote`
- `chat-api/podsumowanieDnia.js`: `notified_at` i `notify_error` w zapytaniu,
  `wiekGodzin`, sekcja nowych zapytan, licznik w naglowku
- `scripts/test-podsumowanie-dnia.mjs`: sekcja 5, szesc sprawdzianow

## Sprawdziany

Sekcja 5 odtwarza ten przypadek: 27 starych zapytan i jedno sprzed szesciu
godzin z nieudanym powiadomieniem. Wymaga, zeby nowe bylo w raporcie, stalo
PRZED lista ogolna, bylo nazwane jako bez powiadomienia i policzone w naglowku.
Kontrola negatywna pilnuje, ze przy sprawnym powiadomieniu raport milczy.

## Co zostaje dla wlasciciela

1. **Odpisac Jakubowi.** Czeka czwarty dzien, numer `WY20260910-E12C31C4`.
2. **Wdrozyc chat-api.** Poprawki siedza po stronie serwera, wiec do wdrozenia
   nic sie nie zmienia. Migracja kolumn wykonuje sie sama przy starcie.
3. Rozwazyc ten sam mechanizm dla pozostalych webhookow (pliki na Dysk,
   gotowe pliki zamowienia). Maja dzis ten sam ksztalt: wyslij i zapomnij.
