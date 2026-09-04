import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Zap, SlidersHorizontal, Info } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { trackCalc } from "../utils/analytics.js";
import SimpleStudioCalc from "./calculators/SimpleStudioCalc.jsx";
import { ADVANCED_TAB } from "../data/advancedOptions.js";
import { handoffFor } from "../data/calcHandoff.js";
import Print3DCalc from "./calculators/Print3DCalc.jsx";
import CO2LaserCalc from "./calculators/CO2LaserCalc.jsx";
import FiberLaserCalc from "./calculators/FiberLaserCalc.jsx";
import EpoxyCastCalc from "./calculators/EpoxyCastCalc.jsx";
import MetalCastCalc from "./calculators/MetalCastCalc.jsx";
import Obraz from "./Obraz.jsx";

// DRUK ZYWICZNY NIE MA WLASNEGO KAFELKA (polecenie wlasciciela, 2026-08-21).
// Wybor FDM albo MSLA stoi juz w pierwszym kroku kalkulatora druku, wiec osobny
// kafelek pytal o to samo drugi raz, tylko wczesniej i mniej czytelnie: klient
// musial wiedziec, ze "Druk zywiczny" i "MSLA" to jedno, zanim cokolwiek zobaczyl.
// Zostaja cztery kafelki, po jednej maszynie kazdy.
const TECHS = [
  { id: "3dprint",     labelKey: "tab3d",    descKey: "desc3d",    img: "/img/calc/studio/3dprint.webp" },
  { id: "co2_laser",   labelKey: "tabCO2",   descKey: "descCO2",   img: "/img/calc/studio/co2_laser.webp" },
  { id: "fiber_laser", labelKey: "tabFiber", descKey: "descFiber", img: "/img/calc/studio/fiber_laser.webp" },
  { id: "epoxy",       labelKey: "tabEpoxy", descKey: "descEpoxy", img: "/img/calc/studio/epoxy.webp" },
  // Odlew z metalu szlachetnego stoi tu, a nie w kalkulatorze jubilerskim,
  // bo w sklepie ta usluga nalezy do sTuDiO: droga wiedzie przez model 3D
  // i wydruk wzorca, a nie przez prace przy warsztacie jubilerskim.
  { id: "metal_cast",  labelKey: "tabCast",  descKey: "descCast",  img: "/img/shop/service/precious_metal_casting.webp" },
];

