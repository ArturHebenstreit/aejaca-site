# frontend-design: skąd to jest

| | |
|---|---|
| Źródło | `https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/` |
| Repozytorium | https://github.com/anthropics/skills |
| Autor | Anthropic (oficjalne skille przykładowe) |
| Licencja | **Apache 2.0** (`LICENSE.txt` obok, pełny tekst) |
| Wersja | katalog nie wersjonuje pojedynczych skilli; wpis w `example-skills` |
| Pobrano | 2026-08-27 |
| Pliki | `SKILL.md` 8 260 B, `LICENSE.txt` 10 174 B |

## Co robi

Wiedza o projektowaniu interfejsów, nie o kodzie. Każe podejść do zlecenia jak
kierownik artystyczny małej pracowni: nazwać temat i odbiorcę zanim cokolwiek
powstanie, zbudować zwięzły system tokenów (4–6 nazwanych kolorów, kroje do
2+ ról, koncepcja układu, jeden element sygnaturowy), skrytykować ten plan
zanim pójdzie kod, i dopiero potem budować.

Trzy rzeczy, dla których warto go trzymać w repozytorium:

1. **Nazywa wprost, jak wygląda projekt zrobiony przez AI** i każe tego unikać:
   kremowe tło koło `#F4F1EA` z kontrastowym szeryfem i terakotowym akcentem,
   prawie czarne tło z jednym kwaśnozielonym akcentem, układ gazetowy
   z włosowymi liniami i zerowym zaokrągleniem. Nie zakazuje ich, tylko każe
   je wybrać świadomie, a nie wpaść w nie z rozpędu.
2. **Ma osobny rozdział o pisaniu w interfejsie.** Nazywaj rzeczy tak, jak
   widzi je człowiek, a nie jak zbudowany jest system. Strona główna czasownika.
   Przycisk „Publikuj" ma dawać komunikat „Opublikowano". Błąd nie przeprasza
   i nie jest ogólnikowy. Pusty ekran to zaproszenie do działania. To dokładnie
   ta warstwa, przez którą przeszliśmy ręcznie przy panelu wycen.
3. **Podłoga jakości bez ogłaszania jej:** responsywność do telefonu, widoczny
   fokus klawiatury, uszanowany `prefers-reduced-motion`.

## Co sprawdzono przed instalacją

Przeczytany w całości, 55 wierszy, jeden plik. **Zero kodu:** żadnego skryptu,
żadnego `curl`, `bash`, `eval` ani importu. To czysta instrukcja tekstowa, więc
jedyne, co może zrobić, to zmienić sposób, w jaki agent projektuje. Pobrany
z repozytorium Anthropica po HTTPS przez proxy sesji.

## Jak to się ma do reszty skilli w tym repozytorium

- `aejaca-design` **wygrywa na aejaca.com.** Marka jest ustalona: Jewelry to
  bursztyn i Playfair, sTuDiO to błękit i Inter, a spójność trzyma sto
  prerenderowanych stron. `frontend-design` zachęca do brania ryzyka
  estetycznego i do sięgania po kroje inne niż zwykle. **To jest jego jedyny
  punkt sporny z tym projektem i trzeba go pilnować:** ten skill służy do
  rzeczy NOWYCH, gdzie kierunku jeszcze nie ma (nowe narzędzie, strona
  kampanii, ekran panelu, prototyp), a nie do przemalowywania tego, co stoi.
  Sam skill to zresztą mówi: „gdzie brief przesądza kierunek, brief wygrywa".
  Brand Reference jest tutaj briefem.
- `design` (wtyczka z marketplace, włączona na koncie) pokrywa **proces**:
  krytykę, przekazanie do wdrożenia, audyt dostępności, badania. To jest
  uzupełnienie, nie dublet: tamten mówi jak prowadzić pracę, ten jak wygląda
  dobra decyzja projektowa.
- `browser-automation` i `playwright-skill` domykają pętlę: `frontend-design`
  wprost każe robić zrzuty i krytykować własną pracę na obrazku, a nie w kodzie.
