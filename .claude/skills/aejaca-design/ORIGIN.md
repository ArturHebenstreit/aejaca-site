# aejaca-design: skad to jest

| | |
|---|---|
| Zrodlo | **Praca wlasna projektu**, nie kopia cudzego repozytorium |
| Autor | AEJaCA (Artur), material powstal w sesji Claude |
| Licencja | wlasnosc projektu, brak licencji zewnetrznej |
| Dodano do repo | 2026-08-18, merge `ab3fd77` (PR #249) |
| Uporzadkowano | 2026-08-25 |
| Pliki | 50 plikow, okolo 2,9 MB, w tym `assets/` z grafika marki |

## Co robi

Brief wizualny marki dla agenta: glos obu marek, palety, typografia, ikonografia,
wzorce komponentow, gotowe assety oraz klikalny kit v2. Sluzy do robienia makiet
i artefaktow, a w kodzie produkcyjnym do trzymania tonu i intencji palety.

## Dlaczego ten skill wygladal inaczej do 2026-08-25

Do tego dnia lezal w `.claude/agents/`, w **dwoch kopiach**: `AEJaCA Design System`
i `AEJaCA Design System (1)`. Obie deklarowaly `name: aejaca-design`, wiec nazwa
byla zarejestrowana dwukrotnie i o tym, ktora definicje marki dostanie agent,
decydowal przypadek. Kopie opisywaly **sprzeczne systemy**:

| | Kopia bez sufiksu | Kopia `(1)` |
|---|---|---|
| Tlo | `#0a0a0a` wszedzie, "No light mode" | dwa jasne motywy, kremowy i chlodna biel |
| Tryb ciemny | jedyny istniejacy | alternatywa przez `data-theme="dark"` |

Zachowana zostala kopia `(1)`, bo trafia w obecny kierunek marki. Druga usunieta.

## Co zweryfikowano wobec kodu

Sprawdzenie z 2026-08-25, zrodlem prawdy jest kod (`PROJECT_RULES.md` sekcja 1):

| Twierdzenie skilla | Stan w `src/` |
|---|---|
| tryb jasny jest domyslny | zgodne, `src/i18n/ThemeContext.jsx` zwraca `"light"` bez zapisanej preferencji |
| tryb ciemny jako alternatywa | zgodne co do roli, ale w CSS to `:root` jest ciemny, a jasny to 270 nadpisan `[data-theme="light"]` w `src/index.css` |
| kremowe tlo biżuterii | zgodne co do intencji, `--bg-page: #F8F4ED` w kicie wobec `--ds-bg: #faf7f2` na produkcji |
| klasy `.brand-jewelry`, `.brand-studio` | **nie istnieja w `src/` ani razu** |
| tokeny `--bg-page`, `--fg-1`, `--accent` | **nie istnieja w `src/` ani razu** |

Chronologia tlumaczy rozjazd. Skill i `ThemeContext.jsx` przyszly tym samym mergem
`ab3fd77` (2026-08-18), a nadpisania trybu jasnego i straznik `check-light-theme.mjs`
dzien pozniej, w `f008008` (2026-08-19). Kierunek "jasny premium" zostal przyjety
i wdrozony, ale na istniejacych tokenach `--ds-*`, a nie na nazwach z kitu v2.

## Co zmieniono 2026-08-25

1. Przeniesiono z `.claude/agents/` do `.claude/skills/aejaca-design/`, usunieto
   druga kopie i kolizje nazw.
2. Przepisano sekcje szybkiej referencji w `SKILL.md`: rozdzielono cel produkcyjny
   (tokeny `--ds-*`, `[data-theme="light"]`, straznik czytelnosci) od makiet (kit v2).
3. Oznaczono `ui_kits/website/`, `colors_and_type.css` i `ui_kits/website/tokens.css`
   naglowkiem "v2 proposal, not the shipped architecture". Bez tego kit wyglada jak
   gotowy kod produkcyjny, a skopiowany do `src/` renderuje sie bez stylow.
4. Usunieto `uploads/` (dwa wklejone zrzuty ekranu, 324 kB, bez odwolan w tresci).
5. Zachowano `explorations/light-jewelry/` (84 kB) jako material historyczny.
   To piec wariantow palety, z ktorych wybrano kierunek jasny.

## Uwaga o strazniku pisowni

`scripts/check-emdash.mjs` wylaczal caly katalog `.claude/skills/`, bo zakladal,
ze sa tam wylacznie kopie 1:1 cudzych repozytoriow. Ten skill jest praca wlasna,
wiec wyjatek zostal zawezony do listy skilli zewnetrznych i pliki `aejaca-design`
podlegaja zasadzie pisowni normalnie.
