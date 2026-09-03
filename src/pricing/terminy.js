// ============================================================
// SZACOWANY CZAS REALIZACJI ZLECENIA
// ============================================================
// Wyrob na zamowienie nie lezy na polce, wiec klient musi wiedziec, ile
// czeka, ZANIM zaplaci. Do tej pory termin istnial tylko w ofercie
// wystawianej recznie (ADR-0027): pozycja niosla `lead_days`, zamowienie
// brało najdluzszy z wybranych, a panel i kolejka liczyly od tego zegar.
// Droga sklepowa nie miala tego wcale. Zamowienie zlozone koszykiem szlo do
// bazy z `lead_days` pustym, wiec kolejka nie wiedziala, na kiedy to ma byc,
// a klient nie wiedzial, na kiedy sie umowil.
//
// Ten plik jest JEDNYM ZRODLEM tej liczby dla obu stron: koszyk pokazuje
// z niego zdanie o terminie, a serwer zapisuje z niego `orders.lead_days`.
// Jedzie do `chat-api/pricing/` przez `npm run sync:pricing`, bo dwie kopie
// rozjechalyby sie przy pierwszej zmianie, a objawem bylby termin inny na
// ekranie niz w bazie.
//
// DNI SA KALENDARZOWE, tak jak w ADR-0027. Dni robocze odpadly swiadomie:
// kalendarz swiat to osobny problem.
//
// Polecenie wlasciciela (2026-09-03): kazdy produkt i kazda usluga na
// zamowienie podaje szacowany czas, domyslnie 7-14 dni; przy odlewach
// 7-14 dni; powloka galwaniczna dokłada 2 dni; termin ostateczny podajemy
// po weryfikacji zamowienia przez pracownie.

/** Zakres, ktorego uzywamy wszedzie tam, gdzie usluga nie mowi inaczej. */
export const TERMIN_DOMYSLNY = { min: 7, max: 14 };

/**
 * Terminy wlasne uslug, w dniach kalendarzowych.
 *
 * Wpisujemy TYLKO te, ktore roznia sie od domyslnego. Lista wyjatkow, ktora
 * powtarza wartosc domyslna, przestaje po miesiacu znaczyc, czy 7-14 przy
 * uslidze jest decyzja, czy przepisana domyslna.
 */
export const TERMINY_USLUG = {
  // Projekt 3D nie wchodzi do pracowni, wiec chodzi wlasnym tempem: liczy sie
  // czas na rozmowe i poprawki, a nie na maszyne.
  cad_design: { min: 5, max: 10 },
  cad_project: { min: 5, max: 10 },
};

/**
 * Ile dni dokladaja wybrane opcje, razem z powodem.
 *
 * Powod jedzie razem z liczba, bo klient, ktory widzi "14-21 dni" zamiast
 * "7-14", ma prawo wiedziec, co ten czas wydluzylo. Bez tego dopisek wyglada
 * jak zmiana warunkow po fakcie.
 */
export function dodatkiTerminu(serviceId, params = {}) {
  const dodatki = [];
  // GALWANIKA IDZIE OSOBNYM PRZEJSCIEM. Powierzchnie trzeba wypolerowac,
  // odtluscic i pokryc, a kapiel ma swoj czas. Polecenie wlasciciela.
  if (params.platingId && params.platingId !== "none") {
    dodatki.push({
      dni: 2,
      powod: {
        pl: "powłoka galwaniczna",
        en: "galvanic plating",
        de: "galvanische Beschichtung",
      },
    });
  }
  return dodatki;
}

/**
 * Szacowany termin jednej pozycji: zakres uslugi plus to, co dokladaja opcje.
 *
 * @returns {{min: number, max: number, dodatki: Array}}
 */
export function terminPozycji(serviceId, params = {}) {
  // Pozycja bywa opisana identyfikatorem uslugi (koszyk) albo nazwa
  // kalkulatora (serwer, ktory katalogu uslug nie widzi). Obie nazwy trafiaja
  // do tej samej tabeli, wiec zadna ze stron nie musi ich tlumaczyc.
  const podstawa = TERMINY_USLUG[serviceId] || TERMIN_DOMYSLNY;
  const dodatki = dodatkiTerminu(serviceId, params);
  const extra = dodatki.reduce((s, d) => s + d.dni, 0);
  return { min: podstawa.min + extra, max: podstawa.max + extra, dodatki };
}

/**
 * Termin calego zamowienia: najdluzszy z pozycji.
 *
 * Ta sama regula, co przy ofercie (ADR-0027, punkt 3): paczka wychodzi jedna,
 * wiec calosc czeka na to, co robi sie najdluzej. Dolna granica tez idzie
 * z najdluzszej pozycji, a nie z najkrotszej: "od 7 do 21 dni" przy pozycji,
 * ktora sama w sobie trwa 14, obiecywaloby siedem dni czegos, czego w tym
 * zamowieniu nie ma.
 */
export function terminZamowienia(pozycje) {
  const terminy = (pozycje || [])
    .map((p) => terminPozycji(p.serviceId || p.service_id || p.calculator, p.params || {}))
    .filter((t) => Number.isFinite(t.max) && t.max > 0);
  if (!terminy.length) return null;
  const najdluzszy = terminy.reduce((a, b) => (b.max > a.max ? b : a));
  return { min: najdluzszy.min, max: najdluzszy.max, dodatki: najdluzszy.dodatki };
}

const NAPISY = {
  pl: {
    zakres: (min, max) => `${min}-${max} dni`,
    typowy: "Szacowany czas realizacji",
    // ZDANIE MOWI, ZE TO SZACUNEK, i mowi to od razu, a nie drobnym drukiem
    // pod spodem. Termin ostateczny potwierdza pracownia po obejrzeniu
    // zlecenia, wiec obiecywanie konkretnej daty tutaj byloby obietnica bez
    // pokrycia.
    zastrzezenie: "To czas typowy dla takiego zlecenia, liczony od zaksięgowania wpłaty. Termin ostateczny potwierdzamy po weryfikacji zamówienia przez pracownię i podajemy go w osobnej wiadomości.",
    przez: (powody) => `W tym ${powody}.`,
  },
  en: {
    zakres: (min, max) => `${min}-${max} days`,
    typowy: "Estimated lead time",
    zastrzezenie: "This is the typical time for an order like this, counted from the moment the payment clears. The final date is confirmed once the workshop has reviewed the order, and we send it in a separate message.",
    przez: (powody) => `This includes ${powody}.`,
  },
  de: {
    zakres: (min, max) => `${min}-${max} Tage`,
    typowy: "Geschätzte Bearbeitungszeit",
    zastrzezenie: "Das ist die übliche Zeit für einen solchen Auftrag, gerechnet ab dem Zahlungseingang. Den endgültigen Termin bestätigen wir nach der Prüfung durch die Werkstatt und senden ihn in einer separaten Nachricht.",
    przez: (powody) => `Darin enthalten: ${powody}.`,
  },
};

/** Napisy o terminie, gotowe do wstawienia na ekran. */
export function opisTerminu(termin, lang = "pl") {
  if (!termin) return null;
  const n = NAPISY[lang] || NAPISY.pl;
  const powody = (termin.dodatki || []).map((d) => d.powod[lang] || d.powod.pl);
  return {
    etykieta: n.typowy,
    zakres: n.zakres(termin.min, termin.max),
    zastrzezenie: n.zastrzezenie,
    dodatki: powody.length ? n.przez(powody.join(", ")) : null,
  };
}
