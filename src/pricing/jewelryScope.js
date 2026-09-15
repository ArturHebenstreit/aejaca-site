// ============================================================
// ZAKRES WYROBU NA ZAMOWIENIE
// ============================================================
// Ten plik odpowiada na jedno pytanie: CZY WIEMY JUZ DOSC, zeby obiecac cene
// za bizuterie robiona na zamowienie (`jewelry_new`).
//
// Powod, dla ktorego powstal, jest konkretny. 13 wrzesnia 2026 przyszlo
// zapytanie z Niemiec: wisiorek z kamieniem, wlasny render klienta, prosba
// o kaboszon albo rozetke, trzy oprawy i dwa wykonczenia powierzchni.
// Kalkulator pokazal 684 do 901 EUR za sztuke. Prawdziwa robota to 1100 do
// 1450 EUR. Zaden z parametrow, ktore o tym decyduja, nie mial gdzie wejsc.
//
// Trzy rzeczy przechodzily przez wycene niezauwazone:
//
//   1. CZYJ TO PROJEKT. `bindingBasis.js` dzieli swiat wedlug tego, kto
//      decyduje o ksztalcie: nasz katalog daje cene wiazaca, ksztalt klienta
//      daje szacunek. Bizuteria na zamowienie stala po stronie katalogu, choc
//      nie miala pola, w ktorym klient moze powiedziec "to moj rysunek".
//   2. CO JEST W TYM WYROBIE. Azur, filigran, wiecej niz dwie oprawy, dwa
//      wykonczenia powierzchni na jednej bryle. Kazda z tych rzeczy to godziny,
//      ktorych nie widac w zadnym parametrze cennika.
//   3. JAKI TO MA ROZMIAR. Masa szla ze stalej katalogowej (wisiorek: 4 g),
//      a nie z wymiarow. Wisiorek 30 x 20 x 4 mm w srebrze wazy okolo 14 g,
//      czyli trzy i pol raza wiecej. Kalkulator liczyl juz wtedy mase
//      z wymiarow i pokazywal ja na ekranie, ale do koszyka i na serwer ta
//      liczba nie jechala: zamowienie wyceniala stala katalogowa.
//
// Regula jest wiec taka: KWOTA WIAZACA WYMAGA KOMPLETU WIEDZY. Projekt nasz,
// wymiary podane, zadnej cechy, ktorej cennik nie umie policzyc. Wszystko
// inne jest SZACUNKIEM i idzie do czlowieka. Szacunku nikomu nie odbieramy:
// klient dalej widzi widelki i dalej moze wyslac zapytanie.
//
// Plik jest lustrzany do `chat-api/pricing/` przez `npm run sync:pricing`,
// bo tej samej reguly musi pilnowac przegladarka (zeby wyjasnic, czego
// brakuje) i serwer (zeby odmowic przyjecia zamowienia, gdy formularz
// zostanie ominiety). Sam formularz da sie ominac, kasy nie.

import { getProductType, getRingInnerDiameter } from "./jewelryProductConfig.js";
// Lista rodzajow liczonych ze splotu stoi w konfiguracji jubilerskiej i tam
// zostaje: druga kopia tutaj rozjechalaby sie przy pierwszym nowym splocie.
import { isChainType, gestoscKruszcu } from "./jewelryConfig.js";
import { calcWeight } from "./weightEngine.js";

/**
 * Rodzaj wyrobu z katalogu jubilerskiego przelozony na bryle, ktora umie
 * policzyc `weightEngine`. `null` znaczy, ze dla tego rodzaju nie mamy modelu
 * masy: lancuch liczy sie ze splotu, a spinka czy zawleczka to drobiazg,
 * ktorego bryly nie opisujemy.
 *
 * Mapa stala do 14 wrzesnia 2026 w `JewelryCalc.jsx`, czyli w przegladarce.
 * Serwer, ktory wystawia kwote wiazaca, nie mial do niej dostepu.
 */
export const FORMA_WYROBU = {
  ring: "ring",
  bracelet: "bracelet",
  pendant: "pendant",
  earrings: "earrings",
  brooch: "brooch",
  necklace: null,
  signet: "signet",
  medallion: "pendant",
  bracelet_m: "bracelet",
  cufflinks: null,
  tie_clip: null,
  chain_m: null,
  tag: "pendant",
  charm: "pendant",
  pin: null,
  wedding_ring_w: "wedding_ring",
  wedding_ring_m: "wedding_ring",
};

