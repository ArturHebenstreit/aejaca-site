// ============================================================
// WYCENA I ZAMOWIENIA, logika po stronie serwera
// ============================================================
// Zasada nadrzedna: cena, ktora obciazamy klienta, nigdy nie pochodzi
// z przegladarki. Przegladarka przysyla wylacznie parametry i plik,
// a kwote liczy tutaj ten sam kod, ktory kalkulator pokazuje na stronie
// (chat-api/pricing/, generowane z src/pricing/).

import crypto from "node:crypto";

import { parseMeshAsync, MeshError, SUPPORTED_EXTENSIONS, extensionOf } from "./pricing/mesh.js";
import * as print3d from "./pricing/print3d.js";
import * as jewelry from "./pricing/jewelry.js";
import * as laserCo2 from "./pricing/laserCo2.js";
import * as laserFiber from "./pricing/laserFiber.js";
import * as epoxy from "./pricing/epoxy.js";
import * as cadDesign from "./pricing/cadDesign.js";

/** Limit obrotu dzialalnosci nierejestrowanej, od 2026-01-01 rozliczany kwartalnie */
export const QUARTERLY_LIMIT_GROSZE = 1_081_350; // 10 813,50 PLN

/** Prog, od ktorego przestajemy przyjmowac nowe platnosci w danym kwartale */
export const QUARTERLY_SAFETY_MARGIN_GROSZE = 20_000; // 200 PLN zapasu

/**
 * Rejestr kalkulatorow dostepnych w kreatorze.
 * `needsFile` oznacza, ze bez pliku klienta wycena nie ma sensu.
 */
export const CALCULATORS = {
  print3d_fdm:        { fn: print3d.calculate,      needsFile: false, label: { pl: "Druk 3D FDM", en: "FDM 3D print", de: "FDM-3D-Druck" } },
  print3d_msla:       { fn: print3d.calculateMSLA,  needsFile: false, label: { pl: "Druk żywiczny MSLA", en: "MSLA resin print", de: "MSLA-Harzdruck" } },
  jewelry_new:        { fn: jewelry.calcNew,        needsFile: false, label: { pl: "Biżuteria na zamówienie", en: "Made-to-order jewelry", de: "Schmuck nach Maß" } },
  jewelry_chain:      { fn: jewelry.calcChain,      needsFile: false, label: { pl: "Łańcuszek", en: "Chain", de: "Kette" } },
  jewelry_renovation: { fn: jewelry.calcRenovation, needsFile: false, label: { pl: "Renowacja biżuterii", en: "Jewelry renovation", de: "Schmuckaufarbeitung" } },
  jewelry_repair:     { fn: jewelry.calcRepair,     needsFile: false, label: { pl: "Naprawa biżuterii", en: "Jewelry repair", de: "Schmuckreparatur" } },
  laser_co2_engrave:  { fn: laserCo2.calcEngrave,   needsFile: false, label: { pl: "Grawer laserowy CO2", en: "CO2 laser engraving", de: "CO2-Lasergravur" } },
  laser_co2_cut:      { fn: laserCo2.calcCut,       needsFile: false, label: { pl: "Cięcie laserem CO2", en: "CO2 laser cutting", de: "CO2-Laserschnitt" } },
  laser_fiber:        { fn: laserFiber.calculate,   needsFile: false, label: { pl: "Znakowanie laserem fiber", en: "Fiber laser marking", de: "Faserlaser-Markierung" } },
  epoxy:              { fn: epoxy.calculate,        needsFile: false, label: { pl: "Odlew żywiczny", en: "Resin casting", de: "Harzguss" } },
  cad_design:         { fn: cadDesign.calculate,    needsFile: false, label: { pl: "Projekt 3D (CAD)", en: "3D design (CAD)", de: "3D-Entwurf (CAD)" } },
};

/** Kalkulatory, w ktorych plik klienta zastepuje wybor rozmiaru */
const FILE_AWARE = new Set(["print3d_fdm", "print3d_msla"]);

const MAX_FILE_BYTES = 60 * 1024 * 1024;

export class PricingError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Geometria z pliku klienta, liczona na serwerze.
 * Przegladarka liczy to samo dla podgladu, ale jej wynikowi nie ufamy,
 * bo jest o jedno `fetch` od podmiany.
 */
