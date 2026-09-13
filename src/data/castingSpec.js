// ============================================================
// MODEL KLIENTA DO ODLEWU: stan pliku, naddatki, minimalne grubosci
// ============================================================
// Jedno zrodlo dla trzech miejsc: pol kreatora, walidacji serwerowej i bloku
// z przeliczeniem wymiarow, ktory widzi klient przed potwierdzeniem.
//
// SKURCZU I GESTOSCI TU NIE MA i nie wolno ich tu wpisac. Stoja w
// `castingAlloys.js` i sluza takze generatorowi pierscionkow oraz wycenie masy.
// Druga tabela z tymi samymi liczbami rozjezdza sie przy pierwszej korekcie,
// a rozjazd w skurczu widac dopiero po odlaniu.
//
// Zrodlo liczb: `MDs/AEJaCA_Brief_Odlew_z_pliku_klienta.md` (wrzesien 2026),
// z trzema poprawkami wobec briefu, opisanymi przy odpowiednich tabelach.
import { CASTING_ALLOYS, alloy } from "./castingAlloys.js";

const L = (pl, en, de) => ({ pl, en, de });

// ============================================================
// 1. STAN PLIKU, KTORY PRZYSYLA KLIENT
// ============================================================
// Najdrozsza pomylka calej uslugi to PODWOJNA KOMPENSACJA: klient skaluje
// model o skurcz, my skalujemy drugi raz, wyrob wychodzi o dwa do czterech
// rozmiarow za duzy i traci sie kruszec razem z kolba i doba pieca.
//
// Dlatego nie pytamy "czy uwzglednil skurcz" haczykiem, ktory da sie klikac
// bez czytania, tylko kazemy wskazac STAN PLIKU. Pole nie ma wartosci
// domyslnej (`bezWyboru`), bo podstawiona odpowiedz na to pytanie jest
// dokladnie tym samym, co jej brak.
//
// Klient NIE PODAJE WLASNEGO MNOZNIKA, tylko stop, dla ktorego skalowal.
// Mnoznik bierzemy ze swojej tabeli, wiec literowka w polu tekstowym nie ma
// jak wejsc do wyrobu. Decyzja wlasciciela 2026-09-13.
export const STANY_MODELU = [
  {
    id: "finished",
    label: L("Wymiary gotowego wyrobu", "Finished dimensions", "Fertigmaße"),
    sub: L(
      "Model 1:1, bez skurczu i bez naddatku. Resztę dodajemy my.",
      "Model at 1:1, no shrinkage and no machining allowance. We add the rest.",
      "Modell 1:1, ohne Schwund und ohne Aufmaß. Den Rest ergänzen wir."
    ),
  },
  {
    id: "compensated",
    label: L("Model już powiększony o skurcz", "Already scaled for shrinkage", "Bereits auf Schwund skaliert"),
    sub: L(
      "Wskaż stop, dla którego model był skalowany. Doskalujemy tylko różnicę.",
      "Tell us which alloy you scaled for. We only add the difference.",
      "Nennen Sie die Legierung, für die skaliert wurde. Wir ergänzen nur die Differenz."
    ),
  },
];

// ============================================================
// 2. KATEGORIA WYROBU
// ============================================================
// Naddatek na szlif otworu dotyczy tylko rzeczy, ktore wchodza na palec.
// Zawieszka ma otwor na rapcie i nikt go nie szlifuje do wymiaru, wiec
// pytanie o rozmiar przy zawieszce byloby pytaniem o nic.
export const KATEGORIE_WYROBU = [
  { id: "ring", otwor: true,
    label: L("Obrączka lub pierścionek", "Ring or wedding band", "Ring oder Trauring") },
  { id: "bangle", otwor: true,
    label: L("Bransoleta sztywna", "Bangle", "Armreif") },
  { id: "pendant", otwor: false,
    label: L("Zawieszka lub charms", "Pendant or charm", "Anhänger oder Charm") },
  { id: "earring", otwor: false,
    label: L("Kolczyki", "Earrings", "Ohrringe") },
  { id: "other", otwor: false,
    label: L("Co innego", "Something else", "Etwas anderes") },
];

