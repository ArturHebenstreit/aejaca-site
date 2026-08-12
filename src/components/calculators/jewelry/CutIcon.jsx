// ============================================================
// SZLIF KAMIENIA JAKO RYSUNEK
// ============================================================
// Nazwa szlifu nic nie mowi wiekszosci kupujacych. Roznicy miedzy trylionem
// a pieciokatem nie da sie wyjasnic slowem, a rysunkiem widac ja od razu.
//
// Obrysy bierzemy z `geometry/ring/params.js`, czyli z tego samego zrodla,
// z ktorego generator buduje bryle. Osobna kopia ksztaltow rozjechalaby sie
// przy pierwszej korekcie i kafelka pokazywalaby co innego niz podglad 3D.

import { CUTS, OUTLINES, resample, scalePts } from "../../../geometry/ring/params.js";

/** Ile fasetek rysujemy dla danego szlifu. Wiecej niz osiem robi sie plama. */
const FACETS = {
  round: 8, oval: 8, cushion: 8, square: 8, octagon: 8, baguette: 4,
  pentagon: 5, trillion: 6, pear: 8, marquise: 8, heart: 8, briolette: 8,
};

const pts2str = (pts, cx, cy, r) =>
  pts.map(([x, y]) => `${(cx + x * r).toFixed(2)},${(cy + y * r).toFixed(2)}`).join(" ");

/** Szlif brylantowy: tafla, kliny do obrysu, gwiazdy do polowy boku. */
function brilliantFacets(outline, n, cx, cy, r) {
  const edge = resample(outline, n * 2);          // wierzcholki i srodki bokow
  const table = resample(scalePts(outline, 0.5), n);
  const lines = [];
  for (let i = 0; i < n; i++) {
    lines.push([edge[i * 2], table[i]]);
    lines.push([edge[i * 2 + 1], table[i]]);
    lines.push([edge[i * 2 + 1], table[(i + 1) % n]]);
  }
  return lines.map(([a, b], i) => (
    <line key={i} x1={cx + a[0] * r} y1={cy + a[1] * r} x2={cx + b[0] * r} y2={cy + b[1] * r}
      stroke="currentColor" strokeWidth="0.6" opacity="0.75" />
  ));
}

/** Rozety i bufftop opisuje PRZEKROJ, nie obrys, wiec rysujemy je z boku. */
function profileShape(kind, cx, cy, r) {
  const P = (pts) => pts2str(pts, cx, cy, r);
  if (kind === "rosePav") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        <polygon points={P([[-1, -0.16], [1, -0.16], [0, 1.05]])} />
        <polygon points={P([[-1, -0.16], [-0.55, -0.8], [0.55, -0.8], [1, -0.16]])} />
        <line x1={cx} y1={cy - 0.8 * r} x2={cx} y2={cy - 0.16 * r} strokeWidth="0.6" />
        <line x1={cx - 0.5 * r} y1={cy - 0.16 * r} x2={cx} y2={cy + 1.05 * r} strokeWidth="0.6" />
        <line x1={cx + 0.5 * r} y1={cy - 0.16 * r} x2={cx} y2={cy + 1.05 * r} strokeWidth="0.6" />
      </g>
    );
  }
  if (kind === "dome") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d={`M ${cx - r} ${cy + r * 0.5} Q ${cx} ${cy - r * 1.15} ${cx + r} ${cy + r * 0.5} Z`} />
        {[-0.55, 0, 0.55].map((x, i) => (
          <line key={i} x1={cx + x * r} y1={cy + 0.5 * r} x2={cx + x * 0.72 * r} y2={cy - 0.48 * r}
            strokeWidth="0.6" />
        ))}
      </g>
    );
  }
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <polygon points={P([[-1, 0.34], [1, 0.34], [0.62, -0.2], [-0.62, -0.2]])} />
      <polygon points={P([[-0.62, -0.2], [0.62, -0.2], [0, -0.56]])} />
      {[-0.3, 0.3].map((x, i) => (
        <line key={i} x1={cx + x * r} y1={cy - 0.2 * r} x2={cx} y2={cy - 0.56 * r} strokeWidth="0.6" />
      ))}
    </g>
  );
}

/**
 * @param {string} cut identyfikator szlifu z `CUTS`
 * @param {number} [size] bok kwadratowego kadru w jednostkach viewBox
 */
export default function CutIcon({ cut, size = 100, className = "" }) {
  const def = CUTS[cut];
  if (!def) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.36;

  const body = (() => {
    if (def.profile === "rosePav") return profileShape("rosePav", cx, cy, r);
    if (def.profile === "dome") return profileShape("dome", cx, cy, r);
    if (def.profile === "rose") return profileShape("rose", cx, cy, r);

    const outline = OUTLINES[def.outline]();
    const n = FACETS[cut] || 8;

    if (def.profile === "step") {
      // Szlif schodkowy: koncentryczne obrysy i naroza je laczace.
      const k = resample(outline, n), k2 = resample(scalePts(outline, 0.74), n);
      return (
        <g fill="none" stroke="currentColor">
          <polygon points={pts2str(outline, cx, cy, r)} strokeWidth="1.1" />
          <polygon points={pts2str(scalePts(outline, 0.74), cx, cy, r)} strokeWidth="0.6" opacity="0.75" />
          <polygon points={pts2str(scalePts(outline, 0.5), cx, cy, r)} strokeWidth="0.6" opacity="0.75" />
          {k.map((a, i) => (
            <line key={i} x1={cx + a[0] * r} y1={cy + a[1] * r} x2={cx + k2[i][0] * r} y2={cy + k2[i][1] * r}
              strokeWidth="0.6" opacity="0.75" />
          ))}
        </g>
      );
    }

    if (def.profile === "drop") {
      // Brioleta jest oszlifowana dookola, wiec rysujemy poziome rzedy fasetek.
      const rows = [0.72, 0.46, 0.24];
      const spokes = resample(outline, 8);
      return (
        <g fill="none" stroke="currentColor">
          <polygon points={pts2str(outline, cx, cy, r)} strokeWidth="1.1" />
          {rows.map((s, i) => (
            <polygon key={i} strokeWidth="0.55" opacity="0.7"
              points={pts2str(outline.map(([x, y]) => [x * s, y * 0.98 - (1 - s) * 0.06]), cx, cy, r)} />
          ))}
          {spokes.map((a, i) => (
            <line key={i} x1={cx + a[0] * r} y1={cy + a[1] * r}
              x2={cx + a[0] * 0.24 * r} y2={cy + a[1] * 0.24 * r} strokeWidth="0.55" opacity="0.7" />
          ))}
        </g>
      );
    }

    return (
      <g fill="none" stroke="currentColor">
        <polygon points={pts2str(outline, cx, cy, r)} strokeWidth="1.1" />
        <polygon points={pts2str(scalePts(outline, 0.5), cx, cy, r)} strokeWidth="0.8" opacity="0.85" />
        <polygon points={pts2str(scalePts(outline, 0.88), cx, cy, r)} strokeWidth="0.4" opacity="0.5" />
        {brilliantFacets(outline, n, cx, cy, r)}
      </g>
    );
  })();

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true" focusable="false">
      {body}
    </svg>
  );
}