export async function geometryFromFile(buffer, fileName = "") {
  if (!buffer || !buffer.length) throw new PricingError("file_empty", "Pusty plik");
  if (buffer.length > MAX_FILE_BYTES) throw new PricingError("file_too_large", "Plik przekracza 60 MB");

  const ext = extensionOf(fileName);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new PricingError("unsupported_format", `Format .${ext} nie jest jeszcze obsługiwany w wycenie automatycznej`);
  }

  let parsed;
  try {
    parsed = await parseMeshAsync(buffer, fileName);
  } catch (e) {
    if (e instanceof MeshError) throw new PricingError(e.code, e.message);
    throw new PricingError("file_unreadable", `Nie udało się odczytać pliku .${ext}`);
  }

  if (!parsed.triangleCount) throw new PricingError("file_unreadable", "Plik nie zawiera geometrii");
  if (!(parsed.volumeCm3 > 0)) throw new PricingError("file_not_solid", "Model nie jest bryłą zamkniętą, nie da się policzyć objętości");
  assertPlausibleScale(parsed.bbox, ext);

  return {
    volumeCm3: parsed.volumeCm3,
    bbox: parsed.bbox,
    surfaceAreaCm2: parsed.surfaceAreaCm2,
    triangleCount: parsed.triangleCount,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    // Trojkatow nie zwracamy, bo to megabajty danych, ktorych zamowienie nie potrzebuje.
  };
}

/**
 * STL i OBJ nie zapisuja jednostki, wiec przyjmujemy milimetry. Eksport
 * z programu ustawionego na metry albo cale daje model tysiac razy za duzy
 * lub za maly, a wtedy cena jest bez sensu w obie strony. Lapiemy to tutaj
 * i kazemy poprawic eksport, zamiast wystawic rachunek na tysiac zlotych
 * za breloczek.
 *
 * @param {{x:number,y:number,z:number}} bbox gabaryty w centymetrach
 */
function assertPlausibleScale(bbox, ext) {
  // 3MF i STEP deklaruja jednostke w pliku, wiec nie ma czego zgadywac.
  if (ext === "3mf" || ext === "step" || ext === "stp") return;
  const maxCm = Math.max(bbox.x, bbox.y, bbox.z);
  if (maxCm < 0.05) {
    throw new PricingError("scale_suspect", "Model ma poniżej 0,5 mm w każdym wymiarze. Sprawdź jednostki w eksporcie, pliki STL i OBJ zapisujemy w milimetrach.");
  }
  if (maxCm > 200) {
    throw new PricingError("scale_suspect", "Model przekracza 2 m. Sprawdź jednostki w eksporcie, pliki STL i OBJ zapisujemy w milimetrach.");
  }
}

/** Skalowanie geometrii, gdy klient zmienil skale wydruku w kreatorze */
function scaleGeometry(geometry, scale) {
  const s = Number(scale);
  if (!Number.isFinite(s) || s <= 0 || s > 20) throw new PricingError("bad_scale", "Nieprawidłowa skala");
  if (s === 1) return geometry;
  return {
    ...geometry,
    volumeCm3: geometry.volumeCm3 * s * s * s,
    bbox: { x: geometry.bbox.x * s, y: geometry.bbox.y * s, z: geometry.bbox.z * s },
    surfaceAreaCm2: geometry.surfaceAreaCm2 * s * s,
  };
}

/**
 * Wiazaca wycena pojedynczej pozycji.
 *
 * @param {object} input
 * @param {string} input.calculator klucz z CALCULATORS
 * @param {object} input.params     parametry wyboru klienta
 * @param {string} input.lang       pl | en | de
 * @param {object} [input.geometry] wynik geometryFromFile, gdy pozycja ma plik
 * @param {number} [input.scale]    skala wydruku
 * @param {object} [input.rates]    kursy kruszcow dla bizuterii
 */