export function kategoriaZOtworem(id) {
  return KATEGORIE_WYROBU.some((k) => k.id === id && k.otwor);
}

// ============================================================
// 3. NADDATKI NA OBROBKE
// ============================================================
// Naddatek to metal, ktory ZNIKNIE przy szlifowaniu. Otwor obraczki
// szlifujemy zawsze, bo powierzchnia odlewu jest za szorstka na skore, a
// szlif POWIEKSZA otwor. Model musi wiec miec otwor MNIEJSZY od docelowego.
//
// Ostatnie dwa wiersze sa wazniejsze od pierwszego: naddatek na powierzchni
// zdobionej oznacza, ze przy szlifowaniu zetrzemy detal, dla ktorego klient
// zlozyl zamowienie. Tekstura, mlotkowanie, grawer i relief nie dostaja
// naddatku nigdy, niezaleznie od wybranego wykonczenia.
export const NADDATKI_MM = {
  // Na SREDNICY, nie na promieniu. Szlif zdejmuje material z calego obwodu.
  otwor: 0.15,
  // Na wymiarze, tylko gdy klient zamowil poler lustrzany powierzchni gladkiej.
  polerZewnetrzny: 0.10,
  dekoracyjna: 0,
};

// Wykonczenia, przy ktorych zewnetrzna powierzchnia idzie pod poler lustrzany.
// Identyfikatory z `CASTING_FINISHES` w `src/pricing/preciousMetalCasting.js`.
export const WYKONCZENIA_Z_POLEREM = ["polished", "jewelry"];

/**
 * Naddatek na powierzchni zewnetrznej.
 * Zwraca zero, gdy klient zaznaczyl, ze powierzchnia jest zdobiona: wtedy
 * szlifu nie ma, bo szlif zabiera wzor.
 */
export function naddatekZewnetrzny(finishId, dekoracyjna) {
  if (dekoracyjna) return NADDATKI_MM.dekoracyjna;
  return WYKONCZENIA_Z_POLEREM.includes(finishId) ? NADDATKI_MM.polerZewnetrzny : 0;
}

// ============================================================
// 4. MINIMALNE GRUBOSCI W WYROBIE GOTOWYM
// ============================================================
// Dwa progi, bo to sa dwa rozne zdania:
//   `min`   - ponizej tego odlew sie nie wypelni, zamowienia nie przyjmujemy,
//   `pewne` - ponizej tego odlejemy, ale bez obietnicy pelnego odwzorowania.
//
// UWAGA NA `min` SCIANKI. Brief mowil 0,8 mm, a generator pierscionkow odlewa
// u nas sciane 0,45 mm i drut 0,5 mm w srebrze 925 i robi to od 12 wrzesnia
// 2026 (patrz `MDs/AEJaCA_Geometria_Kreatora_Zasady.md`). Dwie liczby na to
// samo zjawisko nie moga stac obok siebie, wiec `min` bierze wartosc z naszej
// wlasnej praktyki, a liczba z briefu stoi jako `pewne`. Roznica miedzy nimi
// to nie spor o fizyke, tylko o to, CZYJA jest geometria: wlasny model
// prowadzimy wlewem tam, gdzie trzeba, w cudzym tego nie ruszamy.
export const MIN_GRUBOSC_MM = {
  sciana: { min: 0.45, pewne: 1.0, label: L("Ścianka", "Wall", "Wandstärke") },
  szyna: { min: 1.0, pewne: 1.3, label: L("Szyna pierścionka", "Ring shank", "Ringschiene") },
  krapa: { min: 0.7, pewne: 0.9, label: L("Pazurek", "Prong", "Krappe") },
  detal: { min: 0.6, pewne: 0.8, label: L("Element wolnostojący", "Free-standing detail", "Freistehendes Detail") },
  relief: { min: 0.3, pewne: 0.5, label: L("Wysokość reliefu", "Relief height", "Reliefhöhe") },
  kreska: { min: 0.4, pewne: 0.6, label: L("Szerokość kreski napisu", "Lettering stroke", "Schriftstärke") },
  przeswit: { min: 0.8, pewne: 1.0, label: L("Prześwit między elementami", "Gap between parts", "Abstand zwischen Teilen") },
  otworPrzelotowy: { min: 0.8, pewne: 1.2, label: L("Otwór przelotowy", "Through hole", "Durchgangsbohrung") },
  zaokraglenie: { min: 0.1, pewne: 0.2, label: L("Zaokrąglenie krawędzi", "Edge radius", "Kantenradius") },
};

