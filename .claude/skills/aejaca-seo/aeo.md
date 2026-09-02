# Wyszukiwarki odpowiedzi

Klasyczne SEO walczy o miejsce na liscie odnosnikow. AEO walczy o to, zeby
model odpowiadajacy na pytanie zacytowal nas i podal nasza nazwe. To dwie rozne
gry i tylko czesc pracy jest wspolna.

Roznica praktyczna: w wynikach klasycznych wygrywa strona, ktora najlepiej
odpowiada na ZAPYTANIE. W odpowiedzi generowanej wygrywa fragment, ktory da sie
przepisac bez zmian i bez ryzyka. Model nie cytuje tego, czego nie umie
sprawdzic, i nie cytuje zdan, ktore trzeba rozwinac, zeby mialy sens.

## `public/llms.txt`

To jedyny dokument, ktory model czyta zamiast przechodzic caly serwis. Ma 292
wiersze i opisuje firme, obie marki, uslugi, ceny wejsciowe i adresy.

Trzy zasady:

- **Adres wymieniony w `llms.txt` musi istniec.** Martwy adres nie psuje niczego
  na stronie, nie zglasza sie nigdzie, a model cytuje go dalej. Sprawdza to
  `audyt.mjs`.
- **Liczba wpisana proza zyje wlasnym zyciem.** Prog darmowej wysylki, cena
  wejsciowa uslugi, liczba opinii, termin realizacji: kazda z nich ma zrodlo
  w kodzie. Przepisana do `llms.txt` przestaje byc prawda przy pierwszej
  zmianie cennika, a model powtarza ja jako fakt o firmie.
- **`llms.txt` jest w liscie synchronizacji.** Zmiana tresci na stronie
  propaguje sie tam razem z `robots.txt`, `sitemap.xml`, `chat-api/context.js`,
  `src/seo/` i `MDs/AEJaCA_Brand_Reference.md`. Szczegoly w `PROJECT_RULES.md`.

## Co sprawia, ze fragment daje sie zacytowac

- **Odpowiedz stoi przed uzasadnieniem.** Akapit zaczynajacy sie od "to zalezy"
  nie zostanie zacytowany, bo nie da sie go skrocic.
- **Jedno zdanie zawiera komplet.** "Wysylka jest darmowa od 400 zl" nadaje sie
  do cytatu. "Powyzej tego progu nie doliczamy kosztow" nie, bo prog stoi
  w innym zdaniu i model musi je skleic.
- **Liczba ma jednostke i zakres wazenia.** "Realizacja 10 do 14 dni roboczych
  od zaksiegowania wplaty" jest sprawdzalne. "Szybko" nie jest.
- **Nazwa firmy pada w tresci, nie tylko w naglowku strony.** Model cytujacy
  fragment bez nazwy cytuje anonim.
- **Pytanie brzmi tak, jak zadaje je czlowiek.** "Ile kosztuje pierscionek
  zareczynowy na zamowienie" wygrywa z "Cennik".

Nasze dwa najsilniejsze zasoby w tej grze to `/faq/` i `/glossary/`: jedno
i drugie jest z natury zbiorem krotkich, samodzielnych odpowiedzi. Kazde nowe
haslo slownika to nowa szansa na cytat, i to szansa tania, bo hasla sa krotkie.

## Szukanie luk tematycznych

Nie zgaduj. Kolejnosc pracy:

1. **Co juz mamy.** `src/blog/postsMeta.js`, `src/data/glossary.js`,
   `src/data/faq/`. Policz, o czym piszemy, i w ktorym jezyku.
2. **O co pytaja naprawde.** Panel administracyjny trzyma watki poczty
   i rozmowy z czatem. To sa prawdziwe pytania prawdziwych klientow, wpisane
   ich slowami, i sa warte wiecej niz jakiekolwiek narzedzie do slow kluczowych.
   Pytanie, ktore padlo trzy razy w skrzynce, a nie ma odpowiedzi na stronie,
   jest luka udowodniona.
3. **Czego jeszcze nie ma po niemiecku i po angielsku.** Wpis istniejacy tylko
   po polsku to strona, ktora dla dwoch trzecich serwisu jest pusta.
4. **Dopiero potem tematy z zewnatrz.** Wymagaja sieci, wiec maszyny lokalnej.

Luke zamyka sie trescia, ktora ktos naprawde chce przeczytac, a nie stroną pod
fraze. Strona napisana pod fraze i tak zostanie oceniona po tym, czy ktos na
niej zostal.

## Czego tu nie robimy

- **Nie piszemy tresci dla robota.** Model odpowiedzi rozpoznaje wypelniacz
  rownie dobrze jak czlowiek, a wypelniacz obniza ocene calej strony.
- **Nie powtarzamy tej samej odpowiedzi na pieciu stronach.** Odpowiedz ma
  jedno miejsce i prowadza do niej odnosniki. Pieciokrotne powtorzenie sprawia,
  ze wyszukiwarka sama wybiera, ktora strone pokazac, i zwykle wybiera nie te.
- **Nie mierzymy AEO liczbami, ktorych nie mamy.** Nie ma dzis narzedzia, ktore
  wiarygodnie mowi, ile razy nas zacytowano. Sygnal, ktory mamy, to ruch
  z odsylajacych modeli w analityce panelu, i to jego czytamy zamiast zmyslac
  wskazniki.
