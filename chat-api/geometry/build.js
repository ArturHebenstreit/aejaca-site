// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/geometry/ring/build.js
// Regeneracja: npm run sync:pricing

// ============================================================
// KREATOR PIERSCIONKOW: budowa bryly
// ============================================================
// Czysta funkcja: parametry na wejsciu, zamknieta bryla i masa na wyjsciu.
// Ten sam kod ma dzialac w przegladarce przy podgladzie i na serwerze przy
// zakupie, wiec nie siega do niczego poza `manifold-3d` i naszymi danymi.
//
// UKLAD WSPOLRZEDNYCH, z ktorego wynika cala reszta:
// `Manifold.revolve` obraca przekroj wokol jego osi Y, a ta staje sie osia Z
// bryly. Pierscionek lezy wiec plasko, jego os to Z, a godzina dwunasta jest
// na osi +Y w odleglosci `ro` od srodka. Korone budujemy w osi +Z i dopiero
// obracamy w +Y. Zignorowanie tego daje lapki wiszace w powietrzu i bryle
// rozsypana na kawalki, co juz raz nas kosztowalo wieczor.

import Module from "manifold-3d";
import {
  CUTS, SEAT, SIDE_SETTINGS, outlineFor, scalePts, resample, prongAngles, validate,
  signetOutline, tableSize,
} from "./params.js";
import { CASTING_ALLOYS, massGrams } from "../pricing/castingAlloys.js";
import { gemDensity } from "../pricing/gemOptics.js";

const DEG = Math.PI / 180;
const SEG = 96;                 // segmentow obrotu szyny w wydaniu docelowym

let wasmPromise = null;
/** Jadro wczytujemy raz na proces. W przegladarce to samo, tylko raz na karte. */
export function kernel() {
  if (!wasmPromise) {
    wasmPromise = Module().then((w) => { w.setup(); return w; });
  }
  return wasmPromise;
}

/**
 * PULAPKA, ktora kosztowala pierwsze podejscie do prototypu: `revolve`
 * i `extrude` przy profilu nawinietym zgodnie z ruchem wskazowek zegara
 * zwracaja bryle PUSTA, bez bledu i bez ostrzezenia. Kolejnosc punktow nie
 * moze decydowac o tym, czy model istnieje, wiec pole liczymy sami.
 */
function ccw(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a < 0 ? [...pts].reverse() : pts;
}

// ------------------------------------------------------------
// Szyna
// ------------------------------------------------------------
/** Przekroj szyny w ukladzie (promien, polozenie wzdluz osi pierscionka). */
export function shankProfile({ innerDia, width, thickness, profile }) {
  const ri = innerDia / 2, hw = width / 2, t = thickness;

  if (profile === "flat") {
    return [[ri, -hw], [ri + t, -hw], [ri + t, hw], [ri, hw]];
  }
  if (profile === "knife") {
    return [[ri, -hw], [ri + t, 0], [ri, hw]];
  }
  if (profile === "comfort") {
    // Comfort fit: plaska gora, wnetrze zaokraglone, zeby obraczka zsuwala sie
    // po palcu zamiast go scinac krawedzia.
    const arc = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (i / 12);
      arc.push([ri + 0.35 * (1 - Math.sin(a)), hw * Math.cos(a)]);
    }
    return [[ri + t, -hw], [ri + t, hw], ...arc];
  }
  // Polokragly: polelipsa o polosiach `t` na promieniu i `hw` wzdluz osi.
  const arc = [];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI * (i / 24);
    arc.push([ri + t * Math.sin(a), -hw * Math.cos(a)]);
  }
  return [[ri, -hw], ...arc, [ri, hw]];
}

/**
 * Zewnetrzny promien szyny na zadanej wysokosci wzdluz jej osi.
 *
 * Bez tego kuleczki pave i lapki boczne laduja w powietrzu: szyna polokragla
 * opada ku krawedziom o kilka dziesiatych milimetra, wiec kulka postawiona na
 * promieniu `ro` styka sie z metalem tylko na samym srodku. Suma takich brył
 * rozsypuje sie na kawalki, co `genus` pokazuje od razu, a oko nie.
 *
 * Liczymy przecinajac obrys pozioma linia, wiec dziala dla kazdego profilu,
 * takze tych dolozonych pozniej.
 */
export function shankRadiusAt(p, z) {
  const pts = shankProfile(p);
  let best = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [r1, z1] = pts[i], [r2, z2] = pts[(i + 1) % pts.length];
    if ((z1 - z) * (z2 - z) > 0) continue;              // odcinek nie siega tej wysokosci
    const t = z2 === z1 ? 0 : (z - z1) / (z2 - z1);
    const r = r1 + (r2 - r1) * t;
    if (r > best) best = r;
  }
  return Number.isFinite(best) ? best : p.innerDia / 2 + p.thickness;
}

/**
 * Szyna o przekroju ZMIENNYM wzdluz obwodu.
 *
 * `revolve` obraca jeden przekroj, wiec daje szyne rownej grubosci na calym
 * obwodzie. Na zdjeciach katalogowych tak nie jest prawie nigdy: szyna
 * pierscionka zareczynowego zweza sie ku glowicy, a sygnet odwrotnie,
 * gestnieje pod tarcza. To nie jest ozdobnik, tylko powod, dla ktorego
 * pierscionek wyglada na zaprojektowany, a nie wyciety z rurki.
 *
 * Siatke skladamy sami, bo jadro nie ma przeciagniecia po sciezce. Przekroj
 * jest zamknietym obrysem, obwod tez jest zamkniety, wiec powstaje z tego
 * torus i nie trzeba domykac konców. Kolejnosc wierzcholkow w czworokacie
 * decyduje o stronie scian: przy odwrotnej jadro oddaje bryle o ujemnej
 * objetosci, co lapie test.
 *
 * Mnozniki dzialaja na ODLEGLOSC OD SRODKA PRZEKROJU, nie na wspolrzedne,
 * zeby wnetrze szyny zostalo okragle. Palec ma byc w otworze o stalej
 * srednicy niezaleznie od tego, co dzieje sie na zewnatrz.
 */
const TAPERS = {
  none: null,
  /** Zwezana: waska przy glowicy, pelna z tylu. Klasyka pierscionka z kamieniem. */
  // Zwezenie do 0,58 szerokosci zostawialo pod koszem szczeline: kosz ma
  // okolo czterech milimetrow, a szyna przy glowicy schodzila do jednego
  // i kosz opieral sie na niej tylko srodkiem.
  tapered: (u) => ({ w: 0.70 + 0.30 * u, t: 0.84 + 0.16 * u }),
  /** Katedralna: ramiona podnosza sie luklem do glowicy, szerokosc bez zmian. */
  cathedral: (u) => {
    const s = Math.max(0, 1 - u / 0.45);
    return { w: 1, t: 1 + 0.95 * s * s };
  },
  /**
   * Sygnetowa: szyna PUCHNIE ku tarczy i to ona jest polowa sygnetu.
   *
   * Zakres podnioslem z 0,55 do 0,78 obwodu i rozszerzenie z 0,62 do 1,15.
   * Powod jest taki, ze sygnet rozpoznaje sie po tym, iz tarcza jest zrosnieta
   * z szyna, a nie postawiona na niej. Gdy szyna rozszerza sie tylko tuz pod
   * glowica, przejscie musi nadrobic cala roznice na dwoch milimetrach wysokosci
   * i powstaje szyjka, czyli sylwetka pierscionka z korona.
   */
  signet: (u) => {
    const s = Math.max(0, 1 - u / 0.78);
    const k = s * s * (3 - 2 * s);
    return { w: 1 + 1.15 * k, t: 1 + 1.05 * k };
  },
};

export function taperFor(p) {
  const nazwa = p.taper === "auto" ? (p.kind === "signet" ? "signet" : "none") : p.taper;
  return TAPERS[nazwa] || null;
}

export function buildShank(w, p, segments) {
  const { Manifold, CrossSection, Mesh } = w;
  const pts = ccw(shankProfile(p));
  const taper = taperFor(p);

  // Bez zwezenia zostaje obrot: jedna operacja jadra zamiast recznej siatki,
  // wiec szybciej i bez ryzyka pomylki w orientacji scian.
  if (!taper) return Manifold.revolve(CrossSection.ofPolygons([pts]), segments);

  const ri = p.innerDia / 2;
  const K = pts.length, M = Math.max(48, segments);
  const vert = new Float32Array(M * K * 3);
  const tri = new Uint32Array(M * K * 2 * 3);

  for (let i = 0; i < M; i++) {
    const th = (i / M) * Math.PI * 2;
    // Godzina dwunasta, czyli miejsce glowicy, lezy na +Y.
    // ODLEGLOSC KATOWA OD GLOWICY, i to jest cala subtelnosc tego miejsca.
    // Bylo tu `1 - d / PI`, czyli u = 1 dokladnie tam, gdzie siedzi glowica,
    // podczas gdy wszystkie zwezenia opisane wyzej licza u = 0 przy glowicy.
    // Sylwetki wychodzily wiec ODWROCONE: sygnet gestnial na dole zamiast
    // pod tarcza, a szyna zwezana byla waska z tylu. Objetosc sie zgadzala,
    // bo calka nie wie, ktora strona jest gora, i dlatego test tego nie lapal.
    const d = Math.abs(((th - Math.PI / 2) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
    const u = d / Math.PI;                  // 0 przy glowicy, 1 po przeciwnej stronie
    const k = taper(u);
    const ct = Math.cos(th), st = Math.sin(th);

    for (let j = 0; j < K; j++) {
      const [r, z] = pts[j];
      const rr = ri + (r - ri) * k.t;
      const o = (i * K + j) * 3;
      vert[o] = rr * ct; vert[o + 1] = rr * st; vert[o + 2] = z * k.w;
    }
  }

  let n = 0;
  for (let i = 0; i < M; i++) {
    const i2 = (i + 1) % M;
    for (let j = 0; j < K; j++) {
      const j2 = (j + 1) % K;
      const a = i * K + j, b = i2 * K + j, c = i2 * K + j2, d = i * K + j2;
      tri[n++] = a; tri[n++] = b; tri[n++] = c;
      tri[n++] = a; tri[n++] = c; tri[n++] = d;
    }
  }

  return new Manifold(new Mesh({ numProp: 3, vertProperties: vert, triVerts: tri }));
}

// ------------------------------------------------------------
// Kamien
// ------------------------------------------------------------
// Bryla kamienia w ukladzie lokalnym: rondysta na z = 0, korona w gore,
// pawilon w dol. Kamienia NIE odlewamy, sluzy podgladowi i wycieciu gniazda.
/**
 * Suma i roznica ODDAJACE skladniki.
 *
 * Jadro trzyma bryly w pamieci WebAssembly i nie oddaje jej samo, bo zbieracz
 * smieci JavaScriptu o tej pamieci nie wie. Kazde `a.add(b)` zwraca NOWA bryle,
 * a stara `a` i `b` zostaja w pamieci na zawsze. Jeden pierscionek z halo to
 * kilkadziesiat takich sum, czyli kilkadziesiat porzuconych bryl.
 *
 * W przegladarce ma to skutek gorszy niz w tescie: podglad przelicza sie przy
 * KAZDYM ruchu suwaka, wiec pamiec rosla przez cala sesje az do zalamania
 * kontekstu. W zestawie testow konczylo sie to bledem dostepu do pamieci
 * w losowym miejscu, zaleznie od tego, ktora bryla przelala szale.
 *
 * Uzywamy ich WYLACZNIE tam, gdzie oba skladniki sa tymczasowe i nikt inny
 * ich nie trzyma. Bryly wspoldzielone, jak wzorce lapek, zwalniamy osobno.
 */
const zlacz = (a, b) => { const c = a.add(b); a.delete?.(); b.delete?.(); return c; };
const odejmij = (a, b) => { const c = a.subtract(b); a.delete?.(); b.delete?.(); return c; };

const PROPORTIONS = {
  brilliant: { pav: 0.43, girdle: 0.03, crown: 0.16 },
  step:      { pav: 0.45, girdle: 0.04, crown: 0.12 },
  drop:      { pav: 0.75, girdle: 0.02, crown: 0.55 },
  dome:      { pav: 0.00, girdle: 0.04, crown: 0.35 },
  rose:      { pav: 0.00, girdle: 0.03, crown: 0.28 },
  rosePav:   { pav: 0.50, girdle: 0.04, crown: 0.06 },
};

/** Ostrze stozka budujemy z malego przekroju i duzego `scaleTop`, bo tak
 *  `extrude` rozszerza sie ku gorze bez odbijania bryly. Odbicie zmienialoby
 *  kierunek nawiniecia, a to juz znamy. */
function cone(Manifold, CrossSection, pts, height, downward) {
  const k = 0.02;
  const small = CrossSection.ofPolygons([ccw(scalePts(pts, k))]);
  const c = Manifold.extrude(small, height, 0, 0, [1 / k, 1 / k]);
  return downward ? c.translate([0, 0, -height]) : c;
}

/**
 * Ile fasetek ma obwod kamienia.
 *
 * To jest jedyny powod, dla ktorego kamien na renderze wygladal jak otoczak.
 * Obrysy szlifow maja po kilkadziesiat punktow, bo z nich powstaje takze
 * gniazdo, ktore ma byc gladkie. Kamien budowany z tego samego obrysu to
 * stozek o pieciudziesieciu bokach, czyli powierzchnia ciagla: fasetek nie ma
 * na nim wcale, wiec zaden sposob cieniowania ich nie pokaze. Piktogram
 * rysowal szlif, a bryla go nie miala.
 *
 * Szesnascie sektorow to kompromis: prawdziwy brylant ma trzydziesci dwie
 * fasetki rondysty, ale przy szesnastu widac je na ekranie wyraznie, a bryla
 * kamienia jest dwa razy lzejsza dla jadra. Dla szlifow schodkowych liczba
 * musi byc wielokrotnoscia liczby naroznikow, inaczej scinamy naroze.
 */
const FASETY = 16;

/** Obrys szlifu sprowadzony do fasetek. Naroza zostaja, bo `resample` idzie po indeksach. */
function fasetowany(cutId, sizeMm, n = FASETY) {
  return resample(outlineFor(cutId, sizeMm), n);
}

/**
 * Obrys sprowadzony do `n` wierzcholkow, z PRZESUNIECIEM o ulamek sektora.
 *
 * Przesuniecie o pol sektora daje wierzcholki dokladnie miedzy poprzednimi
 * i wlasnie na tym stoi caly szlif brylantowy: fasetki gornego wienca schodza
 * sie ostrzem tam, gdzie dolny ma srodek boku. Obrotem tego nie zalatwimy,
 * bo obrot owalu daje owal krzywo postawiony, a przesuniecie po obrysie
 * dziala tak samo dobrze dla kola, owalu i markizy.
 */
function probka(cutId, sizeMm, n, przesun = 0) {
  const src = outlineFor(cutId, sizeMm), m = src.length;
  return Array.from({ length: n }, (_, i) => {
    const t = ((i + przesun) / n) * m;
    const k = Math.floor(t), f = t - k;
    const a = src[((k % m) + m) % m], b = src[(((k + 1) % m) + m) % m];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  });
}

/**
 * Wieniec fasetek: przeciagniecie obrysu ze SKRETEM.
 *
 * Skret o polowe sektora przesuwa gorny wielokat o pol fasetki wzgledem
 * dolnego i wlasnie stad bierze sie zygzak, po ktorym poznaje sie szlif
 * brylantowy: dolne fasetki rondysty i fasetki glowne pawilonu spotykaja sie
 * na przemian. Bez skretu powstaja same trapezy, czyli szlif schodkowy,
 * i tak wlasnie budujemy szmaragd czy bagietke.
 */
function wieniec(w, pts, h, skalaGora, skret) {
  const cs = w.CrossSection.ofPolygons([ccw(pts)]);
  const m = w.Manifold.extrude(cs, h, 1, skret, [skalaGora, skalaGora]);
  cs.delete?.();
  return m;
}

/** Obrys obrocony o zadany kat, do ustawienia zalamania miedzy wiencami. */
const obrocPts = (pts, deg) => {
  const a = deg * DEG, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]);
};

