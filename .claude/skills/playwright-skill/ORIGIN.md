# playwright-skill: skąd to jest

| | |
|---|---|
| Źródło | `https://raw.githubusercontent.com/lackeyjb/playwright-skill/HEAD/skills/playwright-skill/` |
| Repozytorium | https://github.com/lackeyjb/playwright-skill |
| Autor | lackeyjb |
| Licencja | **MIT** |
| Wersja | 5.0.0 |
| Pobrano | 2026-08-16 |
| Pliki | `SKILL.md` 7 741 B, `run.js` 3 685 B, `lib/helpers.js` 4 243 B, `package.json` 699 B |

## Co robi

Pisze i wykonuje skrypty Playwrighta w locie: klika, wypełnia formularze, robi
zrzuty, sprawdza responsywność i przepływy logowania. Preferuje selektory
opisujące to, co widzi człowiek (`getByRole`, `getByLabel`, `getByText`), a nie
selektory CSS.

## Co sprawdzono przed instalacją

Przeczytane w całości: `SKILL.md`, `run.js`, `lib/helpers.js`, `package.json`.

- Deklaruje zawężone uprawnienia: `allowed-tools: Bash(node:*) Bash(npm:*) Read Write`.
- **Jedyne odwołanie sieciowe we własnym kodzie to `HEAD` na `localhost`**, żeby
  wykryć działający serwer deweloperski. Poza tym nic nie łączy się samo.
- `run.js` uruchamia skrypt przez `spawn` w katalogu roboczym wywołującego,
  z `NODE_PATH` wskazującym na `node_modules` skilla. Bez `eval`, bez pobierania.
- Zależność jedna: `playwright`.

## USTAWIENIA DLA TEGO ŚRODOWISKA

**Nie uruchamiać `npm run setup`.** Ściągnąłby drugą kopię Chromium, a
instrukcja tego środowiska mówi wprost, żeby przeglądarki nie pobierać.
Sprawdzone: `playwright` rozwiązuje się z `node_modules` repozytorium, więc
skill nie potrzebuje własnych zależności.

Wywołanie, które zadziała:

```bash
PW_HEADLESS=true \
PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
PW_ARTIFACT_DIR=/tmp \
node .claude/skills/playwright-skill/run.js <skrypt.js>
```

`PW_HEADLESS=true` jest **konieczne**: skill domyślnie startuje przeglądarkę
widoczną, a tu nie ma ekranu.

## Pułapki wykryte przy sprawdzeniu

Trzy rzeczy, na które wpadłem, uruchamiając to pierwszy raz:

1. **Funkcja nazywa się `takeScreenshot`, nie `screenshot`.** `SKILL.md` używa
   samego `page.screenshot`, więc rozbieżność wychodzi dopiero przy sięgnięciu
   do helperów.
2. **`detectDevServers()` sprawdza zamkniętą listę portów**: 3000, 3001, 3002,
   5173, 8080, 8000, 4200, 5000, 9000, 1234. Nasze `vite preview` domyślnie
   siada na 4173, czyli **poza listą**. Podawać port jawnie:
   `detectDevServers([4173])`.
3. `takeScreenshot` dokleja znacznik czasu **po rozszerzeniu**, więc plik
   nazywa się `zrzut.png-2026-08-16T00-15-46-441Z.png`. Kosmetyka, ale przy
   szukaniu pliku po nazwie potrafi zmylić.

## Zasięg sieciowy w tym środowisku

**Tylko `localhost` i wąska biała lista.** Zmierzone: `example.com`,
`wikipedia.org`, `allegro.pl`, `etsy.com`, `developer.mozilla.org`, a nawet
`claude.com` są niedostępne (`ERR_TUNNEL_CONNECTION_FAILED`). Przechodzą
`raw.githubusercontent.com`, `api.github.com`, rejestry npm i pypi.

Do podglądu naszego kreatora to wystarcza w zupełności i to jest tu główne
zastosowanie. Pełne przeglądanie internetu wymaga zmiany polityki sieciowej
środowiska albo uruchomienia Claude Code lokalnie.

## Sprawdzone, że działa

Uruchomione po instalacji przeciwko `vite preview` na 4180: wykrycie serwera,
otwarcie strony, odczyt tytułu, zapis zrzutu. Wszystko przeszło.
