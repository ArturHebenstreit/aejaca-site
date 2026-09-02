# rhino3d-scripts, skad i na jakich warunkach

## Zrodlo

- Repozytorium: `github/awesome-copilot`, katalog `skills/rhino3d-scripts/`
- Adres: https://github.com/github/awesome-copilot/tree/main/skills/rhino3d-scripts
- Pobrano: 2026-09-02, z galezi `main`
- Licencja: MIT, Copyright GitHub, Inc.
  (https://raw.githubusercontent.com/github/awesome-copilot/main/LICENSE)
- Pobrane pliki: `SKILL.md` oraz cztery pliki w `references/`
  (`rhinoscriptsyntax-cheatsheet.md`, `rhinocommon-map.md`,
  `macros-and-loading.md`, `vbscript-quirks.md`). Nic wiecej ten skill nie ma.

## Po co nam

Pracownia modeluje w Rhino 8, a `jewelry-design` (skill konta, nie repozytorium)
opisuje BIZUTERIE: tolerancje osadzenia kamienia, skurcz stopu, kanaly wlewowe,
druk. Nie opisuje natomiast samego pisania skryptow do Rhino, a to jest osobna
wiedza i osobne pulapki. Te dwa skille nie nachodza na siebie: jeden mowi CO
zbudowac i z czego, drugi CZYM to zautomatyzowac.

Najwiecej warte sa tu rzeczy, ktorych nie ma w dokumentacji McNeela, a ktore
kosztuja godzine przy pierwszym trafieniu:

- `_-RunPythonScript` uruchamia IronPython 2.7, ktory **wywala sie na dlugim
  mysliniku** i na kazdym innym znaku spoza ASCII, a `rhinocode` (CPython 3)
  ten sam plik uruchamia bez slowa. Blad wyglada wiec na losowy.
- Skrypt nazwany jak modul biblioteki standardowej (`random.py`, `math.py`)
  psuje importy WEWNATRZ tej biblioteki, bo IronPython przeszukuje katalog
  skryptu przed stdlib.
- `Rhino.RhinoApp.IsHeadless` nie istnieje w czesci wydan Rhino 8.
- `doc.Objects.AddBrep()` przy niepowodzeniu oddaje puste GUID, a nie wyjatek.

## Przeglad bezpieczenstwa (2026-09-02)

Skill to instrukcja, ktora agent wykonuje, wiec obcy skill jest obcym kodem.
Przeczytane w calosci, wszystkie piec plikow.

- **Zadnego kodu do uruchomienia**: same pliki `.md`, bez `scripts/`, bez
  plikow wykonywalnych.
- **Zadnych wywolan sieciowych**: brak `curl`, `wget`, `fetch`, brak instrukcji
  pobierania czegokolwiek. Adresy w tekscie prowadza wylacznie do dokumentacji
  McNeela i do repozytorium przykladow McNeela, i sa cytowane jako odnosniki
  do przeczytania, a nie do wykonania.
- **Zadnego siegania po sekrety**: brak wzmianek o tokenach, kluczach,
  zmiennych srodowiskowych i plikach poza katalogiem skryptu.
- **Zadnych polecen zmieniajacych system**: przyklady operuja na dokumencie
  Rhino, nie na dysku ani na powloce.
- Fragmenty kodu w tekscie sa przykladami Rhino Python i VBScript do
  przeczytania przez czlowieka, nie do samoczynnego uruchomienia.

Wniosek: bezpieczny do trzymania w repozytorium.

## Uwagi dla nas

- Katalog stoi na liscie `SKILLE_ZEWNETRZNE` w `scripts/check-emdash.mjs`, bo
  tekst jest cudzy i zawiera dlugie myslniki. Ten plik regule podlega, bo to
  juz nasze pisanie.
- Skill mowi o Rhino 7 i nowszym, ale zaklada Rhino 8 tam, gdzie to ma
  znaczenie (jeden Script Editor, CPython 3 obok IronPythona).
- Przy aktualizacji: pobrac te same piec plikow z `main` i przeczytac roznice,
  zamiast nadpisywac w ciemno.
