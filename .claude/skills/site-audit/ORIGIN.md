# site-audit: skad to jest i co zmienilismy

| | |
|---|---|
| Zrodlo | `https://raw.githubusercontent.com/dan323/easier-life-skills/master/plugins/site-audit/` |
| Repozytorium | https://github.com/dan323/easier-life-skills |
| Autor | dan323 |
| Licencja | **MIT** (kopia w `LICENSE`) |
| Wersja | 1.4.1 (plugin.json), SKILL.md 1.1 |
| Pobrano | 2026-09-02 |
| Pliki oryginalu | `SKILL.md` 9 368 B, `.mcp.json` 151 B, `agents/` 5 plikow (21 997 B), `references/` 5 plikow (18 269 B) |

## Co robi

Przeglad serwisu w czterech osiach naraz: wygoda (heurystyki UX), dostepnosc
(WCAG 2.1 przez axe), wydajnosc (Lighthouse albo reczne sprawdziany HTML)
i bledy funkcjonalne (konsola, zasoby, martwe klikniecia, pulapki w modalach).
Najpierw jeden crawl buduje `sitemap.json` z PRAWDZIWYMI selektorami, potem
cztery agenty czytaja ten sam artefakt rownolegle. Raport grupuje wyniki
wedlug powagi i konczy piecioma zaleceniami.

## Co sprawdzono przed instalacja

Przeczytane w calosci: `SKILL.md`, `.mcp.json`, piec definicji agentow, piec
list kontrolnych.

- **Tylko czyta i klika bezpieczne rzeczy.** Lista slow, ktorych nie klika
  (buy, pay, order, delete, submit...), zakaz wysylania formularzy poza
  wyszukiwarka GET, zakaz POST, zakaz mutowania strony przez `evaluate`,
  zakaz odgadywania sciezek (`/admin`, `/.git/config`). Autor pisze wprost:
  "Playwright would happily place an order if you let it."
- **Selektory tylko z obserwacji.** Kazdy selektor w wygenerowanym tescie musi
  stac w `sitemap.json`; zmyslony selektor pomija sie, a nie zglasza jako blad.
- **Pobiera kod w locie**: `npx --yes @playwright/mcp@latest`, `axe-cli`,
  `pa11y`, `lighthouse`, `playwright@latest install chromium --with-deps`.
  To jedyne, co budzilo watpliwosc, i to wlasnie zostalo wyciete (nizej).
- Zero telemetrii, zero wlasnych hostow, zero kluczy.

## USTAWIENIA DLA TEGO SRODOWISKA, czyli co i dlaczego zmienilismy

Oryginal w tej postaci u nas nie rusza z trzech powodow: wymaga serwera
Playwright MCP, ktorego nie mamy (mamy `playwright-skill` na lokalnym
Chromium i zakaz pobierania przegladarek); wola agenty `site-audit:*`, ktore
istnieja tylko jako wtyczka; czyta pliki spod `plugins/site-audit/references/`.

| Plik | Stan | Co zmieniono |
|---|---|---|
| `references/*.md` (5) | **verbatim** | nic; to jest wiedza, po ktora ten skill wzielismy |
| `LICENSE` | verbatim | kopia MIT z korzenia repozytorium autora |
| `SKILL.md` | przepisany | katalog roboczy `audyt-ux/` zamiast `/tmp/site-audit-<host>/`; faza pomiaru to jedno polecenie `npm run ux:pomiar`; dwa agenty oceniajace zamiast czterech; raport ma sekcje "klasy, nie sztuki" |
| `agents/site-mapper.md` | zastapiony skryptem | `aejaca-ux/pomiar/mapa.mjs`; ten sam schemat plus zrzuty ekranu, naglowki, obszar odnosnika, strony nieosiagniete |
| `agents/accessibility-auditor.md` | zastapiony skryptem | `aejaca-ux/pomiar/dostepnosc.mjs`; `axe-core` z `node_modules` zamiast `npx axe-cli`; oba motywy i obie szerokosci |
| `agents/bug-script-runner.md` | zastapiony skryptem | `aejaca-ux/pomiar/bledy.mjs`; stale sprawdziany zamiast generowanego testu; dodany wzorzec `redirect-link` |
| `agents/ux-analyst.md` | przepisany | oglada ZRZUTY, nie HTML; czyta nasze reguly z `aejaca-ux`; raportuje klasami |
| `agents/performance-auditor.md` | przepisany | Lighthouse tylko lokalnie; w srodowisku zdalnym reczne sprawdziany na `dist/`; zna to, czego build juz pilnuje |
| `.mcp.json` | **usuniety** | nie wolno nam trzymac `.mcp.json` w repo (`.gitignore`), a serwera MCP i tak nie uzywamy |

Trzy zmiany merytoryczne, nie tylko techniczne:

1. **Analityk UX oglada zrzuty.** Oryginalny `ux-analyst` czytal HTML przez
   `WebFetch`. W tym repozytorium to jest udokumentowana slabosc: wiszace nogi
   krap i strzalka na karcie usugi przetrwaly kilka rund czytania kodu i padly
   w minute na zrzucie. Crawl robi wiec dwa zrzuty na strone i to od nich
   zaczyna sie ocena.
2. **Lista slow zabronionych w trzech jezykach.** Angielska lista przepuscilaby
   "Zamow" i "Kaufen". Dwie trzecie serwisu mowi po polsku i po niemiecku.
3. **Przekierowanie w odnosniku jest znaleziskiem.** Cztery kafelki strony
   glownej prowadzily do `/studio?tab=` bez ukosnika, wiec klient i Googlebot
   dostawali 301 z najwazniejszej strony serwisu. Oryginal sprawdzal tylko 4xx
   i 5xx.

## Zasieg sieciowy

Srodowisko zdalne siega tylko `localhost` i waskiej bialej listy, wiec domyslny
cel to zbudowany `dist/` podany przez wlasny serwer statyczny bez reguly
lapiacej wszystko (patrz `scripts/audit-pages.mjs`, dlaczego to wazne).
Produkcje `https://www.aejaca.com/` audytuje sie z maszyny lokalnej.

## Sprawdzone, ze dziala

Zapis pierwszego przebiegu na `dist/` z 2026-09-02 stoi w
`.claude/skills/aejaca-ux/SKILL.md`, sekcja "Pierwszy przebieg".
