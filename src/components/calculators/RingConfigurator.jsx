// ============================================================
// KREATOR PIERSCIONKOW
// ============================================================
// Klient sklada pierscionek z parametrow i widzi go na biezaco. Bryle liczy
// watek roboczy tym samym kodem, ktory na serwerze zbuduje kupowany plik,
// wiec podglad i wyrob nie moga sie rozjechac.
//
// CENY TU NIE LICZYMY i to nie jest przeoczenie. Masa decyduje o koszcie
// kruszcu, wiec kwota musi pochodzic z serwera, a nie z przegladarki, ktora
// jest o jedno `fetch` od podmiany. Odczyty ponizej sa informacja o geometrii,
// a kwote wiazaca pobiera `RingPriceBox` z `/api/price/ring`.

import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { CUTS, SIDE_CUTS, SETTINGS, SIDE_SETTINGS, SHANK_PROFILES, SIGNET_TABLES, SIGNET_FACES, DEFAULTS, LIMITS, localStoneFitLimits } from "../../geometry/ring/params.js";
import { RING_PRESETS, PRESET_GROUPS, applyPreset } from "../../data/ringPresets.js";
import { CASTING_ALLOYS, METAL_COLORS, colorsFor } from "../../data/castingAlloys.js";
import { GEMSTONES } from "../../pricing/jewelryConfig.js";
import { gemOptics } from "../../data/gemOptics.js";
import { RING_SIZES } from "../../data/ringSizes.js";
import CutIcon from "./jewelry/CutIcon.jsx";
import PresetIcon from "./jewelry/PresetIcon.jsx";

const RingPreview3D = lazy(() => import("./jewelry/RingPreview3D.jsx"));
// Kwota wiazaca schodzi z serwera, wiec komponent i tak czeka na siec.
// Doladowanie go osobno nie opoznia podgladu.
const RingPriceBox = lazy(() => import("./jewelry/RingPriceBox.jsx"));

