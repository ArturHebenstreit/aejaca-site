---
status: draft
owner: Artur
date: 2026-08-31
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0003-reczna-weryfikacja-platnosci.md
  - chat-api/leadMail.js
  - chat-api/discounts.js
  - chat-api/server.js
  - scripts/podglad-maili.mjs
  - scripts/test-mail-klienta.mjs
  - n8n-backup/README.md
---

# ADR-0030: Tresc maili sprzed zamowienia mieszka u nas, n8n zostaje wyzwalaczem

## Kontekst

Szesc wiadomosci do klienta powstawalo w wezlach n8n, kazda z wlasnym HTML-em
wpisanym w pole "message": szacunek z kalkulatora, dwa przypomnienia do niego,
potwierdzenie formularza kontaktowego, powitanie w newsletterze i autoodpowiedz
na maila.

Rozjazd byl widoczny dla klienta w jednym tygodniu:

- **Dwie szaty graficzne.** Maile z n8n mialy ciemne tlo i niebieskie akcenty,
  maile z zamowien jasna koperta ze znakiem i zlotem. Ten sam nadawca, dwie
  firmy.
- **Znak, ktorego nie bylo widac.** Wezly wstawialy `brand-sign.webp`
  z `filter: brightness(0) invert(1)`, czyli sztuczka, ktorej klient pocztowy
  NIE wykonuje: Gmail i Outlook wycinaja filtry CSS.
- **Podpis w trzech linijkach** bez "Pozdrawiamy serdecznie", bez telefonu
  i bez pelnej nazwy, choc podpis zostal ustalony 2026-08-30 i obowiazuje
  wszystkie wiadomosci.
- **Kod rabatowy wpisany na stale** (`AEJACA5`) w mailu po siedmiu dniach. Kod
  staly jest kodem publicznym w chwili, w ktorej ktokolwiek go przeklei.
- **Zadna z tych szesciu wiadomosci nie wchodzila do podgladu ani do zadnego
  sprawdzianu.** Tekst zyl w polu formularza w cudzej aplikacji.

## Decyzja

### 1. Tresc mieszka w `chat-api/leadMail.js`, wysylka tez

n8n zostaje przy tym, co robi dobrze: webhooki, Dysk, powiadomienia dla
pracowni i odliczanie 48 godzin oraz 7 dni. Tresc i wysylke przejmuje
`chat-api`, ktory ma juz koperte, podpis, znak i polaczenie z Gmailem.

Wolanie idzie jedna trasa, `POST /api/mail/lead`, z polem `rodzaj`. Trasa jest
chroniona tokenem ADMINISTRATORA, a nie slabszym tokenem newslettera: kto ja
zawola, wysyla poczte NASZYM adresem, wiec wyciek zamienilby ja w otwarty
przekaznik spamu.

Zysk widac od pierwszego dnia: jedna zmiana podpisu poprawia wszystkie
wiadomosci naraz, a kazda z szesciu weszla do `npm run mail:podglad`
i do `scripts/test-mail-klienta.mjs`, gdzie sprawdza sie razem z pozostalymi
(podpis, koperta, znak, odnosniki, brak rodzaju meskiego, adres oddzielony od
zdania).

### 2. Szacunek z kalkulatora nazywa sie szacunkiem

Kalkulator podaje WIDELKI, a nie kwote. Nazywanie tego "wycena" zderzalo sie
z "wycena zapisana" i z "oferta", ktore sa wiazace. Mail mowi wprost: to
szacunek, cene wiazaca podajemy po obejrzeniu projektu. To ta sama poprawka co
rozdzielenie zapisanej wyceny od oferty (2026-08-30).

### 3. Kazdy kod jest jednorazowy i wystawiony na adres klienta

Wystawia go `issueSingleUseCode` w `discounts.js`, jedna droga dla powitania
w newsletterze i dla rabatu doklejonego do wyceny. Powtarzalna z zamyslu: drugie
wolanie tym samym adresem oddaje ten sam kod, inaczej wystarczyloby zapisac sie
piec razy albo poprosic o piec wycen.

### 4. Kod ma termin, a termin ma zapowiedziane przypomnienie

Decyzja wlasciciela z 2026-08-31:

- **Kod powitalny zyje 45 dni**, wczesniej 90. Kod wazny kwartal nie jest
  zacheta, tylko rzecza zapomniana, a przy kruszcu cena metalu w dniu zapisu
  i trzy miesiace pozniej to dwie rozne ceny.
