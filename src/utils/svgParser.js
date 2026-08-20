// ============================================================
// SVG PARSER - client-side geometry extraction from SVG files
// Extracts bounding box, path lengths, and area for laser pricing.
// ============================================================

/**
 * Parse an SVG file and return geometry metrics.
 * @param {string} svgText
 * @returns {{ bboxMm: {x,y}, pathLengthCm: number, engravAreaCm2: number, pathCount: number, svgText: string }}
 */
export function parseSVG(svgText) {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svgEl = doc.documentElement;
  if (svgEl.querySelector("parsererror")) throw new Error("Invalid SVG");

  const scaleToMm = resolveScale(svgEl);

  const container = document.createElement("div");
  container.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;width:0;height:0;overflow:hidden";
  document.body.appendChild(container);

  const clone = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  clone.innerHTML = svgEl.innerHTML;
  for (const a of svgEl.attributes) clone.setAttribute(a.name, a.value);
  container.appendChild(clone);

  let bboxMm;
  // POLOZENIE TRESCI, A NIE TYLKO JEJ ROZMIAR. Rysunek bywa malym znakiem
  // na arkuszu A4: pole rysunku ma wtedy 210x297, a sam znak 20x20 gdzies
  // w rogu. Podglad rysowany z pola arkusza pokazuje wiec glownie pustke
  // i ledwo widoczny wzor. Zeby dalo sie go przyciac do tresci, potrzebne
  // sa OBA prostokaty: tresci i calego plotna.
  let contentBox = null;
  try {
    const bb = clone.getBBox();
    bboxMm = { x: bb.width * scaleToMm, y: bb.height * scaleToMm };
    if (bb.width > 0 && bb.height > 0) {
      contentBox = { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
    }
  } catch {
    bboxMm = { x: 100, y: 100 };
  }
  const canvasBox = resolveCanvas(svgEl, contentBox);

  const shapes = clone.querySelectorAll("path,line,rect,circle,ellipse,polygon,polyline");
  let totalLength = 0;
  let pathCount = 0;
  for (const s of shapes) {
    try { totalLength += s.getTotalLength(); pathCount++; } catch {}
  }

  document.body.removeChild(container);

  return {
    bboxMm,
    pathLengthCm: (totalLength * scaleToMm) / 10,
    engravAreaCm2: (bboxMm.x * bboxMm.y) / 100,
    pathCount,
    contentBox,
    canvasBox,
    svgText,
  };
}

/**
 * Prostokat calego plotna w tych samych jednostkach co `contentBox`.
 *
 * `viewBox` jest zrodlem pewnym. Gdy go nie ma, przegladarka rysuje plik od
 * punktu (0,0) do rozmiaru z atrybutow, a gdy i tych nie ma, dopasowuje sie
 * do tresci; wtedy plotno JEST trescia i przycinac nie ma czego.
 */
function resolveCanvas(svgEl, contentBox) {
  const vb = svgEl.getAttribute("viewBox");
  if (vb) {
    const [x, y, w, h] = vb.split(/[\s,]+/).map(Number);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0, w, h };
    }
  }
  const w = parseFloat(svgEl.getAttribute("width"));
  const h = parseFloat(svgEl.getAttribute("height"));
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return { x: 0, y: 0, w, h };
  return contentBox ? { ...contentBox } : null;
}

function resolveScale(svgEl) {
  const wAttr = svgEl.getAttribute("width");
  const vb = svgEl.getAttribute("viewBox");

  if (vb) {
    const vbW = vb.split(/[\s,]+/).map(Number)[2];
    const wMm = parseUnits(wAttr);
    if (wMm && vbW) return wMm / vbW;
    return 1;
  }

  return 25.4 / 96;
}

function parseUnits(value) {
  if (!value) return null;
  const m = value.trim().match(/^([0-9.]+)\s*(mm|cm|in)$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  switch (m[2].toLowerCase()) {
    case "mm": return n;
    case "cm": return n * 10;
    case "in": return n * 25.4;
    default: return null;
  }
}
