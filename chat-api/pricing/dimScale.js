// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/utils/dimScale.js
// Regeneracja: npm run sync:pricing

// ============================================================
// SKALA W OSOBNYCH OSIACH
// ============================================================
// Do tej pory skala byla JEDNA LICZBA, wiec model dalo sie tylko powiekszyc
// albo zmniejszyc w calosci. Klient, ktory chce spłaszczyc breloczek albo
// wyciagnac szyld, nie mial jak tego powiedziec inaczej niz w opisie zlecenia,
// czyli slowami, ktorych wycena nie widzi.
//
// Tutaj skala to `{ x, y, z }` (rysunek wektorowy: `{ x, y }`), a przelacznik
// "synchronizuj" decyduje, czy ruch jednej osi ciagnie pozostale.
//
// TRZY RZECZY, KTORE LATWO ZEPSUC I ZADNA NIE RZUCA WYJATKU:
//
//   1. OBJETOSC. Przy skali nierownomiernej rosnie jak `sx * sy * sz`, a nie
//      jak `s^3`. Pomylka daje cene, ktora wyglada poprawnie.
//   2. POLE ROBOCZE. Model wolno obrocic, wiec "miesci sie" znaczy: istnieje
//      ustawienie osi, przy ktorym wchodzi. Porownanie os w os odrzucaloby
//      wydruki, ktore realnie robimy.
//   3. POWROT DO SYNCHRONIZACJI. Po odznaczeniu i zniekształceniu klient
//      moze wrocic do proporcji. Musimy wiedziec, DO CZEGO wracamy, bo
//      "srednia z trzech osi" cicho zmienia wielkosc wyrobu.
//
// Modul jest czysty: bierze liczby, oddaje liczby. React go tylko wola.

/** Osie bryly. Rysunek wektorowy uzywa dwoch pierwszych. */
export const AXES_3D = ["x", "y", "z"];
export const AXES_2D = ["x", "y"];

/** Zapas na bledy zaokraglenia, zeby wymiar na styk nie odbijal sie sam od siebie. */
const TOL = 1e-4;

/** Skala rownomierna, czyli to, co bylo przed ta zmiana. */
export function uniformScale(v = 1, axes = AXES_3D) {
  const s = Number(v);
  const bezpieczna = Number.isFinite(s) && s > 0 ? s : 1;
  return Object.fromEntries(axes.map((a) => [a, bezpieczna]));
}

/** Czy wszystkie osie maja te sama wartosc. */
export function isUniform(scale, eps = 1e-6) {
  const wart = osie(scale).map((a) => Number(scale[a]));
  if (!wart.length) return true;
  return wart.every((v) => Math.abs(v - wart[0]) < eps);
}

/** Osie faktycznie obecne w tym obiekcie skali. */
export function osie(scale) {
  return AXES_3D.filter((a) => scale && Number.isFinite(Number(scale[a])));
}

/**
 * Ustawia jedna os.
 *
 * @param {object} scale obecna skala
 * @param {string} axis  "x" | "y" | "z"
 * @param {number} value nowa wartosc dla tej osi
 * @param {boolean} sync czy pozostale osie maja pojsc za nia
 */
export function setAxis(scale, axis, value, sync) {
  const v = Number(value);
  if (!Number.isFinite(v) || v <= 0) return scale;
  if (sync) return uniformScale(v, osie(scale));
  return { ...scale, [axis]: v };
}

/** Wymiary wyrobu przy tej skali, w tych samych jednostkach co `bbox`. */
export function dimsFor(bbox, scale) {
  const out = {};
  for (const a of osie(scale)) out[a] = Number(bbox?.[a] || 0) * Number(scale[a]);
  return out;
}

/** Skala osi, przy ktorej wyrob ma w niej zadany wymiar. */
export function scaleForDim(bbox, axis, target) {
  const baza = Number(bbox?.[axis]);
  const cel = Number(target);
  if (!(baza > 0) || !(cel > 0)) return null;
  return cel / baza;
}

