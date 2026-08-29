# AEJaCA - instrukcje dla Codex

Przed rozpoczeciem pracy przeczytaj kolejno:

1. `PROJECT_RULES.md` - wspolne, nadrzedne reguly projektu.
2. `MDs/README.md` - mapa dokumentacji i hierarchia zrodel prawdy.
3. `MDs/WORKBOARD.md` - aktywne zadania, wlasciciele i zastrzezone pliki.
4. Dokumenty domenowe wskazane w `MDs/README.md` dla obszaru zadania.

## Wspolpraca z Claude Code

- Codex pracuje w osobnym worktree i na galezi `codex/<krotka-nazwa-zadania>`.
- Nie edytuj pliku zastrzezonego przez Claude Code w `MDs/WORKBOARD.md`.
- Przed pierwsza edycja wpisz zadanie, branch i zastrzezone pliki do workboardu.
- Decyzje architektoniczne zapisuj w `MDs/decisions/` wedlug szablonu.
- Przekazuj zakonczona lub przerwana prace przez dokument oparty na `MDs/HANDOFF_TEMPLATE.md`.
- Nie uznawaj wpisu z planu lub starego audytu za aktualna decyzje bez sprawdzenia jego statusu w `MDs/README.md` i aktualnego kodu.
- Najlepszy podzial to autor i niezalezny recenzent. Nie poprawiaj po cichu kodu drugiego modelu w jego branchu.
- Nielogicznosc w zleceniu zglaszasz PRZED kodem, z rekomendacja i alternatywa: `PROJECT_RULES.md`, sekcja `Jak podejmujemy decyzje`.

## Zakonczenie zadania

Przed przekazaniem pracy:

1. Uruchom kontrole wskazane w `PROJECT_RULES.md` i dokumentach domenowych.
2. Zaktualizuj dokumenty, ktorych zmiana wymaga synchronizacji.
3. Uzupelnij handoff: decyzje, testy, ryzyka, otwarte pytania i zakres plikow.
4. Zmien stan zadania w `MDs/WORKBOARD.md` na `review` albo `blocked`.
5. Nie scalaj do `main` i nie publikuj bez wyraznej prosby wlasciciela.
