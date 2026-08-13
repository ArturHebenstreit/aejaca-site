// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/geometry/ring/params.js
// Regeneracja: npm run sync:pricing

// ============================================================
// KREATOR PIERSCIONKOW: model parametrow i reguly warsztatowe
// ============================================================
// Jeden obiekt przechodzi przez cala droge: formularz, generator bryly,
// wycena, koszyk, zapisana wycena. To tez jest schemat, ktory ma wypelnic
// model jezykowy, gdy klient opisze pierscionek zdaniem.
//
// Ten plik nie importuje niczego z jadra geometrycznego, bo korzysta z niego
// takze interfejs, ktory rysuje szlify w SVG. Obrysy sa wiec zwyklymi
// listami punktow w ukladzie jednostkowym (promien 1), przeskalowanymi
// dopiero przy budowie bryly.

// Stopy sa danymi, nie geometria, wiec import nie lamie zasady wyzej: nadal
// nie siegamy po jadro. Kolor stopu musi byc jednak sprawdzany razem z reszta
// parametrow, bo wchodzi do masy.
import { CASTING_ALLOYS, colorsFor } from "../pricing/castingAlloys.js";

const TAU = Math.PI * 2;

const ngon = (n, rot = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU + rot;
    return [Math.cos(a), Math.sin(a)];
  });

const smooth = (fn, n) => Array.from({ length: n }, (_, i) => fn(i / n));

/** Obrys rozciagniety na `n` rownomiernych punktow, po odcinkach. */
export function resample(pts, n) {
  const out = [], m = pts.length;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * m, k = Math.floor(t), f = t - k;
    const a = pts[k % m], b = pts[(k + 1) % m];
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}

export const scalePts = (p, s) => p.map(([x, y]) => [x * s, y * s]);

// ------------------------------------------------------------
// Obrysy szlifow, w ukladzie jednostkowym
// ------------------------------------------------------------
export const OUTLINES = {
  round: () => smooth((t) => { const a = t * TAU; return [Math.cos(a), Math.sin(a)]; }, 48),
  oval: () => smooth((t) => { const a = t * TAU; return [0.74 * Math.cos(a), 1.06 * Math.sin(a)]; }, 48),
  cushion: () => smooth((t) => {
    const a = t * TAU, c = Math.cos(a), s = Math.sin(a), p = 2.7;
    const k = (Math.abs(c) ** p + Math.abs(s) ** p) ** (-1 / p);
    return [k * c * 0.96, k * s * 0.96];
  }, 48),
  square: () => resample(scalePts(ngon(4, Math.PI / 4), 0.99), 32),
  octagon: () => {
    const c = 0.42, x = 0.78, y = 1.0;      // szmaragdowy: sciete naroza
    return resample([[-x + c, -y], [x - c, -y], [x, -y + c], [x, y - c],
      [x - c, y], [-x + c, y], [-x, y - c], [-x, -y + c]], 32);
  },
  baguette: () => resample([[-0.5, -1.1], [0.5, -1.1], [0.5, 1.1], [-0.5, 1.1]], 32),
  pentagon: () => resample(ngon(5, -Math.PI / 2), 30),
  // Trojkat o bokach WYPUKLYCH. Wzor biegunowy daje tu grudke, wiec idziemy
  // bokiem po boku i wypychamy kazdy punkt wzdluz normalnej zewnetrznej.
  trillion: () => {
    const v = ngon(3, -Math.PI / 2), pts = [];
    for (let i = 0; i < 3; i++) {
      const a = v[i], b = v[(i + 1) % 3];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      const nx = dy / L, ny = -dx / L;
      for (let s = 0; s < 16; s++) {
        const t = s / 16, g = 0.17 * Math.sin(Math.PI * t);
        pts.push([a[0] + dx * t + nx * g, a[1] + dy * t + ny * g]);
      }
    }
    return pts;
  },
  pear: () => smooth((t) => {
    const a = t * TAU - Math.PI / 2;
    const w = 0.76 * (1 - 0.52 * Math.max(0, Math.cos(a / 2)) ** 3.2);
    return [-w * Math.sin(a), -Math.cos(a) * 1.08];
  }, 56),
  marquise: () => smooth((t) => {
    const a = t * TAU;
    return [0.52 * Math.sin(a) * Math.abs(Math.sin(a)), -Math.cos(a) * 1.22];
  }, 56),
  heart: () => smooth((t) => {
    const a = t * TAU;
    const x = 16 * Math.sin(a) ** 3;
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    return [x / 17, -y / 15];
  }, 60),
  briolette: () => smooth((t) => {
    const a = t * TAU - Math.PI / 2;
    const w = 0.62 * (1 - 0.62 * Math.max(0, Math.cos(a / 2)) ** 2.4);
    return [-w * Math.sin(a), -Math.cos(a) * 1.34];
  }, 56),
};

