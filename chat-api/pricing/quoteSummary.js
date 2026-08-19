// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/quoteSummary.js
// Regeneracja: npm run sync:pricing

// ============================================================
// PODSUMOWANIE WYCENY, jedno dla wszystkich kalkulatorow
// ============================================================
// Do maila szedl dotad jeden string, sklejany osobno w kazdym z dziesieciu
// kalkulatorow, i obcinany na serwerze do tysiaca znakow. Nie bylo w nim
// rozpiski ceny, nie bylo ostrzezen do modelu, nie bylo zgod. Klient
// dostawal potwierdzenie, ktore nie potwierdzalo tego, co widzial na
// ekranie, a my dostawalismy kopie tego samego.
//
// Awaria byla cicha i kosztowna po miesiacach: przy sporze o wykonanie nie
// dalo sie odtworzyc, co klientowi pokazano i na co przystal. Mail wygladal
// poprawnie, tylko nie zawieral tego, co bylo potrzebne.
//
// Ten plik jest jedynym miejscem, w ktorym powstaje tekst podsumowania.
// Stoi w src/pricing/, bo `npm run sync:pricing` kopiuje go do chat-api,
// dzieki czemu ten sam slownik ustalen opisuje model w kalkulatorze i w
// mailu do zamowienia.

// ------------------------------------------------------------
// Ustalenia bramki drukowalnosci
// ------------------------------------------------------------
// Zapis w `params.printability` trzyma identyfikatory i liczby, a nie gotowe
// zdania. Tekst powstaje dopiero tutaj, w jezyku odbiorcy, dzieki czemu
// pozniejsza zmiana redakcji nie uniewaznia zapisu sprzed roku.

function num(v) {
  return Number(v).toFixed(2);
}

export const PRINT_FINDINGS = {
  pl: {
    holes: (f) => `Siatka nie jest szczelna: ${f.value} krawędzi bez pary.`,
    nonmanifold: (f) => `Siatka nie jest rozmaitością: ${f.value} krawędzi przy więcej niż dwóch ściankach.`,
    too_thin: (f) => `${Math.round((f.share || 0) * 100)}% powierzchni modelu jest cieńsze niż ${num(f.limit)} mm, czyli niż jedna ścieżka przy wybranych ustawieniach.`,
    open_surface: (f) => `Plik jest powierzchnią, a nie bryłą: ${Math.round((f.ratio || 0) * 100)}% krawędzi stanowi brzeg.`,
    too_big: (f) => `Model ${(f.value || []).map((v) => Math.round(v)).join(" x ")} mm przekracza stół roboczy.`,
    empty: () => "Plik nie zawierał geometrii.",
  },
  en: {
    holes: (f) => `The mesh is not watertight: ${f.value} unpaired edges.`,
    nonmanifold: (f) => `The mesh is not a manifold: ${f.value} edges with more than two faces.`,
    too_thin: (f) => `${Math.round((f.share || 0) * 100)}% of the model is thinner than ${num(f.limit)} mm, which is one path at the chosen settings.`,
    open_surface: (f) => `The file is a surface rather than a solid: ${Math.round((f.ratio || 0) * 100)}% of edges are boundary.`,
    too_big: (f) => `At ${(f.value || []).map((v) => Math.round(v)).join(" x ")} mm the model exceeds the build plate.`,
    empty: () => "The file contained no geometry.",
  },
  de: {
    holes: (f) => `Das Netz ist nicht geschlossen: ${f.value} Kanten ohne Gegenstück.`,
    nonmanifold: (f) => `Das Netz ist keine Mannigfaltigkeit: ${f.value} Kanten mit mehr als zwei Flächen.`,
    too_thin: (f) => `${Math.round((f.share || 0) * 100)}% des Modells sind dünner als ${num(f.limit)} mm, also dünner als eine Bahn bei den gewählten Einstellungen.`,
    open_surface: (f) => `Die Datei ist eine Fläche und kein Körper: ${Math.round((f.ratio || 0) * 100)}% der Kanten sind Rand.`,
    too_big: (f) => `Mit ${(f.value || []).map((v) => Math.round(v)).join(" x ")} mm überschreitet das Modell den Bauraum.`,
    empty: () => "Die Datei enthielt keine Geometrie.",
  },
};

