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
// PYTANIA TEZ SA WZIETE ZE SKLEPU. Lista pol, ich kolejnosc, etykiety i
// zaleznosci miedzy nimi stoja w `orderCatalog.js` i rysuje je `PolaUslugi`,
// wiec kalkulator nie moze zapytac o co innego niz karta uslugi. Wczesniej
// stal tu wlasny slownik siedmiu etykiet w trzech jezykach i wlasna kopia
// regul: powloke galwaniczna napisalismy przez to dwa razy. Zostaje tu tylko
// to, czego katalog nie opisuje: pole modelu, suwak skali i wynik.
import { useState, useMemo, lazy, Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { FORMATY_MODELU } from "../../shop/paczkaModeli.js";
import { t, ResultHeader, ResultDisplay, NextStepPanel } from "./calcShared.jsx";
import { sprawdzModelDoOdlewu, wierszePrzeliczenia } from "../../pricing/castingIntake.js";
import { tierForQty, qtyForTier, qtyLimit, qtyOpenValue } from "../../pricing/config.js";
// PROGI ILOSCI IDA Z JUBILERKI, nie ze sTuDiO. Odlew liczy `calcNew`, ktore
// zna wylacznie `QTY_TIERS` ("1", "2-5", "6-10", "10+"). Progi studyjne
// ("proto", "micro") wygladaja tak samo na ekranie, ale silnik oddaje na nie
// `null`: kalkulator pokazuje wtedy "wybierz wszystkie parametry" i nikt nie
// widzi bledu, bo zaden sie nie pojawia.
import { QTY_TIERS } from "../../pricing/jewelryConfig.js";
import { FileDrop, ScaleControl } from "../shop/ConfigControls.jsx";
import PolaUslugi, { poprawkiWyboru } from "../shop/PolaUslugi.jsx";
import { getService } from "../../data/orderCatalog.js";
import CalcToCart from "./CalcToCart.jsx";
import { useMarketRates } from "../../hooks/useMarketRates.js";
import {
  CASTING_VARIANTS, CASTING_MATERIAL_SOURCES, CASTING_METALS, CASTING_FINISHES,
  CASTING_PLATINGS, castingPlatingAvailable, CASTING_ENGRAVINGS, castingEngravingAvailable,
  normalizeEngravingId,
  CASTING_ENVELOPE_LABEL, maxCastingScaleForBBox, calculate, describeMissingCastingParams,
} from "../../pricing/preciousMetalCasting.js";

const STLViewer = lazy(() => import("./STLViewer.jsx"));

/** Te same formaty, ktore mierzy serwer przy wystawianiu kwoty wiazacej */
const ACCEPT_MODEL = FORMATY_MODELU;

const TECH_LABEL = { pl: "Odlew z metali szlachetnych", en: "Precious metal casting", de: "Edelmetallguss" };

const L = {
  pl: {
    model: "Model 3D",
    modelHint: "Przeciągnij plik STL, OBJ, 3MF lub STEP albo kliknij, żeby wybrać",
    scale: "Wielkość odlewu",
    qtyStepper: "Liczba sztuk",
    parsing: "Analizuję model",
    parseFailed: "Nie udało się odczytać tego pliku. Sprawdź, czy to STL, OBJ, 3MF albo STEP.",
    needModel: "Wgraj model, żeby zobaczyć kwotę. Cena odlewu wynika z policzonej objętości, a nie z rozmiaru wybranego z listy.",
    manualNote: "Ten wariant wyceniamy indywidualnie. Wzorzec fizyczny trzeba obejrzeć, przedmiot od pomysłu najpierw zaprojektować, a kruszec powierzony zważyć i sprawdzić.",
    massNote: (masa, zapas) => `Masa gotowego odlewu: ${masa} g. Do przetopu przygotowujemy ${zapas} g, bo część kruszcu zostaje w kanałach i na zgarze.`,
    envelope: `Automatyczna wycena obejmuje modele mieszczące się po obrocie w kolbie ${CASTING_ENVELOPE_LABEL}, czyli w kole tej średnicy i tej wysokości. Większe kierujemy do oceny indywidualnej.`,
  },
  en: {
    model: "3D model",
    modelHint: "Drag an STL, OBJ, 3MF or STEP file here, or click to choose one",
    scale: "Casting size",
    qtyStepper: "Quantity",
    parsing: "Analysing the model",
    parseFailed: "We could not read this file. Check that it is an STL, OBJ, 3MF or STEP.",
    needModel: "Upload a model to see the amount. A casting is priced from measured volume, not from a size picked off a list.",
    manualNote: "This route is quoted individually. A physical pattern has to be inspected, an idea has to be designed first, and supplied metal has to be weighed and verified.",
    massNote: (masa, zapas) => `Finished casting mass: ${masa} g. We melt ${zapas} g, because some metal stays in the sprues and is lost to oxidation.`,
    envelope: `Automatic pricing covers models that fit the flask after rotation, ${CASTING_ENVELOPE_LABEL}: a circle of that diameter and that height. Larger ones go to individual review.`,
  },
  de: {
    model: "3D-Modell",
    modelHint: "STL-, OBJ-, 3MF- oder STEP-Datei hierher ziehen oder klicken",
    scale: "Gussgröße",
    qtyStepper: "Stückzahl",
    parsing: "Modell wird analysiert",
    parseFailed: "Diese Datei konnte nicht gelesen werden. Prüfen Sie, ob es eine STL-, OBJ-, 3MF- oder STEP-Datei ist.",
    needModel: "Laden Sie ein Modell hoch, um den Betrag zu sehen. Ein Guss wird aus dem gemessenen Volumen berechnet, nicht aus einer Größe aus einer Liste.",
    manualNote: "Diese Variante wird individuell kalkuliert. Ein physisches Modell muss geprüft, eine Idee zuerst konstruiert und beigestelltes Metall gewogen und untersucht werden.",
    massNote: (masa, zapas) => `Masse des fertigen Gusses: ${masa} g. Eingeschmolzen werden ${zapas} g, weil Metall in den Kanälen bleibt und beim Abbrand verloren geht.`,
    envelope: `Die automatische Kalkulation gilt für Modelle, die nach Drehung in die Küvette passen, ${CASTING_ENVELOPE_LABEL}: ein Kreis dieses Durchmessers und diese Höhe. Größere gehen in die individuelle Prüfung.`,
  },
};

/** Opis uslugi wspolny ze sklepem: stad biora sie pytania i ich kolejnosc. */
const USLUGA = getService("precious_metal_casting");

// ============================================================
// ODLEW Z PLIKU: rachunek przeliczenia wymiaru, tu liczony lokalnie
// ============================================================
// Kwota wiazaca i pomiar pliku ida przez `CalcToCart` nizej, wiec ten
// kalkulator nie ma dostepu do zmierzonej geometrii. Rachunek przeliczenia
// otworu NIE zalezy od geometrii, tylko od wyboru klienta (kruszec, srednica,
// stan pliku), wiec liczymy go ta sama funkcja co serwer, wolana z geometria
// `null`. Wynik jest identyczny z tym, co pokaze /api/price. Ostrzezenie
// "nie udalo sie zmierzyc otworu" zalezy wylacznie od geometrii i przy `null`
// zapalaloby sie zawsze, nawet po wgraniu poprawnego pliku, wiec je odsiewamy.
const ODLEW_LABELS = {
  pl: { lead: "Podajesz wymiar gotowego wyrobu, a tu pokazujemy, co z niego faktycznie wydrukujemy.",
    blokada: "Tego modelu nie odlejemy w tej postaci" },
  en: { lead: "You give the finished dimension, and here we show what we will actually print from it.",
    blokada: "We cannot cast this model as it stands" },
  de: { lead: "Sie geben das Fertigmaß an, hier zeigen wir, was wir daraus tatsächlich drucken.",
    blokada: "Dieses Modell können wir so nicht gießen" },
};

function OdlewZPlikuInfo({ odlew, lang, blokada = null }) {
  const ol = ODLEW_LABELS[lang] || ODLEW_LABELS.pl;
  if (!odlew && !blokada) return null;
  const wiersze = odlew?.przeliczenie ? wierszePrzeliczenia(odlew.przeliczenie, lang) : [];
  const ostrzezenia = odlew?.ostrzezenia || [];
  if (!wiersze.length && !ostrzezenia.length && !blokada) return null;
  return (
    <div className="mt-4 space-y-3">
      {blokada && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/5 p-4">
          <p className="text-rose-300 text-xs font-semibold leading-relaxed">{ol.blokada}</p>
          <p className="text-rose-300 text-xs leading-relaxed mt-1">{blokada}</p>
        </div>
      )}
      {wiersze.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-neutral-400 text-xs leading-relaxed mb-3">{ol.lead}</p>
          <div className="space-y-1.5">
            {wiersze.map((w, i) => (
              <div
                key={i}
                className={`flex items-baseline justify-between gap-4 text-xs ${
                  w.wynik ? "text-white font-semibold pt-1.5 mt-1 border-t border-white/10" : "text-neutral-400"
                }`}
              >
                <span>{w.etykieta}</span>
                <span className="tabular-nums shrink-0">{w.wartosc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {ostrzezenia.length > 0 && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-4">
          <ul className="space-y-1.5">
            {ostrzezenia.map((o) => (
              <li key={o.id} className="flex gap-2 text-amber-300 text-xs leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{o.tekst}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function MetalCastCalc({ lang = "pl" }) {
  const l = L[lang] || L.en;
  const { rates } = useMarketRates();
  const [bindingGrosze, setBindingGrosze] = useState(null);
  // Ustalenia bramki odlewniczej wracaja z serwera razem z cena. Sa wiazace,
  // bo licza sie ze ZMIERZONEGO pliku, a nie z samych wyborow klienta.
  const [odpowiedz, setOdpowiedz] = useState(null);

  const [params, setParams] = useState(() => ({ ...USLUGA.defaults }));
  // Wybor spoza listy przystawiamy w RENDERZE, a nie efektem: efekt dorysowuje
  // ekran drugi raz i przez moment pokazuje stan, ktorego nie oferujemy.
  // Przystawia `poprawkiWyboru`, czyli ta sama funkcja, ktorej uzywa sklep:
  // regula "przy kruszcu AEJaCA nie ma odlewu z kanalami" jest opisana raz,
  // w katalogu, a nie powtorzona w obu konfiguratorach.
  const poprawki = poprawkiWyboru(USLUGA, params);
  if (poprawki) setParams((p) => ({ ...p, ...poprawki }));
  const { variantId, materialSourceId, metalId, finishId, platingId, engravingId } = { ...params, ...poprawki };

  const [qty, setQty] = useState(1);
  const qtyId = tierForQty(qty, QTY_TIERS).id;
  // Prog nakladu na ekranie zawsze wynika z licznika sztuk, a nie z tego, co
  // zostalo w stanie: inaczej dwie kontrolki tej samej decyzji pokazywalyby
  // dwie rozne wartosci.
  const stan = { ...params, ...poprawki, qtyId };

  // Prog nakladu i licznik sztuk to jedna decyzja, wiec zapis idzie w obie
  // strony: kafelek progu przestawia licznik, licznik przestawia kafelek.
  const setParam = (klucz, wartosc) => {
    if (klucz === "qtyId") { setQty(qtyForTier(wartosc, QTY_TIERS)); return; }
    setParams((p) => ({ ...p, [klucz]: wartosc }));
  };

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
    () => calculate({ variantId, materialSourceId, metalId, finishId, platingId, engravingId, qtyId, qty, stlData: scaledStlData }, lang, rates),
    [variantId, materialSourceId, metalId, finishId, platingId, engravingId, qtyId, qty, scaledStlData, lang, rates],
  );

  // Rachunek przeliczenia i ostrzezenie o innym stopie kompensacji, liczone
  // ta sama funkcja co serwer, bez zmierzonego pliku (patrz komentarz przy
  // definicji `OdlewZPlikuInfo` wyzej). `stan` jest nowym obiektem w kazdym
  // renderze, wiec liczymy to bez `useMemo`: sam rachunek jest bez kosztu.
  const odlewLokalnie = sprawdzModelDoOdlewu(stan, null, lang);
  // Odpowiedz serwera WYGRYWA, bo widziala plik. Rachunek lokalny sluzy
  // wylacznie do tego, zeby blok przeliczenia pojawil sie od razu po podaniu
  // wymiaru, zanim zapytanie o cene wroci.
  const odlewInfo = odpowiedz?.odlewZPliku
    || (odlewLokalnie.dotyczy
      ? {
        przeliczenie: odlewLokalnie.przeliczenie,
        ostrzezenia: odlewLokalnie.ostrzezenia
          .filter((o) => o.id !== "otwor_niezmierzony")
          .map((o) => ({ id: o.id, tekst: t(o.tekst, lang) })),
      }
      : null);
  const blokadaOdlewu = odpowiedz?.bladKod === "casting_model_blocked" ? odpowiedz.bladTekst : null;

  const paramsSummary = [
    t(CASTING_VARIANTS.find((v) => v.id === variantId)?.label, lang),
    t(CASTING_MATERIAL_SOURCES.find((v) => v.id === materialSourceId)?.label, lang),
    t(CASTING_METALS.find((v) => v.id === metalId)?.label, lang),
    t(CASTING_FINISHES.find((v) => v.id === finishId)?.label, lang),
    // Powloke pokazujemy w podsumowaniu tylko wtedy, gdy naprawde wchodzi do
    // ceny: wpisana przy szlifowaniu bylaby obietnica, ktorej wycena nie niesie.
    ...(castingPlatingAvailable(finishId) && platingId !== "none"
      ? [t(CASTING_PLATINGS.find((v) => v.id === platingId)?.label, lang)] : []),
    // Grawer w podsumowaniu tylko wtedy, gdy naprawde wchodzi do ceny.
    ...(castingEngravingAvailable(finishId) && engravingId && engravingId !== "none"
      ? [t(CASTING_ENGRAVINGS.find((v) => v.id === normalizeEngravingId(engravingId))?.label, lang)] : []),
    ...(file ? [file.name] : []),
    // Kruszec nie ma wyboru wstepnego, wiec do czasu wskazania go przez klienta
    // ten segment jest pusty. Bez odsiania pustych podsumowanie mialoby dziure
    // w rodzaju "Model 3D | Kruszec AEJaCA |  | Wykonczenie jubilerskie".
  ].filter(Boolean).join(" | ");

  // Pole modelu nie jest pytaniem z katalogu, tylko narzedziem pomiaru, wiec
  // wchodzi jako wstawka miedzy kruszec a wykonczenie: klient najpierw mowi,
  // z czego odlewamy, potem pokazuje CO odlewamy, a dopiero potem wybiera
  // obrobke tego czegos.
  const wstawkaModelu = {
    po: "metalId",
    label: l.model,
    id: "file-upload",
    render: () => (measurable ? (
      <>
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
        {!file && <p className="text-neutral-400 text-xs leading-relaxed">{l.needModel}</p>}
        <p className="text-neutral-500 text-xs leading-relaxed mt-2">{l.envelope}</p>
      </>
    ) : (
      <p className="text-neutral-400 text-xs leading-relaxed">{l.manualNote}</p>
    )),
  };

  return (
    <div>
      <div className="text-center text-xs text-neutral-400 mb-6">Ag 800/925 · Au 9k/14k/18k/24k · {CASTING_ENVELOPE_LABEL}</div>

      <PolaUslugi
        service={USLUGA}
        params={stan}
        setParam={setParam}
        lang={lang}
        wyglad="kalkulator"
        wstawki={[wstawkaModelu]}
        tierKey="qtyId"
        qty={qty}
        onQty={setQty}
        qtyMax={qtyLimit(QTY_TIERS)}
        qtyOpen={qtyOpenValue(QTY_TIERS)}
        qtyLabel={l.qtyStepper}
      />

      <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white/[0.03] to-transparent p-6 mt-2">
        <ResultHeader lang={lang} binding={bindingGrosze != null} />
        <ResultDisplay result={result} lang={lang} hideRange={bindingGrosze != null} binding={bindingGrosze}
          brakNote={describeMissingCastingParams({ ...stan, stlData: scaledStlData }, lang)} />
        {result?.finalMassG != null && (
          <p className="text-neutral-500 text-xs leading-relaxed mt-3">
            {l.massNote(result.finalMassG.toFixed(2), result.requiredMassG.toFixed(2))}
          </p>
        )}
        <OdlewZPlikuInfo odlew={odlewInfo} lang={lang} blokada={blokadaOdlewu} />
        <NextStepPanel
          lang={lang}
          techLabel={t(TECH_LABEL, lang)}
          paramsSummary={paramsSummary}
          result={result}
          cart={
            // Do serwera idzie CALY `stan`, a nie wyliczanka pol. Lista
            // wypisana z reki zgubila szesc pytan o model dodanych 13 wrzesnia
            // 2026: serwer ich nie widzial i odsylal "parametry niekompletne"
            // przy formularzu wypelnionym do konca.
            <CalcToCart
              embedded
              onBinding={setBindingGrosze}
              onOdpowiedz={setOdpowiedz}
              calculator="jewelry_casting"
              serviceId="precious_metal_casting"
              params={stan}
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
