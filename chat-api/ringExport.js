// ============================================================
// KREATOR PIERSCIONKOW: pliki do pobrania
// ============================================================
// Klient placi za plik, wiec plik musi powstac z TEJ SAMEJ bryly, z ktorej
// policzylismy kwote. Budujemy ja tu jeszcze raz, w gestosci docelowej,
// a nie podgladowej: podglad ma 64 segmenty obrotu, bo ma odpowiadac w locie,
// a plik do druku 96, bo na wydruku widac granie.
//
// Wysylamy dwa formaty, bo sluza do czego innego:
//   STL  rozumie wszystko, ale nie niesie ani jednostek, ani koloru
//   3MF  niesie jednostki i strukture, wiec drukarka nie zgadnie skali
//
// STL nie ma pola na jednostke. Kazdy przyjmuje milimetry, ale to jest
// zwyczaj, nie zapis w formacie, i wlasnie stad biora sie modele wczytane
// w calach. 3MF zapisuje jednostke wprost i dlatego jedzie razem ze STL-em.

import { zipSync, strToU8 } from "fflate";

/** Gestosc obrotu w pliku do druku. Podglad uzywa mniejszej, bo goni suwak. */
const SEGMENTS = 96;

/**
 * Binarny STL z siatki manifolda.
 *
 * Format: 80 bajtow naglowka, liczba trojkatow, potem po 50 bajtow na
 * trojkat. Normalne zapisujemy zerami, bo czytniki i tak licza je z
 * kolejnosci wierzcholkow, a zapisana zle wprowadzalaby w blad.
 */
export function toSTL(manifold, naglowek = "AEJaCA ring") {
  const mesh = manifold.getMesh();
  const v = mesh.vertProperties, t = mesh.triVerts;
  const n = mesh.numTri;

  const buf = Buffer.alloc(84 + n * 50);
  buf.write(naglowek.slice(0, 79), 0, "ascii");
  buf.writeUInt32LE(n, 80);

  let o = 84;
  for (let i = 0; i < n; i++) {
    buf.writeFloatLE(0, o); buf.writeFloatLE(0, o + 4); buf.writeFloatLE(0, o + 8);
    o += 12;
    for (let k = 0; k < 3; k++) {
      const idx = t[i * 3 + k] * 3;
      buf.writeFloatLE(v[idx], o);
      buf.writeFloatLE(v[idx + 1], o + 4);
      buf.writeFloatLE(v[idx + 2], o + 8);
      o += 12;
    }
    buf.writeUInt16LE(0, o);          // atrybut, nieuzywany
    o += 2;
  }
  return buf;
}

/**
 * 3MF, czyli spakowany zestaw plikow XML.
 *
 * Minimalny poprawny 3MF to trzy wpisy: typy zawartosci, relacja do modelu
 * i sam model. Wiecej nie jest potrzebne, a kazdy dodatek to kolejne miejsce,
 * w ktorym slicer moze sie potknac.
 */
