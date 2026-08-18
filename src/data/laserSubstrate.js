// ============================================================
// NA CZYM GRAWERUJEMY, CZYLI PODLOZE USLUGI LASEROWEJ
// ============================================================
// Do tej pory bylo tu jedno pole logiczne `ownMaterial`: material nasz albo
// powierzony. Jedna wartosc opisywala DWIE rozne sytuacje warsztatowe, ktore
// nie maja ze soba wiele wspolnego:
//
//   - klient przysyla SWOJ PRZEDMIOT (talerzyki, deska, zegarek, bizuteria)
//   - klient przysyla SWOJ MATERIAL w arkuszach albo plytach
//
// Skutkiem sklejenia ich w jedno bylo to, ze przy grawerze na bizuterii klienta
// dalo sie wybrac "wasz material", czyli kombinacje bez sensu. Wlasciciel
// zglosil to wprost. Poprawiamy to na poziomie MODELU, a nie formularza:
// zly stan ma byc niewyrazalny, a nie ukryty.
//
// REGULA WLASCICIELA, 2026-08-18:
//   przedmiot klienta  -> nasz material NIE ISTNIEJE jako wybor; deklaracja
//                         dostarczenia; nadmiarowa sztuka na proby
//   material klienta   -> deklaracja dostarczenia; nadmiar materialu na proby
//   material nasz      -> klient opisuje, na jakim KONKRETNIE materiale
//                         usluga ma byc wykonana; nic nie przysyla
//
// DLACZEGO NADMIAR. Parametry lasera dobiera sie probnie na tym samym
// podlozu, bo moc, predkosc i liczba przejsc zaleza od tworzywa, grubosci
// i wykonczenia. Bez sztuki na proby pierwszy strzal idzie w wyrob koncowy.
// Przyklad wlasciciela: grawer na pieciu talerzykach znaczy szesc talerzykow
// w paczce, piaty jako wyrob, szosty na proby.
//
// FURTKA DLA RZECZY JEDYNEJ. Obraczka po babci nie ma szostej sztuki i nigdy
// nie bedzie miala. Wymog bezwarunkowy zablokowalby zamowienia, ktore dzis
// realnie przyjmujemy, wiec przy PRZEDMIOCIE klienta wolno zamiast nadmiaru
// zadeklarowac, ze rzecz jest niepowtarzalna, i zgodzic sie na probe
// w miejscu niewidocznym. Przy MATERIALE tej furtki nie ma: arkusz z definicji
// da sie doloczyc z zapasem.

const L = (pl, en, de) => ({ pl, en, de });

/** Uslugi, ktorych to dotyczy. Poza ta lista pole podloza nie istnieje. */
export const USLUGI_LASEROWE = ["laser_co2_engrave", "laser_co2_cut", "laser_fiber"];

export const SUBSTRATE_LABEL = L("Na czym pracujemy", "What we work on", "Worauf wir arbeiten");

export const SUBSTRATES = [
  {
    id: "own_item",
    przysyla: true,
    dopuszczaJedyna: true,
    label: L("Na moim przedmiocie", "On my own item", "Auf meinem Objekt"),
    note: L(
      "Talerzyki, deska, zegarek, bizuteria. Przysylasz nam rzecz, ktora mamy oznaczyc.",
      "Plates, a board, a watch, jewelry. You send us the thing we are to mark.",
      "Teller, ein Brett, eine Uhr, Schmuck. Sie senden uns das zu markierende Objekt.",
    ),
  },
  {
    id: "own_stock",
    przysyla: true,
    dopuszczaJedyna: false,
    label: L("Na moim materiale", "On my own material", "Auf meinem Material"),
    note: L(
      "Arkusz, plyta, pasek. Przysylasz material, z ktorego mamy wykonac wyrob.",
      "A sheet, a panel, a strip. You send the material we are to work from.",
      "Eine Platte, ein Bogen, ein Streifen. Sie senden das Material, aus dem wir fertigen.",
    ),
  },
  {
    id: "our_stock",
    przysyla: false,
    dopuszczaJedyna: false,
    label: L("Na waszym materiale", "On your material", "Auf Ihrem Material"),
    note: L(
      "Material nasz. Napisz, na jakim konkretnie ma byc wykonana usluga.",
      "We supply the material. Tell us exactly which one the job should use.",
      "Wir liefern das Material. Sagen Sie uns genau, welches verwendet werden soll.",
    ),
  },
];

export const SPARE_LABEL = L("Sztuka na proby", "Test piece", "Probestueck");

