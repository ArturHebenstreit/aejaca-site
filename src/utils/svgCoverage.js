// ============================================================
// POKRYCIE RYSUNKU: ILE MASZYNA NAPRAWDE PRZEJEZDZA
// ============================================================
// Do tej pory grawer liczyl sie z PROSTOKATA OPISANEGO na rysunku. Rysunek
// 592 x 308 mm dawal 1825 cm(2) niezaleznie od tego, czy jest to zdjecie na
// caly arkusz, czy cienki napis w rogu. Stad brala sie roznica, ktora zglosil
// wlasciciel: ten sam plik wyciety kosztowal 18 zl, a wygrawerowany 157 zl.
// Ciecie liczy sie z DLUGOSCI SCIEZKI, czyli z tego, co glowica faktycznie
// przejezdza, a grawer liczyl sie z pola, po ktorym w wiekszosci nic sie nie
// dzialo.
//
// JAK PRACUJE GRAWER RASTROWY. Glowica jezdzi wierszami wzdluz osi X. W kazdym
// wierszu przejezdza od pierwszego do ostatniego sladu w tym wierszu (plus
// rozbieg i hamowanie), a wiersze CALKIEM PUSTE pomija. Czas nie jest wiec ani
// proporcjonalny do prostokata, ani do samego tuszu: jest proporcjonalny do
// SUMY ROZPIETOSCI SLADU W WIERSZACH, ktore cokolwiek zawieraja.
//
// Ta roznica ma konsekwencje, ktora latwo przeoczyc i ktora jest sprawdzana
// w guardzie: RAMKA POKRYWA CALY PROSTOKAT. Prostokatna ramka ma tuszu moze
// dwa procent pola, ale w kazdym wierszu miedzy jej bokami stoja dwie pionowe
// linie na skrajach, wiec glowica i tak przejezdza cala szerokosc. Liczenie
// "procenta zaczernienia" obcieloby taki rysunek pieciodziesieciokrotnie i
// przyjelibysmy zlecenie ponizej kosztu maszyny.
//
// GDZIE SIE MYLIMY W BEZPIECZNA STRONE. Wiersz rastra jest tu grubszy niz
// linia grawera (dziesiate czesci milimetra), wiec cienka kreska zajmuje u nas
// caly wiersz, a na maszynie ulamek. Zawyzamy. Podobnie rysunek z bialym tlem
// na cala strone wychodzi jako pelne pokrycie, czyli dokladnie tak, jak liczyl
// stary wzor.

/** Prog przezroczystosci, powyzej ktorego uznajemy piksel za slad. */
const PROG_ALFA = 12;
/** Dluzszy bok rastra. Gesciej nie potrzeba: liczymy proporcje, nie ksztalt. */
const BOK_RASTRA = 512;
/** Rozbieg i hamowanie glowicy poza obrysem, na kazda strone wiersza. */
const ROZBIEG_MM = 5;
/** Po tylu milisekundach uznajemy, ze plik sie nie wyrenderuje. */
const LIMIT_MS = 4000;

/**
 * Rdzen pomiaru: suma rozpietosci sladu w wierszach, podzielona przez pole.
 *
 * Funkcja jest CZYSTA i nie dotyka DOM, zeby dalo sie ja sprawdzic w Node na
 * recznie ulozonej masce. Reszta modulu to tylko dostarczenie tej maski.
 *
 * @param {Uint8Array|Array<number>} maska 0/1, wiersz po wierszu
 * @param {number} w szerokosc w pikselach
 * @param {number} h wysokosc w pikselach
 * @param {number} rozbiegPx rozbieg glowicy przeliczony na piksele
 * @returns {{ sweptPx: number, inkRows: number, coverage: number }}
 */
export function sweptFraction(maska, w, h, rozbiegPx = 0) {
  let swept = 0;
  let inkRows = 0;
  for (let y = 0; y < h; y++) {
    const baza = y * w;
    let od = -1;
    let doo = -1;
    for (let x = 0; x < w; x++) {
      if (maska[baza + x]) {
        if (od < 0) od = x;
        doo = x;
      }
    }
    if (od < 0) continue;
    inkRows++;
    // Rozbieg dochodzi RAZ na wiersz, po polowie z kazdej strony, i nigdy nie
    // wyprowadza nas poza szerokosc pola: dalej maszyna juz nie jedzie.
    swept += Math.min(w, doo - od + 1 + rozbiegPx);
  }
  const pole = w * h;
  if (!(pole > 0)) return { sweptPx: 0, inkRows: 0, coverage: 1 };
  return { sweptPx: swept, inkRows, coverage: Math.min(1, swept / pole) };
}

