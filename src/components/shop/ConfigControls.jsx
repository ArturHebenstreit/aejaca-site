// ============================================================
// GRAFICZNE KONTROLKI KONFIGURATORA
// ============================================================
// Konfiguracja uslugi ma nie odstraszyc osoby, ktora juz zdecydowala sie
// kupic. Dlatego zamiast list rozwijanych sa kafelki, zamiast pola liczbowego
// suwak z podpowiedziami, a cena aktualizuje sie w miejscu, bez przeladowania.

import { useRef } from "react";
import { Upload, X, Check, Loader2 } from "lucide-react";
import { t } from "../../pricing/config.js";

/** Kafelki wariantow. Zaznaczenie jest widoczne kolorem i znaczkiem. */
export function TileGroup({ label, options, value, onChange, lang, accent = "blue", columns = 3 }) {
  const active = accent === "amber" ? "border-amber-400 bg-amber-400/10" : "border-blue-400 bg-blue-400/10";
  const activeText = accent === "amber" ? "text-amber-200" : "text-blue-200";
  const cols = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" }[columns] || "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</div>
      <div className={`grid ${cols} gap-2`}>
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={String(o.id)}
              type="button"
              onClick={() => onChange(o.id)}
              className={`relative text-left px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                on ? `${active} ${activeText}` : "border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/25"
              }`}
            >
              {on && (
                <span className={`absolute top-2 right-2 ${accent === "amber" ? "text-amber-300" : "text-blue-300"}`}>
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="block text-xs font-medium leading-snug pr-4">{t(o.label, lang)}</span>
              {o.sub && <span className="block text-[10px] text-neutral-500 mt-0.5">{t(o.sub, lang)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Suwak z opisanymi przystankami. Uzywany tam, gdzie wartosci sa uporzadkowane. */
export function StepSlider({ label, options, value, onChange, lang, accent = "blue" }) {
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  const current = options[index];
  const track = accent === "amber" ? "accent-amber-400" : "accent-blue-400";

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
        <span className={`text-xs font-medium ${accent === "amber" ? "text-amber-300" : "text-blue-300"}`}>
          {t(current?.label, lang)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={options.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(options[Number(e.target.value)].id)}
        className={`w-full ${track}`}
        aria-label={label}
      />
      <div className="flex justify-between mt-1">
        {options.map((o, i) => (
          <span key={String(o.id)} className={`text-[10px] ${i === index ? "text-neutral-300" : "text-neutral-600"}`}>
            {o.tick ?? String(o.id).toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Licznik sztuk. Kciuk trafia w duze przyciski, nie w strzalki pola liczbowego. */
export function QtyStepper({ label, value, onChange, min = 1, max = 999, accent = "blue" }) {
  const btn =
    "w-10 h-10 rounded-lg border border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25 hover:text-white transition-colors text-lg leading-none";
  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</div>
      <div className="flex items-center gap-3">
        <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} aria-label="-">
          &minus;
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
          className={`w-20 text-center py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-semibold
                      focus:outline-none ${accent === "amber" ? "focus:border-amber-400/50" : "focus:border-blue-400/50"}`}
        />
        <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} aria-label="+">
          +
        </button>
      </div>
    </div>
  );
}

/** Wgrywanie pliku z podgladem geometrii policzonej przez serwer */
export function FileDrop({ label, hint, file, geometry, onPick, onClear, busy, accent = "blue", lang, accept = ".stl", children }) {
  const ref = useRef(null);
  const ring = accent === "amber" ? "border-amber-400/30 hover:border-amber-400/50" : "border-blue-400/30 hover:border-blue-400/50";
  const tint = accent === "amber" ? "text-amber-400" : "text-blue-400";

  if (!file) {
    return (
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={`w-full flex flex-col items-center gap-2.5 px-5 py-7 rounded-2xl border-2 border-dashed
                      bg-white/[0.02] hover:bg-white/[0.04] transition-all ${ring}`}
        >
          <Upload className={`w-6 h-6 ${tint}`} />
          <span className="text-white text-sm font-medium">{hint}</span>
        </button>
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={onPick} />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-white text-sm truncate">{file.name}</span>
          <button type="button" onClick={onClear} className="text-neutral-500 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {busy && (
          <div className="flex items-center gap-2 text-neutral-500 text-xs mt-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t({ pl: "Analizuję model", en: "Analysing the model", de: "Modell wird analysiert" }, lang)}
          </div>
        )}
        {geometry && !busy && (
          <div className="grid grid-cols-2 gap-3 mt-3 text-[11px]">
            <div>
              <div className="text-neutral-500">{t({ pl: "Objętość", en: "Volume", de: "Volumen" }, lang)}</div>
              <div className="text-white font-medium">{geometry.volumeCm3} cm³</div>
            </div>
            <div>
              <div className="text-neutral-500">{t({ pl: "Wymiary", en: "Dimensions", de: "Abmessungen" }, lang)}</div>
              <div className="text-white font-medium">
                {(geometry.bbox.x * 10).toFixed(0)} × {(geometry.bbox.y * 10).toFixed(0)} × {(geometry.bbox.z * 10).toFixed(0)} mm
              </div>
            </div>
          </div>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

/** Pole personalizacji z licznikiem znakow */
export function PersonalizationField({ label, value, onChange, maxLength = 60, placeholder, hint, accent = "blue" }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
        <span className={`text-[10px] ${value.length > maxLength * 0.9 ? "text-amber-400" : "text-neutral-600"}`}>
          {value.length} / {maxLength}
        </span>
      </div>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm
                    placeholder:text-neutral-600 focus:outline-none transition-colors ${
                      accent === "amber" ? "focus:border-amber-400/50" : "focus:border-blue-400/50"
                    }`}
      />
      {hint && <p className="text-neutral-600 text-[11px] mt-1">{hint}</p>}
    </div>
  );
}
