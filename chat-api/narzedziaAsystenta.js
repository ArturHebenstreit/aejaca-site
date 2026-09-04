// ============================================================
// NARZEDZIA ASYSTENTA: LICZY TYM SAMYM KODEM, CO SKLEP
// ============================================================
// Asystent na stronie wiedzial dotad o cenach wszystko z tekstu wklejonego do
// polecenia systemowego. Wystarczylo zapytac "ile kosztuje 20 breloczkow
// z PETG", zeby dostal pytanie, na ktore odpowiada TYLKO liczenie: model
// jezykowy zgaduje wtedy z widelek, ktore ma opisane slowami, i zgaduje zle.
// Cztery razy w przegladzie z 3 wrzesnia podal kwote inna niz kalkulator.
//
// TRZY ZASADY, KTORE TU OBOWIAZUJA:
//
// 1. LICZY `priceItem`, TEN SAM, KTORY WYSTAWIA KWOTE W KOSZYKU. Nie ma tu
//    zadnej drugiej formuly ani zadnej tabeli cen. Gdyby byla, rozjechalaby
//    sie z rdzeniem cenowym przy pierwszej zmianie stawki i nikt by tego nie
//    zobaczyl, bo rozmowa z asystentem nie przechodzi przez zadna bramke.
//
// 2. ASYSTENT NIE WYSTAWIA KWOTY WIAZACEJ, NIGDY. Kwota wiazaca powstaje
//    z podstawy, ktora da sie zmierzyc (`bindingBasis`), a rozmowa nie niesie
//    pliku klienta. Kazda odpowiedz wraca wiec jako SZACUNEK z odnosnikiem do
//    kalkulatora, razem z powodem, ktorego brakuje do kwoty wiazacej.
//
// 3. PARAMETRY, KTORYCH KLIENT NIE PODAL, BIORA SIE Z USTAWIEN DOMYSLNYCH
//    USLUGI I SA WYMIENIONE W ODPOWIEDZI. Cicho dobrany wariant to kwota
//    policzona za co innego, niz klient pytal, a on nie ma jak tego zauwazyc.
//
// Warunki kodow rabatowych tez sa narzedziem, a nie tekstem w poleceniu:
// polecenie systemowe podawalo 90 dni waznosci kodu powitalnego, gdy kod
// zyje 45 (ADR-0038). Liczba, ktora stoi w dwoch miejscach, rozjedzie sie.

import { CALCULATORS, PricingError, priceItem } from "./orders.js";
import { SERVICES, getService } from "./pricing/orderCatalog.js";
import { bindingBasis } from "./pricing/bindingBasis.js";
import { RODZAJE_KODOW } from "./discounts.js";
import { tierForQty, QUANTITY_TIERS } from "./pricing/config.js";

const JEZYKI = new Set(["pl", "en", "de"]);
const jezyk = (l) => (JEZYKI.has(l) ? l : "pl");

/** Napis z katalogu bywa obiektem {pl,en,de}. */
const napis = (v, lang) => (v && typeof v === "object" ? (v[lang] || v.pl || v.en) : v);

/** Adres strony w jezyku odwiedzajacego. Polski stoi pod golym adresem. */
export function adresUslugi(id, lang) {
  const przedrostek = lang === "pl" ? "" : `/${lang}`;
  return `https://www.aejaca.com${przedrostek}/shop/service/${id}/`;
}

/**
 * Uslugi, ktore asystent moze policzyc.
 *
 * Usluga wymagajaca pliku zostaje na liscie, tylko z adnotacja: klient ma
 * uslyszec, ze ta rzecz robimy, i dostac adres, pod ktorym wgra model, a nie
 * dowiedziec sie, ze jej nie ma.
 */
export function listaUslug(lang = "pl") {
  const l = jezyk(lang);
  return SERVICES.map((s) => ({
    usluga: s.id,
    nazwa: napis(s.title, l),
    wymaga_pliku: Boolean(s.acceptsFile),
    adres: adresUslugi(s.id, l),
    parametry: (s.fields || []).map((f) => ({
      klucz: f.key,
      nazwa: napis(f.label, l),
      warianty: (f.options || []).map((o) => o.id).slice(0, 24),
    })),
  }));
}

/** Ustawienia domyslne uslugi, na ktorych opieramy brakujace parametry. */
function domyslne(s) {
  return { ...(s.defaults || {}) };
}

/**
 * Szacunek ceny dla uslugi i parametrow.
 *
 * Zwraca obiekt gotowy do przeczytania przez model jezykowy: kwoty, parametry
 * NAPRAWDE uzyte, parametry dobrane za klienta i powod, dla ktorego to jest
 * szacunek, a nie kwota wiazaca.
 */
