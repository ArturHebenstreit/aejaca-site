---
status: accepted
owner: Artur
date: 2026-08-25
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0012-zaplata-za-oferte.md
  - chat-api/productionQueue.js
  - admin/views/queue.ejs
  - src/pages/OrderStatus.jsx
  - scripts/test-production-queue.mjs
---

# ADR-0013: Kolejka pracowni jako widok nad tabela zamowien

## Kontekst

Zamowienie oplacone nie mialo dalszego ciagu. Statusy `in_production`,
`shipped` i `completed` stoja w ograniczeniu tabeli `orders` od poczatku, ale
przez caly czas nic ich nie ustawialo, wiec zamowienie zostawalo w stanie
`paid` na zawsze. Na pytanie "co jest dzisiaj do zrobienia i co czeka
najdluzej" odpowiadala skrzynka mailowa i pamiec.

ADR-0012 to zaostrzyl. Zamowienia z oferty przychodza spoza sklepu, nie maja
watku w koszyku i nie zostawiaja po sobie nawet sladu w liscie zakupow, wiec
jedynym miejscem, w ktorym mozna je zobaczyc, jest panel.

## Decyzja

Kolejka jest **widokiem nad tabela `orders`**, a nie osobna tabela. Etap pracy
to status zamowienia plus stempel czasu w jednej z trzech kolumn.

Kolejnosc jest jedna i nie podlega negocjacji: **kto pierwszy zaplacil**.
Sortujemy po `paid_at`, a nie po dacie zlozenia.

Przejscia miedzy etapami sa **wypisane**, w osobnym pliku
`chat-api/productionQueue.js`, a nie dowolne. Osobny plik istnieje po to, zeby
regule dalo sie sprawdzic testem bez stawiania serwera i bazy.

`paid -> shipped` z pominieciem `in_production` jest dozwolone swiadomie. Rzecz
z polki pakuje sie i wysyla tego samego dnia, a wymuszanie po drodze etapu
"w robocie" uczyloby wylacznie klikania na sile.

Etap pracy widzi takze klient, na stronie statusu zamowienia. Bez tego strona
po pchnieciu zamowienia do produkcji wracala do galezi domyslnej i mowila
oplaconemu klientowi, ze czekamy na jego platnosc.

## Alternatywy

- **Osobna tabela `production_jobs`.** Odrzucone: powstaloby drugie zrodlo
  prawdy o tym samym zamowieniu, ktore trzeba trzymac w zgodzie z pierwszym.
  Etap pracy jest cecha zamowienia, a nie osobnym bytem.
- **Zmiana statusu z listy rozwijanej, bez regul.** Odrzucone: jedno
  klikniecie w zlym wierszu robiloby z zamowienia nieoplaconego zamowienie
  wyslane. Zadna kwota by sie przy tym nie zmienila, wiec nikt by tego nie
  zauwazyl az do pytania klienta, gdzie jest paczka.
- **Sortowanie po dacie zlozenia.** Odrzucone: zlozenie bez zaplaty nie
  rezerwuje czasu pracowni.
- **Ukrycie etapu przed klientem.** Odrzucone: pytanie "co sie dzieje z moim
  zamowieniem" i tak przychodzi, tylko mailem, i odpowiada na nie czlowiek.

## Konsekwencje

- Trzy kolumny ze stemplem czasu (`production_started_at`, `shipped_at`,
  `completed_at`) plus `tracking_number` i `production_note`. Powstaja przy
  starcie serwera i sa opisane w `scripts/orders-schema.sql`.
- Nazwa kolumny ze stemplem trafia do `UPDATE` przez interpolacje, bo nazwy
  kolumny nie da sie podac przez `$N`. Jest to bezpieczne wylacznie dopoki
  wartosc pochodzi z tabeli regul, a nie z tresci zadania.
- Kazdy nowy etap pracy wymaga trzech rzeczy naraz: wpisu w regule, kolumny
  w obu miejscach i galezi na stronie klienta. Pominiecie trzeciej z nich jest
  regresja, ktora widzi tylko klient.

## Niezmienniki i testy

- Do etapu wchodzi sie wylacznie ze stanu wypisanego w regule. `awaiting_payment`
  nie prowadzi nigdzie.
- `UPDATE` powtarza warunek statusu, wiec anulowanie w drugiej zakladce nie
  przegrywa wyscigu z pchnieciem etapu.
- Nazwa kolumny ze stemplem musi byc zwyklym identyfikatorem.
- Kazda kolumna z reguly istnieje, a kazdy status z reguly nalezy do
  ograniczenia `CHECK` tabeli `orders`.
- Pilnuje tego `scripts/test-production-queue.mjs`, wpiety w `npm run build`.
  Test znalazl przy pisaniu prawdziwa dziure: `ETAPY_PRACY["__proto__"]`
  oddawalo prototyp, wiec taki etap przechodzil walidacje i przewracal obsluge
  zadania. Stad `znanyEtap()` na `Object.hasOwn`.
