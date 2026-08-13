// ============================================================
// KREATOR PIERSCIONKOW: cztery wyjscia i kwota wiazaca
// ============================================================
// Ta sama konfiguracja daje cztery rozne produkty, od pliku za kilkadziesiat
// zlotych po gotowy wyrob za kilka tysiecy. Klient musi widziec je OBOK
// SIEBIE, bo inaczej nie wie, ze plik w ogole jest do kupienia, a to
// najtansze wejscie w nasza oferte.
//
// CENA POCHODZI WYLACZNIE Z SERWERA. Przegladarka liczy te sama bryle na
// potrzeby podgladu, ale jej wynikowi nie ufamy: jest o jedno `fetch` od
// podmiany, a masa metalu to glowny skladnik kwoty. Serwer buduje bryle sam,
// tym samym kodem, i wycenia z wlasnego pomiaru.
//
// Jedno zapytanie, nie cztery: bryla powstaje po stronie serwera raz i z niej
// licza sie wszystkie wyjscia. Cztery osobne zapytania to cztery przebiegi
// jadra geometrycznego na te sama bryle.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Loader2, FileDown, Boxes, Gem, Mail } from "lucide-react";
import { useCart } from "../../../cart/CartContext.jsx";
import { OUTPUT_AVAILABLE } from "../../../pricing/ringConfigurator.js";

const API = import.meta.env.VITE_CHAT_API_URL;

// Kolejnosc od najtanszego, bo tak sie te wyjscia czyta. Lista tego, co
// naprawde da sie kupic, idzie z rdzenia wyceny: wyjscie wylaczone nie ma
// prawa pojawic sie w interfejsie jako kafelek bez ceny.
const IKONY = { mesh: FileDown, step: FileDown, cast: Boxes, finished: Gem };
const WYJSCIA = ["mesh", "step", "cast", "finished"]
  .filter((id) => OUTPUT_AVAILABLE[id])
  .map((id) => ({ id, icon: IKONY[id] }));

const L = {
  pl: {
    title: "Co chcesz zamówić",
    mesh: "Plik STL i 3MF", meshNote: "Do druku i odlewu we własnym zakresie. Wysyłamy od razu po opłaceniu.",
    step: "Plik STEP", stepNote: "Model powierzchniowy do edycji w Rhino czy Matrixie.",
    cast: "Odlew bez kamieni", castNote: "Odlany i obrobiony, gniazda gotowe pod zakucie.",
    finished: "Gotowy wyrób", finishedNote: "Odlew, zakute kamienie, polerowanie. Wysyłamy skończony pierścionek.",
    add: "Dodaj do koszyka", added: "Dodano do koszyka", goToCart: "Przejdź do koszyka",
    busy: "Liczę kwotę wiążącą", err: "Wyceny chwilowo nie ma. Spróbuj za chwilę.",
    quote: "Wycena indywidualna", quoteCta: "Napisz do nas",
    quoteWhy: "Tego kamienia nie mamy w cenniku, więc kwotę podajemy ręcznie. Odpowiadamy w 24 godziny.",
    note: "Kwota wiążąca, obowiązuje 7 dni. Masa metalu policzona z tej samej bryły, którą widzisz obok.",
    mass: "Masa metalu", stones: "Kamieni",
    nominal: "Model jest nominalny, w wymiarach gotowego pierścionka, bez kompensacji skurczu odlewu. Jeśli odlewasz u siebie, powiększ go najpierw:",
    nominalLink: "kalkulator skurczu",
    breakdown: "Z czego składa się ta kwota",
  },
  en: {
    title: "What would you like to order",
    mesh: "STL and 3MF files", meshNote: "For printing and casting on your own. Sent as soon as payment clears.",
    step: "STEP file", stepNote: "A surface model for editing in Rhino or Matrix.",
    cast: "Casting without stones", castNote: "Cast and finished, seats ready for setting.",
    finished: "Finished piece", finishedNote: "Cast, stones set, polished. We send a finished ring.",
    add: "Add to cart", added: "Added to cart", goToCart: "Go to cart",
    busy: "Calculating the binding price", err: "Pricing is briefly unavailable. Try again shortly.",
    quote: "Individual quote", quoteCta: "Write to us",
    quoteWhy: "This stone is not in our price list, so we quote it by hand. We reply within 24 hours.",
    note: "Binding price, valid for 7 days. Metal mass taken from the same solid you see alongside.",
    mass: "Metal mass", stones: "Stones",
    nominal: "The model is nominal, at finished ring dimensions, without casting shrinkage compensation. If you cast it yourself, scale it up first:",
    nominalLink: "shrinkage calculator",
    breakdown: "What this amount consists of",
  },
  de: {
    title: "Was möchten Sie bestellen",
    mesh: "STL- und 3MF-Datei", meshNote: "Zum eigenen Drucken und Gießen. Versand direkt nach Zahlungseingang.",
    step: "STEP-Datei", stepNote: "Flächenmodell zur Bearbeitung in Rhino oder Matrix.",
    cast: "Guss ohne Steine", castNote: "Gegossen und bearbeitet, Sitze fertig zum Fassen.",
    finished: "Fertiges Stück", finishedNote: "Guss, gefasste Steine, Politur. Wir senden einen fertigen Ring.",
    add: "In den Warenkorb", added: "Hinzugefügt", goToCart: "Zum Warenkorb",
    busy: "Verbindlicher Preis wird berechnet", err: "Preisberechnung kurz nicht verfügbar. Bitte gleich erneut versuchen.",
    quote: "Individuelles Angebot", quoteCta: "Schreiben Sie uns",
    quoteWhy: "Diesen Stein führen wir nicht in der Preisliste, daher rechnen wir von Hand. Antwort binnen 24 Stunden.",
    note: "Verbindlicher Preis, 7 Tage gültig. Metallmasse aus demselben Körper, den Sie daneben sehen.",
    mass: "Metallmasse", stones: "Steine",
    nominal: "Das Modell ist nominal, in den Maßen des fertigen Rings, ohne Schwindungskompensation. Wenn Sie selbst gießen, skalieren Sie es zuerst:",
    nominalLink: "Schwindungsrechner",
    breakdown: "Woraus sich der Betrag zusammensetzt",
  },
};

