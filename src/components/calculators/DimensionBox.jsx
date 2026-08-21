// ============================================================
// WYMIARY WYROBU W OSOBNYCH OSIACH
// ============================================================
// Jedna liczba skali pozwalala tylko powiekszyc albo zmniejszyc calosc.
// Klient, ktory chce splaszczyc breloczek albo wyciagnac szyld, nie mial jak
// tego powiedziec inaczej niz slowami w opisie zlecenia, czyli w miejscu,
// ktorego wycena nie czyta.
//
// Komponent jest prezentacyjny: dostaje gabaryt i skale, oddaje nowa skale.
// Cala arytmetyka stoi w `src/utils/dimScale.js` i ma osobny test, bo to ona
// psuje sie po cichu, a nie uklad pol na ekranie.
//
// KLIENT WPISUJE MILIMETRY, NIE MNOZNIK. "Ile ma miec" jest pytaniem, na ktore
// klient zna odpowiedz; "razy ile" wymaga liczenia w glowie z wymiaru pliku.

import { useId } from "react";
import { AlertTriangle, Link2, Link2Off } from "lucide-react";
import { setAxis, dimsFor, scaleForDim, fitsBox, shrinkToBox, resyncScale, isUniform } from "../../utils/dimScale.js";

const LBL = {
  pl: { size: "Wymiary wyrobu", sync: "Zachowaj proporcje", exceeds: "Wyrób przekracza pole robocze",
    fit: "Dopasuj do pola", original: "Oryginał", distorted: "proporcje zmienione" },
  en: { size: "Finished size", sync: "Keep proportions", exceeds: "Item exceeds the work area",
    fit: "Fit to area", original: "Original", distorted: "proportions changed" },
  de: { size: "Fertigmaß", sync: "Proportionen beibehalten", exceeds: "Werkstück überschreitet den Arbeitsbereich",
    fit: "An Bereich anpassen", original: "Original", distorted: "Proportionen geändert" },
};

const OS_LBL = { x: "X", y: "Y", z: "Z" };

/**
 * @param {object} p
 * @param {object} p.bboxMm gabaryt pliku w milimetrach, os po osi
 * @param {object} p.scale  obecna skala, os po osi
 * @param {Function} p.onChange nowa skala
 * @param {boolean} p.sync czy osie ida razem
 * @param {Function} p.onSyncChange
 * @param {object|null} p.limitsMm pole robocze maszyny w milimetrach
 * @param {string} p.lang
 * @param {string} p.accent klasa koloru akcentu ("blue" albo "amber")
 */
export default function DimensionBox({
  bboxMm, scale, onChange, sync, onSyncChange, limitsMm = null, lang = "pl", accent = "blue",
  zapamietana = null, onZapamietanaChange = null,
}) {
  const l = LBL[lang] || LBL.en;
  const id = useId();
  if (!bboxMm) return null;

  const osie = Object.keys(scale);
  const wymiary = dimsFor(bboxMm, scale);
  const miesci = fitsBox(bboxMm, scale, limitsMm);
  const rozjechana = !isUniform(scale);

  function ustawWymiar(os, mm) {
    const nowa = scaleForDim(bboxMm, os, mm);
    if (nowa == null) return;
    onChange(setAxis(scale, os, nowa, sync));
  }

  function przelaczSync(wlaczona) {
    if (wlaczona) {
      // POWROT DO PROPORCJI wraca do skali sprzed rozjechania osi, a nie do
      // sredniej z nich: srednia po cichu zmienialaby wielkosc wyrobu.
      onChange(resyncScale(zapamietana, scale));
    } else {
      // Zapamietujemy PUNKT WYJSCIA, zeby bylo do czego wrocic.
      onZapamietanaChange?.({ ...scale });
    }
    onSyncChange(wlaczona);
  }

  const kolorAkcentu = accent === "amber" ? "text-amber-300" : "text-blue-300";
  const ramkaAkcentu = accent === "amber" ? "focus:border-amber-400/50" : "focus:border-blue-400/50";

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wider text-neutral-400">{l.size}</span>
        <label htmlFor={`${id}-sync`} className="flex items-center gap-1.5 text-[11px] text-neutral-300 cursor-pointer select-none">
          <input id={`${id}-sync`} type="checkbox" checked={sync}
            onChange={(e) => przelaczSync(e.target.checked)}
            className="rounded border-white/20 bg-neutral-800" />
          {sync ? <Link2 className="w-3.5 h-3.5 text-neutral-400" /> : <Link2Off className="w-3.5 h-3.5 text-amber-400" />}
          {l.sync}
        </label>
      </div>

      <div className={`grid gap-2 ${osie.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {osie.map((os) => (
          <label key={os} className="block">
            <span className="block text-[10px] text-neutral-500 mb-1">{OS_LBL[os]}</span>
            <div className="relative">
              <input type="number" min="0.1" step="0.1" value={Number(wymiary[os]).toFixed(1)}
                onChange={(e) => ustawWymiar(os, Number(e.target.value))}
                className={`w-full bg-neutral-800/60 border border-white/10 rounded-lg pl-2 pr-8 py-1.5 text-sm text-white font-mono focus:outline-none ${ramkaAkcentu} transition-colors`} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 pointer-events-none">mm</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
        <div className="text-[10px] text-neutral-500">
          {l.original}: {osie.map((os) => Number(bboxMm[os]).toFixed(1)).join(" × ")} mm
          {rozjechana && <span className="text-amber-400/80"> · {l.distorted}</span>}
        </div>
        {!miesci && (
          <button onClick={() => onChange(shrinkToBox(bboxMm, scale, limitsMm))}
            className={`text-[11px] px-2 py-1 rounded-lg border border-white/15 hover:border-white/35 ${kolorAkcentu} transition-colors`}>
            {l.fit}
          </button>
        )}
      </div>

      {!miesci && (
        // STRAZNIK POLA ROBOCZEGO. Bez niego kalkulator wycenia wyrob, ktorego
        // maszyna nie zrobi, a dowiadujemy sie o tym po zaplaceniu.
        <div className="mt-2 flex items-start gap-2 text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {l.exceeds} ({osie.map((os) => Number(limitsMm[os]).toFixed(0)).join(" × ")} mm)
          </span>
        </div>
      )}
    </div>
  );
}
