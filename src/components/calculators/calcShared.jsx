// ============================================================
// SHARED CONFIG, PRICING & UI, ALL STUDIO CALCULATORS
// ============================================================
import { useState, useRef, useEffect } from "react";

const CONTACT_API_URL = import.meta.env.VITE_CHAT_API_URL;
const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
import { Link } from "react-router-dom";
import { Send, Paperclip, X, MessageCircle, Mail, ShoppingCart, Microscope, ArrowRight } from "lucide-react";
import { trackInquiry, trackFunnel } from "../../utils/analytics.js";

// Rdzen cenowy zyje w src/pricing/config.js, bo ten sam kod liczy cene
// na backendzie zamowien. Tutaj tylko re-eksport, zeby kalkulatory
// importowaly jak dotad.
import { CONFIG, QUANTITY_TIERS, t, fmtNum, fmtCost, applyPricing } from "../../pricing/config.js";
import { buildQuoteSummary } from "../../pricing/quoteSummary.js";
import { TOOL_LINKS } from "../../data/toolLinks.js";

/**
 * Narzedzia warte sprawdzenia PRZED zamowieniem, wedlug technologii.
 *
 * Lasery zostaja puste swiadomie: jedyne narzedzie laserowe jest warsztatowe,
 * a doklejanie czegokolwiek na sile psuje bardziej, niz pomaga.
 */