export function policzCene({ usluga, parametry = {}, sztuk = 1, lang = "pl", rates = null, gemstones = null, materialStock = null }) {
  const l = jezyk(lang);
  const s = getService(String(usluga || ""));
  if (!s) {
    return { blad: "nieznana_usluga", wiadomosc: `Nie znam uslugi "${usluga}". Wywolaj lista_uslug.` };
  }
  const kalkulator = s.calculator;
  if (!CALCULATORS[kalkulator]) {
    return { blad: "brak_kalkulatora", wiadomosc: `Usluga ${s.id} nie ma kalkulatora po stronie serwera.` };
  }

  const baza = domyslne(s);
  const podane = parametry && typeof parametry === "object" ? parametry : {};
  const uzyte = { ...baza, ...podane };
  const dobrane = Object.keys(baza).filter((k) => !(k in podane) && k !== "quantityId" && k !== "qtyId");

  const ile = Math.max(1, Math.min(1000, Number(sztuk) || 1));
  // LICZBA SZTUK RZADZI, PROG NAKLADU Z NIEJ WYNIKA, tak samo jak na karcie
  // uslugi. Bez tego kroku dwadziescia sztuk liczylo sie po cenie progu
  // "prototyp", czyli bez rabatu nakladowego, i asystent podawal kwote wyzsza
  // niz sklep za to samo zamowienie. Nazwa progu rozni sie miedzy dzialami
  // (`quantityId` w studiu, `qtyId` w bizuterii), wiec bierzemy ja z katalogu
  // tej uslugi, a nie z domyslu.
  const poleProgu = (s.fields || []).map((f) => f.key).find((k) => k === "quantityId" || k === "qtyId") || null;
  if (poleProgu) {
    const progi = (s.fields || []).find((f) => f.key === poleProgu)?.options || QUANTITY_TIERS;
    uzyte[poleProgu] = tierForQty(ile, progi).id;
    if (!(poleProgu in podane)) dobrane.push(`${poleProgu} (z liczby sztuk)`);
  }

  let item;
  try {
    item = priceItem({ calculator: kalkulator, params: uzyte, lang: l, rates, gemstones, materialStock });
  } catch (e) {
    if (e instanceof PricingError) {
      return { blad: e.code, wiadomosc: e.message, adres: adresUslugi(s.id, l) };
    }
    return { blad: "blad_wyceny", wiadomosc: "Tej konfiguracji nie umiem policzyc.", adres: adresUslugi(s.id, l) };
  }

  const podstawa = bindingBasis({ calculator: kalkulator, params: uzyte, geometry: null });
  const zaSztuke = (item.unitGrosze ?? 0) / 100;

  return {
    usluga: s.id,
    nazwa_uslugi: napis(s.title, l),
    // KWOTY W ZLOTOWKACH, ZAWSZE. Przeliczenie na euro dla wersji angielskiej
    // i niemieckiej robi warstwa, ktora wie, jaki jest dzisiejszy kurs, a nie
    // to narzedzie. Regula biznesowa liczy sie w zlotowkach (MDs/MAPA_CEN.md).
    za_sztuke_pln: Number(zaSztuke.toFixed(2)),
    sztuk: ile,
    razem_pln: Number((zaSztuke * ile).toFixed(2)),
    // Szacunek ma widelki, bo tak pokazuje go kalkulator.
    widelki_pln: item.rangeLowGrosze != null && item.rangeHighGrosze != null
      ? [Number((item.rangeLowGrosze / 100).toFixed(2)), Number((item.rangeHighGrosze / 100).toFixed(2))]
      : null,
    parametry_uzyte: uzyte,
    parametry_dobrane_domyslnie: dobrane,
    pole_progu_nakladu: poleProgu,
    // ZAWSZE SZACUNEK. Nawet gdy `bindingBasis` mowi, ze podstawa wystarcza,
    // rozmowa nie jest miejscem, w ktorym powstaje kwota wiazaca: ta rodzi sie
    // w koszyku, z numerem i terminem waznosci.
    wiazaca: false,
    powod_szacunku: podstawa.binding
      ? "kwota wiazaca powstaje w koszyku, razem z numerem i terminem 7 dni"
      : `do kwoty wiazacej brakuje: ${(podstawa.missing || []).join(", ") || "danych"}`,
    adres: adresUslugi(s.id, l),
  };
}

