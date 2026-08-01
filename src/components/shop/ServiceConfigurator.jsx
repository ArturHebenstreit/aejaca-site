// ============================================================
// KONFIGURATOR USLUGI, osadzony na karcie uslugi
// ============================================================
// Klient konfiguruje i dodaje do koszyka bez opuszczania strony. Kazde
// przejscie na inna strone to okazja do rezygnacji, a on jest juz zdecydowany.
//
// Cena pochodzi wylacznie z /api/price. Ten komponent jej nie liczy,
// tylko pokazuje to, co odpowiedzial backend.

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { useCart } from "../../cart/CartContext.jsx";
import { getService } from "../../data/orderCatalog.js";
import { PACKAGING, DEFAULT_PACKAGING, getPackaging, ENGRAVING_LIMITS } from "../../pricing/packaging.js";
import { t, quantityBounds } from "../../pricing/config.js";
import { TileGroup, StepSlider, QtyStepper, FileDrop, PersonalizationField, JobDescription } from "./ConfigControls.jsx";

const API = import.meta.env.VITE_CHAT_API_URL;

// three.js wazy wiecej niz cala reszta strony sklepu, wiec sciagamy go
// dopiero, gdy ktos naprawde wgra model.
const STLViewer = lazy(() => import("../calculators/STLViewer.jsx"));

/** Rozszerzenia przyjmowane w polu pliku, zgodne z SUPPORTED_EXTENSIONS na serwerze */
const ACCEPT_MESH = ".stl,.obj,.3mf,.step,.stp";

/** Rysunki techniczne, ktore przyjmujemy jako zalacznik do zlecenia */
const ACCEPT_VECTOR = ".svg,.dxf,.pdf";

/** Gorna granica miniatury trzymanej w koszyku, zeby nie przepelnic localStorage */
const MAX_CART_THUMB_CHARS = 80_000;

