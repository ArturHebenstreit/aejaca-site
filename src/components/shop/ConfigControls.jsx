// ============================================================
// GRAFICZNE KONTROLKI KONFIGURATORA
// ============================================================
// Konfiguracja uslugi ma nie odstraszyc osoby, ktora juz zdecydowala sie
// kupic. Dlatego zamiast list rozwijanych sa kafelki, zamiast pola liczbowego
// suwak z podpowiedziami, a cena aktualizuje sie w miejscu, bez przeladowania.

import { useRef } from "react";
import { Upload, X, Check, Loader2, CircleAlert } from "lucide-react";
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

/**
 * Licznik sztuk. Kciuk trafia w duze przyciski, nie w strzalki pola liczbowego.
 *
 * LICZBA JEST ZAWSZE NA FORMULARZU, takze wtedy, gdy wynosi jeden. Ukrywanie
 * jej przy prototypie znaczylo, ze klient, ktory chce dwie sztuki, musial
 * najpierw znalezc suwak nakladu i domyslic sie, ze to on odslania licznik.
 *
 * Ponad gorna granica jest jeden stan otwarty, pokazywany jako nieskonczonosc:
 * tyle sztuk wyceniamy recznie, wiec dalsze zliczanie niczego nie zmienia,
 * a "+" gasnie zamiast udawac, ze cos jeszcze robi.
 */
export function QuantityStepper({ label, value, onChange, min = 1, max = 100, openValue = null, lang, accent = "blue", hint }) {
  const otwarty = openValue != null && value >= openValue;
  const gora = openValue ?? max;
  const przyGorze = value >= gora;
  const btn = (wylaczony) =>
    `w-10 h-10 rounded-lg border transition-colors text-lg leading-none ${
      wylaczony
        ? "border-white/5 bg-white/[0.01] text-neutral-700 cursor-not-allowed"
        : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25 hover:text-white"
    }`;

  // Krok w dol z nieskonczonosci wraca na ostatnia liczbe, ktora umiemy policzyc.
  const wDol = () => onChange(otwarty ? max : Math.max(min, value - 1));
  const wGore = () => onChange(przyGorze ? gora : Math.min(gora, value + 1));

  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</div>
      <div className="flex items-center gap-3">
        <button type="button" className={btn(value <= min)} onClick={wDol} disabled={value <= min} aria-label="-">
          &minus;
        </button>
        {otwarty ? (
          <div
            className="w-20 text-center py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-semibold text-lg leading-tight"
            aria-label={String(value)}
          >
            ∞
          </div>
        ) : (
          <input
            type="number"
            value={value}
            min={min}
            max={gora}
            onChange={(e) => onChange(Math.min(gora, Math.max(min, Math.floor(Number(e.target.value)) || min)))}
            className={`w-20 text-center py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-semibold
                        focus:outline-none ${accent === "amber" ? "focus:border-amber-400/50" : "focus:border-blue-400/50"}`}
          />
        )}
        <button type="button" className={btn(przyGorze)} onClick={wGore} disabled={przyGorze} aria-label="+">
          +
        </button>
      </div>
      {otwarty && (
        <p className="text-neutral-500 text-[11px] mt-2">
          {hint || t({
            pl: `Powyżej ${max} sztuk wyceniamy indywidualnie. Napisz, ile dokładnie potrzebujesz.`,
            en: `Above ${max} pieces we quote individually. Tell us exactly how many you need.`,
            de: `Ueber ${max} Stueck kalkulieren wir individuell. Sagen Sie uns die genaue Menge.`,
          }, lang)}
        </p>
      )}
    </div>
  );
}

