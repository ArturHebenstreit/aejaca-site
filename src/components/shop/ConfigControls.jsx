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
      {/* Przystanki w SIATCE o rownych kolumnach, nie w rzedzie `justify-between`.
          Rzad nie ma jak sie zwezic, wiec dluzsza etykieta ("CUSTOM") robila
          dokument szerszym od telefonu i cala strona przewijala sie w bok.
          Kolumny `minmax(0, 1fr)` zwezaja sie i tekst zawija sie w miejscu. */}
      <div
        className="mt-1 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o, i) => (
          <span
            key={String(o.id)}
            className={`text-[11px] leading-tight break-words ${
              i === 0 ? "text-left" : i === options.length - 1 ? "text-right" : "text-center"
            } ${i === index ? "text-neutral-300" : "text-neutral-500"}`}
          >
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

/**
 * Wielkosc wydruku wzgledem oryginalu.
 *
 * Po wgraniu pliku cena liczy sie z JEGO PRAWDZIWYCH WYMIAROW, a nie z listy
 * rozmiarow: model juz je ma, wiec pytanie o rozmiar bylo pytaniem o cos, co
 * wiemy. Zostaje jedno prawdziwe pytanie: czy wydrukowac go w oryginale, czy
 * inaczej. Gorna granice wyznacza pole robocze maszyny, wiec suwak nie pozwala
 * zamowic czegos, czego nie da sie wydrukowac.
 */
