// ============================================================
// JEWELRY ESTIMATOR - AEJaCA Jewelry
// ============================================================
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { sciezkaJezyka } from "../../routes.js";
import { t, fmtCost, Chips, CalcCard, HeroCards, ResultHeader, ResultDisplay, NextStepPanel } from "./calcShared.jsx";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
import PolaUslugi, { poprawkiWyboru } from "../shop/PolaUslugi.jsx";
import { getService } from "../../data/orderCatalog.js";
import { trackCalc } from "../../utils/analytics.js";
import CalcToCart from "./CalcToCart.jsx";
import { useMarketRates } from "../../hooks/useMarketRates.js";
import { useGemPrices } from "../../hooks/useGemPrices.js";
import {
  METAL_PRICES, EUR_PLN, MARGIN, MATERIAL_MARKUP, REPAIR_MARGIN, TOL_LOW, TOL_HIGH,
  SERVICE_TYPES, PRODUCT_LINES, JEWELRY_TYPES, METALS, WEIGHTS, METHODS, PLATING,
  ENGRAVING_OPTIONS, normalizeEngravingId,
  GEMSTONES, STONE_SIZES, DIAMOND_CLARITY, DIAMOND_COLOR, GEM_QUALITY, CERTIFICATIONS,
  RENOVATION_SERVICES, REPAIR_SERVICES,
  REPAIR_METAL_MUL, QTY_TIERS, GENERIC_TYPES, RENOVATION_METALS, REPAIR_METALS,
  CHAIN_WEAVES, CHAIN_CLASPS, CHAIN_DEFAULT_LENGTH,
  NECKLACE_LENGTHS_WOMEN, NECKLACE_LENGTHS_MEN, BRACELET_LENGTHS,
  CHAIN_SVG_Y_WOMEN, CHAIN_SVG_Y_MEN,
} from "./jewelryConfig.js";
import { getProductType } from "./jewelry/productConfig.js";
import { calcWeight as computeWeight } from "./jewelry/WeightEngine.js";
import DimensionInputs from "./jewelry/DimensionInputs.jsx";
import WeightDisplay from "./jewelry/WeightDisplay.jsx";
import StoneComposer from "./jewelry/StoneComposer.jsx";

import {
  METAL_DENSITY, resolveMetalPricePerG, calcNew, calcChain, calcRenovation, calcRepair,
  LBL,
} from "../../pricing/jewelry.js";
import Obraz from "../Obraz.jsx";

// Re-eksport, bo SimpleJewelryCalc importuje kalkulacje stad.
export { calcNew, calcChain, calcRenovation, calcRepair };


// Map JEWELRY_TYPES ids → PRODUCT_TYPES ids (for dimension engine)
const TYPE_TO_FORM = {
  // woman line
  ring:       "ring",
  bracelet:   "bracelet",
  pendant:    "pendant",
  earrings:   "earrings",
  brooch:     "brooch",
  necklace:   null,    // no geometry model for chains/necklaces
  // men line
  signet:     "signet",
  medallion:  "pendant", // closest model
  bracelet_m: "bracelet",
  cufflinks:  null,
  tie_clip:   null,
  chain_m:    null,
  // pet line
  tag:        "pendant",
  charm:      "pendant",
  pin:        null,
  // wedding rings
  wedding_ring_w: "wedding_ring",
  wedding_ring_m: "wedding_ring",
};

const CHAIN_TYPES = new Set(["chain_m", "bracelet_m", "necklace"]);
const isChainType = (id) => CHAIN_TYPES.has(id);
const isNecklaceChain = (id) => id === "chain_m" || id === "necklace";

// ---- CHAIN BODY SILHOUETTE (SVG) ----
function ChainSilhouette({ lengthMm, gender = "women" }) {
  const yMap = gender === "men" ? CHAIN_SVG_Y_MEN : CHAIN_SVG_Y_WOMEN;
  const chainY = yMap[lengthMm] ?? (gender === "men" ? 190 : 185);
  const isMen = gender === "men";
  const lx = isMen ? 60 : 65;
  const rx = isMen ? 140 : 135;
  const connectY = isMen ? 96 : 99;

  return (
    // Dark container ensures silhouette + chain are always visible regardless of page bg
    <div className="bg-neutral-900 rounded-xl p-1 w-full">
      <svg viewBox="0 0 200 310" className="w-full h-auto" aria-hidden="true">
        {/* Body silhouette */}
        <g stroke="rgba(255,255,255,0.85)" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="100" cy="33" r="21" />
          <line x1="90" y1="54" x2="87" y2="72" />
          <line x1="110" y1="54" x2="113" y2="72" />
          {isMen ? (
            <>
              <path d="M87,72 L44,95 C36,118 35,152 39,172 C42,190 41,212 43,233 C44,250 46,265 50,278 L55,310" />
              <path d="M113,72 L156,95 C164,118 165,152 161,172 C158,190 159,212 157,233 C156,250 154,265 150,278 L145,310" />
            </>
          ) : (
            <>
              <path d="M87,72 L50,97 C42,117 40,146 44,166 C47,181 48,202 44,224 C40,246 42,264 50,276 L55,310" />
              <path d="M113,72 L150,97 C158,117 160,146 156,166 C153,181 152,202 156,224 C160,246 158,264 150,276 L145,310" />
            </>
          )}
        </g>

        {/* Guide line */}
        <line x1="18" y1={chainY} x2="182" y2={chainY}
          stroke="rgba(251,191,36,0.30)" strokeWidth="0.8" strokeDasharray="4,3" />

        {/* Chain arc */}
        <path d={`M${lx},${connectY} Q100,${chainY + 6} ${rx},${connectY}`}
          fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />

        {/* Clasp dots */}
        <circle cx={lx} cy={connectY} r="2.5" fill="#fbbf24" />
        <circle cx={rx} cy={connectY} r="2.5" fill="#fbbf24" />

        {/* Length label with solid dark background for readability */}
        <rect x="74" y={Math.min(chainY + 7, 295)} width="52" height="17" rx="8"
          fill="rgba(0,0,0,0.75)" stroke="#fbbf24" strokeWidth="1" />
        <text x="100" y={Math.min(chainY + 19, 307)} textAnchor="middle"
          fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">
          {(lengthMm / 10).toFixed(0)} cm
        </text>
      </svg>
    </div>
  );
}






