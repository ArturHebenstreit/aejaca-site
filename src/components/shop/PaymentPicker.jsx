import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { splitMethods, filterBanks } from "./paymentGroups.js";

// ============================================================
// WYBOR METODY PLATNOSCI
// ============================================================
// Autopay oddaje ponad dwadziescia kanalow, w wiekszosci male banki
// spoldzielcze. Wypisane jeden pod drugim daja na telefonie kilkanascie
// ekranow przewijania, a klient szukajacy BLIKA musi je wszystkie minac,
// zanim dojdzie do przycisku zaplaty.
//
// Dlatego na wierzchu zostaja rzeczy, po ktore ludzie faktycznie siegaja:
// wybor na stronie bramki, BLIK i portfele. Banki chowaja sie pod jednym
// wierszem, a po rozwinieciu ukladaja sie w siatke logotypow z wyszukiwarka.
// Logotyp rozpoznaje sie wzrokiem szybciej niz czyta nazwe, wiec siatka bije
// tu liste rozwijana.

const T = {
  pl: {
    banks: "Płacę z banku",
    banksHint: (n) => `${n} banków do wyboru`,
    search: "Szukaj banku",
    nothing: "Żaden bank nie pasuje do wpisanej nazwy",
    chosen: "Wybrano",
  },
  en: {
    banks: "Pay from my bank",
    banksHint: (n) => `${n} banks available`,
    search: "Search for a bank",
    nothing: "No bank matches that name",
    chosen: "Selected",
  },
  de: {
    banks: "Mit meiner Bank zahlen",
    banksHint: (n) => `${n} Banken verfügbar`,
    search: "Bank suchen",
    nothing: "Keine Bank passt zu diesem Namen",
    chosen: "Ausgewählt",
  },
};

export default function PaymentPicker({ methods = [], value, onChange, anyLabel, lang = "pl" }) {
  const t = T[lang] || T.pl;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { promoted, banks } = useMemo(() => splitMethods(methods), [methods]);

  const chosenBank = banks.find((m) => m.id === value) || null;
  const visible = useMemo(() => filterBanks(banks, query), [banks, query]);

  const rowBase = "w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all";
  const rowState = (active) =>
    active
      ? "border-blue-400 bg-blue-400/10 text-blue-300"
      : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20";

  return (
    <div className="space-y-2 mb-6">
      <button type="button" onClick={() => onChange(0)} className={`${rowBase} ${rowState(value === 0)}`}>
        {anyLabel}
      </button>

      {promoted.map((m) => (
        <button key={m.id} type="button" onClick={() => onChange(m.id)} className={`${rowBase} ${rowState(value === m.id)}`}>
          {m.icon && <img src={m.icon} alt="" className="h-5 w-auto" loading="lazy" />}
          {m.name}
        </button>
      ))}

      {banks.length > 0 && (
        <div className={`rounded-lg border ${chosenBank ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/[0.02]"}`}>
          {/* Wiersz zwijany niesie wybrany bank, zeby po zamknieciu nadal bylo
              widac, na co klient sie zdecydowal. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="w-full flex items-center gap-3 p-3 text-left"
          >
            {chosenBank?.icon && <img src={chosenBank.icon} alt="" className="h-5 w-auto" loading="lazy" />}
            <span className="flex-1 min-w-0">
              <span className={`block text-sm ${chosenBank ? "text-blue-300" : "text-neutral-400"}`}>
                {chosenBank ? chosenBank.name : t.banks}
              </span>
              <span className="block text-neutral-600 text-xs">
                {chosenBank ? t.chosen : t.banksHint(banks.length)}
              </span>
            </span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="px-3 pb-3">
              {/* Wyszukiwarka pojawia sie dopiero przy dluzszej liscie. Przy
                  kilku bankach pole tylko dokladaloby pracy. */}
              {banks.length > 8 && (
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.search}
                    className="w-full bg-transparent border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white
                               placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/50"
                  />
                </div>
              )}

              {visible.length === 0 ? (
                <p className="text-neutral-500 text-xs py-3 text-center">{t.nothing}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {visible.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { onChange(m.id); setOpen(false); }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border text-center transition-all ${
                        value === m.id
                          ? "border-blue-400 bg-blue-400/10 text-blue-300"
                          : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20"
                      }`}
                    >
                      {m.icon
                        ? <img src={m.icon} alt="" className="h-5 w-auto" loading="lazy" />
                        : <span className="h-5" />}
                      <span className="text-xs leading-tight break-words">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
