// ============================================================
// STL PARSER — client-side volume & bounding box from STL files
// Supports both binary and ASCII STL formats.
// ============================================================

/**
 * Parse an STL file (ArrayBuffer) and return geometry metrics.
 * @param {ArrayBuffer} buffer
 * @returns {{ volumeCm3: number, bbox: {x:number,y:number,z:number}, surfaceAreaCm2: number, triangleCount: number }}
 */
export function parseSTL(buffer) {
  const isBinary = detectBinary(buffer);
  const triangles = isBinary ? parseBinarySTL(buffer) : parseAsciiSTL(buffer);

  let volume = 0;
  let surfaceArea = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < triangles.length; i++) {
    const tri = triangles[i];
    const [v1, v2, v3] = tri;

    // Bounding box
    for (const v of tri) {
      if (v[0] < minX) minX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[2] < minZ) minZ = v[2];
      if (v[0] > maxX) maxX = v[0];
      if (v[1] > maxY) maxY = v[1];
      if (v[2] > maxZ) maxZ = v[2];
    }

    // Signed volume via divergence theorem (tetrahedron with origin)
    volume += signedTriVol(v1, v2, v3);

    // Surface area
    surfaceArea += triArea(v1, v2, v3);
  }

  // STL files are typically in mm; convert to cm
  const absVolMm3 = Math.abs(volume);
  const volumeCm3 = absVolMm3 / 1000;
  const surfaceAreaCm2 = surfaceArea / 100;

  const bboxMm = {
    x: maxX - minX,
    y: maxY - minY,
    z: maxZ - minZ,
  };

  return {
    volumeCm3,
    bbox: { x: bboxMm.x / 10, y: bboxMm.y / 10, z: bboxMm.z / 10 },
    surfaceAreaCm2,
    triangleCount: triangles.length,
  };
}

function signedTriVol(a, b, c) {
  return (
    a[0] * (b[1] * c[2] - b[2] * c[1]) +
    a[1] * (b[2] * c[0] - b[0] * c[2]) +
    a[2] * (b[0] * c[1] - b[1] * c[0])
  ) / 6.0;
}

function triArea(a, b, c) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const acx = c[0] - a[0], acy = c[1] - a[1], acz = c[2] - a[2];
  const cx = aby * acz - abz * acy;
  const cy = abz * acx - abx * acz;
  const cz = abx * acy - aby * acx;
  return Math.sqrt(cx * cx + cy * cy + cz * cz) / 2;
}

function detectBinary(buffer) {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const faceCount = view.getUint32(80, true);
  const expectedSize = 84 + faceCount * 50;
  if (buffer.byteLength === expectedSize) return true;
  const text = new TextDecoder("ascii").decode(new Uint8Array(buffer, 0, Math.min(80, buffer.byteLength)));
  return !text.trimStart().startsWith("solid");
}

function parseBinarySTL(buffer) {
  const view = new DataView(buffer);
  const faceCount = view.getUint32(80, true);
  const triangles = new Array(faceCount);
  let offset = 84;

  for (let i = 0; i < faceCount; i++) {
    offset += 12; // skip normal
    const v1 = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
    offset += 12;
    const v2 = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
    offset += 12;
    const v3 = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
    offset += 12;
    offset += 2; // attribute byte count
    triangles[i] = [v1, v2, v3];
  }

  return triangles;
}

function parseAsciiSTL(buffer) {
  const text = new TextDecoder().decode(buffer);
  const triangles = [];
  const facetRegex = /facet\s[\s\S]*?endfacet/gi;
  const vertexRegex = /vertex\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/gi;
  let facet;
  while ((facet = facetRegex.exec(text)) !== null) {
    const verts = [];
    let v;
    vertexRegex.lastIndex = 0;
    while ((v = vertexRegex.exec(facet[0])) !== null) {
      verts.push([parseFloat(v[1]), parseFloat(v[2]), parseFloat(v[3])]);
    }
    if (verts.length === 3) triangles.push(verts);
  }
  return triangles;
}
