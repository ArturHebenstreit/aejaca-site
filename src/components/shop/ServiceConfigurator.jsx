// ============================================================
// KONFIGURATOR USLUGI, osadzony na karcie uslugi
// ============================================================
// Klient konfiguruje i dodaje do koszyka bez opuszczania strony. Kazde
// przejscie na inna strone to okazja do rezygnacji, a on jest juz zdecydowany.
//
// Cena pochodzi wylacznie z /api/price. Ten komponent jej nie liczy,
// tylko pokazuje to, co odpowiedzial backend.

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { useCart } from "../../cart/CartContext.jsx";
import { getService } from "../../data/orderCatalog.js";
import { PACKAGING, DEFAULT_PACKAGING, getPackaging } from "../../pricing/packaging.js";
import { t } from "../../pricing/config.js";
import { TileGroup, StepSlider, QtyStepper, FileDrop, PersonalizationField } from "./ConfigControls.jsx";

const API = import.meta.env.VITE_CHAT_API_URL;

const UI = {
  pl: {
    configure: "Skonfiguruj i dodaj do koszyka",
    file: "Twój plik",
    fileHint: "Kliknij lub przeciągnij plik STL",
    fileOptional: "Bez pliku wybierzesz rozmiar z listy poniżej",
    packaging: "Opakowanie",
    qty: "Liczba sztuk",
    price: "Cena",
    perPc: "za sztukę",
    total: "Razem",
    addToCart: "Dodaj do koszyka",
    added: "Dodano do koszyka",
    goToCart: "Przejdź do koszyka",
    calculating: "Liczę cenę",
    needsQuote: "Ta konfiguracja wymaga indywidualnej wyceny",
    needsQuoteCta: "Wyślij do wyceny",
    priceNote: "Cena wiążąca, obowiązuje 7 dni.",
    engravingHint: "Grawer wykonujemy dokładnie tak, jak wpiszesz. Sprawdź pisownię.",
    uploadFailed: "Nie udało się przyjąć pliku. Spróbuj ponownie albo napisz do nas.",
  },
  en: {
    configure: "Configure and add to cart",
    file: "Your file",
    fileHint: "Click or drag an STL file",
    fileOptional: "Without a file, pick a size from the list below",
    packaging: "Packaging",
    qty: "Quantity",
    price: "Price",
    perPc: "per piece",
    total: "Total",
    addToCart: "Add to cart",
    added: "Added to cart",
    goToCart: "Go to cart",
    calculating: "Calculating",
    needsQuote: "This configuration needs an individual quote",
    needsQuoteCta: "Request a quote",
    priceNote: "Binding price, valid for 7 days.",
    engravingHint: "We engrave exactly what you type. Please check the spelling.",
    uploadFailed: "We could not accept the file. Try again or write to us.",
  },
  de: {
    configure: "Konfigurieren und in den Warenkorb",
    file: "Ihre Datei",
    fileHint: "STL-Datei klicken oder hierher ziehen",
    fileOptional: "Ohne Datei wählen Sie unten eine Größe",
    packaging: "Verpackung",
    qty: "Stückzahl",
    price: "Preis",
    perPc: "pro Stück",
    total: "Gesamt",
    addToCart: "In den Warenkorb",
    added: "In den Warenkorb gelegt",
    goToCart: "Zum Warenkorb",
    calculating: "Berechne",
    needsQuote: "Diese Konfiguration erfordert ein individuelles Angebot",
    needsQuoteCta: "Angebot anfordern",
    priceNote: "Verbindlicher Preis, 7 Tage gültig.",
    engravingHint: "Wir gravieren genau das, was Sie eingeben. Bitte Schreibweise prüfen.",
    uploadFailed: "Die Datei konnte nicht angenommen werden. Bitte erneut versuchen oder uns schreiben.",
  },
};

const money = (g) => `${(g / 100).toFixed(2).replace(".", ",")} PLN`;

/** Pola, ktore lepiej czytaja sie jako suwak niz jako kafelki */
const SLIDER_FIELDS = new Set(["sizeId", "infillId", "precisionId", "layerId", "areaId", "pathId", "volumeId", "quantityId"]);

