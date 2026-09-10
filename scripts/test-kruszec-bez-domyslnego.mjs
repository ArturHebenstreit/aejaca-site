#!/usr/bin/env node
// ============================================================
// KRUSZEC PRZY ODLEWIE NIE MA WYBORU WSTEPNEGO
// ============================================================
// Pytanie wlasciciela z 2026-09-10: czy przy zleceniu odlewu z wykonczeniem
// trzeba podac rodzaj zlota. Odpowiedz z kodu brzmiala "tak", bo `metalId`
// stoi na liscie `CASTING_REQUIRED` bez zadnego warunku. W praktyce brzmiala
// "nie", bo pole bylo wypelnione z gory srebrem 925 i nikt nigdy nie zostal
// zatrzymany: klient dostawal podstawiony najtanszy wariant.
//
// Roznica miedzy Ag 925 a Au 24k to kilkadziesiat razy w cenie kruszcu, wiec
// bylo to zgadywanie za klienta NAJDROZSZEJ decyzji calego zlecenia. Decyzja
// wlasciciela: kafelek startuje pusty.
//
// Sama zmiana domyslnych parametrow NIE WYSTARCZA i to jest sedno tego
// sprawdzianu. `poprawkiWyboru` z warstwy pol uslugi przystawia kazdy wybor
// spoza listy do `warianty[0]`, a pusty wybor tez jest "spoza listy": pole
// wroci na srebro przy pierwszym rysowaniu ekranu i wyglada to na dzialajace.
// Dlatego pilnujemy REGULY, a nie samej tablicy `defaults`.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getService } from "../src/data/orderCatalog.js";
import { describeMissingCastingParams, missingCastingParams } from "../src/pricing/preciousMetalCasting.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let bledy = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const sprawdz = (w, gdyZle, gdyDobrze) => (w ? ok(gdyDobrze) : zle(gdyZle));

const ODLEW = getService("precious_metal_casting");

console.log("\n1. Kruszec nie jest wybrany za klienta\n");
{
  sprawdz(ODLEW.defaults.metalId === undefined,
    `domyslne parametry odlewu nadal podstawiaja kruszec: ${ODLEW.defaults.metalId}`,
    "domyslne parametry odlewu nie niosa kruszcu");

  const pole = ODLEW.fields.find((f) => f.key === "metalId");
  sprawdz(pole?.bezWyboru === true,
    "pole kruszcu nie jest oznaczone jako bez wyboru wstepnego, wiec warstwa pol i tak je wypelni",
    "pole kruszcu jest oznaczone jako bez wyboru wstepnego");
}

console.log("\n2. Warstwa pol NIE dorabia wyboru, ktorego nikt nie zrobil\n");
{
  // Node nie laduje `.jsx`, wiec te polowe reguly sprawdzamy w tresci pliku,
  // tak jak reszta sprawdzianow dotykajacych komponentow (`test-quantity`).
  // Zachowanie potwierdzone osobno w przegladarce, na `/shop/service/
  // precious_metal_casting/`: zaden kafelek kruszcu nie jest podswietlony.
  const POLA = readFileSync(join(ROOT, "src/components/shop/PolaUslugi.jsx"), "utf8");
  sprawdz(/const pusty = params\[f\.key\] == null \|\| params\[f\.key\] === "";/.test(POLA)
    && /if \(pusty && f\.bezWyboru\) continue;/.test(POLA),
    "warstwa pol nie ma wyjatku na puste pole, wiec podstawi srebro przy pierwszym rysowaniu ekranu",
    "warstwa pol zostawia puste pole puste, gdy jest tak oznaczone");

  // To jest DRUGA POLOWA reguly i musi zostac. Gdyby `bezWyboru` wylaczalo
  // prostowanie calkiem, kosz zapisany przed zmiana cennika niosl by kruszec,
  // ktorego juz nie oferujemy, a wycena oddawalaby `null` bez wyjasnienia.
  // Wyjatek stoi wiec PO sprawdzeniu listy, a nie przed nim.
  const iPusty = POLA.indexOf("if (pusty && f.bezWyboru) continue;");
  const iLista = POLA.indexOf("if (warianty.some((o) => o.id === params[f.key])) continue;");
  const iZamiennik = POLA.indexOf("const zastepczy = f.zamiennik?.(params[f.key]);");
  sprawdz(iLista !== -1 && iPusty > iLista && iZamiennik > iPusty,
    "wyjatek na puste pole stoi w zlym miejscu: albo omija sprawdzenie listy, albo blokuje prostowanie",
    "wybor nieaktualny dalej jest prostowany, pusty zostaje pusty");
}