/**
 * Czy plik da sie zmierzyc bez sieci.
 *
 * Rysunek renderujemy z adresu `data:`, wiec wszystko, co siega na zewnatrz
 * (osadzone zdjecie, czcionka z serwera, `use` do obcego pliku), nie zaladuje
 * sie i ZNIKNIE Z POMIARU. Cichy skutek bylby taki, ze zdjecie na caly arkusz
 * wyszloby jako pusty rysunek i policzylibysmy grawer za darmo. Wolimy nie
 * mierzyc wcale: wtedy zostaje stary wzor z prostokata, czyli kwota zawyzona,
 * a nie zanizona.
 */
function siegaNaZewnatrz(el) {
  if (el.querySelector("image, foreignObject")) return true;
  for (const u of el.querySelectorAll("use")) {
    const href = u.getAttribute("href") || u.getAttribute("xlink:href") || "";
    if (href && !href.startsWith("#")) return true;
  }
  return false;
}

/**
 * Mierzy pokrycie rysunku. Dziala tylko w przegladarce (potrzebny raster).
 *
 * @param {string} svgText tresc pliku
 * @param {{x:number,y:number}} bboxMm prostokat tresci w milimetrach
 * @param {{x:number,y:number,w:number,h:number}|null} contentBox prostokat tresci
 *        w jednostkach pliku; bez niego mierzylibysmy pokrycie wzgledem calego
 *        arkusza, a cena idzie z prostokata TRESCI
 * @returns {Promise<{coverage:number, coverageRows:number}|null>} null, gdy nie
 *          da sie zmierzyc; wolajacy ma wtedy zostac przy prostokacie
 */
export async function measureCoverage(svgText, bboxMm, contentBox) {
  if (typeof document === "undefined" || !svgText) return null;
  if (!(Number(bboxMm?.x) > 0) || !(Number(bboxMm?.y) > 0)) return null;

  let el;
  try {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    el = doc.documentElement;
    if (!el || el.querySelector("parsererror")) return null;
    if (siegaNaZewnatrz(el)) return null;
  } catch {
    return null;
  }

  const proporcja = bboxMm.y / bboxMm.x;
  const w = proporcja >= 1 ? Math.max(16, Math.round(BOK_RASTRA / proporcja)) : BOK_RASTRA;
  const h = Math.max(16, Math.round(w * proporcja));

  // Kadrujemy na tresc, nie na arkusz: `viewBox` ustawiony na `contentBox`
  // sprawia, ze rysunek wypelnia raster dokladnie tak, jak prostokat, z ktorego
  // liczymy cene. Bez tego znaczek w rogu A4 mialby pokrycie liczone wzgledem
  // calej kartki i wyszedlby dwa razy tanszy, niz powinien.
  let zrodlo;
  try {
    if (contentBox && contentBox.w > 0 && contentBox.h > 0) {
      el.setAttribute("viewBox", `${contentBox.x} ${contentBox.y} ${contentBox.w} ${contentBox.h}`);
    }
    el.setAttribute("width", String(w));
    el.setAttribute("height", String(h));
    el.setAttribute("preserveAspectRatio", "none");
    const tekst = new XMLSerializer().serializeToString(el);
    zrodlo = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tekst)}`;
  } catch {
    return null;
  }

  const obraz = await wczytaj(zrodlo);
  if (!obraz) return null;

  let dane;
  try {
    const plotno = document.createElement("canvas");
    plotno.width = w;
    plotno.height = h;
    const ctx = plotno.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(obraz, 0, 0, w, h);
    dane = ctx.getImageData(0, 0, w, h).data;
  } catch {
    // Zabrudzone plotno albo brak kontekstu. Nie zgadujemy.
    return null;
  }

  const maska = new Uint8Array(w * h);
  for (let i = 0, p = 3; i < maska.length; i++, p += 4) {
    if (dane[p] >= PROG_ALFA) maska[i] = 1;
  }

  const rozbiegPx = (ROZBIEG_MM * 2 * w) / bboxMm.x;
  const wynik = sweptFraction(maska, w, h, rozbiegPx);
  // Pusty raster znaczy, ze nic sie nie narysowalo, a nie ze grawer jest darmowy.
  if (!wynik.inkRows) return null;
  return { coverage: wynik.coverage, coverageRows: wynik.inkRows };
}

function wczytaj(src) {
  return new Promise((resolve) => {
    const img = new Image();
    let gotowe = false;
    const koniec = (v) => { if (!gotowe) { gotowe = true; resolve(v); } };
    const zegar = setTimeout(() => koniec(null), LIMIT_MS);
    img.onload = () => { clearTimeout(zegar); koniec(img); };
    img.onerror = () => { clearTimeout(zegar); koniec(null); };
    img.src = src;
  });
}