// ------------------------------------------------------------
// Szlify
// ------------------------------------------------------------
// `profil` opisuje bryle kamienia w pionie:
//   brilliant  korona, rondysta, pawilon do kolety
//   step       to samo, ale lagodniejszy pawilon (szlify schodkowe)
//   drop       brioleta, oszlifowana dookola, bez tafli
//   dome       kopula na plaskim spodzie (bufftop)
//   rose       niska korona fasetowa na plaskim spodzie
//   rosePav    rozeta z pawilonem: plaska gora, stozek pod spodem
//
// Etykiety i podpowiedzi sa w trzech jezykach, bo interfejs jest trojjezyczny,
// a nazwa szlifu po polsku przy angielskim ekranie wyglada jak usterka.
//
// `hint` to zdanie warsztatowe pokazywane przy wyborze szlifu. Nie jest
// ozdoba: tlumaczy, DLACZEGO lista zakuc jest taka, a nie inna.
//
// `points` to naroza wymagajace lapki V, podane jako kat w stopniach
// liczony od osi +Y obrysu. Bez nich generator nie wie, gdzie ta lapka ma
// stanac, a to wlasnie w tych miejscach kamien odpryskuje.
export const CUTS = {
  round:     { pl: "okrągły", en: "round", de: "rund", outline: "round", profile: "brilliant", table: 0.57,
               settings: ["prong4", "prong6", "bezel"], corners: 4,
               hint: "Rondysta na całym obwodzie, każde zakucie trzyma.", hintEn: "The girdle runs all the way round, so any setting holds it.", hintDe: "Die Rundiste läuft rundum, jede Fassung hält." },
  oval:      { pl: "owal", en: "oval", de: "oval", outline: "oval", profile: "brilliant", table: 0.55,
               settings: ["prong4", "prong6", "bezel"], corners: 4,
               hint: "Łapki idą na osiach dłuższej i krótszej.", hintEn: "Claws sit on the long and short axes.", hintDe: "Krappen sitzen auf der langen und der kurzen Achse." },
  cushion:   { pl: "poduszka", en: "cushion", de: "Kissen", outline: "cushion", profile: "brilliant", table: 0.58,
               settings: ["prong4", "corner", "bezel"], corners: 4,
               hint: "Zaokrąglone naroża wybaczają więcej niż kwadrat.", hintEn: "Rounded corners forgive more than a square cut does.", hintDe: "Runde Ecken verzeihen mehr als ein Quadratschliff." },
  square:    { pl: "kwadrat", en: "square", de: "Quadrat", outline: "square", profile: "brilliant", table: 0.6,
               settings: ["corner", "bezel"], corners: 4,
               hint: "Naroża są najbardziej kruche, muszą być zakryte łapką narożną.", hintEn: "The corners are the most fragile part and must be covered.", hintDe: "Die Ecken sind am empfindlichsten und müssen bedeckt sein." },
  octagon:   { pl: "ośmiokąt", en: "octagon", de: "Achteck", outline: "octagon", profile: "step", table: 0.62,
               settings: ["corner", "bezel"], corners: 4,
               hint: "Ścięte naroża dają naturalne oparcie dla łapki.", hintEn: "Cut corners give a claw something to rest against.", hintDe: "Abgeschrägte Ecken geben der Krappe Halt." },
  baguette:  { pl: "bagietka", en: "baguette", de: "Baguette", outline: "baguette", profile: "step", table: 0.66,
               settings: ["channel", "corner", "bezel"], corners: 4,
               hint: "Bagietki układa się w oprawę kanałową, obok siebie.", hintEn: "Baguettes are laid side by side in a channel.", hintDe: "Baguetten werden nebeneinander in eine Schiene gelegt." },
  pentagon:  { pl: "pięciokąt", en: "pentagon", de: "Fünfeck", outline: "pentagon", profile: "brilliant", table: 0.58,
               settings: ["corner", "bezel"], corners: 5,
               hint: "Pięć naroży, pięć łapek narożnych.", hintEn: "Five corners, five corner claws.", hintDe: "Fünf Ecken, fünf Eckkrappen." },
  trillion:  { pl: "trylion", en: "trillion", de: "Trillant", outline: "trillion", profile: "brilliant", table: 0.58,
               settings: ["vprong", "bezel"], points: [90, 210, 330],
               hint: "Trzy ostre naroża, każde pod łapką V.", hintEn: "Three sharp corners, each under a V-claw.", hintDe: "Drei scharfe Ecken, jede unter einer V-Krappe." },
  pear:      { pl: "gruszka", en: "pear", de: "Tropfen", outline: "pear", profile: "brilliant", table: 0.55,
               settings: ["vprong", "bezel"], points: [90],
               hint: "Szpic musi mieć łapkę V, inaczej odpryskuje.", hintEn: "The point needs a V-claw or it chips.", hintDe: "Die Spitze braucht eine V-Krappe, sonst bricht sie aus." },
  marquise:  { pl: "markiza", en: "marquise", de: "Navette", outline: "marquise", profile: "brilliant", table: 0.5,
               settings: ["vprong", "bezel"], points: [90, 270],
               hint: "Dwa szpice, dwie łapki V. Zwykła łapka ich nie chroni.", hintEn: "Two points, two V-claws. An ordinary claw will not protect them.", hintDe: "Zwei Spitzen, zwei V-Krappen. Eine gewöhnliche Krappe schützt sie nicht." },
  heart:     { pl: "serce", en: "heart", de: "Herz", outline: "heart", profile: "brilliant", table: 0.54,
               settings: ["vprong", "bezel"], points: [90],
               hint: "Wcięcie u góry wymaga łapki V, bo tam kamień jest najcieńszy.", hintEn: "The cleft is the thinnest part of the stone and needs a V-claw.", hintDe: "Die Einbuchtung ist die dünnste Stelle und braucht eine V-Krappe." },
  briolette: { pl: "briolet", en: "briolette", de: "Briolett", outline: "briolette", profile: "drop", table: 0,
               settings: ["drilled"],
               hint: "Brioleta się nie osadza. Jest wiercona i wisi na kabłąku.", hintEn: "A briolette is not set. It is drilled and hangs from a bail.", hintDe: "Ein Briolett wird nicht gefasst. Es wird gebohrt und hängt an einer Öse." },
  roseP:     { pl: "rozeta z pawilonem", en: "rose with pavilion", de: "Rosette mit Pavillon", outline: "round", profile: "rosePav", table: 0,
               settings: ["prong4", "bezel"], corners: 4,
               hint: "Płaska góra, pawilon pod spodem, więc łapka ma się o co oprzeć.", hintEn: "Flat top, pavilion beneath, so a claw has something to grip.", hintDe: "Flache Oberseite, Pavillon darunter, die Krappe findet Halt." },
  bufftop:   { pl: "bufftop", en: "buff top", de: "Buff Top", outline: "oval", profile: "dome", table: 0,
               settings: ["bezel"],
               hint: "Kopulasta góra bez rondysty, trzyma tylko kaseta.", hintEn: "A domed top with no girdle. Only a bezel will hold it.", hintDe: "Gewölbte Oberseite ohne Rundiste. Nur eine Zarge hält sie." },
  roseFlat:  { pl: "rozeta płaska", en: "flat rose", de: "flache Rosette", outline: "round", profile: "rose", table: 0,
               settings: ["bezel"],
               hint: "Płaski spód, brak pawilonu. Nie ma czego chwycić łapką.", hintEn: "Flat back, no pavilion. There is nothing for a claw to catch.", hintDe: "Flache Unterseite, kein Pavillon. Für eine Krappe gibt es nichts zu greifen." },
};