export function ScaleControl({ label, bbox, volumeCm3, scale, onChange, maxScale, lang, accent = "blue", purpose = "print" }) {
  const gora = Math.min(maxScale ?? 4, 4);
  // Przy odlewie skala oryginalna pozostaje świadomą opcją także wtedy, gdy
  // przekracza automat. Suwak musi umieć pokazać 100%, a serwer skieruje taki
  // stan do oceny indywidualnej. Dla zwykłego druku zachowujemy twardy limit.
  const goraSuwaka = purpose === "casting" ? Math.max(gora, 1) : gora;
  const dol = 0.25;
  const zaDuzy = gora < 1;
  const bezpieczneMinimum = gora >= dol;
  const tekst = accent === "amber" ? "text-amber-300" : "text-blue-300";
  const track = accent === "amber" ? "accent-amber-400" : "accent-blue-400";
  const wym = (n) => (n * scale * 10).toFixed(0);
  const dopasowanie = Math.floor((maxScale ?? 1) * 100) / 100;

  const przycisk = (aktywny) =>
    `px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${
      aktywny ? `${accent === "amber" ? "border-amber-400 bg-amber-400/10" : "border-blue-400 bg-blue-400/10"} ${tekst}`
              : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
    }`;

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
        <span className={`text-xs font-medium ${tekst}`}>
          {Math.abs(scale - 1) < 0.005
            ? t({ pl: "oryginał", en: "original", de: "Original" }, lang)
            : `${Math.round(scale * 100)}%`}
        </span>
      </div>
      <input
        type="range"
        min={dol}
        max={Math.max(goraSuwaka, dol + 0.01)}
        step={0.01}
        value={Math.min(scale, goraSuwaka)}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${track}`}
        aria-label={label}
        disabled={!bezpieczneMinimum}
      />
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <button
          type="button"
          className={przycisk(Math.abs(scale - 1) < 0.005)}
          onClick={() => onChange(1)}
          disabled={zaDuzy && purpose !== "casting"}
        >
          {t({ pl: "Oryginał", en: "Original", de: "Original" }, lang)}
        </button>
        {maxScale != null && dopasowanie !== 1 && (
          <button
            type="button"
            className={przycisk(Math.abs(scale - dopasowanie) < 0.005)}
            onClick={() => onChange(dopasowanie)}
            disabled={!bezpieczneMinimum}
          >
            {purpose === "casting"
              ? t({ pl: "Dostosuj możliwości techniczne", en: "Fit to technical limits", de: "An technische Grenzen anpassen" }, lang)
              : t({ pl: "Do pola roboczego", en: "Fit the build plate", de: "Auf den Bauraum" }, lang)}
          </button>
        )}
        {bbox && (
          <span className="text-neutral-500 text-[11px] ml-auto">
            {wym(bbox.x)} × {wym(bbox.y)} × {wym(bbox.z)} mm
            {volumeCm3 ? `, ${(volumeCm3 * scale ** 3).toFixed(1)} cm³` : ""}
          </span>
        )}
      </div>
      {zaDuzy && (
        <p className="text-amber-300 text-[11px] mt-2">
          {purpose === "casting"
            ? t({
                pl: `Model w oryginale przekracza automatyczny limit odlewni. Ustaw najwyżej ${Math.round((maxScale ?? 0) * 100)}% albo pozostaw oryginalny rozmiar i poproś o indywidualną ocenę.`,
                en: `At original size the model exceeds the automatic casting limit. Set no more than ${Math.round((maxScale ?? 0) * 100)}%, or keep the original size and request an individual review.`,
                de: `In Originalgröße überschreitet das Modell die automatische Gussgrenze. Stellen Sie höchstens ${Math.round((maxScale ?? 0) * 100)}% ein oder lassen Sie die Originalgröße individuell prüfen.`,
              }, lang)
            : t({
                pl: `Model w oryginale nie mieści się w polu roboczym. Największa możliwa wielkość to ${Math.round((maxScale ?? 0) * 100)}%, a w całości wydrukujemy go po podzieleniu na części. Napisz do nas, jeżeli ma zostać w oryginale.`,
                en: `At original size the model does not fit the build plate. The largest possible size is ${Math.round((maxScale ?? 0) * 100)}%; at full size we print it in parts. Write to us if it has to stay original.`,
                de: `In Originalgroesse passt das Modell nicht in den Bauraum. Moeglich sind hoechstens ${Math.round((maxScale ?? 0) * 100)}%; in voller Groesse drucken wir es geteilt. Schreiben Sie uns, wenn es original bleiben soll.`,
              }, lang)}
        </p>
      )}
      {purpose === "casting" && (
        <p className="text-neutral-500 text-[11px] mt-2 leading-relaxed">
          {t({
            pl: "Skalowanie zmienia także grubość ścianek, krap i kanałów. Dopasowanie wymiarów nie zastępuje kontroli technologicznej modelu przed odlewem.",
            en: "Scaling also changes wall, prong and channel thickness. Fitting the dimensions does not replace the model's manufacturing review before casting.",
            de: "Die Skalierung verändert auch Wand-, Krappen- und Kanalstärken. Passende Maße ersetzen nicht die technische Modellprüfung vor dem Guss.",
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
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (event.dataTransfer.files?.length) onPick({ target: { files: event.dataTransfer.files } });
          }}
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

// ------------------------------------------------------------
// JEDNO MIEJSCE NA PLIKI, DOWOLNIE WIELE
// ------------------------------------------------------------
// Do koszyka prowadzily dwa osobne pola: "Dołącz zdjęcie lub szkic" przy
// opisie i "Projekt do wykonania" nizej. Klient widzial dwa przyciski,
// kazdy przyjmowal jeden plik, i musial zgadnac, ktory z nich jest wlasciwy
// dla jego rysunku. Zgadywal zle, bo obie nazwy pasowaly, a serwer sprawdzal
// KAZDE POLE INNA LISTA formatow: zdjecie wrzucone do projektu odbijalo sie
// bledem, a rysunek wrzucony do zdjecia tak samo.
//
// Tutaj jest jedno pole i dowolna liczba plikow. Rodzaj rozpoznajemy po
// rozszerzeniu, wiec ta sama decyzja, ktora klient podejmowal na oslep,
// zapada sama i zawsze tak samo jak na serwerze.

/** Rysunek DO WYKONANIA. Ta sama lista, ktorej pilnuje ATTACHMENT_EXT na serwerze. */
export const ARTWORK_EXT = /\.(svg|dxf|ai|pdf)$/i;

/** Zdjecie albo szkic jako kontekst. Lustro REFERENCE_EXT z serwera. */
export const PHOTO_EXT = /\.(jpg|jpeg|png|webp|heic|heif|pdf)$/i;

/**
 * Ktora lista formatow obowiazuje ten plik.
 *
 * PDF jest na obu listach i to nie jest pomylka: bywa eksportem z Illustratora
 * i bywa skanem szkicu. Traktujemy go jak projekt, bo ta droga niesie wiecej
 * (plik ladzie tam, gdzie szukaja go do produkcji), a lista zdjec przyjmuje
 * go tak samo.
 */
export const uploadKindFor = (name) => (ARTWORK_EXT.test(String(name || "")) ? "attachment" : "reference");

/** Wszystko, co to pole przyjmuje, w jednym atrybucie `accept`. */
export const ATTACH_ACCEPT = ".svg,.dxf,.ai,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif";

/**
 * Lista zalacznikow z wlasnym stanem kazdego pliku.
 *
 * @param {{id:string, name:string, busy?:boolean, error?:string|null, artwork?:boolean}[]} items
 * @param {(files: File[]) => void} onAdd
 * @param {(id: string) => void} onRemove
 */
export function AttachmentList({ label, hint, addLabel, items = [], onAdd, onRemove, accent = "blue", lang, max = 8, accept = ATTACH_ACCEPT }) {
  const ref = useRef(null);
  const ring = accent === "amber" ? "border-amber-400/30 hover:border-amber-400/50" : "border-blue-400/30 hover:border-blue-400/50";
  const tint = accent === "amber" ? "text-amber-400" : "text-blue-400";
  const pelno = items.length >= max;

  const wybierz = (e) => {
    const wybrane = Array.from(e.target.files || []);
    // Pole trzeba wyczyscic, inaczej wybranie tego samego pliku drugi raz
    // (po skasowaniu go z listy) nie wywola juz zdarzenia zmiany.
    e.target.value = "";
    if (wybrane.length) onAdd(wybrane.slice(0, Math.max(0, max - items.length)));
  };

  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{label}</div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={`w-full flex flex-col items-center gap-2.5 px-5 py-7 rounded-2xl border-2 border-dashed
                      bg-white/[0.02] hover:bg-white/[0.04] transition-all ${ring}`}
        >
          <Upload className={`w-6 h-6 ${tint}`} />
          <span className="text-white text-sm font-medium text-center">{hint}</span>
        </button>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-white text-sm truncate flex-1">{i.name}</span>
                <span className="text-[10px] uppercase tracking-wide text-neutral-500 flex-shrink-0">
                  {i.artwork
                    ? t({ pl: "Projekt", en: "Artwork", de: "Vorlage" }, lang)
                    : t({ pl: "Zdjęcie", en: "Photo", de: "Foto" }, lang)}
                </span>
                {i.busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500 flex-shrink-0" />
                ) : i.error ? (
                  <CircleAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => onRemove(i.id)}
                  className="text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0"
                  aria-label={t({ pl: "Usuń plik", en: "Remove file", de: "Datei entfernen" }, lang)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* PLIK ODRZUCONY ZOSTAJE NA LISCIE razem z powodem. Kasowanie go
                  za klienta wygladalo jak awaria pola: plik migal i znikal. */}
              {i.error && !i.busy && <p className="text-amber-300 text-[11px] mt-1.5 leading-relaxed">{i.error}</p>}
            </div>
          ))}

          {!pelno && (
            <button
              type="button"
              onClick={() => ref.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.02]
                         text-neutral-300 hover:border-white/25 hover:text-white text-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {addLabel || t({ pl: "Dodaj kolejny plik", en: "Add another file", de: "Weitere Datei hinzufügen" }, lang)}
            </button>
          )}
        </div>
      )}

      <input ref={ref} type="file" accept={accept} multiple className="hidden" onChange={wybierz} />
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
          <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf" className="hidden" onChange={onPickImage} />
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
// ------------------------------------------------------------
// PODSTAWA KWOTY WIAZACEJ, WPISANA Z REKI
// ------------------------------------------------------------
// Klient bez pliku dostawal kwote z przedzialu wielkosci, a przedzial jest
// domyslem: "S" znaczylo dla silnika 150 cm3, "M" osiemset. Tutaj pytamy
// o to, co naprawde rozstrzyga cene, i mowimy wprost, jak to liczymy.
//
// WYMIARY LICZYMY JAK BRYLE PELNA, czyli po gornej granicy. Model o tych
// gabarytach nie miesci wiecej materialu, wiec pozniejszy pomiar pliku moze
// kwote tylko obnizyc. Domysl chybia w obie strony, gorna granica w jedna.

const SPEC_LBL = {
  pl: {
    model: "Wymiary wyrobu",
    modelHint: "Podaj gabaryty w milimetrach. Wyceniamy je jak bryłę pełną, więc po wgraniu modelu kwota może już tylko spaść.",
    area: "Pole grawerowania",
    areaHint: "Podaj szerokość i wysokość pola w milimetrach. Cena graweru wynika z pola, nie z wielkości przedmiotu.",
    volume: "Objętość odlewu",
    volumeHint: "Podaj objętość w mililitrach. To ona decyduje o zużyciu żywicy.",
    vector: "Rysunek do wykonania",
    vectorHint: "Cięcia nie da się wycenić z gabarytu: ten sam prostokąt z ażurem to wielokrotnie dłuższa droga noża. Wgraj rysunek SVG albo DXF, albo wyślij zapytanie o wycenę.",
    ml: "ml",
  },
  en: {
    model: "Item dimensions",
    modelHint: "Give the overall size in millimetres. We price it as a solid block, so uploading the model later can only lower the amount.",
    area: "Engraving field",
    areaHint: "Give the width and height of the field in millimetres. Engraving is priced by field, not by the size of the object.",
    volume: "Casting volume",
    volumeHint: "Give the volume in millilitres. That is what decides resin use.",
    vector: "Drawing to cut",
    vectorHint: "Cutting cannot be priced from the outline: the same rectangle with a fretwork is many times more travel for the blade. Upload an SVG or DXF, or send an enquiry.",
    ml: "ml",
  },
  de: {
    model: "Abmessungen des Werkstuecks",
    modelHint: "Geben Sie die Aussenmasse in Millimetern an. Wir rechnen sie als Vollkoerper, ein spaeter hochgeladenes Modell kann den Betrag also nur senken.",
    area: "Gravurfeld",
    areaHint: "Geben Sie Breite und Hoehe des Feldes in Millimetern an. Die Gravur wird nach Feld berechnet, nicht nach Objektgroesse.",
    volume: "Gussvolumen",
    volumeHint: "Geben Sie das Volumen in Millilitern an. Es bestimmt den Harzverbrauch.",
    vector: "Zeichnung zum Schneiden",
    vectorHint: "Schneiden laesst sich nicht aus den Aussenmassen berechnen: dasselbe Rechteck mit Durchbruch bedeutet ein Vielfaches an Schnittweg. Laden Sie SVG oder DXF hoch, oder senden Sie eine Anfrage.",
    ml: "ml",
  },
};

function PoleLiczbowe({ label, value, onChange, accent }) {
  const ring = accent === "amber" ? "focus:border-amber-400/60" : "focus:border-blue-400/60";
  return (
    <label className="flex-1 min-w-0">
      <span className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">{label}</span>
      <input
        type="number" min="1" step="1" inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
        className={`w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-white text-sm outline-none transition-colors ${ring}`}
      />
    </label>
  );
}

/**
 * Pyta o to, czego brakuje do kwoty wiazacej.
 *
 * @param {string[]} missing klucze z `bindingBasis`: model, area, volume, vector
 * @param {object} value  { declaredMm, declaredFieldMm, volumeMl }
 * @param {Function} onChange nowa wartosc
 */
export function DeclaredSpec({ missing = [], value = {}, onChange, lang = "pl", accent = "blue" }) {
  const l = SPEC_LBL[lang] || SPEC_LBL.en;
  if (!missing.length) return null;
  const mm = value.declaredMm || {};
  const pole = value.declaredFieldMm || {};
  const ustaw = (klucz, dane) => onChange({ ...value, [klucz]: dane });

  return (
    <div className="mb-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4">
      {missing.includes("model") && (
        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-wide text-amber-200 mb-2">{l.model}</div>
          <div className="flex gap-2">
            {["x", "y", "z"].map((os) => (
              <PoleLiczbowe key={os} label={`${os.toUpperCase()} (mm)`} value={mm[os]} accent={accent}
                onChange={(v) => ustaw("declaredMm", { ...mm, [os]: v })} />
            ))}
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed mt-2">{l.modelHint}</p>
        </div>
      )}

      {missing.includes("area") && (
        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-wide text-amber-200 mb-2">{l.area}</div>
          <div className="flex gap-2">
            {[["w", "W"], ["h", "H"]].map(([klucz, znak]) => (
              <PoleLiczbowe key={klucz} label={`${znak} (mm)`} value={pole[klucz]} accent={accent}
                onChange={(v) => ustaw("declaredFieldMm", { ...pole, [klucz]: v })} />
            ))}
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed mt-2">{l.areaHint}</p>
        </div>
      )}

      {missing.includes("volume") && (
        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-wide text-amber-200 mb-2">{l.volume}</div>
          <div className="flex gap-2 max-w-[12rem]">
            <PoleLiczbowe label={l.ml} value={value.volumeMl} accent={accent}
              onChange={(v) => onChange({ ...value, volumeMl: v })} />
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed mt-2">{l.volumeHint}</p>
        </div>
      )}

      {missing.includes("vector") && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-amber-200 mb-1">{l.vector}</div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">{l.vectorHint}</p>
        </div>
      )}
    </div>
  );
}

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