export function stoneSolid(w, cutId, sizeMm) {
  const { Manifold, CrossSection } = w;
  const cut = CUTS[cutId];
  const pr = PROPORTIONS[cut.profile];
  const fasetowy = cut.profile === "brilliant" || cut.profile === "step";
  const pts = fasetowy ? fasetowany(cutId, sizeMm) : outlineFor(cutId, sizeMm);
  const cs = CrossSection.ofPolygons([ccw(pts)]);

  const pavH = pr.pav * sizeMm, girdleH = pr.girdle * sizeMm, crownH = pr.crown * sizeMm;
  let solid = Manifold.extrude(cs, girdleH);          // rondysta, z = 0..girdleH

  if (fasetowy && cut.profile === "brilliant" && wypukly(pts)) {
    // ------------------------------------------------------------
    // SZLIF BRYLANTOWY, uklad fasetek taki jak w kamieniu
    // ------------------------------------------------------------
    // Poprzednia wersja miala fasetki, ale wszystkie jednakowe: szesnascie
    // identycznych trapezow w koronie i szesnascie w pawilonie, czyli kamien
    // pociety jak tort. Prawdziwy brylant czyta sie po czym innym: tafla jest
    // OSMIOKATEM, pod nia leza cztery rzedy fasetek o roznych ksztaltach,
    // a gwiazda i romby uklada sie w osmiokrotny wzor. To wlasnie ten wzor
    // widac na zdjeciach katalogowych i o niego chodzilo w uwadze.
    //
    // Buduje sie to tak, jak szlifuje: rondysta na szesnascie fasetek, zalamanie
    // przesuniete o POL sektora, i tafla na osiem. Otoczka wypuklosciowa dwoch
    // sasiednich obrysow sama tworzy wlasciwe scianki, bo kamien jest bryla
    // wypukla, a jej otoczka to ona sama.
    const tbl = Math.max(cut.table, 0.05);
    const P16 = probka(cutId, sizeMm, 16, 0);            // rondysta
    const P16m = probka(cutId, sizeMm, 16, 0.5);         // zalamania, o pol sektora dalej
    const P8t = probka(cutId, sizeMm, 8, 0);             // tafla, co drugi wierzcholek rondysty
    const P8k = probka(cutId, sizeMm, 8, 0.5);           // koleta, pod fasetkami gwiazdy

    // Kamien jest bryla WYPUKLA, wiec nie trzeba go skladac z plastrow:
    // wystarczy jedna otoczka wszystkich poziomow. Lancuch otoczek zostawialby
    // na kazdym zalamaniu progek grubosci przekroju pomocniczego, czyli
    // czterdziesci dodatkowych scianek, ktorych w kamieniu nie ma.
    //
    // ZALAMANIA MUSZA LEZEC POZA prosta rondysta-tafla, inaczej otoczka je
    // POLKNIE i zostanie zwykly dwustozek. Pierwsze liczby dobralem tak, zeby
    // zgadzala sie masa, i wyszly za male: 0,755 przy prostej 0,806, czyli
    // wierzcholek schowany pod powierzchnia. Fasetki gwiazdy znikaly bez sladu,
    // bo bryla byla poprawna, tylko gladsza. Teraz zalamania sa tam, gdzie sa
    // w kamieniu, czyli minimalnie NA ZEWNATRZ prostej, i to one robia romb
    // i gwiazde.
    const poziomy = [scalePts(P16, 1), P16, scalePts(P16m, 0.835), scalePts(P8t, tbl)];
    const zetki = [0, girdleH, girdleH + crownH * 0.45, girdleH + crownH];
    if (pavH > 0) {
      poziomy.unshift(scalePts(P8k, 0.05), scalePts(P16m, 0.335));
      zetki.unshift(-pavH, -pavH * 0.70);
    } else {
      poziomy.unshift(scalePts(P16, 0.98));
      zetki.unshift(-0.02);
    }
    solid.delete?.();
    return { solid: hullPoziomow(w, poziomy, zetki), pavH, girdleH, crownH };
    return { solid, pavH, girdleH, crownH };
  }

  if (fasetowy) {
    // Szlif SCHODKOWY, a takze kazdy wklesly obrys, ktoremu otoczka
    // wypuklosciowa wypelnilaby wciecie. Tu fasetki sa rownoleglymi trapezami
    // i buduje sie je przeciagnieciem ze skretem albo bez.
    const skret = cut.profile === "step" ? 0 : 180 / FASETY;
    const tbl = Math.max(cut.table, 0.05);

    if (pavH > 0) {
      const zZalam = -pavH * 0.55;
      const sZalam = 0.47;
      const zalamanie = obrocPts(scalePts(pts, sZalam), skret);
      solid = zlacz(solid, wieniec(w, zalamanie, -zZalam, 1 / sZalam, -skret)
        .translate([0, 0, zZalam]));
      solid = zlacz(solid, wieniec(w, scalePts(zalamanie, 0.03 / sZalam),
        zZalam + pavH, sZalam / 0.03, 0).translate([0, 0, -pavH]));
    } else {
      solid = zlacz(solid, Manifold.extrude(cs, 0.02).translate([0, 0, -0.02]));
    }

    const sKor = tbl + (1 - tbl) * 0.42;
    const zalamanieK = obrocPts(scalePts(pts, sKor), skret);
    solid = zlacz(solid, wieniec(w, pts, crownH * 0.5, sKor, skret)
      .translate([0, 0, girdleH]));
    solid = zlacz(solid, wieniec(w, zalamanieK, crownH * 0.5, tbl / sKor, -skret)
      .translate([0, 0, girdleH + crownH * 0.5]));
    return { solid, pavH, girdleH, crownH };
  }

  if (pavH > 0) solid = zlacz(solid, cone(Manifold, CrossSection, pts, pavH, true));
  else solid = zlacz(solid, Manifold.extrude(cs, 0.02).translate([0, 0, -0.02]));

  if (cut.profile === "drop") {
    solid = zlacz(solid, cone(Manifold, CrossSection, pts, crownH, false).translate([0, 0, girdleH]));
  } else if (cut.profile === "dome" || cut.profile === "rose") {
    // Kopula: kilka warstw zwezajacych sie ku gorze, bo `extrude` ze
    // `scaleTop` daje stozek, a nam potrzeba lagodnego luku.
    const layers = cut.profile === "dome" ? 6 : 3;
    for (let i = 0; i < layers; i++) {
      const t0 = i / layers, t1 = (i + 1) / layers;
      const r0 = Math.cos(t0 * Math.PI / 2), r1 = Math.cos(t1 * Math.PI / 2);
      const layer = Manifold.extrude(
        CrossSection.ofPolygons([ccw(scalePts(pts, Math.max(r0, 0.02)))]),
        crownH / layers, 0, 0, [Math.max(r1 / r0, 0.02), Math.max(r1 / r0, 0.02)],
      ).translate([0, 0, girdleH + (crownH * i) / layers]);
      solid = zlacz(solid, layer);
    }
  } else {
    const tbl = Math.max(cut.table, 0.05);
    solid = zlacz(solid, Manifold.extrude(cs, crownH, 0, 0, [tbl, tbl]).translate([0, 0, girdleH]));
  }
  return { solid, pavH, girdleH, crownH };
}

/**
 * Gniazdo, czyli to, co WYCINAMY z metalu.
 *
 * Rondysta gniazda jest o `SEAT.undercut` wezsza od kamienia, bo kamien ma
 * na czyms usiasc. Ponizej idzie stozek o kacie oparcia zgodnym z pawilonem,
 * a powyzej przelot, zeby przez kamien szlo swiatlo i zeby dalo sie go
 * wypchnac od spodu przy przekladaniu.
 */
function seatCutter(w, cutId, sizeMm, zamkniete = false, wylot = SEAT.throughWidth) {
  const { Manifold, CrossSection } = w;
  const pr = PROPORTIONS[CUTS[cutId].profile];

  // 1. WLOT, czyli droga kamienia z gory do gniazda.
  //
  // Tu siedzial blad, ktory unieruchamial caly kreator jako narzedzie
  // warsztatowe. Otwor nad rondysta byl WEZSZY od kamienia o podciecie, i to
  // na calej wysokosci korony. Kamien nie mial wiec jak zjechac do gniazda:
  // siadal na gornych krawedziach lapek, poltora milimetra za wysoko, a to,
  // co zostawalo z lapek po wycieciu gniazda, bylo pierscieniem zrosnietym
  // z koszem. Zmierzone na bryle: otwor 3,18 mm na calej wysokosci przy
  // rondyscie 3,25 mm.
  //
  // Wlot jest wiec SZERSZY od kamienia o luz montazowy. Lapki staja poza nim
  // i zostaja cale, a kamien wchodzi z gory tak, jak wchodzi w warsztacie.
  //
  // W modelu Z KAMIENIEM wlot ma inny ksztalt, bo i zadanie ma inne. Kamien
  // jest juz w srodku, wiec nie trzeba mu drogi z gory, a lapki maja LEZEC
  // na koronie. Odejmujemy wtedy sam kamien, powiekszony o luz i uciety
  // plaszczyzna rondysty: metal znika dokladnie tam, gdzie siedzi kamien,
  // a pazurek zostaje oparty na jego koronie.
  const luz = 0.05;
  let wlot;
  if (zamkniete) {
    const duzy = stoneSolid(w, cutId, sizeMm + 2 * luz);
    const noz = Manifold.cube([sizeMm * 4, sizeMm * 4, sizeMm * 4], true)
      .translate([0, 0, sizeMm * 2]);
    wlot = duzy.solid.intersect(noz);
    duzy.solid.delete?.(); noz.delete?.();

    // NAD TAFLA MUSI BYC POWIETRZE, i to nie jest kosmetyka.
    //
    // Sam ksztalt kamienia wystarczyl wszedzie tam, gdzie kamien wystawal
    // ponad metal. Przy pave jest odwrotnie: kuleczki zakucia sa wyzsze od
    // calego kamyka, wiec gniazdo wyciete dokladnie w jego obrysie konczylo
    // sie POD nimi i zostawalo ZAMKNIETYM PECHERZEM w srodku szyny.
    // Zmierzone: dwie jamy po 0,66 mm3 przy pierwszym kamieniu z kazdej
    // strony. Objetosc, masa i wyglad byly bez zarzutu, a plik zawieral
    // pustke, ktora slicer zglasza jako blad, i gniazdo, ktore nie bylo
    // otwarte.
    //
    // Nad tafla kamienia nie ma czego trzymac, bo zakucie chwyta rondyste,
    // wiec slup o przekroju tafli mozna wybrac az na wylot i zadne zakucie
    // na tym nie traci.
    const tbl = Math.max(CUTS[cutId].table || 0, 0.42);
    const slup = Manifold.extrude(
      CrossSection.ofPolygons([ccw(scalePts(outlineFor(cutId, sizeMm + 2 * luz), tbl))]),
      sizeMm * 4);
    wlot = zlacz(wlot, slup);
  } else {
    wlot = Manifold.extrude(
      CrossSection.ofPolygons([ccw(outlineFor(cutId, sizeMm + 2 * luz))]), sizeMm * 2);
  }

  // 2. LOZE. Srednica gniazda jest MNIEJSZA od kamienia o podciecie, wiec
  //    rondysta siada na jego krawedzi. Gniazdo w wymiar kamienia to kamien
  //    przelatujacy na wylot.
  const shrunk = Math.max(0.4, sizeMm - 2 * SEAT.undercut);
  const pts = outlineFor(cutId, shrunk);
  const cs = CrossSection.ofPolygons([ccw(pts)]);

  // Prosta scianka pod rondysta, na ktorej krawedzi siada kamien. Bez niej
  // kamien opiera sie na linii stycznej stozka i przy dociskaniu lapek obraca
  // sie w gniezdzie. Frez jubilerski wycina wlasnie taka scianke.
  // Wysokosc zero dalaby bryle pusta, a `add` z pusta bryla zwraca pustke,
  // wiec cale gniazdo znika bez sladu.
  const ledge = SEAT.ledge > 0.001
    ? Manifold.extrude(cs, SEAT.ledge).translate([0, 0, -SEAT.ledge])
    : null;

  // 3. STOZEK pod scianka, zwezajacy sie zgodnie z pawilonem. Otwor prosty na
  //    calej glebokosci nie daje kamieniowi oparcia i zabiera metal z galerii,
  //    a stozek robi jedno i drugie na raz.
  const pavH = pr.pav * sizeMm;
  const glebokosc = pavH > 0.05
    ? pavH
    : (shrunk / 2) * Math.tan(SEAT.bearingDeg * DEG) + SEAT.throughClearance;
  // STOZEK MUSI ZWEZAC SIE SZYBCIEJ NIZ PAWILON KAMIENIA, inaczej kamien
  // w nim zjezdza.
  //
  // Kamien opiera sie na gornej krawedzi lozа, ale opiera sie tylko wtedy, gdy
  // otwor pod nia ucieka od niego szybciej, niz on sam sie zweza. Gdy stozek
  // jest lagodniejszy od pawilonu, kamien wchodzi w niego jak korek i siada
  // dopiero na wierzcholku. Zlapal to sprawdzian osadzania: po poszerzeniu
  // wylotu owal i gruszka przestaly sie zatrzymywac, bo przy tej samej
  // glebokosci stozek zrobil sie lagodniejszy.
  //
  // Wysokosc liczymy wiec z tego, ile stozek ma do przebycia w POPRZEK,
  // a nie z ulamka glebokosci: schodzi do wylotu na 0,9 tej drogi, czyli
  // zawsze stromiej niz kamien.
  const stozekH = glebokosc * Math.min(1 - SEAT.throughPart, 0.9 * (1 - wylot));
  // GLEBOKOSC i SZEROKOSC to dwie rozne rzeczy, mimo ze przez chwile opisywala
  // je jedna liczba: stozek zajmuje piec szostych GLEBOKOSCI, a otwor pod nim
  // ma polowe SZEROKOSCI gniazda. Wspolna wartosc dawala kamykowi 1,4 mm wylot
  // o srednicy 0,23 mm, czyli gniazdo, ktore z gory wyglada na zaslepione.
  const dolPts = scalePts(pts, wylot);
  const dolCs = CrossSection.ofPolygons([ccw(dolPts)]);
  const stozek = Manifold.extrude(dolCs, stozekH, 0, 0, [1 / wylot, 1 / wylot])
    .translate([0, 0, -SEAT.ledge - stozekH]);

  // 4. PRZELOT. Ostatni odcinek idzie na wylot prosto: przez niego wchodzi
  //    swiatlo od spodu i przez niego wypycha sie kamien przy przekladaniu.
  //    Wezszy od stozka, zeby nie zabrac metalu z galerii.
  const przelot = Manifold.extrude(dolCs, sizeMm * 2)
    .translate([0, 0, -SEAT.ledge - stozekH - sizeMm * 2 + 0.01]);

  const razem = ledge ? zlacz(wlot, ledge) : wlot;
  return zlacz(zlacz(razem, stozek), przelot);
}

// ------------------------------------------------------------
// Korona
// ------------------------------------------------------------
/** Promien obrysu szlifu w zadanym kierunku, zeby lapka siadla NA kamieniu. */
function radiusAt(pts, deg) {
  const a = deg * DEG, dx = Math.cos(a), dy = Math.sin(a);
  let best = 0;
  for (const [x, y] of pts) {
    const proj = x * dx + y * dy;
    const perp = Math.abs(-x * dy + y * dx);
    if (perp < 0.35 && proj > best) best = proj;
  }
  return best || Math.max(...pts.map(([x, y]) => Math.hypot(x, y)));
}

// Drobna algebra wektorowa. Rura potrzebuje ramki w kazdym punkcie toru,
// a to sie bez niej nie da napisac czytelnie.
const wAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const wSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const wMul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const wDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const wCross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const wNorm = (a) => { const l = Math.hypot(...a) || 1; return wMul(a, 1 / l); };

/** Obrot wektora `v` o ten sam obrot, ktory przeprowadza `a` na `b`. */
function obrocZDo(a, b, v) {
  const os = wCross(a, b);
  const s = Math.hypot(...os);
  if (s < 1e-9) return v;                       // tor sie nie zmienil
  const k = wMul(os, 1 / s);
  const kat = Math.atan2(s, wDot(a, b));
  const c = Math.cos(kat), sn = Math.sin(kat);
  // Rodrigues
  return wAdd(
    wAdd(wMul(v, c), wMul(wCross(k, v), sn)),
    wMul(k, wDot(k, v) * (1 - c)),
  );
}

/**
 * Gladka rura poprowadzona po lamanej: JEDNA powloka przeciagnieta po torze,
 * a nie suma stozkow.
 *
 * DLACZEGO NIE SUMA STOZKOW. Dwa stozki na zalamanym torze maja na zlaczu
 * okregi o tym samym promieniu, ale lezace w ROZNYCH PLASZCZYZNACH, bo kazdy
 * jest prostopadly do swojego odcinka. Po zewnetrznej stronie zgiecia miedzy
 * koncem jednego a poczatkiem drugiego zostaje klin, ktorego suma nie wypelnia:
 * na powierzchni robi sie rowek glebokosci `r * tan(kat)` z ostra krawedzia.
 * Zmierzone na luku galerii, przy skrecie 2,8 stopnia i rurze 1,2 mm, daje to
 * karb szescdziesieciu tysiecznych milimetra i ubytek 0,056 mm3 na jednym
 * zlaczu. Trzynascie punktow luku to dwanascie takich karbow jeden za drugim,
 * czyli dokladnie ta "karbowana szyna", ktora klient zglaszal trzy razy.
 *
 * Lataliem to najpierw kula w zlaczu: kula wypelnia klin, ale przy rurze
 * ZWEZAJACEJ SIE wychodzi spod sasiednich odcinkow i robi paciorek. Potem
 * progiem skretu: ponizej dziesieciu stopni kula znikala, a karb wracal.
 * Jedno i drugie bylo leczeniem objawu. Suma brylek nigdy nie da gladkiej
 * rury, bo kazde zlacze jest szwem.
 *
 * Zamiast tego stawiamy pierscien wierzcholkow w KAZDYM punkcie toru, w
 * plaszczyznie mitry (prostopadlej do usrednionego kierunku), i zszywamy je
 * czworokatami. Sasiednie pierscienie dziela wierzcholki co do jednego, wiec
 * szwu nie ma w ogole. Ramka jest przenoszona rownolegle wzdluz toru, zeby
 * rura sie nie skrecala.
 */