export const SETTINGS = {
  prong4:  { pl: "4 łapki", en: "4 claws", de: "4 Krappen", prongs: 4 },
  prong6:  { pl: "6 łapek", en: "6 claws", de: "6 Krappen", prongs: 6 },
  corner:  { pl: "narożne", en: "corner claws", de: "Eckkrappen", prongs: 0 },   // liczba lapek z `corners` szlifu
  vprong:  { pl: "łapki V", en: "V-claws", de: "V-Krappen", prongs: 0 },   // lapki siadaja na `points` szlifu
  bezel:   { pl: "kaseta", en: "bezel", de: "Zarge", prongs: 0 },
  channel: { pl: "kanałowa", en: "channel", de: "Kanal", prongs: 0 },
  drilled: { pl: "wiercony", en: "drilled", de: "gebohrt", prongs: 0 },
};

export const SIDE_SETTINGS = {
  pave:    { pl: "Pavé", en: "Pavé", de: "Pavé", metalPerStone: 0.8,
             hint: "Kamienie tuż obok siebie, trzymane kuleczkami wyciętymi z metalu szyny.",
             hintEn: "Stones set edge to edge, held by beads raised from the shank.",
             hintDe: "Steine dicht an dicht, gehalten von Körnern aus dem Schienenmetall." },
  channel: { pl: "Kanałowa", en: "Channel", de: "Kanal", metalPerStone: 2.2,
             hint: "Kamienie między dwiema szynkami, bez metalu pomiędzy. Najbardziej odporna.",
             hintEn: "Stones between two rails with no metal between them. The most durable.",
             hintDe: "Steine zwischen zwei Stegen, ohne Metall dazwischen. Am widerstandsfähigsten." },
  prong:   { pl: "Łapkowa", en: "Claws", de: "Krappen", metalPerStone: 1.4,
             hint: "Każdy kamień we własnych łapkach. Najwięcej blasku, najmniej ochrony.",
             hintEn: "Each stone in its own claws. Most sparkle, least protection.", hintDe: "Jeder Stein in eigenen Krappen. Am meisten Glanz, am wenigsten Schutz." },
};

