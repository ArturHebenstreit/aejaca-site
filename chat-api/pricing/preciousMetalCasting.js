// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/preciousMetalCasting.js
// Regeneracja: npm run sync:pricing

import { calcNew } from "./jewelry.js";
import { PLATING, ENGRAVING_OPTIONS, engravingPricePLN, normalizeEngravingId } from "./jewelryConfig.js";
import { fmtCost } from "./config.js";

export const PRECIOUS_METAL_CASTING_BUILD = "1.009";

// KOLBA ODLEWNICZA, jedyne zrodlo prawdy o rozmiarze w calym serwisie.
// Wszystko ponizej i kazdy komunikat o limicie liczy sie z tych dwoch liczb,
// zeby zmiana kolby nie wymagala szukania wpisanych z reki milimetrow.
// Glebokosc 90, nie 80: wlasciciel doprecyzowal wymiar kolby 3 wrzesnia 2026,
// po tym jak model 22 x 59 x 5 mm dostal komunikat o przekroczeniu limitu,
// chociaz sie miesci. Przy 80 mm limit wysokosci wychodzil 55 mm i model o
// 59 mm byl odrzucany na 93%.
export const CASTING_FLASK_MM = { diameter: 80, depth: 90 };

// Model nie zajmuje calej kolby. Trzy zapasy, kazdy z innego powodu:
// masa formierska musi utrzymac sciane miedzy modelem a blacha kolby, przy
// dnie stoi stozek i kanal glowny, a nad najwyzszym punktem modelu musi zostac
// warstwa masy, inaczej forma peka przy wypalaniu.
const FLASK_WALL_MM = 10;
const SPRUE_BASE_MM = 15;
const TOP_COVER_MM = 10;

const USABLE_DIAMETER_MM = CASTING_FLASK_MM.diameter - 2 * FLASK_WALL_MM;

// Prostokat wpisany w kolo ma przekatna rowna srednicy, wiec bok kwadratu to
// srednica podzielona przez pierwiastek z dwoch. Zaokraglamy w dol, bo limit
// ma byc obietnica, ktorej dotrzymamy, a nie wartoscia graniczna.
export const CASTING_ENVELOPE_MM = [
  Math.floor(USABLE_DIAMETER_MM / Math.SQRT2),
  Math.floor(USABLE_DIAMETER_MM / Math.SQRT2),
  CASTING_FLASK_MM.depth - SPRUE_BASE_MM - TOP_COVER_MM,
];

/** Limit w postaci, w ktorej pokazujemy go klientowi. */
export const CASTING_ENVELOPE_LABEL = CASTING_ENVELOPE_MM.join(" x ") + " mm";

const L = (pl, en, de) => ({ pl, en, de });

export const CASTING_VARIANTS = [
  { id: "ready_pattern", label: L("Gotowy wzorzec", "Ready pattern", "Fertiges Modell"), sub: L("Dostarczony wosk lub żywica odlewnicza", "Supplied wax or castable resin", "Angeliefertes Wachs oder Gießharz") },
  { id: "model_3d", label: L("Model 3D", "3D model", "3D-Modell"), sub: L("Przesyłasz plik, my drukujemy i odlewamy", "You upload, we print and cast", "Datei hochladen, wir drucken und gießen") },
  { id: "client_idea", label: L("Pomysł klienta", "Your idea", "Ihre Idee"), sub: L("Projekt, wydruk i odlew po stronie AEJaCA", "AEJaCA designs, prints and casts", "AEJaCA entwirft, druckt und gießt") },
];

export const CASTING_MATERIAL_SOURCES = [
  { id: "aejaca", label: L("Kruszec AEJaCA", "AEJaCA metal", "AEJaCA-Metall") },
  { id: "client", label: L("Kruszec powierzony", "Customer-supplied metal", "Beigestelltes Metall") },
];

export const CASTING_METALS = [
  { id: "silver", label: L("Srebro 925", "Silver 925", "Silber 925"), density: 10.36 },
  { id: "silver_800", label: L("Srebro 800", "Silver 800", "Silber 800"), density: 10.20 },
  { id: "gold_9k", label: L("Złoto 9k (375)", "Gold 9k (375)", "Gold 9k (375)"), density: 11.20 },
  { id: "gold_14k", label: L("Złoto 14k (585)", "Gold 14k (585)", "Gold 14k (585)"), density: 13.07 },
  { id: "gold_18k", label: L("Złoto 18k (750)", "Gold 18k (750)", "Gold 18k (750)"), density: 15.58 },
  { id: "gold_24k", label: L("Złoto 24k (999)", "Gold 24k (999)", "Gold 24k (999)"), density: 19.32 },
];

