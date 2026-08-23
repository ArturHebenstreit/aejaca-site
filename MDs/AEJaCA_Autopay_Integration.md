# AEJaCA, integracja Autopay (notatka wdrożeniowa)

Wygenerowano: 2026-07-30
Źródło: "Dokumentacja bramki płatniczej" Autopay, wersja z 2026-07-29, 259 stron.

Notatka zastępuje w repozytorium sam PDF, którego tu nie trzymamy (cudza dokumentacja
techniczna, 2,4 MB). Zawiera wyłącznie to, co potrzebne do wdrożenia i utrzymania.

---

## 1. Dane serwisu

| Pozycja | Wartość |
|---|---|
| ServiceID | 218869 |
| Forma działalności | działalność nierejestrowana |
| Waluta | PLN (jeden ServiceID obsługuje jedną walutę) |
| Kanały | BLIK, szybki przelew online (PBL), przelew tradycyjny |
| Karty, Google Pay, Apple Pay | niedostępne dla tej formy działalności |
| Limit obrotu | 10 813,50 PLN kwartalnie, pilnowany też po naszej stronie |

Klucz współdzielony żyje wyłącznie w zmiennej `AUTOPAY_HASH_KEY` na Railway.
Nigdy w repozytorium, nigdy we frontendzie, nigdy w logach.

## 2. Adresy środowisk (str. 14)

| Środowisko | host_bramki |
|---|---|
| Produkcja | `https://pay.autopay.eu` |
| Testy | `https://testpay.autopay.eu` |

Ścieżka startu transakcji jest nadawana indywidualnie przy rejestracji serwisu,
w dokumentacji występuje jako `{host_bramki}/sciezka`. Trzymamy ją w
`AUTOPAY_START_PATH`, żeby nie zaszywać jej w kodzie.

## 3. Suma kontrolna (str. 28)

Algorytm domyślny: **SHA256**. Reguła:

```
Hash = SHA256( wartosc_1 + "|" + wartosc_2 + ... + "|" + klucz_wspoldzielony )
```

Trzy zasady, których złamanie daje odrzucenie każdej transakcji bez czytelnego błędu:

1. Sklejamy **wartości**, nigdy nazw parametrów.
2. Kolejność wynika z numeracji pól w dokumentacji, nie z kolejności w formularzu.
3. **Pole puste lub nieobecne wypada razem ze swoim separatorem.** Nie zostawiamy
   pustego miejsca między pionowymi kreskami.

Przykład z dokumentacji: `SHA256("2|100|1.50|2test2")`.

## 4. Start transakcji (str. 17 do 20)

POST, `Content-Type: application/x-www-form-urlencoded`, UTF-8, wielkość liter ma znaczenie.

| Nr do hasha | Pole | Wymagane | Uwagi |
|---|---|---|---|
| 1 | ServiceID | tak | |
| 2 | OrderID | tak | do 32 znaków, `A-Za-z0-9-_`, **nigdy się nie powtarza** przez cały okres usługi |
| 3 | Amount | tak | format `0.00`, kropka dziesiętna |
| 4 | Description | nie | do 79 znaków, dozwolone `. : - ,` i spacja |
| 5 | GatewayID | nie | `0` to wybór kanału po stronie Autopay |
| 6 | Currency | nie | domyślnie PLN |
| 7 | CustomerEmail | tak | |
| 19 | ValidityTime | nie | domyślnie 6 dni, maks. 31 dni |
| 34 | LinkValidityTime | nie | ważność samego linku |
| nd. | Hash | tak | |

Limity kwotowe: BLIK do 50 000 PLN, PBL i szybkie przelewy do 100 000 PLN.
Przy naszym limicie kwartalnym bez znaczenia.

Limit techniczny: maksymalnie 100 transakcji na minutę.

## 5. Powrót klienta (str. 21)

GET na ustalony adres powrotu, z `ServiceID`, `OrderID` i `Hash`, gdzie
`Hash = SHA256("ServiceID|OrderID|klucz")`.

**Weryfikacja hasha jest obowiązkowa.** Bez niej ktokolwiek może wejść na adres
powrotu z dowolnym OrderID i zobaczyć potwierdzenie zamówienia, którego nie opłacił.
Strona powrotu nigdy nie zmienia statusu zamówienia, robi to wyłącznie ITN.

## 6. ITN, powiadomienie o statusie (str. 22 do 31)

Autopay wysyła POST na nasz adres, parametr `transactions`, XML zakodowany base64.
Wymagania po naszej stronie: publiczna domena, ważny certyfikat z publicznego CA,
pełny łańcuch certyfikatów, TLS 1.2 lub 1.3.

Hash liczony z dziewięciu pól w kolejności:

```
SHA256("serviceID|orderID|remoteID|amount|currency|gatewayID|paymentDate|paymentStatus|paymentStatusDetails|klucz")
```

Odpowiadamy XML-em:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<confirmationList>
  <serviceID>218869</serviceID>
  <transactionsConfirmations>
    <transactionConfirmed>
      <orderID>...</orderID>
      <confirmation>CONFIRMED</confirmation>
    </transactionConfirmed>
  </transactionsConfirmations>
  <hash>...</hash>