/** Jedno ustalenie bramki jako zdanie. Null, gdy identyfikatora nie znamy. */
export function describeFinding(finding, lang = "pl") {
  const dict = PRINT_FINDINGS[lang] || PRINT_FINDINGS.pl;
  const fn = dict[finding?.id];
  return fn ? fn(finding) : null;
}

const L = {
  pl: {
    choices: "Wybory",
    price: "Wycena",
    perPc: "za sztukę",
    binding: "Kwota wiążąca",
    qty: "Nakład",
    pcs: "szt.",
    breakdown: "Kalkulacja",
    file: "Plik",
    scale: "skala",
    model: "Uwagi do modelu",
    seen: "klient je widział na ekranie przed wysłaniem",
    accepted: "POTWIERDZONE PRZEZ KLIENTA",
    blocker: "wymaga potwierdzenia",
    warning: "ostrzeżenie",
    tech: "Technologia",
    nozzle: "dysza",
    thinnest: "najcieńsze miejsce",
    consents: "Zgody",
    yes: "tak",
    no: "nie",
    noAuto: "Tej konfiguracji nie wyceniamy automatycznie, wycena indywidualna.",
  },
  en: {
    choices: "Choices",
    price: "Quote",
    perPc: "per piece",
    binding: "Binding amount",
    qty: "Quantity",
    pcs: "pcs",
    breakdown: "Calculation",
    file: "File",
    scale: "scale",
    model: "Model notes",
    seen: "the customer saw these on screen before sending",
    accepted: "ACKNOWLEDGED BY CUSTOMER",
    blocker: "requires acknowledgement",
    warning: "warning",
    tech: "Technology",
    nozzle: "nozzle",
    thinnest: "thinnest spot",
    consents: "Consents",
    yes: "yes",
    no: "no",
    noAuto: "This configuration is not priced automatically, individual quote.",
  },
  de: {
    choices: "Auswahl",
    price: "Kalkulation",
    perPc: "pro Stück",
    binding: "Verbindlicher Betrag",
    qty: "Menge",
    pcs: "Stk.",
    breakdown: "Berechnung",
    file: "Datei",
    scale: "Maßstab",
    model: "Hinweise zum Modell",
    seen: "der Kunde hat sie vor dem Senden auf dem Bildschirm gesehen",
    accepted: "VOM KUNDEN BESTÄTIGT",
    blocker: "bestätigungspflichtig",
    warning: "Hinweis",
    tech: "Technologie",
    nozzle: "Düse",
    thinnest: "dünnste Stelle",
    consents: "Einwilligungen",
    yes: "ja",
    no: "nein",
    noAuto: "Diese Konfiguration wird nicht automatisch kalkuliert, individuelles Angebot.",
  },
};

const CONSENT_LABELS = {
  contact: {
    pl: "Zgoda na otrzymanie wyceny i kontakt mailowy",
    en: "Consent to receive the quote and follow-up email",
    de: "Einwilligung zum Erhalt des Angebots und zur E-Mail-Kontaktaufnahme",
  },
  license: {
    pl: "Oświadczenie o prawach do przesłanego pliku",
    en: "Declaration of rights to the submitted file",
    de: "Erklärung über die Rechte an der übermittelten Datei",
  },
  printNotes: {
    pl: "Potwierdzenie uwag do modelu",
    en: "Acknowledgement of the model notes",
    de: "Bestätigung der Hinweise zum Modell",
  },
};

const TECH_NAME = { fdm: "FDM", msla: "MSLA" };

/**
 * Pelne podsumowanie wyceny jako tekst, ten sam dla klienta i dla contact@.
 *
 * Zwraca linie rozdzielone znakiem nowej linii. Szablon maila musi miec
 * `white-space: pre-line`, inaczej zlozy to w jeden akapit. Tekst pozostaje
 * wtedy kompletny, tylko gorzej sie czyta, wiec brak stylu niczego nie gubi.
 *
 * @param {object} wejscie
 * @param {string} wejscie.techLabel nazwa kalkulatora
 * @param {string} wejscie.params dotychczasowa jednolinijkowa lista wyborow
 * @param {object|null} wejscie.result wynik wyceny (perPcPLN, breakdown, ...)
 * @param {object|null} wejscie.printability zapis bramki drukowalnosci
 * @param {object|null} wejscie.file {name, scale}
 * @param {object|null} wejscie.consents {contact, license, printNotes}
 * @param {string} wejscie.lang
 */