/**
 * CZYJ TO PROJEKT. Jedno pytanie, dwie odpowiedzi, bez wartosci domyslnej.
 *
 * Podstawiona z gory odpowiedz "nasz katalog" znaczylaby, ze za klienta
 * przyjmujemy zalozenie, ktore w jego przypadku bywa nieprawdziwe, i to przy
 * parametrze rozstrzygajacym o tym, czy wolno nam obiecac cene.
 */
export const PROJEKT_WYROBU = [
  {
    id: "katalog",
    label: { pl: "Projekt z naszego katalogu", en: "Our catalogue design", de: "Entwurf aus unserem Katalog" },
    desc: {
      pl: "wybieram rodzaj, kruszec i wymiary z listy powyżej",
      en: "picking type, metal and dimensions from the list above",
      de: "Art, Metall und Maße aus der Liste oben",
    },
  },
  {
    id: "wlasny",
    label: { pl: "Mój własny projekt", en: "My own design", de: "Mein eigener Entwurf" },
    desc: {
      pl: "rysunek, render, zdjęcie albo model, który przyślę",
      en: "a drawing, render, photo or model I will send",
      de: "Zeichnung, Render, Foto oder Modell, das ich schicke",
    },
    needsQuote: true,
  },
];

/**
 * CO JEST W TYM WYROBIE. Lista rzeczy, ktorych cennik nie umie policzyc,
 * bo kazda z nich to godziny przy stole, a nie gram kruszcu.
 *
 * Pozycja `brak` istnieje po to, zeby ODPOWIEDZ PUSTA dala sie odroznic od
 * BRAKU ODPOWIEDZI. Bez niej klient, ktory pominie to pytanie, wygladalby
 * dokladnie tak samo jak klient, ktory swiadomie zamawia rzecz prosta, a to
 * wlasnie ta roznica decyduje o kwocie wiazacej.
 */
export const CECHY_WYROBU = [
  {
    id: "brak",
    label: { pl: "Nic z poniższych", en: "None of the below", de: "Nichts davon" },
    desc: {
      pl: "gładka bryła, jedno wykończenie, najwyżej dwie oprawy",
      en: "plain form, one finish, at most two settings",
      de: "glatte Form, ein Finish, höchstens zwei Fassungen",
    },
  },
  {
    id: "azur",
    label: { pl: "Ażur lub filigran", en: "Openwork or filigree", de: "Durchbruch oder Filigran" },
    desc: {
      pl: "wycinane prześwity, plecionka, koronka z drutu",
      en: "cut-out openings, weave, wire lace",
      de: "ausgeschnittene Öffnungen, Geflecht, Drahtspitze",
    },
    needsQuote: true,
  },
  {
    id: "oprawy",
    label: { pl: "Więcej niż dwie oprawy", en: "More than two settings", de: "Mehr als zwei Fassungen" },
    desc: {
      pl: "każda oprawa to osobne gniazdo i osobne osadzenie",
      en: "each setting is a seat of its own and a separate fitting",
      de: "jede Fassung ist ein eigener Sitz und ein eigenes Fassen",
    },
    needsQuote: true,
  },
  {
    id: "dwaWykonczenia",
    label: { pl: "Dwa wykończenia powierzchni", en: "Two surface finishes", de: "Zwei Oberflächen" },
    desc: {
      pl: "na przykład połysk i mat na jednej bryle, z granicą do wytyczenia",
      en: "polish and matte on one piece, with a border to mask",
      de: "Politur und Matt an einem Stück, mit abzugrenzender Kante",
    },
    needsQuote: true,
  },
  {
    id: "ruchome",
    label: { pl: "Elementy ruchome", en: "Moving parts", de: "Bewegliche Teile" },
    desc: {
      pl: "zawias, obrotowy element, zamknięcie robione na miarę",
      en: "a hinge, a turning part, a made-to-measure closure",
      de: "Scharnier, drehendes Teil, maßgefertigter Verschluss",
    },
    needsQuote: true,
  },
];

/** Czego brakuje do kwoty wiazacej przy bizuterii na zamowienie. */
export const BRAK_WYROBU = {
  PROJEKT: "projekt",   // nie wiadomo, czyj to ksztalt
  CECHY: "cechy",       // nie wiadomo, co jest w wyrobie
  WYMIARY: "wymiary",   // nie wiadomo, jaki jest duzy, wiec nie wiadomo, ile wazy
  ZAKRES: "zakres",     // wiadomo i to nie jest praca, ktora liczy cennik
};

/**
 * Zdania, ktorymi tlumaczymy klientowi brak kwoty. Stoja tutaj, a nie
 * w widoku, bo ten sam powod musza podac obie drogi do zamowienia
 * (kalkulator i karta uslugi w sklepie) oraz odpowiedz serwera.
 */