const L = {
  pl: {
    kind: "Typ wyrobu", ring: "Pierścionek", signet: "Sygnet",
    size: "Rozmiar", alloy: "Metal", color: "Kolor metalu", profile: "Profil szyny",
    gem: "Kamień centralny", sideGem: "Kamienie boczne",
    preset: "Zacznij od wzoru", taper: "Sylwetka szyny",
    band: "Obrączka", halo: "Halo", haloSize: "Kamienie halo", on: "Tak", off: "Nie",
    coverage: "Kamienie na obwodzie", bandSize: "Średnica kamieni",
    coverages: { none: "Brak", half: "Górna połowa", full: "Dookoła" },
    eternityWarn: "Pierścionka z kamieniami dookoła nie da się później zwęzić ani rozciągnąć: nie ma gładkiego odcinka, w który jubiler mógłby wejść.",
      tapers: { none: "Prosta", tapered: "Zwężana", cathedral: "Katedralna" },
    rhodiumNote: "Białe złoto rodujemy, bo bez powłoki ma lekko ciepły odcień. Rodowanie zużywa się i po latach odnawia się je jak lakier.",
    gemGroups: { precious: "Szlachetne", lab: "Hodowane i syntetyczne", semi: "Półszlachetne i ozdobne" },
    width: "Szerokość szyny", thickness: "Grubość szyny",
    cut: "Szlif kamienia centralnego", setting: "Zakucie", stoneSize: "Rozmiar kamienia",
    side: "Kamienie na szynie, na stronę", sideSetting: "Oprawa kamieni bocznych",
    sideCut: "Szlif kamieni bocznych",
    sideSize: "Średnica bocznych", none: "Brak",
    sideGap: "Odsunięcie od korony", sideSpread: "Rozsunięcie kamieni",
    table: "Tarcza sygnetu", tableLen: "Dłuższa oś tarczy", engraving: "Grawer tarczy",
    face: "Powierzchnia tarczy",
    mass: "Masa metalu", circ: "Obwód", stones: "Kamieni", tri: "Trójkątów",
    massTotal: "Masa pierścionka", carats: "Karaty",
    previewTitle: "Podgląd", castingTitle: "Dodatki do pliku", sprues: "Kanał wlewowy", button: "Stopka odlewnicza",
    stonesIn: "Pokaż kamienie w podglądzie",
    castingHint: "Kanał i stopka są potrzebne, gdy odlewasz samodzielnie. Nie wchodzą do masy wyrobu ani do ceny: metal z kanału wraca po odcięciu do tygla.",
    buttonNeedsSprue: "Stopka wymaga kanału, bo to on ją łączy z odlewem.",
    innerSprues: "Kanały wewnętrzne", innerNeedsSprue: "Kanały wewnętrzne wpinają się w kanał główny, więc bez niego nie mają do czego dojść.",
    building: "Liczę bryłę…", dragHint: "Przeciągnij, żeby obrócić",
    sideReduced: "Rozmiar kamieni bocznych zmniejszono do wykonalnego maksimum",
    bandReduced: "Rozmiar kamieni obrączki zmniejszono do wykonalnego maksimum",
    fitBlocked: "Ta szerokość szyny nie mieści nawet najmniejszego dostępnego kamienia. Przywrócono ostatni poprawny projekt.",
    profiles: { round: "Półokrągły", flat: "Płaski", knife: "Nożowy", comfort: "Comfort" },
    engravings: { none: "Gładka", mono: "Monogram", crest: "Herb" },
  },
  en: {
    kind: "Piece", ring: "Ring", signet: "Signet",
    size: "Size", alloy: "Metal", color: "Metal colour", profile: "Shank profile",
    gem: "Centre stone", sideGem: "Side stones",
    preset: "Start from a design", taper: "Shank silhouette",
    band: "Band", halo: "Halo", haloSize: "Halo stones", on: "Yes", off: "No",
    coverage: "Stones around the band", bandSize: "Stone diameter",
    coverages: { none: "None", half: "Upper half", full: "All the way round" },
    eternityWarn: "A ring with stones all the way round cannot be sized later: there is no plain stretch for a jeweller to work on.",
      tapers: { none: "Straight", tapered: "Tapered", cathedral: "Cathedral" },
    rhodiumNote: "White gold is rhodium plated, since the bare alloy has a faintly warm tint. The plating wears and is renewed over the years, much like a lacquer.",
    gemGroups: { precious: "Precious", lab: "Lab-grown and synthetic", semi: "Semi-precious and decorative" },
    width: "Shank width", thickness: "Shank thickness",
    cut: "Centre stone cut", setting: "Setting", stoneSize: "Stone size",
    side: "Side stones, per side", sideSetting: "Side stone setting",
    sideCut: "Side stone cut",
    sideSize: "Side stone diameter", none: "None",
    sideGap: "Gap from the head", sideSpread: "Spacing between stones",
    table: "Signet table", tableLen: "Long axis of the table", engraving: "Table engraving",
    face: "Table surface",
    mass: "Metal mass", circ: "Circumference", stones: "Stones", tri: "Triangles",
    massTotal: "Ring mass", carats: "Carats",
    previewTitle: "Preview", castingTitle: "Additions to the file", sprues: "Sprue", button: "Casting button",
    stonesIn: "Show stones in the preview",
    castingHint: "A sprue and button are needed if you cast the piece yourself. They do not enter the mass of the piece or its price: the metal returns to the crucible once cut off.",
    buttonNeedsSprue: "The button needs a sprue, which is what joins it to the casting.",
    innerSprues: "Inner channels", innerNeedsSprue: "Inner channels join the main sprue, so without it they lead nowhere.",
    building: "Building the solid…", dragHint: "Drag to rotate",
    sideReduced: "Side stone size was reduced to the manufacturable maximum",
    bandReduced: "Band stone size was reduced to the manufacturable maximum",
    fitBlocked: "This shank width cannot hold even the smallest available stone. The last valid design was restored.",
    profiles: { round: "Half-round", flat: "Flat", knife: "Knife-edge", comfort: "Comfort" },
    engravings: { none: "Plain", mono: "Monogram", crest: "Crest" },
  },
  de: {
    kind: "Stück", ring: "Ring", signet: "Siegelring",
    size: "Größe", alloy: "Metall", color: "Metallfarbe", profile: "Schienenprofil",
    gem: "Hauptstein", sideGem: "Seitensteine",
    preset: "Mit einem Entwurf beginnen", taper: "Schienensilhouette",
    band: "Ring", halo: "Halo", haloSize: "Halo-Steine", on: "Ja", off: "Nein",
    coverage: "Steine am Umfang", bandSize: "Steindurchmesser",
    coverages: { none: "Keine", half: "Obere Hälfte", full: "Rundum" },
    eternityWarn: "Ein Ring mit Steinen rundum lässt sich später nicht ändern: es fehlt der glatte Abschnitt zum Ansetzen.",
      tapers: { none: "Gerade", tapered: "Verjüngt", cathedral: "Kathedrale" },
    rhodiumNote: "Weißgold wird rhodiniert, da die blanke Legierung einen leicht warmen Ton hat. Die Schicht nutzt sich ab und wird über die Jahre erneuert, ähnlich wie ein Lack.",
    gemGroups: { precious: "Edelsteine", lab: "Laborgezüchtet und synthetisch", semi: "Halbedel und dekorativ" },
    width: "Schienenbreite", thickness: "Schienenstärke",
    cut: "Schliff des Hauptsteins", setting: "Fassung", stoneSize: "Steingröße",
    side: "Steine auf der Schiene, je Seite", sideSetting: "Fassung der Seitensteine",
    sideCut: "Schliff der Seitensteine",
    sideSize: "Durchmesser der Seitensteine", none: "Keine",
    sideGap: "Abstand zum Kopf", sideSpread: "Abstand zwischen den Steinen",
    table: "Siegelplatte", tableLen: "Längere Achse der Platte", engraving: "Gravur der Platte",
    face: "Plattenoberfläche",
    mass: "Metallmasse", circ: "Umfang", stones: "Steine", tri: "Dreiecke",
    massTotal: "Ringmasse", carats: "Karat",
    previewTitle: "Vorschau", castingTitle: "Ergänzungen zur Datei", sprues: "Gusskanal", button: "Gussknopf",
    stonesIn: "Steine in der Vorschau anzeigen",
    castingHint: "Kanal und Knopf brauchen Sie, wenn Sie selbst gießen. Sie zählen weder zur Masse des Stücks noch zum Preis: das Metall geht nach dem Abtrennen zurück in den Tiegel.",
    buttonNeedsSprue: "Der Knopf braucht einen Kanal, der ihn mit dem Guss verbindet.",
    innerSprues: "Innere Kanäle", innerNeedsSprue: "Innere Kanäle münden in den Hauptkanal, ohne ihn führen sie ins Leere.",
    building: "Körper wird berechnet…", dragHint: "Zum Drehen ziehen",
    sideReduced: "Die Seitensteine wurden auf das herstellbare Maximum verkleinert",
    bandReduced: "Die Ringsteine wurden auf das herstellbare Maximum verkleinert",
    fitBlocked: "Diese Ringschienenbreite fasst nicht einmal den kleinsten verfügbaren Stein. Der letzte gültige Entwurf wurde wiederhergestellt.",
    profiles: { round: "Halbrund", flat: "Flach", knife: "Messerkante", comfort: "Comfort" },
    engravings: { none: "Glatt", mono: "Monogramm", crest: "Wappen" },
  },
};

