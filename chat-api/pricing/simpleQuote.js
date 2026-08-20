// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/simpleQuote.js
// Regeneracja: npm run sync:pricing

// ============================================================
// SZYBKA WYCENA: ODPOWIEDZI LAIKA NA PARAMETRY KALKULATORA
// ============================================================
// Tryb uproszczony zadaje piec pytan zrozumialych dla kogos, kto nigdy nie
// widzial slicera, i tlumaczy je na parametry, ktorymi liczy tryb
// zaawansowany. Cala ta warstwa to czyste mapowanie, wiec mieszka tutaj,
// a nie w komponencie: dzieki temu da sie ja przeliczyc w node i porownac
// z trybem zaawansowanym w tescie, zamiast wierzyc na slowo.
//
// NAJWAZNIEJSZA REGULA, ZLAMANA WCZESNIEJ I DLATEGO OPISANA TU WPROST.
// Kiedy klient wgral plik, cena MUSI wynikac z jego geometrii, a nie
// z przedzialu wielkosci. Wczesniej bylo odwrotnie: kalkulator liczyl
// objetosc i wymiary, pokazywal je na ekranie, a potem je wyrzucal i bral
// cene z kafelka "jak duze". Dla plaskiej plyty 30 x 2 x 14 cm dawalo to
// 187 do 374 zl zamiast 36 do 71 zl, bo przedzial "pudelko po butach"
// zaklada bryle wypelniajaca pudelko, a nie deske. Klient widzial kwote
// piec razy za wysoka i wychodzil, a nikomu nic sie nie wywalilo.
//
// Przedzialy wielkosci zostaja, ale tylko dla tych, ktorzy pliku nie maja.

import { calculate as calcPrint3D, calculateMSLA } from "./print3d.js";
import { calcEngrave as calcCO2Engrave, calcCut as calcCO2Cut, ENGRAVE_MATERIALS, CUT_MATERIALS } from "./laserCo2.js";
import { calculate as calcFiber, MATERIALS as FIBER_MATERIALS } from "./laserFiber.js";
import { calculate as calcEpoxy } from "./epoxy.js";

/**
 * Material wybrany przez klienta, ale TYLKO jesli nalezy do listy tej
 * technologii. Wybor zrobiony przy grawerowaniu nie moze wyciec do ciecia,
 * bo silnik nie zna takiego identyfikatora i po cichu policzylby cos innego
 * albo nic. Sprawdzamy to tutaj, a nie w widoku, zeby zaden przyszly
 * wywolujacy nie mogl tego obejsc.
 */
const zListy = (id, lista) => (id && lista.some((m) => m.id === id && !m.custom) ? id : null);

export const TECH_FROM_MATERIAL = {
  plastic: "3dprint",
  wood:    "co2",
  metal:   "fiber",
  glass:   "co2",
  resin:   "epoxy",
};

export const DEFAULT_TECH_FROM_ITEM = {
  keychain: "3dprint",
  sign:     "co2",
  figurine: "3dprint",
  figurine_msla: "msla",
  stamp:    "co2",
  gift:     "co2",
  part:     "3dprint",
  jewelry:  "fiber",
};

// coin/palm/book mieszcza sie na plycie Saturn 4 Ultra (21.8 x 12.3 x 25.0 cm);
// box/bigger (powyzej 25 cm) juz nie, wiec ida do wyceny indywidualnej.
export const SIZE_MAP = {
  coin:   { "3dprint": "XS", co2: "XS", fiber: "XS", epoxy: "XS", msla: "XS" },
  palm:   { "3dprint": "S",  co2: "S",  fiber: "S",  epoxy: "S",  msla: "S"  },
  book:   { "3dprint": "M",  co2: "M",  fiber: "M",  epoxy: "M",  msla: "L"  },
  box:    { "3dprint": "L",  co2: "L",  fiber: "L",  epoxy: "L"  },
  bigger: { "3dprint": "XL", co2: "XL", fiber: "XL", epoxy: "XL" },
};