/** Warunki kodu rabatowego, czytane z tabeli rodzajow, a nie z pamieci modelu. */
export function warunkiKodu({ rodzaj, lang = "pl" }) {
  const l = jezyk(lang);
  const r = RODZAJE_KODOW[String(rodzaj || "")];
  if (!r) {
    return {
      blad: "nieznany_rodzaj",
      wiadomosc: `Znane rodzaje: ${Object.keys(RODZAJE_KODOW).join(", ")}.`,
      rodzaje: Object.keys(RODZAJE_KODOW),
    };
  }
  return {
    rodzaj,
    procent_domyslny: r.procent ?? null,
    waznosc_dni: r.dni ?? null,
    powtarzalny: Boolean(r.powtarzalny),
    // Kod jednorazowy i imienny znaczy dla klienta co innego niz powtarzalny:
    // drugie zapytanie o ten sam rodzaj odda ten sam kod albo nowy.
    jak_uzyc: l === "en"
      ? "Enter the code in the cart, in the discount code field, before payment. One code per order."
      : l === "de"
        ? "Den Code im Warenkorb im Feld für den Rabattcode eingeben, vor der Zahlung. Ein Code pro Bestellung."
        : "Kod wpisuje się w koszyku, w polu kodu rabatowego, przed zapłatą. Jeden kod na zamówienie.",
    uwaga: l === "en"
      ? "The exact validity date is in the message that carried the code; it wins over this number."
      : l === "de"
        ? "Das genaue Datum steht in der Nachricht mit dem Code und gilt vor dieser Zahl."
        : "Dokładna data ważności stoi w wiadomości, która przyniosła kod, i to ona obowiązuje, a nie ta liczba.",
  };
}

/** Opis narzedzi w formacie, ktorego oczekuje warstwa modelu jezykowego. */
export const NARZEDZIA = [
  {
    type: "function",
    function: {
      name: "lista_uslug",
      description: "Lista uslug, ktore umiem wycenic, razem z kluczami parametrow i ich wariantami. Wywolaj to ZANIM policzysz cene, jesli nie masz pewnosci, jak nazywa sie usluga albo parametr.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "policz_cene",
      description: "Szacunkowa cena uslugi dla podanych parametrow, policzona tym samym kodem, ktory wystawia kwote w koszyku. Zwraca takze parametry dobrane domyslnie: WYMIEN je w odpowiedzi, zeby klient wiedzial, za co jest ta kwota. Nigdy nie nazywaj tego kwota wiazaca.",
      parameters: {
        type: "object",
        properties: {
          usluga: { type: "string", description: "Identyfikator uslugi z lista_uslug, np. print_fdm, jewelry_plain, laser_engrave." },
          parametry: { type: "object", description: "Parametry podane przez klienta, kluczami z lista_uslug. Czego nie ma, dobierze sie domyslnie.", additionalProperties: true },
          sztuk: { type: "integer", description: "Liczba sztuk, domyslnie 1.", minimum: 1, maximum: 1000 },
        },
        required: ["usluga"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "warunki_kodu",
      description: "Warunki kodu rabatowego danego rodzaju: procent, ile dni jest wazny, czy ten sam adres dostaje ten sam kod. Uzywaj tego zamiast podawac liczby z pamieci.",
      parameters: {
        type: "object",
        properties: {
          rodzaj: { type: "string", description: `Rodzaj kodu: ${Object.keys(RODZAJE_KODOW).join(", ")}.` },
        },
        required: ["rodzaj"],
      },
    },
  },
];

/**
 * Wykonanie jednego wywolania narzedzia.
 *
 * Zwraca ZAWSZE obiekt, takze przy bledzie: model dostaje powod i moze go
 * powiedziec klientowi, zamiast milczec albo zmyslic kwote.
 */
export async function wykonajNarzedzie(nazwa, argumenty, { lang = "pl", kursy = null } = {}) {
  const l = jezyk(lang);
  const a = argumenty && typeof argumenty === "object" ? argumenty : {};
  try {
    if (nazwa === "lista_uslug") return { uslugi: listaUslug(l) };
    if (nazwa === "policz_cene") {
      return policzCene({
        usluga: a.usluga,
        parametry: a.parametry,
        sztuk: a.sztuk,
        lang: l,
        rates: kursy?.rates ?? null,
        gemstones: kursy?.gemstones ?? null,
        materialStock: kursy?.materialStock ?? null,
      });
    }
    if (nazwa === "warunki_kodu") return warunkiKodu({ rodzaj: a.rodzaj, lang: l });
    return { blad: "nieznane_narzedzie", wiadomosc: `Nie mam narzedzia o nazwie ${nazwa}.` };
  } catch (e) {
    return { blad: "wyjatek", wiadomosc: String(e?.message || e).slice(0, 300) };
  }
}
