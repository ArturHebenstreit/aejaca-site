// ============================================================
// BRAMKA DRUKOWALNOSCI PRZED DODANIEM DO KOSZYKA
// ============================================================
// Sprawdzarka pod `/toolstudio/printability/` byla wyspa: klient mogl ja
// pominac i zamowic wydruk plyty 0,3 mm dysza 0,4, a o problemie dowiadywal
// sie od nas, po zaplacie. Ten komponent wpina te sama analize w kalkulator
// i w konfigurator sklepu, z parametrami, ktore klient WLASNIE wybral.
//
// Zakres blokady jest waski i zostal ZWEZONY po tym, jak narzedzie zaczelo
// odrzucac poprawne modele. Blokujemy wylacznie to, czego naprawde nie da sie
// wykonac: plik bedacy powierzchnia zamiast bryly, model wiekszy od stolu
// oraz model, ktorego WIEKSZOSC powierzchni jest ponizej jednej sciezki.
//
// Wszystko inne jest informacja: drobne nieszczelnosci (slicer naprawia je
// sam), pojedyncza sciezka zamiast dwoch, napisy i faktura ponizej progu,
// duzo nawisow. Narzedzie, ktore odrzuca poprawne modele, szkodzi bardziej
// niz jego brak, bo klient przestaje mu wierzyc i klika dalej bez czytania.
//
// UWAGA CO DO CHARAKTERU POKWITOWANIA. To NIE jest zrzeczenie sie uprawnien
// konsumenta i nie wolno tak tego formulowac. Konsument nie moze z gory
// zrzec sie praw z tytulu niezgodnosci towaru z umowa, a klauzula, ktora tak
// stanowi, jest abuzywna i niewazna. Chroni nas co innego i mocniej:
// udokumentowanie, ze ujawnilismy konkretna wlasciwosc JEGO pliku przed
// zamowieniem, a on polecil wykonanie mimo to. Wynik jest wtedy zgodny
// z umowa, bo to on okreslil specyfikacje.
//
// Zapis idzie do `params.printability`, czyli tam, gdzie i tak jada parametry
// pozycji. Dzieki temu trafia do zamowienia i do maili bez osobnej kolumny
// i bez osobnej sciezki, ktora mogloby zabraknac przy nastepnej zmianie.

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, XCircle, Info, Loader2, Wrench } from "lucide-react";
import { nozzleFromPrecision } from "../../analysis/printability.js";
import { saveModelHandoff, flattenTriangles, HANDOFF_URL } from "../../analysis/modelHandoff.js";

export { nozzleFromPrecision };

// KOLEJNOSC MA ZNACZENIE I ZOSTALA ODWROCONA.
//
// Wczesniej bramka zaczynala od alarmu i zadania pokwitowania. Klient, ktory
// chcial tylko czegos zamowic, dostawal na wejsciu liste swoich win i pole do
// podpisania. Czesc odchodzila, a czesc klikala bez czytania, wiec pokwitowanie
// bylo formalnie wazne i praktycznie bezwartosciowe, bo nikt go nie przeczytal.
//
// Teraz najpierw pokazujemy, JAK TO NAPRAWIC, spokojnie i konkretnie. Dopiero
// gdy klient swiadomie wybierze "zamawiam mimo to", pojawia sie opis ryzyka i
// pokwitowanie. Wtedy jest ono realna decyzja, a nie odruchem, i dopiero wtedy
// jest cos warte jako dowod ustalen.