export const QTY_MAP = { one: "proto", few: "micro", many: "medium", lots: "large" };

export const CO2_MODE_FROM_ITEM = {
  keychain: "cut",
  sign:     "engrave",
  figurine: "cut",
  stamp:    "engrave",
  gift:     "engrave",
  part:     "cut",
  jewelry:  "engrave",
};

/**
 * Odpowiedzi trybu uproszczonego na technologie i parametry.
 *
 * `stlData` i `svgData` maja byc podane JUZ W SKALI WYKONANIA (patrz
 * `scaleGeometry.js`). Ida do kalkulatorow bez zmian, bo to one, a nie
 * przedzial wielkosci, wyznaczaja cene, gdy plik istnieje.
 *
 * `printTech` pozwala policzyc TE SAME odpowiedzi druga technologia druku.
 * Bez niego wybor plastiku zawsze konczyl sie filamentem, a zywica byla
 * osiagalna wylacznie przez kafelek "Figurka z zywicy" i wylacznie bez pliku.
 * Klient, ktory wgral miniaturke, nie mial jak zobaczyc ceny za wydruk
 * zywiczny, mimo ze to wlasnie ta technologia mu odpowiadala.
 *
 * @param {"fdm"|"msla"} [printTech] wymuszona technologia druku
 * @param {"cut"|"engrave"} [co2Mode] wymuszony tryb lasera CO2. Bez niego tryb
 *        wynika z przedmiotu (CO2_MODE_FROM_ITEM), wiec klient, ktory wgral
 *        rysunek, nie mial jak zobaczyc, ile kosztowalby ten sam plik ciety
 *        zamiast grawerowanego, a roznica bywa kilkukrotna.
 * @returns {{tech: string, mode?: string, params: object} | {custom: true}}
 */
/**
 * `stockId` to material WYBRANY PRZEZ KLIENTA z naszego magazynu.
 *
 * Bez niego szybka wycena zgadywala material za niego: sklejka 3 mm przy
 * cieciu, drewno przy grawerze, stal przy fiberze. Klient, ktory chcial akryl
 * 5 mm, nie mial jak tego powiedziec, a mimo to dostawal kwote wiazaca.
 * Zgadniete pozostaje domyslna, gdy nikt nic nie wybral.
 */
