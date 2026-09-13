// ============================================================
// PRZYJECIE MODELU KLIENTA DO ODLEWU: bramka trzech poziomow
// ============================================================
// Odpowiada na trzy rozne pytania i nie miesza ich ze soba:
//
//   blokady      czego NIE DA SIE odlac albo czego nie wiemy, a musimy wiedziec
//   ostrzezenia  co odlejemy, ale bez obietnicy, i co ma trafic do podsumowania
//   przeliczenie co dokladnie zrobimy z wymiarem, zanim plik pojdzie do druku
//
// Bramka stoi po stronie SERWERA, na geometrii policzonej z wgranego pliku.
// Geometria przyslana przez przegladarke jest kasowana przy wycenie, wiec
// wynik tego modulu jest jedynym, ktory wiaze. Te sama funkcje wola ekran,
// zeby klient zobaczyl to samo zdanie przed zlozeniem zamowienia, a nie po.
//
// PRZECIWIENSTWEM tej bramki jest cicha poprawka. Kazda rzecz, ktorej nie
// wolno zrobic bez pytania (roztoczenie otworu, przeskalowanie modelu, ktory
// juz ktos przeskalowal) konczy sie tutaj blokada z nazwa, a nie korekta.
import {
  kategoriaZOtworem,
  MIN_GRUBOSC_MM,
  MIERZONA_CECHA,
  NADDATKI_MM,
  naddatekZewnetrzny,
  skurczKruszcu,
  stopDlaKruszcu,
  przeliczWymiar,
  roznicaSkurczu,
  PROG_ROZBIEZNOSCI_OTWORU_MM,
} from "../data/castingSpec.js";
import { CASTING_ALLOYS } from "../data/castingAlloys.js";
import { fitsCastingFlask, CASTING_ENVELOPE_LABEL } from "./preciousMetalCasting.js";
import { t } from "./config.js";

const L = (pl, en, de) => ({ pl, en, de });

// Objetosc, powyzej ktorej sam kruszec robi sie glownym skladnikiem rachunku
// i warto, zeby klient spojrzal na kwote, zanim zaplaci. To nie jest blokada:
// duzy odlew jest wykonalny, tylko drogi.
const OBJETOSC_DO_SPRAWDZENIA_CM3 = 10;

// Granica, powyzej ktorej pomiar grubosci jest pomijany, stoi tam, gdzie sie
// mierzy, czyli w `chat-api/orders.js`. Tutaj czytamy tylko `thicknessSkipped`,
// bo bramce wystarczy wiedziec, ze pomiaru NIE BYLO.

/**
 * Blokady, ostrzezenia i przeliczenie dla jednej pozycji odlewu z pliku.
 *
 * @param {object} params  wybory klienta z kreatora
 * @param {object} geometry  geometria policzona z pliku na serwerze
 * @param {string} lang
 */
