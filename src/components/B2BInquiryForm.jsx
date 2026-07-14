// ============================================================
// B2B INQUIRY FORM, dedicated quote request for /b2b/
// Reuses the same submission mechanism as calcShared's InquiryForm
// (POST to CONTACT_API_URL/api/contact, mailto fallback), extended
// with B2B-specific fields (company, NIP, profile, scope, qty, deadline).
// ============================================================
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { trackInquiry, trackFunnel } from "../utils/analytics.js";

const CONTACT_API_URL = import.meta.env.VITE_CHAT_API_URL;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_DESC_LENGTH = 2000;
const COOLDOWN_MS = 15000;
const MAX_FILE_SIZE_MB = 50;

const PROFILE_OPTIONS = {
  pl: [
    { id: "brand", label: "Buduję markę" },
    { id: "workshop", label: "Prowadzę pracownię" },
    { id: "other", label: "Inne" },
  ],
  en: [
    { id: "brand", label: "I'm building a brand" },
    { id: "workshop", label: "I run a workshop" },
    { id: "other", label: "Other" },
  ],
  de: [
    { id: "brand", label: "Ich baue eine Marke auf" },
    { id: "workshop", label: "Ich betreibe eine Werkstatt" },
    { id: "other", label: "Sonstiges" },
  ],
};

const SCOPE_OPTIONS = {
  pl: [
    { id: "cad", label: "Projekt CAD" },
    { id: "patterns", label: "Wzorce 16K" },
    { id: "casting", label: "Odlew i wykończenie" },
    { id: "laser", label: "Laser" },
    { id: "photo", label: "Fotografia" },
    { id: "whitelabel", label: "White-label" },
  ],
  en: [
    { id: "cad", label: "CAD design" },
    { id: "patterns", label: "16K patterns" },
    { id: "casting", label: "Casting and finishing" },
    { id: "laser", label: "Laser" },
    { id: "photo", label: "Photography" },
    { id: "whitelabel", label: "White-label" },
  ],
  de: [
    { id: "cad", label: "CAD-Design" },
    { id: "patterns", label: "16K-Modelle" },
    { id: "casting", label: "Guss und Veredelung" },
    { id: "laser", label: "Laser" },
    { id: "photo", label: "Fotografie" },
    { id: "whitelabel", label: "White-Label" },
  ],
};

const LABELS = {
  pl: {
    title: "Zapytanie B2B",
    name: "Imię i nazwisko",
    namePlaceholder: "Jan Kowalski",
    company: "Firma",
    companyPlaceholder: "Nazwa firmy / pracowni",
    nip: "NIP (opcjonalnie)",
    nipPlaceholder: "np. 1234567890",
    email: "E-mail",
    emailPlaceholder: "twoj@firma.pl",
    emailRequired: "Podaj poprawny adres e-mail",
    phone: "Telefon",
    phonePlaceholder: "+48 ...",
    profile: "Twój profil",
    scope: "Zakres współpracy",
    qty: "Ilość sztuk",
    qtyPlaceholder: "np. 20",
    deadline: "Termin realizacji",
    deadlinePlaceholder: "np. wrzesień 2026",
    desc: "Opisz projekt",
    descPlaceholder: "Wizja, inspiracje, budżet docelowy, kamień milowy, inne szczegóły...",
    file: "Załącz plik projektu",
    fileHint: "STL, 3MF, STEP, OBJ, JPG, PNG, PDF",
    consent: "Zgadzam się na przetwarzanie danych osobowych w celu przygotowania wyceny i kontaktu w sprawie zapytania (RODO).",
    send: "Wyślij zapytanie B2B",
    sending: "Wysyłanie...",
    sent: "Wysłano! Odpowiemy w 24h.",
    sendError: "Coś poszło nie tak. Spróbuj jeszcze raz.",
    attachNote: "Plik zostanie dołączony do wiadomości",
    cooldown: "Poczekaj chwilę przed ponownym wysłaniem",
    tooLong: "Opis jest za długi (maks. 2000 znaków)",
    fileTooLarge: "Plik jest za duży (maks. 50 MB)",
    required: "*",
  },
  en: {
    title: "B2B inquiry",
    name: "Full name",
    namePlaceholder: "John Smith",
    company: "Company",
    companyPlaceholder: "Company / workshop name",
    nip: "VAT ID (optional)",
    nipPlaceholder: "e.g. PL1234567890",
    email: "Email",
    emailPlaceholder: "you@company.com",
    emailRequired: "Please enter a valid email address",
    phone: "Phone",
    phonePlaceholder: "+1 ...",
    profile: "Your profile",
    scope: "Scope of cooperation",
    qty: "Quantity",
    qtyPlaceholder: "e.g. 20",
    deadline: "Deadline",
    deadlinePlaceholder: "e.g. September 2026",
    desc: "Describe your project",
    descPlaceholder: "Vision, inspirations, target budget, first milestone, other details...",
    file: "Attach project file",
    fileHint: "STL, 3MF, STEP, OBJ, JPG, PNG, PDF",
    consent: "I agree to the processing of my personal data to prepare a quote and follow up on this inquiry (GDPR).",
    send: "Send B2B inquiry",
    sending: "Sending...",
    sent: "Sent! We'll reply within 24h.",
    sendError: "Something went wrong. Please try again.",
    attachNote: "File will be attached to your message",
    cooldown: "Please wait before sending again",
    tooLong: "Description is too long (max 2000 characters)",
    fileTooLarge: "File is too large (max 50 MB)",
    required: "*",
  },
  de: {
    title: "B2B-Anfrage",
    name: "Vor- und Nachname",
    namePlaceholder: "Max Mustermann",
    company: "Firma",
    companyPlaceholder: "Firmen- / Werkstattname",
    nip: "USt-IdNr. (optional)",
    nipPlaceholder: "z.B. DE123456789",
    email: "E-Mail",
    emailPlaceholder: "sie@firma.de",
    emailRequired: "Bitte eine gültige E-Mail-Adresse eingeben",
    phone: "Telefon",
    phonePlaceholder: "+49 ...",
    profile: "Ihr Profil",
    scope: "Umfang der Zusammenarbeit",
    qty: "Stückzahl",
    qtyPlaceholder: "z.B. 20",
    deadline: "Wunschtermin",
    deadlinePlaceholder: "z.B. September 2026",
    desc: "Beschreiben Sie Ihr Projekt",
    descPlaceholder: "Vision, Inspirationen, Zielbudget, erster Meilenstein, weitere Details...",
    file: "Projektdatei anhängen",
    fileHint: "STL, 3MF, STEP, OBJ, JPG, PNG, PDF",
    consent: "Ich stimme der Verarbeitung meiner personenbezogenen Daten zur Erstellung eines Angebots und zur Kontaktaufnahme zu (DSGVO).",
    send: "B2B-Anfrage senden",
    sending: "Wird gesendet...",
    sent: "Gesendet! Wir antworten innerhalb von 24h.",
    sendError: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    attachNote: "Datei wird Ihrer Nachricht angehängt",
    cooldown: "Bitte warten Sie vor dem erneuten Senden",
    tooLong: "Beschreibung ist zu lang (max. 2000 Zeichen)",
    fileTooLarge: "Datei ist zu groß (max. 50 MB)",
    required: "*",
  },
};