export function tubeAlong(w, punkty, promienie, opcje = {}) {
  const { Manifold, Mesh } = w;

  // Powtorzone punkty daja odcinek zerowej dlugosci, czyli kierunek bez sensu.
  const P = [], R = [];
  for (let i = 0; i < punkty.length; i++) {
    const q = punkty[i];
    if (P.length && Math.hypot(...wSub(q, P[P.length - 1])) < 1e-4) continue;
    P.push(q);
    R.push(Math.max(1e-3, promienie[i]));
  }
  if (P.length < 2) return null;

  const N = 32;                                 // wierzcholkow w obwodzie rury
  const KOPULA = 5;                             // pierscieni czubka
  const kierunki = [];
  for (let i = 0; i < P.length - 1; i++) kierunki.push(wNorm(wSub(P[i + 1], P[i])));

  // Styczna w punkcie: na koncach kierunek odcinka, w srodku srednia sasiadow.
  const T = [kierunki[0]];
  for (let i = 1; i < P.length - 1; i++) T.push(wNorm(wAdd(kierunki[i - 1], kierunki[i])));
  T.push(kierunki[kierunki.length - 1]);

  const wierzcholki = [];
  const push = (p) => { wierzcholki.push(p[0], p[1], p[2]); return wierzcholki.length / 3 - 1; };
  const tri = [];
  const face = (a, b, c) => { tri.push(a, b, c); };

  // Ramka startowa: cokolwiek prostopadlego do stycznej.
  let U = Math.abs(T[0][2]) < 0.9 ? wCross(T[0], [0, 0, 1]) : wCross(T[0], [1, 0, 0]);
  U = wNorm(U);

  const pierscienie = [];
  for (let i = 0; i < P.length; i++) {
    if (i > 0) U = obrocZDo(T[i - 1], T[i], U);
    // Reortogonalizacja: bez niej blad numeryczny zbiera sie wzdluz toru.
    U = wNorm(wSub(U, wMul(T[i], wDot(U, T[i]))));
    const V = wCross(T[i], U);

    // MITRA. Przekroj prostopadly do usrednionej stycznej jest w miejscu
    // zgiecia ELIPSA, a nie okregiem: kolo odcinka wchodzacego rzutuje sie
    // na te plaszczyzne rozciagniete o 1/cos(polowy skretu). Bez tego rura
    // chudnie w kazdym zakolu, a to jest przeciez to samo miejsce, w ktorym
    // wczesniej robil sie karb.
    let os = null, rozciag = 1;
    if (i > 0 && i < P.length - 1) {
      const cosA = Math.max(0.2, wDot(kierunki[i - 1], T[i]));
      rozciag = 1 / cosA;
      const rzut = wSub(kierunki[i - 1], wMul(T[i], wDot(kierunki[i - 1], T[i])));
      if (Math.hypot(...rzut) > 1e-6) os = wNorm(rzut);
    }

    const ring = [];
    for (let j = 0; j < N; j++) {
      const a = (j / N) * Math.PI * 2;
      let q = wAdd(wMul(U, Math.cos(a) * R[i]), wMul(V, Math.sin(a) * R[i]));
      if (os) q = wAdd(q, wMul(os, (rozciag - 1) * wDot(q, os)));
      ring.push(push(wAdd(P[i], q)));
    }
    pierscienie.push(ring);
  }

  // Plaszcz. Nawiniecie tak, zeby normalna wychodzila na zewnatrz.
  for (let i = 0; i < pierscienie.length - 1; i++) {
    const a = pierscienie[i], b = pierscienie[i + 1];
    for (let j = 0; j < N; j++) {
      const k = (j + 1) % N;
      face(a[j], a[k], b[k]);
      face(a[j], b[k], b[j]);
    }
  }

  // Denko: rura zaczyna sie zawsze plasko, bo tam wchodzi w inna bryle.
  {
    const a = pierscienie[0];
    const c = push(P[0]);
    for (let j = 0; j < N; j++) face(c, a[(j + 1) % N], a[j]);
  }

  // Czubek. Zaokraglony tylko tam, gdzie rura KONCZY SIE W POWIETRZU, czyli
  // na lapce. Luk galerii wchodzi koncem w szyne i kopula robi na nim guzek.
  const ostatni = pierscienie[pierscienie.length - 1];
  const Pk = P[P.length - 1], Tk = T[T.length - 1], Rk = R[R.length - 1];
  if (opcje.czubek === false) {
    const c = push(Pk);
    for (let j = 0; j < N; j++) face(c, ostatni[j], ostatni[(j + 1) % N]);
  } else {
    let Uk = wNorm(wSub(
      [wierzcholki[ostatni[0] * 3], wierzcholki[ostatni[0] * 3 + 1], wierzcholki[ostatni[0] * 3 + 2]],
      Pk,
    ));
    Uk = wNorm(wSub(Uk, wMul(Tk, wDot(Uk, Tk))));
    const Vk = wCross(Tk, Uk);
    let poprz = ostatni;
    for (let s = 1; s < KOPULA; s++) {
      const fi = (s / KOPULA) * (Math.PI / 2);
      const sr = wAdd(Pk, wMul(Tk, Rk * Math.sin(fi)));
      const rr = Rk * Math.cos(fi);
      const ring = [];
      for (let j = 0; j < N; j++) {
        const a = (j / N) * Math.PI * 2;
        ring.push(push(wAdd(sr, wAdd(wMul(Uk, Math.cos(a) * rr), wMul(Vk, Math.sin(a) * rr)))));
      }
      for (let j = 0; j < N; j++) {
        const k = (j + 1) % N;
        face(poprz[j], poprz[k], ring[k]);
        face(poprz[j], ring[k], ring[j]);
      }
      poprz = ring;
    }
    const szczyt = push(wAdd(Pk, wMul(Tk, Rk)));
    for (let j = 0; j < N; j++) face(poprz[j], poprz[(j + 1) % N], szczyt);
  }

  const siatka = new Mesh({
    numProp: 3,
    vertProperties: new Float32Array(wierzcholki),
    triVerts: new Uint32Array(tri),
  });
  const solid = Manifold.ofMesh(siatka);

  // Przeciagniecie ZAWODZI, gdy tor skreca ciasniej niz wynosi promien rury:
  // pierscienie wchodza wtedy jeden w drugi i powloka przecina sama siebie.
  // Zadna sciezka w tym pliku tego nie robi, ale sciezki zaleza od suwakow,
  // wiec zamiast ufac trzymamy stary sposob jako zapase. Karb jest brzydki,
  // brak bryly jest gorszy.
  if (!solid || solid.isEmpty() || solid.volume() <= 0) {
    solid?.delete?.();
    return tubeSklejana(w, P, R, opcje);
  }
  return solid;
}

/** Zapas: rura jako suma stozkow. Ma karby na zlaczach, ale nie ma jak sie
 *  wywrocic na ciasnym skrecie. */
function tubeSklejana(w, punkty, promienie, opcje = {}) {
  const { Manifold } = w;
  let solid = null;
  const dodaj = (m) => { solid = solid ? zlacz(solid, m) : m; };
  for (let i = 0; i < punkty.length - 1; i++) {
    const a = punkty[i], b = punkty[i + 1];
    const [dx, dy, dz] = wSub(b, a);
    const L = Math.hypot(dx, dy, dz);
    if (L < 1e-4) continue;
    const pochyl = Math.acos(Math.max(-1, Math.min(1, dz / L))) / DEG;
    const obrot = Math.atan2(dy, dx) / DEG;
    dodaj(Manifold.cylinder(L, promienie[i], promienie[i + 1], 32, false)
      .rotate([0, pochyl, obrot])
      .translate(a));
  }
  for (let i = 1; i < punkty.length; i++) {
    if (i === punkty.length - 1 && opcje.czubek === false) continue;
    dodaj(Manifold.sphere(promienie[i], 28).translate(punkty[i]));
  }
  return solid;
}

/**
 * Lapka, tak jak WYCHODZI Z ODLEWU: prosty pret stojacy przy rondyscie,
 * siegajacy ponad korone, zwezony i zaokraglony na koncu.
 *
 * Byla tu lapka ZAGIETA nad rondysta, czyli taka, jaka wyglada gotowy,
 * zakuty pierscionek. Wygladala lepiej i byla nie do uzycia: lapka zamknieta
 * nad kamieniem nie pozwala tego kamienia wlozyc. Model odlewniczy musi byc
 * otwarty, bo zakuwanie polega wlasnie na tym, ze jubiler dociska koncowki
 * po osadzeniu kamienia. Zagiecie jest ostatnia czynnoscia przy stole,
 * a nie stanem, w ktorym oddaje sie odlew.
 *
 * Konsekwencja dla podgladu jest swiadoma: pierscionek na ekranie wyglada
 * jak odlew przed zakuciem, bo tym wlasnie jest plik, ktory klient dostaje.
 *
 * Pret jest JEDNYM stozkiem scietym z kulista koncowka, a nie ciagiem kul.
 * Ciag kul byl potrzebny, dopoki lapka sie zaginala, bo tor byl krzywa. Prosta
 * lapka krzywej nie ma, a kule zostawialy na niej widoczne karbowanie: przy
 * srednicy 0,9 mm sasiednie kule roznily sie promieniem na tyle, ze powierzchnia
 * falowala. Na renderze wygladalo to jak sznur paciorkow, a na wydruku byloby
 * karbem, ktory jubiler musialby zeszlifowac przed zakuciem.
 */
export function prongSolid(w, { radius, prongR, base, girdleTop, crownH, zamkniete }) {
  const { Manifold } = w;

  if (zamkniete) {
    // Lapka ZAKUTA, czyli taka, jaka jest po osadzeniu kamienia: pret idzie
    // prosto do rondysty, a nad nia lagodnie klania sie do srodka i konczy
    // pazurkiem lezacym na koronie. Tego stanu nie da sie odlac z kamieniem
    // w srodku, wiec ma on sens wylacznie w modelu, ktory kamien juz zawiera.
    const top = girdleTop + crownH * 0.55;
    const zagiecie = prongR * 1.25;
    const zalamanie = (girdleTop - base) / (top - base);
    const N = 7;
    const punkty = [], promienie = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const u = t <= zalamanie ? 0 : (t - zalamanie) / (1 - zalamanie);
      punkty.push([radius - zagiecie * (u * u * (3 - 2 * u)), 0, base + (top - base) * t]);
      promienie.push(prongR * (1 - 0.3 * t));
    }
    return tubeAlong(w, punkty, promienie);
  }

  // Koniec siega WYZEJ niz korona, bo to jest material do zagiecia. Lapka
  // ucieta rowno z tafla nie ma czym objac kamienia.
  const top = girdleTop + crownH * 1.05;
  // Pret zweza sie ku gorze, tak jak zweza sie odlana lapka po opilowaniu.
  // Cienszy koniec latwiej sie dociska i mniej zaslania kamien.
  const rTop = prongR * 0.72;

  const trzon = Manifold.cylinder(top - base, prongR, rTop, 32, false)
    .translate([radius, 0, base]);
  const czubek = Manifold.sphere(rTop, 24).translate([radius, 0, top]);
  return zlacz(trzon, czubek);
}

/**
 * Lapka V, czyli scianka biegnaca po OBRYSIE wokol szpica.
 *
 * Poprzednia wersja doklejala do zwyklej lapki szescian, w dodatku nie
 * wysrodkowany, wiec wisial rogiem na szpicu i z zadnej strony nie przypominal
 * litery V. Prawdziwa lapka V obejmuje naroze z obu stron, bo tam kamien jest
 * najciensszy i odpryskuje: markiza i gruszka nie moga stac w niczym innym.
 *
 * Idziemy wiec obrysem szlifu w obie strony od szpica i stawiamy slupki na
 * jego zewnetrznej normalnej. Ksztalt bierze sie z samego szlifu, wiec V przy
 * gruszce jest lagodniejsze niz przy markizie, dokladnie tak jak w metalu.
 */
function vprongSolid(w, pts, deg, prongR, base, top, zamkniete = false) {
  const { Manifold } = w;
  const a = deg * DEG, dx = Math.cos(a), dy = Math.sin(a);

  // Szpic: punkt obrysu najdalej wysuniety w zadanym kierunku.
  let iTip = 0, best = -Infinity;
  pts.forEach(([x, y], i) => { const rzut = x * dx + y * dy; if (rzut > best) { best = rzut; iTip = i; } });

  // Ramiona obejmuja szpic na dlugosci mniej wiecej trzech srednic preta.
  const ramie = Math.max(0.8, prongR * 3.0);
  const n = pts.length;

  // Punkt obrysu odlegly o `dl` od szpica, mierzac PO OBRYSIE.
  const wzdluz = (kier, dl) => {
    let dlug = 0, i = iTip;
    for (let k = 0; k < n / 2; k++) {
      const j = ((i + kier) % n + n) % n;
      dlug += Math.hypot(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]);
      i = j;
      if (dlug >= dl) break;
    }
    return i;
  };

  // SLUPKI STOJA DWA, po jednym na kazdym ramieniu V, a nie po jednym na
  // kazdym wierzcholku obrysu.
  //
  // Poprzednia wersja stawiala pret w KAZDYM punkcie obrysu miedzy szpicem
  // a koncem ramienia. Obrys markizy jest tam gesty, wiec przy szpicu ladowalo
  // ich kilkanascie, jeden w drugim, i wygladalo to jak narosl, a nie jak
  // lapka. Tak tez zostalo zglszone: "krapy sa nalozone na siebie".
  //
  // Prawdziwa lapka V to dwa prety schodzace sie w szpicu i spinajaca je
  // ponizej sciezka metalu. Tyle wystarczy, zeby kamien nie wyszedl bokiem,
  // a szpic byl osloniety.
  const idx = [wzdluz(-1, ramie), wzdluz(1, ramie)];

  // Punkt na obrysie odsuniety na zewnatrz o `d`, razem z jego normalna.
  const naZewnatrz = (i, d) => {
    const prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
    const tx = next[0] - prev[0], ty = next[1] - prev[1];
    const L = Math.hypot(tx, ty) || 1;
    // Obrys biegnie przeciwnie do zegara, wiec normalna zewnetrzna to (ty, -tx).
    const nx = ty / L, ny = -tx / L;
    return { x: pts[i][0] + nx * d, y: pts[i][1] + ny * d, nx, ny };
  };

  let solid = null;
  const dodaj = (m) => { if (m) solid = solid ? zlacz(solid, m) : m; };

  const stopy = [];
  for (const i of idx) {
    const { x, y, nx, ny } = naZewnatrz(i, prongR * 0.6);
    stopy.push([x, y, base]);
    // Zakuta lapka V klania sie do srodka, czyli jej koniec przesuwa sie
    // wzdluz normalnej do wewnatrz i lezy na koronie.
    const dx = zamkniete ? -nx * prongR * 1.15 : 0;
    const dy = zamkniete ? -ny * prongR * 1.15 : 0;
    dodaj(tubeAlong(w,
      [[x, y, base], [x, y, base + (top - base) * 0.62], [x + dx, y + dy, top]],
      [prongR * 0.92, prongR * 0.8, prongR * 0.66]));
  }

  // Spinka: metal biegnacy od jednej stopy do drugiej DOOKOLA szpica, nisko,
  // tuz nad koszem. To ona robi z dwoch pretow litere V i to ona oslania
  // naroze, w ktorym kamien jest najciensszy.
  const szpic = naZewnatrz(iTip, prongR * 0.6);
  const zSpinki = base + (top - base) * 0.30;
  dodaj(tubeAlong(w,
    [stopy[0], [szpic.x, szpic.y, zSpinki], stopy[1]],
    [prongR * 0.85, prongR * 0.85, prongR * 0.85]));

  return solid;
}

/**
 * Czy zakucia maja byc ZAMKNIETE nad kamieniem.
 *
 * Rozstrzyga o tym przelacznik "Kamienie w modelu" i tak ma byc:
 *
 * - kamien W MODELU  -> wyrob GOTOWY, lapki docisniete na koronie,
 * - kamien WYLACZONY -> MODEL ODLEWNICZY, lapki otwarte, gniazda gotowe
 *   do zakucia.
 *
 * Przez jeden dzien stalo tu `false` na sztywno. Wyszlo to z blednej
 * diagnozy: wlasciciel zglaszal zakryte gniazda przy WYLACZONYCH kamieniach,
 * a ja policzylem, ze skoro przelacznik domyslnie stoi na TAK, to musial go
 * miec wlaczonego. Nie mial. Prawdziwe przyczyny byly dwie i obie leza gdzie
 * indziej: cienki jak ostrze rant kasety i lita bryla oprawki kamieni
 * bocznych. Obie poprawione, a ta linijka wraca tam, gdzie byla.
 *
 * Wniosek na przyszlosc jest w dzienniku: gdy zgloszenie nie zgadza sie
 * z ustawieniem domyslnym, to jest powod, zeby SPRAWDZIC, a nie zeby
 * poprawiac ustawienie.
 */
const zakute = (p) => p.casting?.stones !== false;

