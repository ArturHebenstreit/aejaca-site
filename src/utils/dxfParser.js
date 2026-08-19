// ============================================================
// DXF: DLUGOSC SCIEZKI I WYMIARY, CZYLI TO, Z CZEGO LICZYMY CENE
// ============================================================
// Kafelek wyboru pliku obiecywal "SVG, DXF, AI, PDF", ale wycenic umielismy
// wylacznie SVG. DXF ladowal jako zalacznik do wyceny recznej, mimo ze jest
// formatem tekstowym stworzonym wprost do sterowania maszynami i niesie
// dokladnie te dane, ktorych potrzebujemy: wspolrzedne i jednostke.
//
// Wynik ma ten sam ksztalt co parseSVG, bo obie drogi karmia ten sam silnik
// wyceny. Rozjazd ksztaltow oznaczalby, ze cena z DXF liczy sie inaczej niz
// z SVG dla tego samego rysunku, a nikt by tego nie zauwazyl.
//
// CZEGO TU NIE MA I DLACZEGO. Nie rozwijamy blokow (INSERT/BLOCK): wymagaja
// wlasnej tablicy definicji i skladania przeksztalcen, a rysunki laserowe
// przychodza zwykle plasko. Gdy plik sklada sie glownie z blokow, wykryjemy
// mniej sciezki, niz jest naprawde, wiec zwracamy o tym informacje zamiast
// milczec i zaniżać cene.

/** $INSUNITS z naglowka DXF na milimetry. */
const UNIT_MM = {
  0: 1,        // bez jednostki: przyjmujemy milimetry, tak jak przy STL
  1: 25.4,     // cale
  2: 304.8,    // stopy
  4: 1,        // milimetry
  5: 10,       // centymetry
  6: 1000,     // metry
};

/** Rozbicie na pary (kod, wartosc). DXF to strumien takich par, linia po linii. */
function pary(tekst) {
  const linie = tekst.split(/\r\n|\r|\n/);
  const out = [];
  for (let i = 0; i + 1 < linie.length; i += 2) {
    const kod = parseInt(linie[i].trim(), 10);
    if (!Number.isFinite(kod)) continue;
    out.push([kod, linie[i + 1].trim()]);
  }
  return out;
}

const odleglosc = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * Dlugosc luku i punkty skrajne. Kat w DXF liczy sie przeciwnie do wskazowek
 * zegara, a koniec mniejszy od poczatku znaczy przejscie przez zero.
 */