// PIEC POZIOMOW OBROBKI ODLEWU, kolejno coraz wiecej pracy rekodzielniczej.
// Identyfikatory `raw`, `clean` i `polished` sa te same co przed rozszerzeniem
// listy, bo siedza w zapisanych zamowieniach i w mapie z szybkiej wyceny:
// przemianowanie ich unieważniłoby wycene kazdego starego koszyka.
export const CASTING_FINISHES = [
  { id: "raw", label: L("Surowy odlew z kanałami wlewowymi", "As-cast with sprues", "Rohguss mit Gusskanälen"),
    sub: L("Drzewko prosto z kolby, kanały zostają", "The tree straight from the flask, sprues left on", "Der Gussbaum direkt aus der Küvette, Kanäle bleiben"), extraGrosze: 0 },
  { id: "sprue_cut", label: L("Surowy odlew z odciętymi kanałami", "As-cast, sprues removed", "Rohguss, Kanäle abgetrennt"),
    sub: L("Odcinamy od drzewka, ślad po kanale zostaje", "Cut off the tree, the sprue stub stays", "Vom Baum getrennt, Kanalansatz bleibt"), extraGrosze: 3000 },
  { id: "clean", label: L("Odcięte kanały wlewowe", "Sprues cut and dressed", "Kanäle abgetrennt und verputzt"),
    sub: L("Ślad po kanale zlicowany z powierzchnią", "The stub dressed flush with the surface", "Ansatz flächenbündig verputzt"), extraGrosze: 7000 },
  { id: "ground", label: L("Wyszlifowany", "Ground", "Geschliffen"),
    sub: L("Cała powierzchnia przeszlifowana, bez połysku", "The whole surface ground, no shine", "Gesamte Oberfläche geschliffen, ohne Glanz"), extraGrosze: 11000 },
  { id: "polished", label: L("Wykończenie jubilerskie", "Jewellery finish", "Juwelierfinish"),
    sub: L("Szlifowanie, polerowanie i kontrola przed wydaniem", "Grinding, polishing and a check before release", "Schleifen, Polieren und Kontrolle vor der Ausgabe"), extraGrosze: 16000 },
];


// POZIOMY WYKONCZENIA ZALEZA OD TEGO, CZYJ JEST KRUSZEC.
// Przy kruszcu AEJaCA nie wydajemy odlewu z kanalami wlewowymi: metal w
// kanalach jest nasz i wraca do przetopu. Przy kruszcu powierzonym kanaly sa
// z metalu klienta, wiec oddanie ich razem z odlewem jest oczywiste.
// Polecenie wlasciciela, 3 wrzesnia 2026.
export function castingFinishesFor(materialSourceId) {
  return materialSourceId === "aejaca"
    ? CASTING_FINISHES.filter((f) => f.id !== "raw")
    : CASTING_FINISHES;
}

// POWLOKA GALWANICZNA. Ta sama lista i te same ceny co w kalkulatorze
// jubilerskim: wlasciciel postawil warunek, ze wycena odlewu ma byc spojna
// z tym, co pokazuja kalkulatory Bizuterii. Dlatego bierzemy `PLATING` wprost,
// zamiast przepisywac kwoty, ktore rozjechalyby sie przy pierwszej zmianie.
// Proby zlota nie ma tu dlatego, ze nie ma jej w kalkulatorze: dodanie jej
// najpierw tam sprawi, ze odlew pojdzie za nia sam.
// "Inne pokrycie" (`custom_pl`) nie wchodzi, bo nie ma ceny, a ta sciezka ma
// dawac kwote wiazaca; nietypowe pokrycie idzie zapytaniem.
export const CASTING_PLATINGS = PLATING.filter((p) => !p.custom);

// GRAWER DOMAWIA SIE DO WYKONCZENIA JUBILERSKIEGO, tak samo jak powloka.
// Grawerujemy laserem po wypolerowaniu: na szorstkiej powierzchni slad ginie,
// a polerowanie po grawerze zaokragliloby jego krawedzie. Ceny ida z tej samej
// tabeli, ktora widzi klient w kalkulatorze jubilerskim, zeby ten sam grawer
// nie kosztowal w dwoch miejscach dwoch roznych kwot.
// Polecenie wlasciciela, 2026-09-03.
export const CASTING_ENGRAVINGS = ENGRAVING_OPTIONS;
// Razem z lista idzie zamiennik starych identyfikatorow, zeby ekran odlewu
// nie musial siegac po niego do drugiego modulu i zeby nie dalo sie wziac
// jednego bez drugiego.
export { normalizeEngravingId };
export function castingEngravingAvailable(finishId) {
  return finishId === CASTING_PLATING_REQUIRES_FINISH;
}