/**
 * Ile razy rosnie objetosc.
 *
 * Przy skali rownomiernej wychodzi `s^3`, wiec stara wycena jest szczegolnym
 * przypadkiem tego wzoru i nie trzeba jej rozgalezniac.
 */
export function volumeFactor(scale) {
  return osie(scale).reduce((acc, a) => acc * Number(scale[a]), 1);
}

/**
 * Czy wyrob w tej skali miesci sie w polu roboczym.
 *
 * Model wolno POLOZYC INACZEJ, wiec porownujemy posortowane wymiary z
 * posortowanym polem. Porownanie os w os odrzucaloby dlugi plaski element,
 * ktory po obroceniu wchodzi bez problemu.
 */
export function fitsBox(bbox, scale, limits) {
  if (!limits || !bbox) return true;
  const ax = osie(scale);
  const wyrob = ax.map((a) => Number(bbox[a] || 0) * Number(scale[a])).sort((p, q) => p - q);
  const pole = ax.map((a) => Number(limits[a])).sort((p, q) => p - q);
  if (!pole.every((n) => Number.isFinite(n) && n > 0)) return true;
  return wyrob.every((d, i) => d <= pole[i] + TOL);
}

/**
 * Najwieksza skala ROWNOMIERNA, ktora jeszcze wchodzi.
 *
 * Powtarza zachowanie `maxScaleForBuildVolume` z cennika druku, zeby suwak
 * i wycena mowily to samo o tej samej maszynie.
 */
export function maxUniformFor(bbox, limits) {
  if (!limits || !bbox) return null;
  const model = AXES_3D.map((a) => Number(bbox[a])).filter((n) => Number.isFinite(n) && n > 0).sort((p, q) => p - q);
  const pole = AXES_3D.map((a) => Number(limits[a])).filter((n) => Number.isFinite(n) && n > 0).sort((p, q) => p - q);
  if (model.length !== pole.length || !model.length) return null;
  return Math.min(...model.map((d, i) => pole[i] / d));
}

/**
 * Sciaga skale do pola roboczego, ZACHOWUJAC proporcje miedzy osiami.
 *
 * Klient, ktory swiadomie splaszczyl model, nie chce, zeby "dopasuj" cofnelo
 * mu te decyzje. Dlatego mnozymy wszystkie osie przez ten sam wspolczynnik,
 * a nie przycinamy kazdej z osobna.
 */
export function shrinkToBox(bbox, scale, limits) {
  if (fitsBox(bbox, scale, limits)) return scale;
  return fitToBox(bbox, scale, limits);
}

/**
 * Dopasowuje wyrob do pola W OBIE STRONY: powieksza, gdy jest mniejszy, i
 * zmniejsza, gdy nie wchodzi.
 *
 * Tak dziala przycisk "dopasuj" w szybkiej wycenie i tak ma dzialac tutaj,
 * inaczej ten sam napis znaczylby w dwoch miejscach dwie rozne rzeczy.
 * Proporcje miedzy osiami zostaja nietkniete: mnozymy wszystkie tym samym
 * wspolczynnikiem, wiec swiadome zniekształcenie klienta przezywa dopasowanie.
 */
export function fitToBox(bbox, scale, limits) {
  if (!limits || !bbox) return scale;
  const ax = osie(scale);
  // Szukamy najwiekszego `k`, przy ktorym `scale * k` jeszcze wchodzi.
  // Wymiary i pole sortujemy tak samo jak w `fitsBox`, bo obrot jest dozwolony.
  const wyrob = ax.map((a) => Number(bbox[a] || 0) * Number(scale[a])).sort((p, q) => p - q);
  const pole = ax.map((a) => Number(limits[a])).sort((p, q) => p - q);
  const k = Math.min(...wyrob.map((d, i) => (d > 0 ? pole[i] / d : Infinity)));
  if (!Number.isFinite(k) || k <= 0) return scale;
  // W dol, nie w gore: zaokraglenie w gore zostawiloby wymiar o wlos za duzy.
  const bezpieczny = Math.floor(k * 10000) / 10000;
  return Object.fromEntries(ax.map((a) => [a, Number(scale[a]) * bezpieczny]));
}

