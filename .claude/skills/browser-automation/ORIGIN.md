# browser-automation: skąd to jest

| | |
|---|---|
| Źródło | `https://raw.githubusercontent.com/howar31/browser-automation/HEAD/skills/browser-automation/SKILL.md` |
| Repozytorium | https://github.com/howar31/browser-automation |
| Autor | Howar31 |
| Licencja | **MIT** (plik `LICENSE` obok) |
| Pobrano | 2026-08-16 |
| Pliki | `SKILL.md` 15 315 B, `LICENSE` 1 064 B |

## Co robi

Warstwa wiedzy o sterowaniu prawdziwą przeglądarką, głębsza niż
`playwright-skill`: przechwytywanie i podmiana ruchu sieciowego, wykonywanie JS
w kontekście strony, emulacja urządzenia, geolokalizacji i user-agenta,
ciasteczka i storage, logi konsoli i błędy JS ze śladem stosu, profilowanie
wydajności i pokrycia JS, zrzuty sterty oraz surowa sesja **Chrome DevTools
Protocol**. Zawiera przewodnik, kiedy brać Puppeteer, a kiedy Playwrighta.

## Podział ról między tym a `playwright-skill`

To nie jest duplikat, tylko inna warstwa:

| Zadanie | Który |
|---|---|
| Otwórz stronę, kliknij, zrób zrzut, sprawdź responsywność | `playwright-skill` |
| Podejrzyj, co strona **naprawdę wysyła i odbiera**, podmień odpowiedź, zajrzyj do konsoli, zaprofiluj | `browser-automation` |
| Silnik WebKit (Safari) albo Firefox | `browser-automation` |

Do weryfikowania hipotez o zachowaniu cudzych serwisów właściwy jest ten
drugi: przechwytywanie ruchu i CDP to jest to, czym się sprawdza, co robi
algorytm po stronie klienta.

## Co sprawdzono przed instalacją

- **To sam Markdown.** Zero kodu, zero skryptów, zero ruchu sieciowego. Skill
  uczy pisać skrypty, sam żadnego nie uruchamia.
- W repozytorium jest `setup.sh`, który podlinkowuje skill do
  `~/.claude/skills/` i robi kopię zapasową przed nadpisaniem. **Nie używamy
  go**: instalujemy do repozytorium, żeby przeżyło sesję i było wersjonowane.

## USTAWIENIA DLA TEGO ŚRODOWISKA

`SKILL.md` w kilku miejscach każe uruchomić `npm install -g puppeteer
playwright` oraz `npx playwright install chromium firefox webkit`.
**Nie robimy tego.** W tym środowisku:

- `playwright` jest już w `node_modules` repozytorium,
- Chromium leży w `/opt/pw-browsers`, a `PLAYWRIGHT_BROWSERS_PATH` jest ustawione,
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` blokuje ponowne pobieranie.

Puppeteera nie ma i nie instalujemy. Przy zadaniach wymagających CDP używać
Playwrighta, który daje sesję CDP przez `context.newCDPSession(page)`.
Uruchamiać zawsze headless, bo tu nie ma ekranu.

## Zasięg sieciowy w tym środowisku

**Tylko `localhost` i wąska biała lista** (`raw.githubusercontent.com`,
`api.github.com`, npm, pypi). Zmierzone: `example.com`, `wikipedia.org`,
`allegro.pl`, `etsy.com`, `developer.mozilla.org` i `claude.com` są
niedostępne.

Ten skill pokazuje więc tu swoją mniejszą część. **Pełnia możliwości, czyli
podglądanie cudzych serwisów i weryfikowanie hipotez o algorytmach, wymaga
uruchomienia Claude Code lokalnie** albo zmiany polityki sieciowej środowiska
(https://code.claude.com/docs/en/claude-code-on-the-web). Instalujemy go teraz
świadomie, na tę drugą maszynę.
