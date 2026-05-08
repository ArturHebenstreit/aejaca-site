// ============================================================
// LASER MATERIAL MATRIX
// Reference table of laser cutting/engraving parameters.
// Static data — not a price calculator.
// ============================================================
import { useState, useMemo } from "react";
import { Chips } from "./calcShared.jsx";

const MATRIX = [
  // CO2 — Plywood
  { mat: "plywood",   thick: 3,  laser: "co2",   power: 60,  speed: 20,  passes: 1, note: { pl: "sosna/brzoza",      en: "pine/birch",       de: "Kiefer/Birke" } },
  { mat: "plywood",   thick: 6,  laser: "co2",   power: 80,  speed: 10,  passes: 2, note: { pl: "brzoza",            en: "birch",            de: "Birke" } },
  // CO2 — Acrylic
  { mat: "acrylic",   thick: 3,  laser: "co2",   power: 70,  speed: 15,  passes: 1, note: { pl: "lany (cast)",       en: "cast acrylic",     de: "gegossenes Acryl" } },
  { mat: "acrylic",   thick: 6,  laser: "co2",   power: 85,  speed: 8,   passes: 1, note: { pl: "lany",              en: "cast",             de: "gegossen" } },
  { mat: "acrylic",   thick: 10, laser: "co2",   power: 95,  speed: 5,   passes: 2, note: { pl: "lany, wolny feed",  en: "cast, slow feed",  de: "gegossen, langsam" } },
  // CO2 — Leather
  { mat: "leather",   thick: 2,  laser: "co2",   power: 40,  speed: 30,  passes: 1, note: { pl: "naturalna",         en: "natural",          de: "natürliches Leder" } },
  { mat: "leather",   thick: 4,  laser: "co2",   power: 55,  speed: 20,  passes: 1, note: { pl: "grubsza skóra",     en: "thick leather",    de: "dickes Leder" } },
  // CO2 — Fabric
  { mat: "fabric",    thick: 1,  laser: "co2",   power: 25,  speed: 50,  passes: 1, note: { pl: "bawełna/jeans",     en: "cotton/denim",     de: "Baumwolle/Denim" } },
  { mat: "fabric",    thick: 2,  laser: "co2",   power: 30,  speed: 40,  passes: 1, note: { pl: "filc",              en: "felt",             de: "Filz" } },
  // CO2 — MDF
  { mat: "mdf",       thick: 3,  laser: "co2",   power: 65,  speed: 18,  passes: 1, note: { pl: "standard",          en: "standard",         de: "standard" } },
  { mat: "mdf",       thick: 6,  laser: "co2",   power: 82,  speed: 10,  passes: 2, note: { pl: "standard",          en: "standard",         de: "standard" } },
  // CO2 — Cardboard
  { mat: "cardboard", thick: 3,  laser: "co2",   power: 50,  speed: 25,  passes: 1, note: { pl: "tektura falista",   en: "corrugated",       de: "Wellpappe" } },
  // CO2 — Glass (engraving only)
  { mat: "glass",     thick: 4,  laser: "co2",   power: 20,  speed: 200, passes: 1, note: { pl: "grawer (nie cięcie)", en: "engraving only",  de: "nur Gravur" } },
  // Fiber — Stainless Steel
  { mat: "steel",     thick: 1,  laser: "fiber", power: 100, speed: 500, passes: 1, note: { pl: "stal nierdzewna",   en: "stainless steel",  de: "Edelstahl" } },
  { mat: "steel",     thick: 2,  laser: "fiber", power: 100, speed: 200, passes: 2, note: { pl: "stal nierdzewna",   en: "stainless steel",  de: "Edelstahl" } },
  // Fiber — Anodized Aluminum
  { mat: "aluminum",  thick: 1,  laser: "fiber", power: 80,  speed: 800, passes: 1, note: { pl: "anodowany",         en: "anodized",         de: "eloxiert" } },
  { mat: "aluminum",  thick: 2,  laser: "fiber", power: 90,  speed: 400, passes: 1, note: { pl: "anodowany",         en: "anodized",         de: "eloxiert" } },
  // Fiber — Brass / Copper
  { mat: "brass",     thick: 1,  laser: "fiber", power: 100, speed: 300, passes: 2, note: { pl: "mosiądz",           en: "brass",            de: "Messing" } },
  { mat: "copper",    thick: 1,  laser: "fiber", power: 100, speed: 250, passes: 2, note: { pl: "miedź",             en: "copper",           de: "Kupfer" } },
  // Fiber — Titanium
  { mat: "titanium",  thick: 1,  laser: "fiber", power: 90,  speed: 400, passes: 1, note: { pl: "tytan",             en: "titanium",         de: "Titan" } },
  // Fiber — Silver (marking)
  { mat: "silver",    thick: 1,  laser: "fiber", power: 50,  speed: 600, passes: 1, note: { pl: "znakowanie",        en: "marking only",     de: "nur Markierung" } },
];