export const SPARE_OPTIONS = [
  {
    id: "extra",
    tylkoPrzedmiot: false,
    label: L(
      "Dosylam sztuke ponad zamowienie",
      "I am sending one extra piece",
      "Ich sende ein Stueck zusaetzlich",
    ),
    note: L(
      "Przy pieciu sztukach do grawerowania przysylasz szesc: piec na wyrob, szosta na proby parametrow.",
      "For five pieces to engrave you send six: five for the job, the sixth for parameter tests.",
      "Bei fuenf zu gravierenden Stuecken senden Sie sechs: fuenf fuer die Arbeit, das sechste fuer Tests.",
    ),
  },
  {
    id: "unique",
    tylkoPrzedmiot: true,
    label: L(
      "Przedmiot jest niepowtarzalny, zgadzam sie na probe w miejscu niewidocznym",
      "The item is one of a kind, I accept a test in a hidden spot",
      "Das Objekt ist einzigartig, ich akzeptiere einen Test an verdeckter Stelle",
    ),
    note: L(
      "Parametry dobierzemy na spodzie albo na krawedzi. Bez proby nie ma pewnego graweru.",
      "We set the parameters on the underside or an edge. Without a test there is no safe engraving.",
      "Wir stellen die Parameter an der Unterseite oder Kante ein. Ohne Test keine sichere Gravur.",
    ),
  },
];

/** Ile znakow musi miec opis materialu, gdy material jest NASZ. */
export const MIN_MATERIAL_NOTE = 6;

/**
 * Podloze pozycji, z tolerancja dla koszykow zapisanych PRZED ta zmiana.
 *
 * Koszyk zapisany w przegladarce przezywa wdrozenie, wiec w obiegu sa
 * pozycje ze starym polem `ownMaterial`. Bez tego przelozenia klient
 * z odlozonym koszykiem dostalby blad przy platnosci za wybor, ktorego
 * juz nie widzi. Stare `true` znaczylo "moj material, przysle go", wiec
 * najblizszym odpowiednikiem jest material klienta.
 */
export function substrateOf(item) {
  if (!item) return null;
  const p = item.params || {};
  if (p.podloze && SUBSTRATES.some((s) => s.id === p.podloze)) return p.podloze;
  if (p.ownMaterial === true || p.ownMaterial === "true") return "own_stock";
  if (p.ownMaterial === false || p.ownMaterial === "false") return "our_stock";
  return null;
}

/** Czy ta usluga w ogole ma podloze do wyboru. */
export function jestLaserowa(item) {
  return USLUGI_LASEROWE.includes(String(item?.calculator || ""));
}

/** Sposoby proby dozwolone przy danym podlozu. */
export function spareOptionsFor(substrate) {
  const s = SUBSTRATES.find((x) => x.id === substrate);
  if (!s || !s.przysyla) return [];
  return SPARE_OPTIONS.filter((o) => !o.tylkoPrzedmiot || s.dopuszczaJedyna);
}

/**
 * Czy pozycja jest kompletna pod wzgledem podloza.
 *
 * Zwraca `null`, gdy wszystko sie zgadza, albo kod braku. Ta sama funkcja
 * liczy w przegladarce i na serwerze: dwie kopie tej reguly rozjechalyby sie
 * przy pierwszej zmianie, a objawem bylby blad dopiero przy platnosci, czyli
 * w najgorszym mozliwym miejscu.
 */
export function brakPodloza(item) {
  if (!jestLaserowa(item)) return null;
  const substrate = substrateOf(item);
  if (!substrate) return "substrate_required";

  const s = SUBSTRATES.find((x) => x.id === substrate);
  const p = item.params || {};

  if (s.przysyla) {
    const dozwolone = spareOptionsFor(substrate).map((o) => o.id);
    if (!dozwolone.includes(String(p.spare || ""))) return "spare_required";
    return null;
  }

  // Material nasz: "cos z drewna" nie jest zamowieniem. Bez nazwy materialu
  // pracownia i tak musi napisac do klienta, zanim cokolwiek zacznie.
  if (String(p.materialNote || "").trim().length < MIN_MATERIAL_NOTE) return "material_note_required";
  return null;
}

/**
 * Czy klient ma nam cos przyslac z powodu wybranego podloza.
 *
 * Czyta to `inboundDelivery.js`, zeby deklaracja sposobu dostarczenia
 * wlaczala sie z tego samego zrodla, z ktorego wynika sam obowiazek.
 */
export function podlozeWymagaPrzesylki(item) {
  const substrate = substrateOf(item);
  return Boolean(SUBSTRATES.find((x) => x.id === substrate)?.przysyla);
}
