// ============================================================
// WZOR PIERSCIONKA JAKO PIKTOGRAM
// ============================================================
// Nazwa wzoru nic nie mowi komus, kto nie kupuje bizuterii co tydzien.
// "Half eternity" i "trylogia" to dla wiekszosci dwa rownie puste slowa,
// a roznice widac natychmiast na rysunku.
//
// Piktogram powstaje Z TYCH SAMYCH PARAMETROW, co bryla: obrys kamienia
// bierzemy z `OUTLINES`, liczbe lapek z `SETTINGS`, kamienie na obwodzie
// z `band`. Rysunek nie moze wiec obiecac czegos, czego generator nie zbuduje,
// a to jest jedyny sposob, zeby nie rozjechal sie przy pierwszej korekcie
// presetu.
//
// Widok jest Z GORY, bo to on rozroznia style: halo to wieniec kropek wokol
// kamienia, trylogia to trzy kamienie w rzedzie, pave to kropki na ramionach,
// eternity to kropki dookola. Widok z boku pokazalby glownie szyne, ktora
// w wiekszosci wzorow wyglada tak samo.

import { OUTLINES, CUTS, SETTINGS } from "../../../geometry/ring/params.js";

const R = 50;                       // srodek kadru 100 x 100

/** Obrys szlifu wpisany w promien `r`, jako lista punktow SVG. */
function obrys(cutId, r) {
  const cut = CUTS[cutId] || CUTS.round;
  return OUTLINES[cut.outline]()
    .map(([x, y]) => `${(R + x * r).toFixed(1)},${(R + y * r).toFixed(1)}`)
    .join(" ");
}

function Kropki({ ile, promien, wielkosc, od = -90, zakres = 360 }) {
  return Array.from({ length: ile }, (_, i) => {
    const kat = ((od + (zakres * i) / ile) * Math.PI) / 180;
    return <circle key={i} cx={R + Math.cos(kat) * promien} cy={R + Math.sin(kat) * promien}
      r={wielkosc} fill="currentColor" opacity="0.75" />;
  });
}

export default function PresetIcon({ preset, size = 44, className = "" }) {
  const p = preset.params || {};
  const kind = preset.kind || p.kind || "ring";
  const cut = p.stone?.cut || "round";
  const setting = p.setting || "prong4";
  const lapki = SETTINGS[setting]?.prongs || 0;

  // Szyna: dwa pasy schodzace z kadru, zwezone albo nie, zgodnie z sylwetka.
  const zwezona = p.taper === "tapered";
  const szer = zwezona ? 5 : 7;
  const szerDol = zwezona ? 9 : 7;

  const szyna = (
    <>
      <path d={`M ${R - szerDol} 100 L ${R - szer} ${R + 6} L ${R + szer} ${R + 6} L ${R + szerDol} 100`}
        fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <path d={`M ${R - szerDol} 0 L ${R - szer} ${R - 6} L ${R + szer} ${R - 6} L ${R + szerDol} 0`}
        fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
    </>
  );

  // ---- obraczka: kamieni na obwodzie albo ich brak ----
  if (kind === "band") {
    const pokrycie = p.band?.coverage || "none";
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
        <circle cx={R} cy={R} r="34" fill="none" stroke="currentColor" strokeWidth="9" opacity="0.28" />
        {pokrycie === "full" ? <Kropki ile={16} promien={34} wielkosc={3.4} /> : null}
        {pokrycie === "half" ? <Kropki ile={8} promien={34} wielkosc={3.4} od={-170} zakres={160} /> : null}
      </svg>
    );
  }

  // ---- sygnet: tarcza, ksztalt wprost z `signet.table` ----
  if (kind === "signet") {
    const tarcza = p.signet?.table || "oval";
    const dlugi = (p.signet?.length || 14) > 12 ? 30 : 24;
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
        {szyna}
        {tarcza === "rect" ? (
          <rect x={R - dlugi * 0.78} y={R - dlugi} width={dlugi * 1.56} height={dlugi * 2}
            rx="3" fill="currentColor" opacity="0.85" />
        ) : tarcza === "cushion" ? (
          <rect x={R - dlugi * 0.82} y={R - dlugi} width={dlugi * 1.64} height={dlugi * 2}
            rx={dlugi * 0.42} fill="currentColor" opacity="0.85" />
        ) : (
          <ellipse cx={R} cy={R} rx={dlugi * 0.78} ry={dlugi} fill="currentColor" opacity="0.85" />
        )}
      </svg>
    );
  }

  // ---- pierscionek z kamieniem ----
  const halo = p.halo?.on;
  const bok = p.side?.count || 0;
  const duzy = halo ? 15 : 21;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      {szyna}

      {/* Kamienie boczne. Przy srednicy powyzej trzech milimetrow to juz nie
          jest pave, tylko trylogia, i rysuje sie ja innymi ksztaltami. */}
      {bok > 0 && (p.side.size || 0) >= 3
        ? [-1, 1].map((s) => (
            <polygon key={s} points={obrys("round", 10)} fill="currentColor" opacity="0.8"
              transform={`translate(${s * 26} 0)`} />
          ))
        : null}
      {bok > 0 && (p.side.size || 0) < 3
        ? [-1, 1].map((s) =>
            Array.from({ length: Math.min(bok, 4) }, (_, i) => (
              <circle key={`${s}${i}`} cx={R + s * (26 + i * 8)} cy={R} r="3.2"
                fill="currentColor" opacity="0.7" />
            )))
        : null}

      {/* Wieniec halo */}
      {halo ? <Kropki ile={12} promien={22} wielkosc={3.2} /> : null}

      {/* Kamien centralny w swoim prawdziwym obrysie */}
      <polygon points={obrys(cut, duzy)} fill="currentColor" opacity="0.9" />

      {/* Zakucie: lapki jako kreski na obrysie, kaseta jako rant */}
      {setting === "bezel" ? (
        <polygon points={obrys(cut, duzy + 4)} fill="none" stroke="currentColor"
          strokeWidth="2.6" opacity="0.7" />
      ) : null}
      {lapki > 0
        ? Array.from({ length: lapki }, (_, i) => {
            const kat = ((360 / lapki) * i + (lapki === 4 ? 45 : 0)) * Math.PI / 180;
            return <circle key={i} cx={R + Math.cos(kat) * (duzy + 1)} cy={R + Math.sin(kat) * (duzy + 1)}
              r="3.4" fill="currentColor" />;
          })
        : null}
    </svg>
  );
}