// Powloka klada sie DOPIERO na wypolerowana powierzchnie. Galwanika odwzorowuje
// to, co pod nia lezy, wiec na szorstkim odlewie dalaby matowy, nierowny efekt.
export const CASTING_PLATING_REQUIRES_FINISH = "polished";
export function castingPlatingAvailable(finishId) {
  return finishId === CASTING_PLATING_REQUIRES_FINISH;
}

export const CASTING_RESERVE_RATE = 0.12;

function sortedMillimetres(bbox) {
  if (!bbox) return null;
  const dims = [bbox.x, bbox.y, bbox.z].map((v) => Number(v) * 10).sort((a, b) => a - b);
  return dims.every((v) => Number.isFinite(v) && v > 0) ? dims : null;
}

/** Największa jednolita skala, która po obrocie mieści model w kolbie. */
export function maxCastingScaleForBBox(bbox) {
  const dims = sortedMillimetres(bbox);
  if (!dims) return null;
  return Math.min(...dims.map((dimension, index) => CASTING_ENVELOPE_MM[index] / dimension));
}

export function fitsCastingFlask(bbox, scale = 1) {
  const maxScale = maxCastingScaleForBBox(bbox);
  return maxScale != null && Number.isFinite(Number(scale)) && Number(scale) > 0 && Number(scale) <= maxScale + 1e-9;
}

// CZEGO BRAKUJE DO WYCENY. `calculate` oddaje samo `null`, wiec bez tej listy
// klient dostawal jedno zdanie "Parametry sa niekompletne" i nie mial jak
// zgadnac, ktore pole zostawil puste. Kolejnosc jest kolejnoscia pytan
// na karcie uslugi, zeby komunikat czytalo sie z gory na dol razem z formularzem.
const CASTING_REQUIRED = [
  { id: "variantId", ma: (p) => CASTING_VARIANTS.some((v) => v.id === p.variantId),
    label: L("punktu startowego (wzorzec, model 3D albo pomysł)", "the starting point (pattern, 3D model or idea)", "den Ausgangspunkt (Modell, 3D-Datei oder Idee)") },
  { id: "materialSourceId", ma: (p) => CASTING_MATERIAL_SOURCES.some((v) => v.id === p.materialSourceId),
    label: L("pochodzenia kruszcu (nasz albo powierzony)", "the source of the metal (ours or supplied)", "die Herkunft des Metalls (unseres oder beigestellt)") },
  { id: "metalId", ma: (p) => CASTING_METALS.some((v) => v.id === p.metalId),
    label: L("kruszcu i próby (Ag 800/925 albo Au 9k/14k/18k/24k)", "the alloy and purity (Ag 800/925 or Au 9k/14k/18k/24k)", "Legierung und Feingehalt (Ag 800/925 oder Au 9k/14k/18k/24k)") },
  { id: "finishId", ma: (p) => CASTING_FINISHES.some((v) => v.id === p.finishId),
    label: L("zakresu wykończenia odlewu", "the finishing level", "den Umfang der Nachbearbeitung") },
  // Plik jest wymagany TYLKO na sciezce, ktora w ogole dostaje kwote z automatu.
  // Na pozostalych dwoch wycena i tak idzie do czlowieka, wiec zadanie pliku
  // byloby zadaniem rzeczy, ktorej klient jeszcze nie ma.
  { id: "stlData", ma: (p) => Boolean(p.stlData?.volumeCm3 && p.stlData?.bbox),
    dotyczy: (p) => p.variantId === "model_3d" && p.materialSourceId === "aejaca",
    label: L("pliku modelu 3D (STL, OBJ, 3MF, STEP), z którego mierzymy objętość", "the 3D model file (STL, OBJ, 3MF, STEP) we measure the volume from", "die 3D-Datei (STL, OBJ, 3MF, STEP), aus der wir das Volumen messen") },
];

/** Identyfikatory pol, ktorych brakuje do policzenia kwoty wiazacej. */
export function missingCastingParams(params) {
  const p = params || {};
  return CASTING_REQUIRED.filter((pole) => (pole.dotyczy ? pole.dotyczy(p) : true) && !pole.ma(p)).map((pole) => pole.id);
}

