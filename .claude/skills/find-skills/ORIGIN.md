# find-skills: skąd to jest

| | |
|---|---|
| Źródło | `https://raw.githubusercontent.com/dan323/easier-life-skills/HEAD/plugins/find-skills/skills/find-skills/SKILL.md` |
| Repozytorium | https://github.com/dan323/easier-life-skills |
| Autor | dan323 |
| Licencja | nie podana w manifeście wtyczki |
| Pobrano | 2026-08-15 |
| Rozmiar | 12 124 B, sam Markdown |

## Co robi

Analizuje repozytorium i proponuje skille z katalogów wtyczek. Wywołanie:
"znajdź skille dla tego projektu", "what plugins should I install".

## Co sprawdzono przed instalacją

Plik przejrzany pod kątem poleceń powłoki, ruchu sieciowego i dostępu do
sekretów. Wynik:

- **Nic nie instaluje i nic nie zmienia.** Deklaruje to wprost w nagłówku
  i nie ma w treści żadnej operacji zapisu.
- Jedyne polecenia powłoki to odczyty: `cat ~/.claude/settings.json`,
  `ls ~/.claude/plugins/`, oraz odczyt plików projektu, żeby wiedzieć, co
  już jest zainstalowane i czym ten projekt jest.
- **Do internetu wychodzi tylko na wyraźne żądanie**: gdy w poleceniu padnie
  "online", "search the web", "search online", "web search" albo "internet".
  Domyślnie korzysta z lokalnych katalogów.
- Brak `curl`, `wget`, `eval`, `base64`, instalacji pakietów i odwołań do
  plików z sekretami.

## Uwaga na przyszłość

Przy aktualizacji pobierać z tego samego adresu i ponownie przejrzeć plik.
Skill to instrukcja, którą wykonuje agent, więc podmiana treści w źródle jest
równoważna podmianie kodu.
