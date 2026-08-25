// ============================================================
// ODLEW Z METALI SZLACHETNYCH, KALKULATOR sTuDiO
// ============================================================
// Ta sama usluga, ktora stoi na karcie sklepu, tylko wpieta w kalkulator
// projektowy. Liczy ten sam rdzen `src/pricing/preciousMetalCasting.js`,
// wiec kalkulator i sklep nie moga pokazac dwoch roznych kwot.
//
// Wiazaca cena automatyczna istnieje TYLKO dla wariantu z modelem 3D i
// kruszcu AEJaCA, bo tylko wtedy objetosc jest zmierzona, a nie deklarowana.
// Kazda inna sciezka konczy sie wycena indywidualna i tak to nazywamy na
// ekranie, zamiast pokazywac liczbe, ktorej nie da sie dotrzymac.
//
// Pole pliku i suwak skali sa WZIETE ZE SKLEPU (`ConfigControls`), a nie
// napisane drugi raz. Razem z nimi przychodza ostrzezenia o limicie kolby i
// o tym, ze skalowanie zmienia grubosc scianek: gdyby stalo tu wlasne pole,
// te dwa zdania predzej czy pozniej rozjechalyby sie ze sklepem.
import { useState, useMemo, lazy, Suspense } from "react";
import { t, Chips, CalcCard, ResultHeader, ResultDisplay, HeroCards, NextStepPanel } from "./calcShared.jsx";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
// PROGI ILOSCI IDA Z JUBILERKI, nie ze sTuDiO. Odlew liczy `calcNew`, ktore
// zna wylacznie `QTY_TIERS` ("1", "2-5", "6-10", "10+"). Progi studyjne
// ("proto", "micro") wygladaja tak samo na ekranie, ale silnik oddaje na nie
// `null`: kalkulator pokazuje wtedy "wybierz wszystkie parametry" i nikt nie
// widzi bledu, bo zaden sie nie pojawia.
import { QTY_TIERS } from "../../pricing/jewelryConfig.js";
import { QuantityStepper, FileDrop, ScaleControl } from "../shop/ConfigControls.jsx";
import CalcToCart from "./CalcToCart.jsx";
import { useMarketRates } from "../../hooks/useMarketRates.js";
import {
  CASTING_VARIANTS, CASTING_MATERIAL_SOURCES, CASTING_METALS, CASTING_FINISHES,
  CASTING_ENVELOPE_MM, maxCastingScaleForBBox, calculate,
} from "../../pricing/preciousMetalCasting.js";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

/** Te same formaty, ktore mierzy serwer przy wystawianiu kwoty wiazacej */
const ACCEPT_MODEL = ".stl,.obj,.3mf,.step,.stp";

const TECH_LABEL = { pl: "Odlew z metali szlachetnych", en: "Precious metal casting", de: "Edelmetallguss" };