// Material display labels and filter groupings
const MAT_LABELS = {
  plywood:   { pl: "Sklejka",           en: "Plywood",       de: "Sperrholz" },
  acrylic:   { pl: "Akryl",             en: "Acrylic",       de: "Acryl" },
  leather:   { pl: "Skóra",             en: "Leather",       de: "Leder" },
  fabric:    { pl: "Tkanina",           en: "Fabric",        de: "Textil" },
  mdf:       { pl: "MDF",               en: "MDF",           de: "MDF" },
  cardboard: { pl: "Karton",            en: "Cardboard",     de: "Karton" },
  glass:     { pl: "Szkło",             en: "Glass",         de: "Glas" },
  steel:     { pl: "Stal",              en: "Steel",         de: "Stahl" },
  aluminum:  { pl: "Aluminium",         en: "Aluminum",      de: "Aluminium" },
  brass:     { pl: "Mosiądz",           en: "Brass",         de: "Messing" },
  copper:    { pl: "Miedź",             en: "Copper",        de: "Kupfer" },
  titanium:  { pl: "Tytan",             en: "Titanium",      de: "Titan" },
  silver:    { pl: "Srebro",            en: "Silver",        de: "Silber" },
};

// Filter chip groups
const MAT_FILTER_GROUPS = [
  { id: "all",        label: { pl: "Wszystkie",    en: "All",          de: "Alle" },          mats: null },
  { id: "plywood",    label: MAT_LABELS.plywood,                                              mats: ["plywood"] },
  { id: "acrylic",    label: MAT_LABELS.acrylic,                                              mats: ["acrylic"] },
  { id: "leather",    label: MAT_LABELS.leather,                                              mats: ["leather"] },
  { id: "fabric",     label: MAT_LABELS.fabric,                                               mats: ["fabric"] },
  { id: "mdf",        label: MAT_LABELS.mdf,                                                  mats: ["mdf"] },
  { id: "cardboard",  label: MAT_LABELS.cardboard,                                            mats: ["cardboard"] },
  { id: "glass",      label: MAT_LABELS.glass,                                                mats: ["glass"] },
  { id: "steel",      label: MAT_LABELS.steel,                                                mats: ["steel"] },
  { id: "aluminum",   label: MAT_LABELS.aluminum,                                             mats: ["aluminum"] },
  { id: "brass_copper", label: { pl: "Mosiądz/Miedź", en: "Brass/Copper", de: "Messing/Kupfer" }, mats: ["brass", "copper"] },
  { id: "ti_silver",  label: { pl: "Tytan/Srebro",  en: "Titanium/Silver", de: "Titan/Silber" }, mats: ["titanium", "silver"] },
];

const LASER_FILTERS = [
  { id: "all",   label: { pl: "Wszystkie",  en: "All",    de: "Alle" } },
  { id: "co2",   label: { pl: "CO2",        en: "CO2",    de: "CO2" } },
  { id: "fiber", label: { pl: "Fiber",      en: "Fiber",  de: "Fiber" } },
];

