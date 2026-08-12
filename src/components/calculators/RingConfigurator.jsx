// ============================================================
// KREATOR PIERSCIONKOW
// ============================================================
// Klient sklada pierscionek z parametrow i widzi go na biezaco. Bryle liczy
// watek roboczy tym samym kodem, ktory na serwerze zbuduje kupowany plik,
// wiec podglad i wyrob nie moga sie rozjechac.
//
// CENY TU NIE MA i to nie jest przeoczenie. Masa decyduje o koszcie kruszcu,
// wiec kwota musi pochodzic z serwera, a nie z przegladarki, ktora jest o
// jedno `fetch` od podmiany. Odczyty ponizej sa informacja o geometrii.

import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { CUTS, SETTINGS, SIDE_SETTINGS, SHANK_PROFILES, SIGNET_TABLES, DEFAULTS, LIMITS } from "../../geometry/ring/params.js";
import { CASTING_ALLOYS } from "../../data/castingAlloys.js";
import { RING_SIZES } from "../../data/ringSizes.js";
import CutIcon from "./jewelry/CutIcon.jsx";

const RingPreview3D = lazy(() => import("./jewelry/RingPreview3D.jsx"));

const L = {
  pl: {
    kind: "Typ wyrobu", ring: "Pierścionek", signet: "Sygnet",
    size: "Rozmiar", alloy: "Metal", profile: "Profil szyny",
    width: "Szerokość szyny", thickness: "Grubość szyny",
    cut: "Szlif kamienia centralnego", setting: "Zakucie", stoneSize: "Rozmiar kamienia",
    side: "Kamienie na szynie, na stronę", sideSetting: "Oprawa kamieni bocznych",
    sideSize: "Średnica bocznych", none: "Brak",
    table: "Tarcza sygnetu", tableLen: "Długość tarczy", engraving: "Grawer tarczy",
    mass: "Masa metalu", circ: "Obwód", stones: "Kamieni", tri: "Trójkątów",
    building: "Liczę bryłę…", dragHint: "Przeciągnij, żeby obrócić",
    profiles: { round: "Półokrągły", flat: "Płaski", knife: "Nożowy", comfort: "Comfort" },
    tables: { oval: "Owalna", cushion: "Poduszka", rect: "Prostokątna" },
    engravings: { none: "Gładka", mono: "Monogram", crest: "Herb" },
  },
  en: {
    kind: "Piece", ring: "Ring", signet: "Signet",
    size: "Size", alloy: "Metal", profile: "Shank profile",
    width: "Shank width", thickness: "Shank thickness",
    cut: "Centre stone cut", setting: "Setting", stoneSize: "Stone size",
    side: "Side stones, per side", sideSetting: "Side stone setting",
    sideSize: "Side stone diameter", none: "None",
    table: "Signet table", tableLen: "Table length", engraving: "Table engraving",
    mass: "Metal mass", circ: "Circumference", stones: "Stones", tri: "Triangles",
    building: "Building the solid…", dragHint: "Drag to rotate",
    profiles: { round: "Half-round", flat: "Flat", knife: "Knife-edge", comfort: "Comfort" },
    tables: { oval: "Oval", cushion: "Cushion", rect: "Rectangular" },
    engravings: { none: "Plain", mono: "Monogram", crest: "Crest" },
  },
  de: {
    kind: "Stück", ring: "Ring", signet: "Siegelring",
    size: "Größe", alloy: "Metall", profile: "Schienenprofil",
    width: "Schienenbreite", thickness: "Schienenstärke",
    cut: "Schliff des Hauptsteins", setting: "Fassung", stoneSize: "Steingröße",
    side: "Steine auf der Schiene, je Seite", sideSetting: "Fassung der Seitensteine",
    sideSize: "Durchmesser der Seitensteine", none: "Keine",
    table: "Siegelplatte", tableLen: "Plattenlänge", engraving: "Gravur der Platte",
    mass: "Metallmasse", circ: "Umfang", stones: "Steine", tri: "Dreiecke",
    building: "Körper wird berechnet…", dragHint: "Zum Drehen ziehen",
    profiles: { round: "Halbrund", flat: "Flach", knife: "Messerkante", comfort: "Comfort" },
    tables: { oval: "Oval", cushion: "Kissen", rect: "Rechteckig" },
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

// ------------------------------------------------------------
export default function RingConfigurator({ lang = "pl" }) {
  const t = L[lang] || L.pl;
  const [p, setP] = useState(DEFAULTS);
  const [mesh, setMesh] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);

  const workerRef = useRef(null);
  const seqRef = useRef(0);

  const set = (patch) => setP((prev) => ({ ...prev, ...patch }));
  const setStone = (patch) => setP((prev) => ({ ...prev, stone: { ...prev.stone, ...patch } }));
  const setSide = (patch) => setP((prev) => ({ ...prev, side: { ...prev.side, ...patch } }));
  const setSignet = (patch) => setP((prev) => ({ ...prev, signet: { ...prev.signet, ...patch } }));

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
      setMesh({ metal: e.data.metal, stones: e.data.stones });
      setInfo({
        massG: e.data.massG, volumeMm3: e.data.volumeMm3,
        triangles: e.data.metal.triangles,
        stones: e.data.params.kind === "signet" ? 0
          : (e.data.params.setting === "drilled" ? 0 : 1 + e.data.params.side.count * 2),
      });
    };
    return () => { w.terminate(); workerRef.current = null; };
  }, []);

  useEffect(() => {
    const w = workerRef.current;
    if (!w) return undefined;
    setBusy(true);
    // Suwak wysyla zdarzenie przy kazdym pikselu. Bez odczekania jadro
    // liczyloby kilkanascie bryl, z ktorych zobaczylibysmy tylko ostatnia.
    const id = setTimeout(() => {
      seqRef.current += 1;
      w.postMessage({ seq: seqRef.current, params: p });
    }, 90);
    return () => clearTimeout(id);
  }, [p]);

  const sizeRow = useMemo(
    () => RING_SIZES.reduce((best, r) =>
      Math.abs(r.dia - p.innerDia) < Math.abs(best.dia - p.innerDia) ? r : best, RING_SIZES[0]),
    [p.innerDia],
  );

  const signet = p.kind === "signet";
  const noSide = signet || p.setting === "drilled" || p.side.count === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="grid lg:grid-cols-[300px_1fr]">

        {/* ---------- parametry ---------- */}
        <div className="border-b lg:border-b-0 lg:border-r border-white/10 p-5">
          <Group label={t.kind}>
            <Seg value={p.kind} onChange={(id) => set({ kind: id })}
              options={[{ id: "ring", label: t.ring }, { id: "signet", label: t.signet }]} />
          </Group>

          <Slider label={t.size} lang={lang} unit={`mm (EU ${sizeRow.eu})`}
            value={p.innerDia} min={LIMITS.innerDia[0]} max={LIMITS.innerDia[1]} step={0.1}
            onChange={(v) => set({ innerDia: v })} />

          <Group label={t.alloy}>
            <Seg value={p.alloy} onChange={(id) => set({ alloy: id })}
              options={Object.entries(CASTING_ALLOYS).map(([id, a]) => ({ id, label: a.label[lang] || a.label.pl }))} />
          </Group>

          <Group label={t.profile}>
            <Seg value={p.profile} onChange={(id) => set({ profile: id })}
              options={SHANK_PROFILES.map((id) => ({ id, label: t.profiles[id] }))} />
          </Group>

          <Slider label={t.width} lang={lang} unit="mm" value={p.width}
            min={LIMITS.width[0]} max={LIMITS.width[1]} step={0.1} onChange={(v) => set({ width: v })} />
          <Slider label={t.thickness} lang={lang} unit="mm" value={p.thickness}
            min={LIMITS.thickness[0]} max={LIMITS.thickness[1]} step={0.1} onChange={(v) => set({ thickness: v })} />

          {!signet && (
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

              <Group label={t.setting}>
                <Seg value={p.setting} onChange={(id) => set({ setting: id })}
                  options={allowed.map((id) => ({ id, label: nameOf(SETTINGS[id], lang) }))} />
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
                  <Group label={t.sideSetting} hint={SIDE_SETTINGS[p.side.setting] ? hintOf(SIDE_SETTINGS[p.side.setting], lang) : null}>
                    <Seg value={p.side.setting} onChange={(id) => setSide({ setting: id })}
                      options={Object.entries(SIDE_SETTINGS).map(([id, v]) => ({ id, label: nameOf(v, lang) }))} />
                  </Group>
                  <Slider label={t.sideSize} lang={lang} unit="mm" value={p.side.size}
                    min={LIMITS.sideSize[0]} max={LIMITS.sideSize[1]} step={0.1}
                    onChange={(v) => setSide({ size: v })} />
                </>
              )}
            </>
          )}

          {signet && (
            <>
              <Group label={t.table}>
                <Seg value={p.signet.table} onChange={(id) => setSignet({ table: id })}
                  options={SIGNET_TABLES.map((id) => ({ id, label: t.tables[id] }))} />
              </Group>
              <Slider label={t.tableLen} lang={lang} unit="mm" value={p.signet.length}
                min={LIMITS.signetLength[0]} max={LIMITS.signetLength[1]} step={0.5}
                onChange={(v) => setSignet({ length: v })} />
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
              {mesh ? <RingPreview3D metal={mesh.metal} stones={mesh.stones} alloy={p.alloy} /> : null}
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

          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
            {[
              [t.mass, info ? `${nf(lang, info.massG, 2)} g` : "–"],
              [t.circ, `${nf(lang, Math.PI * p.innerDia, 1)} mm`],
              [t.stones, info ? String(info.stones) : "–"],
              [t.tri, info ? info.triangles.toLocaleString(lang === "pl" ? "pl-PL" : "en-US") : "–"],
            ].map(([k, v]) => (
              <div key={k} className="bg-neutral-950 px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1">{k}</dt>
                <dd className="tabular-nums text-[15px] text-neutral-200">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
