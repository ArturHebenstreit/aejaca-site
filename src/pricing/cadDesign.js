// ============================================================
// PROJEKTOWANIE 3D (CAD), rdzen cenowy
// ============================================================
// Cena projektu to cena czasu, a czas zalezy od dwoch rzeczy: zlozonosci
// bryly i liczby rund poprawek. Pierwsza jest widoczna od razu, druga
// dopiero w trakcie, i to ona zjada marze przy wycenie ryczaltowej.
// Dlatego rundy sa jawna pozycja cennika, a nie ukrytym ryzykiem.
//
// Nie ma tu stawki godzinowej. Klient nie wie, ile godzin zajmuje jego
// pomysl, wiec kazda liczba, ktora by wybral, bylaby negocjacja od nowa.
// Zlozonosc opisana przykladami jest dla niego czytelna, a dla nas
// rozstrzygalna.

import { applyPricing, t, fmtCost } from "./config.js";

export const CAD_CONFIG = {
  /** Rundy poprawek w cenie podstawowej */
  REVISIONS_INCLUDED: 2,
  /** Doplata za kazda kolejna runde, liczona od ceny bazowej */
  EXTRA_REVISION_RATE: 0.15,
  /** Minimalny termin. Nie ma stawki ekspresowej: przy jednoosobowym
   *  warsztacie ekspres oznacza przesuniecie czyjegos innego zlecenia. */
  MIN_LEAD_DAYS: 3,

  /**
   * Ile z oplaty projektowej odliczamy, gdy klient zamowi u nas wykonanie.
   *
   * Sens tej zasady: dla klienta, ktory naprawde zamawia, projekt jest
   * darmowy, a dla zbierajacego darmowe koncepcje po pieciu pracowniach
   * juz nie. Zamienia nieodplatne doradztwo w zaliczke.
   *
   * Zmiana na 0.5 daje odliczenie polowy. Zmiana na 0 wylacza mechanizm.
   */
  CREDIT_RATE: 1.0,
  /** Ile dni od zaplaty za projekt odliczenie pozostaje wazne */
  CREDIT_DAYS: 90,
};

export const LBL = {
  pl: {
    complexity: "Złożoność projektu", deliverables: "Zakres plików",
    revisions: "Rundy poprawek", base: "Projekt bazowy",
    extraRevisions: "Poprawki ponad limit", filesUplift: "Rozszerzony zakres plików",
    estCost: "Koszt szacunkowy", leadTime: "Termin realizacji",
    included: "w cenie", days: "dni roboczych",
    creditNote: "Kwota do odliczenia przy zamówieniu wykonania",
  },
  en: {
    complexity: "Design complexity", deliverables: "Deliverables",
    revisions: "Revision rounds", base: "Base design",
    extraRevisions: "Revisions beyond the limit", filesUplift: "Extended deliverables",
    estCost: "Estimated cost", leadTime: "Lead time",
    included: "included", days: "business days",
    creditNote: "Credited against a production order",
  },
  de: {
    complexity: "Komplexität des Entwurfs", deliverables: "Dateiumfang",
    revisions: "Korrekturrunden", base: "Basisentwurf",
    extraRevisions: "Korrekturen über dem Limit", filesUplift: "Erweiterter Dateiumfang",
    estCost: "Geschätzte Kosten", leadTime: "Lieferzeit",
    included: "inklusive", days: "Werktage",
    creditNote: "Wird auf einen Fertigungsauftrag angerechnet",
  },
};

/**
 * Progi zlozonosci. Kwoty odpowiadaja widelkom z oferty B2B, wziete ze
 * srodka przedzialu, bo cena wiazaca musi byc jedna liczba.
 */
export const CAD_COMPLEXITY = [
  {
    id: "simple", baseCost: 500, days: 3,
    label: { pl: "Prosty", en: "Simple", de: "Einfach" },
    sub: {
      pl: "gładka obrączka, sygnet, prosty wisiorek, powtarzalna część techniczna",
      en: "plain band, signet, simple pendant, repeatable technical part",
      de: "glatter Ring, Siegelring, einfacher Anhänger, wiederholbares technisches Teil",
    },
  },
  {
    id: "medium", baseCost: 750, days: 4,
    label: { pl: "Średni", en: "Medium", de: "Mittel" },
    sub: {
      pl: "oprawy pod kamienie, relief, faktura, mechanizm z tolerancjami",
      en: "stone settings, relief, texture, mechanism with tolerances",
      de: "Steinfassungen, Relief, Struktur, Mechanismus mit Toleranzen",
    },
  },
  {
    // Najwyzszy prog nie ma ceny z automatu. Przy formie rzezbiarskiej czas
    // pracy zalezy od tego, jak daleko klient ma sprecyzowany pomysl, a tego
    // nie widac w zadnym parametrze. Ryczalt bylby albo strata, albo
    // zaporowa kwota liczona na wszelki wypadek.
    id: "sculptural", baseCost: 1050, days: 5, needsQuote: true,
    label: { pl: "Rzeźbiarski (wysoka złożoność)", en: "Sculptural (high complexity)", de: "Skulptural (hohe Komplexität)" },
    sub: {
      pl: "ażur, filigran, forma organiczna, projekt od szkicu",
      en: "openwork, filigree, organic form, design from a sketch",
      de: "Durchbruch, Filigran, organische Form, Entwurf aus Skizze",
    },
  },
];

