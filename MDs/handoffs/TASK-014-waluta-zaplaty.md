# Handoff zadania

```yaml
task_id: TASK-014
status: review
author: Claude Code
branch: claude/fix-api-error-oge1r
base_commit: 6da6426
last_commit: (uzupelnic po commicie)
updated: 2026-08-26
```

## Cel

Oferte da sie wystawic w euro, a klient wybiera walute zaplaty niezaleznie od
jezyka, w ofercie i w calym sklepie. Waluta zmienia droge zaplaty, wiec strona
pokazuje, co i kiedy sie stanie.

## Stan przed zmiana

- **Waluta wynikala z jezyka strony** (`showEur = lang === "en" || "de"`),
  a backend odmawial przelewu kazdemu, kto czytal po polsku.
- **Oferty nie dalo sie oplacic w euro**: trasa `/api/quotes/:ref/checkout`
  miala `paymentMethod: "autopay"` wpisane na sztywno.
- **Procedura przelewu byla opisana proza**, w jednym miejscu, bez osi czasu.

## Zalozenia i decyzje

Wszystkie w ADR-0018. Skrot: jezyk podpowiada walute, waluta wybiera droge
zaplaty, waluta dotyczy calej oferty, zrodlem ceny zostaja grosze PLN, kwota
w euro zamraza sie przy zamowieniu.

## Zakres

### Zmienione pliki

- `src/pricing/currency.js` i mirror: `CURRENCY_BY_LANG`, `defaultCurrency`,
  `normalizeCurrency`, `paymentMethodForCurrency`.
- `src/shop/CurrencyContext.jsx`: wybor waluty, pamiec przegladarki, domysl
  z jezyka; `src/shop/money.js` czyta wybor zamiast jezyka.
- `src/main.jsx`, `src/entry-server.jsx`: dostawca waluty w obu wejsciach.
- `src/components/Navbar.jsx`: przelacznik waluty w menu jezyka.
- `src/pages/Checkout.jsx`: sposob zaplaty wynika z waluty, kasa wysyla walute.
- `src/pages/Offer.jsx`: waluta oferty, przelacznik, kroki procedury, zaplata
  w euro prowadzi na strone zamowienia zamiast do bramki.
- `src/pages/Payments.jsx`: diagram dwoch drog, teksty przestaly wiazac walute
  z jezykiem.
- `chat-api/quotes.js`: `currency` przy zakladaniu i edycji, zamrozenie kwoty
  w euro i kursu w zamowieniu z oferty, rabat schodzi z obu kwot.
- `chat-api/server.js`: migracja kolumny, waluta w obu payloadach oferty,
  trasa `POST /api/quotes/:ref/currency`, droga zaplaty z waluty, kasa sklepu
  bez reguly jezykowej.
- `admin/server.js`, `admin/views/quotes.ejs`, `admin/views/quote-edit.ejs`:
  waluta przy zakladaniu i w edytorze; pole "Wazna przez, dni" pokazuje liczbe
  dni, ktora obowiazuje.
- `scripts/quotes-schema.sql`, `scripts/test-offer-currency.mjs` (nowy, w buildzie),
  `scripts/test-offer-payment.mjs` (odporny na kolejnosc kolumn),
  `scripts/it-offer-groups.mjs` (waluta i termin na prawdziwej bazie),
  `scripts/check-browser-storage.mjs`, `package.json`.

### Swiadomie poza zakresem

- **Euro w bramce platniczej.** Umowa go nie obejmuje, wiec `Currency = "PLN"`
  w `autopay.js` zostaje na sztywno.
- **Zamrozenie kursu na caly okres waznosci oferty.** Byloby to wziecie pozycji
  walutowej na dwa tygodnie bez zaplaty za nie. ADR-0018, punkt 4.
- **Trzecia waluta.**

## Testy i dowody

| Kontrola | Polecenie | Wynik |
|---|---|---|
| Jezyk podpowiada, nie narzuca; nieznana waluta spada na domysl | `node scripts/test-offer-currency.mjs` | pass |
| Bramka dalej dostaje wylacznie PLN | ten sam test | pass |
| Euro bez rachunku walutowego i bez kursu jest odrzucane | ten sam test | pass |
| Rabat schodzi takze z kwoty w euro | ten sam test | pass |
| Kasa sklepu nie wiaze przelewu z jezykiem | ten sam test | pass |
| Niemiecka wycena zaczyna od euro, polska od zlotowek | `node scripts/it-offer-groups.mjs` (baza) | pass |
| Zapis pokazanej liczby dni nie przesuwa terminu | ten sam test | pass |
| Waluta spoza listy odrzucana przez baze i kod | ten sam test | pass |
| Zgody zamowienia zapisuja sie mimo nowych kolumn | `node scripts/test-offer-payment.mjs` | pass |
| Klucz waluty zgloszony w kontroli pamieci przegladarki | `node scripts/check-browser-storage.mjs` | pass |
| Build | `npm run build` | pass, kod wyjscia 0 |

## Ryzyka i otwarte pytania

- **Kurs zamraza sie przy zamowieniu, nie przy wystawieniu oferty.** Klient
  widzi kwote w euro policzona z kursu dnia; jesli zaplaci tydzien pozniej,
  kwota moze byc inna. To jest swiadome, ale warto to wiedziec przy rozmowie
  z klientem.
- **Reczne ksiegowanie euro zostaje reczne.** Kazda oferta w euro doklada
  pozycje do potwierdzania wplat.
- **Wybor waluty zapisuje sie w przegladarce.** Klient, ktory raz wybral euro,
  zobaczy euro takze przy nastepnej wizycie, takze na polskiej wersji. Tak ma
  byc, ale wyglada to nietypowo przy pierwszym zetknieciu.
- **Kod rabatowy pada po zmianie waluty**, bo byl policzony w innej walucie
  i innej drodze zaplaty.

## Instrukcja dla recenzenta

1. **Najwazniejsza hipoteza do podwazenia:** czy kwota, ktora klient widzi
   w euro, jest dokladnie ta, ktora zamrazamy w `amount_eur_cents`. Sprawdz
   `GET /api/quotes/:ref`, trase `/currency` i `convertQuoteToOrder`: wszystkie
   trzy licza z `eurCentsFromGrosze`.
2. **Granica systemu:** `POST /api/quotes/:ref/currency`. Klient moze podac
   dowolna walute; sprawdz odmowe dla waluty spoza listy, dla oferty juz
   przekutej w zamowienie i dla euro bez skonfigurowanego rachunku.
3. **Zgodnosc wstecz:** starsza strona nie wysyla pola `currency` w kasie.
   Sprawdz, ze wtedy dziala stara regula i zamowienie nie jest odrzucane.
4. **Dokumenty:** ADR-0018, `Brand_Reference`, `chat-api/context.js`.

## Warunek uznania zadania za gotowe

1. Oferte da sie wystawic w euro z panelu, a klient moze walute zmienic.
2. Zaplata w euro prowadzi na strone zamowienia z rachunkiem, nie do bramki.
3. Zaplata w zlotowkach dalej idzie bramka, bez zmian.
4. Waluta dotyczy calej oferty, nie pojedynczych pozycji.
5. Waluta domyslna wynika z jezyka: pl to PLN, en i de to EUR.
6. Klient zmienia walute takze w sklepie i wybor pamieta sie miedzy stronami.
7. `/payments/` pokazuje obie drogi na osi czasu, z terminami z kodu.
8. Kwota w euro i kurs zamrazaja sie przy skladaniu zamowienia i schodza
   razem z rabatem.
