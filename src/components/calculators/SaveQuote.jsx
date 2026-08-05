// ============================================================
// ZAPISZ WYCENE, doklejone pod kwota wiazaca
// ============================================================
// Ustawienie druku razem z plikiem to kilka minut pracy klienta i do tej
// pory ginelo przy zamknieciu karty. Nie kazdy kupuje w tej samej sesji:
// jeden musi zapytac wspolnika, drugi wraca wieczorem z telefonu.
//
// Adres e-mail jest DOBROWOLNY i to jest swiadoma decyzja. Kto chce sam
// link, dostaje sam link. Zadanie adresu za mozliwosc wrocenia do wlasnej
// kalkulacji zamienilo by narzedzie w bramke na dane, a czesc ludzi po
// prostu zamknelaby karte, czyli dokladnie to, czemu mamy zapobiec.
//
// Kwote liczy serwer, tym samym silnikiem co kwote wiazaca. Ten komponent
// wysyla wylacznie parametry.

import { useState } from "react";
import { Bookmark, Check, Copy, Loader2, Mail } from "lucide-react";

const API = import.meta.env.VITE_CHAT_API_URL;

const UI = {
  pl: {
    save: "Zapisz wycenę",
    saving: "Zapisuję",
    intro: "Zapiszemy tę konfigurację pod własnym adresem. Wrócisz do niej z każdego urządzenia, także jutro.",
    emailLabel: "E-mail (opcjonalnie, wyślemy link)",
    emailPlaceholder: "adres@example.com",
    confirm: "Zapisz",
    cancel: "Anuluj",
    savedTitle: "Wycena zapisana",
    savedMailed: "Link wysłaliśmy też na podany adres.",
    validUntil: (d) => `Obowiązuje do ${d}.`,
    copy: "Kopiuj link",
    copied: "Skopiowano",
    open: "Otwórz wycenę",
    metalNote: "Robocizna jest wiążąca przez cały ten okres. Wartość kruszcu przeliczymy w dniu zamówienia według bieżącego kursu.",
    noObligation: "Zapisanie wyceny nie jest zamówieniem i do niczego nie zobowiązuje.",
    failed: "Nie udało się zapisać wyceny. Spróbuj jeszcze raz.",
    badEmail: "Sprawdź adres e-mail.",
  },
  en: {
    save: "Save this quote",
    saving: "Saving",
    intro: "We will save this configuration at its own address. You can come back to it from any device, tomorrow too.",
    emailLabel: "Email (optional, we will send the link)",
    emailPlaceholder: "you@example.com",
    confirm: "Save",
    cancel: "Cancel",
    savedTitle: "Quote saved",
    savedMailed: "We have also sent the link to your address.",
    validUntil: (d) => `Valid until ${d}.`,
    copy: "Copy link",
    copied: "Copied",
    open: "Open the quote",
    metalNote: "The labour is binding for that whole period. Precious metal is recalculated on the day of the order at the current rate.",
    noObligation: "Saving a quote is not an order and commits you to nothing.",
    failed: "We could not save the quote. Please try again.",
    badEmail: "Please check the email address.",
  },
  de: {
    save: "Angebot speichern",
    saving: "Wird gespeichert",
    intro: "Wir speichern diese Konfiguration unter einer eigenen Adresse. Sie können jederzeit und von jedem Gerät aus zurückkehren.",
    emailLabel: "E-Mail (optional, wir senden den Link)",
    emailPlaceholder: "sie@example.com",
    confirm: "Speichern",
    cancel: "Abbrechen",
    savedTitle: "Angebot gespeichert",
    savedMailed: "Den Link haben wir auch an Ihre Adresse geschickt.",
    validUntil: (d) => `Gültig bis ${d}.`,
    copy: "Link kopieren",
    copied: "Kopiert",
    open: "Angebot öffnen",
    metalNote: "Die Arbeitsleistung ist für den gesamten Zeitraum verbindlich. Edelmetall wird am Tag der Bestellung zum aktuellen Kurs neu berechnet.",
    noObligation: "Das Speichern eines Angebots ist keine Bestellung und verpflichtet zu nichts.",
    failed: "Das Angebot konnte nicht gespeichert werden. Bitte erneut versuchen.",
    badEmail: "Bitte prüfen Sie die E-Mail-Adresse.",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SaveQuote({ calculator, params, uploadToken = null, fileName = null, scale = 1, description = null, lang = "pl", accent = "blue" }) {
  const u = UI[lang] || UI.en;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!API || !calculator) return null;

  async function save() {
    if (email && !EMAIL_RE.test(email.trim())) {
      setError(u.badEmail);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch(`${API}/api/quotes/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          email: email.trim() || null,
          items: [{ calculator, params, uploadToken, fileName, scale, description }],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(u.failed);
        return;
      }
      setSaved(data);
    } catch {
      setError(u.failed);
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    // `clipboard` bywa niedostepny bez HTTPS i w starszych przegladarkach.
    // Wtedy link i tak jest widoczny obok, wiec da sie go zaznaczyc recznie.
    navigator.clipboard?.writeText(saved.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const line = accent === "amber" ? "text-amber-300" : "text-blue-300";

  if (saved) {
    const until = saved.validUntil
      ? new Date(saved.validUntil).toLocaleDateString(lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : "en-IE")
      : null;
    return (
      <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-white text-sm font-semibold">{u.savedTitle}</span>
        </div>

        <div className="rounded-lg bg-black/30 px-3 py-2 mb-2">
          <code className="text-[11px] text-neutral-300 break-all">{saved.url}</code>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       border border-white/15 text-neutral-200 hover:bg-white/5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? u.copied : u.copy}
          </button>
          <a
            href={saved.url}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/15 hover:bg-white/5 transition-colors ${line}`}
          >
            {u.open}
          </a>
        </div>

        {saved.emailed && (
          <p className="text-neutral-400 text-[11px] mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> {u.savedMailed}
          </p>
        )}
        {until && <p className="text-neutral-400 text-[11px]">{u.validUntil(until)}</p>}
        <p className="text-neutral-500 text-[11px] leading-relaxed mt-1">{u.metalNote}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 text-neutral-400 hover:text-white text-xs transition-colors"
      >
        <Bookmark className="w-3.5 h-3.5" /> {u.save}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-neutral-400 text-[11px] leading-relaxed mb-3">{u.intro}</p>

      <label className="block text-[11px] text-neutral-500 mb-1.5" htmlFor="save-quote-email">{u.emailLabel}</label>
      <input
        id="save-quote-email"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(null); }}
        placeholder={u.emailPlaceholder}
        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white
                   placeholder:text-neutral-600 focus:outline-none focus:border-white/25 mb-3"
      />

      {error && <p className="text-red-300 text-[11px] mb-2">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            busy ? "bg-white/5 text-neutral-500" : "bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
          {busy ? u.saving : u.confirm}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="px-4 py-2.5 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors"
        >
          {u.cancel}
        </button>
      </div>

      <p className="text-neutral-500 text-[11px] leading-relaxed mt-3">{u.noObligation}</p>
    </div>
  );
}