const L10N = {
  pl: {
    checking: "Sprawdzam model...",
    remedyTitle: "Ten plik da się poprawić przed drukiem",
    remedyLead: "Zanim zamówisz, warto to zrobić. Każda z poniższych rzeczy wpływa na to, jak wyjdzie wydruk.",
    proceed: "Rozumiem, chcę zamówić ten plik bez zmian",
    back: "Wrócę i poprawię plik",
    riskTitle: "Co się wtedy może stać",
    blockTitle: "Ten model ma problem, który wpłynie na wydruk",
    warnTitle: "Uwagi do modelu",
    accept: "Rozumiem powyższe i mimo to polecam wykonanie wydruku z tego pliku, z tymi parametrami.",
    acceptNote: "Zaznaczenie zapiszemy przy zamówieniu i powtórzymy w mailu potwierdzającym. Nie odbiera Ci to żadnych uprawnień konsumenta; potwierdza tylko, że wykonujemy wydruk według Twojej specyfikacji, mimo ujawnionej właściwości pliku.",
    mustAccept: "Zaznacz potwierdzenie, żeby dodać do koszyka.",
    checkLink: "Zobacz pełną analizę modelu",
  },
  en: {
    checking: "Checking the model...",
    remedyTitle: "This file can be improved before printing",
    remedyLead: "Worth doing before you order. Each item below changes how the print comes out.",
    proceed: "I understand, print this file as it is",
    back: "I will go back and fix the file",
    riskTitle: "What can happen then",
    blockTitle: "This model has a problem that will affect the print",
    warnTitle: "Notes on the model",
    accept: "I understand the above and still instruct you to print from this file with these settings.",
    acceptNote: "We record this with the order and repeat it in the confirmation email. It takes none of your consumer rights away; it only confirms that we print to your specification despite the disclosed property of the file.",
    mustAccept: "Tick the confirmation to add this to the cart.",
    checkLink: "See the full model analysis",
  },
  de: {
    checking: "Modell wird geprüft...",
    remedyTitle: "Diese Datei lässt sich vor dem Druck verbessern",
    remedyLead: "Vor der Bestellung lohnt es sich. Jeder Punkt unten verändert das Druckergebnis.",
    proceed: "Verstanden, diese Datei unverändert drucken",
    back: "Ich gehe zurück und korrigiere die Datei",
    riskTitle: "Was dann passieren kann",
    blockTitle: "Dieses Modell hat ein Problem, das den Druck beeinflusst",
    warnTitle: "Hinweise zum Modell",
    accept: "Ich habe das Obige verstanden und beauftrage den Druck aus dieser Datei mit diesen Einstellungen dennoch.",
    acceptNote: "Wir halten das mit der Bestellung fest und wiederholen es in der Bestätigungsmail. Es nimmt Ihnen keine Verbraucherrechte; es bestätigt nur, dass wir nach Ihrer Vorgabe drucken, trotz der offengelegten Eigenschaft der Datei.",
    mustAccept: "Bestätigung ankreuzen, um in den Warenkorb zu legen.",
    checkLink: "Vollständige Modellanalyse ansehen",
  },
};

