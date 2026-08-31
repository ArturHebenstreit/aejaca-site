// ============================================================
// CO SERWIS ZAPISUJE W URZADZENIU ODWIEDZAJACEGO
// ============================================================
// Art. 398 Prawa komunikacji elektronicznej wymaga zgody na przechowywanie
// informacji w urzadzeniu koncowym, poza tym, co niezbedne do wykonania uslugi
// zadanej przez uzytkownika. Serwis nie ma banera zgody i mial go nie miec:
// zapisuje wylacznie rzeczy, o ktore odwiedzajacy sam prosi (koszyk, ustawienia
// kalkulatorow, wybrany motyw).
//
// Ten skrypt pilnuje, zeby tak zostalo. Kazdy nowy klucz w pamieci przegladarki
// musi zostac tu swiadomie dopisany razem z uzasadnieniem, bo dopisanie go bez
// namyslu oznacza obowiazek zgody, o ktorym nikt sie nie dowie do kontroli.
//
//   node scripts/check-browser-storage.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

/**
 * Pliki, ktorym wolno siegac do pamieci przegladarki, wraz z powodem.
 * Powod nie jest ozdoba: to on decyduje, czy zapis jest niezbedny.
 */
const ALLOWED = {
  "src/cart/CartContext.jsx": "koszyk, czyli tresc, o ktora klient sam poprosil",
  "src/components/calculators/CalcToCart.jsx": "przeniesienie wyceny do koszyka",
  "src/components/calculators/LaserParametersTool.jsx": "ustawienia narzedzia zapisane na zyczenie uzytkownika",
  "src/components/calculators/PrintSettings3DCalc.jsx": "ustawienia narzedzia zapisane na zyczenie uzytkownika",
  "src/components/ChatWidget.jsx": "zamkniecie dymka i tresc rozmowy na czas jednej wizyty",
  "src/i18n/ThemeContext.jsx": "wybrany tryb jasny albo ciemny",
  "src/hooks/useGemPrices.js": "pamiec podreczna publicznych cen kamieni, zeby kalkulator nie pytal serwera przy kazdym kliknieciu; zadne dane osoby",
  "src/hooks/useMaterialStock.js": "pamiec podreczna publicznych stawek materialow z magazynu, zeby suwak wielkosci nie pytal serwera przy kazdym ruchu; zadne dane osoby",
  "src/i18n/LanguageContext.jsx": "wybrany jezyk",
  "src/shop/CurrencyContext.jsx": "wybrana waluta zaplaty, czyli ustawienie, o ktore klient sam poprosil klikajac w przelacznik; ta sama polka co jezyk i zaden slad po osobie",
  "src/analysis/modelHandoff.js": "model przenoszony miedzy kartami po kliknieciu odnosnika do pelnej analizy, czyli czynnosc, o ktora klient sam poprosil; rekord kasujemy przy odczycie i odrzucamy po kwadransie",
  "src/shop/orderStatusAccess.js": "prywatny token zamowienia na czas sesji karty, niezbedny do statusu i ponowienia platnosci po F5",
  // Wyjatek innego rodzaju niz reszta listy: nie sluzy usludze, tylko WYLACZA
  // zliczanie. Klucz zapisuje sobie sam wlasciciel, wchodzac na adres
  // z `?nolicz=1`, bo jego wlasne wizyty z trzech urzadzen i zmiennych adresow
  // IP inaczej wygladaja w statystyce jak zainteresowanie rynku. Nie niesie
  // zadnej informacji o czlowieku i kasuje sie tym samym adresem z `?nolicz=0`.
  // Decyzja: ADR-0031.
  "src/utils/analytics.js": "znacznik wlasciciela wylaczajacy zliczanie jego wizyt, ustawiany przez niego samego adresem ?nolicz=1",
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(full);
  }
  return out;
}

// IndexedDB liczy sie tak samo jak reszta. Przepis mowi o przechowywaniu
// informacji w urzadzeniu koncowym i nie wymienia technologii, wiec pominiecie
// jej tutaj znaczyloby tylko tyle, ze najpojemniejszy magazyn w przegladarce
// jest jedynym, ktorego nikt nie oglada.
const STORAGE = /\b(localStorage|sessionStorage|document\.cookie|indexedDB)\b/;

const problems = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const code = readFileSync(file, "utf8");
  const lines = code.split("\n");
  lines.forEach((line, i) => {
    // Wzmianka w komentarzu to opis, nie zapis.
    const withoutComment = line.replace(/\/\/.*$/, "").replace(/\/\*[\s\S]*?\*\//g, "");
    if (!STORAGE.test(withoutComment)) return;
    if (ALLOWED[rel]) return;
    problems.push({ rel, line: i + 1, text: line.trim().slice(0, 90) });
  });
}

// Wpis, ktory przestal byc potrzebny, tez jest bledem: lista ma opisywac stan
// faktyczny, inaczej po roku nikt jej nie ufa.
const used = new Set(problems.map((p) => p.rel));
const stale = Object.keys(ALLOWED).filter((rel) => {
  try {
    return !STORAGE.test(readFileSync(join(ROOT, rel), "utf8"));
  } catch {
    return true;
  }
});

if (!problems.length && !stale.length) {
  console.log(`Pamiec przegladarki: ${Object.keys(ALLOWED).length} miejsc, wszystkie uzasadnione.`);
  process.exit(0);
}

if (problems.length) {
  console.error(`\nZapis w urzadzeniu bez uzasadnienia (${problems.length}):\n`);
  for (const p of problems) console.error(`  ${p.rel}:${p.line}\n    ${p.text}`);
  console.error("\nJezeli zapis jest niezbedny do uslugi, dopisz plik do ALLOWED razem z powodem.");
  console.error("Jezeli nie jest, wymaga zgody uzytkownika, czyli banera. Wtedy porozmawiajmy najpierw.");
}
if (stale.length) {
  console.error(`\nWpisy w ALLOWED bez pokrycia w kodzie (${stale.length}): ${stale.join(", ")}`);
}
process.exit(1);
