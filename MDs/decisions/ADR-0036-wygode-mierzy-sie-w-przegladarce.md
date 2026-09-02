---
status: draft
owner: Artur
date: 2026-09-02
deciders: Artur
supersedes: null
related:
  - .claude/skills/aejaca-ux/SKILL.md
  - .claude/skills/aejaca-ux/uklad-tresci.md
  - .claude/skills/aejaca-ux/wygoda.md
  - .claude/skills/site-audit/ORIGIN.md
  - scripts/audit-pages.mjs
  - scripts/check-menu-jezyka.mjs
---

# ADR-0036: Wygode mierzy sie w przegladarce, a ocenia z zapisanych regul

## Kontekst

Wyglad serwisu jest ustalony i pilnowany (`aejaca-design`, `frontend-design`).
Wygoda nie byla: zadna instrukcja w repozytorium nie mowila, w jakiej
kolejnosci maja stac sekcje, ile klikniec dzieli wejscie od ceny, ktore
kryteria WCAG tu gryza, ani jak wyglada dobry formularz kasy. Z bramek
w buildzie wygody dotykaly dwie: pismo od 12 px i nazwy dostepne ze slownika.

Do tego usterki wygody nie wychodza z kodu. Strzalka na karcie uslugi
uciekala w lewo przy poprawnym kodzie; nogi krap wisialy w powietrzu przez
cztery rundy czytania; przelacznik jezyka stal zepsuty dwa dni przy zielonym
buildzie i zielonym przegladzie, bo pojawia sie dopiero po kliknieciu; cztery
kafelki strony glownej wreczaly przekierowanie, ktorego nie widac. Kazda z tych
rzeczy padla w minute po OBEJRZENIU strony albo po KLIKNIECIU w niej.

Wlasciciel zlecil 2026-09-02: znalezc najlepsze skille UI/UX, ktore zrobia
serwis atrakcyjniejszym i wygodniejszym, i poukladaja tresc logicznie,
z najlepszymi praktykami ze swiata.

## Decyzja

**Wygoda ma dwie nogi i obie sa w repozytorium.**

1. **Pomiar w prawdziwej przegladarce**: `npm run ux:pomiar` (skill
   `aejaca-ux`, katalog `pomiar/`). Crawl ze zrzutem kazdej strony w 390 px
   na cala wysokosc i w 1280 px, axe-core w obu motywach i obu szerokosciach,
   wzorce bledow z zewnetrznego `site-audit` plus dwa nasze: przekierowanie
   w odnosniku i martwe klikniecie. Wynik w `audyt-ux/`, poza repozytorium.
   Agent oceniajacy OGLADA zrzuty, zanim przeczyta HTML.
2. **Ocena z zapisanych regul**: `uklad-tresci.md` (trzej odwiedzajacy, role
   stron, kolejnosc teza-oferta-dowod-zastrzezenia-narzedzia, droga do wyceny,
   odnosniki kontekstowe kontra stopka, strony osierocone) i `wygoda.md`
   (heurystyki, WCAG 2.2, formularze i kasa, telefon, ruch, pisanie,
   zaufanie, rejestr wpadek). Praktyki ze swiata sa tam przelozone na ten
   serwis, nie cytowane.

Skill zewnetrzny `site-audit` (dan323, MIT) wnosi listy kontrolne i ksztalt
raportu; jego agenty klikajace przez Playwright MCP zastapily deterministyczne
skrypty na Chromium z `node_modules`, bo srodowisko zdalne nie pobiera
przegladarek. Wszystkie zmiany wobec oryginalu sa w jego `ORIGIN.md`.

Pomiar NIE stoi w `npm run build`: build leci bez przegladarki, a pomiar jest
miernikiem. Klasa bledu, ktora wraca drugi raz, dostaje wlasna bramke
w `scripts/`, jak dotad.

## Alternatywy