export const SHANK_PROFILES = ["round", "flat", "knife", "comfort"];

// Typ wyrobu decyduje o tym, CO w ogole powstaje nad szyna.
//   ring    szyna z glowica i kamieniem centralnym
//   signet  szyna z tarcza, bez kamienia centralnego
//   band    sama szyna: obraczka gladka albo wysadzana po obwodzie
export const RING_KINDS = ["ring", "signet", "band"];

// Pokrycie obwodu kamieniami dla typu `band`.
//   none  obraczka gladka
//   half  kamienie na gornej polowie, czyli half eternity
//   full  kamienie dookola, czyli eternity
export const BAND_COVERAGE = ["none", "half", "full"];

// Dodatki ODLEWNICZE. Nie sa czescia wyrobu i nie wchodza do jego masy ani
// do ceny: kanal wlewowy odcina sie po odlaniu, a metal z niego wraca do
// tygla. Sluza wylacznie plikowi dla kogos, kto sam odlewa.
//
// `stones` decyduje, czy w pliku sa BRYLY KAMIENI. Kamieni sie nie odlewa,
// wiec przy odlewie chce sie ich zwykle nie miec, ale przy druku modelu do
// przymiarki albo do pokazania klientowi juz tak. Domyslnie sa, bo tak
// wyglada wyrob.
//
// Wyjecie kamieni NIE zmienia bryly metalu: gniazda sa wyciete niezaleznie
// od tego, czy kamien w nich siedzi.
export const CASTING_DEFAULTS = { sprues: false, innerSprues: false, button: false, stones: true };

// Profil szyny to jej PRZEKROJ, czyli ksztalt w dloni. To jest co innego niz
// sylwetka ogladana z boku, o ktorej decyduje ponizsze zwezenie. Katalogi
// mieszaja te dwie rzeczy, a klient wybiera glownie sylwetke.
export const SHANK_TAPERS = ["auto", "none", "tapered", "cathedral", "signet"];

// ------------------------------------------------------------
// Tarcze sygnetow
// ------------------------------------------------------------
// Katalogowy komplet sygnetow to jeden korpus i kilkanascie tarcz. Roznica
// miedzy nimi jest w obrysie i w tym, ktora os jest dluzsza, wiec opisujemy
// je danymi, a nie osobnymi funkcjami w generatorze.
//
// `ratio`  krotsza os podzielona przez dluzsza
// `across` czy dluzsza os biegnie W POPRZEK palca, czyli po obwodzie
//          pierscionka. Tak nosi sie sygnet "poprzeczny", ktory z gory czyta
//          sie jako lezaca sztabka, i to jest inny wyrob niz ten sam prostokat
//          postawiony wzdluz palca.
// `corner` promien zaokraglenia naroza w milimetrach, nie w ulamku rozmiaru:
//          jubiler zaokragla kant pilnikiem o stalej krzywiznie, wiec mala
//          tarcza nie ma naroza dwa razy ostrzejszego niz duza.
export const SIGNET_TABLES = {
  oval:    { pl: "owalna", en: "oval", de: "oval", ratio: 0.76, across: false, shape: "ellipse" },
  round:   { pl: "okrągła", en: "round", de: "rund", ratio: 1, across: false, shape: "ellipse" },
  cushion: { pl: "poduszka", en: "cushion", de: "Kissen", ratio: 0.94, across: false, shape: "cushion" },
  square:  { pl: "kwadratowa", en: "square", de: "quadratisch", ratio: 1, across: false, shape: "rect", corner: 1.1 },
  rect:    { pl: "prostokątna", en: "rectangular", de: "rechteckig", ratio: 0.72, across: false, shape: "rect", corner: 0.9 },
  bar:     { pl: "poprzeczna", en: "bar", de: "Querplatte", ratio: 0.42, across: true, shape: "rect", corner: 0.7 },
  ovalBar: { pl: "owalna poprzeczna", en: "east-west oval", de: "Queroval", ratio: 0.58, across: true, shape: "ellipse" },
  hex:     { pl: "sześciokątna", en: "hexagonal", de: "sechseckig", ratio: 0.86, across: false, shape: "hex", corner: 0.5 },
  heart:   { pl: "serce", en: "heart", de: "Herz", ratio: 1.0, across: false, shape: "heart" },
};