console.log("\n2b. Kruszec wycofany z oferty CZYSCI pole, a nie podstawia srebra\n");
{
  // Zloto 999 zniknelo z oferty 2026-09-10. Koszyk zapisany wczesniej niesie
  // `gold_24k`. Podstawienie pierwszej pozycji z listy zamienialoby zapisane
  // zloto na srebro, po cichu i przy zupelnie innej cenie; klient zobaczylby
  // gotowa kwote i nie mial powodu jej kwestionowac.
  const POLA = readFileSync(join(ROOT, "src/components/shop/PolaUslugi.jsx"), "utf8");
  sprawdz(/zmiany\[f\.key\] = f\.bezWyboru \? undefined : warianty\[0\]\.id;/.test(POLA),
    "wycofana wartosc w polu bez wyboru wstepnego dalej jest zastepowana pierwsza z listy",
    "wycofana wartosc czysci pole, wiec klient wybiera kruszec jeszcze raz");

  const { CASTING_METALS } = ODLEW.fields.find((f) => f.key === "metalId").options.length
    ? { CASTING_METALS: ODLEW.fields.find((f) => f.key === "metalId").options } : {};
  sprawdz(!CASTING_METALS.some((m) => m.id === "gold_24k"),
    "zloto 999 nadal stoi na liscie kruszcow do odlewu",
    "zlota 999 nie ma juz na liscie: nie odlewamy czystego zlota");
  sprawdz(CASTING_METALS.length === 5,
    `lista kruszcow ma ${CASTING_METALS.length} pozycji, a ma miec 5 (Ag 925, Ag 800, Au 9k, 14k, 18k)`,
    "lista kruszcow ma piec prob, ktore naprawde odlewamy");
}

console.log("\n3. Kruszec zostaje obowiazkowy na kazdej sciezce\n");
{
  // Wykonczenie nie zwalnia z podania proby, i powierzony kruszec tez nie.
  // Przy powierzonym wycena idzie do czlowieka, ale proba rzadzi krzywa
  // wypalania i skurczem, wiec pracownia musi ja znac przed zalaniem kolby.
  for (const zrodlo of ["aejaca", "powierzony"]) {
    for (const finish of ["clean", "polished"]) {
      const braki = missingCastingParams({ ...ODLEW.defaults, materialSourceId: zrodlo, finishId: finish });
      sprawdz(braki.includes("metalId"),
        `przy zrodle ${zrodlo} i wykonczeniu ${finish} kruszec przestal byc wymagany`,
        `przy zrodle ${zrodlo} i wykonczeniu ${finish} kruszec jest wymagany`);
    }
  }
}

console.log("\n4. Klient czyta, ze brakuje wlasnie kruszcu\n");
{
  // Spis prob w zdaniu liczy sie z listy, wiec nie moze wymieniac wycofanej.
  sprawdz(!/24k/.test(describeMissingCastingParams({}, "pl") || ""),
    "zdanie o brakach nadal wymienia probe 24k, ktorej nie oferujemy",
    "zdanie o brakach wymienia tylko proby z oferty");
  for (const [lang, wzor] of [["pl", /kruszcu i próby/], ["en", /alloy and purity/], ["de", /Legierung und Feingehalt/]]) {
    const zdanie = describeMissingCastingParams({ ...ODLEW.defaults }, lang);
    sprawdz(wzor.test(zdanie || ""),
      `w jezyku ${lang} zdanie o brakach nie nazywa kruszcu: ${zdanie}`,
      `w jezyku ${lang} zdanie o brakach nazywa kruszec wprost`);
  }
  // Po wskazaniu kruszcu zdanie ma przestac o nim mowic, inaczej klient
  // poprawia w kolko cos, co juz poprawil.
  const poWyborze = describeMissingCastingParams({ ...ODLEW.defaults, metalId: "gold_14k" }, "pl");
  sprawdz(!poWyborze || !/kruszcu i próby/.test(poWyborze),
    "po wskazaniu kruszcu zdanie dalej domaga sie kruszcu",
    "po wskazaniu kruszcu zdanie przestaje o nim mowic");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nKruszec przy odlewie: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