export function buildQuoteSummary({
  techLabel = "",
  params = "",
  result = null,
  printability = null,
  file = null,
  consents = null,
  lang = "pl",
} = {}) {
  const l = L[lang] || L.en;
  const showPLN = lang === "pl";
  const out = [];

  if (techLabel) out.push(techLabel);
  if (params) out.push(`${l.choices}: ${params}`);

  // --- Cena ---
  if (result?.type === "custom") {
    out.push("", l.noAuto);
  } else if (result?.type === "calculated") {
    const pc = showPLN ? result.perPcPLN : result.perPcEUR;
    const curr = showPLN ? "PLN" : "EUR";
    out.push("");
    if (pc) out.push(`${l.price}: ${pc.min} - ${pc.max} ${curr} ${l.perPc}`);
    if (result.qty > 1) out.push(`${l.qty}: ~${result.qty} ${l.pcs}`);
    if (result.unitGrosze != null && showPLN) {
      out.push(`${l.binding}: ${(result.unitGrosze / 100).toFixed(2)} PLN ${l.perPc}`);
    }
    // Rozpiska idzie w calosci. Jest juz po rabacie rynku polskiego i nigdzie
    // go nie nazywa, dokladnie tak jak na ekranie.
    const rows = (result.breakdown || []).filter((r) => !r.divider && r.label);
    if (rows.length) {
      out.push("", `${l.breakdown}:`);
      for (const r of rows) out.push(`  ${r.label}: ${r.value}`);
    }
  }

  // --- Plik i model ---
  if (file?.name) {
    // Nazwa pliku pochodzi od klienta, a podsumowanie trafia do maila i do
    // zapisu leada. Znaki sterujace i lamiace linie wycinamy tutaj, zeby nie
    // rozjechaly ukladu ani nie udawaly kolejnej sekcji podsumowania.
    const nazwa = String(file.name).replace(/[\r\n\t]+/g, " ").slice(0, 120);
    const skala = file.scale && Math.abs(file.scale - 1) > 1e-6
      ? ` (${l.scale} ${Number(file.scale).toFixed(2)})`
      : "";
    out.push("", `${l.file}: ${nazwa}${skala}`);
  }

  if (printability) {
    const czesci = [];
    if (printability.tech) czesci.push(TECH_NAME[printability.tech] || printability.tech);
    if (printability.nozzle) czesci.push(`${l.nozzle} ${printability.nozzle}`);
    if (printability.thinnestMm != null) czesci.push(`${l.thinnest} ${num(printability.thinnestMm)} mm`);
    if (czesci.length) out.push(`${l.tech}: ${czesci.join(", ")}`);

    // Ostrzezenia ida do maila W CALOSCI, razem z informacja, ktore z nich
    // klient pokwitowal. Pokazywanie samych pokwitowanych sugerowaloby, ze
    // reszty nie bylo, a klient widzial wszystkie.
    const findings = printability.findings || [];
    if (findings.length) {
      out.push("", `${l.model} (${l.seen}):`);
      for (const f of findings) {
        const zdanie = describeFinding(f, lang) || f.id;
        const waga = f.level === "blocker" ? l.blocker : l.warning;
        const kwit = f.level === "blocker" && printability.accepted ? ` [${l.accepted}]` : "";
        out.push(`  - [${waga}] ${zdanie}${kwit}`);
      }
    }
  }

  // --- Zgody ---
  if (consents && Object.keys(consents).length) {
    const linie = Object.entries(consents)
      .filter(([klucz]) => CONSENT_LABELS[klucz])
      .map(([klucz, wartosc]) => `  - ${CONSENT_LABELS[klucz][lang] || CONSENT_LABELS[klucz].en}: ${wartosc ? l.yes : l.no}`);
    if (linie.length) out.push("", `${l.consents}:`, ...linie);
  }

  return out.join("\n");
}