- **KAZDY mail niosacy kod podaje date konca waznosci** i zapowiada
  przypomnienie. Kod bez daty jest obietnica bez terminu, a przypomnienie,
  ktorego nikt nie zapowiedzial, wyglada jak nagabywanie.
- **Piec dni przed koncem idzie JEDNO przypomnienie**, tylko o kodzie
  nietknietym. Stempel `reminded_at` stawiamy PO udanej wysylce: postawiony
  wczesniej zamknalby przypomnienie na zawsze przy pierwszej awarii poczty,
  i to po cichu.

### 5. Dwie reguly chroniace skrzynke klienta

Klient, ktory zapisze sie do newslettera i wyceni cos w kalkulatorze, moglby
dostac piec wiadomosci w tydzien. To juz nie jest opieka, tylko nagabywanie,
i konczy sie wypisaniem.

- **Jedno przypomnienie na kod**, pilnuje `reminded_at`.
- **Nigdy dwie nasze wiadomosci tego samego dnia** do tego samego adresu.
  Przypomnienie czeka do jutra, i moze czekac, bo do konca waznosci zostalo
  piec dni. Slad po wyslanych wiadomosciach trzyma `mail_log`.

Regula dotyczy WYLACZNIE tego, co moze poczekac. Potwierdzenie zamowienia, dane
do przelewu i zmiana etapu ida zawsze i natychmiast, bo klient na nie czeka.

## Alternatywy i powody odrzucenia

- **Przepisanie HTML wprost w wezlach n8n.** Najszybsze, i najgorsze potem:
  szesc kopii koperty, ktore rozjada sie z reszta przy pierwszej zmianie
  podpisu. Dokladnie to, przed czym broni sie reszta serwisu.
- **`chat-api` oddaje sama koperte, n8n wysyla dalej sam.** Mniejsza zmiana
  w n8n, ale tresc maila zostaje rozsypana po wezlach i nie wchodzi ani do
  podgladu, ani do sprawdzianow.
- **Kod staly w mailu.** Zero pracy, ale kod z maila kraży dalej: wystarczy
  jedno forum i procent dostaje kazdy, takze ci, ktorzy niczego nie wyceniali.
- **Przypomnienie o kodzie dla obu kampanii bez reguly o jednej wiadomosci
  dziennie.** Odrzucone razem z decyzja o samych przypomnieniach: bez tej
  reguly zbieg powitania, wyceny i rabatu daje trzy maile w jednej dobie.

## Konsekwencje

- **Kolejnosc wdrozenia jest wiazaca.** Przeplywy w n8n wolno przestawic
  DOPIERO wtedy, gdy `chat-api` z trasa `/api/mail/lead` stoi na produkcji.
  Railway buduje `chat-api` z galezi `main`, wiec do czasu scalenia trasy tam
  nie ma, a przestawiony wczesniej przeplyw przestalby wysylac cokolwiek.
- **n8n potrzebuje `ADMIN_API_TOKEN`**, tego samego, ktorym panel rozmawia
  z `chat-api`. Tokenu newslettera do tej trasy nie wystarczy.
- **Rabat po siedmiu dniach nie ma juz stalego kodu.** Przeplyw nie musi
  prosic o kod osobno: trasa wystawia go sama, gdy nie dostanie gotowego.
- **Kod powitalny skrocony z 90 do 45 dni** dotyczy kodow wystawionych OD tej
  zmiany. Kody juz wydane zachowuja swoj termin, bo termin byl obietnica.

## Niezmienniki i testy

- Kazda wiadomosc sprzed zamowienia niesie te sama koperte, ten sam podpis
  i ten sam znak co maile zamowieniowe. Test: `scripts/test-mail-klienta.mjs`,
  sekcje 1 i 6, po jednej asercji na jezyk i wiadomosc.
- Kazdy mail z kodem podaje date konca waznosci i zapowiada przypomnienie.
  Test: sekcja 4k.
- Zdanie z odnosnikiem konczy sie spacja, wiec adres nie skleja sie z tekstem.
  Test: sekcja 4j, wszystkie maile w trzech jezykach.
- Zadne zdanie do klienta nie zgaduje plci. Bramka:
  `scripts/check-rodzaj-meski.mjs`, w `npm run build`.

## Synchronizacja

- `n8n-backup/README.md`: opis nowego podzialu pracy miedzy n8n i `chat-api`.
- `PROJECT_RULES.md`: sekcja o kodach rabatowych.