// Wykonczenie gornej powierzchni tarczy.
//   flat      plaska, jak wyszla z odlewu i polerki
//   recessed  pole WPUSZCZONE w rancie: w tym zaglebieniu siada grawer albo
//             emalia, a rant chroni go przed starciem o klamke
//   domed     lekko wypukla, klasyczna tarcza pieczetna
export const SIGNET_FACES = {
  flat:     { pl: "płaska", en: "flat", de: "flach" },
  recessed: { pl: "wpuszczone pole", en: "recessed panel", de: "vertieftes Feld" },
  domed:    { pl: "wypukła", en: "domed", de: "gewölbt" },
};

/**
 * Polowa szerokosci i dlugosci tarczy w mm, z jednego miejsca dla bryly
 * i dla piktogramu.
 *
 * `W` biegnie po obwodzie pierscionka, `L` wzdluz palca. Suwak zawsze podaje
 * os DLUZSZA, bo tak sie mierzy sygnet i tak podaja to katalogi.
 */
export function tableSize(signet = {}) {
  const def = SIGNET_TABLES[signet.table] || SIGNET_TABLES.oval;
  const dluga = (Number(signet.length) || 14) / 2;
  const krotka = dluga * def.ratio;
  return def.across ? { W: dluga, L: krotka, def } : { W: krotka, L: dluga, def };
}

/** Obrys tarczy w mm, wokol srodka ukladu. */
export function signetOutline(signet = {}, n = 64) {
  const { W, L, def } = tableSize(signet);
  const r = Math.min(def.corner ?? 0, Math.min(W, L) * 0.42);

  if (def.shape === "cushion") {
    return smooth((t) => {
      const a = t * TAU, c = Math.cos(a), s = Math.sin(a), e = 2.7;
      const k = (Math.abs(c) ** e + Math.abs(s) ** e) ** (-1 / e);
      return [k * c * W, k * s * L];
    }, n);
  }
  if (def.shape === "heart") return scalePts(OUTLINES.heart(), 1).map(([x, y]) => [x * W, y * L]);
  if (def.shape === "rect") return roundedRect(W, L, r, n);
  if (def.shape === "hex") {
    const v = [[0, L], [W, L * 0.45], [W, -L * 0.45], [0, -L], [-W, -L * 0.45], [-W, L * 0.45]];
    return roundPolygon(v, r, n);
  }
  return smooth((t) => { const a = t * TAU; return [W * Math.cos(a), L * Math.sin(a)]; }, n);
}