/** Etykieta w jezyku interfejsu, z odwrotem na polski, ktory jest zawsze. */
const nameOf = (o, lang) => (lang === "en" ? o.en : lang === "de" ? o.de : o.pl) || o.pl;
const hintOf = (o, lang) => (lang === "en" ? o.hintEn : lang === "de" ? o.hintDe : o.hint) || o.hint;

const nf = (lang, n, d = 1) =>
  n.toLocaleString(lang === "pl" ? "pl-PL" : lang === "de" ? "de-DE" : "en-US",
    { minimumFractionDigits: d, maximumFractionDigits: d });

// ------------------------------------------------------------
// Drobne elementy sterujace
// ------------------------------------------------------------
function Group({ label, hint, children }) {
  return (
    <div className="mb-5">
      <div className="text-[10.5px] uppercase tracking-[0.13em] text-neutral-500 mb-2">{label}</div>
      {children}
      {hint ? <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id} type="button" onClick={() => onChange(o.id)}
          aria-pressed={o.id === value}
          className={`rounded-sm border px-2.5 py-1.5 text-[13px] transition-colors ${
            o.id === value
              ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
              : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Kamieni jest dwadziescia kilka, wiec przyciski rozlalyby sie na pol ekranu.
// Lista rozwijana grupuje je tak, jak dzieli je rynek, a kropka obok pokazuje
// barwe, ktora zobaczysz na modelu. Barwa i nazwa ida z tego samego zrodla,
// wiec nie moga sie rozjechac.
const GEM_GROUPS = [
  { key: "precious", ids: GEMSTONES.filter((g) => g.precious).map((g) => g.id) },
  { key: "lab",      ids: GEMSTONES.filter((g) => g.lab).map((g) => g.id) },
  { key: "semi",     ids: GEMSTONES.filter((g) => !g.precious && !g.lab && !g.custom && g.id !== "none").map((g) => g.id) },
];
const GEM_BY_ID = Object.fromEntries(GEMSTONES.map((g) => [g.id, g]));

function GemSelect({ value, onChange, lang, groupLabels }) {
  const o = gemOptics(value);
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="w-3.5 h-3.5 shrink-0 rounded-full border border-black/40"
        style={{ background: o?.color || "#888" }} />
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[13px] text-neutral-200"
      >
        {GEM_GROUPS.map((g) => (
          <optgroup key={g.key} label={groupLabels[g.key]}>
            {g.ids.map((id) => (
              <option key={id} value={id} className="bg-neutral-900">
                {GEM_BY_ID[id].label[lang] || GEM_BY_ID[id].label.pl}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, lang, decimals = 1, onChange }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-1">
        <label htmlFor={label} className="text-[10.5px] uppercase tracking-[0.13em] text-neutral-500">{label}</label>
        <b className="font-normal tabular-nums text-[13px] text-amber-300">{nf(lang, value, decimals)} {unit}</b>
      </div>
      <input
        id={label} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-amber-400"
      />
    </div>
  );
}

const sameParams = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ------------------------------------------------------------
export default function RingConfigurator({ lang = "pl" }) {
  const t = L[lang] || L.pl;
  const [p, setP] = useState(DEFAULTS);
  const [presetId, setPresetId] = useState(null);
  // Otwarta grupa wzorow. Zaczynamy od pierscionkow z jednym kamieniem, bo
  // po nie siega wiekszosc odwiedzajacych.
  const [grupa, setGrupa] = useState(PRESET_GROUPS[0].id);
  const [mesh, setMesh] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);
  const [fitNotice, setFitNotice] = useState(null);

  const workerRef = useRef(null);
  const seqRef = useRef(0);
  const lastValidParamsRef = useRef(DEFAULTS);

  // Reczna zmiana czegokolwiek odznacza wzor: od tego momentu to juz nie jest
  // "soliter klasyczny", tylko projekt klienta, i podswietlony kafelek
  // klamalby o tym, co widac na podgladzie.
  const set = (patch) => { setFitNotice(null); setPresetId(null); setP((prev) => ({ ...prev, ...patch })); };
  const setStone = (patch) => { setFitNotice(null); setPresetId(null); setP((prev) => ({ ...prev, stone: { ...prev.stone, ...patch } })); };
  const setSide = (patch) => { setFitNotice(null); setPresetId(null); setP((prev) => ({ ...prev, side: { ...prev.side, ...patch } })); };
  const setSignet = (patch) => { setFitNotice(null); setPresetId(null); setP((prev) => ({ ...prev, signet: { ...prev.signet, ...patch } })); };

  // Zakucie musi pasowac do szlifu, wiec przy zmianie szlifu poprawiamy je
  // sami, zamiast pokazywac klientowi blad z generatora.
  const allowed = p.kind === "signet" ? [] : (CUTS[p.stone.cut]?.settings || []);
  useEffect(() => {
    if (p.kind !== "signet" && allowed.length && !allowed.includes(p.setting)) {
      set({ setting: allowed[0] });
    }
  }, [p.stone.cut]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const w = new Worker(new URL("../../workers/ringGenerator.worker.js", import.meta.url), { type: "module" });
    workerRef.current = w;
    w.onmessage = (e) => {
      // Odpowiedz starsza niz ostatnie zapytanie jest juz nieaktualna:
      // suwak zdazyl wyslac kolejne, a jej narysowanie cofneloby podglad.
      if (e.data.seq !== seqRef.current) return;
      setBusy(false);
      if (!e.data.ok) { setError(e.data.error); return; }
      setError(null);
      setMesh({ metal: e.data.metal, stones: e.data.stones,
        haloStones: e.data.haloStones, sideStones: e.data.sideStones });
      // Generator jest ostatnim slowem w sprawie parametrow. Jezeli wejscie
      // zostalo znormalizowane, formularz ma pokazac dokladnie te same liczby
      // co bryla i wycena. Porownanie przed zapisem zatrzymuje petle worker ->
      // stan -> worker dla odpowiedzi, ktora niczego juz nie zmienia.
      lastValidParamsRef.current = e.data.params;
      setP((prev) => sameParams(prev, e.data.params) ? prev : e.data.params);
      setInfo({
        massG: e.data.massG, volumeMm3: e.data.volumeMm3,
        stoneMassG: e.data.stoneMassG || 0,
        caratTotal: e.data.caratTotal || 0,
        triangles: e.data.metal.triangles,
        // Liczbe kamieni bierzemy z GENERATORA, bo dla halo i obwodu wynika
        // ona z obwodu wienca, a nie z niczego, co klient wpisal.
        stones: e.data.stoneCount,
      });
    };
    return () => { w.terminate(); workerRef.current = null; };
  }, []);

  useEffect(() => {
    const w = workerRef.current;
    if (!w) return undefined;

    // Uniewazniamy poprzednia odpowiedz od razu po zmianie stanu, a nie
    // dopiero po debounce. Worker moze skonczyc stara bryle w tych 90 ms i
    // bez tej rezerwacji cofnalby formularz do poprzednich parametrow.
    const seq = ++seqRef.current;

    // Kontrola wykonalnosci odbywa sie przed workerem. Zmiana szerokosci albo
    // taperu moze zmniejszyc lokalny przekroj pod juz wybranym kamieniem.
    // Gdy nadal istnieje poprawny rozmiar, pokazujemy korekte i ustawiamy go
    // jawnie. Gdy nie miesci sie nawet minimum, blokujemy zmiane i wracamy do
    // ostatniej bryly zaakceptowanej przez generator.
    const fit = localStoneFitLimits(p);
    if (p.kind === "ring" && p.side.count > 0 && p.side.setting !== "prong") {
      if (!fit.side.feasible) {
        setFitNotice({ type: "blocked" });
        setError(null);
        setBusy(false);
        setP(lastValidParamsRef.current);
        return undefined;
      }
      if (p.side.size > fit.side.max + 1e-9) {
        setFitNotice({ type: "side", from: p.side.size, to: fit.side.max });
        setError(null);
        setP((prev) => ({ ...prev, side: { ...prev.side, size: fit.side.max } }));
        return undefined;
      }
    }
    if (p.kind === "band" && p.band.coverage !== "none") {
      if (!fit.band.feasible) {
        setFitNotice({ type: "blocked" });
        setError(null);
        setBusy(false);
        setP(lastValidParamsRef.current);
        return undefined;
      }
      if (p.band.size > fit.band.max + 1e-9) {
        setFitNotice({ type: "band", from: p.band.size, to: fit.band.max });
        setError(null);
        setP((prev) => ({ ...prev, band: { ...prev.band, size: fit.band.max } }));
        return undefined;
      }
    }

    setBusy(true);
    // Suwak wysyla zdarzenie przy kazdym pikselu. Bez odczekania jadro
    // liczyloby kilkanascie bryl, z ktorych zobaczylibysmy tylko ostatnia.
    const id = setTimeout(() => {
      w.postMessage({ seq, params: p });
    }, 90);
    return () => clearTimeout(id);
  }, [p]);

  const sizeRow = useMemo(
    () => RING_SIZES.reduce((best, r) =>
      Math.abs(r.dia - p.innerDia) < Math.abs(best.dia - p.innerDia) ? r : best, RING_SIZES[0]),
    [p.innerDia],
  );

  // Srebro ma jeden kolor, zloto trzy. Lista idzie z danych stopu, wiec
  // dodanie platyny nie bedzie wymagalo dotykania formularza.
  const metalColors = colorsFor(p.alloy);
  const stoneFit = useMemo(() => localStoneFitLimits(p), [p]);

  const aktywny = RING_PRESETS.find((x) => x.id === presetId) || null;
  const signet = p.kind === "signet";
  const obraczka = p.kind === "band";
  const noSide = signet || p.setting === "drilled" || p.side.count === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="grid lg:grid-cols-[300px_1fr]">

        {/* ---------- parametry ---------- */}
        <div className="border-b lg:border-b-0 lg:border-r border-white/10 p-5">
          {fitNotice ? (
            <div role="status" className="mb-4 rounded-sm border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-[12px] leading-relaxed text-amber-200">
              {fitNotice.type === "blocked"
                ? t.fitBlocked
                : `${fitNotice.type === "side" ? t.sideReduced : t.bandReduced}: ${nf(lang, fitNotice.from, 1)} -> ${nf(lang, fitNotice.to, 1)} mm.`}
            </div>
          ) : null}
          {/* Wybor wzoru jest DWUPOZIOMOWY. Szesnascie kafelkow obok siebie
              tworzy sciane, w ktorej nie widac zadnej roznicy, a klient
              i tak najpierw wie, czy chce pierscionek z kamieniem, obraczke,
              czy sygnet. Piktogramy rysuja sie z tych samych parametrow,
              z ktorych powstaje bryla, wiec nie moga obiecac czegos innego. */}
          <Group label={t.preset} hint={aktywny ? nameOf(aktywny.note, lang) : null}>
            <Seg value={grupa} onChange={setGrupa}
              options={PRESET_GROUPS.map((g) => ({ id: g.id, label: nameOf(g.label, lang) }))} />

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {RING_PRESETS.filter((x) => x.group === grupa).map((wzor) => (
                <button
                  key={wzor.id} type="button"
                  onClick={() => { setFitNotice(null); setPresetId(wzor.id); setP((prev) => applyPreset(wzor, prev)); }}
                  aria-pressed={wzor.id === presetId}
                  title={nameOf(wzor.note, lang)}
                  className={`flex flex-col items-center gap-1 rounded-sm border px-1 py-2 transition-colors ${
                    wzor.id === presetId
                      ? "border-amber-400/55 bg-amber-400/10 text-amber-300"
                      : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/25 hover:text-neutral-200"
                  }`}
                >
                  <PresetIcon preset={wzor} size={40} />
                  <span className="text-[10px] leading-tight text-center">{nameOf(wzor.label, lang)}</span>
                </button>
              ))}
            </div>
          </Group>

          <Group label={t.kind}>
            <Seg value={p.kind} onChange={(id) => set({ kind: id })}
              options={[{ id: "ring", label: t.ring }, { id: "signet", label: t.signet },
                        { id: "band", label: t.band }]} />
          </Group>

          <Slider label={t.size} lang={lang} unit={`mm (EU ${sizeRow.eu})`}
            value={p.innerDia} min={LIMITS.innerDia[0]} max={LIMITS.innerDia[1]} step={0.1}
            onChange={(v) => set({ innerDia: v })} />

          <Group label={t.alloy}>
            <Seg value={p.alloy} onChange={(id) => set({ alloy: id })}
              options={Object.entries(CASTING_ALLOYS).map(([id, a]) => ({ id, label: a.label[lang] || a.label.pl }))} />
          </Group>

          {/* Srebro ma jeden kolor, wiec przelacznik z jednym przyciskiem
              bylby atrapa wyboru. Chowamy go zamiast blokowac. */}
          {metalColors.length > 1 ? (
            <Group label={t.color} hint={p.color === "white" ? t.rhodiumNote : null}>
              <Seg value={p.color} onChange={(id) => set({ color: id })}
                options={metalColors.map((id) => ({
                  id,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className="w-3 h-3 rounded-full border border-black/30"
                        style={{ background: METAL_COLORS[id].tone }} />
                      {METAL_COLORS[id].label[lang] || METAL_COLORS[id].label.pl}
                    </span>
                  ),
                }))} />
            </Group>
          ) : null}

          <Group label={t.profile}>
            <Seg value={p.profile} onChange={(id) => set({ profile: id })}
              options={SHANK_PROFILES.map((id) => ({ id, label: t.profiles[id] }))} />
          </Group>

          {/* Sygnet ma sylwetke wynikajaca z konstrukcji: ramiona MUSZA
              zgestniec pod tarcza, inaczej glowica stoi na patyku. */}
          {!signet && !obraczka ? (
            <Group label={t.taper}>
              <Seg value={p.taper === "auto" ? "none" : p.taper}
                onChange={(id) => set({ taper: id })}
                options={["none", "tapered", "cathedral"].map((id) => ({ id, label: t.tapers[id] }))} />
            </Group>
          ) : null}

          <Slider label={t.width} lang={lang} unit="mm" value={p.width}
            min={LIMITS.width[0]} max={LIMITS.width[1]} step={0.1} onChange={(v) => set({ width: v })} />
          <Slider label={t.thickness} lang={lang} unit="mm" value={p.thickness}
            min={LIMITS.thickness[0]} max={LIMITS.thickness[1]} step={0.1} onChange={(v) => set({ thickness: v })} />

          {!signet && !obraczka && (
            <>
              <Group label={t.cut} hint={CUTS[p.stone.cut] ? hintOf(CUTS[p.stone.cut], lang) : null}>
                <div className="grid grid-cols-4 gap-1">
                  {Object.entries(CUTS).map(([id, c]) => (
                    <button
                      key={id} type="button" onClick={() => setStone({ cut: id })}
                      aria-pressed={id === p.stone.cut} title={nameOf(c, lang)}
                      className={`flex flex-col items-center gap-0.5 rounded-sm border px-1 py-1.5 transition-colors ${
                        id === p.stone.cut
                          ? "border-amber-400/55 bg-amber-400/10 text-amber-300"
                          : "border-white/10 bg-white/[0.03] text-neutral-500 hover:border-white/20 hover:text-neutral-300"
                      }`}
                    >
                      <CutIcon cut={id} className="w-full h-auto" />
                      <span className="text-[8.5px] leading-tight text-center">{nameOf(c, lang)}</span>
                    </button>
                  ))}
                </div>
              </Group>

              <Group label={t.halo}>
                <Seg value={p.halo.on ? "on" : "off"}
                  onChange={(id) => setP((prev) => { setPresetId(null);
                    return { ...prev, halo: { ...prev.halo, on: id === "on" } }; })}
                  options={[{ id: "off", label: t.off }, { id: "on", label: t.on }]} />
              </Group>

              {p.halo.on ? (
                <>
                  <Slider label={t.haloSize} lang={lang} unit="mm" value={p.halo.size}
                    min={LIMITS.haloSize[0]} max={LIMITS.haloSize[1]} step={0.1} decimals={1}
                    onChange={(v) => setP((prev) => { setPresetId(null);
                      return { ...prev, halo: { ...prev.halo, size: v } }; })} />
                  <Group label={t.gem}>
                    <GemSelect value={p.halo.material} lang={lang} groupLabels={t.gemGroups}
                      onChange={(id) => setP((prev) => { setPresetId(null);
                        return { ...prev, halo: { ...prev.halo, material: id } }; })} />
                  </Group>
                </>
              ) : null}

              <Group label={t.setting}>
                <Seg value={p.setting} onChange={(id) => set({ setting: id })}
                  options={allowed.map((id) => ({ id, label: nameOf(SETTINGS[id], lang) }))} />
              </Group>

              <Group label={t.gem}>
                <GemSelect value={p.stone.material} lang={lang} groupLabels={t.gemGroups}
                  onChange={(id) => setStone({ material: id })} />
              </Group>

              <Slider label={t.stoneSize} lang={lang} unit="mm" value={p.stone.size}
                min={LIMITS.stoneSize[0]} max={LIMITS.stoneSize[1]} step={0.5}
                onChange={(v) => setStone({ size: v })} />

              {p.setting !== "drilled" && (
                <Group label={t.side}>
                  <Seg value={String(p.side.count)} onChange={(id) => setSide({ count: Number(id) })}
                    options={[{ id: "0", label: t.none }, { id: "3", label: "3" },
                      { id: "4", label: "4" }, { id: "5", label: "5" }]} />
                </Group>
              )}

              {!noSide && (
                <>
                  <Group label={t.sideCut} hint={CUTS[p.side.cut] ? hintOf(CUTS[p.side.cut], lang) : null}>
                    <div className="grid grid-cols-4 gap-1">
                      {SIDE_CUTS.map((id) => [id, CUTS[id]]).map(([id, c]) => (
                        <button
                          key={id} type="button" onClick={() => setSide({ cut: id })}
                          aria-pressed={id === p.side.cut} title={nameOf(c, lang)}
                          className={`flex flex-col items-center gap-0.5 rounded-sm border px-1 py-1.5 transition-colors ${
                            id === p.side.cut
                              ? "border-amber-400/55 bg-amber-400/10 text-amber-300"
                              : "border-white/10 bg-white/[0.03] text-neutral-500 hover:border-white/20 hover:text-neutral-300"
                          }`}
                        >
                          <CutIcon cut={id} className="w-full h-auto" />
                          <span className="text-[8.5px] leading-tight text-center">{nameOf(c, lang)}</span>
                        </button>
                      ))}
                    </div>
                  </Group>

                  <Group label={t.sideSetting} hint={SIDE_SETTINGS[p.side.setting] ? hintOf(SIDE_SETTINGS[p.side.setting], lang) : null}>
                    <Seg value={p.side.setting} onChange={(id) => setSide({ setting: id })}
                      options={Object.entries(SIDE_SETTINGS).map(([id, v]) => ({ id, label: nameOf(v, lang) }))} />
                  </Group>
                  <Group label={t.sideGem}>
                    <GemSelect value={p.side.material} lang={lang} groupLabels={t.gemGroups}
                      onChange={(id) => setSide({ material: id })} />
                  </Group>

                  <Slider label={t.sideSize} lang={lang} unit="mm" value={p.side.size}
                    min={LIMITS.sideSize[0]}
                    max={stoneFit.side.feasible ? stoneFit.side.max : LIMITS.sideSize[0]} step={0.1}
                    onChange={(v) => setSide({ size: v })} />

                  {/* Odsuniecie od korony i rozstaw. Generator liczy oba
                      z prawdziwej szerokosci glowicy, wiec zero znaczy
                      "tuz przy koronie", a nie "w koronie". */}
                  <Slider label={t.sideGap} lang={lang} unit="mm" value={p.side.gap}
                    min={LIMITS.sideGap[0]} max={LIMITS.sideGap[1]} step={0.05}
                    onChange={(v) => setSide({ gap: v })} />
                  <Slider label={t.sideSpread} lang={lang} unit="mm" value={p.side.spread}
                    min={LIMITS.sideSpread[0]} max={LIMITS.sideSpread[1]} step={0.05}
                    onChange={(v) => setSide({ spread: v })} />
                </>
              )}
            </>
          )}

          {obraczka && (
            <>
              <Group label={t.coverage} hint={p.band.coverage === "full" ? t.eternityWarn : null}>
                <Seg value={p.band.coverage}
                  onChange={(id) => setP((prev) => { setFitNotice(null); setPresetId(null);
                    return { ...prev, band: { ...prev.band, coverage: id } }; })}
                  options={["none", "half", "full"].map((id) => ({ id, label: t.coverages[id] }))} />
              </Group>

              {p.band.coverage !== "none" ? (
                <>
                  <Slider label={t.bandSize} lang={lang} unit="mm" value={p.band.size}
                    min={LIMITS.bandSize[0]}
                    max={stoneFit.band.feasible ? stoneFit.band.max : LIMITS.bandSize[0]} step={0.1}
                    onChange={(v) => setP((prev) => { setFitNotice(null); setPresetId(null);
                      return { ...prev, band: { ...prev.band, size: v } }; })} />
                  <Group label={t.gem}>
                    <GemSelect value={p.band.material} lang={lang} groupLabels={t.gemGroups}
                      onChange={(id) => setP((prev) => { setPresetId(null);
                        return { ...prev, band: { ...prev.band, material: id } }; })} />
                  </Group>
                </>
              ) : null}
            </>
          )}

          <Group label={t.previewTitle}>
            <label className={`flex items-center gap-2.5 rounded-sm border px-2.5 py-2 text-[13px] transition-colors ${
              p.casting.stones
                ? "border-amber-400/50 bg-amber-400/10 text-amber-200 cursor-pointer"
                : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/20 cursor-pointer"
            }`}>
              <input type="checkbox" className="accent-amber-400"
                checked={Boolean(p.casting.stones)}
                onChange={(e) => setP((prev) => ({
                  ...prev,
                  casting: { ...prev.casting, stones: e.target.checked },
                }))} />
              {t.stonesIn}
            </label>
          </Group>

          {/* DODATKI DO PLIKU. Osobna sekcja, bo nie sa czescia wyrobu:
              nie zmieniaja ani jego wygladu na palcu, ani ceny. Potrzebuje
              ich wylacznie ten, kto sam odlewa. */}
          <Group label={t.castingTitle} hint={t.castingHint}>
            <div className="space-y-1.5">
              {[
                ["sprues", t.sprues, false, null],
                ["innerSprues", t.innerSprues, !p.casting.sprues, t.innerNeedsSprue],
                ["button", t.button, !p.casting.sprues, t.buttonNeedsSprue],
              ].map(([id, etykieta, zablokowany, powod]) => (
                <label key={id}
                  className={`flex items-center gap-2.5 rounded-sm border px-2.5 py-2 text-[13px] transition-colors ${
                    zablokowany
                      ? "border-white/5 bg-white/[0.01] text-neutral-600 cursor-not-allowed"
                      : p.casting[id]
                        ? "border-amber-400/50 bg-amber-400/10 text-amber-200 cursor-pointer"
                        : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/20 cursor-pointer"
                  }`}
                  title={zablokowany ? powod : undefined}
                >
                  <input type="checkbox" className="accent-amber-400"
                    checked={Boolean(p.casting[id])} disabled={zablokowany}
                    onChange={(e) => setP((prev) => {
                      setPresetId(null);
                      const casting = { ...prev.casting, [id]: e.target.checked };
                      // Stopka i kanaly wewnetrzne wpinaja sie w kanal glowny,
                      // wiec gasna razem z nim.
                      if (id === "sprues" && !e.target.checked) {
                        casting.button = false;
                        casting.innerSprues = false;
                      }
                      return { ...prev, casting };
                    })} />
                  {etykieta}
                </label>
              ))}
            </div>
          </Group>

          {signet && (
            <>
              <Group label={t.table}>
                <Seg value={p.signet.table} onChange={(id) => setSignet({ table: id })}
                  options={Object.entries(SIGNET_TABLES).map(([id, def]) => ({ id, label: def[lang] || def.pl }))} />
              </Group>
              <Slider label={t.tableLen} lang={lang} unit="mm" value={p.signet.length}
                min={LIMITS.signetLength[0]} max={LIMITS.signetLength[1]} step={0.5}
                onChange={(v) => setSignet({ length: v })} />
              <Group label={t.face}>
                <Seg value={p.signet.face} onChange={(id) => setSignet({ face: id })}
                  options={Object.entries(SIGNET_FACES).map(([id, def]) => ({ id, label: def[lang] || def.pl }))} />
              </Group>
              <Group label={t.engraving}>
                <Seg value={p.signet.engraving} onChange={(id) => setSignet({ engraving: id })}
                  options={["none", "mono", "crest"].map((id) => ({ id, label: t.engravings[id] }))} />
              </Group>
            </>
          )}
        </div>

        {/* ---------- podglad ---------- */}
        <div className="p-5">
          <div className="relative aspect-square lg:aspect-[4/3] rounded-xl border border-white/10 bg-black overflow-hidden">
            <Suspense fallback={null}>
              {mesh ? (
                <RingPreview3D
                  metal={mesh.metal} stones={mesh.stones}
                  haloStones={mesh.haloStones} sideStones={mesh.sideStones}
                  alloy={p.alloy} color={p.color}
                  gem={p.kind === "band" ? p.band.material : p.stone.material}
                  haloGem={p.halo.material}
                  sideGem={p.kind === "band" ? p.band.material : p.side.material}
                  gemSize={p.kind === "band" ? p.band.size : p.stone.size}
                  haloSize={p.halo.size}
                  sideSize={p.kind === "band" ? p.band.size : p.side.size}
                />
              ) : null}
            </Suspense>
            <div className="pointer-events-none absolute left-3 top-3 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              {busy ? t.building : t.dragHint}
            </div>
            {error ? (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-rose-400">
                {error}
              </div>
            ) : null}
          </div>

          {/* Masa PIERSCIONKA i masa METALU osobno.
              Klient trzyma w reku pierscionek, wiec interesuje go pierwsza,
              ale to druga decyduje o koszcie kruszcu i to ona zostaje bez
              zmian, gdy kamienie wyjmiemy z modelu. Jedna liczba nie moze
              odpowiedziec na oba pytania naraz. */}
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
            {[
              [t.massTotal, info ? `${nf(lang, info.massG + info.stoneMassG, 2)} g` : "–"],
              [t.mass, info ? `${nf(lang, info.massG, 2)} g` : "–"],
              [t.carats, info ? `${nf(lang, info.caratTotal, 2)} ct` : "–"],
              [t.stones, info ? String(info.stones) : "–"],
              [t.circ, `${nf(lang, Math.PI * p.innerDia, 1)} mm`],
            ].map(([k, v]) => (
              <div key={k} className="bg-neutral-950 px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1">{k}</dt>
                <dd className="tabular-nums text-[15px] text-neutral-200">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Kwota wiazaca pojawia sie dopiero, gdy bryla sie policzyla:
              wczesniej nie ma czego wyceniac, a pusta ramka z kreskami
              wyglada jak usterka. */}
          {info ? (
            <Suspense fallback={null}>
              <RingPriceBox params={p} lang={lang} />
            </Suspense>
          ) : null}
        </div>
      </div>
    </div>
  );
}