export function buildCrown(w, p, stone) {
  const { Manifold, CrossSection } = w;
  const cut = CUTS[p.stone.cut];
  const size = p.stone.size;
  const pts = outlineFor(p.stone.cut, size);
  const rP = p.prongDia / 2;
  let crown = null;
  const add = (m) => { crown = crown ? zlacz(crown, m) : m; };

  // Kosz, czyli galeria pod kamieniem. Bez niego lapki dotykaja szyny
  // punktowo i odlew pęka przy pierwszym uderzeniu.
  //
  // Musi byc WEZSZY od rondysty, inaczej polyka lapki i kamien, a caly wyrob
  // wyglada jak guzik. Lapki staja na promieniu rondysty, czyli na zewnatrz
  // kosza, i dopiero wtedy je widac.
  // Gorny promien MUSI siegac rondysty, bo na nim staja lapki. Wezszy kosz
  // zostawia je w powietrzu i bryla rozpada sie na kawalki.
  const girdleR = Math.max(...pts.map(([x, y]) => Math.hypot(x, y)));
  const girdleMin = Math.min(...pts.map(([x, y]) => Math.hypot(x, y)));
  const basketH = SEAT.aboveGalleryMm + stone.pavH * 0.45;

  // KOSZ IDZIE ZA OBRYSEM SZLIFU, a nie za jego najwiekszym promieniem.
  //
  // Byl tu walec o promieniu rownym polowie DLUZSZEJ osi kamienia i to jest
  // blad, ktory widac na pierwszy rzut oka przy kazdym szlifie wydluzonym.
  // Markiza osiem na cztery milimetry dostawala pod siebie tarcze o srednicy
  // osmiu milimetrow, czyli dwa razy szersza od samego kamienia. Na renderze
  // wygladalo to jak kamien polozony na monecie, a nie osadzony w koszu,
  // i tak tez zostalo zglszone: "pierscionek ma jakas dziwna tarcze".
  // To samo dotyczylo kaboszonu w kasecie, gdzie tarcza wystawala spod rantu.
  //
  // Obrys odsuniety na zewnatrz o `scianka` daje kosz, ktory wszedzie ma te
  // sama grubosc scianki, wiec przy markizie jest waski, a przy poduszce
  // pelny. Odsuniecie idzie przez `offset`, nie przez skalowanie: skalowanie
  // dodaje przy szpicu kilka razy wiecej metalu niz na boku.
  // Scianka kosza jest CIENKA, i to nie jest oszczedzanie metalu.
  //
  // Przy grubosci 0,3 mm kosz siegal niemal tam, gdzie stoi lapka, wiec lapka
  // tonela w nim do polowy i z boku wygladala jak pret wbity w klocek. Cienka
  // scianka zostawia ja na wierzchu jako zebro biegnace po koszu, czyli tak,
  // jak wyglada gotowa korona.
  const scianka = 0.16;
  const csRondysta = CrossSection.ofPolygons([ccw(pts)]);
  let csKosz = csRondysta;
  try {
    const o = csRondysta.offset(scianka, "Round", 2, 16);
    if (o && !o.isEmpty()) csKosz = o; else o?.delete?.();
  } catch { /* jadro bez offsetu: zostaje sam obrys */ }

  // KOLNIERZ, czyli prosta scianka pod rondysta, i dopiero pod nim zwezenie.
  //
  // Kosz zwezal sie od samej rondysty w dol, wiec lapka, ktora zaczyna sie
  // nizej, opierala sie o nia tylko gornym skrajem, a cala reszta jej stopy
  // wisiala obok metalu. Klient zglosil to wprost: lapki wisza na obramowaniu.
  // Prosty odcinek daje im scianke, do ktorej przylegaja na calej wysokosci,
  // a przy okazji jest to ta sama scianka, o ktora opiera sie rondysta.
  const kolnierz = Math.min(basketH * 0.75, SEAT.aboveGalleryMm + stone.pavH * 0.18);
  let basket = loftLevels(w, csKosz, [
    [-basketH, 0.55, 0.55],
    [-kolnierz, 1, 1],
    [0, 1, 1],
  ]);

  // Okna galerii. Bez nich kosz jest pelna bryla i caly wyrob wyglada jak
  // guzik, a do tego wazy o kilkadziesiat procent za duzo.
  //
  // Okna sa teraz WIEKSZE, bo ciezar przejely nogi lapek. To jest ta sama
  // wymiana, o ktora prosil klient: lepiej otworzyc oprawe tam, gdzie metal
  // niczego nie trzyma, a dolozyc go tam, gdzie stoi lapka.
  //
  // Grubosc okna liczymy z NAJKROTSZEGO promienia obrysu, nie z najdluzszego.
  // Przy markizie okno o szerokosci polowy dlugiej osi wycielo by caly kosz
  // wszerz i zostalyby z niego dwa kawalki.
  const winH = basketH * 0.72;
  const winT = Math.max(0.35, girdleMin * 0.78);
  for (const kat of [45, 135]) {
    basket = odejmij(basket,
      Manifold.cube([girdleR * 2.6, winT, winH], true)
        .rotate([0, 0, kat])
        .translate([0, 0, -basketH + winH / 2 + basketH * 0.1]));
  }
  add(basket);
  if (csKosz !== csRondysta) csKosz.delete?.();
  csRondysta.delete?.();

  if (p.setting === "bezel") {
    // Kaseta: scianka dookola rondysty, zawinieta nad kamien.
    //
    // Wczesniej byla prostym walcem o plaskiej gornej krawedzi, czyli tulejka.
    // Prawdziwa kaseta zweza sie ku gorze, bo jubiler DOCISKA rant na kamien,
    // a metal przy tym plynie do srodka. Plaska krawedz nie tylko wyglada
    // technicznie, ale i sugeruje, ze kamien mozna wyjac bez rozgiecia oprawy.
    //
    // Wnetrze wycina dopiero gniazdo, wiec tu zostawiamy pelny obrys.
    // Rant ma OBRAMOWAC kamien, a nie go przykryc.
    //
    // Byla tu scianka 0,5 mm siegajaca na 35 procent wysokosci korony. Po
    // odjeciu kamienia zostawal z tego szeroki kolnierz lezacy na koronie
    // i to on czytal sie jako "grube zamkniecie dookola". Kaseta jubilerska
    // zachodzi na kamien o kilka dziesiatych milimetra, tyle, zeby go
    // przytrzymac, i wlasnie tyle tu zostaje.
    // RANT MUSI ZOSTAC RANTEM PO WYCIECIU GNIAZDA.
    //
    // Byla tu scianka 0,4 mm zbiegajaca u gory o `wall * 0,85`, czyli do
    // promienia `size / 2 + 0,06`. Wlot gniazda ma promien `size / 2 + 0,05`,
    // wiec z rantu zostawalo u gory JEDNA SETNA MILIMETRA. Policzone, nie
    // zgadniete: 3,06 wobec 3,05 mm przy kamieniu 6 mm.
    //
    // Skutek jest dokladnie taki, jak zglosil wlasciciel: w soliterze gniazdo
    // widac, w kasecie nie. Nie dlatego, ze gniazdo bylo zamkniete (kamien
    // wchodzil, sprawdzian 33 to potwierdza), tylko dlatego, ze WOKOL niego
    // nie bylo zadnej sciany. Kaseta czytala sie jak plaska plyta z dziura,
    // a przy odlewie ostrze o grubosci setnej milimetra i tak by nie wyszlo.
    //
    // Scianka idzie teraz za rozmiarem kamienia, bo kaseta pod kamien 8 mm
    // potrzebuje grubszej sciany niz pod 4 mm, i zbiega tylko do 0,6 swojej
    // grubosci. Po odjeciu wlotu zostaje ponad 0,3 mm litego metalu u gory:
    // tyle, ile jubiler dociska na kamien.
    const wall = Math.max(0.45, size * 0.1);
    // WYSOKOSC RANTU ZALEZY OD STANU ZAKUCIA i to jest zamierzone.
    //
    // Rant przed zakuciem stoi wysoko, bo jubiler potrzebuje metalu, ktory
    // dopiero DOGNIE na kamien. Po zakuciu ten sam metal lezy nisko: obejmuje
    // rondyste i kilka dziesiatych milimetra korony, a reszta korony jest
    // odslonieta i swieci. Poprzednio rant w obu stanach mial pelna wysokosc,
    // wiec kamien po zakuciu siedzial na dnie studni i widac bylo tylko tafle.
    // Zgloszone wprost: "zbyt mocno zakute, zbyt malo swiatla, musi byc widac
    // kamien".
    const h = zakute(p)
      ? stone.girdleH + 0.34
      : stone.girdleH + stone.crownH * 0.35 + 0.35;
    const outer = CrossSection.ofPolygons([ccw(outlineFor(p.stone.cut, size + 2 * wall))]);
    const trzon = h * 0.6 + SEAT.aboveGalleryMm;
    add(Manifold.extrude(outer, trzon).translate([0, 0, -SEAT.aboveGalleryMm]));
    // Rant dociskany na kamien: ta sama scianka, ale zbiegajaca do wewnatrz.
    // Po zakuciu rant zbiega mocniej, bo lezy NA koronie, a nie obok niej:
    // gorna krawedz konczy sie tuz nad obrysem kamienia i to ona go trzyma.
    const zbieg = (size / 2 + wall * (zakute(p) ? -0.05 : 0.6)) / (size / 2 + wall);
    add(Manifold.extrude(outer, h * 0.4, 0, 0, [zbieg, zbieg])
      .translate([0, 0, trzon - SEAT.aboveGalleryMm]));
    return { solid: crown, basketH };
  }

  if (p.setting === "channel") {
    // Dwie szynki po bokach kamienia, bez metalu miedzy kamieniami.
    const halfW = Math.max(...pts.map(([x]) => Math.abs(x))) + 0.45;
    const h = stone.girdleH + stone.crownH * 0.4 + 0.5;
    const depth = Math.max(...pts.map(([, y]) => Math.abs(y))) * 2 + 1.0;
    [-1, 1].forEach((s) => {
      add(Manifold.cube([0.9, depth, h], true)
        .translate([s * halfW, 0, h / 2 - 0.2]));
    });
    return { solid: crown, basketH };
  }

  if (p.setting === "drilled") {
    crown = null;
    // Brioleta wisi, wiec zamiast korony robimy kabłąk nad szyna.
    const r = size * 0.28;
    const ring = Manifold.revolve(
      CrossSection.ofPolygons([ccw([[r, -0.35], [r + 0.7, -0.35], [r + 0.7, 0.35], [r, 0.35]])]), 32,
    );
    return { solid: ring.rotate([90, 0, 0]).translate([0, 0, r * 0.6]), basketH: 0 };
  }

  // NOGA LAPKI: stozek od dna kosza do rondysty, dokladnie pod lapka.
  //
  // Lapka zaczynala sie na wysokosci `aboveGalleryMm`, czyli tuz pod rondysta,
  // i nie mial jej co podpierac: pod nia byla juz zwezona sciana kosza. Przy
  // zakuwaniu jubiler dociska koncowke, a cala sila idzie wtedy w to jedno
  // miejsce. Noga prowadzi ja az na dno kosza, wiec lapka ma na czym stac
  // i przy dociskaniu nie ustepuje.
  //
  // POPRAWKA: pierwsza wersja byla walcem o promieniu 1,35 raza grubszym od
  // lapki i wygladala dokladnie tak, jak zostala zglszona, czyli jak klocek
  // z doklejona lapka. Lapka ma WYRASTAC z dna gniazda jednym ciagiem, a nie
  // stac na cokole: u dolu schodzi lekko do srodka, bo tam jest scianka kosza,
  // i rozszerza sie dopiero przy rondyscie, gdzie musi objac kamien.
  //
  // Grubosc u podstawy schodzi z 1,35 do 1,05 promienia lapki. Tyle wystarczy,
  // zeby przy zakuwaniu nie ustapila, a wiecej robi z korony guzka.
  // POPRAWKA DRUGA, zglszona jako "dolna czesc krap wisi": noga szla w dol
  // po niemal STALYM promieniu, a kosz zweza sie do 0,55 obrysu. Przy kamieniu
  // 5,5 mm dawalo to na dnie kosza ponad milimetr powietrza miedzy noga
  // a sciana: noga wisiala obok kosza i dotykala go dopiero pod rondysta.
  // Noga musi IsC PO SCIANIE kosza, czyli zwezac sie razem z nim, bo tylko
  // wtedy lapka wyrasta z dolu oprawy, a nie jest do niej doklejona u gory.
  const noga = (rObrys, radius, promien) => {
    const rDno = rObrys * 0.55 + scianka;        // sciana kosza na jego dnie
    const rKolnierz = rObrys + scianka;          // sciana kosza pod rondysta
    return tubeAlong(w,
      [
        [rDno + promien * 0.10, 0, -basketH + 0.05],
        [(rDno + rKolnierz) / 2, 0, -(basketH + kolnierz) / 2],
        [rKolnierz + promien * 0.10, 0, -kolnierz],
        [radius, 0, 0.02],
      ],
      [promien * 0.92, promien * 0.88, promien * 0.90, promien * 0.96],
      { czubek: false });
  };

  if (p.setting === "vprong") {
    // Lapka V nie jest lapka obroconą, tylko scianka po obrysie, wiec ma
    // wlasna budowe i nie przechodzi przez powielanie ponizej. Noga jest jej
    // potrzebna tak samo, wiec zaczyna sie na dnie kosza.
    const ccwPts = ccw(pts);
    for (const deg of prongAngles(cut, p.setting)) {
      add(vprongSolid(w, ccwPts, deg, rP,
        -basketH + 0.05, stone.girdleH + stone.crownH * (zakute(p) ? 0.6 : 1.05),
        zakute(p)));
    }
    return { solid: crown, basketH };
  }

  // Lapki o tym samym promieniu roznia sie wylacznie obrotem, a przy szlifie
  // okraglym promien jest jeden dla wszystkich. Budujemy wiec ksztalt raz
  // na promien i powielamy obrotem.
  const wzorce = new Map();
  for (const deg of prongAngles(cut, p.setting)) {
    // Lapka stoi NA ZEWNATRZ rondysty, a nie w jej obrysie. Tak jest
    // w rzeczywistosci i tak musi byc tutaj: gniazdo wycinamy do srednicy
    // rondysty pomniejszonej o podciecie, wiec lapka wpuszczona w ten obrys
    // zostaje przez to gniazdo PRZECIETA. Bryla rozpadala sie wtedy na
    // czternascie czesci: kazda lapka osobno i kosz w kawalkach.
    const rr = radiusAt(pts, deg) + rP * 0.5;
    const klucz = rr.toFixed(4);
    if (!wzorce.has(klucz)) {
      wzorce.set(klucz, zlacz(prongSolid(w, {
        radius: rr, prongR: rP,
        base: -SEAT.aboveGalleryMm,
        girdleTop: stone.girdleH,
        crownH: stone.crownH,
        zamkniete: zakute(p),
      }), noga(radiusAt(pts, deg), rr, rP)));
    }
    add(wzorce.get(klucz).rotate([0, 0, deg]));
  }
  // Wzorce sluzyly wylacznie do powielania i nikt ich juz nie trzyma. Bez tego
  // zostawalyby w pamieci jadra po kazdym przeliczeniu podgladu.
  for (const wzor of wzorce.values()) wzor.delete?.();
  return { solid: crown, basketH };
}

// ------------------------------------------------------------
// Kamienie na szynie
// ------------------------------------------------------------
/**
 * Kamienie boczne osadzone W szynie, nie polozone na niej. Zwracamy osobno
 * metal do dodania (kuleczki, szynki) i bryle do odjecia (gniazda), bo
 * kolejnosc ma znaczenie: gniazdo ciete przed zlaczeniem nie siega szyny
 * i bryla wychodzi o kilkanascie procent ciezsza, czyli tez drozsza.
 */
