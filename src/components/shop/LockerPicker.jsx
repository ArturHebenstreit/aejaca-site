import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Check, MapPin } from "lucide-react";

// ============================================================
// WYBOR PACZKOMATU
// ============================================================
// Wczesniej kasa prosila o kod paczkomatu z pamieci, w rodzaju WAW01A. Kto go
// nie pamieta, otwiera wyszukiwarke InPostu w drugiej karcie, przepisuje kod
// i wraca, o ile wroci. Do tego literowka w kodzie wychodzi dopiero przy
// nadaniu paczki, czyli po zaplacie.
//
// Teraz klient wpisuje kod pocztowy albo miasto, a lista przychodzi z naszego
// serwera, ktory pyta InPost. Recznie wpisany kod nadal dziala i to jest
// swiadome: gdy InPost nie odpowie, kasa ma sie nie zatrzymac.

const T = {
  pl: {
    label: "Paczkomat InPost",
    search: "Kod pocztowy albo miasto",
    hint: "Wpisz kod pocztowy albo nazwę miejscowości, a pokażemy najbliższe paczkomaty",
    searching: "Szukam",
    nothing: "Nie znaleźliśmy paczkomatów. Sprawdź pisownię albo wpisz kod ręcznie.",
    failed: "Wyszukiwarka InPostu nie odpowiada. Wpisz kod paczkomatu ręcznie.",
    manual: "Wolę wpisać kod ręcznie",
    manualLabel: "Kod paczkomatu",
    chosen: "Wybrany paczkomat",
    change: "Zmień",
    open247: "czynny całą dobę",
    tooShort: "Wpisz co najmniej trzy znaki",
  },
  en: {
    label: "InPost parcel locker",
    search: "Post code or city",
    hint: "Enter a post code or a town and we will show the nearest lockers",
    searching: "Searching",
    nothing: "No lockers found. Check the spelling or enter the code manually.",
    failed: "The InPost search is not responding. Please enter the locker code manually.",
    manual: "I'd rather type the code",
    manualLabel: "Locker code",
    chosen: "Chosen locker",
    change: "Change",
    open247: "open 24/7",
    tooShort: "Enter at least three characters",
  },
  de: {
    label: "InPost Paketstation",
    search: "Postleitzahl oder Stadt",
    hint: "Postleitzahl oder Ort eingeben, wir zeigen die nächsten Paketstationen",
    searching: "Suche",
    nothing: "Keine Paketstationen gefunden. Schreibweise prüfen oder Code manuell eingeben.",
    failed: "Die InPost-Suche antwortet nicht. Bitte den Code manuell eingeben.",
    manual: "Ich gebe den Code lieber selbst ein",
    manualLabel: "Paketstationscode",
    chosen: "Gewählte Paketstation",
    change: "Ändern",
    open247: "rund um die Uhr geöffnet",
    tooShort: "Mindestens drei Zeichen eingeben",
  },
};

export default function LockerPicker({ api, value, onChange, lang = "pl" }) {
  const t = T[lang] || T.pl;
  const [query, setQuery] = useState("");
  const [points, setPoints] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);
  const [chosen, setChosen] = useState(null);
  const seq = useRef(0);

  // Szukamy dopiero, gdy klient przestanie pisac. Bez tego kazda litera kodu
  // pocztowego byla osobnym zapytaniem do InPostu.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || !api) { setPoints(null); setError(""); return; }

    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch(`${api}/api/lockers?q=${encodeURIComponent(q)}`);
        const data = await res.json().catch(() => ({}));
        // Odpowiedz na starsze zapytanie nie ma prawa nadpisac nowszej listy.
        if (mine !== seq.current) return;
        if (!res.ok) throw new Error(data.error || "blad");
        setPoints(data.points || []);
      } catch {
        if (mine !== seq.current) return;
        setPoints(null);
        setError(t.failed);
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, api, t.failed]);

  function pick(p) {
    setChosen(p);
    onChange(p.code);
    setPoints(null);
    setQuery("");
  }

  // Wybrany paczkomat pokazujemy jako gotowa odpowiedz, z adresem, a nie samym
  // kodem: klient ma zobaczyc, ze wybral ten pod domem, a nie ten przy pracy.
  if (chosen && value === chosen.code) {
    return (
      <div className="rounded-lg border border-blue-400 bg-blue-400/10 p-3 flex items-start gap-3">
        <MapPin className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-neutral-500 text-[10px] uppercase tracking-wide">{t.chosen}</div>
          <div className="text-blue-300 text-sm font-medium">{chosen.code}</div>
          <div className="text-neutral-400 text-xs">
            {chosen.street}{chosen.city ? `, ${chosen.city}` : ""}
          </div>
          {chosen.description && <div className="text-neutral-500 text-[11px]">{chosen.description}</div>}
        </div>
        <button
          type="button"
          onClick={() => { setChosen(null); onChange(""); }}
          className="text-neutral-400 text-xs hover:text-white transition-colors flex-shrink-0"
        >
          {t.change}
        </button>
      </div>
    );
  }

  if (manual || !api) {
    return (
      <div>
        <label className="block text-neutral-400 text-xs mb-1.5" htmlFor="locker-code">
          {t.manualLabel} <span className="text-amber-400">*</span>
        </label>
        <input
          id="locker-code"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="WAW01A"
          className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                     placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/50 uppercase"
        />
        {api && (
          <button type="button" onClick={() => setManual(false)} className="text-neutral-500 text-[11px] mt-1.5 hover:text-neutral-300 transition-colors">
            {t.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-neutral-400 text-xs mb-1.5" htmlFor="locker-search">
        {t.label} <span className="text-amber-400">*</span>
      </label>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="locker-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          className="w-full bg-transparent border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-white
                     placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/50"
        />
        {busy && <Loader2 className="w-4 h-4 text-neutral-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
      </div>

      {points && points.length > 0 && (
        <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto">
          {points.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => pick(p)}
              className="w-full flex items-start gap-2.5 p-2.5 rounded-lg border border-white/10 bg-white/[0.02]
                         text-left hover:border-white/20 transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1 min-w-0">
                <span className="block text-neutral-300 text-sm">{p.code}</span>
                <span className="block text-neutral-500 text-[11px]">
                  {p.street}{p.city ? `, ${p.city}` : ""}
                </span>
                {(p.description || p.open247) && (
                  <span className="block text-neutral-600 text-[10px]">
                    {[p.description, p.open247 ? t.open247 : null].filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {points && points.length === 0 && !busy && (
        <p className="text-neutral-500 text-[11px] mt-2">{t.nothing}</p>
      )}
      {error && <p className="text-amber-300 text-[11px] mt-2">{error}</p>}
      {!points && !error && <p className="text-neutral-600 text-[11px] mt-1.5">{t.hint}</p>}

      <button type="button" onClick={() => setManual(true)} className="text-neutral-500 text-[11px] mt-1.5 hover:text-neutral-300 transition-colors">
        {t.manual}
      </button>
    </div>
  );
}
