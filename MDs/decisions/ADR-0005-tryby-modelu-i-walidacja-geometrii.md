---
status: accepted
owner: Artur
date: 2026-08-24
deciders: Artur
supersedes: null
related:
  - MDs/AEJaCA_Geometria_Kreatora_Zasady.md
  - src/geometry/ring/
  - scripts/test-ring-generator.mjs
---

# ADR-0005: Tryby modelu i lokalna walidacja geometrii pierscionka

## Kontekst

Kreator uzywal pola `casting.stones` jednoczesnie do sterowania widocznoscia
kamieni, stanem lapek oraz zawartoscia eksportu. Domyslny eksport mogl przez to
zawierac kamienie polaczone booleanem z metalem i zamkniete lapki, mimo ze plik
byl opisywany jako gotowy do samodzielnego odlewania.

Walidacja kamieni wpuszczanych liczyla dostepny metal z nominalnej szerokosci
szyny. Przy sylwetce zwezanej rzeczywista szerokosc w miejscu kamienia jest
mniejsza. Konfiguracja szyny 3,2 mm z kamieniem kanalowym 2,3 mm zostawiala dwa
fragmenty po okolo 0,046 mm3. Ten przypadek byl znany, ale celowo pominiety w
macierzy testowej.

Walidator przycinal niewykonalne wymiary po cichu. Interfejs ignorowal
znormalizowane parametry zwracane przez generator, dlatego mogl pokazywac inny
wymiar niz uzyty w modelu i wycenie.

## Decyzja

1. Rozdzielamy trzy tryby budowy:
   - `casting`: metal produkcyjny, otwarte lapki, bez bryl kamieni;
   - `finishedPreview`: podglad gotowego wyrobu z kamieniami i zamknietymi
     lapkami;
   - `referenceAssembly`: zestaw referencyjny z oddzielnymi brylami metalu i
     kamieni, bez laczenia kamieni z metalem.
2. Wybor produktu i eksport jawnie wskazuja tryb. Widocznosc podgladu nie moze
   zmieniac produkcyjnej bryly ani masy metalu.
3. Dopuszczalny rozmiar kamienia wpuszczanego wynika z lokalnej szerokosci
   szyny w kazdej pozycji kamienia, po zastosowaniu sylwetki `taper`.
4. Konfiguracje niewykonalne sa odrzucane czytelnym bledem. Nie zmieniamy po
   cichu rozmiaru kamienia, jezeli zmienia to projekt klienta.
5. Interfejs korzysta z tego samego raportu ograniczen co generator i serwer.
6. Oprawa kanalowa wraca do macierzy testow ciaglosci szyny.
7. Wylaczenie kamieni w podgladzie pokazuje bezposrednio metal z trybu
   `casting`. Nie budujemy drugiej, podobnej bryly tylko na potrzeby ekranu.
8. Kamien centralny i kamienie boczne maja osobne, dyskretne obroty w
   plaszczyznie: 0, 90, 180 i 270 stopni. Kamien, gniazdo, kosz i zakucia
   obracaja sie jako jeden uklad.
9. Kamienie boczne sa lustrzane na obu ramionach. Ustawienie 90 stopni
   kieruje szpic do korony po obu stronach, a 270 stopni od korony.
10. Walidacja rozmiaru i odsuniecia korzysta z obrysu po obrocie. Owal
    ustawiony wzdluz i w poprzek szyny nie moze zajmowac tej samej umownej
    szerokosci.

## Odrzucone alternatywy

- Pozostawienie jednego przelacznika `casting.stones`. Odrzucone, bo miesza
  stan prezentacji z geometria produkcyjna.
- Globalne poszerzenie szyny zwezanej. Odrzucone, bo zmienia sylwetke wszystkich
  wzorow, takze tych bez kamieni bocznych.
- Dalsze ciche przycinanie wymiarow. Odrzucone, bo formularz, model i wycena
  moga wtedy opisywac trzy rozne wyroby.
- Pozostawienie channel poza testem. Odrzucone, bo znana wada nie moze byc
  uznana za poprawny zakres produktu.

## Konsekwencje

- Czesc kombinacji suwakow zostanie zablokowana jako niewykonalna.
- Presety musza przejsc ponowna kontrole bez cichej zmiany parametrow.
- Plik produkcyjny nie bedzie wizualizacja gotowego wyrobu. Podglad gotowego
  wyrobu pozostaje dostepny osobno.
- Model nominalny pozostaje bez automatycznego skurczu. Profil procesu i
  kompensacja skurczu beda osobnym kolejnym etapem, aby nie zmieniac wymiaru
  pliku do przymiarki.

## Wymagane kontrole

- kontrola negatywna channel 3,2 mm / 2,3 mm / tapered;
- kontrola negatywna niewykonalnych wymiarow side i band;
- porownanie metalu `casting` przy wlaczonej i wylaczonej widocznosci kamieni;
- sprawdzenie, ze eksport casting nie zawiera kamieni i ma otwarte lapki;
- sprawdzenie, ze zestaw referencyjny zachowuje osobne obiekty;
- `node scripts/test-ring-generator.mjs`;
- `node scripts/test-ring-pricing.mjs`;
- `npm run sync:pricing` i kontrola dryfu;
- podbicie `WORKER_VERSION`;
- sprawdzenie obrotu gruszki centralnej i bocznej z 0 na 90 stopni;
- porownanie `finishedPreview` bez kamieni z metalem `casting`;
- pelny `npm run build`.

## Synchronizacja

Zmiany `src/geometry/ring/` wymagaja wygenerowania `chat-api/geometry/`, wpisu
w dzienniku `MDs/AEJaCA_Geometria_Kreatora_Zasady.md` oraz aktualizacji handoffu
TASK-003.