/** Wgrywanie pliku z podgladem geometrii policzonej przez serwer */
export function FileDrop({ label, hint, file, geometry, onPick, onClear, busy, busyLabel, error, accent = "blue", lang, accept = ".stl", children }) {
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
            {/* Etykieta ma mowic, co sie dzieje TERAZ. Jeden napis na oba etapy
                znaczyl, ze przy kilkunastu megabajtach klient patrzyl na
                "Analizuję model" dlugo po tym, jak model juz widzial. */}
            {busyLabel || t({ pl: "Analizuję model", en: "Analysing the model", de: "Modell wird analysiert" }, lang)}
          </div>
        )}
        {/* Odrzucony plik ZOSTAJE w polu razem z podgladem. Skasowanie go bylo
            mylace: znikal model, a powod znikniecia stal osobno, nizej. */}
        {error && !busy && (
          <div className="flex gap-2 mt-2 text-[11px] text-amber-300">
            <CircleAlert className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
            <span>
              {error}
              <span className="block text-neutral-500 mt-0.5">
                {t({
                  pl: "Ten plik nie wejdzie do zamówienia. Usuń go krzyżykiem i wybierz inny albo opisz zlecenie.",
                  en: "This file cannot be ordered. Remove it and pick another, or describe the job instead.",
                  de: "Diese Datei kann nicht bestellt werden. Entfernen Sie sie und waehlen eine andere, oder beschreiben Sie den Auftrag.",
                }, lang)}
              </span>
            </span>
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
export function PersonalizationField({ label, value, onChange, maxLength = 60, placeholder, hint, accent = "blue", overLimitNote }) {
  // Tekstu nie ucinamy w polu. Klient ma zobaczyc, ze przekroczyl limit,
  // i dowiedziec sie, ze dluzszy grawer idzie do wyceny, zamiast po cichu
  // stracic polowe dedykacji.
  const over = value.length > maxLength;

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
        <span className={`text-[10px] ${over ? "text-amber-400 font-medium" : value.length > maxLength * 0.9 ? "text-amber-400/70" : "text-neutral-600"}`}>
          {value.length} / {maxLength}
        </span>
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border text-white text-sm
                    placeholder:text-neutral-600 focus:outline-none transition-colors ${
                      over
                        ? "border-amber-400/50"
                        : accent === "amber"
                          ? "border-white/10 focus:border-amber-400/50"
                          : "border-white/10 focus:border-blue-400/50"
                    }`}
      />
      {over && overLimitNote && <p className="text-amber-400/80 text-[11px] mt-1 leading-relaxed">{overLimitNote}</p>}
      {!over && hint && <p className="text-neutral-600 text-[11px] mt-1">{hint}</p>}
    </div>
  );
}

/**
 * Opis zlecenia. Cena moze byc policzona co do grosza, a i tak nie wiadomo,
 * co zrobic: "pierscionek, srebro, bez kamienia" to nie jest zamowienie.
 * Bez tego pola pozycja w koszyku nie jest gotowa do kupienia.
 */
export function JobDescription({ label, hint, value, onChange, minLength = 20, maxLength = 700, accent = "blue", image, onPickImage, onClearImage, imageLabel, lang }) {
  const ref = useRef(null);
  const len = value.trim().length;
  const short = len < minLength;
  const ring = accent === "amber" ? "focus:border-amber-400/50" : "focus:border-blue-400/50";

  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={maxLength}
        className={`w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-3 text-sm text-white
                    placeholder:text-neutral-600 focus:outline-none transition-colors ${ring}`}
        placeholder={hint}
      />
      {/* Licznik ma jedna skale przez caly czas: ile wpisano z ilu mozna.
          Odliczanie do progu zmienialo znaczenie liczby w trakcie pisania,
          a prog jest wymaganiem, nie limitem, wiec mowimy o nim slowami. */}
      <div className="flex items-baseline justify-between gap-3 mt-1.5">
        <span className={`text-[11px] ${short ? "text-amber-400/80" : "text-transparent select-none"}`}>
          {t({
            pl: `Opisz krótko, minimum ${minLength} znaków`,
            en: `A short brief, at least ${minLength} characters`,
            de: `Kurze Beschreibung, mindestens ${minLength} Zeichen`,
          }, lang)}
        </span>
        <span className={`text-[11px] tabular-nums flex-shrink-0 ${short ? "text-amber-400/80" : "text-neutral-600"}`}>
          {len} / {maxLength}
        </span>
      </div>

      {onPickImage && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02]
                       text-neutral-300 hover:border-white/25 hover:text-white text-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {imageLabel}
          </button>
          <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={onPickImage} />
          {image && (
            <div className="flex items-center justify-between gap-3 mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="text-white text-xs truncate">{image.name}</span>
              <button type="button" onClick={onClearImage} className="text-neutral-500 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Lista warunkow, ktore trzeba spelnic, zeby kupic.
 *
 * Dotad brakujacy warunek byl jednym zdaniem drobnym drukiem nad przyciskiem
 * i po prostu ginal. Klient widzial wygaszony przycisk i nie wiedzial dlaczego.
 * Tutaj kazdy warunek ma wlasny wiersz i znacznik, wiec od razu widac,
 * czego brakuje i ile juz jest zrobione.
 *
 * @param {{ok: boolean, label: string, hint?: string}[]} items
 */
export function BlockedReasons({ title, items, accent = "blue" }) {
  const pending = items.filter((i) => !i.ok);
  if (!pending.length) return null;

  return (
    <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <CircleAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span className="text-amber-300 text-xs font-semibold">{title}</span>
      </div>
      <ul className="space-y-2">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                i.ok ? "border-emerald-400/50 text-emerald-400" : "border-amber-400/50 text-amber-400"
              }`}
            >
              {i.ok ? <Check className="w-2.5 h-2.5" /> : <span className="block w-1 h-1 rounded-full bg-current" />}
            </span>
            <span className="min-w-0">
              <span className={`block text-xs ${i.ok ? "text-neutral-500 line-through" : "text-white"}`}>{i.label}</span>
              {!i.ok && i.hint && <span className="block text-[11px] text-neutral-400 leading-relaxed mt-0.5">{i.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
