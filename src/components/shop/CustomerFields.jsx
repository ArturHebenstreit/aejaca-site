import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { validateCustomer } from "../../shop/customerFields.js";

// ============================================================
// DANE ZAMAWIAJACEGO
// ============================================================
// Jeden komplet pol dla kasy sklepu i dla zamowienia uslugi. Obie strony
// skladaja zamowienie tym samym punktem API, ktory pilnuje tych samych regul,
// wiec rozjazd w formularzu konczylby sie odmowa bez wyjasnienia.
//
// Reguly siedza w src/shop/customerFields.js, tu jest wylacznie ich obsluga
// i tlumaczenia komunikatow.

const T = {
  pl: {
    "email:required": "Podaj adres e-mail, wyślemy na niego potwierdzenie",
    "email:format": "To nie wygląda na adres e-mail",
    "name:required": "Podaj imię i nazwisko",
    "name:format": "Imię i nazwisko bez cyfr",
    "name:full_name": "Potrzebujemy imienia i nazwiska, tak podpiszemy przesyłkę",
    "phone:required": "Podaj numer telefonu",
    "phone:format": "Numer krajowy to dziewięć cyfr, zagraniczny z plusem",
    hintPhone: "Kurier zadzwoni przed doręczeniem, InPost wyśle kod odbioru",
    namePlaceholder: "Anna Kowalska",
  },
  en: {
    "email:required": "Enter your email, we will send the confirmation there",
    "email:format": "That does not look like an email address",
    "name:required": "Enter your first and last name",
    "name:format": "First and last name, without digits",
    "name:full_name": "We need both names, that is how the parcel gets labelled",
    "phone:required": "Enter a phone number",
    "phone:format": "Nine digits for a Polish number, or a plus and the country code",
    hintPhone: "The courier calls before delivery, InPost texts the pickup code",
    namePlaceholder: "Anna Kowalska",
  },
  de: {
    "email:required": "Bitte E-Mail angeben, dorthin geht die Bestätigung",
    "email:format": "Das sieht nicht nach einer E-Mail-Adresse aus",
    "name:required": "Bitte Vor- und Nachnamen angeben",
    "name:format": "Vor- und Nachname, ohne Ziffern",
    "name:full_name": "Wir brauchen beide Namen, so wird das Paket beschriftet",
    "phone:required": "Bitte Telefonnummer angeben",
    "phone:format": "Neun Ziffern für eine polnische Nummer, sonst mit Ländervorwahl",
    hintPhone: "Der Kurier ruft vor der Zustellung an, InPost sendet den Abholcode",
    namePlaceholder: "Anna Kowalska",
  },
};

/**
 * Pole z kontrola danych.
 *
 * Blad pokazujemy DOPIERO po wyjsciu z pola albo po probie zaplaty. Formularz,
 * ktory czerwieni sie przy pierwszej literze imienia, gani klienta za to, ze
 * jeszcze nie skonczyl pisac. Zielone obramowanie odwrotnie: pojawia sie od
 * razu, gdy dane sa dobre, bo to informacja, ze mozna isc dalej.
 */
export function ValidatedField({ label, value, onChange, type = "text", required, placeholder, error, showError, onBlur, hint }) {
  const bad = Boolean(error) && showError;
  const good = required && !error && String(value || "").trim().length > 0;

  return (
    <label className="block mb-4">
      <span className="block text-xs uppercase tracking-wide text-neutral-500 mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </span>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={bad || undefined}
          className={`w-full px-3 py-2.5 pr-9 rounded-lg bg-white/[0.03] border text-white text-sm
                     placeholder:text-neutral-600 focus:outline-none transition-colors ${
            bad ? "border-red-400/60 focus:border-red-400"
                : good ? "border-emerald-400/50 focus:border-emerald-400"
                : "border-white/10 focus:border-blue-400/50"
          }`}
        />
        {good && <Check className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />}
        {bad && <AlertCircle className="w-4 h-4 text-red-400 absolute right-3 top-1/2 -translate-y-1/2" />}
      </div>
      {bad
        ? <span className="block text-red-300 text-xs mt-1">{error}</span>
        : hint && <span className="block text-neutral-600 text-xs mt-1">{hint}</span>}
    </label>
  );
}

export default function CustomerFields({ value, onChange, labels, lang = "pl", showErrors = false }) {
  const t = T[lang] || T.pl;
  const [touched, setTouched] = useState({});
  const touch = (field) => setTouched((s) => ({ ...s, [field]: true }));

  const errors = validateCustomer(value);
  const textFor = (field) => (errors[field] ? t[`${field}:${errors[field]}`] : null);
  const visible = (field) => Boolean(touched[field] || showErrors);
  const set = (field) => (v) => onChange({ ...value, [field]: v });

  return (
    <>
      <ValidatedField
        label={labels.email} value={value.email || ""} type="email" required placeholder="twoj@email.com"
        onChange={set("email")} onBlur={() => touch("email")}
        error={textFor("email")} showError={visible("email")}
      />
      <ValidatedField
        label={labels.name} value={value.name || ""} required placeholder={t.namePlaceholder}
        onChange={set("name")} onBlur={() => touch("name")}
        error={textFor("name")} showError={visible("name")}
      />
      <ValidatedField
        label={labels.phone} value={value.phone || ""} type="tel" required placeholder="601 234 567"
        onChange={set("phone")} onBlur={() => touch("phone")}
        error={textFor("phone")} showError={visible("phone")}
        hint={t.hintPhone}
      />
    </>
  );
}