/** Krotkie opisy do bramki. Pelne wyjasnienia i porady sa na stronie narzedzia. */
const SHORT = {
  pl: {
    holes: (f, n) => `Siatka nie jest w pełni szczelna (${f.value} krawędzi bez pary). Slicer zwykle naprawia to sam, ale objętość, z której liczymy cenę, jest wtedy przybliżona.`,
    open_surface: (f, n) => `Plik jest powierzchnią, a nie bryłą (${Math.round((f.ratio || 0) * 100)}% krawędzi to brzeg). Nie wiadomo, co jest wnętrzem, więc nie ma czego wypełnić.`,
    nonmanifold: (f, n) => `Siatka nie jest rozmaitością (${f.value} krawędzi przy więcej niż dwóch ściankach).`,
    reversed: (f, n) => `${f.value} ścianek jest odwróconych względem sąsiadów.`,
    inverted: (f, n) => "Siatka jest wywrócona na lewą stronę: slicer wydrukuje pełną bryłę zamiast skorupy.",
    degenerate: (f, n) => `${f.value} trójkątów o zerowym polu.`,
    scale_small: (f, n) => `Największy wymiar to ${n(f.value, 2)} mm. To zwykle eksport w centymetrach albo w calach.`,
    scale_large: (f, n) => `Największy wymiar to ${n(f.value / 1000, 2)} m. Sprawdź jednostki eksportu.`,
    too_big: (f, n) => `Model ${f.value.map((v) => n(v, 0)).join(" x ")} mm nie mieści się na stole.`,
    fits_rotated: (f, n) => "Mieści się dopiero po obrocie, co zmienia kierunek warstw i wytrzymałość.",
    too_thin: (f, n) => `${(f.share * 100).toFixed(0)}% powierzchni modelu jest cieńsze niż ${n(f.limit, 2)} mm, czyli niż jedna ścieżka przy wybranych ustawieniach. W tych miejscach drukarka nie ma czego ułożyć.`,
    thin: (f, n) => `${(f.share * 100).toFixed(0)}% powierzchni to ścianki poniżej ${n(f.limit, 2)} mm, czyli jedna ścieżka. Wydrukują się, ale pękają przy nacisku.`,
    overhangs_many: (f, n) => `${(f.value * 100).toFixed(0)}% powierzchni wymaga podpór; po ich usunięciu zostaje ślad.`,
    small_base: (f, n) => `Styk ze stołem to tylko ${n(f.value, 0)} mm2, wydruk może się oderwać w trakcie.`,
  },
  en: {
    holes: (f, n) => `The mesh is not fully watertight (${f.value} unpaired edges). The slicer usually repairs this itself, but the volume we price from is then approximate.`,
    open_surface: (f, n) => `The file is a surface, not a solid (${Math.round((f.ratio || 0) * 100)}% of edges are boundary). There is no inside to fill.`,
    nonmanifold: (f, n) => `The mesh is not a manifold (${f.value} edges with more than two faces).`,
    reversed: (f, n) => `${f.value} faces point the opposite way to their neighbours.`,
    inverted: (f, n) => "The mesh is inside out: the slicer will print a solid block instead of a shell.",
    degenerate: (f, n) => `${f.value} zero-area triangles.`,
    scale_small: (f, n) => `The largest dimension is ${n(f.value, 2)} mm, which usually means an export in centimetres or inches.`,
    scale_large: (f, n) => `The largest dimension is ${n(f.value / 1000, 2)} m. Check the export units.`,
    too_big: (f, n) => `At ${f.value.map((v) => n(v, 0)).join(" x ")} mm the model does not fit on the plate.`,
    fits_rotated: (f, n) => "It only fits after rotating, which changes the layer direction and the strength.",
    too_thin: (f, n) => `${(f.share * 100).toFixed(0)}% of the model is thinner than ${n(f.limit, 2)} mm, which is one path at the chosen settings. The printer has nothing to lay down there.`,
    thin: (f, n) => `${(f.share * 100).toFixed(0)}% of the surface is below ${n(f.limit, 2)} mm, a single path. It prints, but cracks under pressure.`,
    overhangs_many: (f, n) => `${(f.value * 100).toFixed(0)}% of the surface needs support, which leaves a mark where removed.`,
    small_base: (f, n) => `Only ${n(f.value, 0)} mm2 touches the bed, so the print can come loose mid-job.`,
  },
  de: {
    holes: (f, n) => `Das Netz ist nicht vollständig geschlossen (${f.value} Kanten ohne Gegenstück). Der Slicer repariert das meist selbst, das Volumen für den Preis ist dann aber angenähert.`,
    open_surface: (f, n) => `Die Datei ist eine Fläche, kein Körper (${Math.round((f.ratio || 0) * 100)}% der Kanten sind Rand). Es gibt kein Inneres zum Füllen.`,
    nonmanifold: (f, n) => `Das Netz ist keine Mannigfaltigkeit (${f.value} Kanten mit mehr als zwei Flächen).`,
    reversed: (f, n) => `${f.value} Flächen zeigen entgegen ihren Nachbarn.`,
    inverted: (f, n) => "Das Netz ist auf links gedreht: der Slicer druckt einen Vollkörper statt einer Schale.",
    degenerate: (f, n) => `${f.value} Dreiecke ohne Fläche.`,
    scale_small: (f, n) => `Die größte Abmessung beträgt ${n(f.value, 2)} mm, meist ein Export in Zentimetern oder Zoll.`,
    scale_large: (f, n) => `Die größte Abmessung beträgt ${n(f.value / 1000, 2)} m. Exporteinheiten prüfen.`,
    too_big: (f, n) => `Mit ${f.value.map((v) => n(v, 0)).join(" x ")} mm passt das Modell nicht auf die Platte.`,
    fits_rotated: (f, n) => "Passt erst nach Drehung, was Schichtrichtung und Festigkeit ändert.",
    too_thin: (f, n) => `${(f.share * 100).toFixed(0)}% des Modells sind dünner als ${n(f.limit, 2)} mm, also dünner als eine Bahn bei den gewählten Einstellungen. Dort kann der Drucker nichts ablegen.`,
    thin: (f, n) => `${(f.share * 100).toFixed(0)}% der Oberfläche liegen unter ${n(f.limit, 2)} mm, also eine Bahn. Es druckt, bricht aber unter Druck.`,
    overhangs_many: (f, n) => `${(f.value * 100).toFixed(0)}% der Oberfläche brauchen Stützen, deren Entfernung Spuren hinterlässt.`,
    small_base: (f, n) => `Nur ${n(f.value, 0)} mm2 berühren die Platte, der Druck kann sich lösen.`,
  },
};

