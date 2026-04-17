// ============================================================
// SHARED CONFIG, PRICING & UI — ALL STUDIO CALCULATORS
// ============================================================
import { useState, useRef } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { trackInquiry } from "../../utils/analytics.js";

export const CONFIG = {
  EUR_PLN_RATE: 4.28,
  TOLERANCE_LOW: 0.30,
  TOLERANCE_HIGH: 0.40,
  ENERGY_COST_PLN: 1.05,
  BASE_MARGIN: 0.40,
};

export const QUANTITY_TIERS = [
  { id: "proto",  label: { pl: "1 szt. (prototyp)", en: "1 pc (prototype)", de: "1 Stk. (Prototyp)" }, qty: 1, discount: 0.00 },
  { id: "micro",  label: { pl: "2-10 szt.", en: "2-10 pcs", de: "2-10 Stk." }, qty: 6, discount: 0.05 },
  { id: "small",  label: { pl: "11-20 szt.", en: "11-20 pcs", de: "11-20 Stk." }, qty: 15, discount: 0.10 },
  { id: "medium", label: { pl: "21-50 szt.", en: "21-50 pcs", de: "21-50 Stk." }, qty: 35, discount: 0.15 },
  { id: "large",  label: { pl: "51-100 szt.", en: "51-100 pcs", de: "51-100 Stk." }, qty: 75, discount: 0.20 },
  { id: "custom", label: { pl: "100+ / niestandardowe", en: "100+ / custom", de: "100+ / individuell" }, qty: null, discount: null },
];

/** Lookup helper for multilingual labels */
export function t(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.en || obj.pl || "";
}

/** Format integer with non-breaking thin space as thousands separator */
export function fmtNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

/** Format a PLN cost amount in the right currency for the given language */
export function fmtCost(plnAmount, lang) {
  if (lang === "pl") return `${plnAmount.toFixed(2)} PLN`;
  return `${(plnAmount / CONFIG.EUR_PLN_RATE).toFixed(2)} EUR`;
}

/** Apply margin, discount, tolerance -> price range PLN + EUR */
export function applyPricing(baseCost, margin, discountRate, qty) {
  const basePrice = baseCost * (1 + margin);
  const discounted = basePrice * (1 - discountRate);
  const perMin = Math.round(discounted * (1 - CONFIG.TOLERANCE_LOW));
  const perMax = Math.round(discounted * (1 + CONFIG.TOLERANCE_HIGH));
  return {
    perPcPLN: { min: Math.max(1, perMin), max: Math.max(1, perMax) },
    perPcEUR: { min: Math.max(1, Math.round(perMin / CONFIG.EUR_PLN_RATE)), max: Math.max(1, Math.round(perMax / CONFIG.EUR_PLN_RATE)) },
    totalPLN: { min: Math.max(1, perMin) * qty, max: Math.max(1, perMax) * qty },
    totalEUR: { min: Math.round((Math.max(1, perMin) * qty) / CONFIG.EUR_PLN_RATE), max: Math.round((Math.max(1, perMax) * qty) / CONFIG.EUR_PLN_RATE) },
  };
}

// ============================================================
// SHARED UI COMPONENTS
// ============================================================