const TECH_LABEL = { pl: "Biżuteria AEJaCA", en: "AEJaCA Jewelry", de: "AEJaCA Schmuck" };
const QTY_STEPPER_LBL = { pl: "Liczba sztuk", en: "Quantity", de: "Stückzahl" };

const RATE_NOTE = {
  pl: "Kursy na podstawie danych rynkowych - szczegóły w stopce strony",
  en: "Prices based on live market data - details in site footer",
  de: "Preise basierend auf Marktdaten - Details in der Fußzeile",
};

// Consigned-material (materiał powierzony) disclaimer - shown wherever the client
// declares they will supply their own precious metal. Worded in the name of the
// AEJaCA team. Reused by both the chain "from stock" mode and the supply toggle.
const CONSIGNED_NOTE = {
  pl: "Materiał powierzony: kruszec przyjmujemy na podstawie deklarowanej próby. Przy odbiorze ważymy i fotografujemy każdy element oraz weryfikujemy stop (gęstość, próba kwasowa); w razie wątpliwości proponujemy analizę w Urzędzie Probierczym przed wykonaniem (koszt po stronie Klienta). Zespół AEJaCA nie odpowiada za wady wyrobu wynikające z faktycznego składu powierzonego materiału, jeśli odbiega on od deklaracji.",
  en: "Consigned material: we accept metal based on its declared fineness. On receipt we weigh and photograph each item and verify the alloy (density, acid test); if in doubt we propose an assay at the State Assay Office before production (cost borne by the Client). The AEJaCA team is not liable for defects in the finished piece resulting from the supplied material's actual composition differing from the declaration.",
  de: "Beigestelltes Material: Wir nehmen das Metall auf Basis der angegebenen Feinheit an. Bei Annahme wiegen und fotografieren wir jedes Teil und prüfen die Legierung (Dichte, Säuretest); im Zweifel schlagen wir vor der Fertigung eine Analyse beim Punzierungsamt vor (Kosten trägt der Kunde). Das AEJaCA-Team haftet nicht für Mängel des fertigen Stücks, die sich aus einer von der Angabe abweichenden tatsächlichen Zusammensetzung des beigestellten Materials ergeben.",
};

function ConsignedNote({ lang }) {
  return (
    <div className="mt-2 flex gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2">
      <span aria-hidden="true" className="text-amber-400/80 text-xs leading-5">ⓘ</span>
      <p className="text-xs leading-relaxed text-neutral-300">
        {CONSIGNED_NOTE[lang] || CONSIGNED_NOTE.pl}
      </p>
    </div>
  );
}

/**
 * Opisy trzech uslug jubilerskich, wspolne z ich kartami w sklepie.
 * Klucze odpowiadaja identyfikatorom z `SERVICE_TYPES`.
 */
const USLUGI = {
  new: getService("jewelry_plain"),
  renovation: getService("jewelry_renovation"),
  repair: getService("jewelry_repair"),
};

