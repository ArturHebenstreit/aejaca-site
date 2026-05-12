import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const LABELS = {
  pl: {
    title: "Skład stopów jubilerskich",
    step1Label: "Wybierz metal",
    step2Label: "Wybierz kolor (złoto)",
    step3Label: "Wybierz stop",
    metalAu: "Złoto",
    metalAg: "Srebro",
    metalPt: "Platyna",
    metalPd: "Pallad",
    colorYellow: "Żółte",
    colorWhite: "Białe",
    colorRose: "Różowe",
    colorGreen: "Zielone",
    compositionTitle: "Skład chemiczny",
    propertiesTitle: "Właściwości",
    meltingLabel: "Temperatura topnienia",
    hardnessLabel: "Twardość",
    densityLabel: "Gęstość",
    notesLabel: "Uwagi",
  },
  en: {
    title: "Alloy Composition Calculator",
    step1Label: "Select metal",
    step2Label: "Select color (gold)",
    step3Label: "Select alloy",
    metalAu: "Gold",
    metalAg: "Silver",
    metalPt: "Platinum",
    metalPd: "Palladium",
    colorYellow: "Yellow",
    colorWhite: "White",
    colorRose: "Rose",
    colorGreen: "Green",
    compositionTitle: "Chemical Composition",
    propertiesTitle: "Properties",
    meltingLabel: "Melting range",
    hardnessLabel: "Hardness",
    densityLabel: "Density",
    notesLabel: "Notes",
  },
  de: {
    title: "Legierungszusammensetzung",
    step1Label: "Metall wählen",
    step2Label: "Farbe wählen (Gold)",
    step3Label: "Legierung wählen",
    metalAu: "Gold",
    metalAg: "Silber",
    metalPt: "Platin",
    metalPd: "Palladium",
    colorYellow: "Gelb",
    colorWhite: "Weiß",
    colorRose: "Rosé",
    colorGreen: "Grün",
    compositionTitle: "Chemische Zusammensetzung",
    propertiesTitle: "Eigenschaften",
    meltingLabel: "Schmelzbereich",
    hardnessLabel: "Härte",
    densityLabel: "Dichte",
    notesLabel: "Hinweise",
  },
};