/**
 * Zakres plikow. STEP to plik, z ktorym klient moze pojsc do dowolnego
 * wykonawcy, wiec ma wlasna cene. STL sam w sobie wystarcza, zeby
 * wydrukowac u nas.
 */
export const CAD_DELIVERABLES = [
  {
    id: "stl", uplift: 0,
    label: { pl: "STL", en: "STL", de: "STL" },
    sub: { pl: "plik gotowy do druku", en: "print-ready file", de: "druckfertige Datei" },
  },
  {
    id: "stl_step", uplift: 0.15,
    label: { pl: "STL + STEP", en: "STL + STEP", de: "STL + STEP" },
    sub: { pl: "plik edytowalny w każdym CAD", en: "editable in any CAD", de: "in jedem CAD bearbeitbar" },
  },
  {
    id: "full", uplift: 0.30,
    label: { pl: "Komplet", en: "Full set", de: "Komplettpaket" },
    sub: {
      pl: "STL, STEP, render i raport wymiarowy",
      en: "STL, STEP, render and dimensional report",
      de: "STL, STEP, Render und Maßbericht",
    },
  },
];

/** Ile rund poprawek klient bierze z gory. Kolejne mozna dokupic pozniej. */
export const CAD_REVISIONS = [
  { id: "2", rounds: 2, label: { pl: "2 (w cenie)", en: "2 (included)", de: "2 (inklusive)" } },
  { id: "3", rounds: 3, label: { pl: "3", en: "3", de: "3" } },
  { id: "4", rounds: 4, label: { pl: "4", en: "4", de: "4" } },
];

/** Doplata za jedna dodatkowa runde, w groszach. Uzywana takze przy doplacie po fakcie. */
export function extraRevisionGrosze(complexityId) {
  const tier = CAD_COMPLEXITY.find((c) => c.id === complexityId);
  if (!tier) return 0;
  return Math.round(tier.baseCost * CAD_CONFIG.EXTRA_REVISION_RATE * 100);
}

/**
 * @param {object} params
 * @param {string} params.complexityId
 * @param {string} params.deliverablesId
 * @param {string} [params.revisionsId]
 * @param {string} lang
 */
export function calculate({ complexityId, deliverablesId, revisionsId = "2" }, lang = "pl") {
  const tier = CAD_COMPLEXITY.find((c) => c.id === complexityId);
  const files = CAD_DELIVERABLES.find((d) => d.id === deliverablesId);
  const rev = CAD_REVISIONS.find((r) => r.id === String(revisionsId));
  if (!tier || !files || !rev) return null;
  if (tier.needsQuote) return { type: "custom" };

  const l = LBL[lang] || LBL.en;

  const base = tier.baseCost;
  const filesUplift = base * files.uplift;
  const extraRounds = Math.max(0, rev.rounds - CAD_CONFIG.REVISIONS_INCLUDED);
  const revisionsCost = base * CAD_CONFIG.EXTRA_REVISION_RATE * extraRounds;

  // Praca projektowa nie ma kosztu materialu, wiec marza i rabat rynku
  // polskiego nie maja tu czego korygowac. Kwota z progu jest cena koncowa.
  const baseCost = base + filesUplift + revisionsCost;
  const pricing = applyPricing(baseCost, 0, 0, 1, 0);

  // Kazda platna runda przesuwa termin o kolejny dzien roboczy.
  const leadDays = tier.days + extraRounds;

  return {
    type: "calculated",
    ...pricing,
    qty: 1,
    discount: 0,
    leadDays,
    revisionsIncluded: rev.rounds,
    extraRevisionGrosze: extraRevisionGrosze(complexityId),
    breakdown: [
      { label: l.base, value: fmtCost(base, lang) },
      ...(filesUplift > 0 ? [{ label: l.filesUplift, value: fmtCost(filesUplift, lang) }] : []),
      {
        label: l.revisions,
        value: extraRounds > 0
          ? `${rev.rounds} (${fmtCost(revisionsCost, lang)})`
          : `${rev.rounds} ${t({ pl: "w cenie", en: "included", de: "inklusive" }, lang)}`,
      },
      { label: l.leadTime, value: `${leadDays} ${l.days}` },
      { divider: true },
      // Rabat rynku polskiego nie ma tu zastosowania: nie ma kosztu materialu,
      // ktory mozna by skorygowac, a kwota z progu jest juz cena koncowa.
      { label: l.estCost, value: fmtCost(baseCost, lang), bold: true },
    ],
  };
}