/**
 * Powrot do proporcji po odznaczeniu synchronizacji.
 *
 * Wracamy do skali, ktora BYLA W CHWILI ODZNACZENIA, a nie do sredniej z osi
 * ani do 1. Srednia po cichu zmienialaby wielkosc wyrobu, a jedynka kasowalaby
 * takze te zmiany, ktore klient zrobil wczesniej i chcial zatrzymac.
 *
 * @param {object|number|null} zapamietana skala sprzed rozjechania osi
 * @param {object} obecna
 */
export function resyncScale(zapamietana, obecna) {
  if (typeof zapamietana === "number") return uniformScale(zapamietana, osie(obecna));
  if (zapamietana && osie(zapamietana).length) return { ...zapamietana };
  // Nie mamy czego przywrocic (na przyklad po odswiezeniu strony), wiec
  // bierzemy os X jako wiodaca: to ta, ktora klient widzi pierwsza.
  return uniformScale(Number(obecna?.x) || 1, osie(obecna));
}

/**
 * Skala do postaci, ktora rozumie serwer i stare zamowienia.
 *
 * Kwota wiazaca liczy sie na serwerze z `scale`, a w bazie leza pozycje
 * zapisane wtedy, gdy skala byla JEDNA LICZBA. Dlatego skala rownomierna
 * jedzie dalej jako liczba: stary odczyt jej nie zgubi, a nowy i tak ja
 * zrozumie. Dopiero skala rozjechana jedzie jako obiekt.
 */
export function serializeScale(scale) {
  if (scale == null) return 1;
  if (typeof scale === "number") return scale;
  const ax = osie(scale);
  if (!ax.length) return 1;
  if (isUniform(scale)) return Number(scale[ax[0]]);
  return Object.fromEntries(ax.map((a) => [a, Number(scale[a])]));
}

/** Odwrotnosc `serializeScale`: liczba albo obiekt na obiekt. */
export function parseScale(wartosc, axes = AXES_3D) {
  if (typeof wartosc === "number") return uniformScale(wartosc, axes);
  if (wartosc && typeof wartosc === "object") {
    const out = {};
    for (const a of axes) {
      const v = Number(wartosc[a]);
      out[a] = Number.isFinite(v) && v > 0 ? v : 1;
    }
    return out;
  }
  return uniformScale(1, axes);
}

/**
 * Krotki opis skali do podsumowania pozycji.
 *
 * Rozjechane osie MUSZA byc widoczne w opisie, bo to jest zmiana ksztaltu
 * wyrobu, a nie ustawienie kalkulatora. Podsumowanie idzie do koszyka i do
 * maila, czyli jest trescia umowy.
 */
export function describeScale(scale) {
  const ax = osie(scale);
  if (!ax.length) return "";
  if (isUniform(scale)) {
    const v = Number(scale[ax[0]]);
    return Math.abs(v - 1) < 1e-6 ? "" : ` ${Math.round(v * 100)}%`;
  }
  return ` ${ax.map((a) => `${a.toUpperCase()} ${Math.round(Number(scale[a]) * 100)}%`).join(" / ")}`;
}

/**
 * Wymiary wyrobu w milimetrach, gotowe do wpisania w umowe.
 *
 * Ta linia trafia do koszyka, do maila i do zapytania o wycene, bo wielkosc
 * wyrobu jest USTALENIEM, a nie ustawieniem kalkulatora. Bez niej klient
 * dostawal potwierdzenie, z ktorego nie wynikalo, jak duza rzecz zamowil.
 */
export function describeDims(bboxMm, scale) {
  if (!bboxMm) return null;
  const d = dimsFor(bboxMm, scale);
  const ax = osie(scale);
  if (!ax.length) return null;
  const wymiary = ax.map((a) => Number(d[a]).toFixed(1)).join(" × ");
  return `${wymiary} mm${isUniform(scale) ? "" : " (proporcje zmienione)"}`;
}