export const POWOD_TEKST = {
  [BRAK_WYROBU.PROJEKT]: {
    pl: "Zaznacz, czy to projekt z naszego katalogu, czy Twój własny.",
    en: "Tell us whether this is our catalogue design or your own.",
    de: "Sagen Sie uns, ob es ein Entwurf aus unserem Katalog oder Ihr eigener ist.",
  },
  [BRAK_WYROBU.CECHY]: {
    pl: "Zaznacz, co jest w tym wyrobie. Jeśli nic z listy, zaznacz pierwszą pozycję.",
    en: "Tick what this piece contains. If none of it applies, tick the first entry.",
    de: "Kreuzen Sie an, was dieses Stück enthält. Wenn nichts zutrifft, den ersten Eintrag.",
  },
  [BRAK_WYROBU.WYMIARY]: {
    pl: "Podaj wymiary wyrobu. Z nich liczy się masa kruszcu, a z niej cena.",
    en: "Give the dimensions. The metal mass comes from them, and the price from the mass.",
    de: "Geben Sie die Maße an. Daraus folgt die Metallmasse und daraus der Preis.",
  },
  [BRAK_WYROBU.ZAKRES]: {
    pl: "Taką pracę wycenia człowiek, bo jej ceny nie da się wyprowadzić z parametrów.",
    en: "This one is quoted by a person: its price does not follow from the parameters.",
    de: "Das kalkuliert ein Mensch: Der Preis folgt hier nicht aus den Parametern.",
  },
};

/**
 * O ktore wymiary pytamy przy danym rodzaju wyrobu.
 *
 * Lista idzie z katalogu bryl, a nie z osobnego spisu w kreatorze: gdyby
 * sygnet dostal kiedys szosty wymiar, kreator ma o niego zapytac sam, bez
 * czyjegokolwiek pamietania o drugim miejscu.
 */
export function polaWymiarow(typeId) {
  const forma = FORMA_WYROBU[String(typeId || "")] ?? null;
  const pt = forma ? getProductType(forma) : null;
  if (!pt) return [];
  return pt.fields.filter((f) => f.type === "ringSize" || f.type === "number").map((f) => f.id);
}

/**
 * Dlaczego ta pozycja idzie do czlowieka. Zdania stoja tutaj, a nie w widoku,
 * bo ten sam powod pokazuje kalkulator, karta uslugi w sklepie i koszyk.
 */
export const POWOD_WYCENY_TEKST = {
  lancuch: {
    pl: "Łańcuszek wyceniamy ze splotu, długości i grubości drutu, a nie z tych pól.",
    en: "A chain is priced from weave, length and wire gauge, not from these fields.",
    de: "Eine Kette kalkulieren wir aus Muster, Länge und Drahtstärke, nicht aus diesen Feldern.",
  },
  reczna: {
    pl: "Wykonanie ręczne wyceniamy indywidualnie. Wiążącą cenę podajemy przy odlewie, bo tam czas pracy jest powtarzalny.",
    en: "Hand fabrication is quoted individually. We commit to a price for casting, where the working time is repeatable.",
    de: "Handanfertigung kalkulieren wir individuell. Verbindlich wird der Preis beim Guss, wo die Arbeitszeit reproduzierbar ist.",
  },
  kamienie: {
    pl: "Wyrób z kamieniem wycenia człowiek: cena zależy od szlifu, od gniazda i od tego, jak kamień trzeba osadzić.",
    en: "A piece with a stone is quoted by a person: the price depends on the cut, the seat and how the stone has to be set.",
    de: "Ein Stück mit Stein kalkuliert ein Mensch: Preis abhängig von Schliff, Sitz und Fassart.",
  },
  kruszec_klienta: {
    pl: "Kruszec powierzony trzeba najpierw obejrzeć i zważyć, więc cena powstaje po oględzinach.",
    en: "Metal you supply has to be seen and weighed first, so the price comes after we look at it.",
    de: "Beigestelltes Metall muss erst gesichtet und gewogen werden, der Preis folgt danach.",
  },
  projekt_klienta: {
    pl: "Własny projekt wycenia człowiek, bo o nakładzie pracy decyduje rysunek, a nie lista opcji.",
    en: "Your own design is quoted by a person: the drawing decides the work, not a list of options.",
    de: "Einen eigenen Entwurf kalkuliert ein Mensch: die Zeichnung bestimmt den Aufwand, nicht eine Optionsliste.",
  },
  bez_bryly: {
    pl: "Dla tego rodzaju nie liczymy masy z wymiarów, więc cenę ustala człowiek.",
    en: "For this type we do not derive mass from dimensions, so a person sets the price.",
    de: "Für diese Art leiten wir die Masse nicht aus Maßen ab, den Preis setzt ein Mensch.",
  },
};

