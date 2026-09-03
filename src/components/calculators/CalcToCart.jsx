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

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { Link } from "../../i18n/nav.jsx";
import { AlertTriangle, ShoppingCart, Check, Loader2, ArrowRight, Info } from "lucide-react";
import { DISTORTION_NOTE } from "../../pricing/quoteSummary.js";
import { useCart } from "../../cart/CartContext.jsx";
import { getServiceCard } from "../../data/serviceCatalog.js";
import { JobDescription, AttachmentList, BlockedReasons, DeclaredSpec, TileGroup, ARTWORK_EXT, uploadKindFor } from "../shop/ConfigControls.jsx";
import { getService } from "../../data/orderCatalog.js";
import { PACKAGING, DEFAULT_PACKAGING, getPackaging, ENGRAVING_LIMITS } from "../../pricing/packaging.js";
import { brakPodloza } from "../../data/laserSubstrate.js";
import { PersonalizationField } from "../shop/ConfigControls.jsx";
import SaveQuote from "./SaveQuote.jsx";
import { t } from "../../pricing/config.js";
import { useMarketRates } from "../../hooks/useMarketRates.js";

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
    note: "Kwota wiążąca, obowiązuje 7 dni. Szczegóły kalkulacji poniżej.",
    unavailable: "Tej konfiguracji nie wycenimy automatycznie. Napisz do nas, odpowiemy w 24 godziny.",
    contact: "Wyślij do wyceny",
    uploading: "Przygotowuję plik",
    modelRejected: "Nie przyjęliśmy tego pliku, więc nie da się go zamówić: kwota poniżej dotyczyłaby wybranego rozmiaru, a nie Twojego modelu. Wgraj inny plik albo napisz do nas.",
    perPc: "za sztukę",
    pcs: "szt.",
    describeLabel: "Opisz, co mamy wykonać",
    describeHint: "np. pierścionek zaręczynowy, szyna 2,5 mm, matowa powierzchnia, grawer wewnątrz \"A+M 2026\", rozmiar 15",
    describeHintStudio: "np. znak z logo 15x10 cm w sklejce 3 mm, projekt gotowy, termin za 2 tygodnie",
    describeWhy: "Cena jest policzona, ale z samych parametrów nie wynika, jak przedmiot ma wyglądać. Bez opisu nie przyjmiemy zlecenia do realizacji.",
    attachFailed: "Nie udało się wysłać tego pliku. Spróbuj ponownie albo usuń go i opisz zlecenie.",
    needModel: "Wgrany plik",
    needModelHint: "Tego pliku nie przyjęliśmy. Usuń go w kalkulatorze i wgraj inny albo wyślij zlecenie do wyceny.",
    missingSomething: "Uzupełnij brakujące dane",
    filesLabel: "Pliki do zlecenia",
    filesLabelOptional: "Pliki do zlecenia (opcjonalnie)",
    artworkHint: "Wgraj projekt (SVG, DXF, AI, PDF), zdjęcie albo szkic. Możesz dodać kilka plików.",
    extraHint: "Projekt już mamy. Możesz dołączyć wersję zamienną, zdjęcie przedmiotu albo rysunek pomocniczy.",
    artworkWhy: "Bez projektu nie wiemy, co wygrawerować ani wyciąć. Rozmiar pola jest wybrany wyżej, on decyduje o cenie.",
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
    packaging: "Opakowanie",
    packagingIncluded: "w cenie",
    lidBack: "Treść po wewnętrznej stronie wieka (opcjonalnie)",
    holdLabel: "Potwierdź uwagi do modelu",
    needDescription: "Opis zlecenia",
    needDescriptionHint: "Wpisz co najmniej 20 znaków w polu opisu powyżej.",
    needBasis: "Podstawa kwoty wiążącej",
    needBasisHint: "Wgraj plik albo podaj wymiary w polu powyżej. Bez pomiaru możemy podać wyłącznie szacunek.",
    missingBasis: "Podaj wymiary, żeby dodać do koszyka",
    estimateNote: "To jest wycena szacunkowa, nie oferta. Podlega weryfikacji przez AEJaCA i dedykowanej ofercie. Podaj wymiary albo wgraj plik, a podamy kwotę wiążącą.",
    needArtwork: "Projekt do wykonania",
    needArtworkHint: "Wgraj plik SVG, DXF lub PDF albo opisz zlecenie w polu powyżej.",
    needEngraving: "Treść graweru",
    needEngravingHint: "Grawer jest wybrany, więc wpisz, co ma zostać wygrawerowane.",
    needPackText: "Grawer na pudełku",
    needPackTextHint: "Wybrane jest pudełko z grawerem, więc wpisz, co ma się na nim znaleźć.",
    svgBlocked: "Wgrany plik wektorowy wyceniamy ręcznie, bo liczy się realna długość ścieżki. Usuń plik, żeby kupić po polu z listy, albo wyślij do wyceny.",
    manualBlocked: "Tę konfigurację wycenia człowiek: kamienie, sploty łańcuszków i metal powierzony przez klienta zależą od rzeczy, których nie widać w parametrach. Odpowiadamy w 24 godziny.",
  },
  en: {
    binding: "Binding price",
    addToCart: "Add to cart",
    added: "Added to cart",
    goToCart: "Go to cart",
    calculating: "Calculating the binding price",
    note: "Binding price, valid for 7 days. The breakdown below shows what it consists of.",
    unavailable: "We cannot price this configuration automatically. Write to us and we reply within 24 hours.",
    contact: "Request a quote",
    uploading: "Preparing the file",
    modelRejected: "We could not accept this file, so it cannot be ordered: the amount below would cover the selected size, not your model. Upload another file or write to us.",
    perPc: "per piece",
    pcs: "pcs",
    describeLabel: "Describe what we are to make",
    describeHint: "e.g. engagement ring, 2.5 mm band, matte finish, inside engraving \"A+M 2026\", size 15",
    describeHintStudio: "e.g. logo sign 15x10 cm in 3 mm plywood, artwork ready, needed in 2 weeks",
    describeWhy: "The price is calculated, but the parameters alone do not say how the piece should look. Without a description we cannot accept the job.",
    attachFailed: "We could not upload this file. Try again, or remove it and describe the job instead.",
    needModel: "Uploaded file",
    needModelHint: "We did not accept this file. Remove it in the calculator and upload another, or send the job for a quote.",
    missingSomething: "Fill in what is missing",
    filesLabel: "Files for this job",
    filesLabelOptional: "Files for this job (optional)",
    artworkHint: "Upload the artwork (SVG, DXF, AI, PDF), a photo or a sketch. You can add several files.",
    extraHint: "We already have your artwork. Add an alternative version, a photo of the item or a reference drawing.",
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
    packaging: "Packaging",
    packagingIncluded: "included",
    lidBack: "Text on the inside of the lid (optional)",
    holdLabel: "Confirm the notes on the model",
    needDescription: "Job description",
    needDescriptionHint: "Type at least 20 characters in the description above.",
    needBasis: "Basis for a binding amount",
    needBasisHint: "Upload a file or give the dimensions above. Without a measurement we can only give an estimate.",
    missingBasis: "Give the dimensions to add to the cart",
    estimateNote: "This is an estimate, not an offer. It is subject to verification by AEJaCA and a dedicated quotation. Give the dimensions or upload a file and we will state a binding amount.",
    needArtwork: "Your artwork",
    needArtworkHint: "Upload an SVG, DXF or PDF file, or describe the job in the field above.",
    needEngraving: "Engraving text",
    needEngravingHint: "You chose an engraving, so tell us what to engrave.",
    needPackText: "Box engraving",
    needPackTextHint: "You chose the engraved box, so tell us what goes on it.",
    svgBlocked: "An uploaded vector file is quoted by hand, because the real path length decides the price. Remove the file to buy by the listed area, or request a quote.",
    manualBlocked: "This configuration is quoted by a person: stones, chain weaves and customer-supplied metal depend on things the parameters do not capture. We reply within 24 hours.",
  },
  de: {
    binding: "Verbindlicher Preis",
    addToCart: "In den Warenkorb",
    added: "In den Warenkorb gelegt",
    goToCart: "Zum Warenkorb",
    calculating: "Verbindlicher Preis wird berechnet",
    note: "Verbindlicher Preis, 7 Tage gültig. Die Aufstellung unten zeigt, woraus er besteht.",
    unavailable: "Diese Konfiguration können wir nicht automatisch bepreisen. Schreiben Sie uns, wir antworten binnen 24 Stunden.",
    contact: "Angebot anfordern",
    uploading: "Datei wird vorbereitet",
    modelRejected: "Diese Datei konnten wir nicht annehmen, sie laesst sich daher nicht bestellen: der Betrag unten wuerde fuer die gewaehlte Groesse gelten, nicht fuer Ihr Modell. Laden Sie eine andere Datei hoch oder schreiben Sie uns.",
    perPc: "pro Stück",
    pcs: "Stk.",
    describeLabel: "Beschreiben Sie, was wir anfertigen sollen",
    describeHint: "z. B. Verlobungsring, Schiene 2,5 mm, matt, Innengravur \"A+M 2026\", Größe 15",
    describeHintStudio: "z. B. Logo-Schild 15x10 cm aus 3 mm Sperrholz, Vorlage fertig, benötigt in 2 Wochen",
    describeWhy: "Der Preis steht, aber aus den Parametern allein geht nicht hervor, wie das Stück aussehen soll. Ohne Beschreibung nehmen wir den Auftrag nicht an.",
    attachFailed: "Diese Datei konnte nicht hochgeladen werden. Versuchen Sie es erneut, oder entfernen Sie sie und beschreiben Sie den Auftrag.",
    needModel: "Hochgeladene Datei",
    needModelHint: "Diese Datei haben wir nicht angenommen. Entfernen Sie sie im Kalkulator und laden eine andere hoch, oder fordern Sie ein Angebot an.",
    missingSomething: "Fehlende Angaben ergänzen",
    filesLabel: "Dateien zum Auftrag",
    filesLabelOptional: "Dateien zum Auftrag (optional)",
    artworkHint: "Vorlage (SVG, DXF, AI, PDF), Foto oder Skizze hochladen. Mehrere Dateien sind möglich.",
    extraHint: "Die Vorlage haben wir bereits. Sie können eine Alternativversion, ein Foto des Objekts oder eine Hilfszeichnung anhängen.",
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
    packaging: "Verpackung",
    packagingIncluded: "inklusive",
    lidBack: "Text auf der Deckelinnenseite (optional)",
    holdLabel: "Hinweise zum Modell bestätigen",
    needDescription: "Auftragsbeschreibung",
    needDescriptionHint: "Mindestens 20 Zeichen im Beschreibungsfeld oben.",
    needBasis: "Grundlage fuer einen verbindlichen Betrag",
    needBasisHint: "Laden Sie eine Datei hoch oder geben Sie oben die Masse an. Ohne Messung koennen wir nur schaetzen.",
    missingBasis: "Masse angeben, um in den Warenkorb zu legen",
    estimateNote: "Dies ist eine Schaetzung, kein Angebot. Sie unterliegt der Pruefung durch AEJaCA und einem dedizierten Angebot. Geben Sie die Masse an oder laden Sie eine Datei hoch, dann nennen wir einen verbindlichen Betrag.",
    needArtwork: "Ihre Vorlage",
    needArtworkHint: "Laden Sie eine SVG-, DXF- oder PDF-Datei hoch oder beschreiben Sie den Auftrag oben.",
    needEngraving: "Gravurtext",
    needEngravingHint: "Sie haben eine Gravur gewählt, bitte geben Sie den Text an.",
    needPackText: "Gravur auf der Schachtel",
    needPackTextHint: "Sie haben die gravierte Schachtel gewählt, bitte geben Sie den Text an.",
    svgBlocked: "Eine hochgeladene Vektordatei kalkulieren wir manuell, denn die tatsächliche Pfadlänge entscheidet. Entfernen Sie die Datei, um nach gelisteter Fläche zu kaufen, oder fordern Sie ein Angebot an.",
    manualBlocked: "Diese Konfiguration kalkuliert ein Mensch: Steine, Kettengeflechte und beigestelltes Metall hängen von Dingen ab, die in den Parametern nicht stehen. Wir antworten binnen 24 Stunden.",
  },
};