export function sprawdzModelDoOdlewu(params = {}, geometry = null, lang = "pl") {
  const blokady = [];
  const ostrzezenia = [];

  const zPlikiem = params.variantId === "model_3d";
  if (!zPlikiem) return { blokady, ostrzezenia, przeliczenie: null, dotyczy: false };

  const kruszec = params.metalId;
  const stop = stopDlaKruszcu(kruszec);

  // ------------------------------------------------------------
  // 1. Czy w ogole wiemy, co odlewamy
  // ------------------------------------------------------------
  if (kruszec && !stop) {
    // Platyny i palladu nie ma na liscie kruszcow, wiec ta galaz nie moze sie
    // dzis zapalic z ekranu. Zostaje, bo lista kruszcow bywa rozszerzana, a
    // tabela skurczu nie musi za nia nadazyc w tym samym commicie.
    blokady.push({
      id: "metal_bez_skurczu",
      tekst: L(
        "Tego kruszcu nie odlewamy z pliku klienta. Odlewamy srebro 800 i 925 oraz złoto 9K, 14K i 18K.",
        "We do not cast this metal from a customer file. We cast silver 800 and 925, and gold 9K, 14K and 18K.",
        "Dieses Metall gießen wir nicht aus Kundendateien. Wir gießen Silber 800 und 925 sowie Gold 9K, 14K und 18K."
      ),
    });
  }

  // BRAK ODPOWIEDZI NIE JEST TU BLOKADA, i to jest celowe. Pytania o rodzaj
  // wyrobu, o stan pliku, o stop kompensacji i o srednice otworu sa na liscie
  // `CASTING_REQUIRED` w `preciousMetalCasting.js`: bez nich wycena nie
  // powstaje w ogole i klient czyta jedno zdanie o tym, czego brakuje.
  // Powtorzenie ich tutaj dawaloby dwa rozne komunikaty o jednym stanie.
  const stan = params.modelStanId;
  const skompensowanyDla = stan === "compensated" ? params.modelStopId : null;

  // Klient przeskalowal dla innego stopu, niz zamawia. Nie jest to blad, tylko
  // rzecz, ktora trzeba powiedziec wprost, bo poprawiamy plik po cichu tylko
  // wtedy, gdy klient wie, ze poprawiamy.
  const roznica = roznicaSkurczu(kruszec, skompensowanyDla);
  if (roznica) {
    ostrzezenia.push({
      id: "inny_stop_kompensacji",
      wartosc: roznica,
      tekst: L(
        `Model jest powiększony dla innego stopu, niż zamawiasz. Doskalujemy różnicę, mnożnik ${roznica.toFixed(4)}.`,
        `The model is scaled for a different alloy than you ordered. We will add the difference, factor ${roznica.toFixed(4)}.`,
        `Das Modell ist für eine andere Legierung skaliert als bestellt. Wir ergänzen die Differenz, Faktor ${roznica.toFixed(4)}.`
      ),
    });
  }

  // ------------------------------------------------------------
  // 3. Plik: szczelnosc, liczba bryl, gabaryt, grubosc
  // ------------------------------------------------------------
  if (geometry) {
    if (geometry.watertight === false) {
      blokady.push({
        id: "nieszczelny",
        wartosc: geometry.boundaryEdges,
        tekst: L(
          "Model ma otwarte krawędzie i nie da się go odlać. Napraw siatkę albo zamów u nas naprawę pliku.",
          "The model has open edges and cannot be cast. Repair the mesh, or order a file repair from us.",
          "Das Modell hat offene Kanten und lässt sich nicht gießen. Reparieren Sie das Netz oder bestellen Sie die Dateireparatur bei uns."
        ),
      });
    }

    if (geometry.solids > 1) {
      blokady.push({
        id: "kilka_bryl",
        wartosc: geometry.solids,
        tekst: L(
          `Plik zawiera ${geometry.solids} osobne bryły. Złóż je działaniem Boolean Union, bo wnętrze w miejscu przenikania jest niezdefiniowane.`,
          `The file holds ${geometry.solids} separate solids. Merge them with a boolean union: where they interpenetrate, the interior is undefined.`,
          `Die Datei enthält ${geometry.solids} getrennte Körper. Vereinigen Sie sie mit Boolean Union, denn im Durchdringungsbereich ist das Innere undefiniert.`
        ),
      });
    }

    if (geometry.bbox && !fitsCastingFlask(geometry.bbox, Number(params.scale) || 1)) {
      blokady.push({
        id: "za_duzy",
        tekst: L(
          `Model przekracza światło kolby (${CASTING_ENVELOPE_LABEL}). Przejdź do wyceny indywidualnej.`,
          `The model exceeds the flask envelope (${CASTING_ENVELOPE_LABEL}). Please move to an individual quote.`,
          `Das Modell überschreitet den Küvettenraum (${CASTING_ENVELOPE_LABEL}). Bitte wechseln Sie zur Einzelkalkulation.`
        ),
      });
    }

    const prog = MIN_GRUBOSC_MM[MIERZONA_CECHA];
    const cienka = Number(geometry.thinnestMm);
    // Brak liczby znaczy to samo, co pominiety pomiar, i ma sie tak samo
    // czytac. Plik wgrany przed 13 wrzesnia 2026 nie ma zmierzonej grubosci,
    // a wiersze w bazie zyja 30 dni: bez tego warunku taka pozycja
    // przechodzilaby przez bramke w ciszy, czyli udawala sprawdzona.
    if (geometry.thicknessSkipped || !Number.isFinite(cienka)) {
      ostrzezenia.push({
        id: "grubosc_niesprawdzona",
        tekst: L(
          "Siatka jest zbyt gęsta, żeby zmierzyć grubość automatycznie. Sprawdzimy ją ręcznie przed odlewem.",
          "The mesh is too dense to measure thickness automatically. We will check it by hand before casting.",
          "Das Netz ist zu dicht für eine automatische Wandstärkenmessung. Wir prüfen sie vor dem Guss von Hand."
        ),
      });
    } else {
      if (cienka < prog.min) {
        blokady.push({
          id: "za_cienko",
          wartosc: cienka,
          tekst: L(
            `Najcieńsza ścianka ma ${cienka.toFixed(2)} mm. Poniżej ${prog.min.toFixed(2)} mm odlew się nie wypełni.`,
            `The thinnest wall is ${cienka.toFixed(2)} mm. Below ${prog.min.toFixed(2)} mm the casting will not fill.`,
            `Die dünnste Wand misst ${cienka.toFixed(2)} mm. Unter ${prog.min.toFixed(2)} mm füllt sich der Guss nicht.`
          ),
        });
      } else if (cienka < prog.pewne) {
        ostrzezenia.push({
          id: "cienko",
          wartosc: cienka,
          tekst: L(
            `Najcieńsza ścianka ma ${cienka.toFixed(2)} mm. Odlejemy, ale przy tej grubości nie gwarantujemy pełnego odwzorowania.`,
            `The thinnest wall is ${cienka.toFixed(2)} mm. We will cast it, but at this thickness we cannot guarantee full reproduction.`,
            `Die dünnste Wand misst ${cienka.toFixed(2)} mm. Wir gießen es, garantieren bei dieser Stärke aber keine vollständige Abformung.`
          ),
        });
      }
    }

    const objetosc = Number(geometry.volumeCm3);
    if (Number.isFinite(objetosc) && objetosc > OBJETOSC_DO_SPRAWDZENIA_CM3) {
      ostrzezenia.push({
        id: "duza_objetosc",
        wartosc: objetosc,
        tekst: L(
          `Model ma ${objetosc.toFixed(1)} cm³, więc kruszec będzie głównym składnikiem ceny. Sprawdź kwotę przed potwierdzeniem.`,
          `The model is ${objetosc.toFixed(1)} cm³, so metal will dominate the price. Check the amount before you confirm.`,
          `Das Modell hat ${objetosc.toFixed(1)} cm³, das Metall bestimmt also den Preis. Prüfen Sie den Betrag vor der Bestätigung.`
        ),
      });
    }

    if (geometry.reversedFaces > 0) {
      ostrzezenia.push({
        id: "odwrocone_scianki",
        wartosc: geometry.reversedFaces,
        tekst: L(
          "Część ścianek jest zwrócona do wewnątrz. Poprawimy je przed drukiem, ale sprawdź, czy model wygląda tak, jak chcesz.",
          "Some faces point inwards. We will fix them before printing, but please check the model looks the way you want.",
          "Einige Flächen zeigen nach innen. Wir korrigieren das vor dem Druck, prüfen Sie aber, ob das Modell so aussieht wie gewollt."
        ),
      });
    }
  }

  // ------------------------------------------------------------
  // 4. Otwor na palec
  // ------------------------------------------------------------
  const zOtworem = kategoriaZOtworem(params.wyrobId);
  const podanyOtwor = Number(params.otworMm);
  const zmierzony = geometry && geometry.hole ? Number(geometry.hole.diameterMm) : null;

  if (zOtworem && !(Number.isFinite(podanyOtwor) && podanyOtwor > 0)) {
    blokady.push({
      id: "brak_otworu",
      tekst: L(
        "Podaj średnicę otworu w gotowym wyrobie. Bez niej nie wiemy, na czyj palec to ma wejść.",
        "Give the finished inner diameter. Without it we do not know whose finger this has to fit.",
        "Geben Sie den fertigen Innendurchmesser an. Sonst wissen wir nicht, auf welchen Finger es passen soll."
      ),
    });
  }

  if (zOtworem && Number.isFinite(podanyOtwor) && podanyOtwor > 0) {
    if (zmierzony == null) {
      ostrzezenia.push({
        id: "otwor_niezmierzony",
        tekst: L(
          "Nie udało się zmierzyć otworu w pliku, więc porównamy go ręcznie z podanym rozmiarem przed drukiem.",
          "We could not measure the hole in the file, so we will compare it with your size by hand before printing.",
          "Die Bohrung ließ sich in der Datei nicht messen, wir vergleichen sie vor dem Druck von Hand mit Ihrer Größe."
        ),
      });
    } else {
      // Otwor w pliku porownujemy z tym, czym plik MA BYC wedlug deklaracji.
      // Przy pliku juz powiekszonym o skurcz otwor jest wiekszy od docelowego
      // wlasnie o ten skurcz, wiec porownanie wprost zglaszaloby rozjazd tam,
      // gdzie wszystko sie zgadza.
      const skurczKlienta = skompensowanyDla ? CASTING_ALLOYS[skompensowanyDla]?.shrink : null;
      const naddatekWPliku = params.otworWPlikuId === "withAllowance" ? NADDATKI_MM.otwor : 0;
      const oczekiwany = (podanyOtwor - naddatekWPliku) * (skurczKlienta || 1);
      const roznicaMm = Math.abs(zmierzony - oczekiwany);
      if (roznicaMm > PROG_ROZBIEZNOSCI_OTWORU_MM) {
        blokady.push({
          id: "otwor_niezgodny",
          wartosc: roznicaMm,
          tekst: L(
            `Otwór w pliku ma ${zmierzony.toFixed(2)} mm, a z podanego rozmiaru wychodzi ${oczekiwany.toFixed(2)} mm. Roztoczenie otworu zabiera grubość szyny, więc nie poprawiamy tego bez rozmowy.`,
            `The hole in the file measures ${zmierzony.toFixed(2)} mm, while your size gives ${oczekiwany.toFixed(2)} mm. Opening the hole eats into the shank, so we will not change it without talking to you.`,
            `Die Bohrung in der Datei misst ${zmierzony.toFixed(2)} mm, aus Ihrer Größe ergeben sich ${oczekiwany.toFixed(2)} mm. Das Aufweiten geht auf die Schienenstärke, das ändern wir nicht ohne Rücksprache.`
          ),
        });
      }
    }
  }

  // ------------------------------------------------------------
  // 5. Przeliczenie, ktore widzi klient
  // ------------------------------------------------------------
  const naddatek = zOtworem && params.otworWPlikuId !== "withAllowance" ? NADDATKI_MM.otwor : 0;
  const przeliczenie = zOtworem && Number.isFinite(podanyOtwor) && podanyOtwor > 0 && skurczKruszcu(kruszec)
    ? przeliczWymiar({
      docelowy: podanyOtwor,
      metalId: kruszec,
      naddatek,
      kierunek: "otwor",
      skompensowanyDla,
    })
    : null;

  return {
    dotyczy: true,
    blokady,
    ostrzezenia,
    przeliczenie,
    // Naddatek na powierzchni zewnetrznej nie zmienia wymiaru, ktory podaje
    // klient, ale zmienia to, co robi warsztat, wiec jedzie z pozycja dalej.
    naddatekZewnetrznyMm: naddatekZewnetrzny(params.finishId, params.powierzchniaId === "zdobiona"),
  };
}