function buildSideStones(w, p) {
  const { Manifold, CrossSection } = w;
  const { count, size, setting } = p.side;
  if (!count) return { addMetal: null, cutSeats: null, stones: [] };

  // Kamienie boczne ida po obwodzie, wiec ich promien tez musi isc za
  // zwezeniem, inaczej pierwszy zostaje na szynie, a ostatni wisi obok niej.
  const kBok = taperFor(p);
  const gr = (u) => p.thickness * (kBok ? kBok(u).t : 1);
  const ro = p.innerDia / 2 + gr(0);
  const rMid = p.innerDia / 2 + gr(0) * 0.62;

  // ODSUNIECIE OD KORONY liczy sie z jej rzeczywistej szerokosci, nie z kata
  // wzietego z sufitu.
  //
  // Stalo tu `start = 0.34` radiana, czyli okolo trzech milimetrow po obwodzie
  // niezaleznie od tego, co stoi na godzinie dwunastej. Kosz kamienia
  // szesciomilimetrowego siega po obwodzie na 3,5 mm od osi, wiec pierwszy
  // kamien na szynie WCHODZIL w mocowanie korony. Widac to na kazdym renderze
  // solitera z pave i tak wlasnie zostalo zglszone.
  //
  // Korona jest obrocona tak, ze jej lokalna os X biegnie po obwodzie
  // pierscionka, wiec to wlasnie polowa zasiegu obrysu w tej osi wyznacza,
  // gdzie moze zaczac sie szyna. Do tego dochodzi scianka kosza i szczelina,
  // ktora klient ustawia sam.
  const polKorony = p.setting === "drilled"
    ? 0
    : Math.max(...outlineFor(p.stone.cut, p.stone.size).map(([x]) => Math.abs(x)))
      + (p.setting === "bezel" ? 0.4 : 0.3)
      + (p.halo.on ? p.halo.size + 0.4 : 0);
  const luzOdKorony = Number.isFinite(p.side.gap) ? p.side.gap : 0.35;
  const rozsuniecie = Number.isFinite(p.side.spread) ? p.side.spread : 0;

  // Stycznosc kamieni plus rozsuniecie, oba mierzone po obwodzie i dopiero
  // potem zamieniane na kat.
  const step = Math.asin(Math.min(0.45, (size * 0.62) / rMid)) * 2 + rozsuniecie / rMid;
  const start = (polKorony + luzOdKorony + size / 2) / rMid;

  // WYLOT GNIAZDA MUSI ZOSTAWIC PASEK METALU NA WEWNETRZNEJ STRONIE SZYNY.
  //
  // Otwor przelotowy wychodzi na palec i przy kamieniu wpuszczonym w szyne
  // wychodzi tam, gdzie klient go dotyka. Przy stalej szerokosci polowy
  // gniazda otwory sasiednich kamieni spotykaly sie po wewnetrznej stronie
  // i zamiast obraczki zostawal grzebien: zmierzone na wieńcu eternity,
  // trzydziesci cztery procent obwodu bez metalu na powierzchni palca.
  // Klient zglosil to jako obraczke, ktora "bedzie sie niewygodnie nosilo".
  //
  // Wylot liczymy wiec z ODSTEPU miedzy kamieniami po stronie palca: tyle,
  // ile zostaje po odjeciu paska. Kamien w lapkach stoi ponad szyna i jego
  // gniazdo nie ma tego problemu, wiec tam zostaje pelna szerokosc.
  const odstepWewn = step * (p.innerDia / 2);
  const wylotWSzynie = setting === "prong"
    ? SEAT.throughWidth
    : Math.max(0.18, Math.min(SEAT.throughWidth, (odstepWewn - SEAT.minInnerStrip) / size));
  let metal = null, seats = null;
  const stones = [];
  const addM = (m) => { metal = metal ? zlacz(metal, m) : m; };
  const addS = (m) => { seats = seats ? zlacz(seats, m) : m; };

  if (setting === "channel") {
    const span = start + step * (count - 0.2);
    [-1, 1].forEach((side) => {
      [-1, 1].forEach((off) => {
        const rail = Manifold.revolve(
          CrossSection.ofPolygons([ccw([
            [rMid - size * 0.1, off * (size * 0.62) - 0.22],
            [ro + 0.15, off * (size * 0.62) - 0.22],
            [ro + 0.15, off * (size * 0.62) + 0.22],
            [rMid - size * 0.1, off * (size * 0.62) + 0.22],
          ])]), 64, (span * 180) / Math.PI,
        ).rotate([0, 0, 90 - (side > 0 ? 0 : (span * 180) / Math.PI)]);
        addM(rail);
      });
    });
  }

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < count; i++) {
      // Kazdy kamien lezy pod innym katem od glowicy, wiec przy zwezonej
      // szynie kazdy siedzi na innym promieniu. Jeden wspolny promien
      // zostawialby ostatni kamien wiszacy obok metalu.
      const odchyl = start + step * i;
      const a = Math.PI / 2 + side * odchyl;
      const roI = p.innerDia / 2 + gr(odchyl / Math.PI);
      const rMidI = p.innerDia / 2 + gr(odchyl / Math.PI) * 0.62;
      const x = Math.cos(a) * rMidI, y = Math.sin(a) * rMidI;
      const tilt = [0, 0, 0];

      // PODNIESIENIE kamienia ponad szyne.
      //
      // Kamien w lapkach stoi we WLASNEJ oprawce, a nie w wybraniu szyny,
      // i wlasnie dlatego moze byc od niej szerszy. Trylogia z kamieniami
      // czteromilimetrowymi na szynie 2,2 mm nie jest bledem klienta, tylko
      // opisem takiej wlasnie konstrukcji: dwie male koronki obok glowicy.
      // Dopoki wpuszczalismy kazdy kamien w szyne, taki uklad byl niemozliwy
      // i wymiar spadal po cichu do 1,3 mm, czyli do rozmiaru okruszka.
      //
      // Pave i oprawa kanalowa siedza w metalu szyny i tam ograniczenie
      // szerokosci obowiazuje dalej, bo tam kamien naprawde wycina sie w szyne.
      const podniesienie = setting === "prong" ? Math.max(0.5, size * 0.3) : 0;

      // KAMIEN W SZYNIE MUSI BYC ZANURZONY, inaczej gniazda nie ma.
      //
      // Rondysta siedziala DOKLADNIE na powierzchni szyny, czyli zanurzenie
      // wynosilo zero. Wlot gniazda zaczyna sie na wysokosci rondysty i idzie
      // w gore, wiec caly lezal ponad metalem, a w szynie zostawal sam otwor
      // lozowy, wezszy od kamienia o podciecie. Kamien nie mial jak zjechac
      // do gniazda: siadal na krawedzi otworu i stal na wierzchu.
      //
      // To ta sama wada, ktora poprawilismy juz w wiencu halo (tam zanurzenie
      // wynosilo 0,06 mm) i ktorej kamienie po obwodzie nigdy nie mialy, bo
      // tam zanurzenie bylo od poczatku. Zostala w JEDNYM miejscu, przy
      // kamieniach na ramionach, i tak tez zostala zgloszona: "gniazda na
      // szynie nie poprawione".
      //
      // Lapka podnosi kamien ponad szyne i tam zanurzenie nie ma sensu: kamien
      // stoi we wlasnej oprawie, a nie w metalu szyny.
      const zanurzenie = podniesienie > 0 ? 0 : Math.max(0.10, size * 0.11);
      const rKam = roI + podniesienie - zanurzenie;

      // OBROT MUSI BYC TAKI SAM JAK PRZY KORONIE SRODKOWEJ. `rotate([90,0,0])`
      // odwraca kamien: tafla patrzy wtedy w glab palca, a koleta na zewnatrz.
      // Na renderze wyglada to prawie tak samo, ale gniazdo wycina sie odwrotnie,
      // wiec zmienia sie objetosc metalu, a z niej cena.
      const naMiejsce = (m) => m
        .rotate([-90, 0, 0])                        // tafla na zewnatrz promienia
        .rotate([0, 0, (a / DEG) - 90])
        .translate([Math.cos(a) * rKam, Math.sin(a) * rKam, 0]);

      // SZLIF KAMIENI BOCZNYCH jest wyborem klienta, tak samo jak przy
      // kamieniu centralnym. Kamien i jego gniazdo musza brac ten sam szlif,
      // bo gniazdo w innym obrysie albo kamienia nie utrzyma, albo wytnie
      // dziure wieksza od niego.
      const szlifBoku = CUTS[p.side.cut] ? p.side.cut : "round";
      const kam = stoneSolid(w, szlifBoku, size);
      stones.push(naMiejsce(kam.solid));
      addS(naMiejsce(seatCutter(w, szlifBoku, size, zakute(p), wylotWSzynie)));

      if (podniesienie > 0) {
        // Oprawka: stozek od szyny do rondysty i cztery lapki dookola.
        // Budujemy ja w ukladzie kamienia, czyli z rondysta na wysokosci zera,
        // i przenosimy tym samym obrotem, wiec nie da sie jej postawic krzywo.
        const rG = size / 2;
        const gleboko = podniesienie + 0.45;        // wchodzi w szyne, nie stoi na niej
        // KOSZYK, A NIE LITY STOZEK.
        //
        // Byl tu pelny scinany stozek. Gniazdo wycinalo w nim kieszen i kamien
        // rzeczywiscie wchodzil, wiec kazdy pomiar to przepuszczal, a wyrob
        // czytal sie jak zamkniety kubek z lapkami. Wlasciciel zglosil to
        // czterokrotnie jako "nie pokazuje sie gniazdo w kamieniach bocznych",
        // i mial racje: gniazdo, przez ktore nie przechodzi swiatlo, nie
        // wyglada na gniazdo. Kamien centralny mial okna od poczatku i wlasnie
        // dlatego wygladal dobrze przy tych samych ustawieniach.
        //
        // Okna tna NA WYLOT, wiec nie moga zamknac pustki w srodku. Pusty
        // stozek z otworem tylko u gory bylby cicha awaria: objetosc, masa
        // i `genus` w porzadku, a w bryle zapieczetowany pecherz.
        //
        // Rant tez byl za cienki: 0,18 mm ponad rondyste przy wlocie gniazda
        // szerszym o 0,05 mm zostawialo 0,13 mm sciany. Ten sam blad co
        // w kasecie, w trzecim juz miejscu. Teraz zostaje 0,27 mm.
        // OPRAWKA IDZIE ZA OBRYSEM KAMIENIA, nie za okregiem.
        //
        // Kosz byl walcem niezaleznie od szlifu, wiec markiza czy gruszka
        // na boku siedziala w okraglej tulei: gniazdo mialo wlasciwy ksztalt,
        // ale cala oprawka zostawala "na bazie okregu". Zgloszone wprost.
        // Robimy to samo, co przy koronie centralnej: obrys kamienia,
        // przeskalowany do dna i rozszerzony na rant.
        const ptsBoku = outlineFor(szlifBoku, size);
        const skalaRantu = (size + 0.64) / size;
        const csDno = CrossSection.ofPolygons([ccw(scalePts(ptsBoku, 0.55))]);
        const kosz = Manifold.extrude(csDno, gleboko, 0, 0,
          [skalaRantu / 0.55, skalaRantu / 0.55]).translate([0, 0, -gleboko]);
        csDno.delete?.();
        let oprawka = kosz;
        const rL = Math.min(0.42, Math.max(0.24, size * 0.11));
        for (const deg of [45, 135, 225, 315]) {
          oprawka = zlacz(oprawka, prongSolid(w, {
            radius: radiusAt(ptsBoku, deg) + rL * 0.5, prongR: rL,
            base: -gleboko + 0.1, girdleTop: kam.girdleH, crownH: kam.crownH,
            zamkniete: zakute(p),
          }).rotate([0, 0, deg]));
        }
        // Okna miedzy lapkami. Lapki stoja po przekatnych (45, 135, 225, 315),
        // wiec noze ida wzdluz osi 0 i 90 i zadnej z nich nie ruszaja.
        // Wysokosc okna zostawia pelny pierscien pod rondysta, bo to on trzyma
        // kamien, i pelna stopke, bo ta wchodzi w szyne.
        const winH = Math.max(0.4, gleboko * 0.45);
        const winT = Math.max(0.5, rG * 0.62);
        for (const kat of [0, 90]) {
          oprawka = odejmij(oprawka, Manifold.cube([rG * 6, winT, winH], true)
            .rotate([0, 0, kat])
            .translate([0, 0, -gleboko + winH / 2 + gleboko * 0.16]));
        }
        addM(naMiejsce(oprawka));
      }

      // Kuleczki i lapki musza WCHODZIC w szyne, a nie stac na niej. Walec
      // postawiony na wypuklej powierzchni styka sie z nia wzdluz linii, wiec
      // suma daje bryle rozsypana na kawalki, co `genus` natychmiast pokazuje.
      // Promien bierzemy z PROFILU na tej wysokosci, nie z `ro`. Kuleczka
      // ma wejsc w metal, a nie stanac obok niego.
      // Przy szynie zwezonej promien profilu trzeba PRZELICZYC: obrys jest
      // rozciagniety w szerokosc razy `w` i odsuniety od srodka razy `t`,
      // wiec wysokosc wzdluz osi wraca do ukladu obrysu przez podzielenie.
      // Bez tego kuleczki na zwezonej szynie stoja obok metalu.
      const kk = kBok ? kBok(odchyl / Math.PI) : { w: 1, t: 1 };
      const ri0 = p.innerDia / 2;
      const SINK = 0.22;
      const at = (tang, axial) => {
        const rad = ri0 + (shankRadiusAt(p, axial / kk.w) - ri0) * kk.t - SINK;
        return [
          Math.cos(a) * rad - Math.sin(a) * tang,
          Math.sin(a) * rad + Math.cos(a) * tang,
          axial,
        ];
      };

      // Kuleczki i lapki siadaja NA KRAWEDZI RONDYSTY, po przekatnych.
      //
      // Byly ustawione na `size * 0.58` od srodka kamienia W KAZDEJ OSI, czyli
      // po przekatnej na odleglosci 0,82 srednicy: pol milimetra ZA kamieniem,
      // bez kontaktu z nim. Trzymaly wiec powietrze. Sprawdzian jest prosty:
      // odleglosc od osi kamienia musi wynosic tyle co promien rondysty,
      // a nie tyle co polowa boku kwadratu opisanego na kamieniu.
      const rG = size / 2;
      const kula = Math.min(0.34, Math.max(0.2, size * 0.2));
      // Odrobine POZA rondysta, bo wlot gniazda scina wszystko, co wchodzi
      // w obrys kamienia, i kuleczka postawiona na nim zniknelaby po polowie.
      const rB = (rG + kula * 0.32) * Math.SQRT1_2;

      if (setting === "pave") {
        // Kuleczka pave musi STERCZEC W GORE, czyli wzdluz promienia
        // pierscionka, a nie kłaść sie na boki. Zakucia lezacego plasko nie da
        // sie docisnac: narzedzie nie ma jak podejsc, a metal nie ma dokad
        // plynac. Sama kula, bez wysokosci, tez sie do tego nie nadaje, bo nie
        // ma czego przesunac nad kamien. Wysokosc liczymy od powierzchni szyny,
        // w ktorej zakucie siedzi zanurzone o `SINK`.
        const wysokosc = size * 0.55;
        for (const [dt, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const stopa = at(dt * rB, dz * rB);
          const rGora = kula * 0.7;
          const os = [Math.cos(a), Math.sin(a), 0];
          const szczyt = [
            stopa[0] + os[0] * (wysokosc + SINK),
            stopa[1] + os[1] * (wysokosc + SINK),
            stopa[2],
          ];
          addM(zlacz(
            Manifold.cylinder(wysokosc + SINK, kula, rGora, 20, false)
              .rotate([0, 90, a / DEG])
              .translate(stopa),
            Manifold.sphere(rGora, 16).translate(szczyt),
          ));
        }
      }
      void tilt;
    }
  }
  return { addMetal: metal, cutSeats: seats, stones };
}

/**
 * Bryla zlozona z warstw o zadanej skali, czyli przeciagniecie obrysu wzdluz
 * SYLWETKI.
 *
 * `poziomy` to lista [z, sx, sy]. Kazda para sasiednich poziomow daje jeden
 * scinany stozek, bo `extrude` ze skala gory interpoluje liniowo, wiec sciana
 * boczna jest plaska, a nie schodkowa. Zageszczenie listy wygladza sylwetke
 * bez zmiany sposobu budowy.
 *
 * Skala jest osobna dla obu osi, bo dol glowicy sygnetu ma szerokosc SZYNY,
 * a nie tarczy: jednakowa skala robi z ramion stozek, ktory od strony palca
 * wystaje poza szyne.
 */
function loftLevels(w, cs, poziomy) {
  const { Manifold } = w;
  let bryla = null;
  for (let i = 0; i < poziomy.length - 1; i++) {
    const [z0, sx0, sy0] = poziomy[i];
    const [z1, sx1, sy1] = poziomy[i + 1];
    const h = z1 - z0;
    if (h <= 1e-4 || sx0 <= 1e-4 || sy0 <= 1e-4) continue;
    const plaster = Manifold.extrude(cs, h, 0, 0, [sx1 / sx0, sy1 / sy0])
      .scale([sx0, sy0, 1])
      .translate([0, 0, z0]);
    bryla = bryla ? zlacz(bryla, plaster) : plaster;
  }
  return bryla;
}

// ------------------------------------------------------------
// Sygnet
// ------------------------------------------------------------
/**
 * Glowica sygnetu.
 *
 * Sylwetka jest tu cala rzecza, bo tarcza to plaski owal, ktory kazdy zrobi
 * tak samo. Sygnet ze zdjecia katalogowego czyta sie po tym, co dzieje sie
 * MIEDZY szyna a tarcza: waskie ramie wychodzi z szyny, rozlewa sie ku gorze
 * lukiem WKLESLYM i dopiero pod tarcza przechodzi w pionowa scianke. Tarcza
 * WYSTAJE poza to rozlanie, wiec pod jej krawedzia jest cien i to on daje
 * wrazenie plyty polozonej na pierscionku, a nie wycietej razem z nim.
 *
 * Poprzednia wersja szla ze stalym zbieznym stozkiem od 0,76 do 1,0, czyli
 * linia prosta bez zadnego wystepu. Bryla byla poprawna i wazyla tyle co
 * trzeba, tylko wygladala jak klin, bo w calej sylwetce nie bylo ani jednego
 * miejsca, w ktorym cos by sie zmienialo.
 */
/**
 * Wymiary glowicy sygnetu, liczone raz.
 *
 * Korzysta z nich i bryla, i uklad wlewowy. Kanal musi wiedziec, GDZIE lezy
 * tarcza, bo inaczej wchodzi w nia na oslep, i wlasnie tak bylo: kanal szedl
 * promieniowo od srodka pierscionka, czyli prosto przez plyte, i wychodzil
 * po jej drugiej stronie, przez powierzchnie pod grawer.
 */
function signetMetrics(p) {
  const { W, L } = tableSize(p.signet);
  const T = Math.max(1.4, Math.min(2.4, L * 0.26));
  const faza = Math.min(0.42, T * 0.3);
  const scianka = T - faza;
  const zanurzenie = Math.min(1.5, p.thickness * 0.85);
  const rozlanie = zanurzenie + Math.max(1.3, Math.min(2.4, L * 0.24));
  return { W, L, T, faza, scianka, zanurzenie, rozlanie, gora: rozlanie + scianka + faza };
}

/** Czy obrys jest WYPUKLY. Otoczka wypuklosciowa wypelnia wciecia, wiec przy
 *  tarczy w ksztalcie serca nie wolno jej uzyc. */
function wypukly(pts) {
  let znak = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + 2) % n];
    const v = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(v) < 1e-9) continue;
    const s = Math.sign(v);
    if (znak && s !== znak) return false;
    znak = s;
  }
  return true;
}

/**
 * Przeciagniecie miedzy OBRYSAMI, a nie miedzy skalami jednego obrysu.
 *
 * `extrude` umie tylko skalowac i skrecac, wiec nie przejdzie z prostokata
 * w owal. Kazdy plaster budujemy wiec jako otoczke wypuklosciowa dwoch
 * cienkich przekrojow: dla ksztaltow wypuklych jest to DOKLADNIE liniowe
 * przeciagniecie, bez zadnego przyblizenia.
 *
 * @returns {object|null} null, gdy ktorykolwiek obrys jest wklesly
 */
function loftObrysow(w, obrysy, zetki) {
  const { Manifold, CrossSection } = w;
  if (!obrysy.every(wypukly)) return null;
  const plaster = (pts, z) => {
    const cs = CrossSection.ofPolygons([ccw(pts)]);
    const m = Manifold.extrude(cs, 0.02).translate([0, 0, z]);
    cs.delete?.();
    return m;
  };
  let bryla = null, dol = plaster(obrysy[0], zetki[0]);
  for (let i = 1; i < obrysy.length; i++) {
    const gora = plaster(obrysy[i], zetki[i]);
    const kawalek = Manifold.hull([dol, gora]);
    bryla = bryla ? zlacz(bryla, kawalek) : kawalek;
    dol.delete?.();
    dol = gora;
  }
  dol.delete?.();
  return bryla;
}

/**
 * Bryla WYPUKLA rozpieta na kilku obrysach: jedna otoczka, nie lancuch.
 *
 * `loftObrysow` sklada plaster po plastrze i na kazdym zlaczu zostaje po nim
 * pierscionek grubosci przekroju pomocniczego. Przy sygnecie to nie szkodzi,
 * bo jego sylwetka i tak nie jest wypukla. Kamien wypukly JEST, wiec cala
 * bryla to jedna otoczka wszystkich poziomow naraz: fasetki wychodza dokladne,
 * a miedzy nimi nie ma zadnych progow.
 */
function hullPoziomow(w, obrysy, zetki) {
  const { Manifold, CrossSection } = w;
  const plastry = obrysy.map((pts, i) => {
    const cs = CrossSection.ofPolygons([ccw(pts)]);
    const m = Manifold.extrude(cs, 0.004).translate([0, 0, zetki[i]]);
    cs.delete?.();
    return m;
  });
  const bryla = Manifold.hull(plastry);
  for (const m of plastry) m.delete?.();
  return bryla;
}

