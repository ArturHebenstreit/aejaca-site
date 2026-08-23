# Handoff zadania

Skopiuj ten plik do `MDs/handoffs/<ID>-<krotka-nazwa>.md`. Handoff opisuje stan
sprawdzalny, nie przebieg rozmowy ani deklaracje autora.

```yaml
task_id: TASK-000
status: review | blocked | partial
author: Claude Code | Codex
branch: nazwa-galezi
base_commit: pelny-SHA
last_commit: pelny-SHA-albo-uncommitted
updated: YYYY-MM-DD
```

## Cel

Jedno zdanie opisujace rezultat dla klienta albo systemu.

## Stan przed zmiana

Mierzalny blad, ograniczenie albo brak. Dodaj sposob odtworzenia.

## Zalozenia i decyzje

- decyzja;
- zrodlo: ADR, dokument domenowy albo jawne ustalenie wlasciciela;
- odrzucona alternatywa i powod, jesli byla istotna.

## Zakres

### Zmienione pliki

- `sciezka`: odpowiedzialnosc zmiany.

### Swiadomie poza zakresem

- rzecz, ktorej kolejny agent nie powinien zakladac jako wykonanej.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Test bledu przed poprawka |  | fail zgodnie z oczekiwaniem |
| Test po poprawce |  | pass |
| Kontrola negatywna |  | pass |
| Build | `npm run build` | pass, fail albo nie uruchomiono |

## Ryzyka i otwarte pytania

- ryzyko, ktore pozostaje;
- czego nie sprawdzono;
- decyzja wymagana od Artura.

## Instrukcja dla recenzenta

1. Najwazniejsza hipoteza do podwazenia.
2. Granica systemu, ktora trzeba sprawdzic.
3. Dokumenty wymagajace potwierdzenia synchronizacji.

## Warunek uznania zadania za gotowe

Jednoznaczna, sprawdzalna lista warunkow.
