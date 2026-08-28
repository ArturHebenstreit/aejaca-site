// ============================================================
// SPRAWDZARKA DRUKOWALNOSCI
// ============================================================
// Plik nie opuszcza przegladarki. To nie jest deklaracja marketingowa, tylko
// warunek dzialania: konstruktor, ktory chce sprawdzic czesc przed wyslaniem
// zapytania, nie wysle jej na cudzy serwer po to, zeby uslyszec, ze scianka
// ma 0,3 mm. Cala analiza dzieje sie lokalnie, w watku roboczym.
//
// Technologia i dysza sa nad wynikiem, a nie pod nim, bo to one zmieniaja
// odpowiedz. Ta sama plyta 0,3 mm jest blokada przy dyszy 0,4 i tylko
// ostrzezeniem przy 0,2. Klient ma to zobaczyc jako przelacznik, a nie
// wyczytac z tabeli w stopce.

import { useState, useRef, useEffect } from "react";
import { Link } from "../../i18n/nav.jsx";
import { Upload, X, Loader2, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import STLViewer from "./STLViewer.jsx";
import { NOZZLES, MACHINES } from "../../analysis/printability.js";
import { wantsHandoff, waitForModelHandoff, trianglesFromPositions } from "../../analysis/modelHandoff.js";

const ACCEPT = ".stl,.obj,.3mf,.step,.stp";

const L10N = {
  pl: {
    dropTitle: "Wgraj model",
    dropHint: "STL, OBJ, 3MF, STEP. Plik zostaje w Twojej przeglądarce, nigdzie go nie wysyłamy.",
    dropBtn: "Wybierz plik",
    remove: "Usuń",
    analyzing: "Analizuję model...",
    analyzingLong: "Duży model, to może potrwać kilka sekund.",
    techLabel: "Technologia",
    fdm: "Druk FDM",
    msla: "Żywica MSLA",
    nozzleLabel: "Średnica dyszy",
    inHouse: "drukujemy",
    onRequest: "na życzenie",
    resultTitle: "Wynik",
    verdictOk: "Model gotowy do druku",
    verdictWarn: "Wydrukuje się, ale zwróć uwagę",
    verdictBlock: "Tak się nie wydrukuje",
    statsTitle: "Geometria",
    statSize: "Gabaryt",
    statVolume: "Objętość",
    statTriangles: "Trójkąty",
    statArea: "Powierzchnia",
    statThickness: "Najcieńsza ścianka (percentyl 1%)",
    statOverhang: "Powierzchnia wymagająca podpór",
    statBed: "Styk ze stołem",
    machineLabel: "Stół roboczy",
    error: "Nie udało się odczytać pliku. Sprawdź, czy to poprawny STL, OBJ, 3MF albo STEP.",
    handoffWait: "Przenoszę model z konfiguratora...",
    handoffDone: "Model przeniesiony z konfiguratora. Technologia, dysza i wielkość są takie, jak tam wybrałeś, więc wynik odpowiada dokładnie temu zamówieniu.",
    handoffScale: (p) => `Wielkość wydruku: ${p}% oryginału.`,
    disclaimer: "Analiza opisuje geometrię, nie zastępuje wydruku próbnego. Przy nietypowych kształtach i przy cienkich detalach na granicy progu odezwij się, sprawdzimy to na maszynie.",
  },
  en: {
    dropTitle: "Upload a model",
    dropHint: "STL, OBJ, 3MF, STEP. The file stays in your browser, we do not upload it anywhere.",
    dropBtn: "Choose a file",
    remove: "Remove",
    analyzing: "Analysing the model...",
    analyzingLong: "Large model, this can take a few seconds.",
    techLabel: "Technology",
    fdm: "FDM printing",
    msla: "MSLA resin",
    nozzleLabel: "Nozzle diameter",
    inHouse: "we print this",
    onRequest: "on request",
    resultTitle: "Result",
    verdictOk: "Ready to print",
    verdictWarn: "It will print, but look at this",
    verdictBlock: "This will not print as is",
    statsTitle: "Geometry",
    statSize: "Dimensions",
    statVolume: "Volume",
    statTriangles: "Triangles",
    statArea: "Surface",
    statThickness: "Thinnest wall (1st percentile)",
    statOverhang: "Surface needing support",
    statBed: "Bed contact",
    machineLabel: "Build volume",
    error: "Could not read the file. Check that it is a valid STL, OBJ, 3MF or STEP.",
    handoffWait: "Bringing the model over from the configurator...",
    handoffDone: "Model brought over from the configurator. Technology, nozzle and size are the ones you picked there, so this result matches that order exactly.",
    handoffScale: (p) => `Print size: ${p}% of the original.`,
    disclaimer: "This analyses geometry and does not replace a test print. For unusual shapes, or thin detail sitting right on the threshold, get in touch and we will check it on the machine.",
  },
  de: {
    dropTitle: "Modell hochladen",
    dropHint: "STL, OBJ, 3MF, STEP. Die Datei bleibt in Ihrem Browser, wir laden sie nirgendwo hoch.",
    dropBtn: "Datei wählen",
    remove: "Entfernen",
    analyzing: "Modell wird analysiert...",
    analyzingLong: "Großes Modell, das kann einige Sekunden dauern.",
    techLabel: "Technologie",
    fdm: "FDM-Druck",
    msla: "MSLA-Harz",
    nozzleLabel: "Düsendurchmesser",
    inHouse: "drucken wir",
    onRequest: "auf Anfrage",
    resultTitle: "Ergebnis",
    verdictOk: "Druckbereit",
    verdictWarn: "Druckbar, aber beachten Sie",
    verdictBlock: "So lässt sich das nicht drucken",
    statsTitle: "Geometrie",
    statSize: "Abmessungen",
    statVolume: "Volumen",
    statTriangles: "Dreiecke",
    statArea: "Oberfläche",
    statThickness: "Dünnste Wand (1. Perzentil)",
    statOverhang: "Fläche mit Stützbedarf",
    statBed: "Auflagefläche",
    machineLabel: "Bauraum",
    error: "Datei konnte nicht gelesen werden. Prüfen Sie, ob es eine gültige STL, OBJ, 3MF oder STEP ist.",
    handoffWait: "Modell wird aus dem Konfigurator übernommen...",
    handoffDone: "Modell aus dem Konfigurator übernommen. Technologie, Düse und Größe sind die dort gewählten, das Ergebnis passt also genau zu dieser Bestellung.",
    handoffScale: (p) => `Druckgröße: ${p}% des Originals.`,
    disclaimer: "Die Analyse beschreibt die Geometrie und ersetzt keinen Testdruck. Bei ungewöhnlichen Formen und bei feinen Details direkt an der Grenze melden Sie sich, wir prüfen es auf der Maschine.",
  },
};

/**
 * Teksty ustalen. `t` dostaje wartosc i jednostki, wiec komunikat mowi, ILE
 * brakuje, a nie tylko ze cos jest nie tak.
 *
 * Kazde ustalenie ma `fix`. Sam komunikat "model ma dziury" nie pomaga nikomu,
 * kto nie wie, ze naprawia sie to w Meshmixerze, w Blenderze albo funkcja
 * napraw w slicerze.
 */
/**
 * Polska odmiana przez liczbe. "4 krawedzi" zamiast "4 krawedzie" wyglada
 * jak blad maszyny, a to jest narzedzie, ktoremu klient ma zaufac na tyle,
 * zeby nie drukowac wadliwego modelu.
 */
function pl(n, [one, few, many]) {
  const abs = Math.abs(n) % 100;
  if (n === 1) return one;
  if (abs >= 12 && abs <= 14) return many;
  return abs % 10 >= 2 && abs % 10 <= 4 ? few : many;
}

const FINDINGS = {
  pl: {
    empty: { t: (f, n) => "Plik nie zawiera żadnej geometrii.", fix: "Sprawdź, czy eksport się powiódł i czy plik nie jest pusty." },
    holes: { t: (f, n) => `Siatka nie jest w pełni szczelna: ${f.value} ${pl(f.value, ["krawędź", "krawędzie", "krawędzi"])} bez pary.`, fix: "Zwykle nie przeszkadza: współczesne slicery naprawiają takie drobne nieszczelności same i drukują bez uwag. Warto jednak wiedzieć, bo objętość, z której liczy się cena, jest wtedy przybliżona. Naprawa jednym kliknięciem: Meshmixer (Analysis, Inspector), Blender (3D Print Toolbox) albo funkcja naprawy w PrusaSlicer i Bambu Studio." },
    open_surface: { t: (f, n) => `Plik jest powierzchnią, a nie bryłą: ${Math.round((f.ratio || 0) * 100)}% krawędzi to brzeg.`, fix: "Tego nie da się wydrukować, bo nie wiadomo, co jest wnętrzem. Zwykle to skan, wyeksportowana płaszczyzna albo otwarta skorupa. Nadaj powierzchni grubość (w Blenderze modyfikator Solidify) albo poproś nas o zamknięcie bryły." },
    nonmanifold: { t: (f, n) => `Siatka nie jest rozmaitością: ${f.value} ${pl(f.value, ["krawędź należy", "krawędzie należą", "krawędzi należy"])} do więcej niż dwóch ścianek.`, fix: "Zwykle skutek sklejenia brył bez operacji logicznej. Zrób sumę logiczną (boolean union) zamiast nakładać obiekty na siebie." },
    reversed: { t: (f, n) => `${f.value} ${pl(f.value, ["ścianka jest odwrócona", "ścianki są odwrócone", "ścianek jest odwróconych"])} względem sąsiadów.`, fix: "Ujednolic kierunek normalnych: w Blenderze Shift+N, w Meshmixerze Edit, Make Solid." },
    inverted: { t: (f, n) => "Cała siatka jest wywrócona na lewą stronę.", fix: "Model wygląda poprawnie na podglądzie, ale slicer uzna wnętrze za zewnętrze i wydrukuje pełną bryłę zamiast skorupy. Odwróć normalne." },
    degenerate: { t: (f, n) => `${f.value} ${pl(f.value, ["trójkąt", "trójkąty", "trójkątów"])} o zerowym polu.`, fix: "Nie blokują druku, pomijamy je w analizie. Warto je usunąć przy okazji naprawy siatki." },
    scale_small: { t: (f, n) => `Największy wymiar to ${n(f.value, 2)} mm.`, fix: "Prawie zawsze oznacza eksport w centymetrach albo w calach zamiast w milimetrach. Sprawdź jednostki przed drukiem." },
    scale_large: { t: (f, n) => `Największy wymiar to ${n(f.value / 1000, 2)} m.`, fix: "Sprawdź jednostki eksportu. Jeżeli model naprawdę ma tyle mieć, trzeba go pociąć na części." },
    too_big: { t: (f, n) => `Model ${f.value.map((v) => n(v, 0)).join(" x ")} mm nie mieści się na stole.`, fix: "Zmniejsz model albo potnij go na części i sklej po wydruku. Napisz do nas, podpowiemy, gdzie przeciąć, żeby nie było widać." },
    fits_rotated: { t: (f, n) => "Mieści się dopiero po obrocie.", fix: "To normalne i nic nie kosztuje, ale obrót zmienia kierunek warstw, a więc i wytrzymałość części." },
    too_thin: { t: (f, n) => `Większość modelu jest za cienka: ${(f.share * 100).toFixed(0)}% powierzchni poniżej progu ${n(f.limit, 2)} mm, ścianki schodzą do ${n(f.value, 2)} mm.`, fix: (f) => f.tech === "msla"
      ? "Pogrub ścianki. W żywicy granicy nie wyznacza rozdzielczość, tylko siła odklejania od folii przy każdej warstwie: taka ścianka zwykle urywa się w trakcie druku."
      : "Pogrub ścianki albo wybierz cieńszą dyszę. Poniżej progu drukarka nie ma jak ułożyć nawet jednej ścieżki i w tych miejscach powstaną dziury." },
    thin: { t: (f, n) => `${(f.share * 100).toFixed(0)}% powierzchni to ścianki poniżej ${n(f.limit, 2)} mm, czyli jedna ścieżka zamiast dwóch. Najcieńsze mają ${n(f.value, 2)} mm.`, fix: (f) => f.tech === "msla"
      ? "Wydrukuje się, ale taka ścianka bywa krucha po utwardzeniu i łatwo ją złamać przy myciu albo przy zdejmowaniu podpór."
      : "Jedna ścieżka to ścianka, która pęka przy nacisku. Świadomie stosuje się ją w obudowach i wzorach ażurowych, ale w częściach użytkowych warto pogrubić." },
    thickness_ok: { t: (f, n) => `Ścianki mają ${n(f.value, 2)} mm i więcej, z zapasem ponad progiem.`, fix: null },
    thin_detail: { t: (f, n) => `Drobne detale poniżej ${n(f.limit, 2)} mm na ${(f.share * 100).toFixed(0)}% powierzchni.`, fix: "To nie są ścianki, tylko faktura, napisy albo fazki. Wydrukują się zaokrąglone lub uproszczone i jest to normalna cecha druku, a nie usterka. Jeżeli ten detal ma być czytelny, cieńsza dysza albo żywica pokażą go lepiej." },
    thickness_skipped: { t: (f, n) => "Grubości ścianek nie zmierzyliśmy.", fix: "Na nieszczelnej siatce promień pomiarowy wylatuje przez dziurę i trafia w przypadkową ściankę po drugiej stronie modelu. Napraw siatkę i wgraj ponownie." },
    overhangs_many: { t: (f, n) => `${(f.value * 100).toFixed(0)}% powierzchni wymaga podpór.`, fix: "Podpory zużywają materiał i czas, a po ich usunięciu zostaje ślad. Rozważ obrót modelu albo pocięcie go na części drukowane osobno." },
    overhangs_some: { t: (f, n) => `${(f.value * 100).toFixed(0)}% powierzchni wymaga podpór.`, fix: null },
    small_base: { t: (f, n) => `Styk ze stołem to tylko ${n(f.value, 0)} mm2.`, fix: "Przy tak małej podstawie wydruk potrafi się oderwać w trakcie. Dodaj brim albo obróć model tak, żeby przylegał większą powierzchnią." },
  },
  en: {
    empty: { t: (f, n) => "The file contains no geometry.", fix: "Check that the export succeeded and the file is not empty." },
    holes: { t: (f, n) => `The mesh is not fully watertight: ${f.value} unpaired edges.`, fix: "Usually harmless: modern slicers repair small gaps like these on their own and print without complaint. Worth knowing all the same, because the volume the price is computed from is then approximate. One-click repair: Meshmixer (Analysis, Inspector), Blender (3D Print Toolbox) or the repair function in PrusaSlicer and Bambu Studio." },
    open_surface: { t: (f, n) => `The file is a surface, not a solid: ${Math.round((f.ratio || 0) * 100)}% of edges are boundary.`, fix: "This cannot be printed, because there is no inside to fill. It is usually a scan, an exported plane or an open shell. Give the surface a thickness (the Solidify modifier in Blender) or ask us to close the solid." },
    nonmanifold: { t: (f, n) => `The mesh is not a manifold: ${f.value} edges belong to more than two faces.`, fix: "Usually the result of merging solids without a boolean operation. Run a boolean union instead of overlapping objects." },
    reversed: { t: (f, n) => `${f.value} faces point the opposite way to their neighbours.`, fix: "Make the normals consistent: Shift+N in Blender, Edit then Make Solid in Meshmixer." },
    inverted: { t: (f, n) => "The whole mesh is turned inside out.", fix: "It looks right in the preview, but the slicer will treat the inside as the outside and print a solid block instead of a shell. Flip the normals." },
    degenerate: { t: (f, n) => `${f.value} zero-area triangles.`, fix: "They do not block printing and we skip them in the analysis. Worth clearing while repairing the mesh." },
    scale_small: { t: (f, n) => `The largest dimension is ${n(f.value, 2)} mm.`, fix: "This almost always means the file was exported in centimetres or inches rather than millimetres. Check the units before printing." },
    scale_large: { t: (f, n) => `The largest dimension is ${n(f.value / 1000, 2)} m.`, fix: "Check the export units. If the model really is that big, it has to be split into parts." },
    too_big: { t: (f, n) => `At ${f.value.map((v) => n(v, 0)).join(" x ")} mm the model does not fit on the build plate.`, fix: "Scale it down or split it and bond the parts after printing. Write to us and we will suggest where to cut so the seam does not show." },
    fits_rotated: { t: (f, n) => "It only fits after rotating.", fix: "That is normal and costs nothing, but rotation changes the layer direction and therefore the strength of the part." },
    too_thin: { t: (f, n) => `Most of the model is too thin: ${(f.share * 100).toFixed(0)}% of the surface sits below the ${n(f.limit, 2)} mm threshold, with walls down to ${n(f.value, 2)} mm.`, fix: (f) => f.tech === "msla"
      ? "Thicken the walls. In resin the limit is not resolution but the peel force as each layer separates from the film: a wall this thin usually tears off mid-print."
      : "Thicken the walls or choose a finer nozzle. Below the threshold the printer cannot lay down even one path and those areas will come out with holes." },
    thin: { t: (f, n) => `${(f.share * 100).toFixed(0)}% of the surface is below ${n(f.limit, 2)} mm, a single path rather than two. The thinnest measure ${n(f.value, 2)} mm.`, fix: (f) => f.tech === "msla"
      ? "It will print, but a wall this thin is brittle once cured and breaks easily during washing or support removal."
      : "A single path is a wall that cracks under pressure. It is used deliberately in enclosures and openwork patterns, but functional parts are better thicker." },
    thickness_ok: { t: (f, n) => `Walls measure ${n(f.value, 2)} mm and up, comfortably above the threshold.`, fix: null },
    thin_detail: { t: (f, n) => `Fine detail below ${n(f.limit, 2)} mm on ${(f.share * 100).toFixed(0)}% of the surface.`, fix: "These are not walls but texture, lettering or chamfers. They print rounded or simplified, which is a normal property of the process rather than a fault. If that detail has to stay legible, a finer nozzle or resin will show it better." },
    thickness_skipped: { t: (f, n) => "We did not measure wall thickness.", fix: "On a mesh with holes the measuring ray escapes through the gap and hits a random wall on the far side of the model. Repair the mesh and upload again." },
    overhangs_many: { t: (f, n) => `${(f.value * 100).toFixed(0)}% of the surface needs support.`, fix: "Support costs material and time, and leaves a mark where it is removed. Consider rotating the model or splitting it into separately printed parts." },
    overhangs_some: { t: (f, n) => `${(f.value * 100).toFixed(0)}% of the surface needs support.`, fix: null },
    small_base: { t: (f, n) => `Only ${n(f.value, 0)} mm2 touches the bed.`, fix: "With a footprint that small the print can come loose mid-job. Add a brim or rotate the model so more of it rests on the plate." },
  },
  de: {
    empty: { t: (f, n) => "Die Datei enthält keine Geometrie.", fix: "Prüfen Sie, ob der Export gelungen und die Datei nicht leer ist." },
    holes: { t: (f, n) => `Das Netz ist nicht vollständig geschlossen: ${f.value} Kanten ohne Gegenstück.`, fix: "Meist unkritisch: moderne Slicer reparieren solche kleinen Lücken selbst und drucken ohne Beanstandung. Gut zu wissen ist es dennoch, weil das Volumen, aus dem der Preis entsteht, dann angenähert ist. Reparatur per Klick: Meshmixer (Analysis, Inspector), Blender (3D Print Toolbox) oder die Reparaturfunktion in PrusaSlicer und Bambu Studio." },
    open_surface: { t: (f, n) => `Die Datei ist eine Fläche, kein Körper: ${Math.round((f.ratio || 0) * 100)}% der Kanten sind Rand.`, fix: "Das lässt sich nicht drucken, weil es kein Inneres gibt. Meist handelt es sich um einen Scan, eine exportierte Ebene oder eine offene Schale. Geben Sie der Fläche eine Dicke (Modifier Solidify in Blender) oder lassen Sie uns den Körper schließen." },
    nonmanifold: { t: (f, n) => `Das Netz ist keine Mannigfaltigkeit: ${f.value} Kanten gehören zu mehr als zwei Flächen.`, fix: "Meist Folge zusammengelegter Körper ohne boolesche Operation. Führen Sie eine boolesche Vereinigung durch, statt Objekte zu überlagern." },
    reversed: { t: (f, n) => `${f.value} Flächen zeigen entgegen ihren Nachbarn.`, fix: "Normalen vereinheitlichen: Shift+N in Blender, Edit und Make Solid in Meshmixer." },
    inverted: { t: (f, n) => "Das gesamte Netz ist auf links gedreht.", fix: "In der Vorschau sieht es richtig aus, der Slicer hält das Innere aber für außen und druckt einen Vollkörper statt einer Schale. Normalen umkehren." },
    degenerate: { t: (f, n) => `${f.value} Dreiecke ohne Fläche.`, fix: "Sie blockieren den Druck nicht und werden in der Analyse übersprungen. Bei der Netzreparatur ruhig mit entfernen." },
    scale_small: { t: (f, n) => `Die größte Abmessung beträgt ${n(f.value, 2)} mm.`, fix: "Das bedeutet fast immer Export in Zentimetern oder Zoll statt Millimetern. Einheiten vor dem Druck prüfen." },
    scale_large: { t: (f, n) => `Die größte Abmessung beträgt ${n(f.value / 1000, 2)} m.`, fix: "Exporteinheiten prüfen. Soll das Modell wirklich so groß sein, muss es geteilt werden." },
    too_big: { t: (f, n) => `Mit ${f.value.map((v) => n(v, 0)).join(" x ")} mm passt das Modell nicht auf die Bauplatte.`, fix: "Verkleinern oder teilen und nach dem Druck fügen. Schreiben Sie uns, wir schlagen eine Trennstelle vor, an der die Naht nicht auffällt." },
    fits_rotated: { t: (f, n) => "Passt erst nach Drehung.", fix: "Das ist normal und kostet nichts, ändert aber die Schichtrichtung und damit die Festigkeit des Teils." },
    too_thin: { t: (f, n) => `Der Großteil des Modells ist zu dünn: ${(f.share * 100).toFixed(0)}% der Oberfläche liegen unter der Grenze von ${n(f.limit, 2)} mm, die Wände gehen bis ${n(f.value, 2)} mm herunter.`, fix: (f) => f.tech === "msla"
      ? "Wände verstärken. Bei Harz setzt nicht die Auflösung die Grenze, sondern die Abzugskraft beim Ablösen jeder Schicht von der Folie: so dünne Wände reißen meist während des Drucks ab."
      : "Wände verstärken oder feinere Düse wählen. Unterhalb der Grenze kann der Drucker nicht einmal eine Bahn legen, dort entstehen Löcher." },
    thin: { t: (f, n) => `${(f.share * 100).toFixed(0)}% der Oberfläche liegen unter ${n(f.limit, 2)} mm, also eine Bahn statt zwei. Die dünnsten messen ${n(f.value, 2)} mm.`, fix: (f) => f.tech === "msla"
      ? "Sie druckt, ist nach dem Aushärten aber spröde und bricht leicht beim Waschen oder beim Entfernen der Stützen."
      : "Eine Bahn ergibt eine Wand, die unter Druck bricht. In Gehäusen und Durchbruchmustern wird das bewusst genutzt, Funktionsteile sollten dicker sein." },
    thickness_ok: { t: (f, n) => `Die Wände messen ${n(f.value, 2)} mm und mehr, mit Reserve über der Grenze.`, fix: null },
    thin_detail: { t: (f, n) => `Feine Details unter ${n(f.limit, 2)} mm auf ${(f.share * 100).toFixed(0)}% der Oberfläche.`, fix: "Das sind keine Wände, sondern Struktur, Schrift oder Fasen. Sie drucken abgerundet oder vereinfacht, was eine normale Eigenschaft des Verfahrens ist und kein Mangel. Soll das Detail lesbar bleiben, zeigen es eine feinere Düse oder Harz besser." },
    thickness_skipped: { t: (f, n) => "Die Wandstärke wurde nicht gemessen.", fix: "Bei einem offenen Netz entweicht der Messstrahl durch das Loch und trifft eine beliebige Wand auf der Gegenseite. Netz reparieren und erneut hochladen." },
    overhangs_many: { t: (f, n) => `${(f.value * 100).toFixed(0)}% der Oberfläche brauchen Stützen.`, fix: "Stützen kosten Material und Zeit und hinterlassen Spuren. Erwägen Sie eine Drehung oder eine Teilung des Modells." },
    overhangs_some: { t: (f, n) => `${(f.value * 100).toFixed(0)}% der Oberfläche brauchen Stützen.`, fix: null },
    small_base: { t: (f, n) => `Nur ${n(f.value, 0)} mm2 berühren die Platte.`, fix: "Bei so kleiner Auflage kann sich der Druck während des Laufs lösen. Brim hinzufügen oder Modell so drehen, dass mehr aufliegt." },
  },
};

const LEVEL = {
  blocker: { icon: XCircle, cls: "text-rose-300", box: "border-rose-400/25 bg-rose-500/5" },
  warning: { icon: AlertTriangle, cls: "text-amber-300", box: "border-amber-400/25 bg-amber-500/5" },
  info: { icon: Info, cls: "text-neutral-400", box: "border-white/10 bg-white/[0.02]" },
};

const CARD = "p-5 rounded-2xl bg-neutral-900 border border-neutral-800";

export default function PrintabilityCheck() {
  const { lang } = useLanguage();
  const L = L10N[lang] || L10N.pl;
  const F = FINDINGS[lang] || FINDINGS.pl;

  const [mesh, setMesh] = useState(null);      // { triangles, bbox, volumeCm3, surfaceAreaCm2, name }
  const [tech, setTech] = useState("fdm");
  const [nozzleId, setNozzleId] = useState("0.4");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Model przyslany z bramki w konfiguratorze. `pending` trzyma formularz
  // wgrywania zamkniety, zeby klient nie zaczal szukac pliku w chwili, gdy on
  // wlasnie do niego jedzie.
  const [handoff, setHandoff] = useState(null);
  const [pending, setPending] = useState(() => wantsHandoff());
  const inputRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  // Odbior modelu z konfiguratora. Siatka jest juz PO przeskalowaniu, wiec nie
  // parsujemy niczego ponownie: powtorne wczytanie pliku daloby oryginal, a
  // wiec inna odpowiedz na to samo pytanie. Technologie i dysze bierzemy stamtad
  // z tego samego powodu, bo to one zmieniaja werdykt.
  useEffect(() => {
    if (!wantsHandoff()) return;
    let cancelled = false;
    (async () => {
      const record = await waitForModelHandoff();
      if (cancelled) return;
      setPending(false);
      if (!record) return;
      if (record.tech === "fdm" || record.tech === "msla") setTech(record.tech);
      if (record.nozzleId) setNozzleId(record.nozzleId);
      setMesh({ triangles: trianglesFromPositions(record.positions), name: record.name || "model" });
      setHandoff({ scale: record.scale ?? 1 });
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setReport(null);
    setHandoff(null);
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const { parseMeshAsync } = await import("../../pricing/mesh.js");
      const data = await parseMeshAsync(buffer, file.name);
      if (!data?.triangles?.length) throw new Error("empty");
      setMesh({ ...data, name: file.name });
    } catch {
      setMesh(null);
      setError(L.error);
      setBusy(false);
    }
  }

  // Analiza rusza po wgraniu pliku ORAZ po kazdej zmianie technologii i dyszy.
  // Przelaczenie dyszy ma dawac natychmiastowa odpowiedz, bo cale narzedzie
  // sluzy do porownywania tych wariantow.
  useEffect(() => {
    if (!mesh) { setReport(null); setBusy(false); return; }
    let cancelled = false;
    setBusy(true);

    // Splaszczenie do jednej tablicy: przekazujemy ja bez kopiowania, a
    // struktura zagniezdzona kosztowalaby przy klonowaniu wiecej niz analiza.
    const tris = mesh.triangles;
    const positions = new Float32Array(tris.length * 9);
    for (let i = 0, o = 0; i < tris.length; i++, o += 9) {
      const [a, b, c] = tris[i];
      positions[o] = a[0]; positions[o + 1] = a[1]; positions[o + 2] = a[2];
      positions[o + 3] = b[0]; positions[o + 4] = b[1]; positions[o + 5] = b[2];
      positions[o + 6] = c[0]; positions[o + 7] = c[1]; positions[o + 8] = c[2];
    }

    workerRef.current?.terminate();
    const worker = new Worker(new URL("../../workers/printability.worker.js", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (ev) => {
      if (cancelled) return;
      setBusy(false);
      if (ev.data?.ok) { setReport(ev.data.report); setError(null); }
      else setError(L.error);
    };
    worker.onerror = () => { if (!cancelled) { setBusy(false); setError(L.error); } };
    worker.postMessage({ positions, tech, nozzleId, samples: 3000 }, [positions.buffer]);

    return () => { cancelled = true; worker.terminate(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesh, tech, nozzleId]);

  function reset() {
    workerRef.current?.terminate();
    setMesh(null);
    setReport(null);
    setError(null);
    setHandoff(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const worst = report?.findings?.[0]?.level;
  const verdict = worst === "blocker" ? "block" : worst === "warning" ? "warn" : "ok";
  const VERDICT = {
    ok: { text: L.verdictOk, icon: CheckCircle2, cls: "text-emerald-300", box: "border-emerald-400/25 bg-emerald-500/5" },
    warn: { text: L.verdictWarn, icon: AlertTriangle, cls: "text-amber-300", box: "border-amber-400/25 bg-amber-500/5" },
    block: { text: L.verdictBlock, icon: XCircle, cls: "text-rose-300", box: "border-rose-400/25 bg-rose-500/5" },
  }[verdict];

  const machine = MACHINES[tech === "msla" ? "msla" : "fdm"];
  // Separator dziesietny bierzemy z jezyka strony. Przyciski z etykieta "0.4"
  // obok tabeli z "0,4" wygladaja jak dwie rozne wartosci.
  const dec = lang === "en" ? "." : ",";
  const num = (v, d = 1) => v.toLocaleString(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "pl-PL", { minimumFractionDigits: d, maximumFractionDigits: d });

  return (
    <div className="space-y-5">

      {/* Wgranie pliku */}
      <div className={CARD}>
        {pending && !mesh ? (
          <div className="flex items-center gap-3 text-neutral-400 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
            {L.handoffWait}
          </div>
        ) : !mesh ? (
          <div className="text-center py-4">
            <Upload className="w-7 h-7 text-blue-400 mx-auto mb-3" />
            <div className="text-white font-medium text-sm mb-1">{L.dropTitle}</div>
            <p className="text-neutral-500 text-xs mb-4 max-w-sm mx-auto leading-relaxed">{L.dropHint}</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 text-neutral-950 font-semibold text-sm cursor-pointer hover:bg-blue-400 transition-colors">
              <input ref={inputRef} type="file" accept={ACCEPT} onChange={handleFile} className="hidden" />
              {L.dropBtn}
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-white text-sm font-mono truncate">{mesh.name}</span>
            <button onClick={reset} className="shrink-0 inline-flex items-center gap-1.5 text-neutral-500 hover:text-white text-xs transition-colors">
              <X className="w-3.5 h-3.5" />{L.remove}
            </button>
          </div>
        )}
        {error && <p className="text-rose-300 text-xs mt-3">{error}</p>}

        {/* Skad wzial sie ten model. Bez tego zdania klient widzi wypelniony
            formularz, ktorego nie wypelnial, i nie wie, czy patrzy na swoj plik
            ani czy w tej samej wielkosci. */}
        {handoff && (
          <p className="text-blue-300/80 text-xs leading-relaxed mt-3 pt-3 border-t border-white/10">
            {L.handoffDone}
            {Math.abs(handoff.scale - 1) > 0.001 && ` ${L.handoffScale(Math.round(handoff.scale * 100))}`}
          </p>
        )}
      </div>

      {mesh && (
        <>
          {/* Technologia i dysza nad wynikiem, bo to one go zmieniaja */}
          <div className={CARD}>
            <div className="text-xs uppercase tracking-widest text-blue-400 mb-3">{L.techLabel}</div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[["fdm", L.fdm], ["msla", L.msla]].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTech(id)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    tech === id
                      ? "bg-blue-500/20 border-blue-400 text-blue-300"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-blue-400/50 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tech === "fdm" && (
              <>
                <div className="text-xs uppercase tracking-widest text-blue-400 mb-3">{L.nozzleLabel}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {NOZZLES.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setNozzleId(n.id)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                        nozzleId === n.id
                          ? "bg-blue-500/20 border-blue-400 text-blue-300"
                          : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-blue-400/50 hover:text-white"
                      }`}
                    >
                      {n.id.replace(".", dec)} mm
                      {/* Rozroznienie, ktore chroni przed obietnica: dwie dysze
                          mamy zalozone na stale, dwie pozostale sa do analizy
                          i po uzgodnieniu, a nie do kliknięcia w zamowieniu. */}
                      <span className="block text-xs font-normal text-neutral-500 mt-0.5">
                        {n.inHouse ? L.inHouse : L.onRequest}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="text-neutral-500 text-xs mt-4">
              {L.machineLabel}: {machine.name}, {machine.build.x} x {machine.build.y} x {machine.build.z} mm
            </p>
          </div>

          {/* Podglad */}
          <div className={CARD}>
            <STLViewer triangles={mesh.triangles} bbox={mesh.bbox} />
          </div>

          {busy && (
            <div className={`${CARD} flex items-center gap-3 text-neutral-400 text-sm`}>
              <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
              <div>
                <div>{L.analyzing}</div>
                {mesh.triangles.length > 100000 && <div className="text-neutral-600 text-xs mt-0.5">{L.analyzingLong}</div>}
              </div>
            </div>
          )}

          {report && !busy && (
            <>
              {/* Werdykt */}
              <div className={`p-5 rounded-2xl border ${VERDICT.box}`}>
                <div className="flex items-center gap-2.5">
                  <VERDICT.icon className={`w-5 h-5 ${VERDICT.cls} shrink-0`} />
                  <h3 className={`font-semibold ${VERDICT.cls}`}>{VERDICT.text}</h3>
                </div>
              </div>

              {/* Ustalenia */}
              <div className="space-y-3">
                {report.findings.map((f) => {
                  const def = F[f.id];
                  if (!def) return null;
                  const lv = LEVEL[f.level];
                  return (
                    <div key={f.id} className={`p-4 rounded-2xl border ${lv.box}`}>
                      <div className="flex gap-3">
                        <lv.icon className={`w-4 h-4 ${lv.cls} shrink-0 mt-0.5`} />
                        <div>
                          <p className="text-white text-sm leading-relaxed">{def.t(f, num)}</p>
                          {def.fix && (
                            <p className="text-neutral-400 text-xs leading-relaxed mt-1.5">
                              {typeof def.fix === "function" ? def.fix(f) : def.fix}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Liczby */}
              <div className={CARD}>
                <div className="text-xs uppercase tracking-widest text-blue-400 mb-3">{L.statsTitle}</div>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  {[
                    [L.statSize, `${report.sizeMm.map((v) => num(v)).join(" x ")} mm`],
                    [L.statVolume, `${num(report.volumeCm3, 2)} cm3`],
                    [L.statArea, `${num(report.overhang.totalAreaMm2 / 100, 1)} cm2`],
                    [L.statTriangles, report.topology.triangleCount.toLocaleString("pl-PL")],
                    report.thickness && [L.statThickness, `${num(report.thickness.p1, 2)} mm`],
                    [L.statOverhang, `${(report.overhang.overhangShare * 100).toFixed(0)}%`],
                    [L.statBed, `${num(report.overhang.bedContactMm2 / 100, 1)} cm2`],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-white/5 pb-1.5">
                      <dt className="text-neutral-400">{k}</dt>
                      <dd className="text-white font-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <p className="text-neutral-500 text-xs leading-relaxed px-1">{L.disclaimer}</p>
            </>
          )}
        </>
      )}
    </div>
  );
}

export { L10N as PRINTABILITY_LABELS };
