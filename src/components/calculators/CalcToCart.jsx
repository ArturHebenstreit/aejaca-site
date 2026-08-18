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

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Loader2, ArrowRight, Info } from "lucide-react";
import { useCart } from "../../cart/CartContext.jsx";
import { getServiceCard } from "../../data/serviceCatalog.js";
import { JobDescription, FileDrop, BlockedReasons } from "../shop/ConfigControls.jsx";
import { getService } from "../../data/orderCatalog.js";
import { ENGRAVING_LIMITS } from "../../pricing/packaging.js";
import { brakPodloza } from "../../data/laserSubstrate.js";
import { PersonalizationField } from "../shop/ConfigControls.jsx";
import SaveQuote from "./SaveQuote.jsx";
import { t } from "../../pricing/config.js";

const API = import.meta.env.VITE_CHAT_API_URL;

const STLViewer = lazy(() => import("./STLViewer.jsx"));

/** Gorna granica miniatury trzymanej w koszyku, zeby nie przepelnic localStorage */
const MAX_CART_THUMB_CHARS = 80_000;

/** Minimalna dlugosc opisu, ponizej ktorej zlecenie i tak trafiloby do dopytywania */
const MIN_DESCRIPTION = 20;

const UI = {
  pl: {
    binding: "Kwota wiążąca",
    addToCart: "Dodaj do koszyka",
    added: "Dodano do koszyka",
    goToCart: "Przejdź do koszyka",
    calculating: "Liczę kwotę wiążącą",
    note: "Kwota wiążąca, obowiązuje 7 dni. Kalkulacja powyżej pokazuje, z czego się składa.",
    unavailable: "Tej konfiguracji nie wycenimy automatycznie. Napisz do nas, odpowiemy w 24 godziny.",
    contact: "Wyślij do wyceny",
    uploading: "Przygotowuję plik",
    perPc: "za sztukę",
    pcs: "szt.",
    describeLabel: "Opisz, co mamy wykonać",
    describeHint: "np. pierścionek zaręczynowy, szyna 2,5 mm, matowa powierzchnia, grawer wewnątrz \"A+M 2026\", rozmiar 15",
    describeHintStudio: "np. znak z logo 15x10 cm w sklejce 3 mm, projekt gotowy, termin za 2 tygodnie",
    describeWhy: "Cena jest policzona, ale z samych parametrów nie wynika, jak przedmiot ma wyglądać. Bez opisu nie przyjmiemy zlecenia do realizacji.",
    addImage: "Dołącz zdjęcie lub szkic (opcjonalnie)",
    artworkLabel: "Projekt do wykonania",
    artworkHint: "Wgraj plik SVG, DXF lub PDF",
    artworkWhy: "Bez projektu nie wiemy, co wygrawerować ani wyciąć. Rozmiar pola wybrałeś wyżej, on decyduje o cenie.",
    missingDescription: "Uzupełnij opis, żeby dodać do koszyka",
    missingArtwork: "Wgraj projekt, żeby dodać do koszyka",
    missingSubstrate: "Uzupełnij podłoże, żeby dodać do koszyka",
    needSubstrate: "Podłoże usługi",
    needSubstrateHint: "Wybierz, na czym pracujemy, wyżej w kalkulatorze.",
    needSpare: "Sztuka na próby",
    needSpareHint: "Wybierz sposób próby przy podłożu klienta, wyżej w kalkulatorze.",
    needMaterialNote: "Materiał do wykonania usługi",
    needMaterialNoteHint: "Napisz, na jakim materiale mamy wykonać usługę, wyżej w kalkulatorze.",
    engravingLabel: "Treść graweru",
    engravingPlaceholder: "np. A + M, 12.06.2026",
    engravingHint: "Grawer wykonujemy dokładnie tak, jak wpiszesz. Sprawdź pisownię.",
    engravingOver: "Dłuższy grawer wyceniamy indywidualnie: to inne ustawienia lasera i inna kompozycja. Napisz do nas, odpowiemy w 24 godziny.",
    missingEngraving: "Wpisz treść graweru",
    blockedTitle: "Zanim dodasz do koszyka",
    holdLabel: "Potwierdź uwagi do modelu",
    needDescription: "Opis zlecenia",
    needDescriptionHint: "Wpisz co najmniej 20 znaków w polu opisu powyżej.",
    needArtwork: "Projekt do wykonania",
    needArtworkHint: "Wgraj plik SVG, DXF lub PDF albo opisz zlecenie w polu powyżej.",
    needEngraving: "Treść graweru",
    needEngravingHint: "Wybrałeś grawer, więc wpisz, co ma zostać wygrawerowane.",
    svgBlocked: "Wgrany plik wektorowy wyceniamy ręcznie, bo liczy się realna długość ścieżki. Usuń plik, żeby kupić po polu z listy, albo wyślij do wyceny.",
    manualBlocked: "Tę konfigurację wycenia człowiek: kamienie, sploty łańcuszków i metal powierzony przez klienta zależą od rzeczy, których nie widać w parametrach. Odpowiadamy w 24 godziny.",
  },
  en: {
    binding: "Binding price",
    addToCart: "Add to cart",
    added: "Added to cart",
    goToCart: "Go to cart",
    calculating: "Calculating the binding price",
    note: "Binding price, valid for 7 days. The breakdown above shows what it consists of.",
    unavailable: "We cannot price this configuration automatically. Write to us and we reply within 24 hours.",
    contact: "Request a quote",
    uploading: "Preparing the file",
    perPc: "per piece",
    pcs: "pcs",
    describeLabel: "Describe what we are to make",
    describeHint: "e.g. engagement ring, 2.5 mm band, matte finish, inside engraving \"A+M 2026\", size 15",
    describeHintStudio: "e.g. logo sign 15x10 cm in 3 mm plywood, artwork ready, needed in 2 weeks",
    describeWhy: "The price is calculated, but the parameters alone do not say how the piece should look. Without a description we cannot accept the job.",
    addImage: "Attach a photo or sketch (optional)",
    artworkLabel: "Your artwork",
    artworkHint: "Upload an SVG, DXF or PDF file",
    artworkWhy: "Without the artwork we do not know what to engrave or cut. You picked the area above, and that is what sets the price.",
    missingDescription: "Add a description to put this in the cart",
    missingArtwork: "Upload the artwork to put this in the cart",
    missingSubstrate: "Fill in the substrate to put this in the cart",
    needSubstrate: "Service substrate",
    needSubstrateHint: "Choose what we work on, above in the calculator.",
    needSpare: "Test piece",
    needSpareHint: "Choose how you provide a test piece, above in the calculator.",
    needMaterialNote: "Material for the job",
    needMaterialNoteHint: "Tell us which material we should use, above in the calculator.",
    engravingLabel: "Engraving text",
    engravingPlaceholder: "e.g. A + M, 12.06.2026",
    engravingHint: "We engrave exactly what you type. Please check the spelling.",
    engravingOver: "A longer engraving is quoted individually: different laser settings and a different layout. Write to us, we reply within 24 hours.",
    missingEngraving: "Enter the engraving text",
    blockedTitle: "Before you add this to the cart",
    holdLabel: "Confirm the notes on the model",
    needDescription: "Job description",
    needDescriptionHint: "Type at least 20 characters in the description above.",
    needArtwork: "Your artwork",
    needArtworkHint: "Upload an SVG, DXF or PDF file, or describe the job in the field above.",
    needEngraving: "Engraving text",
    needEngravingHint: "You chose an engraving, so tell us what to engrave.",
    svgBlocked: "An uploaded vector file is quoted by hand, because the real path length decides the price. Remove the file to buy by the listed area, or request a quote.",
    manualBlocked: "This configuration is quoted by a person: stones, chain weaves and customer-supplied metal depend on things the parameters do not capture. We reply within 24 hours.",
  },
  de: {
    binding: "Verbindlicher Preis",
    addToCart: "In den Warenkorb",
    added: "In den Warenkorb gelegt",
    goToCart: "Zum Warenkorb",
    calculating: "Verbindlicher Preis wird berechnet",
    note: "Verbindlicher Preis, 7 Tage gültig. Die Aufstellung oben zeigt, woraus er besteht.",
    unavailable: "Diese Konfiguration können wir nicht automatisch bepreisen. Schreiben Sie uns, wir antworten binnen 24 Stunden.",
    contact: "Angebot anfordern",
    uploading: "Datei wird vorbereitet",
    perPc: "pro Stück",
    pcs: "Stk.",
    describeLabel: "Beschreiben Sie, was wir anfertigen sollen",
    describeHint: "z. B. Verlobungsring, Schiene 2,5 mm, matt, Innengravur \"A+M 2026\", Größe 15",
    describeHintStudio: "z. B. Logo-Schild 15x10 cm aus 3 mm Sperrholz, Vorlage fertig, benötigt in 2 Wochen",
    describeWhy: "Der Preis steht, aber aus den Parametern allein geht nicht hervor, wie das Stück aussehen soll. Ohne Beschreibung nehmen wir den Auftrag nicht an.",
    addImage: "Foto oder Skizze anhängen (optional)",
    artworkLabel: "Ihre Vorlage",
    artworkHint: "SVG-, DXF- oder PDF-Datei hochladen",
    artworkWhy: "Ohne Vorlage wissen wir nicht, was graviert oder geschnitten werden soll. Die Fläche haben Sie oben gewählt, sie bestimmt den Preis.",
    missingDescription: "Beschreibung ergänzen, um in den Warenkorb zu legen",
    missingArtwork: "Vorlage hochladen, um in den Warenkorb zu legen",
    missingSubstrate: "Untergrund angeben, um in den Warenkorb zu legen",
    needSubstrate: "Untergrund der Leistung",
    needSubstrateHint: "Wählen Sie oben im Kalkulator, worauf wir arbeiten.",
    needSpare: "Probestück",
    needSpareHint: "Wählen Sie oben im Kalkulator, wie Sie ein Probestück bereitstellen.",
    needMaterialNote: "Material für den Auftrag",
    needMaterialNoteHint: "Sagen Sie uns oben im Kalkulator, welches Material wir verwenden sollen.",
    engravingLabel: "Gravurtext",
    engravingPlaceholder: "z. B. A + M, 12.06.2026",
    engravingHint: "Wir gravieren genau das, was Sie eingeben. Bitte Schreibweise prüfen.",
    engravingOver: "Eine längere Gravur kalkulieren wir individuell: andere Lasereinstellungen, andere Komposition. Schreiben Sie uns, wir antworten binnen 24 Stunden.",
    missingEngraving: "Gravurtext eingeben",
    blockedTitle: "Bevor Sie in den Warenkorb legen",
    holdLabel: "Hinweise zum Modell bestätigen",
    needDescription: "Auftragsbeschreibung",
    needDescriptionHint: "Mindestens 20 Zeichen im Beschreibungsfeld oben.",
    needArtwork: "Ihre Vorlage",
    needArtworkHint: "Laden Sie eine SVG-, DXF- oder PDF-Datei hoch oder beschreiben Sie den Auftrag oben.",
    needEngraving: "Gravurtext",
    needEngravingHint: "Sie haben eine Gravur gewählt, bitte geben Sie den Text an.",
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
/**
 * @param {number[][][]} [props.triangles] siatka wgranego modelu, jesli kalkulator
 *        juz ja odczytal. Sluzy wylacznie do zrobienia miniatury dla koszyka.
 */
export default function CalcToCart({ calculator, serviceId, params, file = null, triangles = null, scale = 1, lang, accent = "blue", blocked = false, blockedReason = "vector", onBinding = null, hold = false }) {
  const u = UI[lang] || UI.en;
  const cart = useCart();
  const card = getServiceCard(serviceId);
  // Jedno zrodlo prawdy: te same wymagania obowiazuja w sklepie i w kalkulatorze.
  const svc = getService(card?.service || serviceId);
  const requiresDescription = Boolean(svc?.requiresDescription);
  const requiresArtwork = Boolean(svc?.requiresVector);
  const isJewelry = String(calculator || "").startsWith("jewelry");

  const [price, setPrice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  const [description, setDescription] = useState("");
  const [engraving, setEngraving] = useState("");
  const [refImage, setRefImage] = useState(null);
  const [artworkFile, setArtworkFile] = useState(null);
  const [artworkToken, setArtworkToken] = useState(null);
  // Zdjecie referencyjne z opisu ma wlasny token. Kiedys laser wymagal tylko
  // opisu, a biezuteria tylko projektu, wiec dzielily jeden token bez szkody.
  // Teraz laser wymaga obu naraz, wiec wspolny token kasowal plik projektu.
  const [refToken, setRefToken] = useState(null);
  const [attachBusy, setAttachBusy] = useState(false);
  const [thumbData, setThumbData] = useState(null);
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

  /** Zalaczniki nie wplywaja na cene, ida na Dysk jako material do wykonania. */
  async function uploadAttachment(f, setToken) {
    if (!f || !API) return;
    setAttachBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("lang", lang);
      fd.append("kind", "attachment");
      const resp = await fetch(`${API}/api/uploads`, { method: "POST", body: fd });
      const data = await resp.json();
      if (resp.ok) setToken(data.uploadToken);
    } catch {
      // Brak zalacznika na Dysku nie moze zablokowac zakupu, mamy jeszcze opis.
    } finally {
      setAttachBusy(false);
    }
  }

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

  // Kalkulator musi wiedziec, czy udalo sie podac kwote wiazaca. Jesli tak,
  // widelki znikaja: dwie rozne liczby obok siebie podwazaja te wiazaca.
  useEffect(() => {
    if (!onBinding) return;
    onBinding(blocked ? null : (price?.unitGrosze ?? null));
  }, [onBinding, blocked, price]);

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

  // Pozycja ma trafic do koszyka gotowa do kupienia, a nie do dopytania mailem.
  const descriptionOk = !requiresDescription || description.trim().length >= MIN_DESCRIPTION;
  // PLIK ALBO OPIS, nie koniecznie jedno i drugie.
  //
  // Wczesniej brak pliku wektorowego blokowal koszyk nawet wtedy, gdy klient
  // opisal zlecenie wlasnymi slowami. To jest odwrotnosc wady, ktora
  // naprawialismy rano: tam plik szedl bez opisu i nie bylo wiadomo, co z nim
  // zrobic. Tutaj opis JEST, wiec zlecenie da sie przyjac i dogadac reszte,
  // a odsylanie klienta po plik na tym etapie kosztuje sprzedaz.
  //
  // Opis liczy sie tylko wtedy, gdy naprawde cos mowi, czyli po przekroczeniu
  // tego samego progu, ktorego pilnuje serwer. Krotkie "grawer" nie zastapi
  // ani pliku, ani opisu.
  const artworkOk = !requiresArtwork
    || Boolean(artworkFile)
    || description.trim().length >= MIN_DESCRIPTION;

  // Grawer wybrany w kalkulatorze musi miec tresc, a zbyt dlugi tekst to juz
  // inna robota niz ta, ktora wlasnie wyceniono.
  // Bramka zlozonosci dotyczy wylacznie bizuterii. Projekt 3D uzywa tego
  // samego klucza, ale tam zlozonosc jest progiem cenowym, nie blokada.
  const gatedShape = calculator === "jewelry_new"
    && Boolean(params?.complexityId && params.complexityId !== "simple");
  const wantsEngraving = Boolean(params?.engravingId && params.engravingId !== "none");
  const engravingOver = wantsEngraving && engraving.trim().length > ENGRAVING_LIMITS.jewelry;
  const engravingOk = !wantsEngraving || (engraving.trim().length >= 1 && !engravingOver);

  // Zabezpieczenie wspolne dla wszystkich kalkulatorow: gdyby ktorys
  // zapomnial wlasnego sprawdzenia podloza, ta sama regula z laserSubstrate.js
  // i tak zatrzyma dodanie do koszyka.
  const substrateGap = brakPodloza({ calculator, params });
  const substrateOk = !substrateGap;

  // `hold` wstrzymuje dodanie do koszyka, dopoki klient nie pokwituje
  // ujawnionej wady swojego pliku. Rozni sie od `blocked`: tam ceny nie ma
  // wcale, tu cena jest policzona i widoczna, brakuje tylko potwierdzenia.
  const ready = descriptionOk && artworkOk && engravingOk && substrateOk && !gatedShape && !hold;

  const qty = price?.qty || 1;
  const lineGrosze = (price?.unitGrosze || 0) * qty;

  function addToCart() {
    if (!price || !ready) return;
    cart.add({
      kind: "service",
      calculator,
      serviceId,
      title: t(card.title, lang),
      image: card.image,
      params,
      scale,
      fileName: file?.name || null,
      uploadToken,
      thumbData,
      fileRetained: Boolean(uploadToken),
      unitGrosze: price.unitGrosze,
      description: description.trim() || null,
      personalization: engraving.trim() || null,
      attachmentToken: artworkToken || refToken,
      attachmentTokens: [artworkToken, refToken].filter(Boolean),
      attachmentName: artworkFile?.name || refImage?.name || null,
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

      {/* Podglad rysujemy poza ekranem: w kalkulatorze model jest juz pokazany
          wyzej, a tutaj potrzebujemy wylacznie kadru na miniature koszyka. */}
      {triangles?.length > 0 && !thumbData && (
        <div className="h-0 overflow-hidden" aria-hidden="true">
          <Suspense fallback={null}>
            <STLViewer
              triangles={triangles}
              height={240}
              onSnapshot={(dataUrl) => {
                if (dataUrl.length <= MAX_CART_THUMB_CHARS) setThumbData(dataUrl);
              }}
            />
          </Suspense>
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

          {/* Bez tych informacji cena jest znana, a zlecenie nie. Zbieramy je
              tutaj, zeby w koszyku lezaly pozycje gotowe do kupienia. */}
          {requiresDescription && (
            <JobDescription
              label={u.describeLabel}
              hint={isJewelry ? u.describeHint : u.describeHintStudio}
              value={description}
              onChange={setDescription}
              minLength={MIN_DESCRIPTION}
              accent={accent}
              image={refImage}
              imageLabel={u.addImage}
              onPickImage={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setRefImage(f);
                uploadAttachment(f, setRefToken);
              }}
              onClearImage={() => { setRefImage(null); setRefToken(null); }}
              lang={lang}
            />
          )}

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

          {requiresArtwork && (
            <FileDrop
              label={u.artworkLabel}
              hint={u.artworkHint}
              file={artworkFile}
              busy={attachBusy}
              accept=".svg,.dxf,.pdf"
              accent={accent}
              lang={lang}
              onPick={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setArtworkFile(f);
                uploadAttachment(f, setArtworkToken);
              }}
              onClear={() => { setArtworkFile(null); setArtworkToken(null); }}
            />
          )}

          {!ready && !engravingOver && (
            <BlockedReasons
              title={u.blockedTitle}
              accent={accent}
              items={[
                ...(requiresDescription ? [{ ok: descriptionOk, label: u.needDescription, hint: u.needDescriptionHint }] : []),
                ...(requiresArtwork ? [{ ok: artworkOk, label: u.needArtwork, hint: u.needArtworkHint }] : []),
                ...(wantsEngraving ? [{ ok: engravingOk, label: u.needEngraving, hint: u.needEngravingHint }] : []),
                ...(substrateGap === "substrate_required" ? [{ ok: false, label: u.needSubstrate, hint: u.needSubstrateHint }] : []),
                ...(substrateGap === "spare_required" ? [{ ok: false, label: u.needSpare, hint: u.needSpareHint }] : []),
                ...(substrateGap === "material_note_required" ? [{ ok: false, label: u.needMaterialNote, hint: u.needMaterialNoteHint }] : []),
              ]}
            />
          )}

          {engravingOver && (
            <Link
              to="/contact/"
              className="mb-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm
                         border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-colors"
            >
              {u.contact} <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <button
            type="button"
            onClick={addToCart}
            disabled={!ready}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors ${
              !ready ? "bg-white/5 text-neutral-500 cursor-not-allowed" : added ? "bg-emerald-500 text-white" : btn
            }`}
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {added ? u.added : !ready ? (hold ? u.holdLabel : requiresArtwork && !artworkOk ? u.missingArtwork : !descriptionOk ? u.missingDescription : u.missingEngraving) : u.addToCart}
          </button>

          {added && (
            <Link
              to="/cart/"
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 text-neutral-400 hover:text-white text-xs transition-colors"
            >
              {u.goToCart} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Zapis jest dostepny takze wtedy, gdy do koszyka jeszcze nie mozna
              dodac. Brak opisu albo niepotwierdzone uwagi do modelu wstrzymuja
              ZAMOWIENIE, a nie prawo do zachowania wlasnej kalkulacji. */}
          <SaveQuote
            calculator={calculator}
            params={params}
            uploadToken={uploadToken}
            fileName={file?.name || null}
            scale={scale}
            description={description.trim() || null}
            lang={lang}
            accent={accent}
          />
        </>
      )}
    </div>
  );
}
