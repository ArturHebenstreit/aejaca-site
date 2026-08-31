#!/usr/bin/env node
// ============================================================
// POLSKI TEKST DO KLIENTA NIE ZGADUJE PLCI
// ============================================================
// Klientka Anna dostala maila ze zdaniem "wycena, ktora zapisales" i to nie
// byla literowka, tylko wzorzec: "odebrales przesylke" w pouczeniu
// o odstapieniu, "potwierdziles polecenie wykonania wydruku" przy uwagach do
// modelu, "zgubiles link" na stronie procesu, "jak wybrales przy zamowieniu"
// w FAQ. Dwadziescia dwa miejsca naraz (poprawione 2026-08-30, polecenie
// wlasciciela). Bizuteria nie jest branza, w ktorej mozna zalozyc, ze po
// drugiej stronie stoi mezczyzna.
//
// Lekarstwem NIE jest "zapisales/zapisalas": tak pisze urzad, nie pracownia.
// Zdanie przestawia sie tak, zeby czasownik w ogole nie mial rodzaju:
//
//   "wycena, ktora zapisales"        -> "wycena zapisana na aejaca.com"
//   "od dnia, w ktorym odebrales"    -> "od dnia odebrania przesylki"
//   "jak wybrales przy zamowieniu"   -> "zgodnie z wyborem przy zamowieniu"
//   "Zgubiles link?"                 -> "Nie ma linku?"
//   "Wybrales grawer, wiec..."       -> "Grawer jest wybrany, wiec..."
//
// Bramka patrzy TYLKO na tresc napisow. Komentarze wycinamy, bo pisze je
// programista do programisty i zaden klient ich nie zobaczy. Angielski
// i niemiecki tego problemu nie maja, wiec wzorce sa wylacznie polskie.

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const KATALOGI = ["src/**/*.js", "src/**/*.jsx", "chat-api/**/*.js", "admin/views/**/*.ejs"];

// Formy meskie, ktore trafiaja do czytajacego. Zenskie "-łaś" celowo NIE jest
// tu wzorcem: zderza sie ze slowem "właściwie", a sam zapis w rodzaju zenskim
// jest w tym serwisie i tak nieuzywany.
// Granicy slowa NIE wyznacza `\b`: w JavaScripcie liczy ono tylko znaki ASCII,
// wiec po "ś" w "zapisałeś" zadnej granicy nie ma i caly wzorzec milczy. Stad
// dopatrzenia na sasiada, ktory nie jest litera.
const NIE_LITERA = "(?<!\\p{L})";
const KONIEC = "(?!\\p{L})";
const slowo = (tresc, flagi = "giu") => new RegExp(`${NIE_LITERA}(?:${tresc})${KONIEC}`, flagi);

const WZORCE = [
  { re: new RegExp(`\\p{L}*(?:łeś|leś)${KONIEC}`, "gu"), rada: "przestaw zdanie na bezrodzajowe, np. \"zapisana\", \"od dnia odebrania\", \"zgodnie z wyborem\"" },
  { re: slowo("powinieneś"), rada: "napisz \"warto\" albo \"trzeba\"" },
  { re: slowo("(?:mógł|chciał|musiał|zrobił|wolał)byś"), rada: "napisz bezosobowo, np. \"da się\", \"można\"" },
  { re: slowo("pewien|zadowolony|gotów|ciekaw"), rada: "napisz bez przymiotnika w rodzaju męskim, np. \"nie wiem\", \"jak nam poszło\"" },
  { re: slowo("wpiszesz też sam"), rada: "napisz \"wpiszesz też ręcznie\"" },
];

/**
 * Kod bez komentarzy. Komentarz liniowy usuwamy tylko wtedy, gdy stoi na
 * poczatku wiersza: `//` w srodku wiersza bywa czescia adresu w napisie,
 * a wyciecie reszty wiersza schowaloby przed bramka prawdziwy tekst.
 */
function bezKomentarzy(kod) {
  return kod
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/<%#[\s\S]*?%>/g, " ")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}

const pliki = KATALOGI.flatMap((wzor) => globSync(wzor, { exclude: (p) => p.includes("node_modules") || p.includes("/dist/") }));

let znalezione = 0;
for (const plik of pliki) {
  const tekst = bezKomentarzy(readFileSync(plik, "utf8"));
  const wiersze = tekst.split("\n");
  wiersze.forEach((wiersz, i) => {
    for (const { re, rada } of WZORCE) {
      re.lastIndex = 0;
      const trafienie = wiersz.match(re);
      if (!trafienie) continue;
      znalezione++;
      console.error(`  ${plik}:${i + 1}  "${trafienie[0]}"  ${rada}`);
      console.error(`      ${wiersz.trim().slice(0, 140)}`);
    }
  });
}

if (znalezione) {
  console.error(`\nTekst do klienta zgaduje płeć w ${znalezione} miejscach. Zdanie ma działać dla każdego, kto je czyta.`);
  process.exit(1);
}
console.log(`Rodzaj męski w tekście do klienta: sprawdzono ${pliki.length} plików, zero wystąpień`);