function buildSignetHead(w, p) {
  const { CrossSection } = w;
  const { W, L, faza, scianka, zanurzenie, rozlanie } = signetMetrics(p);
  const pts = signetOutline(p.signet, 64);
  const cs = CrossSection.ofPolygons([ccw(pts)]);
  const min = Math.min(W, L);

  // Dol rozlania ma miec przekroj SZYNY, nie tarczy. Wzdluz palca (os L) jest
  // to polowa szerokosci szyny w miejscu glowicy, po obwodzie (os W) troche
  // wiecej, bo tam ramiona i tak schodza w szyne stycznie.
  const kw = taperFor(p)?.(0)?.w ?? 1;
  const syDol = Math.max(0.34, Math.min(0.9, (p.width * kw) / 2 / L));
  const sxDol = Math.max(0.42, Math.min(0.92, syDol * 1.3));

  // Luk WKLESLY: wykladnik powyzej jedynki trzyma ramie waskie nisko i rozlewa
  // je dopiero pod tarcza. Wykladnik ponizej jedynki dalby ksztalt trabki
  // odwroconej, czyli szeroko od razu przy szynie.
  //
  // Luk jest WYPUKLY i dochodzi do pelnej szerokosci tarczy, bez podciecia.
  //
  // Bylo tu odwrotnie: luk wklesly, konczacy sie ponizej szerokosci tarczy,
  // i krotkie podciecie, dzieki ktoremu plyta wystawala poza ramiona i rzucala
  // cien. To jest sylwetka PIERSCIONKA Z KORONA, czyli glowicy postawionej na
  // szynie, a sygnet jest czyms innym: metal wzbiera z szyny i staje sie
  // tarcza, jednym ciaglym ruchem, bez uskoku i bez cienia pod krawedzia.
  // Na zdjeciach katalogowych ramie wychodzi z obraczki i puchnie ku gorze,
  // a jedyna wyrazna krawedzia w calej bryle jest kant tarczy.
  //
  // Wykladnik ponizej jedynki daje wlasnie to: szybkie rozlanie tuz nad szyna
  // i lagodne dojscie do plyty. Powyzej jedynki metal trzyma sie waski nisko
  // i dopiero pod tarcza wyskakuje na boki, czyli robi szyjke.
  // ROZLANIE MORFUJE KSZTALT, a nie tylko go skaluje.
  //
  // Poprzednia wersja skalowala TEN SAM obrys tarczy od dolu do gory, wiec
  // ramiona sygnetu owalnego byly owalne od samej szyny: pekaty klosz, na
  // ktorym stoi plyta. Zglszone wprost: korona ma powstawac z rozszerzenia
  // szyny "bardziej kwadratowo niz oblo".
  //
  // Na dole jest wiec PRZEKROJ SZYNY, czyli prostokat o zaokraglonych
  // narozach, i dopiero ku gorze przechodzi on w obrys tarczy. Posrednie
  // poziomy sa mieszanka obu, czyli ksztaltami kanciastymi, a nie eliptycznymi.
  // Wzniesienie jest przy tym LINIOWE: luk wypukly robil brzuch, a prosta linia
  // daje ramie, ktore czyta sie jak wyrastajace z obraczki.
  const kw2 = taperFor(p)?.(0)?.w ?? 1;
  const Ldol = Math.max(0.6, (p.width * kw2) / 2);
  const Wdol = Math.min(W * 0.95, Ldol * 1.35);

  // Dol budujemy PUNKT W PUNKT pod obrysem tarczy, czyli po tym samym kacie.
  //
  // Pierwsza wersja brala gotowy prostokat o zaokraglonych narozach i mieszala
  // go z tarcza po indeksach. Obie listy zaczynaja sie jednak w innym miejscu
  // obwodu, wiec ramie SKRECALO sie w gore o jakies czterdziesci piec stopni,
  // a przekroj posredni wychodzil z tego rozmazany i znowu okragly. Mierzone:
  // 78 procent wypelnienia, czyli tyle co elipsa.
  //
  // Superelipsa daje ten sam kanciasty ksztalt, ale jest z definicji opisana
  // katem, wiec nie ma czego przesuwac.
  const KANT = 8;
  const dolPts = pts.map(([x, y]) => {
    const t = Math.atan2(y, x);
    const c = Math.cos(t), sn = Math.sin(t);
    const k = (Math.abs(c) ** KANT + Math.abs(sn) ** KANT) ** (-1 / KANT);
    return [Wdol * k * c, Ldol * k * sn];
  });

  // KSZTALT i ROZMIAR morfuja OSOBNO, i to jest sedno tego miejsca.
  //
  // Jedna mieszanka robila obie rzeczy naraz: przy wykladniku 1 ramie
  // zaokraglalo sie od razu nad szyna, a przy wyzszym zostawalo kanciaste,
  // ale i CIENKIE, czyli wracala szyjka, ktora juz raz odrzucilismy. Rozmiar
  // rosnie wiec liniowo, a ksztalt przechodzi w tarcze dopiero pod nia.
  const mieszaj = (u) => {
    const k = u ** 2.6;                       // ksztalt zostaje kanciasty dluzej
    const surowe = pts.map(([x, y], i) => [
      dolPts[i][0] + (x - dolPts[i][0]) * k,
      dolPts[i][1] + (y - dolPts[i][1]) * k,
    ]);
    // Przeskalowanie do rozmiaru z LINIOWEJ interpolacji: ramie puchnie rowno,
    // niezaleznie od tego, jak szybko zmienia sie jego przekroj.
    const maxX = Math.max(...surowe.map(([x]) => Math.abs(x))) || 1;
    const maxY = Math.max(...surowe.map(([, y]) => Math.abs(y))) || 1;
    const celX = Wdol + (W - Wdol) * u, celY = Ldol + (L - Ldol) * u;
    return surowe.map(([x, y]) => [(x / maxX) * celX, (y / maxY) * celY]);
  };

  const KROKI = 8;
  const obrysy = [], zetki = [];
  for (let i = 0; i <= KROKI; i++) {
    const u = i / KROKI;
    obrysy.push(mieszaj(u));
    zetki.push(u * rozlanie);
  }
  // Pionowa scianka plyty, potem faza. Faza schodzi o `faza` mm na kazda
  // strone, wiec liczy sie ja osobno dla obu osi.
  obrysy.push(pts); zetki.push(rozlanie + scianka);
  obrysy.push(pts.map(([x, y]) => [x * (1 - faza / W), y * (1 - faza / L)]));
  zetki.push(rozlanie + scianka + faza);

  let glowica = loftObrysow(w, obrysy, zetki);
  if (!glowica) {
    // Tarcza WKLESLA, czyli serce: otoczka wypuklosciowa wypelnilaby wciecie,
    // wiec dla niej zostaje stara droga, samo skalowanie obrysu.
    const poziomy = [];
    for (let i = 0; i <= KROKI; i++) {
      const u = i / KROKI;
      poziomy.push([u * rozlanie, sxDol + (1 - sxDol) * u, syDol + (1 - syDol) * u]);
    }
    poziomy.push([rozlanie + scianka, 1, 1]);
    poziomy.push([rozlanie + scianka + faza, 1 - faza / W, 1 - faza / L]);
    glowica = loftLevels(w, cs, poziomy);
  }
  const gora = rozlanie + scianka + faza;

  if (p.signet.face === "recessed") {
    // Pole wpuszczone: rant dookola, w srodku plaskie dno pod grawer. Rant
    // musi zostac na tyle szeroki, zeby dalo sie go wypolerowac, a dno na tyle
    // plytkie, zeby plyta nie zrobila sie wanienka.
    const rant = Math.max(0.7, Math.min(1.3, min * 0.2));
    const glebokosc = Math.min(0.5, scianka * 0.4);
    const wnetrze = wciety(w, cs, W, L, rant);
    if (wnetrze) {
      const pole = loftLevels(w, wnetrze, [
        [gora - glebokosc, 1, 1],
        [gora + 0.2, 1 + 0.1 / W, 1 + 0.1 / L],
      ]);
      if (pole) glowica = odejmij(glowica, pole);
    }
  } else if (p.signet.face === "domed") {
    // Czasza kulista o wysokosci `h` nad tarcza: promien liczymy z cieciwy,
    // zeby przejscie w krawedz plyty bylo styczne, a nie zalamane.
    const h = Math.min(0.9, min * 0.16);
    const a = 1;                                  // promien podstawy w skali obrysu
    const R = (a * a + h * h) / (2 * h);
    const kopula = [];
    for (let i = 0; i <= 6; i++) {
      const z = (i / 6) * h;
      const s = Math.sqrt(Math.max(0, R * R - (z - (h - R)) ** 2)) / a;
      kopula.push([gora - 0.05 + z, s * (1 - faza / W), s * (1 - faza / L)]);
    }
    const czasza = loftLevels(w, cs, kopula);
    if (czasza) glowica = zlacz(glowica, czasza);
  }

  return glowica.translate([0, 0, -zanurzenie]);
}

/**
 * Obrys wciety o `d` mm do srodka, do pola wpuszczonego w tarczy.
 *
 * Idziemy prawdziwym odsunieciem, a nie przeskalowaniem: przy tarczy
 * poprzecznej, dlugiej i waskiej, skalowanie zostawia rant kilka razy szerszy
 * na koncach niz na bokach i wyglada to jak blad, bo nim jest.
 */
function wciety(w, cs, W, L, d) {
  try {
    const o = cs.offset(-d, "Round", 2, 16);
    if (o && !o.isEmpty() && o.area() > 0.5) return o;
    o?.delete?.();
  } catch { /* jadro bez offsetu: schodzimy do skalowania */ }
  const sx = (W - d) / W, sy = (L - d) / L;
  if (sx <= 0.2 || sy <= 0.2) return null;
  return cs.scale([sx, sy]);
}

// ------------------------------------------------------------
// Zlozenie
// ------------------------------------------------------------



/**
 * Galeria, czyli luk laczacy kosz z ramionami.
 *
 * Kosz stoi na szynie i dotyka jej tylko w linii srodkowej, bo szyna jest
 * okragla, a kosz plaski od spodu. Na zdjeciach katalogowych w tym miejscu
 * jest lagodny luk schodzacy z glowicy na ramiona i to on odpowiada za
 * sylwetke, ktora czyta sie jako "katedralna".
 *
 * To nie jest wylacznie wyglad. Styk punktowy jest najslabszym miejscem
 * odlewu: glowica odlamuje sie wlasnie tam, przy pierwszym mocniejszym
 * uderzeniu, bo caly moment przechodzi przez kilka dziesiatych milimetra
 * metalu.
 *
 * Byl to CIAG KUL i wlasnie to zglosil klient: "górna szyna doprowadzająca do
 * korony jest karbowana". Kule zachodzily na siebie, ale odstep miedzy nimi
 * dorownywal ich promieniowi, a promien do tego malal wzdluz luku, wiec kazda
 * wystawala spod sasiedniej. Na renderze wychodzil z tego sznur paciorkow
 * w miejscu, ktore ma byc jedna gladka linia wychodzaca z szyny.
 *
 * Teraz jest to rura poprowadzona po luku: odcinki stozkowe miedzy punktami
 * i kule TYLKO w zalamaniach, o promieniu rownym rurze w tym miejscu, wiec
 * powierzchnia nie ma ani uskoku, ani wybrzuszenia. Ta sama sztuczka, ktora
 * wyprostowala lapki i kanaly wewnetrzne.
 */
export function buildGallery(w, p, basketH) {
  const ri = p.innerDia / 2;
  const kG = taperFor(p);
  const N = 13;
  const rozpietosc = 34 * DEG;                 // jak daleko luk schodzi po obwodzie
  const wznios = Math.max(0.3, basketH * 0.5);

  let solid = null;
  for (const s of [-1, 1]) {
    const punkty = [], promienie = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const th = Math.PI / 2 + s * t * rozpietosc;
      const u = (t * rozpietosc) / Math.PI;
      const k = kG ? kG(u) : { w: 1, t: 1 };

      // Powierzchnia szyny w tym miejscu, i wzniesienie ku glowicy.
      const rSzyna = ri + (shankRadiusAt(p, 0) - ri) * k.t;
      const podniesienie = wznios * (1 - t) ** 1.6;
      // Os rury ma byc ZANURZONA w szynie, a nie lezec na niej.
      //
      // Podejrzewalem tu kiedys plaskie denko wystajace z szyny i "poprawilem"
      // je glebszym zanurzeniem. Pomiar pokazal, ze zarzut byl bezpodstawny:
      // wystawanie luku spada gladko do zera na trzydziestu dwoch stopniach
      // od glowicy, wiec zadnego denka na wierzchu nie ma. Poprawka zabrala
      // za to luku dziesiec procent metalu. Zostaje wiec tak, jak bylo.
      const r = rSzyna - 0.5 + podniesienie;
      // Rura chudnie ku dolowi, zeby luk wtopil sie w szyne, a nie usiadl
      // na niej jako osobny walek.
      punkty.push([Math.cos(th) * r, Math.sin(th) * r, 0]);
      promienie.push(Math.max(0.22, (p.width * k.w) / 2 * (1.0 - 0.30 * t)));
    }
    const ramie = tubeAlong(w, punkty, promienie, { czubek: false });
    solid = solid ? zlacz(solid, ramie) : ramie;
  }
  return solid;
}

/**
 * Kamienie po OBWODZIE szyny, czyli eternity i half eternity.
 *
 * Rozne od kamieni bocznych tym, ze nie odnosza sie do glowicy: nie ma tu
 * zadnej glowicy. Kamienie ida rownomiernie po calym obwodzie albo po jego
 * gornej polowie, a ich liczbe wyznacza obwod podzielony przez srednice.
 *
 * Eternity ma wade, ktora trzeba znac przed zakupem, i mowimy o niej wprost
 * w opisie presetu: pierscionka z kamieniami dookola NIE DA SIE rozciagnac
 * ani zwezic, bo nie ma gladkiego odcinka, w ktory jubiler moglby wejsc.
 * Half eternity tej wady nie ma.
 */
