# task-observer: skąd to jest

| | |
|---|---|
| Źródło | `https://raw.githubusercontent.com/rebelytics/one-skill-to-rule-them-all/HEAD/` |
| Repozytorium | https://github.com/rebelytics/one-skill-to-rule-them-all |
| Autor | Eoghan Henn, https://rebelytics.com |
| Licencja | **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/) |
| Pobrano | 2026-08-15 |
| Rozmiar | SKILL.md 24 492 B + 3 pliki `references/` łącznie 27 655 B |

Licencja wymaga wskazania autora. Stąd ten plik i podpis zachowany w treści
`SKILL.md`.

## Co robi

Obserwuje sesję, wyłapuje korekty użytkownika i wzorce warte zapisania, i
zamienia je we wnioski do skilli. Znany też jako "One Skill to Rule Them All".

## POBIERAĆ ZE ŹRÓDŁA, NIE Z FORKÓW

Kanoniczny `SKILL.md` u autora ma **24 KB**, bo pliki `references/` ładują się
dopiero na żądanie. Krążące po GitHubie kopie (`Carefree-1991/claude-skills`,
`iamneilroberts/claude-skills`) mają **54 i 73 KB**, bo wciągnęły `references`
do środka. Ta różnica idzie prosto w kontekst każdej sesji, w której skill się
załaduje.

## Co sprawdzono przed instalacją

Wszystkie cztery pliki przejrzane pod kątem poleceń powłoki, ruchu sieciowego
i dostępu do sekretów. Wynik:

- Sam Markdown, zero skryptów i zero ruchu sieciowego.
- Jedyne polecenie powłoki w całym pakiecie to `chmod -R u+w` na **własnej
  kopii roboczej** skilla, potrzebne w Cowork, gdzie skille są podmontowane
  tylko do odczytu.
- Brak odwołań do plików z sekretami, do `.env` i poza katalog projektu.

## Gdzie zapisuje, i dlaczego to przypięliśmy

Domyślnie skill trzyma log w `[workspace folder]/skill-observations/`, co
w Claude Code oznacza `~/.claude/projects/<id>/`. **W naszym środowisku zdalnym
ten katalog jest ulotny**: kontener jest kasowany po sesji, więc log przepadłby
za każdym razem. Sam skill ostrzega przed tym przypadkiem.

Dlatego lokalizacja jest przypięta do repozytorium, w `MDs/skill-observations/`.
Zapis jest wtedy wersjonowany w gicie razem z resztą wiedzy o projekcie, tak
samo jak dziennik w `MDs/AEJaCA_Geometria_Kreatora_Zasady.md`. Reguła stoi
w `CLAUDE.md`.

## Uwaga na przyszłość

Autor pisze uczciwie, że przy małej bibliotece skilli wbudowana pamięć pokrywa
większość tego samego mniejszym kosztem. Jeżeli po miesiącu log będzie pusty
albo powtarzać będzie to, co i tak trafia do dziennika geometrii, warto ten
skill wyłączyć zamiast płacić za niego kontekstem w każdej sesji.