// ============================================================
// JAK TO NAPRAWIC
// ============================================================
// To jest tresc, ktora klient widzi PIERWSZA. Ma byc instrukcja, nie zarzutem.
// Kazda pozycja mowi, co konkretnie zrobic, a nie co jest zle: nazwa narzedzia
// albo liczba, ktora trzeba osiagnac. Klient bez doswiadczenia ma po tym
// wiedziec, gdzie kliknac, a nie tylko, ze ma problem.
//
// Drugi argument to formater liczb, trzeci to kontekst wydruku, bo czesc rad
// zalezy od technologii (granica przy zywicy jest kilkakrotnie nizsza niz przy
// FDM, wiec zmiana technologii bywa najtansza naprawa).

const REMEDY = {
  pl: {
    holes: () => "Zamknij dziury w siatce: Blender ma dodatek 3D Print Toolbox (Make Manifold), darmowy Meshmixer ma Analysis > Inspector i naprawia to jednym kliknięciem. My też to zrobimy przed drukiem, ale wtedy objętość, z której policzyliśmy cenę, jest przybliżona.",
    open_surface: () => "Nadaj powierzchni grubość, żeby stała się bryłą: w Blenderze modyfikator Solidify, w Fusion polecenie Thicken. Bez tego nie ma czego wypełnić.",
    nonmanifold: () => "Usuń krawędzie łączące więcej niż dwie ścianki: Blender, tryb edycji, Select > All by Trait > Non Manifold, potem Mesh > Clean Up.",
    reversed: () => "Przelicz normalne: Blender, zaznacz wszystko w trybie edycji i naciśnij Shift+N.",
    inverted: () => "Odwróć normalne na zewnątrz: Blender, tryb edycji, Mesh > Normals > Flip.",
    degenerate: () => "Usuń trójkąty o zerowym polu: Blender, Mesh > Clean Up > Merge by Distance, potem Degenerate Dissolve.",
    scale_small: () => "Sprawdź jednostkę eksportu. Przy zapisie STL albo OBJ ustaw milimetry, albo popraw wielkość suwakiem poniżej.",
    scale_large: () => "Sprawdź jednostkę eksportu: prawdopodobnie zapisano w milimetrach coś, co miało być w metrach, albo odwrotnie.",
    too_big: () => "Zmniejsz model suwakiem wielkości, albo potnij go na części i sklej po wydruku. Przy cięciu zaplanujemy szew na krawędzi, gdzie będzie najmniej widoczny.",
    fits_rotated: () => "Nic nie musisz robić, ustawimy model na stole sami. Jeżeli zależy Ci na wytrzymałości w konkretnym kierunku, napisz o tym w uwagach.",
    too_thin: (f, n, c) => `Pogrub cienkie miejsca do co najmniej ${n(f.limit, 2)} mm${c.growFactor ? `, albo powiększ cały model około ${n(c.growFactor, 1)} raza` : ""}${c.tech === "fdm" ? ", albo wybierz druk z żywicy, gdzie granica jest kilkakrotnie niższa" : ""}.`,
    thin: (f, n, c) => `Pogrub te ścianki do około ${n(f.limit * 2, 2)} mm, czyli dwóch ścieżek. Wtedy przestają pękać przy nacisku.${c.tech === "fdm" ? " Alternatywa: druk z żywicy." : ""}`,
    overhangs_many: () => "Nic nie musisz robić, dobierzemy ustawienie na stole i podpory. Jeżeli któraś powierzchnia ma być gładka, napisz która, obrócimy model tak, żeby podpory jej nie dotykały.",
    small_base: () => "Nic nie musisz robić, dodamy brim albo raft. Jeżeli model ma stać na wąskiej podstawie, rozważ dodanie płaskiej stopki w modelu.",
  },
  en: {
    holes: () => "Close the holes in the mesh: Blender ships the 3D Print Toolbox add-on (Make Manifold), and the free Meshmixer fixes it from Analysis > Inspector in one click. We can also do it before printing, but then the volume we priced from is approximate.",
    open_surface: () => "Give the surface a thickness so it becomes a solid: the Solidify modifier in Blender, Thicken in Fusion. Without it there is no inside to fill.",
    nonmanifold: () => "Remove edges shared by more than two faces: Blender, edit mode, Select > All by Trait > Non Manifold, then Mesh > Clean Up.",
    reversed: () => "Recalculate the normals: in Blender select everything in edit mode and press Shift+N.",
    inverted: () => "Flip the normals outward: Blender, edit mode, Mesh > Normals > Flip.",
    degenerate: () => "Remove zero-area triangles: Blender, Mesh > Clean Up > Merge by Distance, then Degenerate Dissolve.",
    scale_small: () => "Check the export unit. Set millimetres when saving STL or OBJ, or correct the size with the slider below.",
    scale_large: () => "Check the export unit: something meant to be metres was probably saved as millimetres, or the other way round.",
    too_big: () => "Scale the model down with the size slider, or split it into parts and bond them after printing. If we split it, we plan the seam along an edge where it shows least.",
    fits_rotated: () => "Nothing to do, we will place it on the plate ourselves. If strength in a particular direction matters, say so in the notes.",
    too_thin: (f, n, c) => `Thicken the thin areas to at least ${n(f.limit, 2)} mm${c.growFactor ? `, or scale the whole model up about ${n(c.growFactor, 1)} times` : ""}${c.tech === "fdm" ? ", or switch to resin printing, where the limit is several times lower" : ""}.`,
    thin: (f, n, c) => `Thicken those walls to about ${n(f.limit * 2, 2)} mm, which is two paths. They then stop cracking under pressure.${c.tech === "fdm" ? " Alternative: resin printing." : ""}`,
    overhangs_many: () => "Nothing to do, we will choose the orientation and supports. If a particular surface must stay smooth, tell us which and we will turn the model so the supports miss it.",
    small_base: () => "Nothing to do, we will add a brim or raft. If the model stands on a narrow base, consider adding a flat foot to the model.",
  },
  de: {
    holes: () => "Schließen Sie die Löcher im Netz: Blender bringt das Add-on 3D Print Toolbox (Make Manifold) mit, das kostenlose Meshmixer erledigt es unter Analysis > Inspector mit einem Klick. Wir können es auch vor dem Druck tun, dann ist das Volumen für den Preis aber angenähert.",
    open_surface: () => "Geben Sie der Fläche eine Dicke, damit ein Körper entsteht: Modifikator Solidify in Blender, Thicken in Fusion. Sonst gibt es nichts zu füllen.",
    nonmanifold: () => "Entfernen Sie Kanten mit mehr als zwei Flächen: Blender, Bearbeitungsmodus, Select > All by Trait > Non Manifold, dann Mesh > Clean Up.",
    reversed: () => "Normalen neu berechnen: in Blender im Bearbeitungsmodus alles auswählen und Shift+N drücken.",
    inverted: () => "Normalen nach außen drehen: Blender, Bearbeitungsmodus, Mesh > Normals > Flip.",
    degenerate: () => "Dreiecke ohne Fläche entfernen: Blender, Mesh > Clean Up > Merge by Distance, dann Degenerate Dissolve.",
    scale_small: () => "Prüfen Sie die Exporteinheit. Beim Speichern als STL oder OBJ Millimeter einstellen, oder die Größe unten mit dem Regler korrigieren.",
    scale_large: () => "Prüfen Sie die Exporteinheit: vermutlich wurde in Millimetern gespeichert, was Meter sein sollte, oder umgekehrt.",
    too_big: () => "Verkleinern Sie das Modell mit dem Größenregler, oder teilen Sie es und fügen Sie es nach dem Druck zusammen. Beim Teilen legen wir die Naht an eine möglichst unauffällige Kante.",
    fits_rotated: () => "Nichts zu tun, wir richten das Modell selbst aus. Wenn die Festigkeit in einer bestimmten Richtung zählt, schreiben Sie es in die Hinweise.",
    too_thin: (f, n, c) => `Verdicken Sie die dünnen Stellen auf mindestens ${n(f.limit, 2)} mm${c.growFactor ? `, oder skalieren Sie das ganze Modell etwa um das ${n(c.growFactor, 1)}-fache` : ""}${c.tech === "fdm" ? ", oder wechseln Sie zum Harzdruck, wo die Grenze um ein Vielfaches niedriger liegt" : ""}.`,
    thin: (f, n, c) => `Verdicken Sie diese Wände auf etwa ${n(f.limit * 2, 2)} mm, also zwei Bahnen. Dann brechen sie nicht mehr unter Druck.${c.tech === "fdm" ? " Alternative: Harzdruck." : ""}`,
    overhangs_many: () => "Nichts zu tun, wir wählen Ausrichtung und Stützen. Soll eine bestimmte Fläche glatt bleiben, sagen Sie welche, dann drehen wir das Modell entsprechend.",
    small_base: () => "Nichts zu tun, wir ergänzen Brim oder Raft. Steht das Modell auf schmaler Basis, erwägen Sie einen flachen Fuß im Modell.",
  },
};