export function Chips({ options, value, onChange, lang = "pl" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.id;
        const isCustom = opt.custom;
        const disabled = opt.disabled;
        const label = typeof opt.label === "object" ? (opt.label[lang] || opt.label.en) : opt.label;
        const sub = opt.sub;
        return (
          <button
            key={String(opt.id)}
            onClick={() => !disabled && onChange(opt.id)}
            title={opt.note ? t(opt.note, lang) : undefined}
            disabled={disabled}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border text-xs sm:text-sm transition-all duration-200 max-w-full break-words ${
              disabled ? "border-white/5 bg-white/[0.01] text-neutral-700 cursor-not-allowed line-through" :
              isCustom && !active ? "border-dashed border-white/10 text-neutral-500 italic text-[11px] sm:text-xs" :
              isCustom && active ? "border-dashed border-blue-400 bg-blue-400/10 text-blue-300 font-medium" :
              active ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium" :
              "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
            }`}
          >
            {label}
            {sub && <span className={`text-[10px] ml-1.5 ${active ? "opacity-80" : "text-neutral-600"}`}>{sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function CalcCard({ stepNum, label, children }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mb-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
        {stepNum && <span className="text-blue-400 mr-1.5">{stepNum}</span>}{label}
      </div>
      {children}
    </div>
  );
}

/** Result header — translated */
export function ResultHeader({ lang }) {
  const titles = { pl: "Szacowany zakres cenowy", en: "Estimated price range", de: "Geschaetzter Preisbereich" };
  return <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">{t(titles, lang)}</div>;
}

/** Price result display — PLN for PL, EUR for EN/DE */
export function ResultDisplay({ result, lang = "pl" }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const labels = RESULT_LABELS[lang] || RESULT_LABELS.en;
  const showPLN = lang === "pl";

  if (!result) return <div className="text-center text-neutral-600 py-4">{labels.selectAll}</div>;

  if (result.type === "custom") {
    return (
      <div className="text-center py-4">
        <div className="text-lg font-bold text-blue-400 mb-1">{labels.customQuote}</div>
        <div className="text-sm text-neutral-400">{labels.customDesc}</div>
      </div>
    );
  }

  const r = result;
  const mainPc = showPLN ? r.perPcPLN : r.perPcEUR;
  const mainTotal = showPLN ? r.totalPLN : r.totalEUR;
  const mainCurr = showPLN ? "PLN" : "EUR";

  return (
    <>
      {/* Per piece */}
      <div className="text-center text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
        {labels.perPiece}
        {r.discount > 0 && <span className="text-green-400 ml-2 font-bold">(-{r.discount * 100}%)</span>}
      </div>
      <div className="flex items-baseline justify-center gap-1.5 sm:gap-3 mb-4 flex-wrap">
        <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">{fmtNum(mainPc.min)}</span>
        <span className="text-lg sm:text-xl text-neutral-600">&mdash;</span>
        <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">{fmtNum(mainPc.max)}</span>
        <span className="text-sm sm:text-base font-semibold text-neutral-500">{mainCurr}</span>
      </div>

      {/* Order total (qty > 1) */}
      {r.qty > 1 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-4">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">
            {labels.order}: ~{r.qty} {labels.pcs}
          </div>
          <div className="flex items-baseline justify-center gap-1.5 sm:gap-3 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{fmtNum(mainTotal.min)}</span>
            <span className="text-neutral-600">&mdash;</span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{fmtNum(mainTotal.max)}</span>
            <span className="text-xs sm:text-sm font-semibold text-neutral-500">{mainCurr}</span>
          </div>
          {/* Total production time */}
          {r.totalTimeH != null && (
            <div className="text-center text-xs text-neutral-500 mt-2 pt-2 border-t border-white/5">
              {labels.totalTime}: ~{r.totalTimeH < 1 ? `${Math.round(r.totalTimeH * 60)} min` : `${r.totalTimeH.toFixed(1)} h`}
            </div>
          )}
        </div>
      )}

      {/* Breakdown */}
      {r.breakdown && (
        <>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full py-2.5 rounded-lg border border-white/5 bg-white/[0.02] text-neutral-500 text-xs hover:text-neutral-300 transition-colors"
          >
            {showBreakdown ? "▲ " + labels.hideDetails : "▼ " + labels.showDetails}
          </button>
          {showBreakdown && (
            <div className="mt-3 p-4 bg-white/[0.02] rounded-xl text-sm space-y-1">
              {r.breakdown.map((row, i) => (
                row.divider ? <div key={i} className="border-t border-white/5 my-2" /> :
                <div key={i} className={`flex justify-between ${row.bold ? "font-bold" : ""} ${row.accent ? "text-blue-400" : ""}`}>
                  <span className="text-neutral-500">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div className="mt-2 text-[11px] text-neutral-600 italic">
                {labels.rangeNote}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ============================================================
// INQUIRY FORM — shared across all calculators
// ============================================================

const MAX_DESC_LENGTH = 2000;
const COOLDOWN_MS = 15000; // 15s between sends
const MAX_FILE_SIZE_MB = 25;

const INQUIRY_LABELS = {
  pl: {
    title: "Zapytanie o wycene",
    desc: "Opisz swoj projekt — co chcesz wykonac, wymiary, materialy, inne szczegoly:",
    descPlaceholder: "np. Potrzebuje 50 szt. zawieszek z logo firmy, wymiary 3x4 cm, grawerowanie na stali nierdzewnej...",
    file: "Zalacz plik projektu",
    fileHint: "Model 3D (.stl, .3mf, .step) | Wektor (.svg, .ai, .dxf) | Grafika (.jpg, .png, .pdf)",
    send: "Wyslij zapytanie",
    sending: "Otwieram klienta pocztowego...",
    attachNote: "Plik zostanie wymieniony w wiadomosci — dolacz go do maila recznie",
    cooldown: "Poczekaj chwile przed ponownym wyslaniem",
    tooLong: "Opis jest za dlugi (maks. 2000 znakow)",
    fileTooLarge: "Plik jest za duzy (maks. 25 MB)",
    charCount: "znakow",
  },
  en: {
    title: "Quote request",
    desc: "Describe your project — what you need, dimensions, materials, other details:",
    descPlaceholder: "e.g. I need 50 pendant keychains with company logo, 3x4 cm, stainless steel engraving...",
    file: "Attach project file",
    fileHint: "3D model (.stl, .3mf, .step) | Vector (.svg, .ai, .dxf) | Image (.jpg, .png, .pdf)",
    send: "Send inquiry",
    sending: "Opening email client...",
    attachNote: "File will be mentioned in the message — please attach it to the email manually",
    cooldown: "Please wait before sending again",
    tooLong: "Description is too long (max 2000 characters)",
    fileTooLarge: "File is too large (max 25 MB)",
    charCount: "chars",
  },
  de: {
    title: "Angebotsanfrage",
    desc: "Beschreiben Sie Ihr Projekt — was Sie brauchen, Abmessungen, Materialien, weitere Details:",
    descPlaceholder: "z.B. Ich brauche 50 Anhaenger mit Firmenlogo, 3x4 cm, Edelstahlgravur...",
    file: "Projektdatei anhaengen",
    fileHint: "3D-Modell (.stl, .3mf, .step) | Vektor (.svg, .ai, .dxf) | Bild (.jpg, .png, .pdf)",
    send: "Anfrage senden",
    sending: "E-Mail-Client wird geoeffnet...",
    attachNote: "Datei wird in der Nachricht erwaehnt — bitte haengen Sie sie manuell an die E-Mail an",
    cooldown: "Bitte warten Sie vor dem erneuten Senden",
    tooLong: "Beschreibung ist zu lang (max. 2000 Zeichen)",
    fileTooLarge: "Datei ist zu gross (max. 25 MB)",
    charCount: "Zeichen",
  },
};

/** Strip control characters and suspicious patterns from user input */
function sanitizeText(text) {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
    .replace(/<script[^>]*>.*?<\/script>/gi, "")          // script tags
    .replace(/<[^>]+>/g, "")                               // all HTML tags
    .slice(0, MAX_DESC_LENGTH);
}

export function InquiryForm({ lang = "pl", techLabel, paramsSummary }) {
  const il = INQUIRY_LABELS[lang] || INQUIRY_LABELS.en;
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState("");
  const [honeypot, setHoneypot] = useState("");  // hidden bot trap
  const fileRef = useRef(null);
  const lastSendRef = useRef(0);

  function handleDescChange(e) {
    const val = e.target.value;
    if (val.length <= MAX_DESC_LENGTH) {
      setDescription(val);
      setError("");
    } else {
      setError(il.tooLong);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(il.fileTooLarge);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFileName(file ? file.name : "");
    setError("");
  }

  function clearFile() {
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSend() {
    // Honeypot check — bots fill hidden fields, humans don't
    if (honeypot) return;

    // Rate limiting — cooldown between sends
    const now = Date.now();
    if (now - lastSendRef.current < COOLDOWN_MS) {
      setError(il.cooldown);
      return;
    }

    // Sanitize
    const cleanDesc = sanitizeText(description);

    const subject = `#${il.title} - ${techLabel}`;
    let body = `${il.title}: ${techLabel}\n\n`;
    body += `--- ${paramsSummary} ---\n\n`;
    if (cleanDesc.trim()) body += `${cleanDesc.trim()}\n\n`;
    if (fileName) body += `[${il.attachNote}: ${fileName}]\n`;

    const mailtoUrl = `mailto:contact@aejaca.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    trackInquiry(techLabel, paramsSummary);
    window.location.href = mailtoUrl;

    lastSendRef.current = now;
    setSent(true);
    setCooldown(true);
    setError("");
    setTimeout(() => setSent(false), 3000);
    setTimeout(() => setCooldown(false), COOLDOWN_MS);
  }

  const descLength = description.length;
  const descNearLimit = descLength > MAX_DESC_LENGTH * 0.85;

  return (
    <div className="mt-6 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-400/[0.03] to-transparent p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">
        {il.title} — {techLabel}
      </div>

      {/* Honeypot — invisible to humans, bots auto-fill it */}
      <div className="absolute opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
        <label htmlFor="inquiry_website">Website</label>
        <input id="inquiry_website" type="text" name="website" autoComplete="off"
          value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
      </div>

      {/* Description */}
      <div className="mb-3">
        <div className="text-[11px] text-neutral-500 mb-1.5">{il.desc}</div>
        <textarea
          value={description}
          onChange={handleDescChange}
          placeholder={il.descPlaceholder}
          rows={3}
          maxLength={MAX_DESC_LENGTH}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-blue-400/40 focus:outline-none resize-none transition-colors"
        />
        {descNearLimit && (
          <div className={`text-[10px] text-right mt-0.5 ${descLength >= MAX_DESC_LENGTH ? "text-red-400" : "text-neutral-600"}`}>
            {descLength}/{MAX_DESC_LENGTH} {il.charCount}
          </div>
        )}
      </div>

      {/* File */}
      <div className="mb-4">
        <div className="text-[11px] text-neutral-500 mb-1.5">{il.file}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-neutral-400 text-sm hover:border-white/20 hover:text-neutral-200 transition-all"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {fileName || il.file}
          </button>
          {fileName && (
            <button onClick={clearFile} className="text-neutral-600 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <input ref={fileRef} type="file" className="hidden"
            accept=".stl,.3mf,.step,.stp,.obj,.svg,.ai,.dxf,.jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
          />
        </div>
        <div className="text-[10px] text-neutral-600 mt-1">{il.fileHint}</div>
        {fileName && <div className="text-[10px] text-amber-400/70 mt-1">{il.attachNote}</div>}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 text-[11px] text-red-400 text-center">{error}</div>
      )}

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={cooldown}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-sm transition-all duration-300 ${
          cooldown
            ? "border-white/5 bg-white/[0.02] text-neutral-600 cursor-not-allowed"
            : sent
              ? "border-green-400/30 bg-green-400/10 text-green-400"
              : "border-blue-400/30 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20 hover:border-blue-400/40"
        }`}
      >
        <Send className="w-4 h-4" />
        {cooldown && !sent ? il.cooldown : sent ? il.sending : il.send}
      </button>
    </div>
  );
}