export function priceItem({ calculator, params, lang = "pl", geometry = null, scale = 1, rates = null }) {
  const entry = CALCULATORS[calculator];
  if (!entry) throw new PricingError("unknown_calculator", `Nieznany kalkulator: ${calculator}`);
  if (!params || typeof params !== "object") throw new PricingError("bad_params", "Brak parametrów");

  const safeLang = ["pl", "en", "de"].includes(lang) ? lang : "pl";

  const callParams = { ...params };
  // Cokolwiek klient przyslal jako geometrie, nadpisujemy wlasnym odczytem pliku.
  delete callParams.stlData;
  if (geometry && FILE_AWARE.has(calculator)) {
    callParams.stlData = scaleGeometry(geometry, scale);
  }
  // Kursy kruszcow ida TRZECIM ARGUMENTEM, a nie w parametrach.
  //
  // `calcNew` i `calcChain` maja sygnature (params, lang, rates), wiec kurs
  // wlozony do obiektu parametrow byl po cichu ignorowany: destrukturyzacja
  // go nie wymienia. Przegladarka liczyla wtedy cene z biezacego kursu, a
  // serwer, ktory wystawia kwote wiazaca, z wartosci zapasowej z konfiguracji.
  // Rozjazd nie rzucal bledu i nie bylo go widac w niczym poza kwota.
  const callRates = rates && calculator.startsWith("jewelry_") ? rates : undefined;

  let result;
  try {
    result = entry.fn(callParams, safeLang, callRates);
  } catch (e) {
    throw new PricingError("calc_failed", `Wycena nie powiodła się: ${e.message}`);
  }

  if (!result) throw new PricingError("incomplete_params", "Parametry są niekompletne");
  if (result.type === "custom") throw new PricingError("needs_quote", "Ta konfiguracja wymaga indywidualnej wyceny");
  if (!result.unitGrosze) throw new PricingError("no_price", "Kalkulator nie zwrócił kwoty wiążącej");

  const qty = Number(result.qty) || 1;
  const unitGrosze = result.unitGrosze;

  return {
    calculator,
    title: entry.label[safeLang] || entry.label.pl,
    qty,
    unitGrosze,
    lineGrosze: unitGrosze * qty,
    // Widelki zostaja wylacznie informacyjnie, do pokazania klientowi skad wynika cena.
    estimateRange: { minPLN: result.perPcPLN?.min ?? null, maxPLN: result.perPcPLN?.max ?? null },
    totalTimeH: result.totalTimeH ?? null,
    breakdown: result.breakdown ?? null,
    // Projekt 3D niesie limit poprawek w cenie. Zamowienie musi go zapamietac,
    // bo od niego zalezy, czy kolejna runda jest platna.
    revisionsIncluded: result.revisionsIncluded ?? null,
  };
}

/** Obrot zaksiegowany w biezacym kwartale, w groszach */
export async function quarterRevenueGrosze(pool) {
  if (!pool) return 0;
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(total_grosze), 0)::bigint AS grosze
       FROM orders
      WHERE paid_at >= date_trunc('quarter', NOW())
        AND status NOT IN ('cancelled','refunded')`
  );
  return Number(rows[0]?.grosze ?? 0);
}

/**
 * Czy zamowienie o tej kwocie zmiesci sie w limicie kwartalnym.
 *
 * Przekroczenie 10 813,50 PLN oznacza obowiazek rejestracji dzialalnosci,
 * wiec blokujemy platnosc zamiast przyjac ja i miec problem. Zamowienie
 * zostaje jako wycena, klient dostaje informacje o terminie.
 */
export async function checkQuarterlyLimit(pool, amountGrosze) {
  const used = await quarterRevenueGrosze(pool);
  const ceiling = QUARTERLY_LIMIT_GROSZE - QUARTERLY_SAFETY_MARGIN_GROSZE;
  const remaining = Math.max(0, ceiling - used);
  return {
    ok: used + amountGrosze <= ceiling,
    usedGrosze: used,
    remainingGrosze: remaining,
    limitGrosze: QUARTERLY_LIMIT_GROSZE,
  };
}

/**
 * OrderID dla Autopay. Dokumentacja zabrania powtorzenia tej wartosci
 * przez caly okres swiadczenia uslugi, wiec skladamy date z losowym
 * sufiksem i dodatkowo pilnujemy unikalnosci ograniczeniem UNIQUE w bazie.
 * Dozwolone znaki: alfanumeryczne oraz - i _, dlugosc do 32.
 */
export function generateOrderRef(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `AE${stamp}-${rand}`;
}

export function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}
