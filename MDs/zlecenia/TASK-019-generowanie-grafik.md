# Zlecenie zadania

```yaml
task_id: TASK-019
status: planned
author: Claude Code (sesja diagnozujaca, nie wykonawcza)
wykonawca: model przyjmujacy zlecenie
branch: claude/fix-api-error-oge1r
base_commit: 789358d
updated: 2026-08-29
```

Ten plik jest ZLECENIEM, a nie handoffem. Opisuje prace do wykonania. Po jej
skonczeniu zaloz osobny handoff w `MDs/handoffs/TASK-019-generowanie-grafik.md`
wedlug `MDs/HANDOFF_TEMPLATE.md`.

## Cel

Generowanie grafik do serwisu ma dzialac z repozytorium, w kazdej sesji,
takze zdalnej, bez polegania na lokalnej konfiguracji MCP wlasciciela.

## Stan przed zmiana, zweryfikowany pomiarem

Nie przyjmuj tego na wiare, ale nie powtarzaj tez diagnozy od zera. Ponizsze
zostalo zmierzone 2026-08-29 w sesji zdalnej, z kluczem `GEMINI_API_KEY`
obecnym w srodowisku.

1. **Skrypt `scripts/gemini-image.mjs` jest martwy.** Strzela do
   `imagen-4.0-fast-generate-001` przez `:predict` i dostaje:

   ```
   404 models/imagen-4.0-fast-generate-001 is not found for API version
       v1beta, or is not supported for predict.
   ```

2. **Na tym kluczu nie ma zadnego modelu Imagen.** `ListModels` nie zwraca
   ani jednej pozycji `models/imagen*`.

3. **Sa za to modele obrazowe Gemini**, czyli to, co nosi nazwe Nano Banana:
   `gemini-3-pro-image` (Pro), `gemini-2.5-flash-image`, `gemini-3.1-flash-image`.

4. **`gemini-3-pro-image` dziala z tego kontenera.** Wywolanie
   `:generateContent` z `responseModalities: ["IMAGE"]` zwrocilo 200,
   `finishReason: STOP` i czesc `inlineData` o dlugosci ok. 512 kB.

5. **Zwrocony `mimeType` to `image/jpeg`, nie `image/png`.** To jest wazne,
   patrz pulapka numer jeden.

6. **Proporcje `21:9` sa obslugiwane natywnie** (200, obraz zwrocony), wiec
   obecne w skrypcie sprowadzanie `21:9` do `16:9` jest juz niepotrzebne.

7. **MCP `nano-banana-pro` nie istnieje w repozytorium.** Nie ma `.mcp.json`
   ani `.claude/settings.json`. Ten serwer jest skonfigurowany wylacznie
   lokalnie u wlasciciela, wiec zadna sesja zdalna go nie ma.

Odtworzenie punktu 1, jedno polecenie:

```
node scripts/gemini-image.mjs "test" /tmp/x.png 1:1
```

## Zalozenia i decyzje

- **Skrypt zostaje jedyna wersjonowana droga do grafik.** MCP nie jest
  wersjonowany, wiec kazda sesja bez lokalnej konfiguracji wlasciciela
  zostawalaby bez grafik. Odrzucona alternatywa: skasowac skrypt i polegac
  na MCP. Odrzucona, bo trzy dokumenty odsylaja dzis do skryptu jako do
  drogi dzialajacej, a sesja zdalna nie ma jak z MCP skorzystac.
- **Model domyslny: `gemini-3-pro-image`.** Ma byc nadpisywalny zmienna
  srodowiskowa, zeby zejscie na `gemini-2.5-flash-image` przy problemach
  z limitem nie wymagalo commita.
- **Sygnatura wywolania sie nie zmienia**: prompt, sciezka wyjscia,
  proporcje. `scripts/gen-service-images.mjs` wola skrypt przez
  `execFileSync` z trzema argumentami i ma zadzialac bez zmian.

## Zakres

### Do zmiany

- `scripts/gemini-image.mjs`: przepisanie z `:predict` na `:generateContent`,
  odczyt `candidates[0].content.parts[].inlineData`, usuniecie sprowadzania
  `21:9` do `16:9`, model z `GEMINI_IMAGE_MODEL` z domyslka
  `gemini-3-pro-image`.
- `scripts/test-gemini-image.mjs` (nowy) i wpiecie go do `build`
  w `package.json`.
- Dokumentacja, ktora dzis klamie: `CLAUDE.md` (wiersz 127, sekcja Images),
  `MDs/B2B_Architektura.md` (naglowek sekcji Grafiki, mowi "Imagen"),
  `MDs/Prompty_Grafiki_MSLA.md` (wiersz 19).

### Swiadomie poza zakresem

- **Regenerowanie istniejacych grafik.** Zadanie naprawia narzedzie, nie
  podmienia obrazow w serwisie. Zaden plik w `public/img/` nie ma sie zmienic.
- **Konfiguracja MCP w repozytorium.** To decyzja wlasciciela, nie tego zadania.
- **Edycja obrazu i wariant z obrazem wejsciowym.** Model to potrafi, ale
  dzis nikt tego nie wola.

## Pulapki, ktore zjadaja to zadanie