const zl = (grosze, lang) =>
  (grosze / 100).toLocaleString(lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : "en-US",
    { style: "currency", currency: "PLN", maximumFractionDigits: 0 });

export default function RingPriceBox({ params, lang = "pl" }) {
  const t = L[lang] || L.pl;
  const cart = useCart();
  const [dane, setDane] = useState(null);
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState(false);
  const [wybor, setWybor] = useState("finished");
  const [dodane, setDodane] = useState(false);
  const nr = useRef(0);

  const klucz = JSON.stringify(params);

  useEffect(() => {
    if (!API) return undefined;
    setDodane(false);
    // Kwota wiazaca nie musi gonic suwaka: liczy ja serwer, wiec kazde
    // drgniecie to osobne zapytanie i osobny przebieg jadra. Podglad
    // odpowiada natychmiast, cena moze poczekac pol sekundy.
    const id = setTimeout(async () => {
      const moje = ++nr.current;
      setBusy(true);
      setBlad(false);
      try {
        const r = await fetch(`${API}/api/price/ring`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ params: JSON.parse(klucz), lang }),
        });
        const d = await r.json();
        if (moje !== nr.current) return;          // odpowiedz starsza niz zapytanie
        if (!r.ok) { setDane(null); setBlad(true); return; }
        setDane(d);
      } catch {
        if (moje === nr.current) setBlad(true);
      } finally {
        if (moje === nr.current) setBusy(false);
      }
    }, 550);
    return () => clearTimeout(id);
  }, [klucz, lang]);

  if (!API) return null;

  const items = dane?.items || {};
  const wybrany = items[wybor];
  const kupny = wybrany && wybrany.lineGrosze > 0;

  function doKoszyka() {
    if (!kupny) return;
    cart.add({
      kind: "service",
      calculator: "jewelry_ring_config",
      serviceId: "jewelry_ring_config",
      title: `${wybrany.title}: ${t[wybor]}`,
      // Parametry ida do koszyka w calosci, RAZEM z wyjsciem. Bez niego
      // koszyk przeliczylby pozycje na wyjscie domyslne, czyli plik,
      // i klient zaplacilby kilkadziesiat zlotych za gotowy wyrob.
      params: { ...params, output: wybor },
      unitGrosze: wybrany.unitGrosze,
      packagingId: "paper",
      packagingGrosze: 0,
      withdrawal: "made_to_order",
      qty: 1,
      source: "ring-configurator",
    });
    setDodane(true);
  }

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[10.5px] uppercase tracking-[0.13em] text-neutral-500">{t.title}</h3>
        {dane?.geometry ? (
          <span className="text-[11px] tabular-nums text-neutral-500">
            {t.mass} {dane.geometry.massG.toFixed(2)} g
          </span>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {WYJSCIA.map(({ id, icon: Icon }) => {
          const it = items[id];
          const wybrane = id === wybor;
          const doWyceny = it && !it.lineGrosze;
          return (
            <button
              key={id} type="button" onClick={() => { setWybor(id); setDodane(false); }}
              aria-pressed={wybrane}
              className={`text-left rounded-lg border p-3 transition-colors ${
                wybrane ? "border-amber-400/50 bg-amber-400/[0.07]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/25"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={wybrane ? "text-amber-300" : "text-neutral-500"} />
                <span className={`text-[13px] ${wybrane ? "text-amber-200" : "text-neutral-300"}`}>{t[id]}</span>
              </div>
              <div className="text-[15px] tabular-nums text-white mb-1">
                {busy && !it ? <Loader2 size={14} className="animate-spin text-neutral-500" />
                  : doWyceny ? <span className="text-[13px] text-neutral-400">{t.quote}</span>
                  : it ? zl(it.lineGrosze, lang) : "–"}
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-500">{t[`${id}Note`]}</p>
            </button>
          );
        })}
      </div>

      {/* Rozbicie kwoty NIE jest ozdobnikiem. Gotowy wyrob potrafi kosztowac
          dziesiec razy tyle co odlew i bez tej listy liczba wyglada jak blad,
          a klient nie ma jak sprawdzic, ze kamien jest tu drozszy od metalu.
          Kalkulatory pokazuja to od zawsze, kreator byl wyjatkiem. */}
      {wybrany?.breakdown?.length ? (
        <dl className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1.5">{t.breakdown}</dt>
          {wybrany.breakdown.map((w, i) => (
            w.divider ? <hr key={i} className="my-1.5 border-white/10" /> : (
              <div key={i} className="flex justify-between gap-3 py-0.5">
                <dd className={`text-[12px] ${w.bold ? "text-neutral-200" : "text-neutral-400"}`}>{w.label}</dd>
                <dd className={`text-[12px] tabular-nums ${w.bold ? "text-neutral-100 font-medium" : "text-neutral-300"}`}>{w.value}</dd>
              </div>
            )
          ))}
        </dl>
      ) : null}

      {/* Model nominalny to decyzja, nie przeoczenie, wiec mowimy o niej
          wprost i kierujemy do narzedzia, ktore liczy kompensacje. */}
      {wybor === "mesh" ? (
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
          {t.nominal}{" "}
          <Link to="/toolstudio/shrinkage" className="text-amber-300/90 underline underline-offset-2">
            {t.nominalLink}
          </Link>
        </p>
      ) : null}

      {blad ? <p className="mt-3 text-[12px] text-neutral-400">{t.err}</p> : null}

      {wybrany && !kupny ? (
        <div className="mt-3">
          <p className="text-[12px] leading-relaxed text-neutral-400 mb-2">{t.quoteWhy}</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 rounded-sm bg-amber-400/90 px-4 py-2 text-[13px] font-medium text-neutral-950">
            <Mail size={14} /> {t.quoteCta}
          </Link>
        </div>
      ) : null}

      {kupny ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={doKoszyka} disabled={dodane}
            className="inline-flex items-center gap-2 rounded-sm bg-amber-400/90 px-4 py-2 text-[13px] font-medium text-neutral-950 disabled:opacity-60">
            {dodane ? <Check size={14} /> : <ShoppingCart size={14} />}
            {dodane ? t.added : t.add}
          </button>
          {dodane ? (
            <Link to="/cart" className="text-[13px] text-amber-300 underline underline-offset-4">{t.goToCart}</Link>
          ) : null}
          {busy ? <span className="text-[11px] text-neutral-500">{t.busy}…</span> : null}
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">{t.note}</p>
    </div>
  );
}
