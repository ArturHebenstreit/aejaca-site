# Karta podarunkowa: praca odłożona

**Stan: zbudowana, przetestowana, wycofana z kodu 2026-08-05. Nigdy nie była na produkcji.**

Powód odłożenia: temat okazał się grząski (bon VAT, klauzule abuzywne, zobowiązanie w księgach)
i przy braku sygnału o popycie nie był wart zaangażowania. Nic nie zostało skasowane.

Wznowienie to godzina pracy, bo mechanika jest gotowa i przetestowana, a nie szkic.

---

## Co tu leży

| Plik | Wraca do | Uwagi |
|---|---|---|
| `GiftCard.jsx` | `src/pages/` | strona `/gift-card/`: sprzedaż, sprawdzenie salda, FAQ, schematy |
| `giftcards.js` | `chat-api/` | saldo, rezerwacja, obciążenie, wydanie karty |
| `giftcards-schema.sql` | `scripts/` | tabele; migracja i tak wykonuje się sama przy starcie API |
| `test-giftcards.mjs` | `scripts/` | arytmetyka i kolejność naliczania, wpiąć w `build` |
| `terms-section-7a.js` | `src/data/termsContent.js` | regulamin, trzy języki, wklejać przed sekcją 8 |
| `chat-api-context.md` | `chat-api/context.js` | wiedza asystenta, cztery fragmenty |
| `llms-txt.md` | `public/llms.txt` | trzy wpisy |
| `BRAND_REFERENCE_karta.md` | `MDs/AEJaCA_Brand_Reference.md` | pełny opis konstrukcji i przegląd rynku |

---

## Lista kroków do wznowienia

1. Przenieść cztery pliki kodu do docelowych katalogów.
2. Trasa `/gift-card/` w **trzech** miejscach: `src/main.jsx` (lazy), `src/entry-server.jsx`
   (import statyczny), `STATIC_ROUTES` w `scripts/prerender.mjs` (bez ukośnika na końcu).
3. `chat-api/server.js`: import z `./giftcards.js`, migracja tabel, dwa crony zwalniające
   rezerwacje, obsługa w `POST /api/orders`, `consumeGiftCard` w obu miejscach potwierdzenia
   płatności, endpointy `/api/giftcards/check` i `/api/admin/giftcards`, wpis `giftcard`
   w `SUBJECT_MAP`. **Szczegóły w historii gita: commity `92af348`, `e7859b6`, `bb35270`.**
4. `src/pages/Checkout.jsx`: pole karty pod polem kodu rabatowego, wiersz w podsumowaniu,
   ścieżka `fullyCovered`.
5. Regulamin: wkleić trzy bloki z `terms-section-7a.js`, dopisać dwie definicje w sekcji 2,
   podnieść `TERMS_EFFECTIVE_DATE`, uruchomić `node scripts/check-terms-parity.mjs`.
6. Odnośnik w stopce + klucz `footer.giftCard` w `src/i18n/{pl,en,de}.js`.
7. Wpiąć `test-giftcards.mjs` w `build` w `package.json`.
8. Synchronizacja: `sitemap.xml` (nowy URL + `lastmod` regulaminu), `llms.txt`, `context.js`,
   Brand Reference.

---

## Czego NIE zmieniać bez powodu

**Kolejność naliczania: rabat od pozycji, plus wysyłka, karta na końcu od kwoty do zapłaty.**
Odwrotna kolejność każe karcie dopłacać rabat, którego nikt nie kupił. Pilnuje tego test.

**Karta pokrywa wysyłkę, rabat nigdy.** Karta jest przedpłatą, klient już za tę wysyłkę zapłacił.

**Saldo schodzi dopiero przy potwierdzonej zapłacie**, tak samo jak towar i kod rabatowy.
Porzucony koszyk nie ma prawa zjeść karty.

**Zamówienie pokryte w całości omija bramkę.** Autopay z kwotą zero kończy się błędem, a klient
zostaje z zamówieniem, którego nie da się opłacić, mimo że już za nie zapłacił, kupując kartę.

**Brak klauzuli o przepadku środków po terminie ważności.** To nie jest przeoczenie, tylko
świadoma decyzja po przeglądzie orzecznictwa. Szczegóły niżej.

---

## Ustalenia prawne z przeglądu rynku (2026-08-05)

### Zgodne ze standardem rynkowym

12 miesięcy ważności (tyle mają Martes Sport, sklepzrowerami.pl, Gatta, DUKA), karta na okaziciela,
brak wymiany na gotówkę, częściowe wykorzystanie z resztą na karcie. To nie był eksperyment.

### Pułapka, w którą wpadliśmy i z której wyszliśmy

Pierwsza wersja regulaminu mówiła, że po terminie ważności niewykorzystane środki
„nie podlegają zwrotowi ani wypłacie". **To jest klauzula niedozwolona.**

- Sąd Rejonowy w Słupsku, 6 marca 2020, przeciwko Empik
- Sąd Rejonowy dla Warszawy-Mokotowa, 2022, przeciwko innej dużej sieci

Podstawa: art. 385(1) k.c. (klauzula abuzywna) oraz art. 405 k.c. (bezpodstawne wzbogacenie).
Zatrzymanie pieniędzy klienta bez świadczenia wzajemnego rażąco narusza dobre obyczaje.
Stosowanie takiej klauzuli to również ryzyko postępowania UOKiK, z karą do 10% obrotu.

Wersja, która leży w `terms-section-7a.js`, jest już poprawiona: upływ ważności odbiera możliwość
zapłaty kartą bezpośrednio w kasie, ale **nie powoduje przepadku**. Na wniosek przedłużamy ważność,
wydajemy nową kartę na pozostałą kwotę albo zwracamy środki.

To wyszło na korzyść marketingowo: większość sieciówek te pieniądze zabiera, więc możemy napisać
wprost, że tego nie robimy.

### Do rozstrzygnięcia przed pierwszą sprzedażą

**Kwalifikacja VAT.** Przyjęliśmy, że to bon różnego przeznaczenia w rozumieniu art. 2 pkt 44
ustawy o VAT, bo sprzedajemy towary i usługi o różnych stawkach, więc podatek rozlicza się przy
realizacji bonu, a nie przy jego sprzedaży. **To nie jest opinia księgowa.** Potwierdzić.

**Poza UE.** Shopify domyślnie ustawia karty jako bezterminowe, bo w części jurysdykcji termin
ważności jest wprost nielegalny (w USA minimum ustawowe to 5 lat). Sprzedajemy dziś do UE, ale
gdyby to się zmieniło, warunek trzeba sprawdzić osobno.

---

## Co zostało w kodzie na stałe

`scripts/check-terms-parity.mjs` powstał przy tej pracy i **nie został wycofany**. Pilnuje, żeby
regulamin miał te same sekcje, ustępy i punkty list w pl, en i de. Dotyczy całego dokumentu,
a nie samej karty, więc przydaje się niezależnie od tego, czy karta kiedykolwiek wróci.