- **Wlaczyc kontowa wtyczke `design` (accessibility-review, design-critique,
  ux-copy) i nic nie pisac**: odrzucone. Mieszka na koncie, nie w repozytorium,
  wiec nie jedzie z klonem ani do drugiego modelu; nie zna aejaca.com, wiec
  powtarzalaby to, co mowi `aejaca-design`, i zgadywala kolejnosc sekcji.
- **Trzeci skill od wygladu** (canvas-design, theme-factory): odrzucone.
  Marka jest ustalona na stu stronach; trzeci glos w tej sprawie to ryzyko
  rozjazdu bez zysku.
- **Tylko wlasny skill, bez pomiaru**: odrzucone. Ocena z czytania kodu to
  dokladnie metoda, ktora przeoczyla strzalke i nogi krap.
- **Oryginalny `site-audit` bez zmian**: odrzucone, bo nie rusza: wymaga
  serwera Playwright MCP, agentow wtyczki i sciezek `plugins/site-audit/`.
- **Wpiac pomiar do builda**: odrzucone. Cloudflare Pages nie ma przegladarki,
  a `--wszystko` trwa kilkanascie minut.

## Konsekwencje

- Kazdy przeglad wygody zaczyna sie od zrzutow, nie od kodu, i konczy
  ponownym pomiarem: klasa znika z `by_rule` / `by_type`, albo nie jest
  zamknieta.
- Kolejnosc sekcji na stronach dzialow przestaje byc przypadkiem: stan
  zastany (`/studio/` ma uslugi po FAQ i po portfolio, `/jewelry/` po about)
  jest nazwany i czeka na decyzje wlasciciela formularzem.
- Koszt: `axe-core` jako zaleznosc deweloperska; katalog `audyt-ux/`
  w `.gitignore`; cztery skrypty do utrzymania. Lista slow, ktorych pomiar nie
  klika, jest w trzech jezykach i trzeba ja rozszerzac, gdy pojawi sie nowy
  przycisk sprzedazowy.
- Produkcje audytuje sie tylko z maszyny lokalnej; srodowisko zdalne siega
  wylacznie `localhost`.

## Niezmienniki i testy

- `npm run ux:pomiar` na gotowym `dist/` konczy sie trzema plikami JSON
  i katalogiem zrzutow w `audyt-ux/`, z zerem obcych hostow w `failed_requests`
  i w `console_errors`. Pierwszy przebieg: 25 stron, 9 pl / 8 en / 8 de,
  6 minut.
- Jezyk przegladarki w kazdym kontekscie idzie za jezykiem adresu; zrzut
  strony `/de/` nie ma polskiego paska podpowiedzi.
- `dostepnosc.json` ma `runs = strony x 2 motywy x 2 ekrany`; kontrast rozni
  sie miedzy motywami (99 wpisow tylko w jasnym, 88 w obu).
- Kontrola negatywna `bledy.mjs`: odnosnik do adresu, ktorego nie ma w `dist/`,
  wychodzi jako `redirect-link` (na serwerze lokalnym 404; na produkcji 301
  przez `public/_redirects`).
- `scripts/check-emdash.mjs` obejmuje oba skille poza `references/`
  i `agents/` skilla obcego; jego `ORIGIN.md` jest objety.

## Synchronizacja

- `.claude/skills/aejaca-ux/`: skill, dwie instrukcje, cztery skrypty pomiaru.
- `.claude/skills/site-audit/`: skill obcy z `ORIGIN.md`, `LICENSE`,
  listami kontrolnymi i kontraktami agentow.
- `scripts/check-emdash.mjs`: `site-audit` w `SKILLE_ZEWNETRZNE`.
- `package.json`: `ux:pomiar`, `ux:mapa`, `ux:dostepnosc`, `ux:bledy`; `axe-core`.
- `.gitignore`: `audyt-ux/`.
- `CLAUDE.md`: lista skilli projektu.