const ALLOYS = [
  // === GOLD - YELLOW ===
  { id: "Au999", metal: "Au", color: "yellow", label: "Au 999 (24k)", fineness: 999,
    comp: { Au: 99.9, Ag: 0.1 },
    meltRange: [1062, 1064], hv: 20, density: 19.3,
    notes: { pl: "Czyste złoto inwestycyjne. Bardzo miękkie, nieodpowiednie do biżuterii codziennej.", en: "Investment-grade pure gold. Very soft, not suitable for daily-wear jewelry.", de: "Anlagegold. Sehr weich, nicht für täglich getragenen Schmuck geeignet." }
  },
  { id: "Au916", metal: "Au", color: "yellow", label: "Au 916 (22k)", fineness: 916,
    comp: { Au: 91.6, Ag: 5.5, Cu: 2.9 },
    meltRange: [990, 1010], hv: 55, density: 17.8,
    notes: { pl: "Tradycyjne złoto indyjskie i arabskie. Widoczna ciepła barwa, dość miękkie.", en: "Traditional Indian and Arabian gold. Warm color, relatively soft.", de: "Traditionelles indisches und arabisches Gold. Warme Farbe, relativ weich." }
  },
  { id: "Au750Y", metal: "Au", color: "yellow", label: "Au 750 żółte (18k)", fineness: 750,
    comp: { Au: 75.0, Ag: 12.5, Cu: 12.5 },
    meltRange: [880, 900], hv: 130, density: 15.5,
    notes: { pl: "Najczęściej stosowany stop w jubilerstwie europejskim. Doskonały balans między kolorem, twardością i wartością.", en: "Most common alloy in European jewelry. Excellent balance of color, hardness and value.", de: "Häufigste Legierung in der europäischen Schmuckherstellung. Ausgezeichnete Balance aus Farbe, Härte und Wert." }
  },
  { id: "Au585Y", metal: "Au", color: "yellow", label: "Au 585 żółte (14k)", fineness: 585,
    comp: { Au: 58.5, Ag: 10.0, Cu: 31.5 },
    meltRange: [855, 875], hv: 155, density: 13.1,
    notes: { pl: "Popularny w Polsce, USA i Niemczech. Dobra twardość, lekko cieplejsza barwa niż 18k.", en: "Popular in Poland, USA and Germany. Good hardness, slightly warmer color than 18k.", de: "Beliebt in Polen, USA und Deutschland. Gute Härte, etwas wärmere Farbe als 18k." }
  },
  { id: "Au375Y", metal: "Au", color: "yellow", label: "Au 375 żółte (9k)", fineness: 375,
    comp: { Au: 37.5, Ag: 42.5, Cu: 20.0 },
    meltRange: [830, 860], hv: 135, density: 11.6,
    notes: { pl: "Standard rynku brytyjskiego. Najniższy tytuł z pełnoprawnymi cechami jubilerskimi.", en: "British market standard. Lowest hallmark-grade gold alloy.", de: "Britischer Marktstandard. Niedrigster Feingehalt mit vollwertigen Schmuckstempeln." }
  },
  // === GOLD - WHITE ===
  { id: "Au750W", metal: "Au", color: "white", label: "Au 750 białe (18k, Pd)", fineness: 750,
    comp: { Au: 75.0, Pd: 12.5, Ag: 8.5, Cu: 4.0 },
    meltRange: [910, 940], hv: 145, density: 15.9,
    notes: { pl: "Pallad-białe złoto — bez niklu, hipoalergiczne. Standard EU. Często rodowane dla bielszego wyglądu.", en: "Palladium white gold — nickel-free, hypoallergenic. EU standard. Often rhodium-plated for whiter appearance.", de: "Palladium-Weißgold — nickelfrei, hypoallergen. EU-Standard. Oft rhodiniert für weißeres Aussehen." }
  },
  { id: "Au585W", metal: "Au", color: "white", label: "Au 585 białe (14k)", fineness: 585,
    comp: { Au: 58.5, Pd: 8.0, Ag: 28.5, Cu: 5.0 },
    meltRange: [870, 900], hv: 140, density: 13.8,
    notes: { pl: "Ekonomiczna alternatywa dla 18k białego. Wymaga rodowania — bez warstwy Rh ma żółtawy odcień.", en: "Economical alternative to 18k white. Requires rhodium plating — without Rh layer has yellowish tint.", de: "Wirtschaftliche Alternative zu 18k Weiß. Benötigt Rhodinierung — ohne Rh-Schicht gelblicher Ton." }
  },
  // === GOLD - ROSE ===
  { id: "Au750R", metal: "Au", color: "rose", label: "Au 750 różowe (18k)", fineness: 750,
    comp: { Au: 75.0, Cu: 22.5, Ag: 2.5 },
    meltRange: [890, 910], hv: 165, density: 15.2,
    notes: { pl: "Ciepły różowy odcień od wyższej zawartości miedzi. Twardsze niż żółte 18k.", en: "Warm pinkish tone from higher copper content. Harder than yellow 18k.", de: "Warmer Rosaton durch höheren Kupferanteil. Härter als gelbes 18k." }
  },
  { id: "Au585R", metal: "Au", color: "rose", label: "Au 585 różowe (14k)", fineness: 585,
    comp: { Au: 58.5, Cu: 37.0, Ag: 4.5 },
    meltRange: [845, 870], hv: 185, density: 13.4,
    notes: { pl: "Intensywny różowo-czerwony odcień. Bardzo twarde, odporne na zarysowania. Popularne w biżuterii rosyjskiej.", en: "Intense rose-red tone. Very hard, scratch-resistant. Popular in Russian-style jewelry.", de: "Intensiver Rosé-Rotton. Sehr hart und kratzfest. Beliebt im russischen Schmuckstil." }
  },
  // === GOLD - GREEN ===
  { id: "Au750G", metal: "Au", color: "green", label: "Au 750 zielone (18k, elektrum)", fineness: 750,
    comp: { Au: 75.0, Ag: 25.0 },
    meltRange: [880, 900], hv: 80, density: 15.8,
    notes: { pl: "Elektrum — złoto-srebro bez miedzi. Subtelny zielonawy odcień, rzadko stosowane, ale efektowne w biżuterii artystycznej.", en: "Electrum — gold-silver without copper. Subtle greenish tint, rarely used but striking in artistic jewelry.", de: "Elektrum — Gold-Silber ohne Kupfer. Subtiler Grünton, selten verwendet, aber eindrucksvoll in Kunstschmuck." }
  },
  // === SILVER ===
  { id: "Ag999", metal: "Ag", color: null, label: "Ag 999 (fine silver)", fineness: 999,
    comp: { Ag: 99.9 },
    meltRange: [960, 962], hv: 25, density: 10.49,
    notes: { pl: "Czyste srebro. Zbyt miękkie do większości biżuterii — używane w emalierstwie i platerach.", en: "Pure silver. Too soft for most jewelry — used in enameling and plating.", de: "Reines Silber. Zu weich für die meisten Schmuckstücke — verwendet in der Emaillierung und Beschichtung." }
  },
  { id: "Ag958", metal: "Ag", color: null, label: "Ag 958 (Britannia)", fineness: 958,
    comp: { Ag: 95.8, Cu: 4.2 },
    meltRange: [940, 955], hv: 50, density: 10.43,
    notes: { pl: "Wyższy standard niż Sterling. Bielsza barwa, mniej podatna na czernienie. Popularna w Wielkiej Brytanii.", en: "Higher standard than Sterling. Whiter color, less prone to tarnishing. Popular in the UK.", de: "Höherer Standard als Sterling. Weißere Farbe, weniger anfällig für Anlaufen. In Großbritannien beliebt." }
  },
  { id: "Ag925", metal: "Ag", color: null, label: "Ag 925 (Sterling)", fineness: 925,
    comp: { Ag: 92.5, Cu: 7.5 },
    meltRange: [893, 905], hv: 65, density: 10.36,
    notes: { pl: "Globalny standard srebra jubilerskiego. Dobra twardość, podatna na oksydację (patynę). Cecha: 925.", en: "Global standard for jewelry silver. Good hardness, susceptible to oxidation (patina). Hallmark: 925.", de: "Weltstandard für Schmucksilber. Gute Härte, anfällig für Oxidation (Patina). Stempel: 925." }
  },
  { id: "Ag800", metal: "Ag", color: null, label: "Ag 800 (srebro monetarne)", fineness: 800,
    comp: { Ag: 80.0, Cu: 20.0 },
    meltRange: [779, 900], hv: 100, density: 10.18,
    notes: { pl: "Historyczne srebro monetarne. Twardsze od Sterlinga, wyraźnie żółtawsze. Używane w Niemczech do 1970.", en: "Historical coin silver. Harder than Sterling, noticeably more yellowish. Used in Germany until 1970.", de: "Historisches Münzsilber. Härter als Sterling, deutlich gelblicher. In Deutschland bis 1970 verwendet." }
  },
  // === PLATINUM ===
  { id: "Pt950", metal: "Pt", color: null, label: "Pt 950", fineness: 950,
    comp: { Pt: 95.0, Ru: 5.0 },
    meltRange: [1738, 1769], hv: 90, density: 21.4,
    notes: { pl: "Dominujący stop platynowy w jubilerstwie. Naturalnie biały, nigdy nie blaknie. Wymaga specjalistycznych narzędzi.", en: "Dominant platinum alloy in jewelry. Naturally white, never fades. Requires specialized tools.", de: "Dominante Platinlegierung im Schmuckbereich. Natürlich weiß, verblasst nie. Erfordert Spezialwerkzeug." }
  },
  { id: "Pt900", metal: "Pt", color: null, label: "Pt 900", fineness: 900,
    comp: { Pt: 90.0, Ir: 10.0 },
    meltRange: [1720, 1755], hv: 110, density: 21.1,
    notes: { pl: "Platyna z irydem — twardsza niż Pt950. Używana w Japonii i USA do wyrobów precyzyjnych.", en: "Platinum with iridium — harder than Pt950. Used in Japan and USA for precision pieces.", de: "Platin mit Iridium — härter als Pt950. Wird in Japan und den USA für Präzisionsstücke verwendet." }
  },
  // === PALLADIUM ===
  { id: "Pd950", metal: "Pd", color: null, label: "Pd 950", fineness: 950,
    comp: { Pd: 95.0, Ru: 5.0 },
    meltRange: [1520, 1555], hv: 75, density: 11.9,
    notes: { pl: "Lekka alternatywa dla platyny i białego złota. Naturalnie biały, hipoalergiczny, tańszy od Pt.", en: "Lightweight alternative to platinum and white gold. Naturally white, hypoallergenic, cheaper than Pt.", de: "Leichte Alternative zu Platin und Weißgold. Natürlich weiß, hypoallergen, günstiger als Pt." }
  },
];