/**
 * @param {number[][][]} triangles geometria z parsera, juz po przeskalowaniu
 * @param {"fdm"|"msla"} tech
 * @param {string} [nozzleId] tylko dla FDM
 * @param {string} [fileName] nazwa pliku, przekazywana na strone pelnej analizy
 * @param {number} [scale] skala, w ktorej klient zamawia, do opisu na tamtej stronie
 * @param {(record: object|null) => void} onResult zapis do `params.printability`
 */
export default function PrintabilityGate({ triangles, tech, nozzleId = "0.4", lang = "pl", fileName = null, scale = 1, onResult }) {
  const L = L10N[lang] || L10N.pl;
  const S = SHORT[lang] || SHORT.pl;

  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  // "remedy" to ekran instrukcji naprawy, "risk" to opis ryzyka z pokwitowaniem.
  // Zaczynamy zawsze od instrukcji, takze po zmianie pliku albo parametrow.
  const [stage, setStage] = useState("remedy");
  const workerRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (!triangles?.length) { setReport(null); setAccepted(false); setStage("remedy"); onResultRef.current?.(null); return; }
    let cancelled = false;
    setBusy(true);
    setAccepted(false);
    setStage("remedy");

    // Analiza idzie na geometrii W SKALI ZAMOWIENIA, bo to ona zostanie
    // wydrukowana. Model zmniejszony o polowe ma o polowe cienszy mur.
    const positions = flattenTriangles(triangles, scale);

    workerRef.current?.terminate();
    const worker = new Worker(new URL("../../workers/printability.worker.js", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (ev) => {
      if (cancelled) return;
      setBusy(false);
      setReport(ev.data?.ok ? ev.data.report : null);
    };
    // Awaria analizy nie moze blokowac sprzedazy. Lepiej sprzedac bez
    // ostrzezenia niz nie sprzedac nic z powodu bledu w naszym kodzie.
    worker.onerror = () => { if (!cancelled) { setBusy(false); setReport(null); } };
    // Mniej probek niz na stronie narzedzia: tu liczy sie odpowiedz w trakcie
    // konfigurowania, a nie trzecie miejsce po przecinku.
    worker.postMessage({ positions, tech, nozzleId, samples: 1500 }, [positions.buffer]);

    return () => { cancelled = true; worker.terminate(); };
  }, [triangles, tech, nozzleId, scale]);

  // Separator dziesietny z jezyka strony: "0.30 mm" obok "0,4 mm" na
  // przyciskach czyta sie jak dwie rozne jednostki.
  const num = (v, d = 1) => Number(v).toLocaleString(
    lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "pl-PL",
    { minimumFractionDigits: d, maximumFractionDigits: d }
  );

  const blockers = report?.findings?.filter((f) => f.level === "blocker") || [];
  const warnings = report?.findings?.filter((f) => f.level === "warning") || [];
  const needsAccept = blockers.length > 0;

  // Zapis do pozycji zamowienia. Trzymamy sam identyfikator i liczby, bez
  // tekstow: opisy zmieniaja sie razem z jezykiem i z redakcja, a zapis ma
  // opisywac to, co bylo pokazane, jeszcze za dwa lata.
  useEffect(() => {
    if (!report) { onResultRef.current?.(null); return; }
    const strip = (f) => ({ id: f.id, level: f.level, value: f.value, limit: f.limit, share: f.share });
    onResultRef.current?.({
      tech,
      nozzle: tech === "fdm" ? nozzleId : null,
      // Skala nalezy do zapisu, bo ustalenia dotycza modelu W TEJ wielkosci.
      // Bez niej nie da sie pozniej odtworzyc, co dokladnie klientowi pokazano.
      scale: Number(scale) || 1,
      thinnestMm: report.thickness ? Number(report.thickness.p1.toFixed(3)) : null,
      watertight: report.topology.isWatertight,
      findings: [...blockers, ...warnings].map(strip),
      blocked: needsAccept,
      accepted: needsAccept ? accepted : null,
      // Slad calej drogi, a nie tylko jej konca. Przy sporze liczy sie to, ze
      // klient dostal instrukcje naprawy i mimo to polecil wykonanie, a nie
      // samo zaznaczenie pola.
      remediesShown: true,
      proceededAnyway: stage === "risk",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, accepted, stage, tech, nozzleId, scale]);

  if (busy) {
    return (
      <div className="flex items-center gap-2 text-neutral-400 text-xs mt-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
        {L.checking}
      </div>
    );
  }

  if (!report || (!blockers.length && !warnings.length)) return null;

  const wszystkie = [...blockers, ...warnings];
  const R = REMEDY[lang] || REMEDY.pl;

  // Kontekst dla porad, ktore zaleza od wydruku. growFactor mowi, ile razy
  // trzeba powiekszyc model, zeby najciensze miejsce doszlo do granicy: to
  // jedyna rada, ktora klient moze wykonac jednym ruchem suwaka.
  const thinnest = report.thickness?.p1 ?? null;
  const limit = wszystkie.find((f) => f.id === "too_thin" || f.id === "thin")?.limit ?? null;
  const ctx = {
    tech,
    nozzleId,
    thinnestMm: thinnest,
    growFactor: thinnest && limit && thinnest > 0 && limit / thinnest > 1.05 ? limit / thinnest : null,
  };

  // ------------------------------------------------------------
  // KROK 1: jak to naprawic
  // ------------------------------------------------------------
  if (stage === "remedy") {
    return (
      <div className="mt-4 rounded-2xl border border-blue-400/25 bg-blue-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="w-4 h-4 text-blue-300 shrink-0" />
          <h4 className="text-sm font-semibold text-blue-200">{L.remedyTitle}</h4>
        </div>
        <p className="text-neutral-400 text-xs leading-relaxed mb-3">{L.remedyLead}</p>

        <ul className="space-y-2.5 mb-3">
          {wszystkie.map((f) => (
            <li key={f.id} className="text-xs leading-relaxed">
              <span className="block text-neutral-400">{S[f.id]?.(f, num)}</span>
              {R[f.id] && (
                <span className="block text-neutral-200 mt-0.5">{R[f.id](f, num, ctx)}</span>
              )}
            </li>
          ))}
        </ul>

        <ModelLink />

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setStage("risk")}
            className="flex-1 px-3 py-2 rounded-lg border border-white/15 bg-white/[0.02] text-neutral-300 text-xs hover:border-white/30 transition-colors"
          >
            {L.proceed}
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // KROK 2: co z tego wynika, i pokwitowanie
  // ------------------------------------------------------------
  const Icon = needsAccept ? XCircle : AlertTriangle;
  const tone = needsAccept
    ? { text: "text-rose-300", box: "border-rose-400/30 bg-rose-500/5" }
    : { text: "text-amber-300", box: "border-amber-400/25 bg-amber-500/5" };

  return (
    <div className={`mt-4 rounded-2xl border p-4 ${tone.box}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${tone.text} shrink-0`} />
        <h4 className={`text-sm font-semibold ${tone.text}`}>{needsAccept ? L.blockTitle : L.riskTitle}</h4>
      </div>

      {/* Na tym ekranie pokazujemy KOMPLET ustalen, takze zwykle ostrzezenia.
          Pokwitowanie ma obejmowac to, co klient realnie widzial, a nie wybor
          z listy zrobiony przez nas. */}
      <ul className="space-y-1.5 mb-3">
        {wszystkie.map((f) => (
          <li key={f.id} className="text-neutral-300 text-xs leading-relaxed flex gap-2">
            {f.level === "warning" && <Info className="w-3 h-3 shrink-0 mt-0.5 text-neutral-500" />}
            <span>{S[f.id]?.(f, num)}</span>
          </li>
        ))}
      </ul>

      <ModelLink />

      <button
        type="button"
        onClick={() => { setStage("remedy"); setAccepted(false); }}
        className="block text-neutral-400 hover:text-neutral-200 text-xs mb-3 underline underline-offset-2"
      >
        {L.back}
      </button>

      {needsAccept && (
        <>
          <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-white/10">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-rose-400"
            />
            <span className="text-white text-xs leading-relaxed">{L.accept}</span>
          </label>
          <p className="text-neutral-500 text-xs leading-relaxed mt-2">{L.acceptNote}</p>
          {!accepted && <p className="text-rose-300 text-xs mt-2">{L.mustAccept}</p>}
        </>
      )}
    </div>
  );

  /* Odnosnik do pelnej analizy. Model jedzie razem z nim. Zapis rusza w obsludze
     klikniecia i NIE wstrzymuje przejscia: gdyby czekac na jego koniec,
     przegladarka uznalaby otwarcie karty za wyskakujace okienko i by je
     zablokowala. Strona docelowa czeka na rekord, wiec wolniejszy zapis niczego
     nie psuje, a nieudany zostawia ja z pustym formularzem, czyli w stanie
     sprzed tej zmiany. */
  function ModelLink() {
    return (
      <a
        href={HANDOFF_URL}
        target="_blank"
        rel="noopener"
        onClick={() => {
          if (!triangles?.length) return;
          saveModelHandoff({
            positions: flattenTriangles(triangles, scale),
            tech,
            nozzleId: tech === "fdm" ? nozzleId : null,
            name: fileName,
            scale,
          });
        }}
        className="inline-block text-blue-400 hover:text-blue-300 text-xs mb-3"
      >
        {L.checkLink}
      </a>
    );
  }
}