const COL_LABELS = {
  pl: {
    mat:     "Materiał",
    thick:   "Grubość (mm)",
    laser:   "Laser",
    power:   "Moc (%)",
    speed:   "Prędkość (mm/s)",
    passes:  "Przejścia",
    note:    "Uwagi",
  },
  en: {
    mat:     "Material",
    thick:   "Thickness (mm)",
    laser:   "Laser",
    power:   "Power (%)",
    speed:   "Speed (mm/s)",
    passes:  "Passes",
    note:    "Notes",
  },
  de: {
    mat:     "Material",
    thick:   "Stärke (mm)",
    laser:   "Laser",
    power:   "Leistung (%)",
    speed:   "Geschw. (mm/s)",
    passes:  "Durchgänge",
    note:    "Hinweise",
  },
};

const CTA_LABELS = {
  pl: { text: "Potrzebujesz wyceny laserowania?", link: "Kalkulator sTuDiO" },
  en: { text: "Need a laser cutting quote?",       link: "sTuDiO Calculator" },
  de: { text: "Benötigen Sie ein Laser-Angebot?",  link: "sTuDiO-Rechner" },
};

function getLabelStr(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.en || obj.pl || "";
}

export default function LaserMaterialMatrix({ lang = "pl" }) {
  const [matFilter, setMatFilter] = useState("all");
  const [laserFilter, setLaserFilter] = useState("all");

  const cols = COL_LABELS[lang] || COL_LABELS.en;
  const cta = CTA_LABELS[lang] || CTA_LABELS.en;

  const filtered = useMemo(() => {
    const group = MAT_FILTER_GROUPS.find((g) => g.id === matFilter);
    return MATRIX.filter((row) => {
      const matOk = !group?.mats || group.mats.includes(row.mat);
      const laserOk = laserFilter === "all" || row.laser === laserFilter;
      return matOk && laserOk;
    });
  }, [matFilter, laserFilter]);

  return (
    <div>
      {/* Material filter */}
      <div className="mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
          {cols.mat}
        </div>
        <Chips options={MAT_FILTER_GROUPS} value={matFilter} onChange={setMatFilter} lang={lang} />
      </div>

      {/* Laser type filter */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
          {cols.laser}
        </div>
        <Chips options={LASER_FILTERS} value={laserFilter} onChange={setLaserFilter} lang={lang} />
      </div>

      {/* Table */}
      <div className="bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-neutral-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">{cols.mat}</th>
                <th className="px-4 py-3 text-right font-medium">{cols.thick}</th>
                <th className="px-4 py-3 text-left font-medium">{cols.laser}</th>
                <th className="px-4 py-3 text-right font-medium">{cols.power}</th>
                <th className="px-4 py-3 text-right font-medium">{cols.speed}</th>
                <th className="px-4 py-3 text-right font-medium">{cols.passes}</th>
                <th className="px-4 py-3 text-left font-medium">{cols.note}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-sm">
                    —
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}
                  >
                    <td className="px-4 py-2.5 text-neutral-200 font-medium">
                      {getLabelStr(MAT_LABELS[row.mat], lang) || row.mat}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-300 text-right tabular-nums">
                      {row.thick}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.laser === "co2" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-400/15 text-blue-300 border border-blue-400/20">
                          CO2
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-400/15 text-emerald-300 border border-emerald-400/20">
                          Fiber
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-300 text-right tabular-nums">
                      {row.power}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-300 text-right tabular-nums">
                      {row.speed}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-300 text-right tabular-nums">
                      {row.passes}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-400 text-sm">
                      {getLabelStr(row.note, lang)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 p-4 rounded-xl bg-blue-400/10 border border-blue-400/20 text-sm text-center">
        <span className="text-neutral-300">{cta.text} </span>
        <a
          href="/studio/#calculator"
          className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
        >
          {"→"} {cta.link}
        </a>
      </div>
    </div>
  );
}