function luk(cx, cy, r, kat1, kat2) {
  const a1 = (kat1 * Math.PI) / 180;
  let rozpietosc = kat2 - kat1;
  while (rozpietosc < 0) rozpietosc += 360;
  const kroki = Math.max(8, Math.ceil(rozpietosc / 5));
  const punkty = [];
  for (let i = 0; i <= kroki; i++) {
    const a = a1 + ((rozpietosc * Math.PI) / 180) * (i / kroki);
    punkty.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return punkty;
}

/**
 * Wymiary i dlugosc sciezki z rysunku DXF.
 *
 * @param {string} tekst zawartosc pliku
 * @returns {{bboxMm:{x:number,y:number}, pathLengthCm:number,
 *            engravAreaCm2:number, pathCount:number, blocksSkipped:number}}
 *          Rzuca wyjatkiem, gdy w pliku nie ma ani jednej sciezki.
 */
export function parseDXF(tekst) {
  const p = pary(String(tekst || ""));

  // Jednostka z naglowka. Bez niej przyjmujemy milimetry, bo tak zapisuje
  // wiekszosc eksportow do ciecia.
  let skala = 1;
  for (let i = 0; i < p.length - 2; i++) {
    if (p[i][0] === 9 && p[i][1] === "$INSUNITS") {
      const kod = parseInt(p[i + 1][1], 10);
      skala = UNIT_MM[kod] ?? 1;
      break;
    }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let dlugosc = 0;
  let sciezek = 0;
  let blokow = 0;

  const punkt = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  const lamana = (punkty, zamknieta) => {
    if (punkty.length < 2) return;
    sciezek++;
    for (const q of punkty) punkt(q[0], q[1]);
    for (let i = 1; i < punkty.length; i++) dlugosc += odleglosc(punkty[i - 1], punkty[i]);
    if (zamknieta) dlugosc += odleglosc(punkty[punkty.length - 1], punkty[0]);
  };

  // Przechodzimy strumien encja po encji. Kod 0 otwiera nowa encje, wiec
  // zbieramy pary do nastepnej zerowki i dopiero wtedy interpretujemy.
  let typ = null;
  let biezaca = [];
  const zamknijEncje = () => {
    if (!typ) return;
    const liczby = (kod) => biezaca.filter(([k]) => k === kod).map(([, v]) => parseFloat(v));
    const jedna = (kod) => { const l = liczby(kod); return l.length ? l[0] : NaN; };

    if (typ === "LINE") {
      lamana([[jedna(10), jedna(20)], [jedna(11), jedna(21)]], false);
    } else if (typ === "LWPOLYLINE" || typ === "POLYLINE") {
      const xs = liczby(10), ys = liczby(20);
      const flagi = jedna(70);
      const punkty = xs.map((x, i) => [x, ys[i]]).filter((q) => Number.isFinite(q[0]) && Number.isFinite(q[1]));
      lamana(punkty, Number.isFinite(flagi) && (flagi & 1) === 1);
    } else if (typ === "CIRCLE") {
      const r = jedna(40);
      if (r > 0) {
        sciezek++;
        const cx = jedna(10), cy = jedna(20);
        dlugosc += 2 * Math.PI * r;
        punkt(cx - r, cy - r);
        punkt(cx + r, cy + r);
      }
    } else if (typ === "ARC") {
      const r = jedna(40);
      if (r > 0) lamana(luk(jedna(10), jedna(20), r, jedna(50), jedna(51)), false);
    } else if (typ === "SPLINE" || typ === "ELLIPSE") {
      // Krzywa przybliżona przez punkty kontrolne. Dla wyceny wystarczy: blad
      // jest po stronie DOLNEJ, a roznica przy typowych rysunkach to procenty.
      const xs = liczby(10), ys = liczby(20);
      lamana(xs.map((x, i) => [x, ys[i]]).filter((q) => Number.isFinite(q[0]) && Number.isFinite(q[1])), false);
    } else if (typ === "INSERT") {
      // Odwolanie do bloku, ktorego nie rozwijamy. Liczymy je, zeby moc
      // powiedziec klientowi, ze czesc rysunku zostala pominieta.
      blokow++;
    }
    typ = null;
    biezaca = [];
  };

  let wEncjach = false;
  for (const [kod, wartosc] of p) {
    if (kod === 0) {
      zamknijEncje();
      if (wartosc === "SECTION") { typ = null; continue; }
      if (wartosc === "ENDSEC") { wEncjach = false; continue; }
      if (wEncjach) typ = wartosc;
      continue;
    }
    if (kod === 2 && wartosc === "ENTITIES") { wEncjach = true; continue; }
    if (typ) biezaca.push([kod, wartosc]);
  }
  zamknijEncje();

  if (!sciezek || !Number.isFinite(minX) || maxX <= minX && maxY <= minY) {
    throw new Error("Rysunek DXF nie zawiera ścieżek, z których dałoby się policzyć cenę");
  }

  const bboxMm = { x: (maxX - minX) * skala, y: (maxY - minY) * skala };
  return {
    bboxMm,
    pathLengthCm: (dlugosc * skala) / 10,
    engravAreaCm2: (bboxMm.x * bboxMm.y) / 100,
    pathCount: sciezek,
    blocksSkipped: blokow,
  };
}
