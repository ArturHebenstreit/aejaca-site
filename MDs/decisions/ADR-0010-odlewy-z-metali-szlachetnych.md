# ADR-0010: odlewy z metali szlachetnych jako trzy ścieżki zamówienia

- Status: draft
- Data: 2026-08-24
- Właściciel decyzji: Artur
- Implementacja: TASK-007

## Kontekst

AEJaCA sTuDiO przyjmuje zlecenia odlewu ze wzorca fizycznego, z gotowego modelu 3D albo od pomysłu klienta. Cena kruszcu zależy od masy, a ta jest wiarygodnie znana automatycznie tylko wtedy, gdy serwer zmierzył zamknięty model 3D. Materiał powierzony wymaga identyfikacji stopu i oceny czystości. Wzorzec fizyczny wymaga oględzin, a projekt od pomysłu dopiero ustala geometrię.

## Decyzja

1. Produkt ma trzy warianty: gotowy wzorzec z wosku lub żywicy odlewniczej, przesłany model 3D oraz realizację od pomysłu klienta.
2. Wiążąca automatyczna cena jest dostępna wyłącznie dla przesłanego, poprawnie odczytanego modelu 3D, naszego kruszcu i bryły mieszczącej się w ograniczeniach odlewni.
3. Wzorzec fizyczny, realizacja od pomysłu i każdy przypadek materiału powierzonego przechodzą do indywidualnej wyceny.
4. Dla materiału powierzonego komunikujemy wymagany zapas technologiczny. Czysty, jednorodny stop zwykle wymaga 5 do 8 procent rezerwy na ubytek; stop mieszany lub nieznany 10 do 15 procent. Materiał platerowany lub wypełniany może zostać odrzucony.
5. Masa modelu 3D jest liczona z objętości i gęstości wybranego stopu. Do kalkulacji zapotrzebowania przyjmujemy 12 procent rezerwy procesowej. Nadmiar układu wlewowego nie jest przedstawiany jako ubytek, ponieważ po oddzieleniu pozostaje złomem technologicznym.
6. Automatyczna ścieżka przyjmuje modele mieszczące się po orientacji w obszarze 24 x 24 x 35 mm. Większe modele wymagają oceny ręcznej i innego przygotowania procesu.
7. Automatyczna kontrola siatki i wymiarów nie zastępuje próby wydruku w żywicy odlewniczej oraz kontroli warsztatowej przed zalaniem metalem.

## Konsekwencje

- Sklep nie obiecuje ceny na podstawie deklarowanej masy albo niezweryfikowanego materiału.
- Klient od razu widzi, dlaczego część konfiguracji wymaga kontaktu.
- Cena wariantu z modelem 3D pozostaje spójna z kalkulatorem biżuterii bez kamieni i bieżącym kursem kruszcu.
- Zmiana limitów kolby, procesu albo urządzeń wymaga aktualizacji testów, opisu produktu i niniejszej decyzji.