function buildBandStones(w, p) {
  const { Manifold } = w;
  if (p.band.coverage === "none") {
    return { addMetal: null, cutSeats: null, stones: [], stoneVolume: 0 };
  }

  const d = p.band.size;
  const kB = taperFor(p);
  const ri = p.innerDia / 2;
  const promien = (u) => ri + p.thickness * (kB ? kB(u).t : 1);

  // Kamienie siadaja na promieniu szyny, a rozstaw liczymy po srodkowej.
  const rMid = promien(0.5) * 0.985;
  const krok = Math.asin(Math.min(0.5, (d * 0.56) / rMid)) * 2;
  const pelny = p.band.coverage === "full";
  const n = Math.max(3, Math.floor((pelny ? Math.PI * 2 : Math.PI) / krok));

  // Ten sam rachunek co przy kamieniach na ramionach: otwory przelotowe
  // sasiednich gniazd nie moga sie spotkac po stronie palca, bo z obraczki
  // robi sie wtedy grzebien. Odstep liczymy po WEWNETRZNYM promieniu, bo tam
  // kamienie sa najgesciej.
  const odstepWewn = ((pelny ? Math.PI * 2 : Math.PI) / n) * ri;
  const wylotObwod = Math.max(0.18,
    Math.min(SEAT.throughWidth, (odstepWewn - SEAT.minInnerStrip) / d));

  let metal = null, seats = null;
  const stones = [];
  const addM = (m) => { metal = metal ? zlacz(metal, m) : m; };

  for (let i = 0; i < n; i++) {
    // Pelny obwod liczymy od godziny dwunastej w obie strony, polowe tylko
    // po gorze, zeby dol szyny zostal gladki i dal sie chwycic przy zmianie
    // rozmiaru.
    const a = pelny
      ? Math.PI / 2 + (i / n) * Math.PI * 2
      : Math.PI / 2 - Math.PI / 2 + ((i + 0.5) / n) * Math.PI;
    const odchyl = Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    const u = odchyl / Math.PI;             // 0 przy glowicy, jak wszedzie indziej
    // Kamien siada NIECO PONIZEJ powierzchni szyny. Postawiony dokladnie na
    // niej wystaje poza obrys obraczki i zaczepia o wszystko, a przy okazji
    // wyglada jak doklejony.
    const ro2 = promien(u) - Math.min(0.22, d * 0.12);
    const x = Math.cos(a) * ro2, y = Math.sin(a) * ro2;

    const maly = stoneSolid(w, "round", d);
    stones.push(maly.solid.rotate([-90, 0, 0]).rotate([0, 0, (a / DEG) - 90]).translate([x, y, 0]));

    const cut = seatCutter(w, "round", d, zakute(p), wylotObwod)
      .rotate([-90, 0, 0]).rotate([0, 0, (a / DEG) - 90])
      .translate([x, y, 0]);
    seats = seats ? zlacz(seats, cut) : cut;

    if (p.band.setting === "pave") {
      // KRAPY STOJA MIEDZY KAMIENIAMI, nie obok kamienia.
      //
      // Bylo tak: dwie gladkie kule o promieniu 0,28 mm, na tym samym kacie co
      // kamien, odsuniete od srodkowej o `d * 0,56`. Zadna z tych trzech rzeczy
      // nie byla dobra.
      //
      // Po pierwsze STALY PRZY JEDNYM KAMIENIU, wiec na kazdy otwor przypadaly
      // dwie krapy zamiast czterech i kamien byl trzymany z dwoch stron, a nie
      // z czterech. Krapa postawiona MIEDZY sasiednimi kamieniami trzyma oba,
      // wiec ta sama liczba metalu daje kazdemu kamieniowi cztery punkty.
      //
      // Po drugie `d * 0,56` to promien wlotu gniazda co do setnych: wlot ma
      // `d / 2 + 0,05`. Kula stala wiec dokladnie na krawedzi otworu i wyciecie
      // gniazda zjadalo ja niemal w calosci.
      //
      // Po trzecie KULA NIE JEST KRAPA. Zeby jubiler mial czym zakuc, musi miec
      // slupek WYSTAJACY ponad lico szyny: taki, ktory da sie rozdzielic
      // rylcem na dwa i przelozyc nad rondyste. Kulka wtopiona w metal nie daje
      // sie ani rozdzielic, ani przesunac. Wlasciciel zglosil to wprost.
      //
      // Odsuniecie od srodkowej LICZYMY. Chcemy, zeby krapa stala tuz za
      // rondysta obu sasiadow: w odleglosci `d / 2 + 0,32 * kula` od osi
      // kazdego z nich, tak samo jak przy pave na ramionach. Polowa odstepu
      // wzdluz obwodu jest dana, wiec zostaje twierdzenie Pitagorasa. Przy
      // kamieniach gesto upakowanych sam odstep obwodowy juz wystarcza i wynik
      // schodzi do zera, czyli krapa ladowalaby na srodkowej: podnosimy ja
      // wtedy do `kula * 1,15`, zeby dwie krapy z jednej przerwy byly osobne.
      const kula = Math.min(0.4, Math.max(0.26, d * 0.28));
      const wysokosc = Math.max(0.34, d * 0.42);
      const SINK_B = 0.2;
      const krokKata = (pelny ? Math.PI * 2 : Math.PI) / n;
      // Pelny obwod: jedna przerwa za kazdym kamieniem, wiec przerw jest tyle
      // co kamieni i kazda krapa ma po sasiedzie z obu stron. Polowa obwodu ma
      // o jedna przerwe wiecej, bo przed pierwszym kamieniem tez trzeba stanac.
      for (const g of (pelny || i > 0 ? [0.5] : [-0.5, 0.5])) {
        const ab = a + g * krokKata;
        const ub = Math.abs(((ab - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI) / Math.PI;
        const kk = kB ? kB(ub) : { w: 1, t: 1 };
        const polOdstepu = (krokKata / 2) * (promien(ub) - Math.min(0.22, d * 0.12));
        const cel = d / 2 + kula * 0.32;
        let off = Math.sqrt(Math.max(0, cel * cel - polOdstepu * polOdstepu));
        off = Math.max(off, kula * 1.15);
        off = Math.min(off, (p.width * kk.w) / 2 - kula * 0.6);
        // Promien MUSI byc wziety z profilu na wysokosci krapy, a nie ze
        // szczytu szyny. Szyna polokragla opada ku krawedziom, wiec slupek
        // postawiony na promieniu szczytu wisi obok metalu i bryla rozpada sie
        // na kilkadziesiat czesci. Widac to w ujemnym `genus`, nie na renderze.
        const rad = ri + (shankRadiusAt(p, off / kk.w) - ri) * kk.t - SINK_B;
        const os = [Math.cos(ab), Math.sin(ab), 0];
        const rGora = kula * 0.72;
        // Stan ZAKUTY to krapa ROZDZIELONA NA DWA i dognieta na oba sasiednie
        // kamienie, dokladnie tak, jak robi to jubiler rylcem. Kazda polowka
        // jest krotsza od krapy otwartej i pochyla sie ku swojemu kamieniowi.
        // Stan otwarty zostaje prosty i pelnej dlugosci, bo to z niego
        // te polowki dopiero powstana.
        const zam = zakute(p);
        const pochyl = 26;
        const dlug = zam ? wysokosc * 0.72 : wysokosc;
        const kierunki = zam ? [-pochyl, pochyl] : [0];
        for (const s of [-1, 1]) {
          const stopa = [os[0] * rad, os[1] * rad, s * off];
          for (const kat of kierunki) {
            const azym = ab / DEG + kat;
            const osK = [Math.cos(azym * DEG), Math.sin(azym * DEG), 0];
            addM(zlacz(
              Manifold.cylinder(dlug + SINK_B, zam ? kula * 0.8 : kula, rGora, 20, false)
                .rotate([0, 90, azym])
                .translate(stopa),
              Manifold.sphere(rGora, 16).translate([
                stopa[0] + osK[0] * (dlug + SINK_B),
                stopa[1] + osK[1] * (dlug + SINK_B),
                stopa[2],
              ]),
            ));
          }
        }
      }
    }
  }

  return {
    addMetal: metal, cutSeats: seats, stones,
    stoneVolume: stoneSolid(w, "round", d).solid.volume(),
  };
}

/**
 * Halo: wieniec drobnych kamieni WOKOL korony.
 *
 * Buduje sie go w ukladzie korony, czyli rondysta kamienia centralnego na
 * z = 0, tafla w gore. Cala grupa jedzie potem tym samym przeksztalceniem
 * co korona, wiec nie trzeba jej ustawiac osobno.
 *
 * Liczba kamieni NIE jest parametrem. Wynika z obwodu wienca podzielonego
 * przez srednice kamienia: to jest ta sama arytmetyka, ktora robi jubiler
 * przy stole, a zostawienie jej klientowi konczy sie albo dziura w wiencu,
 * albo kamieniami zachodzacymi na siebie.
 */
export function buildHalo(w, p, stone, girdleR) {
  const { Manifold, CrossSection } = w;
  const d = p.halo.size;
  const luz = 0.18;                                // odstep wienca od rondysty
  const rW = girdleR + luz + d / 2;                // promien, na ktorym siedza kamienie
  const n = Math.max(8, Math.floor((Math.PI * 2 * rW) / (d * 1.06)));

  // Plyta wienca: pierscien metalu z otworem na kamien centralny. Otwor musi
  // byc mniejszy od rondysty, inaczej kamien centralny nie ma na czym usiasc,
  // a wieniec wisi na samych lapkach.
  const kolo = (r) => smoothCircle(r, 64);
  const rZewn = rW + d / 2 + 0.34;
  const rWewn = Math.max(0.4, girdleR - 0.12);
  // Plyta musi pomiescic gniazdo I wybranie pod nim. Bylo `d * 0.72`, czyli
  // mniej, niz samo gniazdo potrzebuje na wlot, prosty pas i stozek.
  const grubosc = Math.max(1.05, d * 0.95);
  const plyta = Manifold.extrude(
    CrossSection.ofPolygons([ccw(kolo(rZewn)), ccw(kolo(rWewn)).reverse()]),
    grubosc,
  ).translate([0, 0, -grubosc + stone.girdleH * 0.5]);

  let metal = plyta;
  let seats = null;
  const stones = [];
  // GLEBOKOSC OSADZENIA KAMYKA, czyli ile WLOTU jest w metalu.
  //
  // Bylo 0,06 mm i to jest za malo, zeby gniazdo bylo gniazdem. Wlot gniazda
  // jest szerszy od kamienia o luz montazowy i zaczyna sie na wysokosci
  // rondysty; przy zanurzeniu 0,06 mm caly ten wlot siedzial PONAD licem
  // plyty, czyli w powietrzu. W metalu zostawal sam otwor lozowy, wezszy od
  // kamienia o podciecie: zmierzone 1,18 mm przy kamyku 1,30 mm.
  //
  // Skutek jest warsztatowy, nie kosmetyczny: kamien nie ma jak zjechac do
  // gniazda, siada na krawedzi otworu i stoi na wierzchu. Z gory czyta sie to
  // jako "brak otwartych gniazd do osadzania kamieni" i tak zostalo zgloszone.
  //
  // Plyta jest teraz na tyle gruba, ze mozna zanurzyc kamien porzadnie.
  // Zanurzenie idzie za rozmiarem kamienia, bo za nim idzie i wlot.
  const zK = stone.girdleH * 0.5 - Math.max(0.12, d * 0.11);

  // Kamyk i gniazdo sa dla calego wienca TAKIE SAME, wiec budujemy je RAZ
  // i powielamy przesunieciem. Wieniec potrafi miec dwadziescia kamieni,
  // a kamien fasetowany to kilkadziesiat operacji jadra: budowany od nowa dla
  // kazdego kamyka kosztowal tyle, co caly pierscionek.
  const wzorKam = stoneSolid(w, "round", d);
  const wzorGniazdo = seatCutter(w, "round", d, zakute(p));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rW, y = Math.sin(a) * rW;

    stones.push(wzorKam.solid.translate([x, y, zK]));

    const cut = wzorGniazdo.translate([x, y, zK]);
    seats = seats ? zlacz(seats, cut) : cut;
  }
  wzorGniazdo.delete?.();

  // Kuleczki wienca stoja MIEDZY kamieniami, po jednej od zewnatrz i od
  // srodka, wiec kazda trzyma dwa sasiednie kamienie. Tak sie zakuwa halo
  // i tylko tak kuleczek nie trzeba dwa razy tyle.
  //
  // Wczesniej siedzialy na promieniu `rW + d * 0.42`, czyli WEWNATRZ obrysu
  // kamyka, ktorego promien to `d / 2`. Wlot gniazda scinal je wiec do zera
  // i wieniec zostawal bez zadnego zakucia.
  //
  // Kuleczka ZAKUTA lezy czesciowo NA kamieniu, bo tylko wtedy cokolwiek
  // trzyma. Miedzy sasiednimi kamykami zostaje kilka setnych milimetra, wiec
  // kuleczka postawiona dokladnie w polowie odstepu i odsunieta o pelny promien
  // rondysty mija oba kamienie i wisi w metalu plyty. Przy zakuciu schodzimy
  // wiec blizej osi wienca i podnosimy ja ponad rondyste.
  //
  // KULECZKA MUSI STERCZEC W GORE, a nie lezec plasko na plycie.
  //
  // Byla to sama kula wtopiona w wieniec, czyli guzek, ktorego nie da sie
  // zakuc: narzedzie nie ma jak podejsc, a metal nie ma dokad plynac. To sama
  // usterka, ktora poprawilismy juz przy pave na szynie, tylko w wiencu
  // zostala. Zakucie jest slupkiem: stoi ponad plyta, zweza sie ku gorze
  // i przy zakuwaniu KLANIA SIE nad kamien, bo ma czym.
  const kulaH = Math.min(0.28, d * 0.24);
  const zam = zakute(p);
  const wysokoscZ = Math.max(0.35, d * 0.5);
  for (let i = 0; i < n; i++) {
    const b = ((i + 0.5) / n) * Math.PI * 2;
    for (const s of [-1, 1]) {
      // Stopa stoi POZA obrysem kamyka, bo wlot gniazda scina wszystko, co
      // w ten obrys wchodzi. Szczyt zakutego slupka pochyla sie do srodka
      // odstepu, czyli nad oba sasiednie kamienie naraz.
      //
      // ODSUNIECIE LICZYMY, a nie zgadujemy. Bylo `d / 2 + kulaH * 0.35`,
      // czyli pelny promien kamienia z naddatkiem, mierzony PROSTOPADLE do
      // wienca. To jest za duzo, bo kuleczka stoi w polowie odstepu miedzy
      // kamieniami, wiec ma juz zapas wzdluz obwodu i drugi raz go nie
      // potrzebuje. Kuleczka odsunieta o pelny promien lezy daleko od obu
      // gniazd, a zakuwa sie tym, co jest przy krawedzi kamienia.
      //
      // Liczymy wiec najmniejsze odsuniecie, przy ktorym stopa jeszcze mija
      // wlot obu sasiadow, i bierzemy dokladnie tyle. Podloga jest jedna:
      // dwie kuleczki tej samej pary nie moga sie zlac w jeden walek. Przy
      // 1,15 promienia jeszcze sie zlewaly (przy kamyku 1,8 mm z pary
      // zostawal jeden walek), wiec podloga jest 1,6.
      const polKroku = (Math.PI / n) * rW;         // polowa odstepu po obwodzie
      const wlot = d / 2 + 0.05 + 0.04;            // wlot gniazda plus margines
      const minOdsun = Math.sqrt(Math.max(0, wlot * wlot - polKroku * polKroku));
      const odsun = Math.max(minOdsun, kulaH * 1.6);
      const rStopy = rW + s * odsun;
      // Zakuty slupek pochyla sie nad kamien, ale nie tak daleko, zeby zejsc
      // sie z drugim slupkiem pary: dwa czubki w jednym walku to nie zakucie.
      const odsunCzubka = zam ? Math.max(odsun - d * 0.30, kulaH * 1.1) : odsun;
      const rSzczytu = rW + s * odsunCzubka;
      const zStopy = zK - 0.12;
      metal = zlacz(metal, tubeAlong(w,
        [
          [Math.cos(b) * rStopy, Math.sin(b) * rStopy, zStopy],
          [Math.cos(b) * rStopy, Math.sin(b) * rStopy, zStopy + wysokoscZ * 0.55],
          [Math.cos(b) * rSzczytu, Math.sin(b) * rSzczytu, zStopy + wysokoscZ],
        ],
        [kulaH, kulaH * 0.86, kulaH * 0.72]));
    }
  }

  // GALERIA, czyli wybranie od spodu.
  //
  // Wieniec byl pelna tarcza i to jest blad rzeczowy, nie kosmetyczny.
  // Pelny metal pod kamieniami odcina im swiatlo od dolu, a wlasnie stamtad
  // bierze sie blask halo: kamien oswietlony tylko z gory jest szary.
  // Do tego tarcza wazy kilkadziesiat procent wiecej, a to sa dziesiate
  // grama razy cena zlota.
  //
  // Okien NIE wiercimy miedzy kamieniami, bo miedzy gniazdami zostaje
  // dwadziescia kilka setnych milimetra i kazde takie okno rozcina wieniec
  // na kawalki. Sprawdzilem to: bryla rozpadala sie na dwie czesci.
  // Wybieramy wiec pierscien od spodu i zostawiamy plyte, w ktorej siedza
  // gniazda.
  // GRUBOSC PLYTY POD GNIAZDEM decyduje o tym, czy gniazdo w ogole jest.
  //
  // Bylo tu 0,55 mm na sztywno. Przy kamyku 1,3 mm gniazdo potrzebuje wlotu,
  // prostego pasa `SEAT.ledge` i stozka, czyli wiecej niz 0,55: stozek nie
  // miescil sie w plycie i konczyl sie tam, gdzie zaczynalo sie wybranie.
  // Zmierzone na wiencu: otwor zwezal sie do 0,85 mm i NATYCHMIAST otwieral
  // z powrotem do 1,39 mm, bo dalej bylo juz tylko wybranie. Kamien lezal
  // wiec na krawedzi grubosci dwoch dziesiatych zamiast na stozku i przy
  // zakuwaniu wpadal do srodka.
  //
  // Plyta idzie za rozmiarem kamienia, bo gniazdo tez za nim idzie. Wybranie
  // zostaje, tylko plytsze: swiatlo od dolu jest wazne, ale nie wazniejsze
  // od tego, zeby kamien mial na czym usiasc.
  const plytaH = Math.max(0.55, d * 0.62);
  if (grubosc > plytaH + 0.2) {
    const kolo2 = (r) => smoothCircle(r, 48);
    const wybranie = Manifold.extrude(
      CrossSection.ofPolygons([ccw(kolo2(rZewn - 0.3)), ccw(kolo2(rWewn + 0.25)).reverse()]),
      grubosc - plytaH,
    ).translate([0, 0, -grubosc + stone.girdleH * 0.5]);
    metal = odejmij(metal, wybranie);
  }

  const objetoscKamyka = wzorKam.solid.volume();
  wzorKam.solid.delete?.();
  return { metal, seats, stones, count: n, stoneVolume: stones.length ? objetoscKamyka : 0 };
}

/** Okrag jako lista punktow. Uzywany tam, gdzie potrzebny jest przekroj z otworem. */
function smoothCircle(r, n) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}


// ------------------------------------------------------------
// Dodatki odlewnicze: kanal wlewowy i stopka
// ------------------------------------------------------------
/**
 * Kanal wlewowy i stopka odlewnicza.
 *
 * NIE sa czescia wyrobu. Kanal odcina sie po odlaniu, a metal z niego wraca
 * do tygla, wiec nie wchodzi ani do masy pierscionka, ani do jego ceny.
 * Bryla wraca stad OSOBNO i dolacza sie wylacznie do pliku.
 *
 * Kanal wchodzi w NAJGRUBSZE miejsce odlewu i to nie jest wybor estetyczny.
 * Metal krzepnie od cienkich scianek ku grubym, a kanal musi zastygnac jako
 * ostatni, zeby do konca dokarmial kurczacy sie odlew. Wpiety w cienka szyne
 * zakrzepnie pierwszy i pod glowica zostanie jama skurczowa.
 *
 * TYLE TEORII, i wlasnie ona wprowadzila mnie w blad. Reguly "najgrubsze
 * miejsce" nie wolno stosowac na slepo, bo przy sylwetce katedralnej
 * najgrubsza jest GLOWICA, i kanal wychodzil klientowi prosto z korony,
 * miedzy lapkami, przez powierzchnie, na ktorej siedzi kamien. Takiego kanalu
 * nie da sie odcia, bo nie ma gdzie wejsc pilnikiem, a slad po nim zostaje na
 * widoku. Zaden jubiler tak nie wiesza pierscionka.
 *
 * Miejsce wlewu wynika wiec z TYPU WYROBU, a nie z pomiaru grubosci:
 *
 *   pierscionek  zawsze od dolu szyny, czyli po przeciwnej stronie glowicy
 *   sygnet       tak samo od dolu szyny
 *   obraczka     nie ma glowicy, wiec decyduje grubosc
 *
 * SYGNET PRZESZEDL TE SAMA DROGE co pierscionek, tylko o jeden krok pozniej.
 * Kanal wchodzil w KANT tarczy, zeby nie tknac powierzchni pod grawer, i to
 * bylo lepsze od wersji przez plyte na wylot, ale nadal zle: wisial poziomo
 * przy glowicy, czyli w miejscu, ktore jubiler oglada i poleruje. Sygnet
 * wiesza sie tak samo jak pierscionek, za dol szyny, a tarcze karmia kanaly
 * wewnetrzne. Jedno miejsce wlewu dla wszystkiego, co ma szyne.
 *
 * Glowice karmi sie kanalami WEWNETRZNYMI, przez swiatlo pierscionka, i to
 * jest odpowiedz na to samo pytanie metalurgiczne, tylko taka, ktora nie
 * niszczy wyrobu.
 *
 * Stopka to zbiornik metalu pod kanalem. Jej rola jest ta sama, tylko na
 * wieksza skale: trzyma cieklo najdluzej i oddaje metal w glab formy.
 */
/**
 * Kanaly WEWNETRZNE: dwa prety przez SWIATLO pierscionka, od strony wlewu
 * do przeciwleglej.
 *
 * Byly tu dwa krotkie kikuty przy samym wlewie, wpiete w szyne kilkanascie
 * stopni obok kanalu glownego. Robily polowe roboty: usztywnialy odlew, ale
 * nie dowozily metalu tam, gdzie trzeba, czyli pod glowice. Klient zglosil to
 * wprost, ze "kanaly wewnetrzne sa tylko lekko po bokach".
 *
 * Prawidlowy uklad, ten z drzewka odlewniczego: JEDEN pret wychodzi z wlewu
 * i ROZWIDLA SIE na dwa, ktore przechodza przez otwor na palec i wchodza
 * w szyne po przeciwnej stronie, pod glowica albo pod tarcza. To one karmia
 * najgrubsze miejsce odlewu, dzieki czemu kanal glowny nie musi w nie wchodzic
 * i moze zostac na dole szyny, gdzie da sie go odcia bez sladu.
 *
 * PIERWSZA WERSJA MIALA TE LITERE V DO GORY NOGAMI: rozwidlenie bylo przy
 * glowicy, a dwa prety zbiegaly sie przy wlewie. Wygladalo to podobnie i bylo
 * odwrotnoscia tego, jak plynie metal: z jednego zrodla w dwa miejsca, a nie
 * z dwoch miejsc w jedno.
 *
 * `znak` mowi, po ktorej stronie siedzi wlew: +1 gora, -1 dol. Rozwidlenie
 * jest ZAWSZE przy nim.
 */
function kanalyWewnetrzne(w, p, znak) {
  const ri = p.innerDia / 2;
  const r = Math.max(1.0, ri - 0.3);          // tuz pod powierzchnia otworu
  const rInner = Math.min(0.95, Math.max(0.55, ri * 0.11));
  // Rozwidlenie po stronie WLEWU: stad idzie metal.
  const rozwidlenie = [0, znak * r, 0];
  let solid = null;
  for (const strona of [-1, 1]) {
    const kat = -znak * (Math.PI / 2) + strona * 0.85;
    const koniec = [Math.cos(kat) * r, Math.sin(kat) * r, 0];
    // Grubszy przy wlewie, cienszy przy wyrobie: tam sie go odcina.
    const pret = tubeAlong(w, [rozwidlenie, koniec], [rInner, rInner * 0.8]);
    solid = solid ? zlacz(solid, pret) : pret;
  }
  return solid;
}