const ELEMENT_NAMES = {
  Au: { pl: "Złoto", en: "Gold", de: "Gold" },
  Ag: { pl: "Srebro", en: "Silver", de: "Silber" },
  Cu: { pl: "Miedź", en: "Copper", de: "Kupfer" },
  Pd: { pl: "Pallad", en: "Palladium", de: "Palladium" },
  Pt: { pl: "Platyna", en: "Platinum", de: "Platin" },
  Ru: { pl: "Ruten", en: "Ruthenium", de: "Ruthenium" },
  Ir: { pl: "Iryd", en: "Iridium", de: "Iridium" },
  Zn: { pl: "Cynk", en: "Zinc", de: "Zink" },
};

const ELEMENT_COLORS = {
  Au: "text-amber-400",
  Ag: "text-slate-300",
  Cu: "text-orange-400",
  Pd: "text-blue-300",
  Pt: "text-purple-300",
  Ru: "text-emerald-300",
  Ir: "text-cyan-300",
  Zn: "text-yellow-300",
};

const COLOR_SWATCHES = {
  yellow: "#FFD700",
  white: "#E8E8E8",
  rose: "#F4A460",
  green: "#C8D96B",
};

const METALS = ["Au", "Ag", "Pt", "Pd"];
const GOLD_COLORS = ["yellow", "white", "rose", "green"];

