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

import { useId, useState } from "react";
import { AlertTriangle, Link2, Link2Off } from "lucide-react";
import { setAxis, dimsFor, scaleForDim, fitsBox, fitToBox, resyncScale, isUniform } from "../../utils/dimScale.js";

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
  zapamietana = null, onZapamietanaChange = null, fitOptions = [],
}) {
  const l = LBL[lang] || LBL.en;
  const id = useId();
  // TO, CO KLIENT WLASNIE PISZE, a nie to, co juz policzylismy. Bez tego pole
  // bylo przeliczane po kazdym klawiszu i wracalo do sformatowanej liczby, wiec
  // nie dalo sie skasowac cyfry ani zaczac wpisywania od nowa: kasujesz "2", a
  // pole natychmiast wstawia "22.0" z powrotem. Wpis zyje tu, dopoki trwa.
  const [wpisywane, setWpisywane] = useState({});
  if (!bboxMm) return null;

  const osie = Object.keys(scale);
  const wymiary = dimsFor(bboxMm, scale);
  const miesci = fitsBox(bboxMm, scale, limitsMm);
  const rozjechana = !isUniform(scale);
  // Bez podanej listy zostaje jeden cel: pole, ktorego pilnuje ostrzezenie.
  const cele = fitOptions.length
    ? fitOptions.filter((c) => c && c.limits)
    : (limitsMm ? [{ key: "limit", label: l.fit, limits: limitsMm }] : []);

  function wpisz(os, tekst) {
    // Pole przyjmuje WSZYSTKO, lacznie z pustym i z samym przecinkiem w trakcie
    // pisania. Do wyceny idzie dopiero liczba, ktora da sie odczytac.
    setWpisywane((w) => ({ ...w, [os]: tekst }));
    const mm = Number(String(tekst).replace(",", "."));
    if (!Number.isFinite(mm) || mm <= 0) return;
    const nowa = scaleForDim(bboxMm, os, mm);
    if (nowa == null) return;
    onChange(setAxis(scale, os, nowa, sync));
  }

  /** Koniec pisania: pole wraca do liczby, ktora faktycznie poszla do wyceny. */
  function zakoncz(os) {
    setWpisywane((w) => { const { [os]: _, ...reszta } = w; return reszta; });
  }

  /** Zmiana skali spoza pol (dopasowanie, synchronizacja) unieważnia wpisy. */
  function ustawSkale(nowa) {
    setWpisywane({});
    onChange(nowa);
  }

  function przelaczSync(wlaczona) {
    if (wlaczona) {
      // POWROT DO PROPORCJI wraca do skali sprzed rozjechania osi, a nie do
      // sredniej z nich: srednia po cichu zmienialaby wielkosc wyrobu.
      ustawSkale(resyncScale(zapamietana, scale));
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
              {/* `text`, a nie `number`: pole liczbowe nie przyjmuje ani pustej
                  wartosci w trakcie pisania, ani przecinka, ktorego uzywa polska
                  klawiatura numeryczna. */}
              <input type="text" inputMode="decimal" value={wpisywane[os] ?? Number(wymiary[os]).toFixed(1)}
                onChange={(e) => wpisz(os, e.target.value)}
                onBlur={() => zakoncz(os)}
                onKeyDown={(e) => { if (e.key === "Enter") { zakoncz(os); e.currentTarget.blur(); } }}
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
        {/* DOPASOWANIE JEST DOSTEPNE ZAWSZE, tak samo jak w szybkiej wycenie.
            Wczesniej przycisk pokazywal sie dopiero po przekroczeniu pola, wiec
            klient, ktory chcial wypelnic plyte w calosci, musial dojsc do tego
            liczba. Kazde pole maszyny dostaje wlasny przycisk. */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(cele.length ? cele : []).map((c) => (
            <button key={c.key} type="button" onClick={() => ustawSkale(fitToBox(bboxMm, scale, c.limits))}
              className={`text-[11px] px-2 py-1 rounded-lg border border-white/15 hover:border-white/35 ${kolorAkcentu} transition-colors`}>
              {c.label}
            </button>
          ))}
        </div>
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