function sanitizeText(text) {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .slice(0, MAX_DESC_LENGTH);
}

export default function B2BInquiryForm({ lang = "pl", id }) {
  const L = LABELS[lang] || LABELS.en;
  const profiles = PROFILE_OPTIONS[lang] || PROFILE_OPTIONS.en;
  const scopes = SCOPE_OPTIONS[lang] || SCOPE_OPTIONS.en;

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState("");
  const [scope, setScope] = useState([]);
  const [qty, setQty] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [fileBlob, setFileBlob] = useState(null);
  const [fileName, setFileName] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const fileRef = useRef(null);
  const lastSendRef = useRef(0);

  useEffect(() => {
    trackFunnel("b2b_form", "open_inquiry_form");
  }, []);

  function toggleScope(id) {
    setScope((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function handleDescChange(e) {
    const val = e.target.value;
    if (val.length <= MAX_DESC_LENGTH) {
      setDescription(val);
      setError("");
    } else {
      setError(L.tooLong);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(L.fileTooLarge);
      setFileBlob(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFileBlob(file || null);
    setFileName(file ? file.name : "");
    setError("");
  }

  function clearFile() {
    setFileBlob(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSend() {
    if (honeypot || sending || cooldown || !consent) return;
    if (!EMAIL_RE.test(email)) {
      setError(L.emailRequired);
      return;
    }
    const now = Date.now();
    if (now - lastSendRef.current < COOLDOWN_MS) {
      setError(L.cooldown);
      return;
    }

    const scopeLabels = scope.map((id) => scopes.find((s) => s.id === id)?.label).filter(Boolean).join(", ");
    const profileLabel = profiles.find((p) => p.id === profile)?.label || "";
    const cleanDesc = sanitizeText(description);

    const summaryLines = [
      `B2B inquiry (${lang})`,
      name && `${L.name}: ${name}`,
      company && `${L.company}: ${company}`,
      nip && `${L.nip}: ${nip}`,
      phone && `${L.phone}: ${phone}`,
      profileLabel && `${L.profile}: ${profileLabel}`,
      scopeLabels && `${L.scope}: ${scopeLabels}`,
      qty && `${L.qty}: ${qty}`,
      deadline && `${L.deadline}: ${deadline}`,
    ].filter(Boolean).join("\n");

    const message = [summaryLines, cleanDesc.trim()].filter(Boolean).join("\n\n");

    if (!CONTACT_API_URL) {
      const subject = `#B2B inquiry - ${company || name}`;
      trackInquiry("b2b_form", summaryLines);
      window.location.href = `mailto:contact@aejaca.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Email: ${email}\n\n${message}${fileBlob ? `\n[File: ${fileName}]` : ""}`)}`;
      lastSendRef.current = now;
      setSent(true);
      setCooldown(true);
      setTimeout(() => setSent(false), 5000);
      setTimeout(() => setCooldown(false), COOLDOWN_MS);
      return;
    }

    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("email", email.trim());
      fd.append("subject", `B2B inquiry, ${company || name}`);
      fd.append("message", message);
      fd.append("lang", lang);
      fd.append("source", "b2b");
      if (fileBlob) fd.append("file", fileBlob, fileName);

      const res = await fetch(`${CONTACT_API_URL}/api/contact`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        trackInquiry("b2b_form", summaryLines);
        trackFunnel("b2b_form", "inquiry_sent");
        lastSendRef.current = now;
        setSent(true);
        setCooldown(true);
        setTimeout(() => setSent(false), 6000);
        setTimeout(() => setCooldown(false), COOLDOWN_MS);
      } else {
        setError(L.sendError);
      }
    } catch {
      setError(L.sendError);
    } finally {
      setSending(false);
    }
  }

  const inputClass = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-colors";
  const labelClass = "block text-[11px] text-neutral-400 mb-1.5";

  return (
    <div id={id} className="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-400/[0.03] to-transparent p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-6">{L.title}</div>

      {/* Honeypot */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="b2b_website">Website</label>
        <input id="b2b_website" type="text" name="website" autoComplete="off"
          value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>{L.name}{L.required}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={L.namePlaceholder} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{L.company}</label>
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={L.companyPlaceholder} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{L.nip}</label>
          <input type="text" value={nip} onChange={(e) => setNip(e.target.value)} placeholder={L.nipPlaceholder} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{L.email}{L.required}</label>
          <input type="email" inputMode="email" autoComplete="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder={L.emailPlaceholder} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{L.phone}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={L.phonePlaceholder} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{L.qty}</label>
          <input type="text" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={L.qtyPlaceholder} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{L.deadline}</label>
          <input type="text" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder={L.deadlinePlaceholder} className={inputClass} />
        </div>
      </div>

      {/* Profile */}
      <div className="mb-4">
        <label className={labelClass}>{L.profile}</label>
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button key={p.id} type="button" onClick={() => setProfile(p.id)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                profile === p.id ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium" : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scope */}
      <div className="mb-4">
        <label className={labelClass}>{L.scope}</label>
        <div className="flex flex-wrap gap-2">
          {scopes.map((s) => (
            <button key={s.id} type="button" onClick={() => toggleScope(s.id)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                scope.includes(s.id) ? "border-blue-400 bg-blue-400/10 text-blue-300 font-medium" : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className={labelClass}>{L.desc}{L.required}</label>
        <textarea value={description} onChange={handleDescChange} placeholder={L.descPlaceholder} rows={4} maxLength={MAX_DESC_LENGTH}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-400 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 resize-none transition-colors" />
      </div>

      {/* File */}
      <div className="mb-4">
        <div className={labelClass}>{L.file}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-neutral-400 text-sm hover:border-white/20 hover:text-neutral-200 transition-all">
            <Paperclip className="w-3.5 h-3.5" />
            {fileName || L.file}
          </button>
          {fileName && (
            <button type="button" onClick={clearFile} className="text-neutral-400 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <input ref={fileRef} type="file" className="hidden"
            accept=".stl,.3mf,.step,.stp,.obj,.jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
        </div>
        <div className="text-[10px] text-neutral-400 mt-1">{L.fileHint}</div>
        {fileName && <div className="text-[10px] text-blue-400/70 mt-1">{L.attachNote}</div>}
      </div>

      {/* Consent */}
      <label className="flex items-start gap-2 cursor-pointer select-none mb-4">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-blue-400 shrink-0" />
        <span className="text-[11px] text-neutral-400 leading-tight">{L.consent}</span>
      </label>

      {error && <div className="mb-3 text-[11px] text-red-400 text-center">{error}</div>}

      <button
        onClick={handleSend}
        disabled={sending || cooldown || !consent}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-sm transition-all duration-300 ${
          sending || (cooldown && !sent) || !consent
            ? "border-white/5 bg-white/[0.02] text-neutral-400 cursor-not-allowed"
            : sent
              ? "border-green-400/30 bg-green-400/10 text-green-400"
              : "border-blue-400/30 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20 hover:border-blue-400/40"
        }`}
      >
        <Send className="w-4 h-4" />
        {sending ? L.sending : sent ? L.sent : (cooldown ? L.cooldown : L.send)}
      </button>
    </div>
  );
}
