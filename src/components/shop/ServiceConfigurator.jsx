// ============================================================
// KONFIGURATOR USLUGI, osadzony na karcie uslugi
// ============================================================
// Klient konfiguruje i dodaje do koszyka bez opuszczania strony. Kazde
// przejscie na inna strone to okazja do rezygnacji, a on jest juz zdecydowany.
//
// Cena pochodzi wylacznie z /api/price. Ten komponent jej nie liczy,
// tylko pokazuje to, co odpowiedzial backend.

import { useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from "react";
import { Link } from "../../i18n/nav.jsx";
import { claimHandoff } from "../../data/calcHandoff.js";
import { ShoppingCart, Check, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { useCart } from "../../cart/CartContext.jsx";
import { getService } from "../../data/orderCatalog.js";
import { PACKAGING, DEFAULT_PACKAGING, getPackaging, ENGRAVING_LIMITS } from "../../pricing/packaging.js";
import { t, tierForQty, qtyForTier, qtyLimit, qtyOpenValue, QUANTITY_TIERS } from "../../pricing/config.js";
import { TileGroup, ScaleControl, FileDrop, PersonalizationField, JobDescription, BlockedReasons, DeclaredSpec } from "./ConfigControls.jsx";
import PolaUslugi from "./PolaUslugi.jsx";
import { useMoney } from "../../shop/money.js";
import PrintabilityGate from "../calculators/PrintabilityGate.jsx";
import { nozzleFromPrecision } from "../../analysis/printability.js";
import { maxScaleForBBox } from "../../pricing/print3d.js";
import { maxCastingScaleForBBox } from "../../pricing/preciousMetalCasting.js";
import MaterialNotice from "../MaterialNotice.jsx";
import { SPARE_LABEL, spareOptionsFor, brakPodloza } from "../../data/laserSubstrate.js";

const API = import.meta.env.VITE_CHAT_API_URL;

// three.js wazy wiecej niz cala reszta strony sklepu, wiec sciagamy go
// dopiero, gdy ktos naprawde wgra model.
const STLViewer = lazy(() => import("../calculators/STLViewer.jsx"));

/** Rozszerzenia przyjmowane w polu pliku, zgodne z SUPPORTED_EXTENSIONS na serwerze */
const ACCEPT_MESH = ".stl,.obj,.3mf,.step,.stp";

/** Rysunki techniczne, ktore przyjmujemy jako zalacznik do zlecenia */
const ACCEPT_VECTOR = ".svg,.dxf,.ai,.pdf";

/** Gorna granica miniatury trzymanej w koszyku, zeby nie przepelnic localStorage */
const MAX_CART_THUMB_CHARS = 80_000;

const UI = {
  pl: {
    configure: "Skonfiguruj i dodaj do koszyka",
    file: "Twój plik",
    fileHint: "Kliknij lub przeciągnij model: STL, OBJ, 3MF, STEP lub STP",
    unitsNote: "Pliki STL i OBJ nie zapisują jednostki. Przyjmujemy milimetry, sprawdź wymiary powyżej.",
    vector: "Projekt do wykonania",
    vectorHint: "Kliknij lub przeciągnij plik SVG, DXF, AI lub PDF",
    vectorNote: "Rysunek nie zmienia ceny, wyznacza ją wybrane pole grawerowania. Trafia do warsztatu razem z zamówieniem.",
    describeLabel: "Opisz, co mamy wykonać",
    describeHint: "np. pierścionek zaręczynowy, szyna 2,5 mm, matowa powierzchnia, grawer wewnątrz, rozmiar 15",
    describeHintStudio: "np. znak z logo 15x10 cm w sklejce 3 mm, projekt gotowy, termin za 2 tygodnie",
    describeWhy: "Cena jest policzona, ale z samych parametrów nie wynika, jak przedmiot ma wyglądać. Bez opisu nie przyjmiemy zlecenia.",
    addImage: "Dołącz zdjęcie lub szkic (opcjonalnie)",
    missingDescription: "Uzupełnij opis, żeby dodać do koszyka",
    needBasis: "Podstawa kwoty wiążącej",
    needBasisHint: "Wgraj plik albo podaj wymiary powyżej. Bez pomiaru możemy podać wyłącznie szacunek.",
    missingBasis: "Podaj wymiary, żeby dodać do koszyka",
    estimateNote: "To jest wycena szacunkowa, nie oferta. Podlega weryfikacji przez AEJaCA i dedykowanej ofercie. Podaj wymiary albo wgraj plik, a podamy kwotę wiążącą.",
    missingArtwork: "Wgraj projekt, żeby dodać do koszyka",
    engravingLabel: "Treść graweru",
    engravingPlaceholder: "np. A + M, 12.06.2026",
    engravingOver: "Dłuższy grawer wyceniamy indywidualnie: to inne ustawienia lasera i inna kompozycja. Napisz do nas, odpowiemy w 24 godziny.",
    lidBack: "Treść po wewnętrznej stronie wieka (opcjonalnie)",
    missingEngraving: "Wpisz treść graweru",
    blockedTitle: "Zanim dodasz do koszyka",
    needDescription: "Opis zlecenia",
    needDescriptionHint: "Wpisz co najmniej 20 znaków w polu \u201eOpisz, co mamy wykonać\u201d powyżej.",
    needArtwork: "Projekt do wykonania",
    needArtworkHint: "Wgraj plik SVG, DXF lub PDF w polu \u201eProjekt do wykonania\u201d powyżej albo opisz zlecenie.",
    needSubstrate: "Podłoże usługi",
    needSubstrateHint: "Wybierz, na czym pracujemy: na Twoim przedmiocie, na Twoim materiale czy na naszym.",
    needSpare: "Sztuka na próby",
    needSpareHint: "Przy materiale powierzonym potrzebujemy sztuki ponad zamówienie albo deklaracji, że przedmiot jest niepowtarzalny.",
    needMaterialNote: "Materiał do wykonania usługi",
    materialNoteLabel: "Na jakim materiale",
    materialNotePlaceholder: "Np. sklejka brzozowa 4 mm, akryl bezbarwny 3 mm",
    materialNoteHint: "Napisz konkretnie, z czego mamy wykonać. \u201eCoś z drewna\u201d znaczy wymianę maili, zanim cokolwiek zaczniemy.",
    needEngraving: "Treść graweru",
    needEngravingHint: "Grawer jest wybrany, więc wpisz, co ma zostać wygrawerowane.",
    toQuote: "Wyślij do wyceny",
    showDetails: "Pokaż szczegóły kalkulacji",
    hideDetails: "Ukryj szczegóły",
    gateComplex: "Kształt z ornamentem, ażurem albo formą rzeźbiarską wyceniamy indywidualnie. Nakład pracy przy takiej bryle nie wynika z masy ani z metody, więc kwota z automatu byłaby zgadywaniem.",
    gateHandmade: "Wykonanie ręczne wyceniamy indywidualnie. Wiążącą cenę podajemy przy odlewie, bo tam czas pracy jest powtarzalny.",
    gateCasting: "Wzorzec fizyczny, realizację od pomysłu oraz materiał powierzony wyceniamy po sprawdzeniu. Automatyczna cena jest dostępna dla przesłanego modelu 3D i kruszcu AEJaCA.",
    needCastingFile: "Wgraj model 3D, aby zmierzyć objętość, sprawdzić limit odlewni i policzyć cenę.",
    fileOptional: "Bez pliku wybierzesz rozmiar z listy poniżej",
    castingFileRequired: "Odlew wyceniamy z objętości modelu, więc plik 3D jest tu konieczny. Wgraj STL, OBJ, 3MF albo STEP, a kwota policzy się sama. Bez pliku wyślemy zapytanie do wyceny indywidualnej.",
    packaging: "Opakowanie",
    qty: "Liczba sztuk",
    price: "Cena",
    perPc: "za sztukę",
    pcs: "szt.",
    tierRange: "próg",
    total: "Razem",
    addToCart: "Dodaj do koszyka",
    printHold: "Potwierdź uwagi do modelu",
    added: "Dodano do koszyka",
    goToCart: "Przejdź do koszyka",
    calculating: "Liczę cenę",
    needsQuote: "Ta konfiguracja wymaga indywidualnej wyceny",
    needsQuoteCta: "Wyślij do wyceny",
    priceNote: "Cena wiążąca, obowiązuje 7 dni.",
    engravingHint: "Grawer wykonujemy dokładnie tak, jak wpiszesz. Sprawdź pisownię.",
    uploadFailed: "Nie udało się przyjąć pliku. Spróbuj ponownie albo napisz do nas.",
    parsingFile: "Analizuję model",
    printSize: "Wielkość wydruku",
    sendingFile: "Wysyłam plik do wyceny",
  },
  en: {
    configure: "Configure and add to cart",
    file: "Your file",
    fileHint: "Click or drag a model: STL, OBJ, 3MF, STEP or STP",
    unitsNote: "STL and OBJ carry no unit. We read them as millimetres, please check the dimensions above.",
    vector: "Your artwork",
    vectorHint: "Click or drag an SVG, DXF, AI or PDF file",
    vectorNote: "The drawing does not change the price, the selected engraving area does. It travels to the workshop with the order.",
    describeLabel: "Describe what we are to make",
    describeHint: "e.g. engagement ring, 2.5 mm band, matte finish, inside engraving, size 15",
    describeHintStudio: "e.g. logo sign 15x10 cm in 3 mm plywood, artwork ready, needed in 2 weeks",
    describeWhy: "The price is calculated, but the parameters alone do not say how the piece should look. Without a description we cannot accept the job.",
    addImage: "Attach a photo or sketch (optional)",
    missingDescription: "Add a description to put this in the cart",
    needBasis: "Basis for a binding amount",
    needBasisHint: "Upload a file or give the dimensions above. Without a measurement we can only give an estimate.",
    missingBasis: "Give the dimensions to add to the cart",
    estimateNote: "This is an estimate, not an offer. It is subject to verification by AEJaCA and a dedicated quotation. Give the dimensions or upload a file and we will state a binding amount.",
    missingArtwork: "Upload the artwork to put this in the cart",
    engravingLabel: "Engraving text",
    engravingPlaceholder: "e.g. A + M, 12.06.2026",
    engravingOver: "A longer engraving is quoted individually: different laser settings and a different layout. Write to us, we reply within 24 hours.",
    lidBack: "Text on the inside of the lid (optional)",
    missingEngraving: "Enter the engraving text",
    blockedTitle: "Before you add this to the cart",
    needDescription: "Job description",
    needDescriptionHint: "Type at least 20 characters in \u201cDescribe what we are to make\u201d above.",
    needArtwork: "Your artwork",
    needArtworkHint: "Upload an SVG, DXF or PDF in the artwork field above, or describe the job.",
    needSubstrate: "Service substrate",
    needSubstrateHint: "Choose what we work on: your own item, your own material, or ours.",
    needSpare: "Test piece",
    needSpareHint: "With supplied material we need one piece beyond the order, or a declaration that the item is one of a kind.",
    needMaterialNote: "Material for the job",
    materialNoteLabel: "Which material",
    materialNotePlaceholder: "E.g. 4 mm birch plywood, 3 mm clear acrylic",
    materialNoteHint: "Be specific. \u201eSomething wooden\u201d means an exchange of emails before anything starts.",
    needEngraving: "Engraving text",
    needEngravingHint: "You chose an engraving, so tell us what to engrave.",
    toQuote: "Request a quote",
    showDetails: "Show the breakdown",
    hideDetails: "Hide the breakdown",
    gateComplex: "An ornamented, openwork or sculptural shape is quoted individually. The work involved does not follow from mass or method, so an automatic price would be guesswork.",
    gateHandmade: "Hand fabrication is quoted individually. We commit to a price for casting, where the working time is repeatable.",
    gateCasting: "A physical pattern, an idea-only job and customer-supplied metal are quoted after inspection. Automatic pricing is available for an uploaded 3D model and AEJaCA metal.",
    needCastingFile: "Upload the 3D model so we can measure volume, check the casting limit and calculate the price.",
    fileOptional: "Without a file, pick a size from the list below",
    castingFileRequired: "A casting is priced from the model\u2019s volume, so a 3D file is required here. Upload STL, OBJ, 3MF or STEP and the amount appears by itself. Without a file we send the enquiry to an individual quote.",
    packaging: "Packaging",
    qty: "Quantity",
    price: "Price",
    perPc: "per piece",
    pcs: "pcs",
    tierRange: "tier",
    total: "Total",
    addToCart: "Add to cart",
    printHold: "Confirm the notes on the model",
    added: "Added to cart",
    goToCart: "Go to cart",
    calculating: "Calculating",
    needsQuote: "This configuration needs an individual quote",
    needsQuoteCta: "Request a quote",
    priceNote: "Binding price, valid for 7 days.",
    engravingHint: "We engrave exactly what you type. Please check the spelling.",
    uploadFailed: "We could not accept the file. Try again or write to us.",
    parsingFile: "Analysing the model",
    printSize: "Print size",
    sendingFile: "Sending the file for pricing",
  },
  de: {
    configure: "Konfigurieren und in den Warenkorb",
    file: "Ihre Datei",
    fileHint: "Modell klicken oder hierher ziehen: STL, OBJ, 3MF, STEP oder STP",
    unitsNote: "STL und OBJ speichern keine Einheit. Wir lesen Millimeter, bitte prüfen Sie die Maße oben.",
    vector: "Ihre Vorlage",
    vectorHint: "SVG-, DXF-, AI- oder PDF-Datei klicken oder hierher ziehen",
    vectorNote: "Die Zeichnung ändert den Preis nicht, das gewählte Gravurfeld bestimmt ihn. Sie geht mit der Bestellung in die Werkstatt.",
    describeLabel: "Beschreiben Sie, was wir anfertigen sollen",
    describeHint: "z. B. Verlobungsring, Schiene 2,5 mm, matt, Innengravur, Größe 15",
    describeHintStudio: "z. B. Logo-Schild 15x10 cm aus 3 mm Sperrholz, Vorlage fertig, benötigt in 2 Wochen",
    describeWhy: "Der Preis steht, aber aus den Parametern allein geht nicht hervor, wie das Stück aussehen soll. Ohne Beschreibung nehmen wir den Auftrag nicht an.",
    addImage: "Foto oder Skizze anhängen (optional)",
    missingDescription: "Beschreibung ergänzen, um in den Warenkorb zu legen",
    needBasis: "Grundlage fuer einen verbindlichen Betrag",
    needBasisHint: "Laden Sie eine Datei hoch oder geben Sie oben die Masse an. Ohne Messung koennen wir nur schaetzen.",
    missingBasis: "Masse angeben, um in den Warenkorb zu legen",
    estimateNote: "Dies ist eine Schaetzung, kein Angebot. Sie unterliegt der Pruefung durch AEJaCA und einem dedizierten Angebot. Geben Sie die Masse an oder laden Sie eine Datei hoch, dann nennen wir einen verbindlichen Betrag.",
    missingArtwork: "Vorlage hochladen, um in den Warenkorb zu legen",
    engravingLabel: "Gravurtext",
    engravingPlaceholder: "z. B. A + M, 12.06.2026",
    engravingOver: "Eine längere Gravur kalkulieren wir individuell: andere Lasereinstellungen, andere Komposition. Schreiben Sie uns, wir antworten binnen 24 Stunden.",
    lidBack: "Text auf der Deckelinnenseite (optional)",
    missingEngraving: "Gravurtext eingeben",
    blockedTitle: "Bevor Sie in den Warenkorb legen",
    needDescription: "Auftragsbeschreibung",
    needDescriptionHint: "Mindestens 20 Zeichen im Feld \u201eBeschreiben Sie, was wir anfertigen sollen\u201c oben.",
    needArtwork: "Ihre Vorlage",
    needArtworkHint: "Laden Sie oben eine SVG-, DXF- oder PDF-Datei hoch oder beschreiben Sie den Auftrag.",
    needSubstrate: "Untergrund der Leistung",
    needSubstrateHint: "Wählen Sie, worauf wir arbeiten: auf Ihrem Objekt, auf Ihrem Material oder auf unserem.",
    needSpare: "Probestück",
    needSpareHint: "Bei beigestelltem Material brauchen wir ein Stück ueber die Bestellung hinaus oder die Erklaerung, dass das Objekt einzigartig ist.",
    needMaterialNote: "Material für den Auftrag",
    materialNoteLabel: "Welches Material",
    materialNotePlaceholder: "Z. B. Birkensperrholz 4 mm, Acryl klar 3 mm",
    materialNoteHint: "Bitte konkret. \u201eIrgendwas aus Holz\u201d bedeutet einen Mailwechsel, bevor wir anfangen.",
    needEngraving: "Gravurtext",
    needEngravingHint: "Sie haben eine Gravur gewählt, bitte geben Sie den Text an.",
    toQuote: "Angebot anfordern",
    showDetails: "Kalkulation anzeigen",
    hideDetails: "Kalkulation ausblenden",
    gateComplex: "Eine ornamentierte, durchbrochene oder skulpturale Form kalkulieren wir individuell. Der Aufwand ergibt sich weder aus Masse noch aus Methode, ein automatischer Preis wäre geraten.",
    gateHandmade: "Handanfertigung kalkulieren wir individuell. Verbindlich wird der Preis beim Guss, wo die Arbeitszeit reproduzierbar ist.",
    gateCasting: "Ein physisches Modell, eine Umsetzung nur nach Idee und beigestelltes Metall kalkulieren wir nach Prüfung. Automatische Preise gelten für ein hochgeladenes 3D-Modell mit AEJaCA-Metall.",
    needCastingFile: "3D-Modell hochladen, damit Volumen, Gussgrenze und Preis geprüft werden können.",
    fileOptional: "Ohne Datei wählen Sie unten eine Größe",
    castingFileRequired: "Ein Guss wird aus dem Modellvolumen berechnet, eine 3D-Datei ist hier also erforderlich. Laden Sie STL, OBJ, 3MF oder STEP hoch, dann erscheint der Betrag von selbst. Ohne Datei geht die Anfrage in ein individuelles Angebot.",
    packaging: "Verpackung",
    qty: "Stückzahl",
    price: "Preis",
    perPc: "pro Stück",
    pcs: "Stk.",
    tierRange: "Stufe",
    total: "Gesamt",
    addToCart: "In den Warenkorb",
    printHold: "Hinweise zum Modell bestätigen",
    added: "In den Warenkorb gelegt",
    goToCart: "Zum Warenkorb",
    calculating: "Berechne",
    needsQuote: "Diese Konfiguration erfordert ein individuelles Angebot",
    needsQuoteCta: "Angebot anfordern",
    priceNote: "Verbindlicher Preis, 7 Tage gültig.",
    engravingHint: "Wir gravieren genau das, was Sie eingeben. Bitte Schreibweise prüfen.",
    uploadFailed: "Die Datei konnte nicht angenommen werden. Bitte erneut versuchen oder uns schreiben.",
    parsingFile: "Modell wird analysiert",
    printSize: "Druckgroesse",
    sendingFile: "Datei wird zur Kalkulation gesendet",
  },
};


/** Pola, ktore lepiej czytaja sie jako suwak niz jako kafelki */

export default function ServiceConfigurator({ card, lang, accent = "blue", onPriceChange }) {
  const { money } = useMoney();
  const u = UI[lang] || UI.en;
  const service = getService(card.service);
  const cart = useCart();

  const [params, setParams] = useState(() => ({ ...(service?.defaults || {}) }));
  const [file, setFile] = useState(null);
  const [uploadToken, setUploadToken] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Odczyt lokalny i wysylka to dwa rozne oczekiwania, o roznej dlugosci.
  const [parsing, setParsing] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [geometry, setGeometry] = useState(null);
  // Skala wydruku wzgledem oryginalu. Jeden oznacza "tak, jak w pliku", i to
  // jest domyslna odpowiedz: model niesie swoje wymiary, wiec nie ma powodu
  // pytac klienta o rozmiar, ktory juz podal, wgrywajac plik.
  const [scale, setScale] = useState(1);
  // PODSTAWA KWOTY WIAZACEJ, ta sama regula co w kalkulatorach i w kasie.
  const [binding, setBinding] = useState(true);
  const [missing, setMissing] = useState([]);
  const [declared, setDeclared] = useState({});
  const [triangles, setTriangles] = useState(null);
  const [printability, setPrintability] = useState(null);
  const [hasThumb, setHasThumb] = useState(false);
  const [thumbData, setThumbData] = useState(null);
  const [vectorFile, setVectorFile] = useState(null);
  const [vectorToken, setVectorToken] = useState(null);
  const [vectorBusy, setVectorBusy] = useState(false);
  // Zdjecie referencyjne z opisu ma wlasny token, osobny od pliku wektorowego.
  // Uslugi laserowe wymagaja teraz obu naraz, wspolny token kasowal projekt.
  const [refToken, setRefToken] = useState(null);
  const [refBusy, setRefBusy] = useState(false);
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

  // Do wyceny ida WYLACZNIE komplety. Dwa wymiary z trzech to nadal brak
  // podstawy, a wyslane w polowie kazalyby serwerowi liczyc z niepelnej bryly.
  const podstawaZReki = useMemo(() => {
    const out = {};
    const d = declared.declaredMm;
    if (d && d.x > 0 && d.y > 0 && d.z > 0) out.declaredMm = { x: d.x, y: d.y, z: d.z };
    const f = declared.declaredFieldMm;
    if (f && f.w > 0 && f.h > 0) out.declaredFieldMm = { w: f.w, h: f.h };
    if (declared.volumeMl > 0) out.volumeMl = declared.volumeMl;
    return out;
  }, [declared]);

  const fetchPrice = useCallback(async () => {
    if (!service || !API) return;
    const mine = ++reqId.current;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("calculator", service.calculator);
      body.append("lang", lang);
      body.append("params", JSON.stringify({ ...params, ...(service.fixed || {}), ...podstawaZReki }));
      // Plik poszedl juz raz do /api/uploads, tutaj wystarczy identyfikator.
      if (uploadToken) body.append("uploadToken", uploadToken);
      if (scale !== 1) body.append("scale", String(scale));

      const resp = await fetch(`${API}/api/price`, { method: "POST", body });
      const data = await resp.json();
      if (mine !== reqId.current) return; // odpowiedz na starsze zapytanie, ignorujemy
      if (!resp.ok) {
        setPrice(null);
        setBinding(false);
        setMissing(Array.isArray(data.missing) ? data.missing : []);
        setError({ message: data.error, code: data.code });
        return;
      }
      setPrice(data.item);
      setBinding(data.binding !== false);
      setMissing(Array.isArray(data.missing) ? data.missing : []);
      if (data.geometry) setGeometry(data.geometry);
    } catch {
      if (mine === reqId.current) setError({ message: u.needsQuote });
    } finally {
      if (mine === reqId.current) setBusy(false);
    }
  }, [service, params, uploadToken, scale, lang, u.needsQuote, podstawaZReki]);

  // Cena odswieza sie po kazdej zmianie, z krotkim opoznieniem, zeby
  // przesuwanie suwaka nie wysylalo kilkunastu zapytan.
  useEffect(() => {
    const timer = setTimeout(fetchPrice, 350);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  useEffect(() => setAdded(false), [params, file, scale, packagingId, engraving, packEngraving, lidBackText, description, qty]);

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
  // LICZBA SZTUK JEST ZRODLEM PRAWDY, prog nakladu z niej wynika. Odwrotny
  // kierunek dawal formularz, ktory sam sobie zmienia liczbe: klient przesuwal
  // suwak na przedzial 2-10, a licznik siadal na dwoch sztukach, ktorych nikt
  // nie zamawial. Licznik stoi teraz zawsze, takze przy jednej sztuce.
  const tierField = tierKey ? service.fields.find((f) => f.key === tierKey) : null;
  const tiers = tierField?.options || QUANTITY_TIERS;
  const qtyMax = qtyLimit(tiers);
  const qtyOpen = qtyOpenValue(tiers);
  const effectiveQty = qty;

  // Jedno wejscie na zmiane liczby sztuk, zeby prog nie mogl sie z nia rozjechac.
  // Robimy to funkcja, a nie efektem: efekt ustawiajacy stan z innego stanu to
  // dodatkowy przebieg renderowania i klasa bledu, ktora ta karta juz raz miala.
  const changeQty = (n) => {
    setQty(n);
    if (tierKey) setParams((p) => ({ ...p, [tierKey]: tierForQty(n, tiers).id }));
  };
  const lineTotal = unitTotal * effectiveQty;

  // Nagłówek karty pokazuje bieżącą kwotę całej konfiguracji. Źródłem nadal
  // jest wyłącznie odpowiedź serwera; przekazujemy ją tylko o jeden poziom
  // wyżej razem z opakowaniem i liczbą sztuk.
  useEffect(() => {
    onPriceChange?.(price && !error
      ? { lineGrosze: lineTotal, unitGrosze: unitTotal, qty: effectiveQty }
      : null);
  }, [onPriceChange, price, error, lineTotal, unitTotal, effectiveQty]);

  // Pozycja w koszyku ma byc gotowa do kupienia, a nie do dopytania mailem.
  const descriptionOk = !service.requiresDescription || description.trim().length >= 20;
  // PLIK ALBO OPIS. Ta sama zasada co w kalkulatorze: opis wystarczajaco
  // dlugi, zeby serwer go przyjal, zastepuje brakujacy plik na etapie zakupu.
  // Reszte ustalamy przy realizacji, a klient nie odbija sie od koszyka.
  const artworkOk = !service.requiresVector
    || Boolean(vectorFile)
    || description.trim().length >= 20;

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
  const gateCasting = service.calculator === "jewelry_casting"
    && (params.variantId !== "model_3d" || params.materialSourceId !== "aejaca");
  const castingFileMissing = service.calculator === "jewelry_casting"
    && params.variantId === "model_3d" && !uploadToken;
  const needsHumanQuote = gateComplex || gateHandmade || gateCasting;

  const overLimit = jewelryOver || packOver;
  // Pokwitowanie ujawnionej wady pliku wstrzymuje dodanie do koszyka tak samo,
  // jak brakujacy opis albo brakujacy rysunek: cena jest policzona, brakuje
  // tylko potwierdzenia od klienta.
  const printHold = Boolean(printability?.blocked && !printability?.accepted);
  // PODLOZE USLUGI LASEROWEJ. Ta sama regula co w kalkulatorze i na serwerze,
  // liczona tym samym kodem: karta uslugi w sklepie to druga rownolegla droga
  // do tego samego zlecenia, a straznik postawiony na jednej sciezce nie
  // pilnuje pozostalych.
  const substrateGap = brakPodloza({ calculator: service.calculator, params });

  // Plik odrzucony przez serwer zostaje w polu, zeby bylo widac, o ktory chodzi,
  // ale zamowic go nie mozna: wycena poszlaby wtedy z samego rozmiaru, a klient
  // bylby przekonany, ze kupuje wydruk swojego modelu.
  const ready = descriptionOk && artworkOk && jewelryEngravingOk && packEngravingOk && binding
    && !substrateGap && !needsHumanQuote && !castingFileMissing && !printHold && !fileError;

  // Zmiana podloza czysci pola, ktore od niego zaleza. Bez tego po przelaczeniu
  // z przedmiotu klienta na nasz material zostawalby wybor sposobu proby,
  // ktory przy naszym materiale nie ma sensu, a serwer i tak by go odrzucil.
  const setParam = (key, val) => {
    // Suwak nakladu mowi "chce co najmniej tyle", wiec ustawia licznik na dolna
    // granice przedzialu. To jedyny kierunek, w ktorym prog dotyka liczby.
    if (key === tierKey) setQty(qtyForTier(val, tiers));
    setParams((p) => (
      key === "podloze" ? { ...p, podloze: val, spare: "", materialNote: "" } : { ...p, [key]: val }
    ));
  };

  // ODBIOR MODELU PRZYNIESIONEGO Z KALKULATORA. Klient, ktory z kalkulatora
  // przeszedl do sklepu, wgral juz plik i ustawil wielkosc; kazanie mu
  // powtorzyc to na karcie uslugi jest ta sama kara, co przy zmianie trybu.
  // Odbior jest jednorazowy i tylko dla pasujacego rodzaju geometrii, wiec
  // plik nie doklei sie do przypadkowej uslugi ogladanej kwadrans pozniej.
  useEffect(() => {
    if (service?.acceptsFile) {
      const paczka = claimHandoff("mesh");
      if (paczka?.file) { przyjmijPlik(paczka.file, paczka.scale); return; }
    }
    if (service?.acceptsVector) {
      const paczka = claimHandoff("vector");
      if (paczka?.file) przyjmijWektor(paczka.file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFile() {
    setFile(null);
    setGeometry(null);
    setTriangles(null);
    setPrice(null);
    setUploadToken(null);
    setHasThumb(false);
    setThumbData(null);
    setFileError(null);
    setScale(1);
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
    if (!f) return;
    await przyjmijWektor(f);
  }

  /** Ta sama droga dla rysunku wybranego tutaj i przeniesionego z kalkulatora. */
  async function przyjmijWektor(f) {
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

  /** Zdjecie lub szkic z opisu, ten sam kanal co plik wektorowy, wlasny token. */
  async function onPickRef(e) {
    const f = e.target.files?.[0];
    if (!f || !API) return;
    setRefImage(f);
    setRefToken(null);
    setRefBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("lang", lang);
      // ZDJECIE, a nie projekt do wykonania. To sa dwa rozne rodzaje pliku
      // i serwer sprawdza je inaczej: projekt musi byc wektorem, zdjecie ma
      // byc zdjeciem. Obie sciezki wysylaly tu kiedys "attachment", wiec
      // zdjecie odbijalo sie od listy formatow wektorowych i znikalo klientowi
      // z pola ulamek sekundy po dodaniu.
      fd.append("kind", "reference");
      const resp = await fetch(`${API}/api/uploads`, { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) {
        setError({ message: data.error, code: data.code });
        setRefImage(null);
        return;
      }
      setRefToken(data.uploadToken);
    } catch {
      setError({ message: u.uploadFailed });
      setRefImage(null);
    } finally {
      setRefBusy(false);
    }
  }

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    await przyjmijPlik(f);
  }

  /**
   * Przyjecie modelu, niezaleznie od tego, czy klient wybral go tutaj, czy
   * przyniosl ze soba z kalkulatora. Jedna droga, wiec plik przeniesiony
   * przechodzi dokladnie te sama kontrole co wybrany na miejscu: ten sam
   * odczyt geometrii, ten sam token z serwera, te same komunikaty bledow.
   */
  async function przyjmijPlik(f, skala = null) {
    resetFile();
    setFile(f);
    setParsing(true);
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
      .catch(() => setTriangles(null))
      .finally(() => setParsing(false));

    try {
      // Wysylamy raz. Serwer liczy geometrie, zapisuje plik na Dysku
      // i oddaje identyfikator, ktory trafia do koszyka zamiast megabajtow.
      const fd = new FormData();
      fd.append("file", f);
      fd.append("lang", lang);
      const resp = await fetch(`${API}/api/uploads`, { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) {
        // Plik i podglad ZOSTAJA. Wyrzucenie ich razem z komunikatem znaczylo,
        // ze klient widzial znikajacy model i szukal powodu gdzie indziej.
        setFileError(data.error || u.uploadFailed);
        setUploadToken(null);
        setGeometry(null);
        setPrice(null);
        return;
      }
      setFileError(null);
      setUploadToken(data.uploadToken);
      setGeometry(data.geometry);
      // Skala idzie PO geometrii, bo `resetFile` sprowadza ja do jedynki,
      // a suwak wielkosci i tak pojawia sie dopiero z wymiarami z serwera.
      if (skala && skala > 0) setScale(skala);
    } catch {
      setFileError(u.uploadFailed);
      setUploadToken(null);
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
      params: { ...params, ...(service.fixed || {}), ...podstawaZReki, ...(printability ? { printability } : {}) },
      geometry,
      scale,
      fileName: file?.name || null,
      uploadToken,
      // Zrzut modelu zamiast zdjecia katalogowego, zeby w koszyku bylo
      // widac wlasny model, a nie ikone uslugi.
      description: description.trim() || null,
      attachmentToken: vectorToken || refToken,
      attachmentTokens: [vectorToken, refToken].filter(Boolean),
      attachmentName: vectorFile?.name || refImage?.name || null,
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

  // Granica skali wynika z pola roboczego maszyny. Ten sam kod liczy ja na
  // serwerze przy wystawianiu kwoty wiazacej, wiec suwak nie moze obiecac
  // wielkosci, ktora wycena odrzuci.
  const maxScale = geometry?.bbox
    ? service.calculator === "jewelry_casting"
      ? maxCastingScaleForBBox(geometry.bbox)
      : maxScaleForBBox(geometry.bbox, service.calculator)
    : null;
  const isJewelry = String(service.calculator || "").startsWith("jewelry");

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
            busy={parsing || uploading}
            busyLabel={parsing ? u.parsingFile : u.sendingFile}
            error={fileError}
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
            {geometry && <p className="text-neutral-600 text-xs mt-2 leading-relaxed">{u.unitsNote}</p>}
          </FileDrop>
          {/* Analiza tylko dla druku 3D. Przy grawerze albo odlewie te progi
              nic nie znacza, a ostrzezenie bez znaczenia uczy je ignorowac. */}
          {triangles?.length > 0 && (service.calculator === "print3d_fdm" || service.calculator === "print3d_msla") && (
            <PrintabilityGate
              triangles={triangles}
              tech={service.calculator === "print3d_msla" ? "msla" : "fdm"}
              nozzleId={nozzleFromPrecision(params.precisionId)}
              lang={lang}
              fileName={file?.name || null}
              scale={scale}
              onResult={setPrintability}
            />
          )}
          {/* WIELKOSC WYDRUKU. Pojawia sie dopiero, gdy serwer przyjal plik i
              odeslal jego wymiary: dopoki ich nie ma, nie ma czego skalowac
              ani z czego wyliczyc granicy pola roboczego. */}
          {geometry && maxScale != null && (
            <ScaleControl
              label={u.printSize}
              bbox={geometry.bbox}
              volumeCm3={geometry.volumeCm3}
              scale={scale}
              onChange={setScale}
              maxScale={maxScale}
              lang={lang}
              accent={accent}
              purpose={service.calculator === "jewelry_casting" ? "casting" : "print"}
            />
          )}
          {!file && service.calculator !== "jewelry_casting" && <p className="text-neutral-600 text-xs -mt-4 mb-6">{u.fileOptional}</p>}
          {/* Przy odlewie plik nie jest dodatkiem, tylko podstawa kwoty: masa
              kruszcu bierze sie z objetosci bryly. Mowimy to ZANIM klient
              zobaczy komunikat o brakujacych parametrach. */}
          {!file && service.calculator === "jewelry_casting" && (
            <p className="text-neutral-500 text-xs -mt-4 mb-6">{u.castingFileRequired}</p>
          )}
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
          <p className="text-neutral-600 text-xs -mt-4 mb-6 leading-relaxed">{u.vectorNote}</p>
        </>
      )}

      {/* Ta sama informacja o materiale co w kalkulatorze laserowym, bo klient
          moze kupic te sama usluge tu, bez przechodzenia przez kalkulator. */}
      {service.group === "laser" && <MaterialNotice lang={lang} className="mb-6" />}

      <PolaUslugi
        service={service}
        params={params}
        setParam={setParam}
        lang={lang}
        wyglad="sklep"
        accent={accent}
        uploadToken={uploadToken}
        tierKey={tierKey}
        qty={qty}
        onQty={changeQty}
        qtyMax={qtyMax}
        qtyOpen={qtyOpen}
        qtyLabel={u.qty}
      />

      {/* Sztuka na proby albo nazwa materialu, zaleznie od wybranego podloza.
          Pole `podloze` renderuje sie wyzej razem z reszta parametrow uslugi,
          bo siedzi w katalogu; te dwa zaleza od jego wartosci, wiec stoja tu. */}
      {spareOptionsFor(params.podloze).length > 0 && (
        <TileGroup
          label={t(SPARE_LABEL, lang)}
          options={spareOptionsFor(params.podloze)}
          value={params.spare || ""}
          onChange={(v) => setParams((p) => ({ ...p, spare: v }))}
          lang={lang}
          accent={accent}
          columns={2}
        />
      )}

      {params.podloze === "our_stock" && (
        <div className="mb-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{u.materialNoteLabel}</div>
          <input
            type="text"
            value={params.materialNote || ""}
            onChange={(e) => setParams((p) => ({ ...p, materialNote: e.target.value }))}
            placeholder={u.materialNotePlaceholder}
            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                       placeholder:text-neutral-600 focus:outline-none focus:border-blue-400/60"
          />
          <p className="text-neutral-500 text-xs mt-1.5">{u.materialNoteHint}</p>
        </div>
      )}

      {service.requiresDescription && (
        <JobDescription
          label={u.describeLabel}
          hint={isJewelry ? u.describeHint : u.describeHintStudio}
          value={description}
          onChange={setDescription}
          minLength={20}
          accent={accent}
          image={refImage}
          imageLabel={u.addImage}
          onPickImage={onPickRef}
          onClearImage={() => { setRefImage(null); setRefToken(null); }}
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
                <Link to={gateCasting ? "/quote/?service=precious_metal_casting" : "/contact/"} className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs">
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
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  {effectiveQty > 1 ? `${u.total} (${effectiveQty} ${u.pcs})` : u.price}
                </div>
                <div className="text-2xl font-extrabold text-white">{money(lineTotal)}</div>
              </div>
              {effectiveQty > 1 && (
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">{u.price}</div>
                  <div className={`text-lg font-bold ${accent === "amber" ? "text-amber-300" : "text-blue-300"}`}>
                    {money(unitTotal)} <span className="text-xs font-normal text-neutral-500">{u.perPc}</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-neutral-600 text-xs mb-3">{u.priceNote}</p>

            {/* Ta sama kalkulacja co w kalkulatorze. Klient ma widziec, z czego
                sklada sie kwota, w obu miejscach tak samo. */}
            {price.breakdown?.length > 0 && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowBreakdown((v) => !v)}
                  className="w-full text-center py-2 rounded-lg border border-white/10 bg-white/[0.02]
                             text-neutral-400 hover:text-white hover:border-white/20 text-xs transition-colors"
                >
                  {showBreakdown ? `\u25B2 ${u.hideDetails}` : `\u25BC ${u.showDetails}`}
                </button>
                {showBreakdown && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1.5 text-xs">
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

            {/* Najpierw droga, potem powod: formularz podstawy stoi nad lista
                przeszkod, zeby klient nie musial szukac, gdzie wpisac wymiary. */}
            {!binding && !needsHumanQuote && missing.length > 0 && (
              <>
                <DeclaredSpec
                  missing={missing}
                  value={declared}
                  onChange={setDeclared}
                  lang={lang}
                  accent={accent}
                />
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">{u.estimateNote}</p>
              </>
            )}

            {!ready && !overLimit && !needsHumanQuote && (
              <BlockedReasons
                title={u.blockedTitle}
                accent={accent}
                items={[
                  ...(!binding ? [{ ok: false, label: u.needBasis, hint: u.needBasisHint }] : []),
                  ...(service.requiresDescription
                    ? [{ ok: descriptionOk, label: u.needDescription, hint: u.needDescriptionHint }] : []),
                  ...(service.requiresVector
                    ? [{ ok: artworkOk, label: u.needArtwork, hint: u.needArtworkHint }] : []),
                  ...(castingFileMissing
                    ? [{ ok: false, label: u.file, hint: u.needCastingFile }] : []),
                ...(substrateGap === "substrate_required" ? [{ ok: false, label: u.needSubstrate, hint: u.needSubstrateHint }] : []),
                ...(substrateGap === "spare_required" ? [{ ok: false, label: u.needSpare, hint: u.needSpareHint }] : []),
                ...(substrateGap === "material_note_required" ? [{ ok: false, label: u.needMaterialNote, hint: u.materialNoteHint }] : []),
                  ...(wantsEngraving || pack?.personalizable
                    ? [{ ok: jewelryEngravingOk && packEngravingOk, label: u.needEngraving, hint: u.needEngravingHint }] : []),
                ]}
              />
            )}

            {needsHumanQuote && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.05] p-4 mb-3">
                <p className="text-amber-300/90 text-xs leading-relaxed mb-2">
                  {gateCasting ? u.gateCasting : gateComplex ? u.gateComplex : u.gateHandmade}
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
              {added ? u.added : !ready ? (printHold ? u.printHold : !binding ? u.missingBasis : !descriptionOk ? u.missingDescription : !artworkOk ? u.missingArtwork : u.missingEngraving) : u.addToCart}
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
