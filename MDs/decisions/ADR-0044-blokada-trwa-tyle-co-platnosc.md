---
status: draft
owner: Artur
date: 2026-09-06
deciders: Artur
supersedes: null
related:
  - src/pricing/businessDays.js
  - chat-api/quotes.js
  - chat-api/server.js
  - src/pages/Offer.jsx
  - scripts/test-offer-payment.mjs
---

# ADR-0044: Blokada trwa tyle, ile płatność, a nie tyle, ile decyzja

## Problem

Klient dostawał wycenę, wchodził do kasy, klikał „zapłać", trafiał do Autopay
i tam rezygnował. Od tej chwili jego własna oferta była dla niego zamknięta
przez **siedem dni**, bo tyle żyło nieopłacone zamówienie trzymające jej
pozycje. Dotyczyło to także zmiany zdania co do waluty: euro idzie u nas
przelewem, czyli osobnym zamówieniem, więc „zapłacę jednak w euro" wymagało
odczekania tygodnia albo naszej interwencji w panelu.

Cztery rzeczy w tej procedurze nie trzymały się kupy.

1. **Dwie miary tej samej niecierpliwości.** Pierścionek z półki, rzecz naprawdę
   jedyna, wracał do sprzedaży po dwudziestu minutach. Pozycja z wyceny, której
   nikt inny nie kupi, bo powstaje dla tego jednego klienta, blokowała się na
   siedem dni. Sesja bramki płatniczej żyje minuty.
2. **Blokada przeżywała to, czego pilnowała.** Ważność oferty to siedem dni od
   wyceny i biegła dalej pod blokadą. Kto porzucił kasę szóstego dnia, wracał po
   zwolnieniu pozycji do oferty już wygasłej i dostawał `410`.
3. **Strona oferty dziękowała za płatność, której nie było.** Stan „wszystko
   kupione" i stan „wszystko trzyma porzucona kasa" znaczą oba „nie zostało nic
   do wzięcia", więc oba pokazywały zielone „Oferta opłacona i zlecona".
4. **Liczba blokady stała w dwóch plikach.** `INSTANT_HOLD_MINUTES = 20` było
   zapisane osobno w `products.js` i w `discounts.js`.

## Decyzja

Decyzja właściciela z 2026-09-06, po przejrzeniu procedury.

### Kwadrans przy bramce, trzy dni robocze przy przelewie

Blokada ma odpowiadać temu, ile trwa PŁATNOŚĆ, a nie temu, ile trwa decyzja.
Właściciel opisał to obrazem stacji paliw: po przekierowaniu do Autopay klient,
który rezygnuje, odchodzi od dystrybutora i nikt nie wraca odwiesić pistoletu.

Przy przelewie zostaje bez zmian, bo tam czekamy na bank, a nie na klienta, i ten
sam termin niesie ważność kwoty w euro oraz rezerwację towaru.

Liczbę trzyma jedno miejsce, `src/pricing/businessDays.js`, i jedna funkcja
`holdUntil(metoda)`, wspólna dla ważności zamówienia, rezerwacji towaru
i rezerwacji kodu rabatowego. Trzy terminy tej samej obietnicy mają kończyć się
w tej samej chwili.

### Zegar liczy się od ostatniej próby zapłaty

Kwadrans liczony od złożenia zamówienia dawałby zero minut komuś, kto wraca do
płatności po godzinie. Każde naciśnięcie „zapłać" odsuwa termin o pełny kwadrans,
i zapisuje się tym samym warunkiem, który otwiera płatność.

### Pozycja zwalnia się z upływem terminu, nie z przebiegiem zamiatarki

Stan `expired` wpisuje do bazy zadanie cykliczne. Przy tygodniowej blokadzie
opóźnienie było niewidoczne, przy kwadransie podwajałoby czas oczekiwania. Stan
pozycji liczy się więc z terminu i zapłaty, a nie z kolumny `status`. Zamiatarka
chodzi co kwadrans, bo od niej zależą maile, rezerwacje towaru i kody.

### Oferta nie starzeje się pod własną blokadą

Zwolnienie pozycji, przez upływ terminu albo przez rezygnację, przesuwa
`valid_until` oferty na co najmniej trzy dni do przodu. Termin tylko wydłużamy,
a oferty bez terminu nie dotykamy.

### Strona oferty mówi wprost, co ją blokuje

Osobna ramka: numer nieopłaconego zamówienia i dwa wyjścia obok siebie,
dokończ płatność albo zwolnij pozycje. Żadne z tych dwóch nie jest błędem.

### Przypomnienie tylko przy przelewie

Przy kwadransie mail dotarłby po zwolnieniu pozycji. Przy przelewie termin to
trzy dni robocze i doba przed końcem przypomnienie ma sens.

## Czego pilnujemy

- `scripts/test-offer-payment.mjs`, sekcje 12 i 13: długość blokady przy obu
  metodach oraz to, że pozycja zwalnia się zegarem, a płatność w przeglądzie
  i zapłacona pozycja nie.

## Koszt, nazwany wprost

Klient, który przy bramce zmarudzi ponad kwadrans, zapłaci za zamówienie już
wygasłe. Pieniądze nie giną: potwierdzenie z Autopay dla zamówienia poza stanem
„czeka na płatność" idzie do przeglądu (`itnAction`), czyli na biurko człowieka.
Kosztem jest więc nasza ręczna robota przy wolnym płatniku, a nie strata wpłaty.
Odsuwanie terminu przy każdej próbie zapłaty zawęża to do przypadku, w którym
ktoś siedzi w bramce dłużej niż kwadrans od ostatniego kliknięcia.