/** Jedno zdanie o jednym powodzie, takze o cesze wyrobu (`cecha:<id>`). */
export function opisPowodu(powod, lang = "pl") {
  const kod = String(powod || "");
  if (kod.startsWith("cecha:")) {
    const cecha = CECHY_WYROBU.find((c) => c.id === kod.slice(6));
    if (!cecha) return null;
    const nazwa = cecha.label[lang] || cecha.label.en;
    const ogon = {
      pl: "to godziny przy stole, których cennik nie liczy, więc wycenia je człowiek.",
      en: "means hours at the bench that the price list does not know, so a person quotes it.",
      de: "bedeutet Stunden an der Werkbank, die keine Preisliste kennt, das kalkuliert ein Mensch.",
    }[lang] || "is quoted by a person.";
    return `${nazwa}: ${ogon}`;
  }
  const tekst = POWOD_WYCENY_TEKST[kod];
  return tekst ? (tekst[lang] || tekst.en) : null;
}

/** Wszystkie powody jako lista zdan, bez powtorzen. */
export function opisPowodow(powody = [], lang = "pl") {
  const zdania = [];
  for (const p of powody) {
    const zdanie = opisPowodu(p, lang);
    if (zdanie && !zdania.includes(zdanie)) zdania.push(zdanie);
  }
  return zdania;
}

/** Klucz parametru, pod ktorym stoi jeden wymiar wyrobu. */
export function kluczWymiaru(idPola) {
  const id = String(idPola || "");
  return `wym${id.charAt(0).toUpperCase()}${id.slice(1)}`;
}