const CHECK_TOOLS = {
  "3dprint": ["printability", "print-settings"],
  msla: ["printability", "resin-settings"],
};
export { CONFIG, QUANTITY_TIERS, t, fmtNum, fmtCost, applyPricing };

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
              isCustom && !active ? "border-dashed border-white/10 text-neutral-400 italic text-[11px] sm:text-xs" :
              isCustom && active ? "border-dashed border-blue-400 bg-blue-400/10 text-blue-300 font-medium" :
              active ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium" :
              "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
            }`}
          >
            {label}
            {sub && <span className={`text-[10px] ml-1.5 ${active ? "opacity-80" : "text-neutral-400"}`}>{sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

// WYBRANY KAFELEK MA BYC WIDOCZNY Z DRUGIEGO KONCA POKOJU. Sama obwodka
// w kolorze akcentu ginela na zdjeciu produktowym, ktore samo w sobie jest
// kontrastowe: klient przewijal liste i nie wiedzial, co ma zaznaczone.
// Dlatego roznica idzie DWOMA kanalami naraz. Niewybrane zdjecia schodza
// do szarosci i sciemniaja sie, a wybrane zostaje w kolorze i dostaje szersza
// poswiate. Najazd myszka przywraca kolor, wiec przegladanie oferty nie
// odbywa sie po szarych miniaturach.
export function MaterialCards({ options, value, onChange, lang = "pl", cols = "grid-cols-3 sm:grid-cols-4 md:grid-cols-5" }) {
  return (
    <div className={`grid ${cols} gap-2 sm:gap-3`}>
      {options.filter(o => !o.custom).map(o => {
        const active = value === o.id;
        const label = typeof o.label === "object" ? (o.label[lang] || o.label.en) : o.label;
        return (
          <button key={String(o.id)} onClick={() => onChange(o.id)}
            className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 overflow-hidden ${
              active ? "border-blue-400 bg-blue-400/10 ring-2 ring-blue-400/60 shadow-[0_0_0_5px_rgba(96,165,250,0.14)]"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}>
            <div className={`w-full aspect-square rounded-lg overflow-hidden ${
              o.img ? "bg-black" : "bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"
            }`}>
              {o.img ? (
                <img src={o.img} alt={label} loading="lazy"
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    active ? "scale-105" : "tile-dim opacity-55 group-hover:opacity-100 group-hover:scale-105"
                  }`} />
              ) : (
                <span className="text-2xl opacity-60">⬡</span>
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] text-center leading-tight break-words ${
              active ? "text-blue-300 font-medium" : "text-neutral-400"
            }`}>{label}</span>
          </button>
        );
      })}
      {options.filter(o => o.custom).map(o => {
        const active = value === o.id;
        const label = typeof o.label === "object" ? (o.label[lang] || o.label.en) : o.label;
        return (
          <button key={String(o.id)} onClick={() => onChange(o.id)}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-dashed border transition-all text-xs ${
              active ? "border-blue-400 text-blue-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
            }`}>
            <span className="text-lg opacity-50">?</span>
            <span className="text-center leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function HeroCards({ options, value, onChange, lang = "pl", cols = "grid-cols-2", minH = 160 }) {
  const lbl = (v) => typeof v === "object" ? (v[lang] || v.en) : v;
  return (
    <div className={`grid ${cols} gap-3`}>
      {options.map(o => {
        const active = value === o.id;
        if (o.custom) {
          return (
            <button key={String(o.id)} onClick={() => !o.disabled && onChange(o.id)} disabled={o.disabled}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-dashed border transition-all text-xs ${
                o.disabled ? "border-white/5 text-neutral-700 cursor-not-allowed" :
                active ? "border-blue-400 text-blue-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300"
              }`}>
              <span className="text-lg opacity-50">?</span>
              <span className="text-center leading-tight">{lbl(o.label)}</span>
            </button>
          );
        }
        return (
          <button key={String(o.id)} onClick={() => !o.disabled && onChange(o.id)} disabled={o.disabled}
            style={{ minHeight: `${minH}px` }}
            className={`group relative rounded-xl border text-left transition-all duration-200 overflow-hidden ${
              o.disabled ? "border-white/5 opacity-40 cursor-not-allowed" :
              active ? "border-blue-400 ring-2 ring-blue-400/60 shadow-[0_0_0_6px_rgba(96,165,250,0.16)]" : "border-white/10 hover:border-white/30"
            }`}>
            {o.img && (
              <div className="absolute inset-0 overflow-hidden">
                <img src={o.img} alt={lbl(o.label)} loading="lazy"
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    active ? "scale-105" : "tile-dim opacity-60 group-hover:opacity-100 group-hover:scale-105"
                  }`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />
                {active && <div className="absolute inset-0 bg-blue-400/10 mix-blend-overlay" />}
              </div>
            )}
            <div className="relative p-3 h-full flex flex-col justify-end" style={{ minHeight: `${minH}px` }}>
              <div className={`text-sm font-bold mb-1 drop-shadow-lg tile-ink ${active ? "text-blue-300" : "text-white"}`}>{lbl(o.label)}</div>
              {o.desc && <div className="text-[11px] text-neutral-200 drop-shadow-md tile-ink">{lbl(o.desc)}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function CalcCard({ stepNum, label, children, id }) {
  return (
    <div id={id} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mb-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
        {stepNum && <span className="text-blue-400 mr-1.5">{stepNum}</span>}{label}
      </div>
      {children}
    </div>
  );
}

/** Result header, translated */
export function ResultHeader({ lang, binding = false }) {
  // Naglowek musi zgadzac sie z tym, co jest ponizej. "Zakres" nad konkretna
  // kwota to sprzeczny komunikat.
  const titles = binding
    ? { pl: "Wycena", en: "Quote", de: "Kalkulation" }
    : { pl: "Szacowany zakres cenowy", en: "Estimated price range", de: "Geschätzter Preisbereich" };
  return <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">{t(titles, lang)}</div>;
}

/** Price result display, PLN for PL, EUR for EN/DE */
/**
 * @param {boolean} [props.hideRange] chowa widelki, gdy ponizej stoi kwota
 *        wiazaca. Przedzial opisuje niepewnosc szacunku, wiec postawiony obok
 *        konkretnej kwoty tylko ja podwaza. Zostaje wtedy sama kalkulacja.
 */
export function ResultDisplay({ result, lang = "pl", hideRange = false, binding = null }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const labels = RESULT_LABELS[lang] || RESULT_LABELS.en;
  const showPLN = lang === "pl";

  if (!result) return <div className="text-center text-neutral-400 py-4">{labels.selectAll}</div>;

  if (result.type === "custom") {
    const ctaLabel = { pl: "Skontaktuj się", en: "Contact us", de: "Kontaktieren Sie uns" }[lang] || "Contact us";
    return (
      <div className="text-center py-4">
        <div className="text-lg font-bold text-blue-400 mb-2">{labels.customQuote}</div>
        <div className="text-sm text-neutral-400 mb-4">{labels.customDesc}</div>
        <Link to="/contact/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-blue-400/30 bg-blue-400/10 text-blue-300 text-sm font-medium hover:bg-blue-400/20 transition-colors">
          <MessageCircle className="w-4 h-4" />
          {ctaLabel}
        </Link>
      </div>
    );
  }

  const r = result;
  const mainPc = showPLN ? r.perPcPLN : r.perPcEUR;
  const mainTotal = showPLN ? r.totalPLN : r.totalEUR;
  const mainCurr = showPLN ? "PLN" : "EUR";

  // KWOTA WIAZACA STOI NA GORZE KARTY, w miejscu widelek, i wtedy widelek nie
  // ma wcale. Wczesniej kwota lezala nizej, w panelu koszyka, a na gorze
  // zostawal szacunek policzony dla NAKLADU REPREZENTATYWNEGO PROGU. Klient
  // zamawiajacy dwie sztuki widzial u gory "~6 szt., 132-258 PLN", a nizej
  // "61,84 PLN za 2 szt." i nie mial jak wiedziec, ktora liczba obowiazuje.
  //
  // Napisy i formatowanie kwot przychodza gotowe z `CalcToCart`, zeby nie
  // powstala tu druga kopia tlumaczen.
  const kwotaWiazaca = binding && binding.suma ? binding : null;

  return (
    <div aria-live="polite" aria-atomic="true">
      {kwotaWiazaca && (
        <div className="mb-4">
          <div className="flex items-end justify-between gap-4 mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">{kwotaWiazaca.etykieta}</div>
              <div className="text-3xl font-extrabold text-white leading-tight">{kwotaWiazaca.suma}</div>
              {kwotaWiazaca.sumaDruga && (
                <div className="text-xs text-neutral-500 mt-0.5">{kwotaWiazaca.sumaDruga}</div>
              )}
            </div>
            {kwotaWiazaca.zaSztuke && (
              <div className="text-right text-neutral-400 text-xs">{kwotaWiazaca.zaSztuke}</div>
            )}
          </div>
          <p className="text-neutral-500 text-[11px] leading-relaxed">{kwotaWiazaca.uwaga}</p>
        </div>
      )}

      {/* Per piece */}
      {!hideRange && (
        <>
          <div className="text-center text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
            {labels.perPiece}
            {r.discount > 0 && <span className="text-green-400 ml-2 font-bold">(-{r.discount * 100}%)</span>}
          </div>
          <div className="flex items-baseline justify-center gap-1.5 sm:gap-3 mb-4 flex-wrap">
            <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">{fmtNum(mainPc.min)}</span>
            <span className="text-lg sm:text-xl text-neutral-400"> - </span>
            <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">{fmtNum(mainPc.max)}</span>
            <span className="text-sm sm:text-base font-semibold text-neutral-400">{mainCurr}</span>
          </div>
        </>
      )}

      {/* Order total (qty > 1) */}
      {/* `hideRange` MUSI OBEJMOWAC TAKZE TEN BLOK, nie tylko cene za sztuke.
          Wczesniej chowala sie sama cena jednostkowa, a suma za zamowienie
          zostawala, i to policzona dla NAKLADU REPREZENTATYWNEGO PROGU, a nie
          dla liczby, ktora ustawil klient. Prog "2-10 szt." liczy sie po
          szesciu sztukach, wiec przy dwoch klient widzial "ZAMOWIENIE: ~6 SZT.
          132-258 PLN", a zaraz pod spodem "KWOTA WIAZACA (2 SZT.) 61,84 PLN".
          Obie liczby byly poprawne, kazda z innej reguly, i nic tego nie
          zglaszalo. Wlasciciel slusznie zapytal, ktora obowiazuje.

          Gdy kwota wiazaca jest znana, obowiazuje ona i tylko ona: dotyczy
          rzeczywistego nakladu i to ja klient zaplaci. */}
      {!hideRange && r.qty > 1 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-4">
          <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
            {labels.order}: ~{r.qty} {labels.pcs}
          </div>
          <div className="flex items-baseline justify-center gap-1.5 sm:gap-3 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{fmtNum(mainTotal.min)}</span>
            <span className="text-neutral-400"> - </span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{fmtNum(mainTotal.max)}</span>
            <span className="text-xs sm:text-sm font-semibold text-neutral-400">{mainCurr}</span>
          </div>
          {/* Total production time */}
          {r.totalTimeH != null && (
            <div className="text-center text-xs text-neutral-400 mt-2 pt-2 border-t border-white/5">
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
            className="w-full py-2.5 rounded-lg border border-white/5 bg-white/[0.02] text-neutral-400 text-xs hover:text-neutral-300 transition-colors"
          >
            {showBreakdown ? "▲ " + labels.hideDetails : "▼ " + labels.showDetails}
          </button>
          {showBreakdown && (
            <div className="mt-3 p-4 bg-white/[0.02] rounded-xl text-sm space-y-1">
              {r.breakdown.map((row, i) => (
                row.divider ? <div key={i} className="border-t border-white/5 my-2" /> :
                <div key={i} className={`flex justify-between ${row.bold ? "font-bold" : ""} ${row.accent ? "text-blue-400" : ""}`}>
                  <span className="text-neutral-400">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              {/* Tolerancja opisuje niepewnosc szacunku. Przy kwocie wiazacej
                  nie ma czego opisywac, wiec zostaje sam kurs. */}
              <div className="mt-2 text-[11px] text-neutral-400 italic">
                {hideRange
                  ? ({ pl: `Kurs ${(result.eurPln ?? CONFIG.EUR_PLN_RATE).toFixed(2)} PLN/EUR`,
                       en: `Rate ${(result.eurPln ?? CONFIG.EUR_PLN_RATE).toFixed(2)} PLN/EUR`,
                       de: `Kurs ${(result.eurPln ?? CONFIG.EUR_PLN_RATE).toFixed(2)} PLN/EUR`,
                     }[lang] ?? "")
                  : result.tolLow != null
                    ? ({ pl: `Zakres: -${Math.round(result.tolLow*100)}% / +${Math.round(result.tolHigh*100)}% | Kurs ${(result.eurPln ?? CONFIG.EUR_PLN_RATE).toFixed(2)} PLN/EUR`,
                         en: `Range: -${Math.round(result.tolLow*100)}% / +${Math.round(result.tolHigh*100)}% | Rate ${(result.eurPln ?? CONFIG.EUR_PLN_RATE).toFixed(2)} PLN/EUR`,
                         de: `Bereich: -${Math.round(result.tolLow*100)}% / +${Math.round(result.tolHigh*100)}% | Kurs ${(result.eurPln ?? CONFIG.EUR_PLN_RATE).toFixed(2)} PLN/EUR`,
                       }[lang] ?? labels.rangeNote)
                    : labels.rangeNote}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// QUOTE EMAIL CAPTURE, lead capture after price result
// ============================================================

const QUOTE_API_URL = CONTACT_API_URL ? `${CONTACT_API_URL}/api/quote` : null;

const QUOTE_LABELS = {
  pl: {
    title: "Wyślij wycenę na email",
    placeholder: "twoj@email.com",
    send: "Wyślij",
    consent: "Zgadzam się na otrzymanie wyceny i kontakt mailowy w sprawie projektu.",
    sent: "Wycena wysłana!",
    sentSub: "Sprawdź skrzynkę, wycena jest już w drodze.",
    error: "Coś poszło nie tak, spróbuj ponownie.",
    fileNote: "Plik zostanie uwzględniony w zapytaniu",
    verifyNote: "Wycena zostanie zweryfikowana przez nasz zespół, potwierdzimy ją mailowo",
  },
  en: {
    title: "Get this quote by email",
    placeholder: "your@email.com",
    send: "Send",
    consent: "I agree to receive the quote and follow-up emails about my project.",
    sent: "Quote sent!",
    sentSub: "Check your inbox, quote is on its way.",
    error: "Something went wrong, please try again.",
    fileNote: "File will be included in the inquiry",
    verifyNote: "The estimate will be verified by our team, we'll confirm it by email",
  },
  de: {
    title: "Angebot per E-Mail erhalten",
    placeholder: "ihre@email.de",
    send: "Senden",
    consent: "Ich stimme dem Erhalt des Angebots und Folge-E-Mails zu meinem Projekt zu.",
    sent: "Angebot gesendet!",
    sentSub: "Prüfen Sie Ihren Posteingang, das Angebot ist unterwegs.",
    error: "Etwas ist schiefgelaufen, bitte versuchen Sie es erneut.",
    fileNote: "Datei wird in der Anfrage berücksichtigt",
    verifyNote: "Der Kostenvoranschlag wird von unserem Team geprüft, wir bestätigen ihn per E-Mail",
  },
};

export function QuoteEmailCapture({ result, lang = "pl", techLabel, paramsSummary, preAttachedFile = null, rateSnapshot = null, embedded = false, summaryCtx = null }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("idle");
  const [honeypot, setHoneypot] = useState("");
  const cooldownRef = useRef(false);

  // Reset form when calculator params change after a successful send
  useEffect(() => {
    setStatus(prev => {
      if (prev === "sent") { cooldownRef.current = false; return "idle"; }
      return prev;
    });
  }, [paramsSummary]);

  const lbl = QUOTE_LABELS[lang] || QUOTE_LABELS.en;

  if (!QUOTE_API_URL || !result || result.type === "custom") return null;

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e) {
    e.preventDefault();
    if (honeypot || !isValid || !consent || status === "sending" || cooldownRef.current) return;

    setStatus("sending");
    cooldownRef.current = true;

    try {
      let filePayload = null;
      // Skip file if too large, base64 overhead (~33%) would push 35MB to ~46MB,
      // staying under the 50MB JSON limit on /api/quote
      if (preAttachedFile && preAttachedFile.size <= 35 * 1024 * 1024) {
        try {
          const data = await new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result.split(",")[1]);
            fr.onerror = reject;
            fr.readAsDataURL(preAttachedFile);
          });
          filePayload = { name: preAttachedFile.name, type: preAttachedFile.type || "application/octet-stream", data };
        } catch {
          filePayload = null;
        }
      }

      const res = await fetch(QUOTE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lang,
          calculator: techLabel,
          // Pelne podsumowanie, a nie sama lista wyborow: rozpiska ceny,
          // uwagi do modelu i zgody musza zostac w dokumencie, ktory klient
          // dostaje jako potwierdzenie.
          params: summaryCtx
            ? buildQuoteSummary({ ...summaryCtx, consents: { contact: consent } })
            : paramsSummary,
          price: {
            perPcPLN: result.perPcPLN,
            perPcEUR: result.perPcEUR,
            qty: result.qty,
            discount: result.discount,
          },
          ...(filePayload ? { file: filePayload } : {}),
          ...(rateSnapshot ? { rateSnapshot } : {}),
          ts: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setStatus("sent");
        if (typeof window.gtag === "function") {
          window.gtag("event", "quote_email_capture", { calculator: techLabel });
        }
      } else {
        setStatus("error");
        setTimeout(() => { cooldownRef.current = false; }, 5000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => { cooldownRef.current = false; }, 5000);
    }
  }

  // W panelu "Co dalej?" akcje maja wspolna ramke i wspolny naglowek, wiec
  // wlasna kreska i wlasny tytul tylko powielalyby to, co juz stoi wyzej.
  const shell = embedded ? "" : "mt-4 pt-4 border-t border-white/5";

  if (status === "sent") {
    return (
      <div className={`${shell} text-center animate-in fade-in`}>
        <div className="inline-flex items-center gap-2 text-green-400 text-sm font-medium">
          <Mail className="w-4 h-4" />
          {lbl.sent}
        </div>
        <div className="text-neutral-500 text-xs mt-1">{lbl.sentSub}</div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {!embedded && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            {lbl.title}
          </div>
        )}

        {/* Honeypot */}
        <div className="sr-only" aria-hidden="true">
          <input type="text" name="company_url" autoComplete="off"
            value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
        </div>

        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lbl.placeholder}
            required
            className="flex-1 min-w-0 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-colors"
          />
          <button
            type="submit"
            disabled={!isValid || !consent || status === "sending"}
            className="flex items-center justify-center px-4 py-2 rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-300 text-sm font-medium hover:bg-blue-400/20 hover:border-blue-400/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Send className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">{status === "sending" ? "..." : lbl.send}</span>
          </button>
        </div>

        {preAttachedFile && (
          <div className="flex items-center gap-1.5 text-[11px] text-blue-300/80 bg-blue-400/[0.04] border border-blue-400/15 rounded-md px-2 py-1.5">
            <span aria-hidden="true">📎</span>
            <span className="truncate font-medium">{preAttachedFile.name}</span>
            <span className="text-neutral-500 truncate"> - {lbl.fileNote}</span>
          </div>
        )}

        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-blue-400 shrink-0" />
          <span className="text-[11px] text-neutral-500 leading-tight">{lbl.consent}</span>
        </label>

        <div className="text-[10px] text-neutral-500 italic leading-tight">
          {lbl.verifyNote}
        </div>

        {status === "error" && (
          <div className="text-[11px] text-red-400 text-center">{lbl.error}</div>
        )}
      </form>
    </div>
  );
}

// ============================================================
// FIGURINE LICENSE NOTICE, shown on MSLA figurine/miniature paths
// ============================================================

export const LICENSE_NOTICE_TEXT = {
  pl: "Drukujemy wyłącznie pliki własne klienta, modele na licencji komercyjnej lub nasze projekty. Nie drukujemy modeli objętych cudzymi prawami autorskimi (np. figurki systemów bitewnych bez licencji).",
  en: "We only print the customer's own files, models under a commercial license, or our own designs. We do not print models covered by third-party copyright (e.g. wargame miniatures without a license).",
  de: "Wir drucken ausschließlich eigene Dateien des Kunden, Modelle mit kommerzieller Lizenz oder unsere eigenen Entwürfe. Wir drucken keine Modelle, die dem Urheberrecht Dritter unterliegen (z.B. Tabletop-Miniaturen ohne Lizenz).",
};

export function LicenseNotice({ lang = "pl" }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-400/15 bg-blue-400/[0.04] text-[11px] leading-relaxed text-neutral-300 mb-4">
      <span className="text-blue-400 mt-0.5 shrink-0" aria-hidden="true">ⓘ</span>
      <span>{t(LICENSE_NOTICE_TEXT, lang)}</span>
    </div>
  );
}

const LICENSE_CONSENT_LABEL = {
  pl: "Potwierdzam, że przesyłany plik jest moim projektem, modelem na licencji komercyjnej lub projektem AEJaCA i nie narusza cudzych praw autorskich.",
  en: "I confirm the submitted file is my own design, a commercially licensed model, or an AEJaCA design, and does not infringe third-party copyright.",
  de: "Ich bestätige, dass die übermittelte Datei mein eigener Entwurf, ein kommerziell lizenziertes Modell oder ein AEJaCA-Entwurf ist und keine Urheberrechte Dritter verletzt.",
};

// ============================================================
// INQUIRY FORM, shared across all calculators
// ============================================================

const MAX_DESC_LENGTH = 2000;
const COOLDOWN_MS = 15000; // 15s between sends
const MAX_FILE_SIZE_MB = 50;
/** Ile zalacznikow przyjmuje jedno zapytanie. Musi zgadzac sie z MAX_QUOTE_FILES na serwerze. */
const MAX_INQUIRY_FILES = 6;

const INQUIRY_LABELS = {
  pl: {
    title: "Zapytanie o wycenę",
    desc: "Opisz swój projekt, co chcesz wykonać, wymiary, materiały, inne szczegóły:",
    descPlaceholder: "np. Potrzebuję 50 szt. zawieszek z logo firmy, wymiary 3x4 cm, grawerowanie na stali nierdzewnej...",
    emailLabel: "Twój adres e-mail",
    emailPlaceholder: "twoj@email.pl",
    emailRequired: "Podaj poprawny adres e-mail",
    file: "Załącz plik projektu",
    fileMore: "Dodaj kolejny plik",
    fileHint: "Model 3D (.stl, .3mf, .step) | Wektor (.svg, .ai, .dxf) | Grafika (.jpg, .png, .pdf)",
    send: "Wyślij zapytanie",
    sending: "Wysyłanie...",
    sent: "Wysłano!",
    sendError: "Coś poszło nie tak. Spróbuj jeszcze raz.",
    attachNote: "Pliki zostaną dołączone do wiadomości",
    cooldown: "Poczekaj chwilę przed ponownym wysłaniem",
    tooLong: "Opis jest za długi (maks. 2000 znaków)",
    fileTooLarge: "Plik jest za duży (maks. 50 MB)",
    charCount: "znaków",
  },
  en: {
    title: "Quote request",
    desc: "Describe your project, what you need, dimensions, materials, other details:",
    descPlaceholder: "e.g. I need 50 pendant keychains with company logo, 3x4 cm, stainless steel engraving...",
    emailLabel: "Your email address",
    emailPlaceholder: "your@email.com",
    emailRequired: "Please enter a valid email address",
    file: "Attach project file",
    fileMore: "Add another file",
    fileHint: "3D model (.stl, .3mf, .step) | Vector (.svg, .ai, .dxf) | Image (.jpg, .png, .pdf)",
    send: "Send inquiry",
    sending: "Sending...",
    sent: "Sent!",
    sendError: "Something went wrong. Please try again.",
    attachNote: "The files will be attached to your message",
    cooldown: "Please wait before sending again",
    tooLong: "Description is too long (max 2000 characters)",
    fileTooLarge: "File is too large (max 50 MB)",
    charCount: "chars",
  },
  de: {
    title: "Angebotsanfrage",
    desc: "Beschreiben Sie Ihr Projekt, was Sie brauchen, Abmessungen, Materialien, weitere Details:",
    descPlaceholder: "z.B. Ich brauche 50 Anhaenger mit Firmenlogo, 3x4 cm, Edelstahlgravur...",
    emailLabel: "Ihre E-Mail-Adresse",
    emailPlaceholder: "ihre@email.de",
    emailRequired: "Bitte eine gültige E-Mail-Adresse eingeben",
    file: "Projektdatei anhaengen",
    fileMore: "Weitere Datei hinzufügen",
    fileHint: "3D-Modell (.stl, .3mf, .step) | Vektor (.svg, .ai, .dxf) | Bild (.jpg, .png, .pdf)",
    send: "Anfrage senden",
    sending: "Wird gesendet...",
    sent: "Gesendet!",
    sendError: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    attachNote: "Die Dateien werden Ihrer Nachricht angehängt",
    cooldown: "Bitte warten Sie vor dem erneuten Senden",
    tooLong: "Beschreibung ist zu lang (max. 2000 Zeichen)",
    fileTooLarge: "Datei ist zu groß (max. 50 MB)",
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

export function InquiryForm({ lang = "pl", techLabel, paramsSummary, preAttachedFile = null, requireLicenseConsent = false, embedded = false, summaryCtx = null }) {
  const il = INQUIRY_LABELS[lang] || INQUIRY_LABELS.en;
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  // WIELE ZALACZNIKOW, tak jak przy dodawaniu do koszyka. Jedno pole na jeden
  // plik kazalo klientowi wybierac, ktory z trzech rysunkow jest wazniejszy,
  // albo wysylac zapytanie dwa razy.
  const [files, setFiles] = useState([]);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [licenseConsent, setLicenseConsent] = useState(false);
  const fileRef = useRef(null);
  const lastSendRef = useRef(0);
  const licenseLabel = t(LICENSE_CONSENT_LABEL, lang);

  // Plik wgrany w kalkulatorze wchodzi na liste jako pierwszy: to on jest
  // podstawa wyceny, wiec ma dojechac nawet wtedy, gdy klient doda kolejne.
  useEffect(() => {
    if (!preAttachedFile) { setFiles([]); return; }
    if (preAttachedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFiles([]);
      setError(il.fileTooLarge);
      return;
    }
    setFiles([preAttachedFile]);
    setError("");
  }, [preAttachedFile, il.fileTooLarge]);

  useEffect(() => {
    trackFunnel(techLabel, "open_inquiry_form");
  }, [techLabel]);

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
    const wybrane = Array.from(e.target.files || []);
    // Pole czyscimy zawsze, inaczej wybranie tego samego pliku po skasowaniu
    // go z listy nie wywola juz zdarzenia zmiany.
    if (fileRef.current) fileRef.current.value = "";
    if (!wybrane.length) return;

    const zaDuze = wybrane.filter((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    const dobre = wybrane.filter((f) => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
    setError(zaDuze.length ? il.fileTooLarge : "");
    if (!dobre.length) return;

    setFiles((biezace) => {
      const wolne = MAX_INQUIRY_FILES - biezace.length;
      if (wolne <= 0) return biezace;
      // Ten sam plik wybrany dwa razy poszedlby dwa razy i tak samo wygladal
      // w skrzynce, wiec odsiewamy po nazwie i rozmiarze.
      const znane = new Set(biezace.map((f) => `${f.name}|${f.size}`));
      return [...biezace, ...dobre.filter((f) => !znane.has(`${f.name}|${f.size}`)).slice(0, wolne)];
    });
  }

  function clearFile(idx) {
    setFiles((biezace) => biezace.filter((_, i) => i !== idx));
  }

  async function handleSend() {
    if (honeypot || sending || cooldown) return;
    if (requireLicenseConsent && !licenseConsent) return;

    if (!CONTACT_EMAIL_RE.test(email)) {
      setError(il.emailRequired);
      return;
    }

    const now = Date.now();
    if (now - lastSendRef.current < COOLDOWN_MS) {
      setError(il.cooldown);
      return;
    }

    const cleanDesc = sanitizeText(description);
    const podsumowanie = summaryCtx
      ? buildQuoteSummary({
          ...summaryCtx,
          consents: {
            ...(requireLicenseConsent ? { license: licenseConsent } : {}),
            ...(summaryCtx.printability?.blocked ? { printNotes: Boolean(summaryCtx.printability.accepted) } : {}),
          },
        })
      : paramsSummary;
    const message = [podsumowanie, cleanDesc.trim()].filter(Boolean).join("\n\n");

    if (!CONTACT_API_URL) {
      // Fallback to mailto
      const subject = `#${il.title} - ${techLabel}`;
      const body = `${il.title}: ${techLabel}\nEmail: ${email}\n\n--- ${paramsSummary} ---\n\n${cleanDesc.trim()}${files.length ? `\n[Files: ${files.map((f) => f.name).join(", ")}]` : ""}`;
      trackInquiry(techLabel, paramsSummary);
      window.location.href = `mailto:contact@aejaca.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      lastSendRef.current = now;
      setSent(true);
      setCooldown(true);
      setTimeout(() => setSent(false), 3000);
      setTimeout(() => setCooldown(false), COOLDOWN_MS);
      return;
    }

    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("email", email.trim());
      fd.append("subject", `${techLabel} inquiry`);
      fd.append("message", message);
      fd.append("lang", lang);
      fd.append("source", "calculator");
      // Kazdy plik osobno pod tym samym kluczem: serwer sklada je z powrotem
      // w jedna liste, a starsze formularze nadal wysylaja pojedyncze "file".
      for (const f of files) fd.append("files", f, f.name);

      const res = await fetch(`${CONTACT_API_URL}/api/contact`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        trackInquiry(techLabel, paramsSummary);
        trackFunnel(techLabel, "inquiry_sent");
        lastSendRef.current = now;
        setSent(true);
        setCooldown(true);
        setTimeout(() => setSent(false), 5000);
        setTimeout(() => setCooldown(false), COOLDOWN_MS);
      } else {
        setError(il.sendError);
      }
    } catch {
      setError(il.sendError);
    } finally {
      setSending(false);
    }
  }

  const descLength = description.length;
  const descNearLimit = descLength > MAX_DESC_LENGTH * 0.85;

  return (
    <div className={embedded ? "" : "mt-6 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-400/[0.03] to-transparent p-5"}>
      {!embedded && (
        <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">
          {il.title}, {techLabel}
        </div>
      )}

      {/* Honeypot, invisible to humans, bots auto-fill it */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="inquiry_website">Website</label>
        <input id="inquiry_website" type="text" name="website" autoComplete="off"
          value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
      </div>

      {/* Email */}
      <div className="mb-3">
        <label htmlFor="inquiry-email" className="block text-[11px] text-neutral-400 mb-1.5">{il.emailLabel}</label>
        <input
          id="inquiry-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder={il.emailPlaceholder}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-colors"
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label htmlFor="inquiry-desc" className="block text-[11px] text-neutral-400 mb-1.5">{il.desc}</label>
        <textarea
          id="inquiry-desc"
          value={description}
          onChange={handleDescChange}
          placeholder={il.descPlaceholder}
          rows={3}
          maxLength={MAX_DESC_LENGTH}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-400 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 resize-none transition-colors"
        />
        {descNearLimit && (
          <div className={`text-[10px] text-right mt-0.5 ${descLength >= MAX_DESC_LENGTH ? "text-red-400" : "text-neutral-400"}`}>
            {descLength}/{MAX_DESC_LENGTH} {il.charCount}
          </div>
        )}
      </div>

      {/* File */}
      <div className="mb-4">
        <div className="text-[11px] text-neutral-400 mb-1.5">{il.file}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={files.length >= MAX_INQUIRY_FILES}
            aria-label={il.file}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-neutral-400 text-sm transition-all ${
              files.length >= MAX_INQUIRY_FILES
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-white/20 hover:text-neutral-200"
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            {files.length ? il.fileMore : il.file}
          </button>
          <input ref={fileRef} type="file" className="hidden" multiple
            accept=".stl,.3mf,.step,.stp,.obj,.svg,.ai,.dxf,.jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {files.map((f, i) => (
              <div key={`${f.name}|${f.size}|${i}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5">
                <Paperclip className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="text-neutral-200 text-xs truncate flex-1">{f.name}</span>
                <button onClick={() => clearFile(i)} aria-label={`${il.file}: ${f.name}`} className="text-neutral-400 hover:text-red-400 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-[10px] text-neutral-400 mt-1">{il.fileHint}</div>
        {files.length > 0 && <div className="text-[10px] text-blue-400/70 mt-1">{il.attachNote}</div>}
      </div>

      {/* License consent, MSLA figurine/miniature path only */}
      {requireLicenseConsent && (
        <label className="flex items-start gap-2 cursor-pointer select-none mb-3">
          <input type="checkbox" checked={licenseConsent} onChange={(e) => setLicenseConsent(e.target.checked)}
            className="mt-0.5 accent-blue-400 shrink-0" />
          <span className="text-[11px] text-neutral-400 leading-tight">{licenseLabel}</span>
        </label>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-3 text-[11px] text-red-400 text-center">{error}</div>
      )}

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={sending || cooldown || (requireLicenseConsent && !licenseConsent)}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-sm transition-all duration-300 ${
          sending || (cooldown && !sent) || (requireLicenseConsent && !licenseConsent)
            ? "border-white/5 bg-white/[0.02] text-neutral-400 cursor-not-allowed"
            : sent
              ? "border-green-400/30 bg-green-400/10 text-green-400"
              : "border-blue-400/30 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20 hover:border-blue-400/40"
        }`}
      >
        <Send className="w-4 h-4" />
        {sending ? il.sending : sent ? il.sent : (cooldown ? il.cooldown : il.send)}
      </button>
    </div>
  );
}

// ============================================================
// PANEL "CO DALEJ", jedno miejsce na wszystkie akcje po wycenie
// ============================================================
// Do tej pory pod wynikiem staly cztery osobne wezwania, kazde we wlasnej
// ramce: dodanie do koszyka, zapis wyceny, pole "wyslij wycene na email" i
// pelny formularz zapytania. Kazde wygladalo na to glowne, wiec klient albo
// wybieral pierwsze z brzegu, albo nie zauwazal tego, ktore pasowalo do jego
// sytuacji. Nikt nie zglaszal bledu, bo bledu nie bylo. Byl tylko wybor
// podjety przez zmeczenie.
//
// Teraz akcje stoja obok siebie w jednym oknie, a tresc wybranej rozwija sie
// pod spodem. Zakup i analiza maja te sama wage wizualna, bo to sa dwie rowne
// drogi dla dwoch roznych sytuacji, a nie sciezka glowna i awaryjna.

const NEXT_STEP_LABELS = {
  pl: {
    title: "Co dalej?",
    checkFirst: "Sprawdź, zanim zamówisz",
    cart: "Dodaj do koszyka",
    cartSub: "Zamawiasz od razu",
    inquiry: "Wyślij do precyzyjnej wyceny",
    inquirySub: "Sprawdzimy i odpiszemy",
    email: "Wyślij mi tę wycenę na maila",
    emailSub: "Wrócisz do niej później",
    cartOff: "Tej konfiguracji nie policzymy automatycznie",
    cartOffHint: "Wyceniamy ją indywidualnie, wystarczy zapytanie obok.",
  },
  en: {
    title: "What next?",
    checkFirst: "Check before you order",
    cart: "Add to cart",
    cartSub: "Order right away",
    inquiry: "Send for a precise quote",
    inquirySub: "We check it and reply",
    email: "Email me this quote",
    emailSub: "Come back to it later",
    cartOff: "We cannot price this configuration automatically",
    cartOffHint: "We quote it individually, an inquiry is enough.",
  },
  de: {
    title: "Wie weiter?",
    checkFirst: "Vor der Bestellung prüfen",
    cart: "In den Warenkorb",
    cartSub: "Direkt bestellen",
    inquiry: "Zur genauen Kalkulation senden",
    inquirySub: "Wir prüfen und antworten",
    email: "Angebot per E-Mail",
    emailSub: "Später darauf zurückkommen",
    cartOff: "Diese Konfiguration können wir nicht automatisch berechnen",
    cartOffHint: "Wir kalkulieren sie individuell, eine Anfrage genügt.",
  },
};

function ActionTab({ active, disabled, onClick, icon: Icon, label, sub, accent }) {
  const ring = accent === "amber" ? "border-amber-400/40 bg-amber-400/10" : "border-blue-400/40 bg-blue-400/10";
  const text = accent === "amber" ? "text-amber-300" : "text-blue-300";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex-1 min-w-0 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors ${
        disabled
          ? "border-white/5 bg-white/[0.02] text-neutral-600 cursor-not-allowed"
          : active
            ? `${ring} ${text}`
            : "border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/20"
      }`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        <span className="block text-[11px] text-neutral-500 leading-tight mt-0.5">{sub}</span>
      </span>
    </button>
  );
}

/**
 * Jedno okno z akcjami po wycenie.
 *
 * @param {React.ReactNode} [props.cart] gotowy <CalcToCart embedded />. Kazdy
 *        kalkulator ma inne parametry zamowienia, wiec panel go nie sklada,
 *        tylko dostaje gotowy i osadza.
 * @param {boolean} [props.cartAvailable] czy zakup w ogole wchodzi w gre.
 *        Fałsz przy wyniku "custom", przy pliku, ktorego nie wyceniamy z
 *        geometrii, i wszedzie tam, gdzie parametry wychodza poza ramy.
 */
export function NextStepPanel({
  lang = "pl",
  techLabel,
  paramsSummary,
  result = null,
  cart = null,
  cartAvailable = true,
  cartOffReason = null,
  preAttachedFile = null,
  requireLicenseConsent = false,
  rateSnapshot = null,
  accent = "blue",
  printability = null,
  fileScale = 1,
  tech = null,
}) {
  const l = NEXT_STEP_LABELS[lang] || NEXT_STEP_LABELS.en;
  const canBuy = Boolean(cart) && cartAvailable && result?.type !== "custom";
  const canEmail = Boolean(result) && result.type !== "custom";
  // Narzedzia dobieramy do TECHNOLOGII, ktora wlasnie wyceniono. Przy laserze
  // nic tu nie wstawiamy: jedyne narzedzie laserowe jest warsztatowe (audience
  // "maker"), a wypelniacz szkodzi bardziej niz brak.
  const checkTools = (CHECK_TOOLS[tech] || [])
    .map((id) => TOOL_LINKS.find((x) => x.id === id))
    .filter(Boolean);
  // Wybor klienta trzymamy osobno od wyboru pokazywanego, bo to nie to samo.
  // Zapamietane jest tylko to, co klient sam kliknal; jesli ta zakladka
  // przestaje byc dostepna, render sam schodzi na dostepna, bez poprawiania
  // stanu po fakcie. Poprzednia wersja robila to efektem i update stanu w
  // trakcie hydratacji przewracal granice Suspense w koszyku na renderowanie
  // po stronie klienta.
  const [chosen, setChosen] = useState(null);

  // Gdy zakup przestaje byc mozliwy w trakcie (klient zmienil parametry albo
  // wgral plik, ktorego nie wyceniamy), panel nie moze zostac na zakladce,
  // ktorej juz nie ma. Inaczej klient patrzy na puste okno.
  // Komplet danych do podsumowania w mailu. Zgody dokladaja sobie same
  // formularze, bo tylko one wiedza, co klient odhaczyl w chwili wyslania.
  const summaryCtx = {
    techLabel,
    params: paramsSummary,
    result,
    printability,
    file: preAttachedFile ? { name: preAttachedFile.name, scale: fileScale } : null,
    lang,
  };

  const dostepna = (a) => (a === "cart" ? canBuy : a === "email" ? canEmail : true);
  const action = chosen && dostepna(chosen) ? chosen : canBuy ? "cart" : "inquiry";
  const setAction = setChosen;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">{l.title}</div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <ActionTab
          active={action === "cart"}
          disabled={!canBuy}
          onClick={() => setAction("cart")}
          icon={ShoppingCart}
          label={l.cart}
          sub={canBuy ? l.cartSub : (cartOffReason || l.cartOff)}
          accent={accent}
        />
        <ActionTab
          active={action === "inquiry"}
          onClick={() => setAction("inquiry")}
          icon={Microscope}
          label={l.inquiry}
          sub={l.inquirySub}
          accent={accent}
        />
      </div>

      {canEmail && (
        <button
          type="button"
          onClick={() => setAction(action === "email" ? (canBuy ? "cart" : "inquiry") : "email")}
          className={`w-full flex items-center gap-2 mb-4 text-xs transition-colors ${
            action === "email" ? "text-blue-300" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span>{l.email}</span>
          <span className="text-neutral-600">{action === "email" ? "▲" : "▼"}</span>
        </button>
      )}

      {!canBuy && action === "inquiry" && cart && (
        <div className="mb-3 text-[11px] text-neutral-500 leading-relaxed">{l.cartOffHint}</div>
      )}

      {/* Koszyk zostaje zamontowany zawsze, tylko schowany, gdy klient patrzy
          na inna zakladke. To on pyta serwer o kwote wiazaca i oddaje ja wyzej
          przez onBinding, wiec odmontowanie go kasowaloby cene, ktora naglowek
          wyniku juz zdazyl ogloszyc. Nic by sie nie wywalilo, po prostu kwota
          zniknelaby bez slowa. */}
      {/* SEKCJA "SPRAWDZ PRZED ZAMOWIENIEM" LEZY POD CALYM KALKULATOREM.
          Klient, ktory wlasnie dodaje do koszyka, nigdy tam nie dojedzie:
          konczy w koszyku, a nie kilka ekranow nizej. Narzedzie, ktore ma
          uchronic przed zamowieniem niedrukowalnego modelu, musi stac przy
          decyzji, a nie za nia. Otwieramy w nowej karcie, bo wracamy tu
          do skonfigurowanej wyceny, a nie zaczynamy od nowa. */}
      {action === "cart" && canBuy && checkTools.length > 0 && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{l.checkFirst}</div>
          <div className="flex flex-wrap gap-2">
            {checkTools.map((n) => (
              <a
                key={n.id}
                href={n.to}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10
                           bg-white/[0.03] text-neutral-300 hover:border-white/25 hover:text-white text-xs transition-colors"
              >
                {t(n.label, lang)} <ArrowRight className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {cart && (
        <div className={action === "cart" && canBuy ? "" : "hidden"} aria-hidden={action !== "cart"}>
          {cart}
        </div>
      )}

      {action === "inquiry" && (
        <InquiryForm
          embedded
          summaryCtx={summaryCtx}
          lang={lang}
          techLabel={techLabel}
          paramsSummary={paramsSummary}
          preAttachedFile={preAttachedFile}
          requireLicenseConsent={requireLicenseConsent}
        />
      )}

      {action === "email" && canEmail && (
        <QuoteEmailCapture
          embedded
          summaryCtx={summaryCtx}
          result={result}
          lang={lang}
          techLabel={techLabel}
          paramsSummary={paramsSummary}
          preAttachedFile={preAttachedFile}
          rateSnapshot={rateSnapshot}
        />
      )}
    </div>
  );
}

const RESULT_LABELS = {
  pl: {
    perPiece: "Cena za sztukę", order: "Zamówienie", pcs: "szt.",
    showDetails: "Pokaż szczegóły kalkulacji", hideDetails: "Ukryj szczegóły",
    customQuote: "Indywidualne ustalenie warunków",
    customDesc: "Skontaktuj się z nami, wspólnie ustalimy szczegóły zlecenia i przygotujemy dedykowaną wycenę.",
    selectAll: "Wybierz wszystkie parametry",
    totalTime: "Szacowany czas produkcji",
    rangeNote: `Zakres: -${CONFIG.TOLERANCE_LOW * 100}% / +${CONFIG.TOLERANCE_HIGH * 100}% | Kurs ${CONFIG.EUR_PLN_RATE} PLN/EUR`,
  },
  en: {
    perPiece: "Price per piece", order: "Order", pcs: "pcs",
    showDetails: "Show calculation details", hideDetails: "Hide details",
    customQuote: "Individual terms required",
    customDesc: "Contact us, we'll determine the order details together and prepare a dedicated quote.",
    selectAll: "Select all parameters",
    totalTime: "Estimated production time",
    rangeNote: `Range: -${CONFIG.TOLERANCE_LOW * 100}% / +${CONFIG.TOLERANCE_HIGH * 100}% | Rate ${CONFIG.EUR_PLN_RATE} PLN/EUR`,
  },
  de: {
    perPiece: "Preis pro Stück", order: "Bestellung", pcs: "Stk.",
    showDetails: "Kalkulationsdetails anzeigen", hideDetails: "Details ausblenden",
    customQuote: "Individuelle Konditionen erforderlich",
    customDesc: "Kontaktieren Sie uns, wir legen die Auftragsdetails gemeinsam fest und erstellen ein dediziertes Angebot.",
    selectAll: "Alle Parameter auswählen",
    totalTime: "Geschätzte Produktionszeit",
    rangeNote: `Bereich: -${CONFIG.TOLERANCE_LOW * 100}% / +${CONFIG.TOLERANCE_HIGH * 100}% | Kurs ${CONFIG.EUR_PLN_RATE} PLN/EUR`,
  },
};