/** Same teksty, w jezyku klienta. Do ekranu, maila i podsumowania oferty. */
export function tekstyBramkiOdlewu(wynik, lang = "pl") {
  if (!wynik || !wynik.dotyczy) return { blokady: [], ostrzezenia: [] };
  return {
    blokady: wynik.blokady.map((b) => t(b.tekst, lang)),
    ostrzezenia: wynik.ostrzezenia.map((o) => t(o.tekst, lang)),
  };
}

/**
 * Wiersze bloku z przeliczeniem, gotowe do wyswietlenia.
 * Kolejnosc jest ta sama, co kolejnosc dzialan w warsztacie, bo blok ma
 * tlumaczyc, a nie tylko podawac wynik.
 */
export function wierszePrzeliczenia(przeliczenie, lang = "pl") {
  if (!przeliczenie) return [];
  const { docelowy, naddatek, przedSkurczem, skurcz, skurczKlienta, korekta, model, etykietaStopu } = przeliczenie;
  const mm = (v) => `${v.toFixed(2)} mm`;
  const wiersze = [
    { etykieta: L("Twój wymiar docelowy", "Your finished dimension", "Ihr Fertigmaß"), wartosc: mm(docelowy) },
  ];
  if (naddatek > 0) {
    wiersze.push({
      etykieta: L("Naddatek na szlif otworu", "Allowance for the inner grind", "Aufmaß für den Innenschliff"),
      wartosc: `-${naddatek.toFixed(2)} mm`,
    });
    wiersze.push({
      etykieta: L("Otwór przed skurczem", "Hole before shrinkage", "Bohrung vor Schwund"),
      wartosc: mm(przedSkurczem),
    });
  }
  wiersze.push({
    etykieta: L(
      `Skurcz ${t(etykietaStopu, lang)}`,
      `Shrinkage ${t(etykietaStopu, lang)}`,
      `Schwund ${t(etykietaStopu, lang)}`
    ),
    wartosc: `x ${skurcz.toFixed(4)}`,
  });
  if (skurczKlienta) {
    wiersze.push({
      etykieta: L("Skurcz już w Twoim pliku", "Shrinkage already in your file", "Schwund bereits in Ihrer Datei"),
      wartosc: `x ${skurczKlienta.toFixed(4)}`,
    });
    wiersze.push({
      etykieta: L("Doskalujemy o", "We rescale by", "Wir skalieren um"),
      wartosc: `x ${korekta.toFixed(4)}`,
    });
  }
  wiersze.push({
    etykieta: L("Model, który wydrukujemy", "The model we will print", "Das Modell, das wir drucken"),
    wartosc: mm(model),
    wynik: true,
  });
  wiersze.push({
    etykieta: L("Wyrób po obróbce", "Piece after finishing", "Stück nach der Bearbeitung"),
    wartosc: mm(docelowy),
    wynik: true,
  });
  return wiersze.map((w) => ({ ...w, etykieta: t(w.etykieta, lang) }));
}

export const CASTING_INTAKE_BUILD = "1.000";
