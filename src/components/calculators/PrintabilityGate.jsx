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
import { AlertTriangle, XCircle, Info, Loader2 } from "lucide-react";
import { nozzleFromPrecision } from "../../analysis/printability.js";

export { nozzleFromPrecision };

const L10N = {
  pl: {
    checking: "Sprawdzam model...",
    blockTitle: "Ten model ma problem, który wpłynie na wydruk",
    warnTitle: "Uwagi do modelu",
    accept: "Rozumiem powyższe i mimo to polecam wykonanie wydruku z tego pliku, z tymi parametrami.",
    acceptNote: "Zaznaczenie zapiszemy przy zamówieniu i powtórzymy w mailu potwierdzającym. Nie odbiera Ci to żadnych uprawnień konsumenta; potwierdza tylko, że wykonujemy wydruk według Twojej specyfikacji, mimo ujawnionej właściwości pliku.",
    mustAccept: "Zaznacz potwierdzenie, żeby dodać do koszyka.",
    checkLink: "Zobacz pełną analizę modelu",
  },
  en: {
    checking: "Checking the model...",
    blockTitle: "This model has a problem that will affect the print",
    warnTitle: "Notes on the model",
    accept: "I understand the above and still instruct you to print from this file with these settings.",
    acceptNote: "We record this with the order and repeat it in the confirmation email. It takes none of your consumer rights away; it only confirms that we print to your specification despite the disclosed property of the file.",
    mustAccept: "Tick the confirmation to add this to the cart.",
    checkLink: "See the full model analysis",
  },
  de: {
    checking: "Modell wird geprüft...",
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

/**
 * @param {number[][][]} triangles geometria z parsera, juz po przeskalowaniu
 * @param {"fdm"|"msla"} tech
 * @param {string} [nozzleId] tylko dla FDM
 * @param {(record: object|null) => void} onResult zapis do `params.printability`
 */
export default function PrintabilityGate({ triangles, tech, nozzleId = "0.4", lang = "pl", onResult }) {
  const L = L10N[lang] || L10N.pl;
  const S = SHORT[lang] || SHORT.pl;

  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const workerRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (!triangles?.length) { setReport(null); setAccepted(false); onResultRef.current?.(null); return; }
    let cancelled = false;
    setBusy(true);
    setAccepted(false);

    const positions = new Float32Array(triangles.length * 9);
    for (let i = 0, o = 0; i < triangles.length; i++, o += 9) {
      const [a, b, c] = triangles[i];
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
      setReport(ev.data?.ok ? ev.data.report : null);
    };
    // Awaria analizy nie moze blokowac sprzedazy. Lepiej sprzedac bez
    // ostrzezenia niz nie sprzedac nic z powodu bledu w naszym kodzie.
    worker.onerror = () => { if (!cancelled) { setBusy(false); setReport(null); } };
    // Mniej probek niz na stronie narzedzia: tu liczy sie odpowiedz w trakcie
    // konfigurowania, a nie trzecie miejsce po przecinku.
    worker.postMessage({ positions, tech, nozzleId, samples: 1500 }, [positions.buffer]);

    return () => { cancelled = true; worker.terminate(); };
  }, [triangles, tech, nozzleId]);

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
      thinnestMm: report.thickness ? Number(report.thickness.p1.toFixed(3)) : null,
      watertight: report.topology.isWatertight,
      findings: [...blockers, ...warnings].map(strip),
      blocked: needsAccept,
      accepted: needsAccept ? accepted : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, accepted, tech, nozzleId]);

  if (busy) {
    return (
      <div className="flex items-center gap-2 text-neutral-400 text-xs mt-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
        {L.checking}
      </div>
    );
  }

  if (!report || (!blockers.length && !warnings.length)) return null;

  const list = needsAccept ? blockers : warnings;
  const Icon = needsAccept ? XCircle : AlertTriangle;
  const tone = needsAccept
    ? { text: "text-rose-300", box: "border-rose-400/30 bg-rose-500/5" }
    : { text: "text-amber-300", box: "border-amber-400/25 bg-amber-500/5" };

  return (
    <div className={`mt-4 rounded-2xl border p-4 ${tone.box}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${tone.text} shrink-0`} />
        <h4 className={`text-sm font-semibold ${tone.text}`}>{needsAccept ? L.blockTitle : L.warnTitle}</h4>
      </div>

      <ul className="space-y-1.5 mb-3">
        {list.map((f) => (
          <li key={f.id} className="text-neutral-300 text-xs leading-relaxed">{S[f.id]?.(f, num)}</li>
        ))}
      </ul>

      {/* Przy blokadzie pokazujemy takze ostrzezenia, zeby pokwitowanie
          obejmowalo komplet tego, co widzial klient. */}
      {needsAccept && warnings.length > 0 && (
        <ul className="space-y-1.5 mb-3 pt-2 border-t border-white/10">
          {warnings.map((f) => (
            <li key={f.id} className="text-neutral-400 text-xs leading-relaxed flex gap-2">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />{S[f.id]?.(f, num)}
            </li>
          ))}
        </ul>
      )}

      <a
        href="/toolstudio/printability/"
        target="_blank"
        rel="noopener"
        className="inline-block text-blue-400 hover:text-blue-300 text-xs mb-3"
      >
        {L.checkLink}
      </a>

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
          <p className="text-neutral-500 text-[11px] leading-relaxed mt-2">{L.acceptNote}</p>
          {!accepted && <p className="text-rose-300 text-[11px] mt-2">{L.mustAccept}</p>}
        </>
      )}
    </div>
  );
}