/** Prostokat o zaokraglonych narozach, obiegany przeciwnie do zegara. */
function roundedRect(W, L, r, n) {
  const rr = Math.max(0, Math.min(r, W * 0.95, L * 0.95));
  if (rr < 1e-3) return resample([[-W, -L], [W, -L], [W, L], [-W, L]], n);
  const naLuk = Math.max(3, Math.round(n / 8));
  const rogi = [[W - rr, L - rr, 0], [-W + rr, L - rr, Math.PI / 2],
                [-W + rr, -L + rr, Math.PI], [W - rr, -L + rr, -Math.PI / 2]];
  const pts = [];
  for (const [cx, cy, a0] of rogi) {
    for (let i = 0; i <= naLuk; i++) {
      const a = a0 + (i / naLuk) * (Math.PI / 2);
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  }
  return resample(pts, n);
}

/** Wielokat ze scietymi narozami, przyciety promieniem `r`. */
function roundPolygon(verts, r, n) {
  if (r < 1e-3) return resample(verts, n);
  const m = verts.length, pts = [];
  for (let i = 0; i < m; i++) {
    const prev = verts[(i - 1 + m) % m], cur = verts[i], next = verts[(i + 1) % m];
    const doPrev = [prev[0] - cur[0], prev[1] - cur[1]];
    const doNext = [next[0] - cur[0], next[1] - cur[1]];
    const lp = Math.hypot(...doPrev), ln = Math.hypot(...doNext);
    const d = Math.min(r, lp * 0.45, ln * 0.45);
    pts.push([cur[0] + (doPrev[0] / lp) * d, cur[1] + (doPrev[1] / lp) * d]);
    pts.push([cur[0] + (doNext[0] / ln) * d, cur[1] + (doNext[1] / ln) * d]);
  }
  return resample(pts, n);
}

// ------------------------------------------------------------
// Stale warsztatowe
// ------------------------------------------------------------
// Te liczby decyduja o tym, czy kamien wejdzie w gniazdo. Ich zmiana bez
// proby na realnym odlewie to prosta droga do serii braków.
export const SEAT = {
  /** Gniazdo musi byc odrobine WEZSZE od rondysty, inaczej kamien przelatuje. */
  undercut: 0.06,        // mm na promieniu
  /** Kat oparcia odpowiada kątowi pawilonu ponizej rondysty. */
  bearingDeg: 41,
  /** Rondysta siedzi mniej wiecej tyle nad galeria. */
  aboveGalleryMm: 1.0,
  /** Luz na obrobke, doliczany do otworu przelotowego pod kamieniem. */
  throughClearance: 0.25,
  /**
   * Wysokosc PROSTEJ scianki gniazda pod rondysta, czyli tego, co jubiler
   * wycina frezem kulistym jako ostatnie. Kamien opiera sie na krawedzi
   * miedzy ta scianka a stozkiem, a nie na samym stozku.
   *
   * Bez tej scianki kamien siada na linii i przy dociskaniu lapek obraca sie
   * w gniezdzie. Przy odlewie ma jeszcze jedno zadanie: daje frezowi material
   * do poprawki, bo odlew nigdy nie wychodzi w tolerancji zakucia.
   */
  ledge: 0.35,
  /**
   * Najwezsza szynka, jaka zostawiamy z boku gniazda w szynie.
   *
   * Gniazdo wycina sie w metal na wylot, wiec z szyny zostaja dwa paski po
   * bokach kamienia. Ponizej niecalego polmilimetra taki pasek nie utrzyma
   * kamienia i pierwszy raczej sie wygina niz trzyma, a przy odlewie potrafi
   * po prostu nie wypelnic sie metalem.
   *
   * Praktycznie znaczy to tyle: w szynie 2,1 mm nie osadzi sie kamienia
   * 1,5 mm. Zamiast pozwolic na taka konfiguracje i oddac plik z bryla
   * rozsypana na dwadziescia kawalkow, przycinamy kamien do wykonalnego.
   */
  minRail: 0.45,
  /**
   * Ile metalu ZOSTAWIAMY pod kamieniem, liczac od kolety w dol, zanim
   * zacznie sie otwor przelotowy. Otwor idzie na wylot dla swiatla i po to,
   * zeby dalo sie kamien wypchnac od spodu przy przekladaniu.
   */
  throughRatio: 0.32,
  /**
   * Jaka CZESC glebokosci gniazda idzie na wylot prosto, zamiast zwezac sie
   * dalej stozkiem. Reszta jest stozkiem o kacie pawilonu.
   *
   * Gniazdo wiercone prosto na calej glebokosci nie daje kamieniowi zadnego
   * oparcia poza gorna krawedzia i wybiera metal z galerii tam, gdzie jest on
   * potrzebny. Stozek robi odwrotnie: kamien opiera sie na duzej powierzchni,
   * a metal zostaje. Ostatni odcinek musi jednak byc prosty, bo stozek
   * ciagniety do konca zamknalby sie w szpic i nie byloby czym wypchnac
   * kamienia od spodu ani czym doswietlic go od dolu.
   */
  throughPart: 1 / 6,
};

export const LIMITS = {
  innerDia: [14.0, 23.0],
  width: [1.4, 8.0],
  thickness: [1.0, 4.0],
  stoneSize: [2.0, 10.0],
  sideCount: [0, 5],
  sideSize: [1.0, 4.5],
  /**
   * Odsuniecie PIERWSZEGO kamienia bocznego od korony, liczone jako szczelina
   * metalu miedzy koszem a rondysta tego kamienia.
   *
   * Do tej pory pierwszy kamien stal pod stalym katem 0,34 radiana od
   * godziny dwunastej, czyli okolo trzech milimetrow po obwodzie. Kosz
   * kamienia szesciomilimetrowego ma polowe szerokosci wieksza niz to,
   * wiec pierwszy kamien na szynie WCHODZIL w korone. Teraz kat liczy sie
   * z rzeczywistej szerokosci korony, a to jest szczelina ponad nia.
   */
  sideGap: [0.0, 3.0],
  /** Dodatkowy odstep MIEDZY kamieniami na szynie, ponad ich stycznosc. */
  sideSpread: [0.0, 2.0],
  haloSize: [0.9, 2.2],
  bandSize: [1.2, 3.2],
  signetLength: [9.0, 20.0],
  prongDia: [0.7, 1.4],
};

export const DEFAULTS = {
  kind: "ring",
  innerDia: 17.2,
  alloy: "ag925",
  color: "yellow",
  profile: "round",
  taper: "auto",
  width: 2.2,
  thickness: 1.6,
  stone: { cut: "round", size: 6.5, material: "cz", origin: "stock" },
  setting: "prong4",
  prongDia: 0.9,
  side: { count: 0, size: 1.6, setting: "pave", material: "cz", gap: 0.35, spread: 0.0 },
  casting: { ...CASTING_DEFAULTS },
  halo: { on: false, size: 1.4, material: "cz" },
  band: { coverage: "none", size: 1.8, setting: "pave", material: "cz" },
  signet: { table: "oval", length: 14, face: "flat", engraving: "none" },
};

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Sprowadza dowolne wejscie do poprawnego zestawu parametrow albo rzuca.
 *
 * Rzucamy TYLKO przy niemozliwym zakuciu, bo to jedyny blad, ktorego nie da
 * sie po cichu naprawic: markiza w zwyklych lapkach odpryska, a kaboszon
 * z nich wypadnie. Reszte przycinamy do zakresu, bo suwak i tak nie wyjdzie
 * poza swoje granice, a model jezykowy potrafi podac liczbe z sufitu.
 */
export function validate(input = {}) {
  const p = { ...DEFAULTS, ...input };
  p.stone = { ...DEFAULTS.stone, ...(input.stone || {}) };
  p.halo = { ...DEFAULTS.halo, ...(input.halo || {}) };
  p.casting = { ...CASTING_DEFAULTS, ...(input.casting || {}) };
  p.casting.sprues = Boolean(p.casting.sprues);
  // Stopka bez kanalu wisialaby w powietrzu: to ona jest zbiornikiem metalu,
  // z ktorego kanal karmi odlew, wiec jedno bez drugiego nie ma sensu.
  p.casting.button = Boolean(p.casting.button) && p.casting.sprues;
  // Kanaly wewnetrzne wpinaja sie w kanal glowny, wiec bez niego nie maja
  // do czego dochodzic i zostalyby w pliku jako dwa pretki w powietrzu.
  p.casting.innerSprues = Boolean(p.casting.innerSprues) && p.casting.sprues;
  p.casting.stones = p.casting.stones !== false;
  p.band = { ...DEFAULTS.band, ...(input.band || {}) };
  p.side = { ...DEFAULTS.side, ...(input.side || {}) };
  p.signet = { ...DEFAULTS.signet, ...(input.signet || {}) };

  if (!RING_KINDS.includes(p.kind)) p.kind = "ring";
  p.innerDia = clamp(num(p.innerDia, DEFAULTS.innerDia), LIMITS.innerDia);
  p.width = clamp(num(p.width, DEFAULTS.width), LIMITS.width);
  p.thickness = clamp(num(p.thickness, DEFAULTS.thickness), LIMITS.thickness);
  p.prongDia = clamp(num(p.prongDia, DEFAULTS.prongDia), LIMITS.prongDia);
  if (!SHANK_PROFILES.includes(p.profile)) p.profile = DEFAULTS.profile;
  if (!SHANK_TAPERS.includes(p.taper)) p.taper = DEFAULTS.taper;

  // Kolor stopu wchodzi do masy przez gestosc, wiec musi byc sprawdzony tutaj,
  // a nie tylko w formularzu. Kolor niedostepny dla danej proby sprowadzamy do
  // pierwszego dopuszczalnego: srebro ma wylacznie bialy i nie jest to wybor,
  // tylko fakt. Cicha korekta jest tu wlasciwa, bo zla nazwa koloru nie psuje
  // bryly, a jedynie material.
  if (!CASTING_ALLOYS[p.alloy]) p.alloy = DEFAULTS.alloy;
  const allowed = colorsFor(p.alloy);
  if (!allowed.includes(p.color)) p.color = allowed[0] || DEFAULTS.color;

  if (p.kind === "band") {
    // Obraczka nie ma glowicy, wiec nie ma tez kamienia centralnego ani
    // niczego na ramionach: kamienie ida po obwodzie i opisuje je `band`.
    if (!BAND_COVERAGE.includes(p.band.coverage)) p.band.coverage = "none";
    // To samo ograniczenie na obwodzie: kamien szerszy od szyny minus dwie
    // szynki dalby obraczke przecieta na kawalki.
    const maxObw = Math.max(LIMITS.bandSize[0], p.width - 2 * SEAT.minRail);
    p.band.size = clamp(num(p.band.size, 1.8), [LIMITS.bandSize[0], Math.min(LIMITS.bandSize[1], maxObw)]);
    if (!SIDE_SETTINGS[p.band.setting]) p.band.setting = "pave";
    p.side = { ...p.side, count: 0 };
    p.halo = { ...p.halo, on: false };
    return p;
  }

  if (p.kind === "signet") {
    p.signet.length = clamp(num(p.signet.length, 14), LIMITS.signetLength);
    if (!SIGNET_TABLES[p.signet.table]) p.signet.table = "oval";
    if (!SIGNET_FACES[p.signet.face]) p.signet.face = "flat";
    p.side = { ...p.side, count: 0 };
    p.halo = { ...p.halo, on: false };
    return p;
  }

  const cut = CUTS[p.stone.cut];
  if (!cut) throw new Error(`Nieznany szlif: ${p.stone.cut}`);
  p.stone.size = clamp(num(p.stone.size, 6.5), LIMITS.stoneSize);

  if (!cut.settings.includes(p.setting)) {
    throw new Error(
      `Zakucie "${p.setting}" nie pasuje do szlifu "${cut.pl}". ` +
      `Dozwolone: ${cut.settings.map((s) => SETTINGS[s].pl).join(", ")}.`,
    );
  }

  // Brioleta wisi na kabłąku, wiec nie ma szyny z kamieniami bocznymi.
  if (p.setting === "drilled") p.side = { ...p.side, count: 0 };

  p.side.count = Math.round(clamp(num(p.side.count, 0), LIMITS.sideCount));
  // Kamien WPUSZCZANY w szyne musi zostawic szynke po obu stronach gniazda.
  //
  // Nie dotyczy to kamienia we WLASNYCH LAPKACH: ten stoi w osobnej oprawce
  // ponad szyna i moze byc od niej szerszy. Tak wlasnie zbudowana jest
  // trylogia, w ktorej boczne kamienie sa niewiele mniejsze od glownego,
  // a szyna zostaje waska. Objecie ich ta sama granica przycinalo trylogie
  // do 1,3 mm po cichu, czyli zamienialo ja w soliter z dwoma okruszkami.
  const wpuszczany = p.side.setting !== "prong";
  const maxBok = wpuszczany
    ? Math.max(LIMITS.sideSize[0], p.width - 2 * SEAT.minRail)
    : LIMITS.sideSize[1];
  p.side.size = clamp(num(p.side.size, 1.6), [LIMITS.sideSize[0], Math.min(LIMITS.sideSize[1], maxBok)]);
  if (!SIDE_SETTINGS[p.side.setting]) p.side.setting = "pave";
  p.side.gap = clamp(num(p.side.gap, DEFAULTS.side.gap), LIMITS.sideGap);
  p.side.spread = clamp(num(p.side.spread, DEFAULTS.side.spread), LIMITS.sideSpread);

  // Halo to wieniec drobnych kamieni WOKOL korony, wiec musi byc na czym go
  // oprzec. Przy briolecie nie ma korony, tylko kabłąk, a przy oprawie
  // kanalowej wieniec kolidowalby z szynkami.
  p.halo.size = clamp(num(p.halo.size, 1.4), LIMITS.haloSize);
  if (p.setting === "drilled" || p.setting === "channel") p.halo = { ...p.halo, on: false };
  p.halo.on = Boolean(p.halo.on);

  return p;
}

/** Obrys szlifu przeskalowany do zadanej szerokosci kamienia w mm. */
export function outlineFor(cutId, sizeMm) {
  const cut = CUTS[cutId];
  if (!cut) throw new Error(`Nieznany szlif: ${cutId}`);
  return scalePts(OUTLINES[cut.outline](), sizeMm / 2);
}