const L = {
  pl: {
    variant: "Co nam przekazujesz",
    source: "Źródło kruszcu",
    metal: "Kruszec i próba",
    model: "Model 3D",
    modelHint: "Przeciągnij plik STL, OBJ, 3MF lub STEP albo kliknij, żeby wybrać",
    scale: "Wielkość odlewu",
    finish: "Zakres wykończenia",
    qty: "Liczba sztuk",
    qtyStepper: "Liczba sztuk",
    parsing: "Analizuję model",
    parseFailed: "Nie udało się odczytać tego pliku. Sprawdź, czy to STL, OBJ, 3MF albo STEP.",
    needModel: "Wgraj model, żeby zobaczyć kwotę. Cena odlewu wynika z policzonej objętości, a nie z rozmiaru wybranego z listy.",
    manualNote: "Ten wariant wyceniamy indywidualnie. Wzorzec fizyczny trzeba obejrzeć, przedmiot od pomysłu najpierw zaprojektować, a kruszec powierzony zważyć i sprawdzić.",
    massNote: (masa, zapas) => `Masa gotowego odlewu: ${masa} g. Do przetopu przygotowujemy ${zapas} g, bo część kruszcu zostaje w kanałach i na zgarze.`,
    envelope: `Automatyczna wycena obejmuje modele mieszczące się po obrocie w ${CASTING_ENVELOPE_MM.join(" × ")} mm. Większe kierujemy do oceny indywidualnej.`,
  },
  en: {
    variant: "What you provide",
    source: "Metal source",
    metal: "Metal and purity",
    model: "3D model",
    modelHint: "Drag an STL, OBJ, 3MF or STEP file here, or click to choose one",
    scale: "Casting size",
    finish: "Finishing",
    qty: "Quantity",
    qtyStepper: "Quantity",
    parsing: "Analysing the model",
    parseFailed: "We could not read this file. Check that it is an STL, OBJ, 3MF or STEP.",
    needModel: "Upload a model to see the amount. A casting is priced from measured volume, not from a size picked off a list.",
    manualNote: "This route is quoted individually. A physical pattern has to be inspected, an idea has to be designed first, and supplied metal has to be weighed and verified.",
    massNote: (masa, zapas) => `Finished casting mass: ${masa} g. We melt ${zapas} g, because some metal stays in the sprues and is lost to oxidation.`,
    envelope: `Automatic pricing covers models that fit ${CASTING_ENVELOPE_MM.join(" × ")} mm after rotation. Larger ones go to individual review.`,
  },
  de: {
    variant: "Was Sie liefern",
    source: "Metallquelle",
    metal: "Metall und Feingehalt",
    model: "3D-Modell",
    modelHint: "STL-, OBJ-, 3MF- oder STEP-Datei hierher ziehen oder klicken",
    scale: "Gussgröße",
    finish: "Finish",
    qty: "Stückzahl",
    qtyStepper: "Stückzahl",
    parsing: "Modell wird analysiert",
    parseFailed: "Diese Datei konnte nicht gelesen werden. Prüfen Sie, ob es eine STL-, OBJ-, 3MF- oder STEP-Datei ist.",
    needModel: "Laden Sie ein Modell hoch, um den Betrag zu sehen. Ein Guss wird aus dem gemessenen Volumen berechnet, nicht aus einer Größe aus einer Liste.",
    manualNote: "Diese Variante wird individuell kalkuliert. Ein physisches Modell muss geprüft, eine Idee zuerst konstruiert und beigestelltes Metall gewogen und untersucht werden.",
    massNote: (masa, zapas) => `Masse des fertigen Gusses: ${masa} g. Eingeschmolzen werden ${zapas} g, weil Metall in den Kanälen bleibt und beim Abbrand verloren geht.`,
    envelope: `Die automatische Kalkulation gilt für Modelle, die nach Drehung in ${CASTING_ENVELOPE_MM.join(" × ")} mm passen. Größere gehen in die individuelle Prüfung.`,
  },
};

/** Kafelki wariantow: `sub` z rdzenia cenowego jest tu opisem pod tytulem. */
const VARIANT_CARDS = CASTING_VARIANTS.map((v) => ({ id: v.id, label: v.label, desc: v.sub }));