// WALUTA IDZIE ZA JEZYKIEM: polski placi w zlotowkach, angielski i niemiecki
// widza euro. Kwota wiazaca byla jedynym miejscem, ktore tego nie robilo:
// `money()` doklejal " PLN" niezaleznie od jezyka, wiec Niemiec ogladal cene
// w walucie, ktorej nie uzywa, tuz pod rozpiska podana juz w euro.
//
// Kwota jest i zostaje w GROSZACH: to ona idzie do koszyka i do zamowienia.
// Euro jest wylacznie przeliczeniem do pokazania, po kursie NBP z
// `/api/market-rates`, tym samym, ktorego uzywa reszta serwisu.
const fmtKwota = (n) => n.toFixed(2).replace(".", ",");

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
export default function CalcToCart({ calculator, serviceId, params, qty: qtyProp = null, file = null, triangles = null, scale = 1, lang, accent = "blue", blocked = false, blockedReason = "vector", onBinding = null, onUnavailable = null, hold = false, embedded = false }) {
  const u = UI[lang] || UI.en;
  const cart = useCart();
  const { rates } = useMarketRates();
  const plnPerEur = Number(rates?.pln_per_eur) || 4.25;
  const showEur = lang === "en" || lang === "de";
  /** Kwota w walucie jezyka. */
  const money = (g) => (showEur ? `${fmtKwota(g / 100 / plnPerEur)} EUR` : `${fmtKwota(g / 100)} PLN`);
  /** Ta sama kwota w drugiej walucie, mniejszym drukiem pod glowna. */
  const moneyDruga = (g) => (showEur ? `${fmtKwota(g / 100)} PLN` : `${fmtKwota(g / 100 / plnPerEur)} EUR`);
  const card = getServiceCard(serviceId);
  // Jedno zrodlo prawdy: te same wymagania obowiazuja w sklepie i w kalkulatorze.
  const svc = getService(card?.service || serviceId);
  const requiresDescription = Boolean(svc?.requiresDescription);
  const requiresArtwork = Boolean(svc?.requiresVector);
  const isJewelry = String(calculator || "").startsWith("jewelry");

  // OPAKOWANIE JEST WLASNOSCIA POZYCJI, nie przesylki: kasa liczy je za sztuke
  // (`(unitGrosze + packagingGrosze) * qty`), wiec dziesiec pierscionkow to
  // dziesiec pudelek. Do tej pory kalkulator wpisywal na sztywno papierowe za
  // zero i ta sama usluga zamowiona stad po cichu tracila krok, ktory karta
  // uslugi oferowala. Stoi w panelu koszyka, a nie jako kolejne pytanie wyzej,
  // bo to decyzja o wysylce gotowej rzeczy, a nie o tym, co mamy wykonac.
  const [packagingId, setPackagingId] = useState(DEFAULT_PACKAGING);
  const [packEngraving, setPackEngraving] = useState("");
  const [lidBackText, setLidBackText] = useState("");

  const [price, setPrice] = useState(null);
  // PODSTAWA KWOTY WIAZACEJ. `binding` przychodzi z serwera, z tej samej
  // reguly, ktora odmawia przyjecia zamowienia. Dopoki jest falszem, kwota
  // jest szacunkiem i koszyk zostaje wygaszony razem z powodem.
  const [binding, setBinding] = useState(true);
  const [missing, setMissing] = useState([]);
  // To, co klient wpisal recznie zamiast pliku: gabaryty, pole albo objetosc.
  const [declared, setDeclared] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // KOMUNIKAT SERWERA, a nie tylko kod. Serwer pisze pelnym zdaniem, po co
  // ta konfiguracja idzie do czlowieka, a my wyswietlalismy zawsze to samo
  // ogolne zdanie. Klient widzial odmowe bez powodu i nie mial jak zgadnac,
  // co zmienic: kazda proba wygladala tak samo.
  const [errorMsg, setErrorMsg] = useState(null);
  const [added, setAdded] = useState(false);

  const [description, setDescription] = useState("");
  const [engraving, setEngraving] = useState("");
  // JEDNA LISTA ZALACZNIKOW zamiast dwoch osobnych pol na jeden plik kazde.
  // Kazda pozycja niesie wlasny stan, bo wysylki ida rownolegle i jedna moze
  // sie nie udac, kiedy druga juz przeszla.
  const [attachments, setAttachments] = useState([]);
  // Plik glowny, ten z ktorego liczy sie cena, tez musi do nas dojechac.
  // Rysunek wektorowy nie ma geometrii, wiec sciezka modelu go odrzucala
  // i zlecenie szlo do pracowni BEZ PLIKU, na ktorym je wyceniono.
  const [mainAttachToken, setMainAttachToken] = useState(null);
  const [modelError, setModelError] = useState(null);
  const [thumbData, setThumbData] = useState(null);
  const [uploadToken, setUploadToken] = useState(null);
  const [uploading, setUploading] = useState(false);
  const reqId = useRef(0);

  // Rysunek wektorowy JEST plikiem glownym, ale nie jest modelem.
  //
  // Sciezka modelu liczy objetosc siatki, wiec SVG i DXF odbijaly sie od niej
  // bledem "Format .svg nie jest jeszcze obslugiwany w wycenie automatycznej".
  // Komunikat byl mylacy podwojnie: wycena z tego pliku dziala i widnieje wyzej
  // (liczymy ja z odczytanej dlugosci sciezki), a jedyne, co nie zadzialalo, to
  // ZAPISANIE pliku. Skutek byl powazniejszy niz czerwony napis: zamowienie
  // szlo do pracowni bez rysunku, na ktorym je wyceniono.
  const mainIsArtwork = Boolean(file) && ARTWORK_EXT.test(file.name || "");

  // Plik idzie na serwer raz, jak w sklepie. Bez tego kwota wiazaca liczylaby
  // sie z wybranego rozmiaru, a nie z modelu, i rozjechalaby sie z widelkami.
  useEffect(() => {
    if (!file || !API) {
      setUploadToken(null);
      setMainAttachToken(null);
      return;
    }
    let cancelled = false;
    setUploading(true);
    setModelError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lang", lang);
    if (mainIsArtwork) fd.append("kind", "attachment");
    fetch(`${API}/api/uploads`, { method: "POST", body: fd })
      .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && data?.uploadToken) {
          // Rysunek nie wchodzi do wyceny na serwerze, wiec nie idzie jako
          // `uploadToken`: tam trafia wylacznie model, z ktorego liczy sie
          // objetosc. Rysunek wiazemy z zamowieniem jako zalacznik.
          if (mainIsArtwork) { setMainAttachToken(data.uploadToken); setUploadToken(null); }
          else { setUploadToken(data.uploadToken); setMainAttachToken(null); }
          return;
        }
        // ODRZUCONY MODEL MUSI BYC WIDOCZNY. Bez tokenu cena liczy sie
        // z wybranego rozmiaru, a nie z modelu, wiec po cichu przestawala
        // dotyczyc tego, co klient wgral, a on nie mial jak tego zauwazyc.
        setUploadToken(null);
        setMainAttachToken(null);
        setModelError(data?.error || u.modelRejected);
      })
      .catch(() => { if (!cancelled) setModelError(u.modelRejected); })
      .finally(() => { if (!cancelled) setUploading(false); });
    return () => { cancelled = true; };
  }, [file, mainIsArtwork, lang, u.modelRejected]);

  /**
   * Zalaczniki nie wplywaja na cene, ida na Dysk jako material do wykonania.
   *
   * `kind` rozdziela dwie rzeczy, ktore wygladaja podobnie i sa zupelnie inne:
   * "attachment" to PROJEKT do wykonania (SVG, DXF, AI, PDF), a "reference" to
   * ZDJECIE albo szkic (JPG, PNG, WEBP, HEIC, PDF). Serwer sprawdza kazde
   * wlasna lista formatow, wiec rodzaj wybieramy po rozszerzeniu, zamiast
   * kazac klientowi trafic plikiem we wlasciwe z dwoch pol.
   */
  const addAttachments = useCallback((pliki) => {
    if (!API) return;
    const nowe = pliki.map((f, i) => ({
      // Nazwa i rozmiar wystarcza za tozsamosc, a licznik rozroznia dwa pliki
      // o tej samej nazwie wybrane w jednym ruchu.
      id: `${f.name}|${f.size}|${Date.now()}|${i}`,
      file: f,
      name: f.name,
      artwork: ARTWORK_EXT.test(f.name),
      busy: true,
      error: null,
      token: null,
    }));
    setAttachments((biezace) => [...biezace, ...nowe]);

    for (const poz of nowe) {
      const fd = new FormData();
      fd.append("file", poz.file);
      fd.append("lang", lang);
      fd.append("kind", uploadKindFor(poz.name));
      fetch(`${API}/api/uploads`, { method: "POST", body: fd })
        .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
        .then(({ ok, data }) => {
          // MILCZACE ODRZUCENIE JEST GORSZE OD BLEDU. Klient widzi nazwe pliku
          // na liscie i jest pewien, ze plik poszedl, a do nas nie dociera nic.
          setAttachments((biezace) => biezace.map((x) => x.id !== poz.id ? x : {
            ...x,
            busy: false,
            token: ok ? (data?.uploadToken || null) : null,
            error: ok ? null : (data?.error || u.attachFailed),
          }));
        })
        .catch(() => {
          setAttachments((biezace) => biezace.map((x) => x.id !== poz.id ? x : { ...x, busy: false, error: u.attachFailed }));
        });
    }
  }, [lang, u.attachFailed]);

  const removeAttachment = useCallback((id) => {
    setAttachments((biezace) => biezace.filter((x) => x.id !== id));
  }, []);

  // LICZBA SZTUK JEDZIE DO SILNIKA RAZEM Z PARAMETRAMI. Bez niej serwer liczyl
  // po nakladzie reprezentatywnym progu ("2-10 szt." po szesciu), wiec przy
  // dwoch sztukach dzielil przygotowanie przez szesc i zlecenie kosztowalo nas
  // wiecej, niz za nie bralismy. Silnik przycina te liczbe do granic progu,
  // wiec nie da sie tedy wziac rabatu za dwadziescia jeden sztuk, zamawiajac
  // jedna. Liczba wchodzi tez do klucza, wiec zmiana licznika przelicza cene.
  const zamowionych = qtyProp != null ? Math.max(1, Math.floor(qtyProp)) : null;

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

  const paramsZPodstawa = useMemo(() => ({ ...params, ...podstawaZReki }), [params, podstawaZReki]);
  const paramsKey = JSON.stringify(zamowionych != null ? { ...paramsZPodstawa, qty: zamowionych } : paramsZPodstawa);

  const fetchPrice = useCallback(async () => {
    if (!API || !calculator) return;
    const mine = ++reqId.current;
    setBusy(true);
    setError(null);
    setErrorMsg(null);
    try {
      const body = new FormData();
      body.append("calculator", calculator);
      body.append("lang", lang);
      body.append("params", paramsKey);
      if (uploadToken) body.append("uploadToken", uploadToken);
      // JSON, a nie `String(...)`. Skala bywa teraz obiektem `{x,y,z}`, a
      // `String({...})` daje "[object Object]", czyli pole wypelnione tekstem
      // bez tresci: serwer odczytalby z niego NaN i po cichu wycenil model
      // w skali 1. Liczba zapisana JSON-em ("1.5") czyta sie tak samo jak
      // wczesniej, wiec stary zapis nie przestaje dzialac.
      if (scale && scale !== 1) body.append("scale", JSON.stringify(scale));

      const resp = await fetch(`${API}/api/price`, { method: "POST", body });
      const data = await resp.json();
      if (mine !== reqId.current) return;
      if (!resp.ok) {
        setPrice(null);
        setBinding(false);
        setMissing(Array.isArray(data.missing) ? data.missing : []);
        setError(data.code || "no_price");
        setErrorMsg(typeof data.error === "string" && data.error.trim() ? data.error.trim() : null);
        return;
      }
      setPrice(data.item);
      setBinding(data.binding !== false);
      setMissing(Array.isArray(data.missing) ? data.missing : []);
      setErrorMsg(null);
    } catch {
      if (mine === reqId.current) setError("network");
    } finally {
      if (mine === reqId.current) setBusy(false);
    }
  }, [calculator, paramsKey, uploadToken, JSON.stringify(scale), lang]);

  useEffect(() => {
    const timer = setTimeout(fetchPrice, 400);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  useEffect(() => setAdded(false), [paramsKey, uploadToken, packagingId, packEngraving, lidBackText]);


  // Panel akcji musi wiedziec, ze zakup jest niemozliwy, inaczej kafelek
  // "Dodaj do koszyka" swieci sie na niebiesko i nic pod nim nie dziala.
  useEffect(() => {
    if (!onUnavailable) return;
    onUnavailable(error && !busy ? (errorMsg || u.unavailable) : null);
  }, [onUnavailable, error, busy, errorMsg, u.unavailable]);

  // ============================================================
  // WSZYSTKIE HOOKI MUSZA STAC PRZED KAZDYM `return`
  // ============================================================
  // Ponizej sa dwa wczesne wyjscia: brak karty uslugi i konfiguracja, ktorej
  // nie wycenimy wiazaco. Efekt zglaszajacy kwote kalkulatorowi stal PO nich,
  // wiec w chwili, gdy `blocked` przechodzilo z falszu w prawde przy zywym
  // komponencie, React liczyl mniej hookow niz w poprzednim renderze i gasil
  // caly kalkulator: wystarczylo wybrac lancuszek w kalkulatorze jubilerskim,
  // zeby ekran zniknal. Dlatego stan opakowania, kwota linii i ten efekt stoja
  // tutaj, nad wyjsciami, i nie zaleza od tego, ktora galezia poleci render.

  // Usluga cyfrowa nie jedzie w pudelku, wiec pytanie o opakowanie nie ma
  // sensu. Ten sam warunek co w sklepie, zeby obie drogi pytaly tak samo.
  const isDigital = Boolean(svc?.digital);
  const pack = isDigital ? null : getPackaging(packagingId);
  const packGrosze = pack?.grosze || 0;
  const packLimit = pack?.maxLength ?? ENGRAVING_LIMITS.packaging;
  const packOver = Boolean(pack?.personalizable)
    && (packEngraving.trim().length > packLimit || lidBackText.trim().length > packLimit);
  // Pudelko z grawerem bez tresci graweru jest zamowieniem niekompletnym,
  // wiec blokuje koszyk tak samo jak w sklepie.
  const packEngravingOk = !pack?.personalizable || (packEngraving.trim().length >= 1 && !packOver);

  // Licznik z kalkulatora ma pierwszenstwo przed nakladem reprezentatywnym
  // progu. `price.qty` to srodek przedzialu, na ktorym opiera sie rabat, wiec
  // klient proszacy o trzy sztuki dostawal do koszyka szesc.
  const qty = qtyProp != null ? Math.max(1, Math.floor(qtyProp)) : (price?.qty || 1);
  // Kwota linii tak samo jak w koszyku: opakowanie doliczamy za sztuke.
  const lineGrosze = ((price?.unitGrosze || 0) + packGrosze) * qty;

  // Kalkulator musi wiedziec, czy udalo sie podac kwote wiazaca. Jesli tak,
  // widelki znikaja: dwie rozne liczby obok siebie podwazaja te wiazaca.
  useEffect(() => {
    if (!onBinding) return;
    if (blocked || !price?.unitGrosze) { onBinding(null); return; }
    // GOTOWE NAPISY, NIE SAME LICZBY. Kwote wiazaca pokazuje teraz karta
    // wyceny na gorze, ale etykiety i formatowanie kwot maja zostac w jednym
    // miejscu. Przekazanie samych groszy znaczyloby druga kopie tlumaczen
    // i drugi formater, a te rozjezdzaja sie po cichu.
    onBinding({
      unitGrosze: price.unitGrosze,
      qty,
      lineGrosze,
      etykieta: qty > 1 ? `${u.binding} (${qty} ${u.pcs})` : u.binding,
      suma: money(lineGrosze),
      sumaDruga: moneyDruga(lineGrosze),
      // Za sztuke liczy sie TAK SAMO jak suma, czyli razem z opakowaniem.
      // Inaczej mnozenie kwoty za sztuke przez naklad nie dawaloby sumy pod nia.
      zaSztuke: qty > 1 ? `${money(price.unitGrosze + packGrosze)} ${u.perPc}` : null,
      uwaga: u.note,
    });
  }, [onBinding, blocked, price, qty, lineGrosze, packGrosze, u, showEur, plnPerEur]);

  if (!card) return null;

  // Sciezka wektorowa nie da sie policzyc z presetu pola, wiec zamiast
  // pokazywac kwote, ktora i tak bysmy poprawili, mowimy to wprost.
  if (blocked) {
    return (
      <div className={embedded ? "" : "mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"}>
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
  // Plik GLOWNY, ten z ktorego policzylismy cene, jest juz tym projektem.
  // Wczesniej koszyk prosil o niego drugi raz i blokowal zakup, dopoki klient
  // nie wgral tego samego rysunku ponownie. Wygladalo to jak usterka, bo nia
  // bylo: pytalismy o cos, co lezalo na ekranie wyzej.
  const mainFileIsArtwork = Boolean(file);
  const artworkOk = !requiresArtwork
    || mainFileIsArtwork
    || attachments.some((a) => a.artwork && a.token)
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
  // Bez podstawy nie ma kwoty wiazacej, wiec nie ma czego wlozyc do koszyka.
  // Ta sama regula odmawia po stronie serwera, wiec przycisk nie moze obiecac
  // czegos, czego kasa nie przyjmie.
  const ready = descriptionOk && artworkOk && engravingOk && substrateOk && packEngravingOk && binding && !gatedShape && !hold && !modelError;



  // Plik glowny idzie do zamowienia razem z reszta, a nie osobna sciezka.
  // Kolejnosc jest zamierzona: rysunek, na ktorym liczylismy cene, ma byc
  // pierwszy na liscie, bo to on jest podstawa ustalen.
  const attachTokens = [mainAttachToken, ...attachments.map((a) => a.token)].filter(Boolean);
  const attachNames = [
    ...(mainAttachToken && file ? [file.name] : []),
    ...attachments.filter((a) => a.token).map((a) => a.name),
  ];

  function addToCart() {
    if (!price || !ready) return;
    cart.add({
      kind: "service",
      calculator,
      serviceId,
      title: t(card.title, lang),
      image: card.image,
      // PODSTAWA JEDZIE RAZEM Z POZYCJA. Bez niej kasa odrzucilaby wlasna
      // kwote, bo sprawdza to samo, co sprawdzil ekran: czy kwota wynika
      // z pomiaru albo z wpisanych wymiarow, czy z przedzialu.
      params: paramsZPodstawa,
      scale,
      fileName: file?.name || null,
      uploadToken,
      thumbData,
      // Rysunek wektorowy nie ma tokenu modelu, a mimo to jest u nas zapisany.
      // Bez tego drugiego skladnika koszyk twierdzil, ze pliku nie mamy.
      fileRetained: Boolean(uploadToken || mainAttachToken),
      unitGrosze: price.unitGrosze,
      description: description.trim() || null,
      personalization: engraving.trim() || null,
      attachmentToken: attachTokens[0] || null,
      attachmentTokens: attachTokens,
      attachmentName: attachNames.join(", ") || null,
      packagingId: isDigital ? null : packagingId,
      packagingGrosze: packGrosze,
      packagingText: packEngraving.trim() || null,
      packagingTextBack: lidBackText.trim() || null,
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
    <div className={embedded ? "" : `mt-4 rounded-2xl border p-5 ${ring}`}>
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
            <p className="text-neutral-400 text-xs leading-relaxed mb-2">{errorMsg || u.unavailable}</p>
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
          {/* Gdy kalkulator odbiera kwote przez `onBinding`, pokazuje ja u
              siebie na gorze karty wyceny. Powtarzanie jej tutaj dawaloby te
              sama liczbe dwa razy na jednym ekranie. */}
          {!onBinding && (
          <>
          <div className="flex items-end justify-between gap-4 mb-1">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {qty > 1 ? `${u.binding} (${qty} ${u.pcs})` : u.binding}
              </div>
              <div className="text-3xl font-extrabold text-white leading-tight">{money(lineGrosze)}</div>
              <div className="text-xs text-neutral-500">{moneyDruga(lineGrosze)}</div>
            </div>
            {qty > 1 && (
              <div className="text-right text-neutral-400 text-xs">
                {money(price.unitGrosze)} {u.perPc}
              </div>
            )}
          </div>
          <p className="text-neutral-500 text-xs mb-4 leading-relaxed">{u.note}</p>
          </>
          )}

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
              lang={lang}
            />
          )}

          {modelError && (
            <p className="text-amber-300 text-xs -mt-2">{modelError}</p>
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

          {/* Opakowanie, tylko dla rzeczy, ktore realnie wysylamy. Ta sama
              lista i te same kwoty co na karcie uslugi. */}
          {!isDigital && (
            <TileGroup
              label={u.packaging}
              options={PACKAGING.map((o) => ({
                id: o.id,
                label: o.label,
                sub: o.grosze
                  ? { pl: `+ ${money(o.grosze)}`, en: `+ ${money(o.grosze)}`, de: `+ ${money(o.grosze)}` }
                  : { pl: u.packagingIncluded, en: u.packagingIncluded, de: u.packagingIncluded },
              }))}
              value={packagingId}
              onChange={setPackagingId}
              lang={lang}
              accent={accent}
              columns={3}
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

          {/* JEDNO POLE NA PLIKI. Wczesniej byly dwa, kazde na jeden plik,
              i klient musial zgadnac, ktore przyjmie jego rysunek. */}
          <AttachmentList
            label={requiresArtwork && !mainFileIsArtwork ? u.filesLabel : u.filesLabelOptional}
            hint={mainFileIsArtwork ? u.extraHint : u.artworkHint}
            items={attachments}
            onAdd={addAttachments}
            onRemove={removeAttachment}
            accent={accent}
            lang={lang}
          />

          {/* NAJPIERW DROGA, POTEM POWOD. Lista przeszkod mowi, czego brakuje,
              ale sama nie daje tego uzupelnic. Formularz podstawy stoi wiec
              nad nia, zeby klient nie musial szukac, gdzie wpisac wymiary. */}
          {!binding && missing.length > 0 && (
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

          {!ready && !engravingOver && (
            <BlockedReasons
              title={u.blockedTitle}
              accent={accent}
              items={[
                ...(!binding ? [{ ok: false, label: u.needBasis, hint: u.needBasisHint }] : []),
                ...(requiresDescription ? [{ ok: descriptionOk, label: u.needDescription, hint: u.needDescriptionHint }] : []),
                ...(requiresArtwork ? [{ ok: artworkOk, label: u.needArtwork, hint: u.needArtworkHint }] : []),
                ...(wantsEngraving ? [{ ok: engravingOk, label: u.needEngraving, hint: u.needEngravingHint }] : []),
                // Pudelko z grawerem bez tresci graweru blokuje koszyk, wiec
                // musi miec tu swoj wiersz. Bez niego przycisk gasnie i lista
                // przyczyn twierdzi, ze wszystko jest uzupelnione.
                ...(pack?.personalizable ? [{ ok: packEngravingOk, label: u.needPackText, hint: u.needPackTextHint }] : []),
                ...(substrateGap === "substrate_required" ? [{ ok: false, label: u.needSubstrate, hint: u.needSubstrateHint }] : []),
                ...(substrateGap === "spare_required" ? [{ ok: false, label: u.needSpare, hint: u.needSpareHint }] : []),
                ...(substrateGap === "material_note_required" ? [{ ok: false, label: u.needMaterialNote, hint: u.needMaterialNoteHint }] : []),
                // Odrzucony plik BLOKOWAL zakup, ale nie mial tu swojego
                // wiersza, wiec lista przyczyn twierdzila, ze wszystko gra,
                // a przycisk pozostawal wygaszony bez podania powodu.
                ...(modelError ? [{ ok: false, label: u.needModel, hint: u.needModelHint }] : []),
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

          {/* ZNIEKSZTALCENIE POKAZUJEMY PRZY PRZYCISKU, a nie tylko w polach
              wymiarow. Klient przewija strone i klika; jesli zmienil ksztalt
              wyrobu, ostatnia rzecza przed zaplata ma byc informacja o tym,
              a nie sama kwota. To samo zdanie stoi potem w koszyku i w mailu. */}
          {params?.znieksztalcony && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {DISTORTION_NOTE[lang] || DISTORTION_NOTE.pl}
                {params.wymiary ? ` ${params.wymiary}` : ""}
              </span>
            </div>
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
            {/* NAPIS NA PRZYCISKU MUSI NAZYWAC PRAWDZIWA PRZESZKODE.
                Grawer byl tu koncem lancucha `?:`, wiec kazda przyczyna spoza
                listy konczyla sie napisem "Wpisz tresc graweru". Klient wgral
                rysunek do wyciecia, graweru nie zamawial, nie mial nawet gdzie
                go wpisac, i patrzyl na polecenie, ktorego nie da sie wykonac. */}
            {added ? u.added
              : ready ? u.addToCart
              : hold ? u.holdLabel
              : !binding ? u.missingBasis
              : requiresArtwork && !artworkOk ? u.missingArtwork
              : !descriptionOk ? u.missingDescription
              : wantsEngraving && !engravingOk ? u.missingEngraving
              : !substrateOk ? u.missingSubstrate
              : u.missingSomething}
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