function buildCasting(w, p) {
  const { Manifold } = w;
  const ri = p.innerDia / 2;
  const k = taperFor(p);
  const przyGlowicy = ri + p.thickness * (k ? k(0).t : 1);
  const naDole = ri + p.thickness * (k ? k(1).t : 1);

  // Obraczka nie ma glowicy, wiec tam i tylko tam decyduje grubosc. Sygnet
  // wchodzi w kant tarczy, czyli od gory. Pierscionek z kamieniem zawsze od
  // dolu: nad nim jest korona i kamien.
  // Obraczka nie ma ani glowicy, ani tarczy, wiec tam i tylko tam decyduje
  // grubosc. Wszystko, co ma cos na godzinie dwunastej, wiesza sie za dol.
  const doGory = p.kind === "band" ? przyGlowicy > naDole + 0.05 : false;
  const promien = doGory ? przyGlowicy : naDole;
  const znak = doGory ? 1 : -1;

  // Srednice kanalow sa warsztatowe, nie dowolne. Ponizej trzech milimetrow
  // kanal krzepnie przed odlewem i cala jego funkcja znika.
  const rKanal = 1.6;
  const dlugosc = 9.0;
  const rStopka = 5.0;                        // stopka o srednicy 10 mm
  const hStopka = 3.0;

  /**
   * Odcinek stozkowy ulozony wzdluz osi wlewu, liczony od srodka pierscionka.
   *
   * `Manifold.cylinder` rosnie wzdluz +Z od zera, a obrot przenosi go na os Y.
   * Przy pierwszym podejsciu przesuwalem bryle o `promien + dlugosc`, czyli
   * o dlugosc kanalu ZA DUZO, i kanal stal obok pierscionka, nie w nim.
   * Widac to bylo dopiero po policzeniu czesci skladowych: dwie zamiast
   * jednej, czyli w pliku dwa osobne przedmioty.
   */
  const odcinek = (h, r0, r1, od) =>
    Manifold.cylinder(h, r0, r1, 28, false)
      .rotate([znak > 0 ? -90 : 90, 0, 0])
      .translate([0, znak * od, 0]);

  // Sygnet dostaje GRUBSZY kanal, ale w tym samym miejscu co pierscionek.
  //
  // Przez chwile mial wlasna sciezke: kanal wchodzil poziomo w kant tarczy,
  // zeby nie tknac powierzchni pod grawer. Bylo to lepsze od wersji przez
  // plyte na wylot, ale wisialo przy glowicy, czyli tam, gdzie sie poleruje.
  // Sygnet wiesza sie za dol szyny tak samo jak pierscionek, a tarcze karmia
  // kanaly wewnetrzne.
  //
  // Grubosc jest jedyna roznica i wynika z masy: dziewiec gramow zasila sie
  // inaczej niz poltora, a ponizej tej srednicy kanal krzepnie przed tarcza
  // i cala jego funkcja znika.
  const rGlowny = p.kind === "signet" ? 2.1 : rKanal;

  // Kanal zaczyna sie POD powierzchnia odlewu, zeby polaczenie bylo pewne,
  // i zweza sie ku niemu, bo tak plynie metal i tak zastyga we wlasciwej
  // kolejnosci: najdalej od odlewu najpozniej.
  const start = promien - 0.8;
  let solid = odcinek(dlugosc, rGlowny * 0.62, rGlowny, start);

  if (p.casting.innerSprues) solid = zlacz(solid, kanalyWewnetrzne(w, p, znak));

  if (p.casting.button) {
    // Przejscie stozkowe, zeby przekroj nie zmienial sie skokiem: ostry
    // uskok to miejsce, w ktorym odlew rwie sie przy stygnieciu.
    solid = solid
      .add(odcinek(2.0, rGlowny, rStopka * 0.92, start + dlugosc - 0.3))
      .add(odcinek(hStopka, rStopka, rStopka * 0.88, start + dlugosc + 1.5));
  }

  return solid;
}

/**
 * Bryla bez SKORUP O ZEROWEJ OBJETOSCI.
 *
 * Gdy dwie powierzchnie zetkna sie stycznie, jadro potrafi domknac to
 * zetkniecie jako osobna, zerowej grubosci skorupe. Widzialem to juz przy
 * kulach na wspolliniowym torze i zalatalem u zrodla, ale to nie jest jedno
 * miejsce w kodzie, tylko wlasnosc dzialan na siatkach: przy oprawie kanalowej
 * wychodza cztery takie odpryski wielkosci pieciu setnych milimetra i to przy
 * JEDNYM konkretnym ustawieniu suwaka, a przy sasiednim juz nie.
 *
 * Nie da sie wiec temu zapobiec dobierajac wymiary, bo klient dobiera je sam.
 * Odpryski usuwamy na koniec, przed policzeniem objetosci. Prog jest przy tym
 * celowo mikroskopijny: chodzi o to, zeby wyrzucic to, co nie jest geometria,
 * a nie o to, zeby zamiesc pod dywan bryle rozpadnieta na kawalki. Tamto ma
 * dalej wychodzic w tescie.
 */
function bezSmieci(m) {
  if (!m) return m;
  const czesci = m.decompose();
  const zdrowe = czesci.filter((c) => Math.abs(c.volume()) > 0.002);
  if (!zdrowe.length || zdrowe.length === czesci.length) {
    for (const c of czesci) c.delete?.();
    return m;
  }
  for (const c of czesci) if (!zdrowe.includes(c)) c.delete?.();
  let sklejone = zdrowe[0];
  for (let i = 1; i < zdrowe.length; i++) sklejone = zlacz(sklejone, zdrowe[i]);
  m.delete?.();
  return sklejone;
}

/**
 * @param {object} input parametry wedlug `params.js`
 * @param {object} [opts] `{ segments, withStones }`
 * @returns {Promise<{metal, stones, params, volumeMm3, massG, patternVolumeMm3}>}
 */
export async function buildRing(input, opts = {}) {
  const p = validate(input);
  // Kamienie moga zniknac z modelu na dwa sposoby: przez parametr klienta
  // i przez wywolanie wewnetrzne, ktore ich nie potrzebuje. Oba znacza to
  // samo, wiec skladamy je w jedno.
  //
  // `withStones: true` jest MOCNIEJSZE od przelacznika klienta i sluzy tylko
  // pomiarom: sprawdzian potrzebuje bryl kamieni po to, zeby przylozyc je do
  // metalu ODLEWNICZEGO, czyli takiego, w ktorym klient kamieni nie chce.
  // Bez tego sonda dostawala pusta liste i przechodzila, nie mierzac niczego.
  const zKamieniami = opts.withStones === true
    || (opts.withStones !== false && p.casting.stones !== false);
  const w = await kernel();
  const segments = opts.segments || SEG;

  // Promien szyny NA GODZINIE DWUNASTEJ, czyli tam, gdzie siada glowica.
  // Przy zwezonej szynie to NIE jest `ri + grubosc`: zwezenie sciaga metal
  // do srodka i korona postawiona na starej wysokosci wisi nad szyna, ze
  // szczelina, ktora widac golym okiem. Ten sam blad w druga strone, przy
  // sylwetce sygnetowej, wpychalby glowice w szyne.
  const kGlowica = taperFor(p);
  const ro = p.innerDia / 2 + p.thickness * (kGlowica ? kGlowica(0).t : 1);
  let metal = buildShank(w, p, segments);
  const stones = [];
  // Objetosci kamieni sa potrzebne wycenie, bo karat to jednostka MASY:
  // liczy sie go z objetosci razy gestosc, a nie z szerokosci kamienia.
  // Zbieramy je zawsze, takze gdy podglad kamieni jest wylaczony.
  const stoneVolumesMm3 = { center: 0, side: 0 };
  let haloSeats = null;

  // Korona i kamien lezyskuja na godzinie dwunastej, czyli w osi +Y.
  // Obrot i przesuniecie tez zwracaja NOWE bryly, wiec wejscie oddajemy.
  const place = (m) => {
    const obrocona = m.rotate([-90, 0, 0]);
    m.delete?.();
    const gotowa = obrocona.translate([0, ro, 0]);
    obrocona.delete?.();
    return gotowa;
  };
  const podnies = (m, dz) => { const g = m.translate([0, 0, dz]); m.delete?.(); return g; };

  if (p.kind === "band") {
    // Obraczka: sama szyna. Kamienie, jesli sa, ida po obwodzie.
    const b = buildBandStones(w, p);
    if (b.addMetal) metal = zlacz(metal, b.addMetal);
    if (b.cutSeats) metal = odejmij(metal, b.cutSeats);
    stoneVolumesMm3.side = b.stoneVolume;
    stoneVolumesMm3.sideCount = b.stones.length;
    if (zKamieniami) stones.push(...b.stones);
    else for (const k of b.stones) k.delete?.();
  } else if (p.kind === "signet") {
    metal = zlacz(metal, place(buildSignetHead(w, p)));
  } else {
    const stone = stoneSolid(w, p.stone.cut, p.stone.size);
    stoneVolumesMm3.center = stone.solid.volume();
    const { solid: crown, basketH } = buildCrown(w, p, stone);

    // Kosz stoi NA szynie, wiec rondysta jest o jego wysokosc wyzej. Pominiecie
    // tego wpycha kosz w otwor na palec: pierscionek nadal wyglada poprawnie,
    // a srednica wewnetrzna zmniejsza sie o ponad milimetr i po prostu nie
    // wchodzi na palec. Zabiera 0,35 mm, zeby kosz wtopil sie w szyne.
    const standoff = basketH > 0 ? basketH - 0.35 : 0;

    // KOLEJNOSC KAMIENI NA LISCIE JEST CZESCIA UMOWY z reszta programu:
    // centralny, potem wieniec, potem boczne. Podglad rysuje po niej materialy,
    // wiec wieniec wlozony przed kamieniem centralnym daje szafirowy soliter
    // pomalowany barwa cyrkonii z halo, i nic tego nie zglasza.
    if (zKamieniami) stones.push(place(podnies(stone.solid, standoff)));
    else stone.solid.delete?.();

    // Halo obejmuje korone, wiec jedzie razem z nia: tym samym obrotem
    // i o te sama wysokosc, o ktora kosz podnosi kamien nad szyne.
    if (p.halo.on) {
      const girdleR = Math.max(...outlineFor(p.stone.cut, p.stone.size).map(([x, y]) => Math.hypot(x, y)));
      const halo = buildHalo(w, p, stone, girdleR);
      metal = zlacz(metal, place(podnies(halo.metal, standoff)));
      haloSeats = place(podnies(halo.seats, standoff));
      if (zKamieniami) stones.push(...halo.stones.map((sn) => place(podnies(sn, standoff))));
      else for (const k of halo.stones) k.delete?.();
      stoneVolumesMm3.halo = halo.stoneVolume;
      stoneVolumesMm3.haloCount = halo.count;
    }

    const side = buildSideStones(w, p);
    if (p.side.count > 0) {
      const wzor = stoneSolid(w, CUTS[p.side.cut] ? p.side.cut : "round", p.side.size);
      stoneVolumesMm3.side = wzor.solid.volume();
      wzor.solid.delete?.();
    }
    if (side.addMetal) metal = zlacz(metal, side.addMetal);
    if (crown) {
      metal = zlacz(metal, place(podnies(crown, standoff)));
      // Galeria ma sens tylko wtedy, gdy jest co podeprzec: przy briolecie
      // kosza nie ma, a przy kasecie rant siega szyny wlasnym trzonem.
      if (basketH > 0 && p.setting !== "bezel") {
        // Wysokosc kosza, a NIE kosz plus podniesienie: kosz jest juz
        // przesuniety o `standoff`, wiec zsumowanie obu podnosilo luk
        // dwukrotnie i zamiast wtopic sie w szyne siadal na niej guzkami.
        metal = zlacz(metal, buildGallery(w, p, basketH));
      }
    }

    // Gniazda WYCINAMY dopiero po zlaczeniu wszystkiego, zeby siegaly takze
    // szyny. Odwrotna kolejnosc daje bryle cieszsza o kilkanascie procent.
    if (p.setting !== "drilled") {
      // OTWOR PRZELOTOWY NIE MOZE PRZECIAC SZYNY.
      //
      // Gniazdo kamienia szesciomilimetrowego ma wylot szerokosci trzech
      // milimetrow, a szyna bywa szeroka na dwa i pol. Otwor byl wiec SZERSZY
      // OD SZYNY i przecinal ja na wylot: pod glowica zostawaly dwa osobne
      // ramiona, trzymajace sie tylko koszem. Bryla dalej byla jedna calascia,
      // wiec zaden dotychczasowy sprawdzian tego nie widzial, a pierscionek
      // mial na palcu otwarta szczeline na calej szerokosci.
      //
      // Wylot zweza sie wiec do tego, co szyna udzwignie, zostawiajac po obu
      // stronach pasek metalu. Pasek jest cienki i nie siega calej grubosci
      // szyny: wnetrze zostaje gladkie, a gniazdo dalej jest przewiercone.
      const wylotSrodka = Math.max(0.16, Math.min(
        SEAT.throughWidth,
        (p.width - 2 * SEAT.minInnerStrip) / p.stone.size,
      ));
      metal = odejmij(metal, place(podnies(
        seatCutter(w, p.stone.cut, p.stone.size, zakute(p), wylotSrodka), standoff)));
    }
    if (side.cutSeats) metal = odejmij(metal, side.cutSeats);
    // Gniazda wienca tez po zlaczeniu, z tego samego powodu co srodkowe.
    if (haloSeats) metal = odejmij(metal, haloSeats);
    if (zKamieniami) stones.push(...side.stones);
    else for (const k of side.stones) k.delete?.();
  }

  metal = bezSmieci(metal);
  const volumeMm3 = metal.volume();
  const alloyDef = CASTING_ALLOYS[p.alloy] || CASTING_ALLOYS.ag925;

  // MASA KAMIENI, osobno od metalu.
  //
  // Do tej pory podawalismy "mase metalu" i to bylo uczciwe, ale niepelne:
  // klient trzyma w reku pierscionek, nie sam odlew, a kamienie waza. Karat
  // to jednostka masy, wiec liczy sie ja z objetosci razy gestosc.
  //
  // Rozdzial jest istotny takze technicznie: WYJECIE kamienia zmienia mase
  // gotowego wyrobu, ale NIE mase odlewu z gniazdami. Gniazda sa wyciete
  // niezaleznie od tego, czy kamien w nich siedzi.
  const wagaKamieni = (id, objetosc, ile) => (objetosc / 1000) * gemDensity(id) * ile;
  let stoneMassG = 0, caratTotal = 0;
  const dolicz = (id, objetosc, ile) => {
    if (!(objetosc > 0) || !(ile > 0)) return;
    const g = wagaKamieni(id, objetosc, ile);
    stoneMassG += g;
    caratTotal += g * 5;                  // 1 ct = 0,2 g
  };
  if (p.kind === "band") {
    dolicz(p.band.material, stoneVolumesMm3.side, stoneVolumesMm3.sideCount || 0);
  } else if (p.kind !== "signet") {
    // Brioleta tez jest kamieniem, ktory klient dostaje.
    //
    // Stalo tu `p.setting === "drilled" ? 0 : 1`, wiec pierscionek z brioleta
    // pokazywal 0,00 ct przy kamieniu widocznym na podgladzie. Brioleta nie
    // jest OSADZANA, tylko wiercona i zawieszona na kablaku, i stad zapewne
    // wzielo sie to zero: nie ma gniazda, wiec ktos uznal, ze nie ma kamienia.
    // Kamien jednak wisi, wazy i kosztuje, wiec liczy sie tak samo jak kazdy.
    dolicz(p.stone.material, stoneVolumesMm3.center, 1);
    dolicz(p.side.material, stoneVolumesMm3.side, p.side.count * 2);
    dolicz(p.halo.material, stoneVolumesMm3.halo || 0, stoneVolumesMm3.haloCount || 0);
  }
  // Kanal i stopka wracaja OSOBNO. Gdyby weszly do `metal`, podniosly by
  // objetosc o kilkadziesiat procent, a wraz z nia mase i cene, za metal,
  // ktory po odcieciu wraca do tygla.
  const casting = p.casting.sprues ? bezSmieci(buildCasting(w, p)) : null;

  return {
    params: p,
    metal,
    casting,
    stones,
    stoneVolumesMm3,
    volumeMm3,
    // Kolor stopu zmienia gestosc, wiec i mase. Bez niego biale zloto
    // liczyloby sie jak zolte i wycena bylaby zanizona o kilkanascie procent.
    massG: massGrams(volumeMm3, p.alloy, p.color) ?? 0,
    stoneMassG,
    caratTotal,
    /** Objetosc WZORCA do druku, czyli po kompensacji skurczu odlewniczego. */
    patternVolumeMm3: volumeMm3 * alloyDef.shrink ** 3,
    genus: metal.genus(),
    isEmpty: metal.isEmpty(),
  };
}

/**
 * Objetosc samej szyny policzona WZOREM, nie przez jadro.
 *
 * To jedyna obrona przed jadrem, ktore po cichu buduje cos innego, niz mu
 * zlecono: profil nawiniety w zla strone daje bryle pusta, a zla flaga luku
 * pierscionek lzejszy o kilkanascie procent. W obu razach model wyglada
 * poprawnie, a cena jest falszywa.
 */
export function shankVolumeFormula(p) {
  const pts = shankProfile(p);
  // Pole i srodek ciezkosci wielokata ze wzoru Gaussa, wiec liczba nie
  // pochodzi z jadra i wylapie kazdy jego blad przy obrocie.
  let a2 = 0, cx = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const cross = x1 * y2 - x2 * y1;
    a2 += cross;
    cx += (x1 + x2) * cross;
  }
  const area = Math.abs(a2) / 2;
  const rSr = cx / (3 * a2);                        // promien srodka ciezkosci
  return 2 * Math.PI * rSr * area;                  // twierdzenie Pappusa
}

/**
 * Ta sama objetosc, ale ze wzoru ZAMKNIETEGO, bez patrzenia na wielokat.
 *
 * Rozdzielenie tych dwoch funkcji nie jest przesada. `shankVolumeFormula`
 * sprawdza, czy jadro poprawnie obrocilo przekroj, ale przyjmuje przekroj
 * za dobra monete. Ta sprawdza sam przekroj. Dopiero obie razem lapia
 * i zle nawiniety profil, i zly ksztalt profilu.
 *
 * @returns {number|null} null dla profilu, ktory nie ma prostego wzoru
 */
export function shankVolumeClosedForm({ innerDia, width, thickness, profile }) {
  const ri = innerDia / 2, hw = width / 2, t = thickness;
  if (profile === "flat") return 2 * Math.PI * (ri + t / 2) * (width * t);
  if (profile === "knife") return 2 * Math.PI * (ri + t / 3) * ((width * t) / 2);
  if (profile === "round") {
    const area = (Math.PI * t * hw) / 2;            // polelipsa
    return 2 * Math.PI * (ri + (4 * t) / (3 * Math.PI)) * area;
  }
  return null;                                       // comfort: brak prostego wzoru
}
