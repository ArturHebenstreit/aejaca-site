---
status: draft
owner: Artur
date: 2026-08-27
deciders: Artur
supersedes: null
related:
  - src/routes.js
  - src/i18n/LanguageContext.jsx
  - src/i18n/nav.jsx
  - src/i18n/slowniki.js
  - src/components/JezykPodpowiedz.jsx
  - src/seo/SEOHead.jsx
  - scripts/prerender.mjs
  - scripts/build-sitemap.mjs
  - public/_redirects
---

# ADR-0023: Kazdy jezyk pod wlasnym adresem, polski bez prefiksu

## Kontekst

Serwis mowil trzema jezykami i wszystkie trzy dzielily jeden adres. Jezyk
wybieral sie w przegladarce, z `localStorage` i `navigator.languages`, a
wyszukiwarka dostawala pod kazdym adresem ten sam polski dokument.

Skutek byl taki, ze cala praca wlozona w tlumaczenia nie miala wejscia z
wyszukiwarki. Regulamin po niemiecku, polityka prywatnosci po niemiecku, strona
platnosci w trzech jezykach, sto stron tresci: nikt tego nie znajdzie, bo pod
zadnym adresem to nie stalo. Niemiec szukajacy "Schmuck 3D Druck" nie mial jak
trafic na aejaca.com.

Bylo to tym dotkliwsze, ze reszta serwisu jest pod ten rynek zbudowana: ceny w
euro, przelew SEPA, strefy wysylkowe do Niemiec, trzydniowa rezerwacja towaru
przy przelewie zagranicznym, niemiecki regulamin. Zbudowalismy droge do klienta,
ktorego nie bylo jak do niej doprowadzic.

Drugi, cichszy koszt: skoro jezyk byl znany dopiero po zamontowaniu aplikacji,
nie dalo sie zdecydowac, ktory slownik pobrac. Wszystkie trzy jechaly w pliku
wejsciowym, wiec Polak wozil ze soba caly niemiecki, a Niemiec caly polski.

## Decyzja

**Jezyk wynika ze sciezki.** Polski stoi pod golym adresem (`/studio/`),
angielski pod `/en/studio/`, niemiecki pod `/de/studio/`. Polskie adresy nie
zmieniaja sie ani o znak, wiec nic z obecnego pozycjonowania nie przepada.

Zmiany, ktore z tego wynikaja:

1. **Jedna lista tras** (`src/routes.js`) dla przegladarki, prerenderu i mapy
   witryny. Wczesniej byla przepisana osobno w `main.jsx` i `entry-server.jsx`,
   a prerender pilnowal ich zgodnosci osobnym sprawdzianem. Kopii nie ma.

2. **Router stoi nad dostawca jezyka**, w obu wejsciach tak samo. Jezyk jest
   znany przy pierwszym renderze, wiec Niemiec nie oglada juz mgnienia polskiego.

3. **Odnosniki dostaja prefiks same.** `Link`, `NavLink`, `Navigate` i
   `useNavigate` przychodza z `src/i18n/nav.jsx` i dokladaja prefiks biezacego
   jezyka. Adresow w serwisie jest kilkaset i pisze sie je bez namyslu, wiec
   prefiks nie moze byc czyms, o czym trzeba pamietac. Prerender sprawdza gotowy
   HTML wszystkich stron `/en/` i `/de/` i pada, jesli ktorykolwiek odnosnik
   wyprowadza z jezyka strony.

4. **Prerender rysuje 300 stron** zamiast 100 i ustawia `<html lang>` zgodnie
   z jezykiem strony.

5. **`hreflang` w kazdej stronie i w mapie witryny**, wzajemnie miedzy trzema
   wersjami, plus `x-default` na wersje polska. Kody bez regionu (`de`, nie
   `de-DE`), bo wersja niemiecka sluzy takze Austrii i Szwajcarii.

6. **Mapa witryny jest generowana** (`scripts/build-sitemap.mjs`) z tych samych
   zrodel co prerender. Przy trzystu adresach reka przestaje byc narzedziem.
   Daty ostatniej zmiany, priorytety i obrazy ze starej mapy sa przeniesione.

7. **Slownik jezyka pobiera sie jeden**, dynamicznym importem, i strona
   zapowiada go w naglowku. Plik wejsciowy schudl z 553 kB do 424 kB surowo
   i ze 184 kB do 138 kB po spakowaniu.

**Przelacznik jezyka to odnosniki, a nie przyciski.** Robot ma czym przejsc do
wersji obcojezycznej, a odwiedzajacy moze otworzyc ja w nowej karcie.

## Czego swiadomie NIE robimy

**Nie przekierowujemy pierwszej wizyty po `Accept-Language`.** Automatyczna
podmiana tresci pod jednym adresem jest dokladnie tym, przed czym ostrzega
Google, i to ona byla stanem wyjsciowym. Zamiast tego:

- odwiedzajacy, ktory JUZ WYBRAL jezyk, wchodzac na goly adres trafia tam,
  gdzie byl. To jego wlasna decyzja, wiec przenosimy bez pytania;
- odwiedzajacy pierwszy raz widzi PASEK z odnosnikiem do swojego jezyka, a
  tresc zostaje nietknieta. Klikniecie jest wyborem i zostaje zapamietane.
  Zamkniecie paska tez jest wyborem.

Robot nie ma pamieci przegladarki i nie klika, wiec pod polskim adresem widzi
polska tresc, zawsze.

## Konsekwencje

Otwiera sie rynek niemiecki i angielskojezyczny, pod ktory reszta serwisu juz
stoi. Przy okazji kazdy odwiedzajacy pobiera o dwa slowniki mniej.

Kosztem jest trzykrotnie wiekszy prerender (300 plikow zamiast 100, build dluzszy
o kilkanascie sekund) i jedna nowa zasada do pamietania: odnosniki wewnetrzne
pisze sie przez `Link` z `src/i18n/nav.jsx`, nigdy przez `<a href="/...">`.
Pilnuje tego bramka w prerenderze, wiec zasada nie zalezy od pamieci.

Adresy sklepu i narzedzi w `llms.txt` oraz w kontekscie asystenta zostaja
polskie, bo one opisuja serwis, a nie prowadza po nim klienta. Asystent dostal
osobna regule: podaje adres w jezyku rozmowy.