function liczba(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Rozmiar palca podany dwoma drogami sprowadzony do jednej.
 *
 * Kalkulator daje obiekt `{ system, value }`, bo klient wybiera z tabeli EU,
 * US, UK albo JP. Karta uslugi w sklepie ma tylko pole liczbowe, wiec daje
 * SAMA LICZBE, a ta znaczy srednice wewnetrzna w milimetrach. Bez tej funkcji
 * `weightEngine` uznalby liczbe 17 za rozmiar EU 17, czyli za pierscionek
 * dzieciecy: rozjazd nie rzuca bledu, tylko wychodzi w cenie i w rozmiarze.
 */
function rozmiarPalca(wartosc) {
  if (wartosc && typeof wartosc === "object" && wartosc.system) {
    const mm = getRingInnerDiameter(wartosc.system, wartosc.value);
    return Number.isFinite(mm) && mm > 0 ? { system: "mm", value: mm } : null;
  }
  const mm = liczba(wartosc);
  if (mm == null || mm < 10 || mm > 30) return null;
  return { system: "mm", value: mm };
}

/**
 * Wymiary wyrobu odczytane z parametrow pozycji.
 *
 * @returns {{forma: string, wymiary: object, braki: string[]}|null}
 *   `null`, gdy dla tego rodzaju nie mamy modelu masy (lancuch, spinka).
 *   `braki` wymienia pola, ktorych nie podano albo ktore wyszly poza zakres
 *   z `jewelryProductConfig.js`.
 */
export function wymiaryWyrobu(params = {}) {
  const forma = FORMA_WYROBU[String(params.typeId || "")] ?? null;
  if (!forma) return null;
  const pt = getProductType(forma);
  if (!pt) return null;

  const wymiary = {};
  const braki = [];
  for (const pole of pt.fields) {
    const wartosc = params[kluczWymiaru(pole.id)];
    if (pole.type === "ringSize") {
      const rozmiar = rozmiarPalca(wartosc);
      if (!rozmiar) { braki.push(pole.id); continue; }
      wymiary[pole.id] = rozmiar;
      continue;
    }
    if (pole.type === "number") {
      const n = liczba(wartosc);
      // POZA ZAKRESEM ZNACZY POZA KATALOGIEM. Wisiorek 200 mm wysokosci to nie
      // jest wisiorek z naszej listy, tylko osobna robota, wiec nie ma co
      // udawac, ze cennik go zna: idzie do czlowieka, a nie do kasy.
      if (n == null || n <= 0) { braki.push(pole.id); continue; }
      if (pole.min != null && n < pole.min) { braki.push(pole.id); continue; }
      if (pole.max != null && n > pole.max) { braki.push(pole.id); continue; }
      wymiary[pole.id] = n;
      continue;
    }
    // Styl bryly i para kolczykow zmieniaja wspolczynnik wypelnienia, ale
    // maja wartosc domyslna w katalogu bryl, wiec ich brak nie zatrzymuje
    // wyceny: bierzemy domyslna i liczymy dalej.
    if (wartosc !== undefined && wartosc !== null && wartosc !== "") wymiary[pole.id] = wartosc;
    else if (pole.default !== undefined) wymiary[pole.id] = pole.default;
  }
  return { forma, wymiary, braki };
}

/**
 * Masa netto wyrobu policzona z wymiarow, w gramach, albo `null`.
 *
 * `null` znaczy dokladnie tyle: nie wiemy. Wywolujacy ma wtedy zostac przy
 * stalej katalogowej i NIE wolno mu z tej ceny zrobic kwoty wiazacej,
 * o co dba `bindingBasis`.
 */
export function masaZWymiarow(params = {}, metalDensity, weightId = null) {
  const odczyt = wymiaryWyrobu(params);
  if (!odczyt || odczyt.braki.length) return null;
  const gestosc = Number(metalDensity);
  if (!Number.isFinite(gestosc) || gestosc <= 0) return null;
  const wynik = calcWeight(odczyt.forma, odczyt.wymiary, gestosc, weightId);
  const netto = Number(wynik?.nettoG);
  return Number.isFinite(netto) && netto > 0 ? netto : null;
}

/** Czy w pozycji siedzi jakikolwiek kamien. */
function maKamienie(params = {}) {
  const wiersze = Array.isArray(params.stoneRows) ? params.stoneRows : [];
  if (wiersze.some((r) => r?.gemId && r.gemId !== "none")) return true;
  // Karta uslugi w sklepie nie ma listy kamieni, tylko pojedyncze pola.
  if (params.gemId && params.gemId !== "none") return true;
  return Number(params.stoneCount) > 0;
}

/**
 * Czy dla tej pozycji wolno podac kwote wiazaca, a jesli nie, to dlaczego.
 *
 * Kolejnosc powodow jest zamierzona: najpierw to, o co nie zapytalismy
 * (klient ma co zrobic), potem to, o co zapytalismy i co samo w sobie
 * wyklucza cene z automatu (klient ma czekac na czlowieka).
 *
 * @returns {{wiazaca: boolean, braki: string[], powody: string[], masaG: number|null}}
 */
export function zakresWyrobu(params = {}, { metalDensity = null } = {}) {
  // Gestosc bierze sie z wybranego kruszcu, a podana z zewnatrz sluzy tylko
  // wywolaniom, ktore licza cos innego niz zamowiony metal.
  const gestosc = metalDensity || gestoscKruszcu(params.metalId);
  const braki = [];
  const powody = [];

  // 1. PRACA, KTOREJ TEN CENNIK NIE LICZY.
  if (isChainType(String(params.typeId || ""))) powody.push("lancuch");
  if (params.methodId && params.methodId !== "cast") powody.push("reczna");
  if (maKamienie(params)) powody.push("kamienie");
  if (params.clientSuppliesMetal) powody.push("kruszec_klienta");

  // 2. CZYJ PROJEKT.
  const projekt = String(params.projektId || "");
  if (!projekt) braki.push(BRAK_WYROBU.PROJEKT);
  else if (PROJEKT_WYROBU.find((p) => p.id === projekt)?.needsQuote) powody.push("projekt_klienta");

  // 3. CO JEST W WYROBIE.
  const cechy = Array.isArray(params.cechyWyrobu) ? params.cechyWyrobu : [];
  if (!cechy.length) braki.push(BRAK_WYROBU.CECHY);
  else {
    for (const c of cechy) {
      if (CECHY_WYROBU.find((x) => x.id === c)?.needsQuote) powody.push(`cecha:${c}`);
    }
  }

  // 4. WYMIARY, CZYLI MASA.
  const odczyt = wymiaryWyrobu(params);
  if (!odczyt) powody.push("bez_bryly");
  else if (odczyt.braki.length) braki.push(BRAK_WYROBU.WYMIARY);

  if (powody.length) braki.push(BRAK_WYROBU.ZAKRES);

  const masaG = powody.length ? null : masaZWymiarow(params, gestosc, params.weightId);
  return { wiazaca: braki.length === 0, braki, powody, masaG };
}

/**
 * Czy ta pozycja idzie do czlowieka zamiast do kasy.
 *
 * Uzywaja tego obie drogi w przegladarce, zeby przycisk "do koszyka" gasl
 * z tego samego powodu, dla ktorego odmawia serwer. Do 14 wrzesnia 2026 kazda
 * z nich miala wlasna liste warunkow, a serwer nie mial zadnej.
 */
export function wymagaWycenyCzlowieka(params = {}) {
  return zakresWyrobu(params).powody.length > 0;
}