const LABELS = {
  pl: { tag: "Kalkulatory Projektów", title: "Estymator Kosztów",
    modeSimple: "Szybka wycena",
    modeSimpleDesc: "5 prostych pytań: dla każdego",
    modeAdvanced: "Dla zaawansowanych",
    modeAdvancedDesc: "Pełna kontrola parametrów",
    modeHint: "Szybka wycena to wstępny koszt w 30 sekund. Tryb zaawansowany pozwala wrzucić plik STL/SVG, wybrać materiał, wymiar i wykończenie: pełna kontrola.",
    tab3d: "Druk 3D", tabCO2: "Laser CO2", tabFiber: "Laser Fiber", tabMSLA: "Druk żywiczny", tabEpoxy: "Odlewy żywiczne", tabCast: "Odlew w metalu",
    desc3d: "Bambu Lab H2D: FDM i multi-materiał", descCO2: "xTool P2 55W: grawerowanie i cięcie", descFiber: "Raycus 30W: metal, biżuteria, kamień, ceramika", descMSLA: "Saturn 4 Ultra 16K: figurki, wzorce jubilerskie", descEpoxy: "Żywica UV/dwukomponentowa: odlewy artystyczne", descCast: "Srebro i złoto: odlew z wzorca, modelu 3D albo pomysłu",
    note: 'Widełki są szacunkiem i zależą od geometrii, złożoności i specyfikacji. Kwota wiążąca, jeśli się pojawi, jest policzona z wgranego pliku i obowiązuje 7 dni. Opcje "niestandardowe" wyceniamy indywidualnie.',
    vat: "Kwoty w kalkulatorze są orientacyjne. Wiążąca jest dopiero kwota dodana do koszyka: obowiązuje 7 dni i to ona jest podstawą zamówienia.",
    shipping: "Ceny nie uwzględniają kosztów transportu." },
  en: { tag: "Project Calculators", title: "Cost Estimator",
    modeSimple: "Quick quote",
    modeSimpleDesc: "5 simple questions: for everyone",
    modeAdvanced: "For advanced users",
    modeAdvancedDesc: "Full control over parameters",
    modeHint: "Quick quote gives an upfront estimate in 30 seconds. Advanced mode lets you upload an STL/SVG file, pick material, size, and finish: full control.",
    tab3d: "3D Print", tabCO2: "CO2 Laser", tabFiber: "Fiber Laser", tabMSLA: "Resin Print", tabEpoxy: "Resin Casting", tabCast: "Metal Casting",
    desc3d: "Bambu Lab H2D: FDM & multi-material", descCO2: "xTool P2 55W: engraving & cutting", descFiber: "Raycus 30W: metal, jewelry, stone & ceramics", descMSLA: "Saturn 4 Ultra 16K: figurines, jewelry patterns", descEpoxy: "UV/2K resin: artistic casting", descCast: "Silver and gold: cast from a pattern, 3D model or idea",
    note: "The range is an estimate and depends on geometry, complexity and specification. A binding amount, when shown, is calculated from your uploaded file and holds for 7 days. Custom options are quoted individually.",
    vat: "Amounts in the calculator are indicative. Only the amount added to the cart is binding: it holds for 7 days and the order is based on it.",
    shipping: "Prices do not include shipping costs." },
  de: { tag: "Projektkalkulatoren", title: "Kostenschätzer",
    modeSimple: "Schnellkalkulation",
    modeSimpleDesc: "5 einfache Fragen: für jeden",
    modeAdvanced: "Für Fortgeschrittene",
    modeAdvancedDesc: "Volle Kontrolle über Parameter",
    modeHint: "Schnellkalkulation liefert einen Vorab-Preis in 30 Sekunden. Der erweiterte Modus erlaubt den Upload von STL/SVG-Dateien, Materialwahl, Maße und Finish: volle Kontrolle.",
    tab3d: "3D-Druck", tabCO2: "CO2-Laser", tabFiber: "Faserlaser", tabMSLA: "Harzdruck", tabEpoxy: "Harzguss", tabCast: "Metallguss",
    desc3d: "Bambu Lab H2D: FDM & Multi-Material", descCO2: "xTool P2 55W: Gravur & Schnitt", descFiber: "Raycus 30W: Metall, Schmuck, Stein & Keramik", descMSLA: "Saturn 4 Ultra 16K: Figuren, Gussmodelle", descEpoxy: "UV/2K-Harz: Kunstguss", descCast: "Silber und Gold: Guss aus Modell, 3D-Datei oder Idee",
    note: 'Die Spanne ist eine Schätzung und hängt von Geometrie, Komplexität und Spezifikation ab. Ein verbindlicher Betrag, sofern angezeigt, wird aus Ihrer Datei berechnet und gilt 7 Tage. "Individuelle" Optionen kalkulieren wir separat.',
    vat: "Die Beträge im Kalkulator sind Richtwerte. Verbindlich ist erst der Betrag im Warenkorb: er gilt 7 Tage und ist die Grundlage der Bestellung.",
    shipping: "Preise verstehen sich ohne Versandkosten." },
};

// ODNOSNIKI DO ZNIESIONEGO KAFELKA ZOSTAJA ZYWE. `?tab=resin_msla` stoi
// w karcie uslugi w sklepie, w mapie opcji zaawansowanych i w linkach, ktore
// ktos moze miec u siebie. Gdyby przestal byc rozpoznawany, panel otwieralby
// sie w szybkiej wycenie na druku FDM i nikt by nie zglosil bledu: strona
// dziala, tylko trafia gdzie indziej.
const ALIASY_TECH = { resin_msla: { tech: "3dprint", printTech: "msla" } };

const VALID_TABS = new Set([...TECHS.map(t => t.id), ...Object.keys(ALIASY_TECH)]);