export default function ServiceConfigurator({ card, lang, accent = "blue" }) {
  const u = UI[lang] || UI.en;
  const service = getService(card.service);
  const cart = useCart();

  const [params, setParams] = useState(() => ({ ...(service?.defaults || {}) }));
  const [file, setFile] = useState(null);
  const [uploadToken, setUploadToken] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [packagingId, setPackagingId] = useState(DEFAULT_PACKAGING);
  const [engraving, setEngraving] = useState("");
  const [qty, setQty] = useState(1);

  const [price, setPrice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  const reqId = useRef(0);

  const fetchPrice = useCallback(async () => {
    if (!service || !API) return;
    const mine = ++reqId.current;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("calculator", service.calculator);
      body.append("lang", lang);
      body.append("params", JSON.stringify({ ...params, ...(service.fixed || {}) }));
      // Plik poszedl juz raz do /api/uploads, tutaj wystarczy identyfikator.
      if (uploadToken) body.append("uploadToken", uploadToken);

      const resp = await fetch(`${API}/api/price`, { method: "POST", body });
      const data = await resp.json();
      if (mine !== reqId.current) return; // odpowiedz na starsze zapytanie, ignorujemy
      if (!resp.ok) {
        setPrice(null);
        setError({ message: data.error, code: data.code });
        return;
      }
      setPrice(data.item);
      if (data.geometry) setGeometry(data.geometry);
    } catch {
      if (mine === reqId.current) setError({ message: u.needsQuote });
    } finally {
      if (mine === reqId.current) setBusy(false);
    }
  }, [service, params, uploadToken, lang, u.needsQuote]);

  // Cena odswieza sie po kazdej zmianie, z krotkim opoznieniem, zeby
  // przesuwanie suwaka nie wysylalo kilkunastu zapytan.
  useEffect(() => {
    const timer = setTimeout(fetchPrice, 350);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  useEffect(() => setAdded(false), [params, file, packagingId, engraving, qty]);

  if (!service) return null;

  const pack = getPackaging(packagingId);
  const packGrosze = pack?.grosze ?? 0;
  const unitTotal = (price?.unitGrosze ?? 0) + packGrosze;
  const lineTotal = unitTotal * qty;

  const setParam = (key, val) => setParams((p) => ({ ...p, [key]: val }));

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setGeometry(null);
    setPrice(null);
    setUploadToken(null);
    setUploading(true);
    setError(null);
    try {
      // Wysylamy raz. Serwer liczy geometrie, zapisuje plik na Dysku
      // i oddaje identyfikator, ktory trafia do koszyka zamiast megabajtow.
      const fd = new FormData();
      fd.append("file", f);
      fd.append("lang", lang);
      const resp = await fetch(`${API}/api/uploads`, { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) {
        setError({ message: data.error, code: data.code });
        setFile(null);
        return;
      }
      setUploadToken(data.uploadToken);
      setGeometry(data.geometry);
    } catch {
      setError({ message: u.uploadFailed });
      setFile(null);
    } finally {
      setUploading(false);
    }
  }

  function addToCart() {
    if (!price) return;
    cart.add({
      kind: "service",
      calculator: service.calculator,
      serviceId: card.id,
      title: t(card.title, lang),
      image: card.image,
      params: { ...params, ...(service.fixed || {}) },
      geometry,
      fileName: file?.name || null,
      uploadToken,
      needsFile: Boolean(file),
      // Plik lezy juz na Dysku, wiec pozycja przezyje odswiezenie strony.
      fileRetained: Boolean(uploadToken),
      unitGrosze: price.unitGrosze,
      packagingId,
      packagingGrosze: packGrosze,
      personalization: engraving || null,
      withdrawal: "made_to_order",
      qty,
    });
    setAdded(true);
  }

  const visibleFields = service.fields.filter((f) => !(f.hiddenWithFile && uploadToken));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <h2 className="text-white font-semibold text-sm mb-5">{u.configure}</h2>

      {service.acceptsFile && (
        <>
          <FileDrop
            label={u.file}
            hint={u.fileHint}
            file={file}
            geometry={geometry}
            busy={uploading}
            onPick={onPickFile}
            onClear={() => { setFile(null); setGeometry(null); setPrice(null); setUploadToken(null); }}
            accent={accent}
            lang={lang}
          />
          {!file && <p className="text-neutral-600 text-[11px] -mt-4 mb-6">{u.fileOptional}</p>}
        </>
      )}

      {visibleFields.map((f) => {
        const options = f.optionsFrom ? f.optionsFrom(params) : f.options;
        if (f.multi) {
          return (
            <div key={f.key} className="mb-6">
              <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">{t(f.label, lang)}</div>
              <div className="grid grid-cols-2 gap-2">
                {options.map((o) => {
                  const list = params[f.key] || [];
                  const on = list.includes(o.id);
                  return (
                    <button
                      key={String(o.id)}
                      type="button"
                      onClick={() => setParam(f.key, on ? list.filter((x) => x !== o.id) : [...list, o.id])}
                      className={`relative text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                        on
                          ? accent === "amber"
                            ? "border-amber-400 bg-amber-400/10 text-amber-200"
                            : "border-blue-400 bg-blue-400/10 text-blue-200"
                          : "border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/25"
                      }`}
                    >
                      {on && <Check className="w-3.5 h-3.5 absolute top-2 right-2" />}
                      <span className="pr-4 block leading-snug">{t(o.label, lang)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        if (SLIDER_FIELDS.has(f.key) && options.length >= 3 && options.length <= 7) {
          return (
            <StepSlider
              key={f.key}
              label={t(f.label, lang)}
              options={options}
              value={params[f.key]}
              onChange={(v) => setParam(f.key, v)}
              lang={lang}
              accent={accent}
            />
          );
        }
        return (
          <TileGroup
            key={f.key}
            label={t(f.label, lang)}
            options={options}
            value={params[f.key]}
            onChange={(v) => setParam(f.key, v)}
            lang={lang}
            accent={accent}
            columns={options.length > 8 ? 4 : 3}
          />
        );
      })}

      {/* Opakowanie */}
      <TileGroup
        label={u.packaging}
        options={PACKAGING.map((p) => ({
          id: p.id,
          label: p.label,
          sub: { pl: p.grosze ? `+ ${money(p.grosze)}` : "w cenie", en: p.grosze ? `+ ${money(p.grosze)}` : "included", de: p.grosze ? `+ ${money(p.grosze)}` : "inklusive" },
        }))}
        value={packagingId}
        onChange={setPackagingId}
        lang={lang}
        accent={accent}
        columns={3}
      />

      {pack?.personalizable && (
        <PersonalizationField
          label={t(pack.personalizationLabel, lang)}
          value={engraving}
          onChange={setEngraving}
          maxLength={pack.maxLength || 60}
          hint={u.engravingHint}
          accent={accent}
        />
      )}

      <QtyStepper label={u.qty} value={qty} onChange={setQty} accent={accent} />

      {/* Cena */}
      <div className="border-t border-white/10 pt-5">
        {busy && !price && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm py-3">
            <Loader2 className="w-4 h-4 animate-spin" />{u.calculating}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.05] p-4 mb-4">
            <div className="flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 text-xs font-medium mb-2">
                  {error.code === "needs_quote" ? u.needsQuote : error.message}
                </p>
                <Link to="/contact/" className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs">
                  {u.needsQuoteCta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {price && !error && (
          <>
            <div className="flex items-end justify-between mb-1">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">{u.price}</div>
                <div className="text-2xl font-extrabold text-white">
                  {money(unitTotal)} <span className="text-xs font-normal text-neutral-500">{u.perPc}</span>
                </div>
              </div>
              {qty > 1 && (
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500">{u.total}</div>
                  <div className={`text-xl font-bold ${accent === "amber" ? "text-amber-300" : "text-blue-300"}`}>
                    {money(lineTotal)}
                  </div>
                </div>
              )}
            </div>
            <p className="text-neutral-600 text-[11px] mb-4">{u.priceNote}</p>

            <button
              type="button"
              onClick={addToCart}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                added
                  ? "bg-emerald-500 text-white"
                  : accent === "amber"
                    ? "bg-amber-500 hover:bg-amber-400 text-neutral-900"
                    : "bg-blue-500 hover:bg-blue-400 text-white"
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
    </div>
  );
}
