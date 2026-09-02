# Dane strukturalne kontra to, co naprawde jest na stronie

Wszystkie schematy powstaja w `src/seo/schemas.js` i wchodza na strone przez
`schemas={[...]}` w `SEOHead`, ktory wstrzykuje je Helmetem jako
`application/ld+json`. Nie piszemy JSON-LD wprost w stronie.

## Co jest w warsztacie

| Budowniczy | Do czego | Uwaga |
|---|---|---|
| `buildOrganizationSchema` | Firma jako byt | Jeden adres dla trzech jezykow, i tak ma byc |
| `buildLocalBusinessSchema` | Punkt w Jozefoslawiu | To samo, adres bez prefiksu |
| `buildWebPageSchema` | Kazda strona tresciowa | `url` MUSI byc adresem tej wersji jezykowej |
| `buildBreadcrumbSchema` | Sciezka okruszkow | `position` liczone od 1, bez dziur |
| `buildServiceSchema` | Usluga | `url` z prefiksem jezyka |
| `buildArticleSchema` | Wpis blogowy | `mainEntityOfPage` z prefiksem jezyka |
| `buildProductSchema` | Karta produktu | `offers` z cena, waluta i dostepnoscia |
| `buildHowToSchema` | Instrukcja krok po kroku | Kroki musza byc na stronie |
| `buildFAQSchema` | Pytania i odpowiedzi | Pytania musza byc na stronie |
| `buildItemListSchema` | Listing sklepu, bloga, slownika | Pozycje musza byc na stronie |
| `buildShippingDetails`, `buildReturnPolicy` | Polityki do `offers` | Wymagane przez Merchant Listings |
| `buildReviewsAugmentedOrganization` | Firma z ocenami | Tylko z prawdziwymi opiniami |

## Zasada, ktora rzadzi cala ta warstwa

**Schemat opisuje to, co widzi czlowiek na tej stronie, w tym jezyku.**
Nie to, co bylo wczoraj, nie to, co jest na innej stronie, nie to, co
chcielibysmy pokazac w wyniku wyszukiwania.

Google nazywa naruszenie tej zasady spamem, a nie bledem technicznym, i kara
idzie na cala domene, nie na jedna strone. Najczestsza droga do tego stanu nie
jest zla wola, tylko usuniecie sekcji ze strony bez usuniecia schematu, ktory
ja opisywal. Sekcja znika, schemat zostaje, i nikt tego nie widzi, bo JSON-LD
nie ma reprezentacji wizualnej.

Dlatego `audyt.mjs` porownuje pytania z `FAQPage` z tekstem strony, a nie tylko
sprawdza, czy JSON sie parsuje.

## Trzy pomylki, ktore juz sie zdarzyly albo sa o krok

1. **Adres w schemacie bez prefiksu jezyka.** Zdarzylo sie na 252 stronach.
   Naprawione pomocnikami `adresStrony` i `adresZasobu`, zamkniete bramka
   `scripts/check-adresy-seo.mjs`. Opisane w `hreflang.md`, sekcja o `SITE.url`.
2. **`Organization` powielony na kazdej stronie z innym `@id`.** Firma jest
   jedna. Jesli `@id` sie rozjedzie, wyszukiwarka zobaczy kilkaset firm o tej
   samej nazwie. `Organization` i `LocalBusiness` sa jedynymi schematami,
   ktorych adres NIE dostaje prefiksu jezyka, i audyt je z tego sprawdzenia
   wylacza.
3. **Adres z krzyzykiem, ktory nie trafia w zadne miejsce.** `ItemList` na
   `/studio/` i `/jewelry/` wymienial jedenascie pozycji wskazujacych na
   `#3dprint`, `#co2laser`, `#rings` i osiem innych sekcji, ktorych te strony
   nigdy nie mialy. Przegladarka zostaje wtedy na gorze strony, wiec nikt tego
   nie zobaczyl, a dla wyszukiwarki jedenascie osobnych pozycji listy bylo
   jednym i tym samym adresem. Uwaga: `@id` z krzyzykiem
   (`.../#organization`) to co innego, bo nazywa BYT, a nie miejsce na stronie,
   i audyt go z tego sprawdzenia wylacza. Naprawione tak, ze lista idzie
   z katalogu uslug i wskazuje na te same strony, ktore strona pokazuje
   odnosnikiem (`src/components/OdnosnikiUslug.jsx`).

4. **Ocena FIRMY doklejona do wyrobu.** `/studio/` i `/jewelry/` nosily po trzy
   schematy `Product` z wymyslonymi numerami katalogowymi (`AEJACA-RING-925`
   i piec podobnych, zadnego z nich nie ma w katalogu), ze sztywnymi cenami
   w euro, ktorych nie liczy zaden silnik, i z ocena oraz liczba opinii wzieta
   z profilu firmy w Google. Do tego wszystkie trzy na jednej stronie
   wskazywaly `url` tej samej strony kategorii, wiec byly trzema opisami jednej
   rzeczy udajacymi trzy rzeczy.

   `aggregateRating` opisuje BYT, ktory ocenie podlega. Ocena firmy nalezy do
   `Organization` i tam stoi, na stronie glownej. Doklejona do wyrobu mowi, ze
   ten wyrob ma tyle opinii, a on nie ma zadnej.

   Usuniete w calosci, bo nie bylo czego naprawiac: nie ma takiego wyrobu, nie
   ma takiej ceny i nie ma takich opinii. Prawdziwe dane strukturalne wyrobu
   stoja tam, gdzie wyrob mozna kupic: na `/shop/<slug>/` i na stronie uslugi,
   gdzie cena idzie z `priceFromGrosze`, w zlotowkach.

   Audyt lapie teraz najostrzejszy objaw: dwa schematy tego samego typu pod
   jednym adresem na jednej stronie.

## Zanim dolozysz nowy schemat

Zadaj trzy pytania w tej kolejnosci:

1. **Czy ta tresc naprawde jest na stronie**, w kazdym z trzech jezykow?
   Jesli tylko po polsku, to schemat wchodzi tylko na polska wersje.
2. **Czy Google robi z tego typu cokolwiek?** Wiekszosc typow schema.org nie
   ma zadnego wyniku rozszerzonego. Schemat bez efektu to koszt utrzymania bez
   przychodu i kolejne miejsce, ktore moze sie rozjechac z trescia.
3. **Co go zepsuje za pol roku?** Jesli odpowiedz brzmi "usuniecie sekcji ze
   strony", to potrzebny jest sprawdzian w `audyt.mjs`, a nie tylko schemat.

## Sprawdzanie na zywo

Audyt lapie zgodnosc ze strona i poprawnosc pol, ale nie zastapi walidatora
Google. Po wiekszej zmianie warto przepuscic kilka adresow przez Rich Results
Test i Schema Markup Validator. To wymaga sieci, wiec robi sie to na maszynie
lokalnej, nie w srodowisku zdalnym.