// Prog, ktorego pilnuje pomiar z pliku. Mierzymy grubosc promieniem w glab
// bryly, wiec potrafimy sprawdzic SCIANE i nic wiecej: relief, kreska i
// przeswit wymagaja rozpoznania, czym dana cecha jest, a tego z siatki
// trojkatow nie wyczytamy. Reszta tabeli sluzy tresci dla klienta.
export const MIERZONA_CECHA = "sciana";

// ============================================================
// 5. WYMAGANIA DLA PLIKU
// ============================================================
// Formaty sa te same, co w calym sklepie (`FORMATY_MODELU` w
// `src/shop/paczkaModeli.js`), i tak ma zostac: klient nie ma powodu wiedziec,
// ze odlew czyta plik inaczej niz druk. Limit rozmiaru tez jest wspolny,
// 60 MB, i pilnuje go serwer przy wgrywaniu.
export const WYMAGANIA_PLIKU = {
  // Bryla ZAMKNIETA: bez tego nie da sie policzyc, gdzie jest metal, a gdzie
  // powietrze. Slicer zrobi z otwartej siatki cokolwiek, a odlew to utrwali.
  szczelna: true,
  // Jedna bryla. Kilka przenikajacych sie bryl daje we wnetrzu obszar
  // niezdefiniowany; klient robi `BooleanUnion` albo zamawia to u nas.
  jednaBryla: true,
  // Jednostka: STL i OBJ jej nie niosa, wiec czytamy milimetry (regulamin 13).
  // 3MF i STEP niosa i wtedy czytamy z pliku.
  domyslnaJednostka: "mm",
  formatyBezJednostki: ["stl", "obj"],
};

// ============================================================
// 6. PRZELICZENIE WYMIARU
// ============================================================
// Lancuch jest zawsze ten sam i zawsze pokazujemy go klientowi:
//   wymiar gotowy -> minus naddatek -> razy skurcz -> wymiar modelu.
//
// Przy otworze naddatek sie ODEJMUJE, bo szlif otwor powieksza. Przy
// powierzchni zewnetrznej naddatek sie DODAJE, bo szlif zdejmuje material z
// zewnatrz. Ten znak jest cala trudnoscia tego rachunku i dlatego kierunek
// siedzi w danych wejsciowych, a nie w glowie osoby, ktora to wola.

// Kruszce z `CASTING_METALS` wobec stopow z `castingAlloys.js`. Dwie listy
// istnieja, bo wycena zna srebro 800, a tabela skurczu nie.
export const KRUSZEC_NA_STOP = {
  silver: "ag925",
  // Srebro 800 nie ma wlasnego wiersza w tabeli skurczu. Bierzemy wspolczynnik
  // srebra 925: roznica miedzy tymi stopami to okolo jednej dziesiatej procenta,
  // czyli 0,017 mm na obraczce 17 mm, przy tolerancji 0,2 mm, ktora obiecujemy.
  // Wpisanie zmyslonej liczby do tabeli skurczu byloby gorsze niz ta zamiana.
  silver_800: "ag925",
  gold_9k: "au9k",
  gold_14k: "au585",
  gold_18k: "au750",
};

