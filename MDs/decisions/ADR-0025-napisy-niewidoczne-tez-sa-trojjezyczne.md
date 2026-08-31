---
status: accepted
owner: Artur
date: 2026-08-28
deciders: Artur
supersedes: null
related:
  - src/i18n/pl.js
  - src/i18n/en.js
  - src/i18n/de.js
  - src/components/Navbar.jsx
  - src/data/opisyObrazow.js
  - scripts/check-nazwy-dostepne.mjs
  - scripts/check-slownik-jako-funkcja.mjs
  - scripts/check-menu-jezyka.mjs
  - PROJECT_RULES.md
---

# ADR-0025: Napisy niewidoczne też są trójjęzyczne, a kod za kliknięciem ma własny sprawdzian

## Kontekst

27 sierpnia serwis dostał trzy adresy i trzy komplety treści. Dzień później
wyszło, że trójjęzyczność sięgała dokładnie tak daleko, jak wzrok.

Kliknięcie w przełącznik języka dawało białą stronę. Przyczyna: lista wyboru
języka wołała słownik jak funkcję, `t("nav.currency")`, a `useLanguage()` oddaje
obiekt. Wyjątek leciał w trakcie renderu, więc React 18 nie gasił jednego napisu,
tylko odmontowywał całe drzewo. Usterka weszła 26 sierpnia razem z wyborem waluty
i przeżyła dwa dni przy zielonym buildzie, zielonym prerenderze 300 stron i
przeglądzie w przeglądarce, w którym każda miara wyszła na zero.

Żadna z tych siatek nie zawiodła. Wszystkie mówiły prawdę o tym, co sprawdzały.
Lista wyboru języka **nie istnieje, dopóki się jej nie kliknie**, a nic w tym
repozytorium nigdy w nic nie kliknęło.

Przy okazji przeglądu wyszła druga, cichsza wersja tego samego: 22 nazwy dla
czytnika ekranu wpisane na sztywno, mieszanka angielskiego i polskiego, w tym
w pasku nawigacji, stopce, czacie i galerii. Niewidoczne na ekranie, więc nikt
ich nie zgłosił, a Niemiec słyszał "Change language" albo "Włącz tryb ciemny".

## Decyzja

1. **Każdy napis docierający do człowieka idzie ze słownika, także ten
   niewidoczny.** `aria-label` wpisany wprost albo sklejony z szablonu jest
   błędem budowania. Pilnuje `scripts/check-nazwy-dostepne.mjs`.

2. **Słownik z `useLanguage()` jest obiektem, nie funkcją.** Zapis funkcyjny
   pilnuje `scripts/check-slownik-jako-funkcja.mjs`. Bramka patrzy na to, co
   naprawdę wyszło z `useLanguage()` w danym pliku, razem ze zmianą nazwy, bo
   w projekcie żyje osobny i całkiem legalny pomocnik `t(pl, en, de)`.

3. **Kod ukazujący się dopiero po interakcji potrzebuje własnego sprawdzianu,
   który klika.** Wzór: `scripts/check-menu-jezyka.mjs`, uruchamiany przez
   `npm run check:jezyk`, w dwóch szerokościach ekranu. Poza `npm run build`,
   bo build leci na Cloudflare Pages, gdzie nie ma przeglądarki.

4. **Nazwa języka zostaje w swoim języku**: "Deutsch", nie "niemiecki", razem
   z `lang` i `hreflang` przy odnośniku.

5. **Lista wyboru języka to panel ujawniany, nie lista opcji.** Przycisk niesie
   `aria-expanded` i `aria-controls`, a nie `aria-haspopup="listbox"`, bo
   w środku są odnośniki i przyciski waluty, a nie opcje do wybierania
   strzałkami.

## Konsekwencje

Trzy bramki więcej: dwie w `npm run build` (tanie, czysto tekstowe) i jedna
uruchamiana ręcznie po budowaniu, bo potrzebuje przeglądarki.

Przycisk języka w wersji szerokiej pokazuje "PL" i dostał ukryty dopisek
zamiast `aria-label`. Nazwa dostępna musi zawierać widoczny napis (WCAG 2.5.3),
a `aria-label` by go nadpisał.

`alt` objęty tą samą zasadą (decyzja właściciela, 2026-08-28). Opisy stoją
w `src/data/opisyObrazow.js`, **raz na obraz, nie raz na stronę**, bo ten sam
obraz bywa użyty w kilku miejscach: `hero-toolstudio` na trzech stronach,
`hero-toolsjewelry` na trzech. Opis przypięty do strony rozjeżdża się przy
pierwszej edycji jednej z nich, a że tego napisu nie widać, nikt tego nie
zgłosi. Trzynaście opisów napisano od nowa po obejrzeniu każdego obrazu,
zamiast tłumaczyć poprzednie, bo kilka z nich powtarzało tytuł strony
z dopiskiem marki i nie mówiło nic o tym, co widać.

Pusty `alt` jest poprawną odpowiedzią dla ozdoby: znak marki na stronie
głównej stoi nad nagłówkiem, który mówi to samo słowami, więc czytnik ma go
pominąć zamiast powtarzać markę drugi raz.

Wyjątek na liście dozwolonych: `alt="AEJaCA"` przy logo. Kanon dla znaku
firmowego mówi, że `alt` to nazwa organizacji, a ta jest jedna we wszystkich
językach.

Przy okazji tego przeglądu wyszły dwa błędy w niemieckim w galerii `/about/`
("im AEJaCA-Werkstatt" zamiast "in der", oraz "Ankblock", słowo nieistniejące
w niemieckim) i jeden duplikat: `hero-home-studio.webp` i
`hero-print-settings.webp` to ten sam plik bajt w bajt, więc generujemy dla
niego dwa komplety wariantów. Duplikat zostaje do sprzątnięcia osobno.
