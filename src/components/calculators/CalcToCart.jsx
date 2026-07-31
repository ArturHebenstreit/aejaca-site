// ============================================================
// KWOTA WIAZACA I KOSZYK, doklejone do kalkulatora
// ============================================================
// Kalkulator konczyl sie widelkami i formularzem zapytania, wiec klient,
// ktory juz wszystko ustawil, musial zaczynac od nowa w sklepie i dziwil
// sie, ze widzi tam inna liczbe. Widelki opisuja niepewnosc szacunku,
// kwota wiazaca jest oferta. Tu pokazujemy jedno pod drugim.
//
// Cena pochodzi wylacznie z /api/price. Ten komponent jej nie liczy.
// Parametry sa te same, ktorych uzywa kalkulator, bo obie strony wolaja
// ten sam rdzen z src/pricing/.

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Loader2, ArrowRight, Info } from "lucide-react";
import { useCart } from "../../cart/CartContext.jsx";
import { getServiceCard } from "../../data/serviceCatalog.js";
import { t } from "../../pricing/config.js";

const API = import.meta.env.VITE_CHAT_API_URL;

const UI = {
  pl: {
    binding: "Kwota wiążąca",
    addToCart: "Dodaj do koszyka",
    added: "Dodano do koszyka",
    goToCart: "Przejdź do koszyka",
    calculating: "Liczę kwotę wiążącą",
    note: "Widełki powyżej to szacunek. Ta kwota jest wiążąca i obowiązuje 7 dni.",
    unavailable: "Tej konfiguracji nie wycenimy automatycznie. Napisz do nas, odpowiemy w 24 godziny.",
    contact: "Wyślij do wyceny",
    uploading: "Przygotowuję plik",
    perPc: "za sztukę",
    pcs: "szt.",
    svgBlocked: "Wgrany plik wektorowy wyceniamy ręcznie, bo liczy się realna długość ścieżki. Usuń plik, żeby kupić po polu z listy, albo wyślij do wyceny.",
    manualBlocked: "Tę konfigurację wycenia człowiek: kamienie, sploty łańcuszków i metal powierzony przez klienta zależą od rzeczy, których nie widać w parametrach. Odpowiadamy w 24 godziny.",
  },
  en: {
    binding: "Binding price",
    addToCart: "Add to cart",
    added: "Added to cart",
    goToCart: "Go to cart",
    calculating: "Calculating the binding price",
    note: "The range above is an estimate. This amount is binding and valid for 7 days.",
    unavailable: "We cannot price this configuration automatically. Write to us and we reply within 24 hours.",
    contact: "Request a quote",
    uploading: "Preparing the file",
    perPc: "per piece",
    pcs: "pcs",
    svgBlocked: "An uploaded vector file is quoted by hand, because the real path length decides the price. Remove the file to buy by the listed area, or request a quote.",
    manualBlocked: "This configuration is quoted by a person: stones, chain weaves and customer-supplied metal depend on things the parameters do not capture. We reply within 24 hours.",
  },
  de: {
    binding: "Verbindlicher Preis",
    addToCart: "In den Warenkorb",
    added: "In den Warenkorb gelegt",
    goToCart: "Zum Warenkorb",
    calculating: "Verbindlicher Preis wird berechnet",
    note: "Die Spanne oben ist eine Schätzung. Dieser Betrag ist verbindlich und 7 Tage gültig.",
    unavailable: "Diese Konfiguration können wir nicht automatisch bepreisen. Schreiben Sie uns, wir antworten binnen 24 Stunden.",
    contact: "Angebot anfordern",
    uploading: "Datei wird vorbereitet",
    perPc: "pro Stück",
    pcs: "Stk.",
    svgBlocked: "Eine hochgeladene Vektordatei kalkulieren wir manuell, denn die tatsächliche Pfadlänge entscheidet. Entfernen Sie die Datei, um nach gelisteter Fläche zu kaufen, oder fordern Sie ein Angebot an.",
    manualBlocked: "Diese Konfiguration kalkuliert ein Mensch: Steine, Kettengeflechte und beigestelltes Metall hängen von Dingen ab, die in den Parametern nicht stehen. Wir antworten binnen 24 Stunden.",
  },
};

const money = (g) => `${(g / 100).toFixed(2).replace(".", ",")} PLN`;

/**
 * @param {object} props
 * @param {string} props.calculator klucz z rejestru CALCULATORS na serwerze
 * @param {string} props.serviceId  identyfikator karty uslugi, dla tytulu i zdjecia
 * @param {object} props.params     dokladnie te parametry, ktorymi liczy kalkulator
 * @param {File}   [props.file]     plik klienta, jesli kalkulator go przyjal
 * @param {number} [props.scale]    skala modelu ustawiona w kalkulatorze
 * @param {string} props.lang
 * @param {"blue"|"amber"} [props.accent]
 */