export function stopDlaKruszcu(metalId) {
  return KRUSZEC_NA_STOP[metalId] || null;
}

export function skurczKruszcu(metalId) {
  const id = stopDlaKruszcu(metalId);
  return id && CASTING_ALLOYS[id] ? CASTING_ALLOYS[id].shrink : null;
}

/**
 * Pelne przeliczenie wymiaru docelowego na wymiar modelu, ktory wydrukujemy.
 *
 * @param {object} we
 * @param {number} we.docelowy  wymiar wyrobu GOTOWEGO w mm (np. srednica otworu)
 * @param {string} we.metalId   kruszec zamowienia (`CASTING_METALS`)
 * @param {number} we.naddatek  naddatek w mm, dodatni
 * @param {string} we.kierunek  "otwor" (odejmujemy) albo "zewnetrzny" (dodajemy)
 * @param {string} [we.skompensowanyDla] stop, dla ktorego klient juz przeskalowal
 * @returns {object|null} kroki rachunku albo null, gdy brakuje danych
 */
export function przeliczWymiar({ docelowy, metalId, naddatek = 0, kierunek = "otwor", skompensowanyDla = null }) {
  const skurcz = skurczKruszcu(metalId);
  if (!Number.isFinite(docelowy) || docelowy <= 0 || !skurcz) return null;

  const znak = kierunek === "otwor" ? -1 : 1;
  const przedSkurczem = docelowy + znak * naddatek;
  const model = przedSkurczem * skurcz;

  // Klient juz przeskalowal plik dla jakiegos stopu. Jego plik ma wiec wymiar
  // `docelowy * skurczKlienta`, a my potrzebujemy `model`. Doskalowujemy
  // ILORAZEM, nie pelnym mnoznikiem, inaczej skurcz wchodzi drugi raz.
  const skurczKlienta = skompensowanyDla && CASTING_ALLOYS[skompensowanyDla]
    ? CASTING_ALLOYS[skompensowanyDla].shrink
    : null;
  const korekta = skurczKlienta ? skurcz / skurczKlienta : skurcz;

  return {
    docelowy,
    naddatek,
    kierunek,
    przedSkurczem,
    skurcz,
    skurczKlienta,
    // Mnoznik, ktorym naprawde ruszamy PLIK KLIENTA. Przy zgodnym stopie
    // wychodzi 1,0000 i wtedy plik idzie do druku bez skalowania.
    korekta,
    model,
    stop: stopDlaKruszcu(metalId),
    etykietaStopu: alloy(stopDlaKruszcu(metalId))?.label || null,
  };
}

/**
 * Czy deklaracja klienta i zamowiony kruszec sie rozjezdzaja.
 * Zwraca `null`, gdy nie ma o czym mowic, albo mnoznik roznicy.
 */
export function roznicaSkurczu(metalId, skompensowanyDla) {
  const skurcz = skurczKruszcu(metalId);
  const klienta = skompensowanyDla ? CASTING_ALLOYS[skompensowanyDla]?.shrink : null;
  if (!skurcz || !klienta) return null;
  if (Math.abs(skurcz - klienta) < 1e-9) return null;
  return skurcz / klienta;
}

// Rozbieznosc otworu zmierzonego w pliku wobec podanego rozmiaru palca, ponad
// ktora zamowienie sie zatrzymuje. Decyzja wlasciciela 2026-09-13: roztoczenie
// otworu zabiera grubosc szyny, wiec nie jest to poprawka, ktora wolno zrobic
// bez pytania. Ponizej progu roznica miesci sie w tolerancji procesu (0,2 mm
// z regulaminu 13) i nie ma o czym rozmawiac.
export const PROG_ROZBIEZNOSCI_OTWORU_MM = 0.2;

export const CASTING_SPEC_BUILD = "1.000";