export default function AlloyCompositionCalc() {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS.pl;

  const [selectedMetal, setSelectedMetal] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedAlloyId, setSelectedAlloyId] = useState(null);

  const metalLabels = { Au: L.metalAu, Ag: L.metalAg, Pt: L.metalPt, Pd: L.metalPd };
  const colorLabels = { yellow: L.colorYellow, white: L.colorWhite, rose: L.colorRose, green: L.colorGreen };

  const filteredAlloys = ALLOYS.filter((a) => {
    if (a.metal !== selectedMetal) return false;
    if (selectedMetal === "Au" && selectedColor && a.color !== selectedColor) return false;
    return true;
  });

  const selectedAlloy = ALLOYS.find((a) => a.id === selectedAlloyId) || null;

  function handleMetalSelect(metal) {
    setSelectedMetal(metal);
    setSelectedColor(null);
    setSelectedAlloyId(null);
  }

  function handleColorSelect(color) {
    setSelectedColor(color);
    setSelectedAlloyId(null);
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Metal group */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.step1Label}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METALS.map((m) => (
            <button
              key={m}
              onClick={() => handleMetalSelect(m)}
              className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                selectedMetal === m
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/50 hover:text-white"
              }`}
            >
              {metalLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Color (gold only) */}
      {selectedMetal === "Au" && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.step2Label}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GOLD_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handleColorSelect(c)}
                className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all duration-200 flex items-center gap-2 ${
                  selectedColor === c
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/50 hover:text-white"
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0 border border-white/20"
                  style={{ background: COLOR_SWATCHES[c] }}
                />
                {colorLabels[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Alloy select */}
      {selectedMetal && (selectedMetal !== "Au" || selectedColor) && filteredAlloys.length > 0 && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs uppercase tracking-widest text-amber-400 mb-3">{L.step3Label}</div>
          <div className="flex flex-wrap gap-2">
            {filteredAlloys.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAlloyId(a.id)}
                className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  selectedAlloyId === a.id
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-400/50 hover:text-white"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result card */}
      {selectedAlloy && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-amber-400/20 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap">
            {selectedAlloy.color && (
              <span
                className="inline-block w-4 h-4 rounded-full border border-white/20 shrink-0"
                style={{ background: COLOR_SWATCHES[selectedAlloy.color] || "#888" }}
              />
            )}
            <h3 className="text-xl font-bold text-white">{selectedAlloy.label}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-400/20">
              {selectedAlloy.fineness}&thinsp;‰
            </span>
          </div>

          {/* Composition */}
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{L.compositionTitle}</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {Object.entries(selectedAlloy.comp).map(([el, pct]) => (
                <div key={el} className="flex items-center gap-2">
                  <span className={`font-mono font-bold text-sm w-6 ${ELEMENT_COLORS[el] || "text-neutral-300"}`}>{el}</span>
                  <span className="text-neutral-400 text-xs flex-1">
                    {(ELEMENT_NAMES[el] || {})[lang] || (ELEMENT_NAMES[el] || {}).en || el}
                  </span>
                  <span className="font-mono text-sm text-white tabular-nums">{pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical properties */}
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{L.propertiesTitle}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-neutral-800/60 rounded-xl p-3">
                <div className="text-neutral-400 text-xs mb-1">{L.meltingLabel}</div>
                <div className="text-white font-mono font-semibold text-sm">
                  {selectedAlloy.meltRange[0]}–{selectedAlloy.meltRange[1]} °C
                </div>
              </div>
              <div className="bg-neutral-800/60 rounded-xl p-3">
                <div className="text-neutral-400 text-xs mb-1">{L.hardnessLabel}</div>
                <div className="text-white font-mono font-semibold text-sm">{selectedAlloy.hv} HV</div>
              </div>
              <div className="bg-neutral-800/60 rounded-xl p-3">
                <div className="text-neutral-400 text-xs mb-1">{L.densityLabel}</div>
                <div className="text-white font-mono font-semibold text-sm">{selectedAlloy.density} g/cm³</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-4">
            <div className="text-xs uppercase tracking-widest text-amber-400 mb-2">{L.notesLabel}</div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              {selectedAlloy.notes[lang] || selectedAlloy.notes.pl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
