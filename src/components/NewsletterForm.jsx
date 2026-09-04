import { useState, useId } from "react";
import { Link } from "../i18n/nav.jsx";
import { Gift, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const NEWSLETTER_API_URL = import.meta.env.VITE_NEWSLETTER_API_URL;

const LABELS = {
  pl: {
    hook: "Odbierz 10% zniżki",
    descShort: "Kod 10% na pierwsze zamówienie, prosto na Twój e-mail.",
    title: "Zapisz się i odbierz kod rabatowy",
    desc: "Zostaw adres e-mail - wyślemy Ci kod 10% zniżki na pierwsze zamówienie oraz nowinki ze studia AEJaCA.",
    placeholder: "twój@email.pl",
    btn: "Pobierz zniżkę",
    consent: "Zgadzam się na otrzymywanie wiadomości marketingowych oraz akceptuję ",
    privacyLink: "politykę prywatności",
    success: "Dziękujemy! Sprawdź swoją skrzynkę - kod jest w drodze.",
    emailRequired: "Podaj poprawny adres e-mail",
    sendFailed: "Nie udało się wysłać zgłoszenia. Spróbuj za chwilę albo napisz na contact@aejaca.com.",
    consentRequired: "Wymagana zgoda na marketing",
    alreadySubscribed: "Ten adres jest już na naszej liście. Wysłaliśmy do Ciebie wiadomość {date} - sprawdź skrzynkę odbiorczą, a na wszelki wypadek również folder spam.",
    alreadySubscribedNoDate: "Ten adres jest już na naszej liście. Sprawdź skrzynkę odbiorczą i na wszelki wypadek folder spam - nasza wiadomość powinna tam być.",
  },
  en: {
    hook: "Get 10% off",
    descShort: "A 10% code for your first order, straight to your inbox.",
    title: "Join the list & unlock your discount",
    desc: "Drop your email - we'll send a 10% code for your first order plus updates from the AEJaCA studio.",
    placeholder: "your@email.com",
    btn: "Claim discount",
    consent: "I agree to receive marketing emails and accept the ",
    privacyLink: "privacy policy",
    success: "Thanks! Check your inbox - the code is on the way.",
    emailRequired: "Please enter a valid email address",
    sendFailed: "We could not submit the form. Try again in a moment or write to contact@aejaca.com.",
    consentRequired: "Marketing consent required",
    alreadySubscribed: "This email is already on our list. We sent you a message on {date} - check your inbox and your spam folder just in case.",
    alreadySubscribedNoDate: "This email is already on our list. Check your inbox and your spam folder just in case - our message should be there.",
  },
  de: {
    hook: "10% Rabatt sichern",
    descShort: "10% Code für Ihre erste Bestellung, direkt per E-Mail.",
    title: "Abonnieren & Rabatt freischalten",
    desc: "Gib deine E-Mail ein - wir schicken dir einen 10%-Code für deine erste Bestellung plus Neuigkeiten aus dem AEJaCA Studio.",
    placeholder: "deine@email.de",
    btn: "Rabatt sichern",
    consent: "Ich stimme dem Erhalt von Marketing-E-Mails zu und akzeptiere die ",
    privacyLink: "Datenschutzerklärung",
    success: "Danke! Prüfe dein Postfach - der Code ist unterwegs.",
    emailRequired: "Bitte eine gültige E-Mail-Adresse eingeben",
    sendFailed: "Die Anmeldung konnte nicht gesendet werden. Bitte später erneut versuchen oder an contact@aejaca.com schreiben.",
    consentRequired: "Marketing-Einwilligung erforderlich",
    alreadySubscribed: "Diese E-Mail ist bereits auf unserer Liste. Wir haben dir am {date} eine Nachricht geschickt - prüfe deinen Posteingang und zur Sicherheit auch den Spam-Ordner.",
    alreadySubscribedNoDate: "Diese E-Mail ist bereits auf unserer Liste. Prüfe deinen Posteingang und zur Sicherheit auch den Spam-Ordner - unsere Nachricht sollte dort sein.",
  },
};

// eslint-disable-next-line no-useless-escape
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm({ compact = false, wStopce = false }) {
  // Formularz stoi teraz w dwoch miejscach strony glownej, przy kalkulatorach
  // i w stopce. Staly identyfikator dawalby dwa te same id w jednym dokumencie,
  // przez co etykieta wskazywalaby zawsze pierwsze pole.
  const emailId = `nl-email-${useId()}`;
  const { lang, t } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState("idle"); // idle | loading | done | duplicate
  const [error, setError] = useState("");
  const [alreadySubscribedSince, setAlreadySubscribedSince] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!EMAIL_RX.test(email)) return setError(l.emailRequired);
    if (!consent) return setError(l.consentRequired);
    setState("loading");

    if (NEWSLETTER_API_URL) {
      try {
        const res = await fetch(NEWSLETTER_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, lang, source: "footer", ts: new Date().toISOString() }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({ ok: true }));
          if (data.reason === "already_subscribed") {
            const since = data.since
              ? new Date(data.since).toLocaleDateString(
                  lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : "en-GB",
                  { day: "numeric", month: "long", year: "numeric" }
                )
              : "";
            setAlreadySubscribedSince(since);
            setState("duplicate");
          } else {
            setState("done");
            if (typeof window.gtag === "function") window.gtag("event", "newsletter_signup", { lang });
          }
        } else {
          // Odpowiedz z bledem nie ma nic wspolnego z adresem, wiec nie wolno
          // o nim mowic. Wysylanie kogos z poprawnym adresem, zeby "podal
          // poprawny adres", to zapetlenie bez wyjscia.
          console.error("[newsletter] serwer odpowiedzial", res.status);
          setState("idle");
          setError(l.sendFailed);
        }
      } catch (e) {
        // Tu wpada takze zadanie zablokowane przez polityke tresci strony,
        // czyli przypadek, w ktorym adres jest w porzadku, a winna jest nasza
        // wlasna konfiguracja. Zdarzylo sie to naprawde, patrz public/_headers.
        console.error("[newsletter] zadanie nie doszlo:", e?.message);
        setState("idle");
        setError(l.sendFailed);
      }
    } else {
      const subject = encodeURIComponent(`[AEJaCA] Newsletter opt-in (${lang.toUpperCase()})`);
      const body = encodeURIComponent(`Email: ${email}\nLang: ${lang}\nSource: footer\nConsent: ${new Date().toISOString()}`);
      window.location.href = `mailto:contact@aejaca.com?subject=${subject}&body=${body}`;
      setTimeout(() => setState("done"), 400);
    }
  }

  if (state === "done") {
    return (
      <div className={`rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center ${compact ? "" : "md:p-6"}`} role="status" aria-live="polite">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-200 text-sm">{l.success}</p>
      </div>
    );
  }

  if (state === "duplicate") {
    return (
      <div className={`rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-center ${compact ? "" : "md:p-6"}`} role="status" aria-live="polite">
        <Gift className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-amber-200 text-sm">{alreadySubscribedSince ? l.alreadySubscribed.replace("{date}", alreadySubscribedSince) : l.alreadySubscribedNoDate}</p>
      </div>
    );
  }

  return (
    // DWA TE SAME FORMULARZE NA JEDNEJ STRONIE TO DWA PUNKTY ORIENTACYJNE
    // O TEJ SAMEJ NAZWIE. Strona glowna ma zapis w tresci i drugi w stopce,
    // wiec czytnik ekranu wymienial dwa razy "Zapis na newsletter" i nie
    // dawalo sie ich rozroznic. axe: landmark-unique, pomiar 2026-09-04.
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-neutral-900/40 to-blue-400/10 backdrop-blur-sm p-5 ${compact ? "" : "md:p-6"}`}
      aria-label={wStopce ? t.a11y.newsletterStopka : t.a11y.newsletter}
    >
      <div className="flex items-center gap-2 mb-2">
        <Gift className="w-4 h-4 text-amber-300" aria-hidden="true" />
        <span className="text-xs uppercase tracking-[0.2em] text-amber-300 font-semibold">{l.hook}</span>
      </div>
      {/* h2, NIE h3. Formularz stoi na stronach, ktore po `h1` nie maja zadnego
          innego naglowka, wiec skok o dwa poziomy robil dziure w spisie tresci
          czytnika ekranu. axe: heading-order, /reviews/, pomiar 2026-09-04. */}
      {!compact && (
        <h2 className="font-serif text-lg md:text-xl font-semibold text-white mb-2">{l.title}</h2>
      )}
      <p className="text-neutral-400 text-sm leading-relaxed mb-4">{compact ? l.descShort : l.desc}</p>

      <div className="flex flex-col sm:flex-row gap-2">
        <label className="sr-only" htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={l.placeholder}
          className="flex-1 px-4 py-3 rounded-full bg-neutral-950/60 border border-white/10 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition-colors"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black text-sm font-semibold rounded-full shadow-lg shadow-amber-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {l.btn}
        </button>
      </div>

      <label className="mt-3 flex items-start gap-2 text-xs text-neutral-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 accent-amber-400"
          aria-required="true"
        />
        <span>
          {l.consent}
          <Link to="/privacy/" className="underline text-amber-300 hover:text-amber-200">{l.privacyLink}</Link>.
        </span>
      </label>

      {error && <p className="mt-2 text-xs text-rose-300" role="alert">{error}</p>}
    </form>
  );
}