export default function CalcToCart({ calculator, serviceId, params, file = null, scale = 1, lang, accent = "blue", blocked = false, blockedReason = "vector" }) {
  const u = UI[lang] || UI.en;
  const cart = useCart();
  const card = getServiceCard(serviceId);

  const [price, setPrice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  const [uploadToken, setUploadToken] = useState(null);
  const [uploading, setUploading] = useState(false);
  const reqId = useRef(0);

  // Plik idzie na serwer raz, jak w sklepie. Bez tego kwota wiazaca liczylaby
  // sie z wybranego rozmiaru, a nie z modelu, i rozjechalaby sie z widelkami.
  useEffect(() => {
    if (!file || !API) {
      setUploadToken(null);
      return;
    }
    let cancelled = false;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lang", lang);
    fetch(`${API}/api/uploads`, { method: "POST", body: fd })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.uploadToken) setUploadToken(d.uploadToken); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setUploading(false); });
    return () => { cancelled = true; };
  }, [file, lang]);

  const paramsKey = JSON.stringify(params);

  const fetchPrice = useCallback(async () => {
    if (!API || !calculator) return;
    const mine = ++reqId.current;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("calculator", calculator);
      body.append("lang", lang);
      body.append("params", paramsKey);
      if (uploadToken) body.append("uploadToken", uploadToken);
      if (scale && scale !== 1) body.append("scale", String(scale));

      const resp = await fetch(`${API}/api/price`, { method: "POST", body });
      const data = await resp.json();
      if (mine !== reqId.current) return;
      if (!resp.ok) {
        setPrice(null);
        setError(data.code || "no_price");
        return;
      }
      setPrice(data.item);
    } catch {
      if (mine === reqId.current) setError("network");
    } finally {
      if (mine === reqId.current) setBusy(false);
    }
  }, [calculator, paramsKey, uploadToken, scale, lang]);

  useEffect(() => {
    const timer = setTimeout(fetchPrice, 400);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  useEffect(() => setAdded(false), [paramsKey, uploadToken]);

  if (!card) return null;

  // Sciezka wektorowa nie da sie policzyc z presetu pola, wiec zamiast
  // pokazywac kwote, ktora i tak bysmy poprawili, mowimy to wprost.
  if (blocked) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-neutral-400 text-xs leading-relaxed mb-2">{blockedReason === "manual" ? u.manualBlocked : u.svgBlocked}</p>
            <Link to="/contact/" className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white text-xs">
              {u.contact} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const qty = price?.qty || 1;
  const lineGrosze = (price?.unitGrosze || 0) * qty;

  function addToCart() {
    if (!price) return;
    cart.add({
      kind: "service",
      calculator,
      serviceId,
      title: t(card.title, lang),
      image: card.image,
      params,
      fileName: file?.name || null,
      uploadToken,
      fileRetained: Boolean(uploadToken),
      unitGrosze: price.unitGrosze,
      packagingId: "paper",
      packagingGrosze: 0,
      withdrawal: "made_to_order",
      qty,
      // Slad pochodzenia: pozycja z kalkulatora ma inny zestaw parametrow
      // niz karta uslugi, wiec warto wiedziec, skad przyszla.
      source: "calculator",
    });
    setAdded(true);
  }

  const ring = accent === "amber" ? "border-amber-400/25 bg-amber-400/[0.04]" : "border-blue-400/25 bg-blue-400/[0.04]";
  const btn = accent === "amber"
    ? "bg-amber-500 hover:bg-amber-400 text-neutral-900"
    : "bg-blue-500 hover:bg-blue-400 text-white";

  return (
    <div className={`mt-4 rounded-2xl border p-5 ${ring}`}>
      {(busy || uploading) && !price && (
        <div className="flex items-center gap-2 text-neutral-400 text-sm py-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          {uploading ? u.uploading : u.calculating}
        </div>
      )}

      {error && !busy && (
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-neutral-400 text-xs leading-relaxed mb-2">{u.unavailable}</p>
            <Link to="/contact/" className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white text-xs">
              {u.contact} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {price && !error && (
        <>
          <div className="flex items-end justify-between gap-4 mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                {qty > 1 ? `${u.binding} (${qty} ${u.pcs})` : u.binding}
              </div>
              <div className="text-3xl font-extrabold text-white leading-tight">{money(lineGrosze)}</div>
            </div>
            {qty > 1 && (
              <div className="text-right text-neutral-400 text-xs">
                {money(price.unitGrosze)} {u.perPc}
              </div>
            )}
          </div>
          <p className="text-neutral-500 text-[11px] mb-4 leading-relaxed">{u.note}</p>

          <button
            type="button"
            onClick={addToCart}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
              added ? "bg-emerald-500 text-white" : btn
            }`}
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {added ? u.added : u.addToCart}
          </button>

          {added && (
            <Link
              to="/cart/"
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 text-neutral-400 hover:text-white text-xs transition-colors"
            >
              {u.goToCart} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