</confirmationList>
```

gdzie `hash = SHA256("serviceID|orderID|CONFIRMED|klucz")`.

Brak poprawnej odpowiedzi powoduje ponawianie powiadomienia.

### Reguła, która decyduje o poprawności wdrożenia (str. 26 do 27)

Statusy: `PENDING`, `SUCCESS`, `FAILURE`.

- Każdy ITN potwierdzamy strukturą `CONFIRMED` z poprawnym hashem, zawsze.
- Logikę biznesową (mail do klienta, wydanie pliku cyfrowego, zlecenie produkcji)
  wykonujemy **wyłącznie przy pierwszym** `SUCCESS` z poprawna kwota, gdy
  zamowienie nadal ma stan `awaiting_payment`.
- Kolejny `SUCCESS` potwierdzamy, ale nie robimy nic więcej. Inaczej klient dostaje
  trzy maile i trzy linki do pobrania.
- `FAILURE` po `SUCCESS` (inne `remoteID`, klient zmienił kanał płatności)
  potwierdzamy, ale **nie** cofamy statusu zamówienia.
- `SUCCESS` po anulowaniu, wygasnieciu, w innym nieoczekiwanym stanie albo z
  inna kwota ustawia `payment_review`. Zapisujemy otrzymanie pieniedzy i
  wysylamy pilny alert, ale nie uruchamiamy realizacji ani nie zuzywamy rezerwacji.
- Transakcje z tym samym `OrderID` rozróżniamy po `remoteID`, który zapisujemy przy zamówieniu.

### Ponowienie nieudanej płatności

- `FAILURE` nie tworzy nowego zamówienia i nie zwalnia jego rezerwacji przed terminem ważności.
- Klient może rozpocząć kolejną transakcję z tym samym `OrderID`; Autopay rozróżnia próby przez `remoteID`.
- Ponowienie wymaga tokenu dostępu do zamówienia. Sam publiczny numer `OrderID` nie wystarcza.
- Ponowienie jest dozwolone tylko dla ważnego, nieopłaconego zamówienia w stanie `awaiting_payment`, którego metodą jest Autopay.
- Ten sam przycisk pozwala rozpocząć płatność, gdy status próby jest pusty albo `PENDING`, na przykład po zamknięciu bramki bez zapłaty. Czerwony komunikat błędu pozostaje zarezerwowany dla `FAILURE`.
- Start kolejnej próby ustawia widoczny status `PENDING`, żeby poprzedni `FAILURE` nie był pokazywany jako stan nowej transakcji.
- Po podpisanym powrocie token jest zapisywany pod kluczem zamowienia w
  `sessionStorage`, a potem natychmiast usuwany z paska adresu. F5 w tej samej
  sesji karty odzyskuje token; niezaleznie otwarty oczyszczony adres go nie ma.
- Podpisany powrot przekazuje token rowniez wtedy, gdy wczesniejszy ITN zdazyl
  ustawic `paid` albo `payment_review`, zeby klient zobaczyl wlasciwy komunikat.
- Pelny `GET /api/orders/:ref` wymaga tego tokenu w naglowku `Authorization: Bearer` i zwraca `Cache-Control: no-store, private`. Sam numer zamowienia nie ujawnia statusu, kwoty ani sposobu dostawy.
- Każdy poprawnie podpisany ITN pozostaje w dzienniku. `SUCCESS` realizuje zamówienie tylko raz, a późniejszy `FAILURE` nie zmienia opłaconego zamówienia.

## 7. Lista kanałów płatności

Metoda `{host_bramki}/gatewayList/v3`, JSON. Zwraca identyfikatory kanałów, nazwy,
logotypy, stan i limity kwotowe per waluta. Pobieramy ją z cache'em zamiast zaszywać
GatewayID w kodzie, dzięki czemu lista metod w kreatorze zawsze odpowiada temu,
co jest realnie włączone na serwisie.

Hash dla tego wywołania: `SHA256("ServiceID|MessageID|Currencies|Language|klucz")`.

## 8. Zmienne środowiskowe (Railway, serwis chat-api)

| Zmienna | Przykład | Uwagi |
|---|---|---|
| `AUTOPAY_SERVICE_ID` | `218869` | |
| `AUTOPAY_HASH_KEY` | sekret | tylko tutaj |
| `AUTOPAY_HOST` | `https://pay.autopay.eu` | testy: `https://testpay.autopay.eu` |
| `AUTOPAY_START_PATH` | ścieżka z panelu | |
| `AUTOPAY_HASH_ALGO` | `sha256` | domyślny, konfigurowany po stronie Autopay |

W panelu Autopay ustawiamy adres ITN oraz adres powrotu (bez parametrów).

## 9. Czego świadomie nie używamy

- **Przedtransakcja** (start w tle zwracający `redirecturl`) daje ładniejszy UX i
  diagnostykę parametrów. Rozważymy po uruchomieniu podstawowej ścieżki, teraz to
  dodatkowa złożoność bez zysku dla klienta.
- **Koszyk produktów** (parametr `Product`, XML w base64) wchodzi do hasha jako
  osobne pole. Potrzebny dopiero przy zamówieniach wielopozycyjnych.
- **Zwroty przez API** (`settlementapi`). Przy naszym wolumenie zwrot robimy ręcznie z panelu.