export default function JewelryCalc({ lang = "pl" }) {
  const l = LBL[lang] || LBL.en;
  const { rates } = useMarketRates();
  const gemPrices = useGemPrices(); // null=loading, map otherwise
  const pln_per_eur = rates.pln_per_eur || 4.25;

  // Merge static gem metadata with dynamic EUR prices → basePLN
  const resolvedGemstones = useMemo(() =>
    GEMSTONES.map(g => {
      if (g.id === "none" || g.custom || g.basePLN === null) return g;
      const baseEur = gemPrices?.[g.id];
      if (baseEur == null) return g; // fallback to hardcoded basePLN
      return { ...g, basePLN: Math.round(baseEur * pln_per_eur) };
    }),
    [gemPrices, pln_per_eur]
  );

  // Shared
  // Karty uslug w sklepie prowadza tutaj z gotowym wyborem, zeby klient
  // nie musial drugi raz szukac tego, co juz wskazal (?service=, ?type=).
  const [searchParams] = useSearchParams();
  const urlService = searchParams.get("service");
  const urlType = searchParams.get("type");

  // Kwota wiazaca zglaszana przez CalcToCart. Gdy jest, widelki znikaja,
  // bo przedzial obok konkretnej kwoty tylko ja podwaza.
  const [bindingGrosze, setBindingGrosze] = useState(null);

  // ADRES Z PARAMETREM NIE MOZE ZMIENIC PIERWSZEGO RYSOWANIA. Strona jest
  // prerenderowana bez zapytania: serwer nie widzi `?tab=`, `?service=` ani
  // `?mode=`, wiec rysuje stan domyslny. Ustawienie innego stanu w `useState`
  // znaczylo, ze klient rysuje co innego niz przyszlo w HTML-u, React uznaje
  // to za rozjazd i wyrzuca CALE poddrzewo, zeby narysowac je od nowa.
  // Pomiar 2026-09-04: 42 bledy hydracji na `/studio/?tab=3dprint` i 38 na
  // `/jewelry/?service=new`, przy zielonym buildzie i zielonym prerenderze.
  // Dlatego link glboki przyjmujemy DOPIERO PO ZAMONTOWANIU, w efekcie:
  // pierwsze rysowanie zgadza sie z serwerem, drugie ustawia to, o co prosil
  // adres. Kosztem jest jedna klatka stanu domyslnego.
  const [serviceId, setServiceId] = useState("new");
  const [linkPrzyjety, setLinkPrzyjety] = useState(false);
  // Liczba sztuk rzadzi, prog wynika z niej (tierForQty). Bizuteria ma
  // wlasna liste progow QTY_TIERS ("1", "2-5", "6-10", "10+"), nie
  // ogolna QUANTITY_TIERS studia, wiec kazde wywolanie dostaje ja wprost.
  const [qty, setQty] = useState(1);
  const qtyId = tierForQty(qty, QTY_TIERS).id;

  // STAN POCZATKOWY TRZECH USLUG IDZIE Z KATALOGU, tego samego, ktory czytaja
  // ich karty w sklepie. Kazda ma wlasny zestaw, zeby przelaczenie uslugi nie
  // kasowalo tego, co klient ustawil w poprzedniej.
  // JEWELRY_TYPES jest pogrupowane po linii (woman/men/pet), a link ze sklepu
  // podaje sam rodzaj, wiec sprawdzamy go w calej puli.
  const [paramsNew, setParamsNew] = useState(() => ({ ...USLUGI.new.defaults }));
  useEffect(() => {
    if (linkPrzyjety) return;
    if (!urlService && !urlType) return;
    if (SERVICE_TYPES.some((x) => x.id === urlService)) setServiceId(urlService);
    if (Object.values(JEWELRY_TYPES).flat().some((x) => x.id === urlType)) {
      setParamsNew((p) => ({ ...p, typeId: urlType }));
    }
    setLinkPrzyjety(true);
  }, [linkPrzyjety, urlService, urlType]);
  const [paramsReno, setParamsReno] = useState(() => ({ ...USLUGI.renovation.defaults }));
  const [paramsRepair, setParamsRepair] = useState(() => ({ ...USLUGI.repair.defaults }));
  const zestawy = { new: paramsNew, renovation: paramsReno, repair: paramsRepair };
  const zapisy = { new: setParamsNew, renovation: setParamsReno, repair: setParamsRepair };
  // WYBOR SPOZA LISTY PRZYSTAWIAMY BEZ ZAPISU DO STANU. Rodzaj zalezy od linii,
  // wiec po przelaczeniu linii w stanie moze zostac rodzaj, ktorego ta linia
  // nie ma. Pozostale kalkulatory poprawiaja to zapisem w trakcie renderu, ale
  // tutaj po tym miejscu stoja jeszcze hooki (masa z geometrii, wycena, opis),
  // a zapis w renderze przerywa render w polowie: React zglaszal wtedy
  // "Rendered fewer hooks than expected" i gasil caly kalkulator po kliknieciu
  // lancuszka. Dlatego poprawka jest CZYSTA: `stan` to jedyne zrodlo odczytu,
  // a stan wewnetrzny doganiany jest przy nastepnym wyborze klienta.
  const poprawki = poprawkiWyboru(USLUGI[serviceId], zestawy[serviceId]);
  const params = poprawki ? { ...zestawy[serviceId], ...poprawki } : zestawy[serviceId];

  const setParam = (klucz, wartosc) => {
    if (klucz === "qtyId") { setQty(qtyForTier(wartosc, QTY_TIERS)); return; }
    // Poprawki wjezdzaja razem z wyborem, zeby stan nie zostal z wartoscia,
    // ktorej lista juz nie oferuje.
    zapisy[serviceId]((x) => ({ ...x, ...poprawki, [klucz]: wartosc }));
  };

  const stanNew = serviceId === "new" ? params : (poprawkiWyboru(USLUGI.new, paramsNew) ? { ...paramsNew, ...poprawkiWyboru(USLUGI.new, paramsNew) } : paramsNew);
  const { lineId, typeId, metalId, weightId, methodId, platingId, engravingId } = stanNew;
  const { jewTypeId: renoJewType, metalTypeId: renoMetal, services: renoServices } = paramsReno;
  const { jewTypeId: repairJewType, metalTypeId: repairMetal, repairId } = paramsRepair;

  // Geometry + client supply - productForm is derived from typeId (no separate selection needed)
  const productForm = useMemo(() => TYPE_TO_FORM[typeId] ?? null, [typeId]);
  const [dimensions, setDimensions] = useState({});     // fieldId: value
  // Reset dimensions whenever the jewelry type changes - populate defaults immediately
  useEffect(() => {
    if (!productForm) { setDimensions({}); return; }
    const pt = getProductType(productForm);
    if (!pt) { setDimensions({}); return; }
    const defaults = {};
    for (const field of pt.fields) {
      if (field.default !== undefined) {
        defaults[field.id] = field.default;
      }
    }
    setDimensions(defaults);
  }, [productForm]);
  useEffect(() => {
    setChainLengthMm(CHAIN_DEFAULT_LENGTH[typeId] ?? 450);
  }, [typeId]);
  const [clientSuppliesMetal, setClientSuppliesMetal] = useState(false);
  // Chain-specific state
  const [calcMode, setCalcMode] = useState("standard"); // "standard" | "from_stock"
  const [stockMassG, setStockMassG] = useState(15);
  const [weaveId, setWeaveId] = useState("klasyczny");
  const [claspId, setClaspId] = useState("spring");
  const [chainLengthMm, setChainLengthMm] = useState(450);
  const [chainWidthMm, setChainWidthMm] = useState(3.0); // visible chain width (mm), wire diameter auto-derived via AR
  const [weaveModal, setWeaveModal] = useState(null);
  // Stone rows - up to 10 different stone entries
  const [stoneRows, setStoneRows] = useState([
    { rowId: "row0", gemId: "none", stoneSizeId: "small", count: 1, suppliedBy: "studio",
      clarityId: "VS", colorId: "GH", qualityId: "A", certId: "none" }
  ]);


  const types = JEWELRY_TYPES[lineId] || [];

  // Live geometric weight from WeightEngine (when productForm + dimensions are set)
  const weightResult = useMemo(() => {
    if (!productForm) return null;
    const selectedMetal = METALS.find(m => m.id === metalId);
    const density = METAL_DENSITY[selectedMetal?.metal] ?? 10.5;
    const result = computeWeight(productForm, dimensions, density, weightId);
    if (!result || typeof result.nettoG !== "number" || typeof result.bruttoG !== "number") return null;
    return result;
  }, [productForm, dimensions, metalId, weightId]);

  const result = useMemo(() => {
    if (serviceId === "new") {
      if (isChainType(typeId)) {
        return calcChain({ typeId, metalId, weaveId, claspId, platingId, engravingId,
          chainLengthMm, chainWidthMm,
          clientSuppliesMetal, qtyId, qty, calcMode, stockMassG }, lang, rates);
      }
      return calcNew({ lineId, typeId, metalId, weightId, methodId, platingId,
        stoneRows, qtyId, qty, engravingId,
        clientSuppliesMetal,
        overrideWeightG: weightResult?.nettoG ?? null }, lang, rates, resolvedGemstones);
    }
    if (serviceId === "renovation") {
      return calcRenovation({ jewTypeId: renoJewType, metalTypeId: renoMetal, services: renoServices, qtyId, qty }, lang);
    }
    return calcRepair({ jewTypeId: repairJewType, metalTypeId: repairMetal, repairId, qtyId, qty }, lang);
  }, [serviceId, lineId, typeId, metalId, weightId, methodId, platingId, engravingId,
    stoneRows, qtyId, weaveId, claspId, chainLengthMm, chainWidthMm,
    clientSuppliesMetal, weightResult, calcMode, stockMassG,
    renoServices, renoJewType, renoMetal, repairId, repairJewType, repairMetal, lang, rates, resolvedGemstones]);


  let stepNum = 1;
  const step = () => String.fromCodePoint(0x2460 + stepNum++ - 1);

  // Podsumowanie wyborow stalo dotad dwa razy, przepisane slowo w slowo: raz
  // dla wyceny na maila, raz dla zapytania. Dwie kopie tego samego wyrazenia
  // rozjezdzaja sie przy pierwszej zmianie oferty i nikt tego nie zauwaza, bo
  // obie nadal generuja poprawnie wygladajacy tekst.
  const paramsSummary = useMemo(() => {
    if (serviceId === "renovation") {
      return `${t(SERVICE_TYPES[1].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === renoJewType)?.label, lang)} | ${renoServices.map(id => t(RENOVATION_SERVICES.find(s => s.id === id)?.label, lang)).join(", ")}`;
    }
    if (serviceId === "repair") {
      return `${t(SERVICE_TYPES[2].label, lang)} | ${t(GENERIC_TYPES.find(j => j.id === repairJewType)?.label, lang)} | ${t(REPAIR_SERVICES.find(r => r.id === repairId)?.label, lang)}`;
    }
    const wspolne = [
      t(PRODUCT_LINES.find(p => p.id === lineId)?.label, lang) || lineId,
      t(JEWELRY_TYPES[lineId]?.find(j => j.id === typeId)?.label, lang) || typeId,
      t(METALS.find(m => m.id === metalId)?.label, lang),
    ];
    if (isChainType(typeId)) {
      return [
        ...wspolne,
        t(CHAIN_WEAVES.find(w => w.id === weaveId)?.label, lang),
        t(CHAIN_CLASPS.find(c => c.id === claspId)?.label, lang),
        `${chainLengthMm / 10}cm`,
        calcMode === "standard" ? `${chainWidthMm}mm szer.` : `${stockMassG}g`,
        engravingId !== "none" ? t(ENGRAVING_OPTIONS.find(e => e.id === normalizeEngravingId(engravingId))?.label, lang) : null,
      ].filter(Boolean).join(" | ");
    }
    return [
      ...wspolne,
      t(METHODS.find(m => m.id === methodId)?.label, lang),
      engravingId !== "none" ? t(ENGRAVING_OPTIONS.find(e => e.id === normalizeEngravingId(engravingId))?.label, lang) : null,
      ...stoneRows.filter(r => r.gemId !== "none").map(r => {
        const gem = resolvedGemstones.find(g => g.id === r.gemId);
        const sz = STONE_SIZES.find(s => s.id === r.stoneSizeId);
        return `${r.count}× ${t(gem?.label, lang) ?? r.gemId} (${t(sz?.label, lang) ?? r.stoneSizeId})${r.suppliedBy === "client" ? " [klient]" : ""}`;
      }),
    ].filter(Boolean).join(" | ");
  }, [serviceId, lang, lineId, typeId, metalId, methodId, engravingId, stoneRows, resolvedGemstones,
      weaveId, claspId, chainLengthMm, chainWidthMm, calcMode, stockMassG,
      renoJewType, renoServices, repairJewType, repairId]);

  // Wiazaca cena ma pokrycie tylko przy odlewie prostej bryly. Kamienie,
  // lancuszki i metal powierzony przez klienta wymagaja oceny czlowieka.
  const cartBlocked = serviceId === "new" && (
    methodId !== "cast" ||
    // Lista kamieni ma zawsze co najmniej jeden wiersz, domyslnie ustawiony
    // na "bez kamienia", wiec liczy sie tresc, nie dlugosc.
    stoneRows.some((r) => r.gemId && r.gemId !== "none") ||
    isChainType(typeId) ||
    clientSuppliesMetal
  );

  // ============================================================
  // NARZEDZIA, KTORE NIE SA PYTANIAMI Z KATALOGU
  // ============================================================
  // Wymiary, splot, zapiecie, przelacznik kruszcu powierzonego i kamien
  // w oczku sygnetu nie stoja na karcie uslugi w sklepie, bo tamta droga ich
  // nie obsluguje: wycena wiazaca istnieje tylko dla odlewu prostej bryly
  // z naszego kruszcu (patrz `cartBlocked`). Wchodza wiec jako wstawki
  // i przystawki do pol, a nie jako pola katalogu. Decyzja: ADR-0037.

  const kartaWymiarow = () => (
    <>
            {isChainType(typeId) ? (() => {
              // Gender is already known from the selected product line - no separate toggle needed
              const necklaceGender = lineId === "men" ? "men" : "women";
              const necklacePresets = necklaceGender === "men" ? NECKLACE_LENGTHS_MEN : NECKLACE_LENGTHS_WOMEN;
              return (
              <div className="space-y-3">
                {/* Necklace/chain: SVG silhouette + preset lengths (gender derived from lineId) */}
                {isNecklaceChain(typeId) && (
                  <div className="flex gap-3 items-start">
                    {/* Silhouette - always dark container, always readable */}
                    <div className="w-24 sm:w-28 flex-shrink-0">
                      <ChainSilhouette lengthMm={chainLengthMm} gender={necklaceGender} />
                    </div>

                    {/* Preset length buttons */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500 mb-1.5">
                        {{ pl: "Wybierz długość", en: "Select length", de: "Länge wählen" }[lang]}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                        {necklacePresets.map(len => (
                          <button key={len} onClick={() => setChainLengthMm(len)}
                            className={`py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                              chainLengthMm === len
                                ? "border-amber-400 bg-amber-400/10 text-amber-300"
                                : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                            }`}>
                            {len / 10} cm
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bracelet: simple preset grid (no silhouette needed) */}
                {typeId === "bracelet_m" && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1.5">
                      {{ pl: "Długość bransoletki", en: "Bracelet length", de: "Armbandlänge" }[lang]}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {BRACELET_LENGTHS.map(len => (
                        <button key={len} onClick={() => setChainLengthMm(len)}
                          className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            chainLengthMm === len
                              ? "border-amber-400 bg-amber-400/10 text-amber-300"
                              : "border-white/10 text-neutral-400 hover:border-white/20"
                          }`}>
                          {len / 10} cm
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chain WIDTH input - standard mode only; wire diameter & thickness auto-derived from AR */}
                {calcMode === "standard" && (
                  <div className="mt-3 space-y-3">
                    {/* Section separator */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-neutral-500 uppercase tracking-widest px-1">
                        {{ pl: "Parametry łańcuszka", en: "Chain parameters", de: "Kettenparameter" }[lang]}
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    {/* Width input */}
                    <label className="flex flex-col gap-1.5 w-fit">
                      <span className="text-xs text-neutral-400">
                        {{ pl: "Szerokość łańcuszka (mm)", en: "Chain width (mm)", de: "Kettenbreite (mm)" }[lang]}
                      </span>
                      <input type="number" min={1.0} max={20.0} step={0.5}
                        value={chainWidthMm || ""}
                        onChange={e => { const n = parseFloat(e.target.value); if (n > 0) setChainWidthMm(n); }}
                        className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50" />
                    </label>
                    {/* Derived values - 5-cell grid */}
                    {result && result.type === "calculated" && !result.fromStock && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                        {[
                          { label: `Ø ${{ pl: "drut", en: "wire", de: "Draht" }[lang]}`, val: `${result.wireDMm?.toFixed(2)} mm` },
                          { label: { pl: "Grubość splotu", en: "Weave thickness", de: "Flechtdicke" }[lang], val: `${result.thicknessMm?.toFixed(1)} mm` },
                          { label: "AR", val: CHAIN_WEAVES.find(w => w.id === weaveId)?.ar?.toFixed(1) ?? " - " },
                          { label: "WF", val: `×${CHAIN_WEAVES.find(w => w.id === weaveId)?.weaveFactor ?? " - "}` },
                          { label: { pl: "Potrzeba kruszcu", en: "Metal needed", de: "Metall benötigt" }[lang], val: result.grossMassG != null ? `${result.grossMassG.toFixed(1)} g` : " - " },
                        ].map(d => (
                          <div key={d.label} className="text-center px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/8">
                            <div className="text-neutral-500 text-xs">{d.label}</div>
                            <div className="text-amber-300 font-semibold">{d.val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* From-stock: mass input */}
                {calcMode === "from_stock" && (
                  <div className="mt-3 space-y-3">
                    {/* Section separator */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-neutral-500 uppercase tracking-widest px-1">
                        {{ pl: "Dobór do posiadanego kruszcu", en: "From your metal stock", de: "Aus Ihrem Metallvorrat" }[lang]}
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    <div className="p-3 rounded-xl border border-white/10 bg-neutral-900 space-y-3">
                      <p className="text-xs text-neutral-300">
                        {{ pl: "Podaj masę posiadanego kruszcu - grubość drutu i wymiary łańcuszka zostaną dobrane automatycznie na podstawie AR splotu.",
                           en: "Enter your available metal mass - wire diameter and chain dimensions will be auto-calculated from weave AR.",
                           de: "Geben Sie Ihre Metallmasse ein - Drahtdurchmesser und Kettenmaße werden aus dem AR automatisch berechnet." }[lang]}
                      </p>
                      <label className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400 whitespace-nowrap">
                          {{ pl: "Masa kruszcu (g)", en: "Metal mass (g)", de: "Metallmasse (g)" }[lang]}
                        </span>
                        <input type="number" min={1} max={500} step={0.5}
                          value={stockMassG === "" ? "" : stockMassG}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "") { setStockMassG(""); return; }
                            const n = parseFloat(v);
                            if (!isNaN(n) && n >= 0) setStockMassG(n);
                          }}
                          className="w-28 bg-white/8 border border-amber-400/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/80" />
                        <span className="text-sm text-amber-400 font-bold">{stockMassG || " - "} g</span>
                      </label>
                      {/* Live derived dimensions - 5-cell grid */}
                      {result && result.type === "calculated" && result.fromStock && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {[
                            { label: { pl: "Ø drut", en: "Ø wire", de: "Ø Draht" }[lang], val: `${result.wireDMm?.toFixed(2)} mm` },
                            { label: { pl: "Szerokość", en: "Width", de: "Breite" }[lang], val: `${result.widthMm?.toFixed(1)} mm` },
                            { label: { pl: "Grubość splotu", en: "Weave thk.", de: "Flechtdicke" }[lang], val: `${result.thicknessMm?.toFixed(1)} mm` },
                            { label: "AR", val: CHAIN_WEAVES.find(w => w.id === weaveId)?.ar?.toFixed(1) ?? " - " },
                            { label: "WF", val: `×${CHAIN_WEAVES.find(w => w.id === weaveId)?.weaveFactor ?? " - "}` },
                          ].map(d => (
                            <div key={d.label} className="text-center p-1.5 rounded-lg bg-neutral-800 border border-white/8">
                              <div className="text-xs text-neutral-400">{d.label}</div>
                              <div className="text-xs text-amber-400 font-bold">{d.val}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Waste summary */}
                      {result && result.type === "calculated" && result.fromStock && result.wasteG > 0 && (
                        <div className="text-xs text-neutral-200 border-t border-white/10 pt-2">
                          {{ pl: `Z ${stockMassG} g kruszcu powstanie ${result.netMassG?.toFixed(1) ?? (stockMassG - result.wasteG).toFixed(1)} g gotowego łańcuszka - ${result.wasteG.toFixed(1)} g to nieodwracalne straty technologiczne: ubytek na topieniu (utlenianie miedzi i zgar), odpady przy ciągnieniu drutu oraz szlam i trociny z polerowania.`,
                             en: `From ${stockMassG} g you'll receive ${result.netMassG?.toFixed(1) ?? (stockMassG - result.wasteG).toFixed(1)} g as a finished chain - ${result.wasteG.toFixed(1)} g is irreversible process loss: melt/fire loss (copper oxidation + slag), wire-drawing offcuts, and polishing swarf + filings.`,
                             de: `Von ${stockMassG} g erhalten Sie ${result.netMassG?.toFixed(1) ?? (stockMassG - result.wasteG).toFixed(1)} g als fertige Kette - ${result.wasteG.toFixed(1)} g sind unwiederbringliche Prozessverluste: Schmelzverlust (Kupferoxidation + Schlacke), Drahtzieh-Verschnitt sowie Polierschlamm + Feilspäne.` }[lang]}
                        </div>
                      )}
                      <ConsignedNote lang={lang} />
                    </div>
                  </div>
                )}
              </div>
              );
            })() : (
              productForm ? (
                <div className="space-y-5">
                  {/* Show which geometry model is being used */}
                  {(() => {
                    const pt = getProductType(productForm);
                    return pt ? (
                      <p className="text-xs text-neutral-400">
                        {pt.icon} {t(pt.label, lang)} - {t(pt.notes, lang)}
                      </p>
                    ) : null;
                  })()}
                  <DimensionInputs
                    productTypeId={productForm}
                    values={dimensions}
                    onChange={(id, val) => setDimensions(prev => ({ ...prev, [id]: val }))}
                    lang={lang}
                  />

                  {/* Live weight display */}
                  {weightResult && (
                    <WeightDisplay
                      nettoG={weightResult.nettoG}
                      bruttoG={weightResult.bruttoG}
                      metalName={t(METALS.find(m => m.id === metalId)?.label, lang) ?? ""}
                      lang={lang}
                      clientSuppliesMetal={clientSuppliesMetal}
                    />
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  {{ pl: "Szczegółowe wymiary niedostępne dla tego rodzaju biżuterii.", en: "Detailed dimensions not available for this jewelry type.", de: "Detaillierte Abmessungen für diesen Schmucktyp nicht verfügbar." }[lang]}
                </p>
              )
            )}
    </>
  );

  const kartaSplotu = () => (isChainType(typeId) ? (
    <>
              {/* Splot decyduje o cenie mocniej niz cokolwiek innego w tym
                  formularzu: klasyczny ma wspolczynnik x1,0, bizantyjski x3,2.
                  Kto tego nie wie, wybiera po obrazku, a potem dziwi sie kwocie.
                  Nowa karta, bo skonfigurowana wycena zginelaby przy nawigacji
                  w tej samej. */}
              <p className="text-xs text-neutral-500 mb-2">
                {{ pl: "Kliknij dwukrotnie na zdjęcie - powiększ podgląd splotu", en: "Double-click an image to preview the weave pattern", de: "Doppelklick auf ein Bild zum Vergrößern" }[lang]}
                {" "}
                <a
                  href={sciezkaJezyka("/blog/rodzaje-splotow-lancuszkow/", lang)}
                  target="_blank"
                  rel="noopener"
                  className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  {{ pl: "Czym różnią się sploty?", en: "How do the weaves differ?", de: "Worin unterscheiden sich die Muster?" }[lang]}
                </a>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {CHAIN_WEAVES.map(w => {
                  const active = weaveId === w.id;
                  if (w.custom) {
                    return (
                      <button key={w.id} onClick={() => setWeaveId(w.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-dashed border transition-all text-xs ${
                          active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                        }`}>
                        <span className="text-lg opacity-50">?</span>
                        <span className="text-center leading-tight">{t(w.label, lang)}</span>
                      </button>
                    );
                  }
                  return (
                    <button key={w.id} onClick={() => setWeaveId(w.id)}
                      className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                        active ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[0_0_0_5px_rgba(251,191,36,0.14)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}>
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
                        onDoubleClick={e => { e.stopPropagation(); if (w.img) setWeaveModal(w.id); }}>
                        {w.img ? (
                          <Obraz sizes="(min-width: 640px) 180px, 40vw" src={w.img} alt={t(w.label, lang)} loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`} />
                        ) : (
                          <span className="text-2xl opacity-40">⛓</span>
                        )}
                        <div className={`absolute inset-0 tile-lift ${active ? "tile-lift-on" : ""}`} aria-hidden="true" />
                      </div>
                      <span className={`text-xs sm:text-xs text-center leading-tight ${active ? "text-amber-300 font-medium" : "text-neutral-400"}`}>
                        {t(w.label, lang)}
                      </span>
                      <span className="text-xs text-neutral-500">×{w.weaveFactor}</span>
                    </button>
                  );
                })}
              </div>
              {clientSuppliesMetal && !CHAIN_WEAVES.find(w=>w.id===weaveId)?.custom && (
                <div className="mt-3 p-3 rounded-xl border border-amber-400/20 bg-amber-400/5 text-xs text-amber-300">
                  {{ pl: `Odpad technologiczny splotu ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.pl}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% materiału - uwzględnij zapas przy dostarczaniu kruszcu.`,
                     en: `Weave waste for ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.en}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% - account for this when supplying metal.`,
                     de: `Webabfall für ${CHAIN_WEAVES.find(w=>w.id===weaveId)?.label.de}: ~${CHAIN_WEAVES.find(w=>w.id===weaveId)?.materialWaste}% - beim Liefern des Metalls berücksichtigen.`
                  }[lang]}
                </div>
              )}
    </>
  ) : null);

  const kartaZapiecia = () => (isChainType(typeId) ? (
    <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {CHAIN_CLASPS.map(c => {
                  const active = claspId === c.id;
                  if (c.custom) {
                    return (
                      <button key={c.id} onClick={() => setClaspId(c.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-dashed border transition-all text-xs ${
                          active ? "border-amber-400 text-amber-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
                        }`}>
                        <span className="text-lg opacity-50">?</span>
                        <span className="text-center leading-tight">{t(c.label, lang)}</span>
                      </button>
                    );
                  }
                  return (
                    <button key={c.id} onClick={() => setClaspId(c.id)}
                      className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                        active ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/60 shadow-[0_0_0_5px_rgba(251,191,36,0.14)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}>
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black">
                        {c.img ? (
                          <Obraz sizes="(min-width: 640px) 180px, 40vw" src={c.img} alt={t(c.label, lang)} loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-300 ${active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"}`} />
                        ) : (
                          <span className="text-2xl opacity-40 flex items-center justify-center h-full">🔗</span>
                        )}
                        <div className={`absolute inset-0 tile-lift ${active ? "tile-lift-on" : ""}`} aria-hidden="true" />
                      </div>
                      <span className={`text-xs sm:text-xs text-center leading-tight ${active ? "text-amber-300 font-medium" : "text-neutral-400"}`}>
                        {t(c.label, lang)}
                      </span>
                      <span className="text-xs text-neutral-500">+{c.cost} PLN</span>
                    </button>
                  );
                })}
              </div>
    </>
  ) : null);

  const przelacznikKruszcu = () => (
    <>
            {/* Client supplies metal toggle - hidden in from_stock mode (metal is always client-supplied there) */}
            {!(isChainType(typeId) && calcMode === "from_stock") && <div className="mt-4 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200
              border-white/8 hover:border-amber-400/20"
              onClick={() => setClientSuppliesMetal(v => !v)}
              style={clientSuppliesMetal ? {borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.05)'} : {}}
            >
              {/* PRZELACZNIK NIE MA W SOBIE NAPISU, tylko kolorowa kulke, wiec
                  czytnik ekranu oglaszal "przelacznik" i nic wiecej. Napis stoi
                  OBOK, a nie w srodku, wiec nazwa musi byc dopisana (ADR-0025).
                  Ta sama tresc, ktora widzi patrzacy: jedno zrodlo, nie drugi
                  slownik. */}
              <button
                type="button"
                role="switch"
                aria-checked={clientSuppliesMetal}
                aria-label={{ pl: "Kruszec od klienta", en: "Client supplies metal", de: "Metall vom Kunden" }[lang]}
                onClick={e => { e.stopPropagation(); setClientSuppliesMetal(v => !v); }}
                className={`relative shrink-0 w-10 h-5 rounded-full transition-colors duration-200 ${
                  clientSuppliesMetal ? "bg-amber-500" : "bg-neutral-700"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  clientSuppliesMetal ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
              <div>
                <div className="text-sm font-medium text-neutral-300">
                  {{ pl: "Kruszec od klienta", en: "Client supplies metal", de: "Metall vom Kunden" }[lang]}
                </div>
                {clientSuppliesMetal && (
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {{ pl: "Odejmiemy koszt metalu - dostarcz kruszec przed realizacją", en: "Metal cost excluded - supply raw metal before production", de: "Metallkosten entfallen - Rohmetall vor der Produktion liefern" }[lang]}
                  </div>
                )}
                {clientSuppliesMetal && (
                  <div onClick={e => e.stopPropagation()}>
                    <ConsignedNote lang={lang} />
                  </div>
                )}
              </div>
            </div>}
    </>
  );

  const dopiskiGraweru = () => (
    <>
            {typeId === "signet" && (
              <p className="text-xs text-neutral-500 mb-3">
                {{ pl: "Grawer nakładany jest bezpośrednio na oczko sygnetu - może współistnieć z kamieniem lub zastąpić go.",
                   en: "Engraving is applied directly to the signet bezel - it can coexist with a stone or replace it.",
                   de: "Gravur wird direkt auf den Siegelkopf aufgetragen - kann mit einem Stein kombiniert werden oder ihn ersetzen." }[lang]}
              </p>
            )}
    </>
  );

  // Kamien nie dotyczy lancucha: `calcChain` go nie zna, a wycena wiazaca i tak
  // przy kamieniach nie istnieje (patrz `cartBlocked`).
  const kartaKamienia = () => (isChainType(typeId) ? null : (
    <StoneComposer
      stoneRows={stoneRows}
      onChange={setStoneRows}
      lang={lang}
      gemstones={resolvedGemstones}
    />
  ));

  const etykietaKamienia = typeId === "signet"
    ? ({ pl: "Kamień w oczku sygnetu", en: "Stone in signet bezel", de: "Stein im Siegelkopf" }[lang] ?? l.gem)
    : l.gem;

  return (
    <div>
      {/* Step 1: Service Type */}
      {/* Wybor uslugi: to nie jest pole uslugi, tylko wybor MIEDZY trzema
          uslugami, wiec zostaje tutaj, przed lista pytan. */}
      <CalcCard stepNum="①" label={l.service} accent="amber">
        <HeroCards
          options={SERVICE_TYPES}
          value={serviceId}
          onChange={(id) => { setServiceId(id); trackCalc("jewelry", "service", id); }}
          lang={lang}
          cols="grid-cols-1 sm:grid-cols-3"
          minH={160}
          accent="amber"
        />
      </CalcCard>

      <PolaUslugi
        service={USLUGI[serviceId]}
        params={{ ...params, qtyId }}
        setParam={setParam}
        lang={lang}
        wyglad="kalkulator"
        accent="amber"
        pierwszyNumer={2}
        tierKey="qtyId"
        qty={qty}
        onQty={setQty}
        qtyMax={qtyLimit(QTY_TIERS)}
        qtyOpen={qtyOpenValue(QTY_TIERS)}
        qtyLabel={t(QTY_STEPPER_LBL, lang)}
        wstawki={[
          // Kotwica jest masywnosc, bo tam te kartki staly. Przy lancuchu
          // masywnosci nie ma, wiec wspolna warstwa przesuwa je za rodzaj.
          { po: "weightId", render: kartaWymiarow, label: isChainType(typeId)
            ? { pl: "Długość łańcuszka", en: "Chain length", de: "Kettenlänge" }[lang]
            : ({ pl: "Kształt i wymiary", en: "Shape & Dimensions", de: "Form & Abmessungen" }[lang] || "Shape & Dimensions") },
          { po: "weightId", label: { pl: "Splot łańcuszka", en: "Chain weave", de: "Kettenmuster" }[lang], render: kartaSplotu },
          { po: "weightId", label: { pl: "Zapięcie", en: "Clasp", de: "Verschluss" }[lang], render: kartaZapiecia },
          { po: "engravingId", label: etykietaKamienia, render: kartaKamienia },
        ]}
        dodatki={{
          metalId: { po: przelacznikKruszcu },
          engravingId: { przed: dopiskiGraweru, etykieta: typeId === "signet"
            ? ({ pl: "Grawerowanie oczka sygnetu", en: "Signet bezel engraving", de: "Siegelkopf-Gravur" }[lang] ?? l.engraving)
            : l.engraving },
        }}
      />

          {/* Weave image lightbox modal */}
          {weaveModal && (() => {
            const wm = CHAIN_WEAVES.find(x => x.id === weaveModal);
            if (!wm || !wm.img) return null;
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
                onClick={() => setWeaveModal(null)}>
                <div className="relative max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                  <Obraz sizes="(min-width: 640px) 180px, 40vw" src={wm.img} alt={t(wm.label, lang)}
                    className="w-full rounded-2xl shadow-2xl shadow-black/60" />
                  <div className="mt-4 text-center">
                    <p className="text-white font-bold text-xl">{t(wm.label, lang)}</p>
                    <p className="text-neutral-400 text-sm mt-1">
                      {{ pl: `AR ${wm.ar ?? " - "} · czynnik ×${wm.weaveFactor} · szer. ×${wm.widthMul ?? " - "} · gr. ×${wm.thicknessMul ?? " - "} · odpad ~${wm.materialWaste}%`,
                         en: `AR ${wm.ar ?? " - "} · factor ×${wm.weaveFactor} · width ×${wm.widthMul ?? " - "} · thk ×${wm.thicknessMul ?? " - "} · waste ~${wm.materialWaste}%`,
                         de: `AR ${wm.ar ?? " - "} · Faktor ×${wm.weaveFactor} · Breite ×${wm.widthMul ?? " - "} · Dicke ×${wm.thicknessMul ?? " - "} · Abfall ~${wm.materialWaste}%`
                      }[lang]}
                    </p>
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                    onClick={() => setWeaveModal(null)}>✕</button>
                </div>
              </div>
            );
          })()}


      {/* Result */}
      <div className="rounded-2xl border-2 border-amber-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
        <div className="mt-3 text-xs text-neutral-400 text-center italic">{l.priceSource}</div>
        <p className="text-xs text-neutral-500 mt-1 text-center">{RATE_NOTE[lang] || RATE_NOTE.pl}</p>
      </div>

      {/* Do koszyka trafia tylko to, co sklep potrafi wycenic wiazaco.
          Reszta idzie ta sama droga co dotad, tyle ze z tego samego okna. */}
      <NextStepPanel
        lang={lang}
        accent="amber"
        techLabel={t(TECH_LABEL, lang)}
        paramsSummary={paramsSummary}
        result={result}
        cartAvailable={!cartBlocked}
        rateSnapshot={{
          au: rates.au_pln_per_g,
          ag: rates.ag_pln_per_g,
          pt: rates.pt_pln_per_g,
          pln_per_eur: rates.pln_per_eur,
          sources: rates.sources,
        }}
        cart={
          <CalcToCart
            embedded
            onBinding={setBindingGrosze}
            calculator={serviceId === "renovation" ? "jewelry_renovation" : serviceId === "repair" ? "jewelry_repair" : "jewelry_new"}
            serviceId={serviceId === "renovation" ? "jewelry_renovation" : serviceId === "repair" ? "jewelry_repair" : "jewelry_plain"}
            params={
              // POZYCJA NIESIE TO, O CO PYTALISMY, czyli caly zestaw z katalogu.
              // Wypisywanie pol z reki gubilo te dodane pozniej: `complexityId`
              // pojawil sie na ekranie, a bramka ksztaltu w koszyku go nie
              // widziala, wiec zlozony wyrob przechodzil tu, a w sklepie nie.
              { ...params, qtyId }
            }
            qty={qty}
            blocked={cartBlocked}
            blockedReason="manual"
            lang={lang}
            accent="amber"
          />
        }
      />
    </div>
  );
}