const RESULT_LABELS = {
  pl: {
    perPiece: "Cena za sztuke", order: "Zamowienie", pcs: "szt.",
    showDetails: "Pokaz szczegoly kalkulacji", hideDetails: "Ukryj szczegoly",
    customQuote: "Wycena indywidualna",
    customDesc: "Wybrano parametry niestandardowe — skontaktuj sie w celu dokladnej wyceny.",
    selectAll: "Wybierz wszystkie parametry",
    totalTime: "Szacowany czas produkcji",
    rangeNote: `Zakres: -${CONFIG.TOLERANCE_LOW * 100}% / +${CONFIG.TOLERANCE_HIGH * 100}% | Kurs ${CONFIG.EUR_PLN_RATE} PLN/EUR`,
  },
  en: {
    perPiece: "Price per piece", order: "Order", pcs: "pcs",
    showDetails: "Show calculation details", hideDetails: "Hide details",
    customQuote: "Individual quote",
    customDesc: "Custom parameters selected — contact us for an exact quote.",
    selectAll: "Select all parameters",
    totalTime: "Estimated production time",
    rangeNote: `Range: -${CONFIG.TOLERANCE_LOW * 100}% / +${CONFIG.TOLERANCE_HIGH * 100}% | Rate ${CONFIG.EUR_PLN_RATE} PLN/EUR`,
  },
  de: {
    perPiece: "Preis pro Stueck", order: "Bestellung", pcs: "Stk.",
    showDetails: "Kalkulationsdetails anzeigen", hideDetails: "Details ausblenden",
    customQuote: "Individuelle Kalkulation",
    customDesc: "Individuelle Parameter gewaehlt — kontaktieren Sie uns fuer ein genaues Angebot.",
    selectAll: "Alle Parameter auswaehlen",
    totalTime: "Geschaetzte Produktionszeit",
    rangeNote: `Bereich: -${CONFIG.TOLERANCE_LOW * 100}% / +${CONFIG.TOLERANCE_HIGH * 100}% | Kurs ${CONFIG.EUR_PLN_RATE} PLN/EUR`,
  },
};
