// ============================================================
// SVG PARSER — client-side geometry extraction from SVG files
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
  try {
    const bb = clone.getBBox();
    bboxMm = { x: bb.width * scaleToMm, y: bb.height * scaleToMm };
  } catch {
    bboxMm = { x: 100, y: 100 };
  }

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
    svgText,
  };
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