export default function MetalCastCalc({ lang = "pl" }) {
  const l = L[lang] || L.en;
  const { rates } = useMarketRates();
  const [bindingGrosze, setBindingGrosze] = useState(null);

  const [variantId, setVariantId] = useState("model_3d");
  const [materialSourceId, setMaterialSourceId] = useState("aejaca");
  const [metalId, setMetalId] = useState("silver");
  const [finishId, setFinishId] = useState("clean");
  const [qty, setQty] = useState(1);
  const qtyId = tierForQty(qty, QTY_TIERS).id;

  const [file, setFile] = useState(null);
  const [mesh, setMesh] = useState(null);
  const [scale, setScale] = useState(1);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  // Model liczy sie automatycznie tylko w jednej kombinacji. Trzymamy to w
  // jednym miejscu, zeby ekran i wynik nie mogly powiedziec czego innego.
  const measurable = variantId === "model_3d" && materialSourceId === "aejaca";

  async function onPick(event) {
    const wybrany = event.target?.files?.[0];
    if (!wybrany) return;
    setFile(wybrany);
    setMesh(null);
    setParseError(null);
    setParsing(true);
    setScale(1);
    try {
      const bufor = await wybrany.arrayBuffer();
      const { parseMeshAsync } = await import("../../pricing/mesh.js");
      setMesh(await parseMeshAsync(bufor, wybrany.name));
    } catch {
      // Nieczytelny plik ZOSTAJE w polu razem z powodem. Skasowanie go w tle
      // znaczyloby, ze klient widzi puste pole i nie wie, co poszlo nie tak.
      setParseError(l.parseFailed);
    } finally {
      setParsing(false);
    }
  }

  function onClear() {
    setFile(null);
    setMesh(null);
    setParseError(null);
    setScale(1);
  }

  const maxScale = mesh?.bbox ? maxCastingScaleForBBox(mesh.bbox) : null;

  // Rdzen cenowy dostaje geometrie JUZ PRZESKALOWANA, tak samo jak na
  // serwerze. Objetosc rosnie szescianem skali, wiec model powiekszony o
  // polowe wazy ponad trzy razy tyle co oryginal.
  const scaledStlData = useMemo(() => {
    if (!mesh) return null;
    if (Math.abs(scale - 1) < 1e-9) return mesh;
    return {
      ...mesh,
      volumeCm3: mesh.volumeCm3 * scale ** 3,
      bbox: { x: mesh.bbox.x * scale, y: mesh.bbox.y * scale, z: mesh.bbox.z * scale },
    };
  }, [mesh, scale]);

  const result = useMemo(
    () => calculate({ variantId, materialSourceId, metalId, finishId, qtyId, qty, stlData: scaledStlData }, lang, rates),
    [variantId, materialSourceId, metalId, finishId, qtyId, qty, scaledStlData, lang, rates],
  );

  const paramsSummary = [
    t(CASTING_VARIANTS.find((v) => v.id === variantId)?.label, lang),
    t(CASTING_MATERIAL_SOURCES.find((v) => v.id === materialSourceId)?.label, lang),
    t(CASTING_METALS.find((v) => v.id === metalId)?.label, lang),
    t(CASTING_FINISHES.find((v) => v.id === finishId)?.label, lang),
    ...(file ? [file.name] : []),
  ].join(" | ");

  return (
    <div>
      <div className="text-center text-[11px] text-neutral-400 mb-6">Ag 800/925 · Au 9k/14k/18k/24k · {CASTING_ENVELOPE_MM.join(" × ")} mm</div>

      <CalcCard stepNum="①" label={l.variant}>
        <HeroCards options={VARIANT_CARDS} value={variantId} onChange={setVariantId} lang={lang} cols="grid-cols-1 sm:grid-cols-3" minH={150} />
      </CalcCard>

      <CalcCard stepNum="②" label={l.source}>
        <Chips options={CASTING_MATERIAL_SOURCES} value={materialSourceId} onChange={setMaterialSourceId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="③" label={l.metal}>
        <Chips options={CASTING_METALS} value={metalId} onChange={setMetalId} lang={lang} />
      </CalcCard>

      {measurable && (
        <CalcCard stepNum="④" label={l.model} id="file-upload">
          <FileDrop
            label=""
            hint={l.modelHint}
            file={file}
            geometry={mesh ? { volumeCm3: Number((mesh.volumeCm3 * scale ** 3).toFixed(2)), bbox: scaledStlData.bbox } : null}
            busy={parsing}
            busyLabel={l.parsing}
            error={parseError}
            onPick={onPick}
            onClear={onClear}
            accent="blue"
            lang={lang}
            accept={ACCEPT_MODEL}
          >
            {mesh && (
              <>
                <Suspense fallback={<div className="w-full rounded-lg bg-[#eef0f3] border border-black/10 animate-pulse" style={{ height: "220px" }} />}>
                  <STLViewer triangles={mesh.triangles} bbox={mesh.bbox} scale={scale} />
                </Suspense>
                <div className="mt-3">
                  <ScaleControl
                    label={l.scale}
                    bbox={mesh.bbox}
                    volumeCm3={mesh.volumeCm3}
                    scale={scale}
                    onChange={setScale}
                    maxScale={maxScale}
                    lang={lang}
                    accent="blue"
                    purpose="casting"
                  />
                </div>
              </>
            )}
          </FileDrop>
          {!file && <p className="text-neutral-400 text-[11px] leading-relaxed">{l.needModel}</p>}
          <p className="text-neutral-500 text-[11px] leading-relaxed mt-2">{l.envelope}</p>
        </CalcCard>
      )}

      {!measurable && (
        <CalcCard stepNum="④" label={l.model}>
          <p className="text-neutral-400 text-[11px] leading-relaxed">{l.manualNote}</p>
        </CalcCard>
      )}

      <CalcCard stepNum="⑤" label={l.finish}>
        <Chips options={CASTING_FINISHES} value={finishId} onChange={setFinishId} lang={lang} />
      </CalcCard>

      <CalcCard stepNum="⑥" label={l.qty}>
        <Chips options={QTY_TIERS} value={qtyId} onChange={(id) => setQty(qtyForTier(id, QTY_TIERS))} lang={lang} />
        <QuantityStepper label={l.qtyStepper} value={qty} onChange={setQty}
          min={1} max={qtyLimit(QTY_TIERS)} openValue={qtyOpenValue(QTY_TIERS)} lang={lang} accent="blue" />
      </CalcCard>

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze} />
        {result?.finalMassG != null && (
          <p className="text-neutral-500 text-[11px] leading-relaxed mt-3">
            {l.massNote(result.finalMassG.toFixed(2), result.requiredMassG.toFixed(2))}
          </p>
        )}
        <NextStepPanel
          lang={lang}
          techLabel={t(TECH_LABEL, lang)}
          paramsSummary={paramsSummary}
          result={result}
          cart={
            <CalcToCart
              embedded
              onBinding={setBindingGrosze}
              calculator="jewelry_casting"
              serviceId="precious_metal_casting"
              params={{ variantId, materialSourceId, metalId, finishId, qtyId }}
              qty={qty}
              file={file}
              triangles={mesh?.triangles || null}
              scale={scale}
              lang={lang}
            />
          }
        />
      </div>
    </div>
  );
}