/** Zdanie dla klienta: co dokladnie ma uzupelnic. `null`, gdy nie brakuje niczego. */
export function describeMissingCastingParams(params, lang = "pl") {
  const p = params || {};
  const braki = CASTING_REQUIRED.filter((pole) => (pole.dotyczy ? pole.dotyczy(p) : true) && !pole.ma(p));
  if (!braki.length) return null;
  const jezyk = ["pl", "en", "de"].includes(lang) ? lang : "pl";
  const lista = braki.map((pole) => pole.label[jezyk]);
  const spis = lista.length === 1 ? lista[0]
    : lista.slice(0, -1).join(", ") + ({ pl: " oraz ", en: " and ", de: " sowie " })[jezyk] + lista[lista.length - 1];
  if (jezyk === "en") return `To price the casting we still need ${spis}. Fill in what is missing and the amount appears by itself.`;
  if (jezyk === "de") return `Zur Gusskalkulation brauchen wir noch ${spis}. Ergänzen Sie das, und der Betrag erscheint von selbst.`;
  return `Do wyceny odlewu brakuje jeszcze: ${spis}. Uzupełnij to, a kwota policzy się sama.`;
}

export function calculate(params, lang = "pl", rates) {
  // `qtyId` MUSI pochodzic z `QTY_TIERS` w `jewelryConfig.js`, bo tam trafia
  // przez `calcNew`. Progi sTuDiO ("proto", "micro") sa inna lista i `calcNew`
  // oddaje na nie `null`, czyli cena po cichu znika z ekranu.
  //
  // `qty` to RZECZYWISTA liczba sztuk. Bez niej silnik liczy po nakladzie
  // reprezentatywnym progu, wiec klient zamawiajacy dwie sztuki dostawalby
  // cene policzona dla trzech. Patrz `Brand_Reference`, sekcja 6.0g.
  const { variantId, materialSourceId, metalId, finishId, platingId = "none",
    engravingId = "none", qtyId = "1", qty: sztuk, stlData } = params || {};
  if (!CASTING_VARIANTS.some((v) => v.id === variantId)
    || !CASTING_MATERIAL_SOURCES.some((v) => v.id === materialSourceId)
    || !CASTING_METALS.some((v) => v.id === metalId)
    || !CASTING_FINISHES.some((v) => v.id === finishId)) return null;

  if (variantId !== "model_3d" || materialSourceId !== "aejaca") return { type: "custom" };
  // Kosz sprzed zmiany moze niesc poziom, ktorego przy kruszcu AEJaCA juz nie
  // oferujemy. Nie liczymy go po cichu po staremu, tylko kierujemy do czlowieka.
  if (!castingFinishesFor(materialSourceId).some((f) => f.id === finishId)) return { type: "custom" };
  if (!stlData?.volumeCm3 || !stlData?.bbox) return null;
  if (!fitsCastingFlask(stlData.bbox)) return { type: "custom" };

  const metal = CASTING_METALS.find((v) => v.id === metalId);
  const finish = CASTING_FINISHES.find((v) => v.id === finishId);
  const finalMassG = stlData.volumeCm3 * metal.density;
  const requiredMassG = finalMassG * (1 + CASTING_RESERVE_RATE);
  const base = calcNew({
    lineId: "woman", typeId: "ring", metalId, weightId: "standard", methodId: "cast",
    // Powloka liczy sie tym samym torem co w kalkulatorze jubilerskim (marza
    // warsztatowa siedzi na robociznie razem z nia), wiec kwota jest ta sama
    // po obu stronach serwisu. Poza wykonczeniem jubilerskim powloki nie ma.
    platingId: castingPlatingAvailable(finishId) && CASTING_PLATINGS.some((v) => v.id === platingId) ? platingId : "none",
    stoneRows: [], qtyId, qty: sztuk,
    // GRAWERU NIE LICZY TU `calcNew`, chociaz zna te sama tabele cen. Doplata
    // zalezy od tego, czy cena sztuki przekracza prog, a cena sztuki przy
    // odlewie powstaje dopiero nizej: `calcNew` nie wie nic o przygotowaniu
    // wzorca ani o wykonczeniu, ktore razem daja od 120 do 280 zlotych.
    // Liczona tutaj byla mierzona wzgledem kwoty o te doplaty za niskiej,
    // wiec odlew za 480 zlotych placilby za grawer, ktory mu sie nalezy.
    engravingId: "none",
    clientSuppliesMetal: false, overrideWeightG: requiredMassG,
  }, lang, rates, undefined, {
    // Wewnętrzna opcja, nie parametr zamówienia: klient nie może nią sterować.
    // Odlew nie jest wykonaniem całego pierścionka od zera. Poprzednio silnik
    // doliczał sześć godzin pełnej pracy jubilerskiej, a następnie jeszcze
    // przygotowanie wzorca, przez co cena startowa była sztucznie zawyżona.
    laborHours: 1.5,
  });
  if (!base || base.type !== "calculated") return base;

  const patternPreparationGrosze = 12000;
  const extraGrosze = patternPreparationGrosze + finish.extraGrosze;
  const unitGrosze = base.unitGrosze + extraGrosze;
  // Grawer dopiero teraz, od pelnej ceny sztuki. `none` poza wykonczeniem
  // jubilerskim, bo grawerujemy po wypolerowaniu (patrz `castingEngravingAvailable`).
  const grawerId = castingEngravingAvailable(finishId)
    && CASTING_ENGRAVINGS.some((v) => v.id === normalizeEngravingId(engravingId))
    ? normalizeEngravingId(engravingId) : "none";
  const grawerPLN = engravingPricePLN(grawerId, unitGrosze / 100);
  // Widelki musza opisywac TE SAMA rzecz co kwota wiazaca. `calcNew` liczy
  // zakres z ceny sprzed doplat, a przygotowanie wzorca i wykonczenie doklejamy
  // dopiero tutaj, wiec bez tego przesuniecia kalkulator pokazywalby zakres
  // nizszy od kwoty, ktora klient zaplaci, i to o stala roznice od 120 do 280
  // zlotych. W sklepie nie bylo tego widac, bo karta uslugi pokazuje wylacznie
  // `unitGrosze`. Doplaty sa stale, wiec wchodza poza pasmo tolerancji.
  const extraPLN = extraGrosze / 100;
  const qty = base.qty || 1;
  const eurPln = base.eurPln || 1;
  const perPcPLN = {
    min: Math.round(base.perPcPLN.min + extraPLN) + grawerPLN,
    max: Math.round(base.perPcPLN.max + extraPLN) + grawerPLN,
  };
  const totalPLN = { min: perPcPLN.min * qty, max: perPcPLN.max * qty };
  const ln = lang === "de"
    ? [`Metallmasse des Teils: ${finalMassG.toFixed(2)} g`, `Prozessreserve 12%: ${(requiredMassG - finalMassG).toFixed(2)} g`, "Prüfung und Gussmodell-Druck", "Finish"]
    : lang === "en"
      ? [`Finished metal mass: ${finalMassG.toFixed(2)} g`, `12% process reserve: ${(requiredMassG - finalMassG).toFixed(2)} g`, "Model check and casting-pattern print", "Finish"]
      : [`Masa gotowego odlewu: ${finalMassG.toFixed(2)} g`, `Rezerwa procesowa 12%: ${(requiredMassG - finalMassG).toFixed(2)} g`, "Kontrola modelu i wydruk wzorca", "Wykończenie"];
  return {
    ...base,
    engravingPLN: grawerPLN,
    unitGrosze: unitGrosze + grawerPLN * 100,
    lineGrosze: (unitGrosze + grawerPLN * 100) * qty,
    perPcPLN,
    totalPLN,
    perPcEUR: { min: Math.round(perPcPLN.min / eurPln), max: Math.round(perPcPLN.max / eurPln) },
    totalEUR: { min: Math.round(totalPLN.min / eurPln), max: Math.round(totalPLN.max / eurPln) },
    finalMassG,
    requiredMassG,
    breakdown: [
      ...(base.breakdown || []).filter((row) => !row.divider && !row.bold),
      { label: ln[0], value: "" },
      { label: ln[1], value: "" },
      // Kwota idzie przez `fmtCost`, tak jak kazdy wiersz odziedziczony po
      // `calcNew`. Wpisana na sztywno koncowka "PLN" nie wywalala niczego:
      // klient czytajacy po angielsku albo po niemiecku widzial rozpiske,
      // w ktorej kruszec i robocizna sa w euro, a dwa wiersze nizej stoi
      // kwota w zlotowkach. Reguly walutowe pilnuje `PROJECT_RULES.md`.
      { label: ln[2], value: fmtCost(patternPreparationGrosze / 100, lang) },
      { label: ln[3], value: fmtCost(finish.extraGrosze / 100, lang) },
      // Wybrany grawer pokazuje sie takze wtedy, gdy nic nie kosztuje: "w cenie"
      // mowi, ze zamowienie przekroczylo prog, a pusty wiersz wygladalby, jakby
      // grawer wypadl z zamowienia.
      ...(grawerId !== "none" ? [{
        label: { pl: "Grawerowanie laserowe", en: "Laser engraving", de: "Lasergravur" }[lang]
          ?? "Laser engraving",
        value: grawerPLN > 0
          ? fmtCost(grawerPLN, lang)
          : ({ pl: "w cenie", en: "included", de: "inklusive" }[lang] ?? "included"),
      }] : []),
    ],
  };
}
