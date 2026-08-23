# AEJaCA - workboard Claude Code i Codex

Ten plik koordynuje rownolegla prace. Nie jest backlogiem produktu.

## Reguly

1. Przed edycja wpisz zadanie i zastrzezone pliki.
2. Jeden plik moze miec jednego aktywnego wlasciciela.
3. Drugi model moze recenzowac, ale nie edytuje zastrzezonego pliku.
4. Stan `review` zwalnia pliki dopiero po przekazaniu handoffu.
5. Zakonczone wiersze przenosimy do archiwum po scaleniu.

## Aktywne zadania

| ID | Cel | Wlasciciel | Branch i worktree | Zastrzezone pliki | Stan | Handoff |
|---|---|---|---|---|---|---|
| TASK-001 | Wspolna warstwa komunikacji modeli | Codex | `codex/model-coordination-layer` | pliki protokolu i indeks `MDs` | review | `MDs/handoffs/TASK-001-model-coordination.md` |

Dozwolone stany: `planned`, `active`, `blocked`, `review`, `done`.

## Kolejka integracji

| ID | Branch | Recenzent | Wymagane kontrole | Wynik |
|---|---|---|---|---|
| TASK-001 | `codex/model-coordination-layer` | Claude Code | zgodnosc z `MDs`, brak sprzecznosci instrukcji, `check-emdash`, `git diff --check` | oczekuje |

## Archiwum

Po scaleniu zachowaj jeden krotki wiersz: ID, data, branch, commit scalajacy i ADR.
