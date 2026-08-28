// ============================================================
// WEJSCIE Z NUMEREM OFERTY
// ============================================================
// Strona `/oferta/` umiala przyjac sam numer od poczatku, ale nie prowadzil
// do niej zaden odnosnik: ma `noindex`, nie ma jej w menu ani w mapie strony.
// Klient, ktory zgubil maila z linkiem, nie mial jak tam trafic inaczej niz
// przez nasza podpowiedz w korespondencji.
//
// Ten komponent jest tym brakujacym wejsciem. Nie liczy niczego i niczego nie
// sprawdza po stronie serwera: przenosi numer do adresu strony oferty, a ta
// dopyta o drugi skladnik. Sam numer nie wpuszcza do oferty i nie ma wpuszczac,
// bo oferta niesie nazwisko, telefon i adres (ADR-0012).

import { useState } from "react";
import { useNavigate } from "../../i18n/nav.jsx";
import { ArrowRight, FileText } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

/** `WY` + data + osiem znakow szesnastkowych, tak jak generuje je backend. */
const WZOR = /^WY\d{8}-[0-9A-F]{8}$/;
const PRZYKLAD = "WY20260825-A1B2C3D4";

const UI = {
  pl: {
    title: "Masz numer oferty?",
    desc: "Jeżeli dostałeś od nas wycenę mailem albo w rozmowie, wpisz jej numer. Pokażemy kwotę, przyjmiemy kod rabatowy i przeprowadzimy przez płatność.",
    label: "Numer oferty",
    button: "Przejdź do oferty",
    hint: "Na następnym ekranie potwierdzisz adres e-mail, na który poszła oferta, albo kod odbioru z rozmowy.",
    bad: `Numer wygląda tak: ${PRZYKLAD}`,
  },
  en: {
    title: "Have an offer number?",
    desc: "If we sent you a quote by e-mail or gave it to you on the phone, enter its number. We will show the amount, accept a discount code and take you through payment.",
    label: "Offer number",
    button: "Go to the offer",
    hint: "On the next screen you confirm the e-mail address the offer went to, or the pickup code from our call.",
    bad: `The number looks like this: ${PRZYKLAD}`,
  },
  de: {
    title: "Haben Sie eine Angebotsnummer?",
    desc: "Wenn Sie von uns ein Angebot per E-Mail oder im Gespräch erhalten haben, geben Sie die Nummer ein. Wir zeigen den Betrag, nehmen einen Rabattcode an und führen Sie durch die Zahlung.",
    label: "Angebotsnummer",
    button: "Zum Angebot",
    hint: "Im nächsten Schritt bestätigen Sie die E-Mail-Adresse, an die das Angebot ging, oder den Abholcode aus dem Gespräch.",
    bad: `Die Nummer sieht so aus: ${PRZYKLAD}`,
  },
};

/**
 * Pasek "mam numer oferty" do wstawienia w sklepie i w koszyku.
 *
 * @param {{className?: string}} props dodatkowe klasy odstepu od otoczenia
 */
export default function OfferNumberEntry({ className = "" }) {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const navigate = useNavigate();
  const [ref, setRef] = useState("");
  const [error, setError] = useState(false);

  // Numer bywa przepisywany z maila razem ze spacja albo malymi literami.
  // Odrzucanie go za to byloby zlosliwoscia, wiec porzadkujemy sami.
  const numer = ref.replace(/\s+/g, "").toUpperCase();

  function submit(e) {
    e.preventDefault();
    if (!WZOR.test(numer)) { setError(true); return; }
    setError(false);
    navigate(`/oferta/?ref=${encodeURIComponent(numer)}`);
  }

  return (
    <section className={`rounded-xl border border-white/10 bg-white/[0.02] p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-semibold text-sm">{u.title}</h2>
          <p className="text-neutral-400 text-xs leading-relaxed mt-1">{u.desc}</p>

          <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block flex-1 min-w-[14rem]">
              <span className="text-neutral-500 text-xs block mb-1">{u.label}</span>
              <input
                value={ref}
                onChange={(e) => { setRef(e.target.value); setError(false); }}
                placeholder={PRZYKLAD}
                autoComplete="off"
                spellCheck="false"
                aria-invalid={error || undefined}
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white font-mono placeholder:text-neutral-600"
              />
            </label>
            <button
              type="submit"
              disabled={!numer}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {u.button} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {error ? (
            <p className="text-amber-300 text-xs mt-2">{u.bad}</p>
          ) : (
            <p className="text-neutral-600 text-xs leading-relaxed mt-2">{u.hint}</p>
          )}
        </div>
      </div>
    </section>
  );
}