export function resolveTechAndParams({ item, size, material, finish, quantity, fileType, stlData, svgData, printTech, co2Mode, stockId }) {
  // Model 3D: druk (plastik) albo odlew z zywicy
  if (fileType === "stl" && stlData) {
    if (!size || !material || !finish || !quantity) return { custom: true };
    const quantityId = QTY_MAP[quantity];

    if (material === "resin") {
      // Odlew liczy sie z objetosci formy, a nie z siatki, wiec geometrii tu
      // nie podajemy: silnik zywicy jej nie przyjmuje. Przedzial zostaje.
      return {
        tech: "epoxy", params: {
          resinId: finish === "prototype" ? "uv" : "epoxy_clear",
          volumeId: SIZE_MAP[size].epoxy,
          moldId: quantity === "one" ? "existing" : "new_s",
          inclusionId: "none",
          finishId: finish === "prototype" ? "raw" : finish === "premium" ? "coated" : "sanded",
          quantityId,
        },
      };
    }

    if (printTech === "msla") {
      const p = mslaParams({ item, size, finish, quantity, stlData });
      return p ? { tech: "msla", params: p } : { custom: true };
    }

    const sizeId = SIZE_MAP[size]["3dprint"];
    const isEngineering = item === "part" && (finish === "premium" || finish === "standard");
    const segment = isEngineering ? "engineering" : "standard";
    const materialKey = segment === "engineering"
      ? (finish === "premium" ? "PPA-CF" : "PA6-CF")
      : (finish === "premium" ? "PLA Silk" : "PLA");
    return {
      tech: "3dprint", params: {
        segment, materialKey,
        sizeId,
        infillId: finish === "prototype" ? "low" : "medium",
        colorId: 1,
        precisionId: finish === "prototype" ? "draft_04" : finish === "premium" ? "quality_04" : "standard_04",
        quantityId,
        stlData,
      },
    };
  }

  // Rysunek wektorowy: CO2 albo laser swiatlowodowy, zaleznie od materialu
  if (fileType === "svg" && svgData) {
    if (!size || !material || !finish || !quantity) return { custom: true };
    const tech = material === "idk" ? (DEFAULT_TECH_FROM_ITEM[item] || "co2") : TECH_FROM_MATERIAL[material];
    if (!tech || tech === "epoxy") return { custom: true };
    const quantityId = QTY_MAP[quantity];
    const sizeId = SIZE_MAP[size][tech] || SIZE_MAP[size].co2;

    if (tech === "3dprint" || tech === "co2") {
      const mode = co2Mode || CO2_MODE_FROM_ITEM[item] || "engrave";
      if (mode === "engrave") {
        const matId = tech === "3dprint"
          ? "wood"
          : material === "glass" ? "glass" : material === "wood" ? "wood" : item === "stamp" ? "rubber" : "wood";
        return { tech: "co2", mode, params: { matId: zListy(stockId, ENGRAVE_MATERIALS) || matId, areaId: sizeId, detailId: finish === "prototype" ? "simple" : finish === "premium" ? "photo" : "standard", quantityId, extended: false, svgData } };
      }
      const matId = tech === "3dprint"
        ? "ply3"
        : material === "glass" ? "acr3" : finish === "premium" ? "ply56" : "ply3";
      return { tech: "co2", mode, params: { matId: zListy(stockId, CUT_MATERIALS) || matId, pathId: sizeId, complexId: finish === "prototype" ? "simple" : finish === "premium" ? "complex" : "moderate", quantityId, extended: false, svgData } };
    }

    if (tech === "fiber") {
      if (material === "glass") {
        return resolveTechAndParams({ item, size, material: "wood", finish, quantity, fileType, svgData });
      }
      const matId = item === "jewelry" ? "silver" : "stainless";
      const lensId = (size === "coin") ? "70mm" : "150mm";
      return { tech, params: { matId: zListy(stockId, FIBER_MATERIALS) || matId, lensId, markId: finish === "prototype" ? "surface" : finish === "premium" ? "medium" : "surface", areaId: sizeId, quantityId, svgData } };
    }

    return { custom: true };
  }

  // Bez pliku: cena z przedzialow, bo nic dokladniejszego nie mamy
  if (!item || item === "other" || !size || !material || !finish || !quantity) {
    return { custom: true };
  }

  // Figurka z zywicy MSLA: technologia jest ustalona niezaleznie od materialu
  if (item === "figurine_msla" && printTech !== "fdm") {
    const mslaSizeId = SIZE_MAP[size]?.msla;
    if (!mslaSizeId) return { custom: true };
    return {
      tech: "msla", params: {
        applicationId: "figurine",
        resinKey: finish === "premium" ? "high_precision" : "standard",
        layerId: finish === "premium" ? "quality" : "standard",
        sizeId: mslaSizeId,
        quantityId: QTY_MAP[quantity],
      },
    };
  }

  const tech = material === "idk" ? DEFAULT_TECH_FROM_ITEM[item] : TECH_FROM_MATERIAL[material];
  if (!tech) return { custom: true };

  const sizeId = SIZE_MAP[size][tech];
  const quantityId = QTY_MAP[quantity];

  if (tech === "3dprint") {
    if (printTech === "msla") {
      const p = mslaParams({ item, size, finish, quantity });
      return p ? { tech: "msla", params: p } : { custom: true };
    }
    const isEngineering = item === "part" && (finish === "premium" || finish === "standard");
    const segment = isEngineering ? "engineering" : "standard";
    const materialKey = segment === "engineering"
      ? (finish === "premium" ? "PPA-CF" : "PA6-CF")
      : (finish === "premium" ? "PLA Silk" : "PLA");
    return {
      tech, params: {
        segment, materialKey,
        sizeId,
        infillId: finish === "prototype" ? "low" : "medium",
        colorId: 1,
        precisionId: finish === "prototype" ? "draft_04" : finish === "premium" ? "quality_04" : "standard_04",
        quantityId,
      },
    };
  }

  if (tech === "co2") {
    const mode = co2Mode || CO2_MODE_FROM_ITEM[item] || "engrave";
    if (mode === "engrave") {
      const matId = material === "glass" ? "glass" : material === "wood" ? "wood" :
                    item === "stamp" ? "rubber" : "wood";
      return {
        tech, mode, params: {
          matId, areaId: sizeId,
          detailId: finish === "prototype" ? "simple" : finish === "premium" ? "photo" : "standard",
          quantityId, extended: false,
        },
      };
    }
    const matId = material === "glass" ? "acr3" :
                  finish === "premium" ? "ply56" : "ply3";
    return {
      tech, mode, params: {
        matId, pathId: sizeId,
        complexId: finish === "prototype" ? "simple" : finish === "premium" ? "complex" : "moderate",
        quantityId, extended: false,
      },
    };
  }

  if (tech === "fiber") {
    if (material === "glass") {
      return resolveTechAndParams({ item, size, material: "wood", finish, quantity });
    }
    const matId = item === "jewelry" ? "silver" : "stainless";
    const fiberSize = SIZE_MAP[size].fiber;
    const lensId = (size === "coin") ? "70mm" : "150mm";
    return {
      tech, params: {
        matId, lensId,
        markId: finish === "prototype" ? "surface" : finish === "premium" ? "medium" : "surface",
        areaId: fiberSize,
        quantityId,
      },
    };
  }

  if (tech === "epoxy") {
    return {
      tech, params: {
        resinId: finish === "prototype" ? "uv" : "epoxy_clear",
        volumeId: sizeId,
        moldId: quantity === "one" ? "existing" : "new_s",
        inclusionId: "none",
        finishId: finish === "prototype" ? "raw" : finish === "premium" ? "coated" : "sanded",
        quantityId,
      },
    };
  }

  return { custom: true };
}