1. **JPEG zapisany pod nazwa `.png`.** Model zwraca `image/jpeg`, a cala
   konwencja projektu to `public/img/**/<id>.png`. Zapisanie bajtow JPEG do
   pliku `.png` dziala w przegladarce, bo ta zgaduje typ po zawartosci, ale
   Cloudflare poda naglowek `Content-Type: image/png` wynikajacy z rozszerzenia.
   To jest dokladnie ta klasa awarii, ktora w tym projekcie scigamy: nic sie
   nie wywala, tylko jest zle. **Rozwiazanie: `sharp` jest juz zaleznoscia
   (`^0.34.5`, dziala w tym kontenerze). Przekoduj do formatu wynikajacego
   z rozszerzenia sciezki wyjsciowej.** Nie zmieniaj nazw plikow.
2. **Build nie ma prawa wolac sieci.** Test ma sprawdzac ksztalt skryptu,
   nie generowac obrazu. Wywolanie API w `npm run build` uzaleznia build od
   limitu i kosztu klucza.
3. **Klucz nie moze trafic do repozytorium.** `GEMINI_API_KEY` czytamy
   wylacznie z `process.env`, tak jak dzis. Nie wpisuj go do zadnego pliku,
   nie wypisuj w logu, nie wklejaj do rozmowy.
4. **`gen-service-images.mjs` polyka blad.** Ma `try/catch`, ktory drukuje
   ostatnia linie bledu i idzie dalej. Przy zepsutym skrypcie petla po
   wszystkich uslugach wypisuje same porazki i konczy sie kodem zero. Nie
   traktuj jego zielonego zakonczenia jako dowodu, ze cokolwiek powstalo.

## Test, ktorego wymagamy

`scripts/test-gemini-image.mjs`, bez sieci, ma stwierdzic co najmniej:

| Kontrola | Dlaczego |
|---|---|
| Skrypt nie zawiera juz ciagu `imagen` ani `:predict` | zeby martwy adres nie wrocil |
| Skrypt wola `:generateContent` i czyta `inlineData` | wlasciwy ksztalt odpowiedzi |
| Format zapisu wynika z rozszerzenia sciezki, nie z `mimeType` odpowiedzi | pulapka numer jeden |
| Klucz brany wylacznie z `process.env.GEMINI_API_KEY` | zeby nie wjechal do repozytorium |
| `21:9` nie jest podmieniane na `16:9` | proporcja obslugiwana natywnie |
| `gen-service-images.mjs` wola skrypt z trzema argumentami | zgodnosc sygnatury |

Do kazdej kontroli dopisz **kontrole negatywna**: zepsuj chwilowo warunek
i potwierdz, ze test zapala sie na czerwono. Test, ktory nigdy nie zawiodl,
nie jest dowodem.

Osobno, **recznie i poza buildem**, wygeneruj jeden obraz do katalogu
tymczasowego i sprawdz polecenie `file`, czy typ zawartosci zgadza sie
z rozszerzeniem. Wynik opisz w handoffie. Pliku nie commituj.

## Reguly projektu, ktorych nie wolno zlamac

- **Zaden dlugi myslnik**, nigdzie: ani w kodzie, ani w komentarzu, ani
  w commicie, ani w odpowiedzi. Pilnuje tego `scripts/check-emdash.mjs`
  i wywala build.
- **Gałąź `claude/fix-api-error-oge1r`.** Nie pushuj nigdzie indziej.
  Nie scalaj do `main` i nie zakladaj pull requesta, chyba ze Artur
  poprosi wprost.
- **Zarezerwuj TASK-019 na `MDs/WORKBOARD.md`** przed pierwsza edycja,
  zgodnie z regulami na gorze tego pliku.
- **Idz krok po kroku** i po kazdym kroku zapytaj wlasciciela
  "Czy idziemy dalej?".
- **Pelny `npm run build` na koniec**, kod wyjscia zero.
- **Commituj i pushuj po kazdym skonczonym kawalku.** Kontener tej sesji
  resetowal sie do starego klona pieciokrotnie w ciagu jednego zadania.
  Praca niewypchnieta jest praca stracona. Po resecie odzyskujesz stan
  poleceniem `git fetch --force origin claude/fix-api-error-oge1r`
  i `git reset --hard FETCH_HEAD`.

## Warunek uznania zadania za gotowe

1. `node scripts/gemini-image.mjs "<prompt>" <plik> 1:1` zapisuje obraz,
   ktorego zawartosc odpowiada rozszerzeniu pliku.
2. `21:9` daje obraz w proporcji `21:9`, a nie `16:9`.
3. Model da sie zmienic przez `GEMINI_IMAGE_MODEL` bez zmiany kodu.
4. `scripts/test-gemini-image.mjs` przechodzi, jest w `build`, a kazda jego
   kontrola ma opisana w handoffie kontrole negatywna.
5. Build nie wola sieci.
6. `CLAUDE.md`, `MDs/B2B_Architektura.md` i `MDs/Prompty_Grafiki_MSLA.md`
   opisuja droge, ktora naprawde dziala, i nie mowia juz "Imagen".
7. Zaden plik w `public/img/` nie zostal zmieniony.
8. `npm run build` przechodzi z kodem zero.
9. Handoff zalozony w `MDs/handoffs/TASK-019-generowanie-grafik.md`.