const UI = {
  pl: {
    configure: "Skonfiguruj i dodaj do koszyka",
    file: "Twój plik",
    fileHint: "Kliknij lub przeciągnij plik STL, OBJ, 3MF lub STEP",
    unitsNote: "Pliki STL i OBJ nie zapisują jednostki. Przyjmujemy milimetry, sprawdź wymiary powyżej.",
    vector: "Projekt do wykonania",
    vectorHint: "Kliknij lub przeciągnij plik SVG, DXF lub PDF",
    vectorNote: "Rysunek nie zmienia ceny, wyznacza ją wybrane pole grawerowania. Trafia do warsztatu razem z zamówieniem.",
    describeLabel: "Opisz, co mamy wykonać",
    describeHint: "np. pierścionek zaręczynowy, szyna 2,5 mm, matowa powierzchnia, grawer wewnątrz, rozmiar 15",
    describeWhy: "Cena jest policzona, ale z samych parametrów nie wynika, jak przedmiot ma wyglądać. Bez opisu nie przyjmiemy zlecenia.",
    addImage: "Dołącz zdjęcie lub szkic (opcjonalnie)",
    missingDescription: "Uzupełnij opis, żeby dodać do koszyka",
    missingArtwork: "Wgraj projekt, żeby dodać do koszyka",
    engravingLabel: "Treść graweru",
    engravingPlaceholder: "np. A + M, 12.06.2026",
    engravingOver: "Dłuższy grawer wyceniamy indywidualnie: to inne ustawienia lasera i inna kompozycja. Napisz do nas, odpowiemy w 24 godziny.",
    lidBack: "Treść po wewnętrznej stronie wieka (opcjonalnie)",
    missingEngraving: "Wpisz treść graweru",
    toQuote: "Wyślij do wyceny",
    showDetails: "Pokaż szczegóły kalkulacji",
    hideDetails: "Ukryj szczegóły",
    gateComplex: "Kształt z ornamentem, ażurem albo formą rzeźbiarską wyceniamy indywidualnie. Nakład pracy przy takiej bryle nie wynika z masy ani z metody, więc kwota z automatu byłaby zgadywaniem.",
    gateHandmade: "Wykonanie ręczne wyceniamy indywidualnie. Wiążącą cenę podajemy przy odlewie, bo tam czas pracy jest powtarzalny.",
    fileOptional: "Bez pliku wybierzesz rozmiar z listy poniżej",
    packaging: "Opakowanie",
    qty: "Liczba sztuk",
    price: "Cena",
    perPc: "za sztukę",
    pcs: "szt.",
    tierRange: "próg",
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
    fileHint: "Click or drag an STL, OBJ, 3MF or STEP file",
    unitsNote: "STL and OBJ carry no unit. We read them as millimetres, please check the dimensions above.",
    vector: "Your artwork",
    vectorHint: "Click or drag an SVG, DXF or PDF file",
    vectorNote: "The drawing does not change the price, the selected engraving area does. It travels to the workshop with the order.",
    describeLabel: "Describe what we are to make",
    describeHint: "e.g. engagement ring, 2.5 mm band, matte finish, inside engraving, size 15",
    describeWhy: "The price is calculated, but the parameters alone do not say how the piece should look. Without a description we cannot accept the job.",
    addImage: "Attach a photo or sketch (optional)",
    missingDescription: "Add a description to put this in the cart",
    missingArtwork: "Upload the artwork to put this in the cart",
    engravingLabel: "Engraving text",
    engravingPlaceholder: "e.g. A + M, 12.06.2026",
    engravingOver: "A longer engraving is quoted individually: different laser settings and a different layout. Write to us, we reply within 24 hours.",
    lidBack: "Text on the inside of the lid (optional)",
    missingEngraving: "Enter the engraving text",
    toQuote: "Request a quote",
    showDetails: "Show the breakdown",
    hideDetails: "Hide the breakdown",
    gateComplex: "An ornamented, openwork or sculptural shape is quoted individually. The work involved does not follow from mass or method, so an automatic price would be guesswork.",
    gateHandmade: "Hand fabrication is quoted individually. We commit to a price for casting, where the working time is repeatable.",
    fileOptional: "Without a file, pick a size from the list below",
    packaging: "Packaging",
    qty: "Quantity",
    price: "Price",
    perPc: "per piece",
    pcs: "pcs",
    tierRange: "tier",
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
    fileHint: "STL-, OBJ-, 3MF- oder STEP-Datei klicken oder hierher ziehen",
    unitsNote: "STL und OBJ speichern keine Einheit. Wir lesen Millimeter, bitte prüfen Sie die Maße oben.",
    vector: "Ihre Vorlage",
    vectorHint: "SVG-, DXF- oder PDF-Datei klicken oder hierher ziehen",
    vectorNote: "Die Zeichnung ändert den Preis nicht, das gewählte Gravurfeld bestimmt ihn. Sie geht mit der Bestellung in die Werkstatt.",
    describeLabel: "Beschreiben Sie, was wir anfertigen sollen",
    describeHint: "z. B. Verlobungsring, Schiene 2,5 mm, matt, Innengravur, Größe 15",
    describeWhy: "Der Preis steht, aber aus den Parametern allein geht nicht hervor, wie das Stück aussehen soll. Ohne Beschreibung nehmen wir den Auftrag nicht an.",
    addImage: "Foto oder Skizze anhängen (optional)",
    missingDescription: "Beschreibung ergänzen, um in den Warenkorb zu legen",
    missingArtwork: "Vorlage hochladen, um in den Warenkorb zu legen",
    engravingLabel: "Gravurtext",
    engravingPlaceholder: "z. B. A + M, 12.06.2026",
    engravingOver: "Eine längere Gravur kalkulieren wir individuell: andere Lasereinstellungen, andere Komposition. Schreiben Sie uns, wir antworten binnen 24 Stunden.",
    lidBack: "Text auf der Deckelinnenseite (optional)",
    missingEngraving: "Gravurtext eingeben",
    toQuote: "Angebot anfordern",
    showDetails: "Kalkulation anzeigen",
    hideDetails: "Kalkulation ausblenden",
    gateComplex: "Eine ornamentierte, durchbrochene oder skulpturale Form kalkulieren wir individuell. Der Aufwand ergibt sich weder aus Masse noch aus Methode, ein automatischer Preis wäre geraten.",
    gateHandmade: "Handanfertigung kalkulieren wir individuell. Verbindlich wird der Preis beim Guss, wo die Arbeitszeit reproduzierbar ist.",
    fileOptional: "Ohne Datei wählen Sie unten eine Größe",
    packaging: "Verpackung",
    qty: "Stückzahl",
    price: "Preis",
    perPc: "pro Stück",
    pcs: "Stk.",
    tierRange: "Stufe",
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
  const [triangles, setTriangles] = useState(null);
  const [hasThumb, setHasThumb] = useState(false);
  const [thumbData, setThumbData] = useState(null);
  const [vectorFile, setVectorFile] = useState(null);
  const [vectorToken, setVectorToken] = useState(null);
  const [vectorBusy, setVectorBusy] = useState(false);
  const [thumbTick, setThumbTick] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [packagingId, setPackagingId] = useState(DEFAULT_PACKAGING);
  const [engraving, setEngraving] = useState("");
  const [description, setDescription] = useState("");
  const [refImage, setRefImage] = useState(null);
  // Grawer na wyrobie i grawer na pudelku to dwie rozne rzeczy, ktore klient
  // moze zamowic naraz. Wspolny stan kasowal jedno przy wyborze drugiego.
  const [packEngraving, setPackEngraving] = useState("");
  const [lidBackText, setLidBackText] = useState("");
  const [qty, setQty] = useState(1);

  const [price, setPrice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  const reqId = useRef(0);
  // Podglad rysuje sie z lokalnego odczytu, wiec zrzut bywa gotowy, zanim
  // serwer odda identyfikator uploadu. Trzymamy go tu i wysylamy, gdy bedzie dokad.
  const pendingThumb = useRef(null);

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

  useEffect(() => setAdded(false), [params, file, packagingId, engraving, packEngraving, lidBackText, description, qty]);

  // Wysylka miniatury czeka na identyfikator uploadu i idzie dokladnie raz.
  useEffect(() => {
    const dataUrl = pendingThumb.current;
    if (!dataUrl || !uploadToken || hasThumb || !API) return;
    let cancelled = false;
    fetch(`${API}/api/uploads/${uploadToken}/thumb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    })
      .then(async (r) => {
        if (r.ok) {
          if (!cancelled) {
            pendingThumb.current = null;
            setHasThumb(true);
          }
          return;
        }
        // Brak podgladu w koszyku nie blokuje zamowienia, ale ma zostawic slad.
        console.warn(`[shop] miniatura odrzucona (${r.status})`, await r.text().catch(() => ""));
      })
      .catch((e) => console.warn("[shop] miniatura nie doszla:", e.message));
    return () => { cancelled = true; };
  }, [uploadToken, hasThumb, thumbTick]);

  if (!service) return null;

  // Usluga cyfrowa konczy sie plikiem, wiec nie ma czego pakowac.
  const isDigital = Boolean(service.digital);
  const pack = isDigital ? null : getPackaging(packagingId);
  const packGrosze = pack?.grosze ?? 0;
  const unitTotal = (price?.unitGrosze ?? 0) + packGrosze;

  // Prog nakladu wyznacza przedzial sztuk. Rabat progu jest juz wliczony
  // w cene jednostkowa, wiec licznik musi w tym przedziale zostac.
  // Prog nakladu nazywa sie inaczej w bizuterii (qtyId) niz w studiu (quantityId).
  const tierKey = service.fields.some((f) => f.key === "quantityId")
    ? "quantityId"
    : service.fields.some((f) => f.key === "qtyId") ? "qtyId" : null;
  const bounds = tierKey ? quantityBounds(params[tierKey]) : { min: 1, max: 999 };
  // Gdy prog wskazuje dokladnie jedna sztuke, osobny licznik jest zbedny
  // i wyglada jak druga, sprzeczna kontrolka o tej samej nazwie.
  const showQtyStepper = bounds.min !== bounds.max;
  const effectiveQty = Math.min(bounds.max, Math.max(bounds.min, qty));
  const lineTotal = unitTotal * effectiveQty;

  // Pozycja w koszyku ma byc gotowa do kupienia, a nie do dopytania mailem.
  const descriptionOk = !service.requiresDescription || description.trim().length >= 20;
  const artworkOk = !service.requiresVector || Boolean(vectorFile);

  // Grawer na wyrobie. Wybrany wariant bez tresci to zlecenie, ktorego nie da
  // sie wykonac, a tekst dluzszy niz limit to juz inna robota, wiec kierujemy
  // go do wyceny zamiast obiecywac cene z automatu.
  const wantsEngraving = Boolean(params.engravingId && params.engravingId !== "none");
  const jewelryOver = wantsEngraving && engraving.trim().length > ENGRAVING_LIMITS.jewelry;
  const jewelryEngravingOk = !wantsEngraving || (engraving.trim().length >= 1 && !jewelryOver);

  // Grawer na wieku pudelka, wlasne pole i wlasny limit.
  const packLimit = pack?.maxLength ?? ENGRAVING_LIMITS.packaging;
  const packOver = Boolean(pack?.personalizable) && (
    packEngraving.trim().length > packLimit || lidBackText.trim().length > packLimit
  );
  const packEngravingOk = !pack?.personalizable || (packEngraving.trim().length >= 1 && !packOver);

  // Wiazaca cena bizuterii ma pokrycie tylko przy odlewie prostej bryly.
  // Reszta to praca, ktorej nie widac w parametrach.
  // Bramka dotyczy WYLACZNIE bizuterii. Przy projekcie 3D zlozonosc jest
  // progiem cenowym: podnosi kwote i pozwala zlecic prace, a nie zatrzymuje
  // klienta. Oba pola nazywaja sie complexityId, wiec bez tego warunku
  // projekt sredni i rzezbiarski byly nie do kupienia.
  const gateComplex = service.calculator === "jewelry_new"
    && params.complexityId != null && params.complexityId !== "simple";
  const gateHandmade = service.calculator === "jewelry_new" && params.methodId != null && params.methodId !== "cast";
  const needsHumanQuote = gateComplex || gateHandmade;

  const overLimit = jewelryOver || packOver;
  const ready = descriptionOk && artworkOk && jewelryEngravingOk && packEngravingOk && !needsHumanQuote;

  const setParam = (key, val) => setParams((p) => ({ ...p, [key]: val }));

  function resetFile() {
    setFile(null);
    setGeometry(null);
    setTriangles(null);
    setPrice(null);
    setUploadToken(null);
    setHasThumb(false);
    setThumbData(null);
    pendingThumb.current = null;
  }

  /**
   * Miniatura z podgladu. Trafia do koszyka i do maila warsztatowego,
   * zeby po obu stronach bylo widac, co dokladnie zamowiono.
   */
  function onSnapshot(dataUrl) {
    pendingThumb.current = dataUrl;
    // Kopia w koszyku nie zalezy od tego, czy zapis na serwerze sie powiodl.
    // Kilkanascie kilobajtow na pozycje localStorage udzwignie.
    if (dataUrl.length <= MAX_CART_THUMB_CHARS) setThumbData(dataUrl);
    setThumbTick((n) => n + 1);
  }

  async function onPickVector(e) {
    const f = e.target.files?.[0];
    if (!f || !API) return;
    setVectorFile(f);
    setVectorToken(null);
    setVectorBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("lang", lang);
      fd.append("kind", "attachment");
      const resp = await fetch(`${API}/api/uploads`, { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) {
        setError({ message: data.error, code: data.code });
        setVectorFile(null);
        return;
      }
      setVectorToken(data.uploadToken);
    } catch {
      setError({ message: u.uploadFailed });
      setVectorFile(null);
    } finally {
      setVectorBusy(false);
    }
  }

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    resetFile();
    setFile(f);
    setUploading(true);
    setError(null);

    // Podglad rysujemy z wlasnego odczytu, zeby model pojawil sie od razu,
    // nie czekajac na przeslanie kilkunastu megabajtow. Cena i tak przyjdzie
    // z serwera, wiec ten odczyt niczego nie rozstrzyga.
    import("../../pricing/mesh.js")
      .then(async ({ parseMeshAsync }) => {
        // STEP idzie przez jadro CAD, wiec odczyt jest asynchroniczny.
        const parsed = await parseMeshAsync(await f.arrayBuffer(), f.name);
        setTriangles(parsed.triangles);
      })
      .catch(() => setTriangles(null));

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
        resetFile();
        return;
      }
      setUploadToken(data.uploadToken);
      setGeometry(data.geometry);
    } catch {
      setError({ message: u.uploadFailed });
      resetFile();
    } finally {
      setUploading(false);
    }
  }

  function addToCart() {
    if (!price || !ready) return;
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
      // Zrzut modelu zamiast zdjecia katalogowego, zeby w koszyku bylo
      // widac wlasny model, a nie ikone uslugi.
      description: description.trim() || null,
      attachmentToken: vectorToken,
      attachmentName: vectorFile?.name || null,
      thumbData,
      thumbUrl: hasThumb ? `${API}/api/uploads/${uploadToken}/thumb` : null,
      needsFile: Boolean(file),
      // Plik lezy juz na Dysku, wiec pozycja przezyje odswiezenie strony.
      fileRetained: Boolean(uploadToken),
      unitGrosze: price.unitGrosze,
      packagingId: isDigital ? null : packagingId,
      packagingGrosze: packGrosze,
      withdrawal: isDigital ? "digital" : "made_to_order",
      personalization: engraving.trim() || null,
      packagingText: packEngraving.trim() || null,
      packagingTextBack: lidBackText.trim() || null,
      qty: effectiveQty,
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
            onClear={resetFile}
            accent={accent}
            lang={lang}
            accept={ACCEPT_MESH}
          >
            {triangles?.length > 0 && (
              <Suspense fallback={<div className="h-[220px] rounded-lg bg-white/[0.02]" />}>
                <STLViewer triangles={triangles} onSnapshot={onSnapshot} />
              </Suspense>
            )}
            {geometry && <p className="text-neutral-600 text-[10px] mt-2 leading-relaxed">{u.unitsNote}</p>}
          </FileDrop>
          {!file && <p className="text-neutral-600 text-[11px] -mt-4 mb-6">{u.fileOptional}</p>}
        </>
      )}

      {service.acceptsVector && (
        <>
          <FileDrop
            label={u.vector}
            hint={u.vectorHint}
            file={vectorFile}
            busy={vectorBusy}
            onPick={onPickVector}
            onClear={() => { setVectorFile(null); setVectorToken(null); }}
            accent={accent}
            lang={lang}
            accept={ACCEPT_VECTOR}
          />
          <p className="text-neutral-600 text-[11px] -mt-4 mb-6 leading-relaxed">{u.vectorNote}</p>
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

      {service.requiresDescription && (
        <JobDescription
          label={u.describeLabel}
          hint={u.describeHint}
          value={description}
          onChange={setDescription}
          minLength={20}
          accent={accent}
          image={refImage}
          imageLabel={u.addImage}
          onPickImage={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setRefImage(f);
            onPickVector({ target: { files: [f] } });
          }}
          onClearImage={() => { setRefImage(null); setVectorToken(null); }}
          lang={lang}
        />
      )}

      {/* Opakowanie, tylko dla rzeczy, ktore realnie wysylamy */}
      {!isDigital && (
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
      )}

      {/* Grawer na wyrobie. Niezalezny od graweru na pudelku, bo jedno
          zamowienie moze miec oba. */}
      {wantsEngraving && (
        <PersonalizationField
          label={u.engravingLabel}
          value={engraving}
          onChange={setEngraving}
          maxLength={ENGRAVING_LIMITS.jewelry}
          placeholder={u.engravingPlaceholder}
          hint={u.engravingHint}
          overLimitNote={u.engravingOver}
          accent={accent}
        />
      )}

      {pack?.personalizable && (
        <>
          <PersonalizationField
            label={t(pack.personalizationLabel, lang)}
            value={packEngraving}
            onChange={setPackEngraving}
            maxLength={packLimit}
            placeholder={u.engravingPlaceholder}
            hint={u.engravingHint}
            overLimitNote={u.engravingOver}
            accent={accent}
          />
          <PersonalizationField
            label={t(pack.secondaryLabel, lang) || u.lidBack}
            value={lidBackText}
            onChange={setLidBackText}
            maxLength={packLimit}
            overLimitNote={u.engravingOver}
            accent={accent}
          />
        </>
      )}

      {showQtyStepper && (
      <QtyStepper
        label={bounds.min > 1 ? `${u.qty} (${u.tierRange} ${bounds.min}-${bounds.max})` : u.qty}
        value={effectiveQty}
        onChange={setQty}
        min={bounds.min}
        max={bounds.max}
        accent={accent}
      />
      )}

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
            {/* Przy nakladzie wieksszym niz jedna sztuka wiodaca kwota jest ta,
                ktora klient realnie zaplaci, a cena jednostkowa schodzi pod nia. */}
            <div className="flex items-end justify-between mb-1">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  {effectiveQty > 1 ? `${u.total} (${effectiveQty} ${u.pcs})` : u.price}
                </div>
                <div className="text-2xl font-extrabold text-white">{money(lineTotal)}</div>
              </div>
              {effectiveQty > 1 && (
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500">{u.price}</div>
                  <div className={`text-lg font-bold ${accent === "amber" ? "text-amber-300" : "text-blue-300"}`}>
                    {money(unitTotal)} <span className="text-[11px] font-normal text-neutral-500">{u.perPc}</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-neutral-600 text-[11px] mb-3">{u.priceNote}</p>

            {/* Ta sama kalkulacja co w kalkulatorze. Klient ma widziec, z czego
                sklada sie kwota, w obu miejscach tak samo. */}
            {price.breakdown?.length > 0 && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowBreakdown((v) => !v)}
                  className="w-full text-center py-2 rounded-lg border border-white/10 bg-white/[0.02]
                             text-neutral-400 hover:text-white hover:border-white/20 text-[11px] transition-colors"
                >
                  {showBreakdown ? `\u25B2 ${u.hideDetails}` : `\u25BC ${u.showDetails}`}
                </button>
                {showBreakdown && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1.5 text-[11px]">
                    {price.breakdown.map((row, i) => (
                      <div key={i} className={`flex justify-between gap-4 ${row.bold ? "font-semibold text-white" : "text-neutral-400"}`}>
                        <span>{row.label}</span>
                        <span className="tabular-nums flex-shrink-0">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!ready && !overLimit && !needsHumanQuote && (
              <p className="text-amber-400/80 text-[11px] mb-3 leading-relaxed">
                {!descriptionOk ? u.describeWhy : !artworkOk ? u.vectorNote : u.missingEngraving}
              </p>
            )}

            {needsHumanQuote && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.05] p-4 mb-3">
                <p className="text-amber-300/90 text-[11px] leading-relaxed mb-2">
                  {gateComplex ? u.gateComplex : u.gateHandmade}
                </p>
                <Link to="/contact/" className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs">
                  {u.toQuote} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {overLimit && (
              <Link
                to="/contact/"
                className="mb-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm
                           border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-colors"
              >
                {u.toQuote} <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {!needsHumanQuote && (
            <button
              type="button"
              onClick={addToCart}
              disabled={!ready}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                !ready
                  ? "bg-white/5 text-neutral-500 cursor-not-allowed"
                  : added
                    ? "bg-emerald-500 text-white"
                    : accent === "amber"
                      ? "bg-amber-500 hover:bg-amber-400 text-neutral-900"
                      : "bg-blue-500 hover:bg-blue-400 text-white"
              }`}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? u.added : !ready ? (!descriptionOk ? u.missingDescription : !artworkOk ? u.missingArtwork : u.missingEngraving) : u.addToCart}
            </button>
            )}

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