export default function StudioCalculator() {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const urlCo2Mode = searchParams.get("co2mode");

  const deepLinked = urlTab && VALID_TABS.has(urlTab);
  const alias = deepLinked ? ALIASY_TECH[urlTab] : null;
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
  const [mode, setMode] = useState("simple");
  const [activeTech, setActiveTech] = useState("3dprint");
  // Odnosnik na druk zywiczny ma otworzyc kalkulator druku OD RAZU na MSLA.
  // Bez tego klient ladowalby na FDM i musial przestawiac sam, czyli dokladnie
  // w miejscu, z ktorego wlasnie przyszedl.
  const [printTech, setPrintTech] = useState("fdm");
  // Raz, a nie po kazdym renderze: bez tego przelaczenie kafelka reczne
  // wracaloby na kafelek z adresu przy najblizszej zmianie stanu.
  const [linkPrzyjety, setLinkPrzyjety] = useState(false);
  useEffect(() => {
    if (!deepLinked || linkPrzyjety) return;
    setMode("advanced");
    setActiveTech(alias?.tech || urlTab);
    if (alias?.printTech) setPrintTech(alias.printTech);
    setLinkPrzyjety(true);
  }, [deepLinked, linkPrzyjety, urlTab, alias]);
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;

  useEffect(() => {
    if (!deepLinked) return;
    const t = setTimeout(() => {
      const el = document.getElementById("file-upload");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, [deepLinked]);

  useEffect(() => {
    const handler = () => {
      setMode("simple");
      setTimeout(() => {
        const el = document.getElementById("simple-upload");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    };
    window.addEventListener("studio-quick-upload", handler);
    return () => window.removeEventListener("studio-quick-upload", handler);
  }, []);

  // Przejscie z szybkiej wyceny do trybu zaawansowanego MUSI trafic w te
  // sama usluge. Bez mapowania klient liczacy grawer ladowal na druku 3D
  // i szukal swojej zakladki od nowa, czyli kara za skorzystanie z rady.
  // Paczka z plikiem czeka na kalkulator, ktory sie za chwile zamontuje.
  // Kasuje ja ten, kto ja przejmie, wiec plik nie wraca przy kazdym powrocie
  // do zakladki i da sie go normalnie usunac.
  const [handoff, setHandoff] = useState(null);

  const openAdvanced = (tech, paczka = null) => {
    const tab = ADVANCED_TAB[tech];
    // TA SAMA MAPA CO PRZY ODNOSNIKU. `ADVANCED_TAB` dalej wskazuje na
    // `resin_msla`, bo szybka wycena zna te usluge pod ta nazwa. Bez
    // przepuszczenia jej przez aliasy klient klikajacy "tryb zaawansowany"
    // przy wydruku z zywicy dostawalby PUSTY panel: zakladka o tym
    // identyfikatorze nie ma juz swojej galezi, wiec nie renderuje sie nic,
    // a strona wyglada na sprawna.
    if (tab) {
      const cel = ALIASY_TECH[tab] || { tech: tab };
      setActiveTech(cel.tech);
      setPrintTech(cel.printTech || "fdm");
    }
    setHandoff(paczka);
    setMode("advanced");
    trackCalc("studio", "mode", "advanced_from_simple");
    setTimeout(() => {
      const el = document.getElementById("calculator");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const isSimple = mode === "simple";
  const accentClass = isSimple ? "text-emerald-400" : "text-blue-400";

  return (
    <section id="calculator" className={`py-20 px-4 transition-colors duration-500 ${isSimple ? "bg-gradient-to-b from-neutral-950 via-emerald-950/10 to-neutral-950" : "bg-neutral-950"}`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className={`text-xs uppercase tracking-[0.2em] mb-3 ${accentClass}`}>{l.tag}</div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">{l.title}</h2>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => { setMode("simple"); trackCalc("studio", "mode", "simple"); }}
            className={`group p-4 rounded-xl border text-left transition-all duration-200 ${
              isSimple
                ? "border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-400/20"
                : "border-white/10 bg-white/[0.02] hover:border-white/30"
            }`}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className={`w-4 h-4 ${isSimple ? "text-emerald-300" : "text-neutral-400"}`} />
              <div className={`text-sm font-bold ${isSimple ? "text-emerald-300" : "text-white"}`}>{l.modeSimple}</div>
            </div>
            <div className={`text-xs ${isSimple ? "text-emerald-400/80" : "text-neutral-400"}`}>{l.modeSimpleDesc}</div>
          </button>
          <button
            onClick={() => { setMode("advanced"); trackCalc("studio", "mode", "advanced"); }}
            className={`group p-4 rounded-xl border text-left transition-all duration-200 ${
              !isSimple
                ? "border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20"
                : "border-white/10 bg-white/[0.02] hover:border-white/30"
            }`}>
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className={`w-4 h-4 ${!isSimple ? "text-blue-300" : "text-neutral-400"}`} />
              <div className={`text-sm font-bold ${!isSimple ? "text-blue-300" : "text-white"}`}>{l.modeAdvanced}</div>
            </div>
            <div className={`text-xs ${!isSimple ? "text-blue-400/80" : "text-neutral-400"}`}>{l.modeAdvancedDesc}</div>
          </button>
        </div>

        {/* Mode hint: clarifies when to use each (audit: UX friction) */}
        <div className="mb-6 flex items-start gap-2 px-3 text-xs text-neutral-400 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
          <span>{l.modeHint}</span>
        </div>

        {/* SIMPLE MODE */}
        {isSimple && (
          <div className="rounded-2xl p-5 sm:p-6 border border-emerald-400/10 bg-emerald-400/[0.02]">
            <SimpleStudioCalc lang={lang} onAdvanced={openAdvanced} />
          </div>
        )}

        {/* ADVANCED MODE */}
        {!isSimple && (
          <>
            {/* Technology tiles */}
            {/* Piaty kafelek nie moze zostac sam w drugim wierszu, wiec siatka
                idzie na piec kolumn od duzego ekranu i trzy na tablecie. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              {TECHS.map(({ id, labelKey, descKey, img }) => {
                const active = activeTech === id;
                return (
                  <button key={id}
                    onClick={() => { setActiveTech(id); trackCalc("studio", "tech_tab", id); }}
                    className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden min-h-[140px] ${
                      active ? "border-blue-400 ring-2 ring-blue-400/60 shadow-[0_0_0_6px_rgba(96,165,250,0.16)]" : "border-white/10 hover:border-white/30"
                    }`}>
                    {img && (
                      <div className="absolute inset-0 overflow-hidden">
                        <Obraz sizes="(min-width: 640px) 180px, 40vw" src={img} alt={l[labelKey]} loading="lazy"
                          className={`w-full h-full object-cover transition-all duration-500 ${active ? "scale-105" : "tile-dim opacity-60 group-hover:opacity-100 group-hover:scale-105"}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />
                        <div className={`absolute inset-0 tile-lift ${active ? "tile-lift-on" : ""}`} aria-hidden="true" />
                        {active && <div className="absolute inset-0 bg-blue-400/10 mix-blend-overlay" />}
                      </div>
                    )}
                    <div className="relative p-3 h-full min-h-[140px] flex flex-col justify-end">
                      <div className={`text-xs sm:text-sm font-bold mb-1 drop-shadow-lg tile-ink ${active ? "text-blue-300" : "text-white"}`}>{l[labelKey]}</div>
                      <div className="text-xs text-neutral-200 break-words drop-shadow-md tile-ink">{l[descKey]}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="glass-blue rounded-2xl p-5 sm:p-6">
              {/* `key` wymusza przemontowanie przy zmianie technologii druku. `initialTech`
                  jest tylko wartoscia poczatkowa stanu, wiec sama zmiana propa nie
                  przestawilaby juz zamontowanego kalkulatora: klient przychodzacy po
                  wydruk z zywicy trafialby na FDM, a plik z szybkiej wyceny wladowalby
                  sie w niewlasciwa polowe kalkulatora. */}
              {activeTech === "3dprint" && <Print3DCalc key={printTech} lang={lang} initialTech={printTech} handoff={handoffFor(handoff, "mesh")} onHandoffUsed={() => setHandoff(null)} />}
              {activeTech === "co2_laser" && <CO2LaserCalc lang={lang} initialMode={urlCo2Mode === "cut" ? "cut" : "engrave"} handoff={handoffFor(handoff, "vector")} onHandoffUsed={() => setHandoff(null)} />}
              {activeTech === "fiber_laser" && <FiberLaserCalc lang={lang} handoff={handoffFor(handoff, "vector")} onHandoffUsed={() => setHandoff(null)} />}
              {activeTech === "epoxy" && <EpoxyCastCalc lang={lang} />}
              {activeTech === "metal_cast" && <MetalCastCalc lang={lang} />}
            </div>
          </>
        )}

        {/* Kwota orientacyjna kontra wiazaca, plus transport. O VAT tu nie
            mowimy: kwoty w kalkulatorze sa tymi, ktore klient placi. */}
        <div className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed text-center ${
          isSimple
            ? "border-emerald-400/10 bg-emerald-400/[0.02] text-emerald-400/60"
            : "border-blue-400/10 bg-blue-400/[0.02] text-blue-400/60"
        }`}>
          {l.vat} {l.shipping}
        </div>

        {/* Footer note */}
        <div className="mt-2 p-4 rounded-xl border border-white/5 bg-white/[0.01] text-xs text-neutral-400 leading-relaxed">
          <strong className="text-neutral-400">sTuDiO:</strong> {l.note}
        </div>
      </div>
    </section>
  );
}