/**
 * Parametry MSLA dla tych samych odpowiedzi, ktore normalnie ida na filament.
 * Zastosowanie wyprowadzamy z przedmiotu, bo od niego zalezy zapas zywicy i
 * kontrola jakosci: figurka to inna sprawa niz wzorzec odlewniczy.
 */
function mslaParams({ item, size, finish, quantity, stlData }) {
  const applicationId = item === "jewelry" ? "casting" : item === "figurine" || item === "figurine_msla" ? "figurine" : "prototype";
  const sizeId = stlData ? null : SIZE_MAP[size]?.msla;
  if (!stlData && !sizeId) return null;
  return {
    applicationId,
    resinKey: finish === "premium" ? "high_precision" : "standard",
    layerId: finish === "premium" ? "quality" : "standard",
    ...(stlData ? { stlData } : { sizeId }),
    quantityId: QTY_MAP[quantity],
  };
}

/** Uruchamia silnik wyceny wskazany przez `resolveTechAndParams`. */
export function runCalc(resolved, lang) {
  if (!resolved || resolved.custom) return { type: "custom" };
  const { tech, mode, params } = resolved;
  if (tech === "3dprint") return calcPrint3D(params, lang);
  if (tech === "co2")     return mode === "cut" ? calcCO2Cut(params, lang) : calcCO2Engrave(params, lang);
  if (tech === "fiber")   return calcFiber(params, lang);
  if (tech === "epoxy")   return calcEpoxy(params, lang);
  if (tech === "msla")    return calculateMSLA(params, lang);
  return null;
}
