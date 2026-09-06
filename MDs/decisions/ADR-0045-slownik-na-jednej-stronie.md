---
status: draft
owner: Artur
date: 2026-09-06
deciders: Artur
supersedes: null
related:
  - src/pages/Glossary.jsx
  - src/data/glossary.js
  - src/hooks/useScrollToTop.js
  - public/_redirects
  - public/llms.txt
  - scripts/build-sitemap.mjs
  - scripts/prerender.mjs
---

# ADR-0045: Słownik stoi na jednej stronie, hasło ma kotwicę

## Problem

Search Console pokazał 6 września 2026: 243 strony zindeksowane, 99 nie, w tym
49 „wykryta, obecnie niezindeksowana", 8 „zeskanowana, ale niezindeksowana"
i 5 „Google wybrał inną stronę kanoniczną niż użytkownik".

Audyt SEO na gotowym `dist` był czysty: kanoniczne, hreflang, mapa witryny
i dane strukturalne zgadzały się ze sobą. Nie było więc usterki technicznej do
naprawienia, a mimo to jedna trzecia serwisu nie wchodziła do indeksu.

Pomiar pokazał, gdzie to siedzi. Każde hasło słownika miało własny adres: 32
hasła razy trzy języki to 96 stron, czyli jedna trzecia mapy witryny. Policzone
na zbudowanych stronach, hasło niosło **średnio 4 procent słów własnych**,
a kilka haseł zero. Cała reszta, jakieś czterysta słów, to menu, stopka,
wezwanie do działania, odnośniki do narzędzi i lista powiązanych pojęć,
identyczne na trzydziestu innych stronach. `zloto-probowane` i `srebro-925`
miały identyczny zbiór słów. Dla porównania wpis blogowy ma 32 procent słów
własnych, a karta usługi 20.

To nie jest przypadek, tylko kształt: definicja mieści się w dwóch zdaniach,
a strona wokół niej waży czterysta słów szablonu. Google nazywa to „wykryta,
obecnie niezindeksowana", czyli zna adres, zajrzał, policzył, że nie wniesie
nic nowego, i nie wraca.

## Decyzja

Decyzja właściciela z 2026-09-06: **jedna strona zamiast trzydziestu dwóch.**

Wszystkie definicje stoją na stronie zbiorczej `/glossary/`, każda pod własną
kotwicą (`/glossary/#srebro-925`), razem z odnośnikami do narzędzi i do
powiązanego wpisu, czyli z tym, co dotąd stało tylko na stronie hasła. Ani jedno
zdanie nie zginęło.

96 dotychczasowych adresów przekierowuje na kotwicę, na stałe. Lista
w `public/_redirects` jest ZAMKNIĘTA: dotyczy adresów, które Google zna
z przeszłości. Nowe hasło nigdy własnego adresu nie miało, więc nie dopisuje się
tam nic.

Mapa witryny schudła z 300 do 204 adresów, prerender z 315 do 219 stron.

### Hasło, które zasłuży na własny tekst, zostaje wpisem na blogu

Nie wracamy do stron haseł. Jeżeli któreś pojęcie okaże się warte dwustu zdań,
jego miejscem jest blog, bo tam już mamy 32 procent treści własnej i format,
który to unosi.

## Skutek uboczny, który wyszedł przy okazji

Kotwica z adresu trafiała do `document.querySelector(hash)`. Ta funkcja RZUCA
WYJĄTKIEM przy napisie, który nie jest poprawnym selektorem, a kotwica przychodzi
z zewnątrz. Wystarczył ukośnik na końcu, `#srebro-925/`, czyli dokładnie to, co
zostawia przekierowanie przenoszące ogon starego adresu, i wyjątek leciał
w trakcie efektu: strona nie przewijała się do niczego. Hak
`useScrollToTop` bierze teraz `getElementById`, które żadnego napisu nie
interpretuje, i przycina to, co do identyfikatora nie należy.

Wada dotyczyła każdej kotwicy w serwisie, nie tylko słownika. Znalazł ją zrzut
ekranu, nie czytanie kodu: strona wyglądała na pustą, choć element był na swoim
miejscu.

## Czego pilnujemy

- `npm run seo:audyt` na gotowym `dist`: mapa witryny, `llms.txt` i strony mają
  mówić to samo. To on złapał, że `llms.txt` nadal wskazuje na wycofane adresy.
- Wejście z kotwicą sprawdzone w przeglądarce w trzech językach, z ogonem
  i bez niego.

## Czego to nie rozwiązuje

Zostają dwie strony z błędem 404 i jedna bez wskazania kanonicznego, obie do
sprawdzenia w Search Console, bo ich adresów nie widać z repozytorium. Karty
usług w sklepie mają 20 procent treści własnej, czyli pięć razy więcej niż miał
słownik, ale wciąż mniej niż blog; to osobna sprawa i osobna decyzja.
