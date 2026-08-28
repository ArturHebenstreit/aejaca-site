// ============================================================
// SLOWNIK JEST OBIEKTEM, NIE FUNKCJA
// ============================================================
// `useLanguage()` oddaje `t` jako zwykly obiekt: pisze sie `t.nav.currency`.
// Napisane jak w bibliotekach i18n, czyli `t("nav.currency")`, przechodzi
// build, przechodzi lint i wywala sie dopiero w przegladarce.
//
// Dlaczego to grozniejsze, niz wyglada: wyjatek leci w trakcie renderu, wiec
// React 18 nie gasi jednego napisu, tylko ODMONTOWUJE CALE DRZEWO. Odwiedzajacy
// dostaje bialy ekran, nie brakujacy tekst.
//
// Dlaczego zaden dotychczasowy sprawdzian tego nie zlapal: felerne wywolanie
// siedzialo w liscie wyboru jezyka, ktora rysuje sie DOPIERO PO KLIKNIECIU.
// Prerender jej nie odwiedza, przeglad 300 stron w przegladarce tez nie, bo
// nikt tam nie klikal. Kod za interakcja lezy poza zasiegiem obu tych siatek,
// wiec potrzebuje wlasnej. Wpadka: pusta strona po przelaczniku jezyka, obecna
// od 2026-08-26 (f4ca8a1) do 2026-08-28.
//
// UWAGA na drugie `t`. W projekcie zyje osobny, calkiem legalny pomocnik
// `t(pl, en, de)` we wpisach blogowych i `t(etykieta, lang)` w kalkulatorach.
// On MA byc funkcja. Dlatego nie szukamy nazwy `t`, tylko sprawdzamy, co
// naprawde wyszlo z `useLanguage()` w danym pliku, razem ze zmiana nazwy
// (`const { t: tr } = useLanguage()`).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const DESTRUKTURYZACJA = /const\s*\{([^}]*)\}\s*=\s*useLanguage\(\)/g;

function pliki(katalog) {
  const wynik = [];
  for (const wpis of readdirSync(katalog)) {
    const sciezka = join(katalog, wpis);
    if (statSync(sciezka).isDirectory()) wynik.push(...pliki(sciezka));
    else if (/\.(js|jsx)$/.test(wpis)) wynik.push(sciezka);
  }
  return wynik;
}

/** Nazwa, pod ktora slownik trafil do tego pliku, albo null. */
function nazwaSlownika(tresc) {
  for (const dopasowanie of tresc.matchAll(DESTRUKTURYZACJA)) {
    for (const pole of dopasowanie[1].split(",")) {
      const [klucz, alias] = pole.split(":").map((s) => s.trim());
      if (klucz === "t") return alias || "t";
    }
  }
  return null;
}

const potkniecia = [];
for (const plik of pliki(KORZEN)) {
  const tresc = readFileSync(plik, "utf-8");
  if (!tresc.includes("useLanguage()")) continue;
  const nazwa = nazwaSlownika(tresc);
  if (!nazwa) continue;
  // Klasa znakow przed nazwa odcina slowa konczace sie tak samo (`import(`,
  // `createElement(`) oraz wywolania na obiekcie (`cos.t(`).
  const wolanie = new RegExp(`(^|[^A-Za-z0-9_$.])${nazwa}\\s*\\(`);
  tresc.split("\n").forEach((linia, i) => {
    if (wolanie.test(linia)) {
      potkniecia.push(`${plik.replace(/.*\/src\//, "src/")}:${i + 1}  ${linia.trim().slice(0, 90)}`);
    }
  });
}

if (potkniecia.length) {
  console.error('Slownik wolany jak funkcja. Pisze sie `t.nav.klucz`, nie `t("nav.klucz")`:');
  potkniecia.forEach((p) => console.error("  " + p));
  console.error("\nWyjatek w renderze odmontowuje cale drzewo Reacta, czyli bialy ekran.");
  process.exit(1);
}

console.log("Slownik: nigdzie nie wolany jak funkcja.");
