---
status: draft
owner: Artur
date: 2026-09-06
deciders: Artur
supersedes: null
related:
  - src/shop/paczkaModeli.js
  - src/components/calculators/CalcToCart.jsx
  - src/components/shop/ServiceConfigurator.jsx
  - scripts/test-paczka-modeli.mjs
---

# ADR-0042: Paczka modeli to osobne pozycje, nie jedna pozycja z plikami

## Problem

Jedno wgranie znaczyło jeden model i jedną pozycję w koszyku. Klient
z dziesięcioma częściami do wydrukowania musiał przejść kalkulator dziesięć
razy, ustawiając za każdym razem ten sam materiał, to samo wypełnienie i to samo
wykończenie. Takie zlecenia kończyły się mailem „czy mogę przesłać paczkę
plików", czyli poza sklepem, bez ceny i bez koszyka.

## Decyzja

Trzy rozstrzygnięcia właściciela z 2026-09-06.

### Każdy model to osobna pozycja

Nie jedna pozycja z dziesięcioma plikami. To nie jest wybór estetyczny, tylko
warunek tego, żeby reszta serwisu nie musiała się zmienić: **kwota wiążąca
powstaje ze zmierzonej bryły, a bryła należy do pliku** (`bindingBasis`).
Pozycja z dziesięcioma geometriami i jedną ceną musiałaby zmienić model danych
w kasie, w panelu, w kolejce produkcji i w mailach.

Cena tej decyzji: dłuższy koszyk. Zysk: każda pozycja ma własną liczbę sztuk,
własny próg nakładu, własny termin i własną cenę wiążącą, więc klient może
zamówić trzy sztuki jednego modelu i jedną drugiego.

### Ustawienia są wspólne dla paczki

Materiał, kolor, wypełnienie i wykończenie ustawia się raz, bo taka jest typowa
paczka: te same części tego samego wyrobu, z tego samego materiału. Pojedynczy
model da się zmienić później, na jego pozycji w koszyku.

Odrzucone: konfigurowanie każdego modelu od zera. Przy dziesięciu modelach to
dziesięć pełnych formularzy i realne ryzyko porzucenia koszyka w połowie.

### Limit dziesięciu dotyczy jednego wgrania, nie zamówienia

Powyżej mówimy „dziesięć na raz, resztę wgraj drugą paczką **do tego samego
koszyka**". Dwa powody. Przeglądarka liczy geometrię każdej bryły u siebie
i przy dwudziestu plikach naraz karta przestaje odpowiadać. A klient
z dwudziestoma modelami nie ma płacić dwóch wysyłek ani składać dwóch zamówień
za coś, co jest jedną sprawą.

Odrzucone lecą z powrotem **z nazwami plików**, a nie jako sama liczba: klient
wybrał dwanaście plików z katalogu i po dwóch minutach nie pamięta, które to
były.

## Konsekwencje

Warstwa wspólna stoi w `src/shop/paczkaModeli.js` i obsługuje oba miejsca:
kalkulator (`CalcToCart`) i kartę usługi w sklepie (`ServiceConfigurator`).
Wysyłka i wycena każdego modelu idą przez `/api/uploads` i `/api/price`, czyli
przez ten sam kod, który wycenia model główny i wystawia kwotę w koszyku.
Osobnej formuły dla modeli dodatkowych nie ma i mieć nie może: rozjechałaby się
z rdzeniem przy pierwszej zmianie stawki.

Do koszyka wchodzi wyłącznie model, który ma token, ma cenę i ma `binding`.
Model bez zmierzonej bryły odrzuciłaby i tak kasa, więc włożenie go kończyłoby
się odmową dopiero przy płatności, czyli w najgorszym możliwym miejscu.

Przy okazji: lista formatów modelu (`FORMATY_MODELU`) stała w dwóch kopiach,
a wraz z paczką byłaby w trzech. Kopia rozjeżdża się przy dołożeniu formatu,
a objawem jest pole wyboru pliku, które nie widzi tego, co serwer przyjmuje.
Teraz stoi raz.

Pilnuje tego `scripts/test-paczka-modeli.mjs` w `npm run build`.

## Czego ta decyzja NIE rozstrzyga

Paczka pokazuje się tylko tam, gdzie cena bierze się z pliku: druk FDM, druk
żywiczny i odlew z metalu. Przy usługach liczonych z parametrów drugi plik
niczego nie zmienia.

Zmiana ustawień pojedynczego modelu odbywa się na jego pozycji w koszyku, czyli
tam, gdzie odbywała się dotąd. Osobny ekran „popraw ten jeden model w paczce"
to inna robota i inna decyzja.