export function to3MF(manifold, nazwa = "AEJaCA ring") {
  const xml = (tekst) => String(tekst)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  // Tablica pozwala zachowac metal i kamienie jako osobne obiekty. Dawne
  // wywolanie z pojedynczym manifoldem pozostaje obslugiwane, bo produkcyjny
  // 3MF nadal ma byc jedna, gotowa do druku bryla.
  const obiekty = Array.isArray(manifold)
    ? manifold
    : [{ manifold, name: nazwa }];
  if (!obiekty.length) throw new Error("3MF wymaga co najmniej jednego obiektu");

  const zasoby = obiekty.map((obiekt, indeks) => {
    const bryla = obiekt?.manifold || obiekt;
    if (!bryla?.getMesh) throw new Error(`Niepoprawny obiekt 3MF nr ${indeks + 1}`);
    const mesh = bryla.getMesh();
    const v = mesh.vertProperties, t = mesh.triVerts;

    const wierzcholki = [];
    for (let i = 0; i < mesh.numVert; i++) {
      wierzcholki.push(`<vertex x="${v[i * 3].toFixed(4)}" y="${v[i * 3 + 1].toFixed(4)}" z="${v[i * 3 + 2].toFixed(4)}"/>`);
    }
    const trojkaty = [];
    for (let i = 0; i < mesh.numTri; i++) {
      trojkaty.push(`<triangle v1="${t[i * 3]}" v2="${t[i * 3 + 1]}" v3="${t[i * 3 + 2]}"/>`);
    }

    const nazwaObiektu = xml(obiekt?.name || `${nazwa} ${indeks + 1}`);
    return `<object id="${indeks + 1}" type="model" name="${nazwaObiektu}">
      <mesh>
        <vertices>${wierzcholki.join("")}</vertices>
        <triangles>${trojkaty.join("")}</triangles>
      </mesh>
    </object>`;
  });

  const elementy = obiekty.map((_, indeks) => `<item objectid="${indeks + 1}"/>`).join("");

  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${xml(nazwa)}</metadata>
  <metadata name="Designer">AEJaCA</metadata>
  <resources>${zasoby.join("")}</resources>
  <build>${elementy}</build>
</model>`;

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  const types = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

  return Buffer.from(zipSync({
    "[Content_Types].xml": strToU8(types),
    "_rels/.rels": strToU8(rels),
    "3D/3dmodel.model": strToU8(model),
  }, { level: 6 }));
}

/**
 * Komplet plikow dla jednej konfiguracji.
 *
 * Model jest NOMINALNY, czyli w wymiarach gotowego wyrobu, bez kompensacji
 * skurczu. To jest decyzja, nie przeoczenie: skurcz zalezy od stopu i od
 * technologii odlewu, a klient, ktory kupuje plik, odlewa u siebie albo
 * drukuje go wprost. Powiekszony model bylby cichym bledem u kazdego, kto
 * chce po prostu wydrukowac pierscionek do przymiarki.
 *
 * Kompensacje liczy nasz kalkulator skurczu i do niego kierujemy w opisie.
 */
export async function ringFiles(params) {
  const { buildRing } = await import("./geometry/build.js");
  let r = null, referencja = null, bryla = null;
  try {
    r = await buildRing(params, { segments: SEGMENTS, mode: "casting" });

  // STL i podstawowy 3MF sa plikami produkcyjnymi. Nie zaleza od przelacznika
  // podgladu: maja otwarte lapki, nie zawieraja kamieni i moga zawierac
  // zamowione dodatki odlewnicze.
    bryla = r.metal;
    if (r.casting) bryla = bryla.add(r.casting);

  // Referencja pokazuje stan gotowego wyrobu, ale nie skleja kamieni z
  // metalem. W programie obslugujacym 3MF mozna je ukryc lub usunac osobno.
    referencja = await buildRing({
      ...params,
      casting: { ...(params.casting || {}), sprues: false, button: false, innerSprues: false },
    }, {
      segments: SEGMENTS,
      mode: "referenceAssembly",
    });
    const obiektyReferencji = [
      { manifold: referencja.metal, name: "metal-finished-reference" },
      ...referencja.stones.map((kamien, indeks) => ({
        manifold: kamien,
        name: `stone-${String(indeks + 1).padStart(2, "0")}`,
      })),
    ];

    const rozmiar = r.params.innerDia.toFixed(1).replace(".", ",");
    const bazaWyrobu = `aejaca-${r.params.kind}-${rozmiar}mm`;
    const dodatki = [
      r.casting ? "wlew" : null,
      "odlewniczy",
    ].filter(Boolean);
  // Nazwa pliku mowi, co jest w srodku. Klient, ktory pobierze dwie wersje
  // tego samego pierscionka, inaczej nie odrozni ich bez otwierania.
    const baza = [bazaWyrobu, ...dodatki].join("-");
    const bazaReferencji = `${bazaWyrobu}-referencja`;

    return {
      massG: r.massG,
      volumeMm3: r.volumeMm3,
      triangles: bryla.getMesh().numTri,
      files: [
        { name: `${baza}.stl`, buffer: toSTL(bryla, baza) },
        { name: `${baza}.3mf`, buffer: to3MF(bryla, baza) },
        {
          name: `${bazaReferencji}.3mf`,
          buffer: to3MF(obiektyReferencji, `${bazaWyrobu} reference assembly`),
        },
      ],
    };
  } finally {
    const seen = new Set();
    const release = (manifold) => {
      if (!manifold || seen.has(manifold)) return;
      seen.add(manifold);
      manifold.delete?.();
    };
    release(bryla);
    release(r?.metal);
    release(r?.casting);
    for (const stone of r?.stones || []) release(stone);
    release(referencja?.metal);
    release(referencja?.casting);
    for (const stone of referencja?.stones || []) release(stone);
  }
}
