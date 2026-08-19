// ============================================================
// PRICING CORE, shared between the browser and the order backend
// ============================================================
// Ten katalog jest JEDYNYM źródłem prawdy o cenach. Kalkulatory w
// przeglądarce pokazują wynik, ale kwotę do zapłaty liczy backend tym
// samym kodem. Pliki z src/pricing/ są kopiowane do chat-api/pricing/
// skryptem scripts/sync-pricing.mjs, dlatego nie wolno tu importować
// niczego z Reacta ani z katalogów spoza src/pricing i src/data.

export const CONFIG = {
  EUR_PLN_RATE: 4.28,
  TOLERANCE_LOW: 0.30,
  TOLERANCE_HIGH: 0.40,
  ENERGY_COST_PLN: 1.05,
  BASE_MARGIN: 0.40,
  PL_MARKET_DISCOUNT: 0.15,
  /**
   * Wartosc zlecenia, od ktorej rabat na rynek polski w ogole sie wlacza.
   *
   * Ponizej tego progu rabatujemy grosze: wydruk drobnego elementu kosztuje
   * kilkanascie zlotych, a 15% z tego jest kwota bez znaczenia dla klienta
   * i realnym ubytkiem przy naszej robociznie, ktora nie maleje razem z cena.
   */
  PL_DISCOUNT_MIN_PLN: 150,
};

// `qty` to nakald reprezentatywny, na ktorym opiera sie rabat progu.
// `min` i `max` to granice przedzialu z etykiety: kreator ustawia na nich
// licznik sztuk, zeby klient nie wybral progu 11-20 i nie zamowil jednej sztuki.
export const QUANTITY_TIERS = [
  { id: "proto",  label: { pl: "1 szt. (prototyp)", en: "1 pc (prototype)", de: "1 Stk. (Prototyp)" }, qty: 1, discount: 0.00, min: 1, max: 1 },
  { id: "micro",  label: { pl: "2-10 szt.", en: "2-10 pcs", de: "2-10 Stk." }, qty: 6, discount: 0.05, min: 2, max: 10 },
  { id: "small",  label: { pl: "11-20 szt.", en: "11-20 pcs", de: "11-20 Stk." }, qty: 15, discount: 0.10, min: 11, max: 20 },
  { id: "medium", label: { pl: "21-50 szt.", en: "21-50 pcs", de: "21-50 Stk." }, qty: 35, discount: 0.15, min: 21, max: 50 },
  { id: "large",  label: { pl: "51-100 szt.", en: "51-100 pcs", de: "51-100 Stk." }, qty: null, discount: null, custom: true, min: 51, max: 100 },
  { id: "custom", label: { pl: "100+ / niestandardowe", en: "100+ / custom", de: "100+ / individuell" }, qty: null, discount: null, custom: true, min: 101, max: 9999 },
];

/**
 * Granice licznika sztuk dla wybranego progu.
 *
 * Bizuteria ma wlasne progi (1, 2-5, 6-10, 10+) o innych identyfikatorach,
 * wiec czytamy je z etykiety. Bez tego kreator pokazywalby prog "2-5 szt."
 * obok licznika ustawionego na 1 i klient nie wiedzialby, co obowiazuje.
 */
export function quantityBounds(quantityId) {
  const tier = QUANTITY_TIERS.find((q) => q.id === quantityId);
  if (tier) return { min: tier.min ?? 1, max: tier.max ?? 999 };

  // Progi jubilerskie: "1", "2-5", "6-10", "10+"
  const id = String(quantityId ?? "");
  const range = /^(\d+)-(\d+)$/.exec(id);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  if (/^\d+\+$/.test(id)) return { min: parseInt(id, 10), max: 999 };
  if (/^\d+$/.test(id)) return { min: Number(id), max: Number(id) };

  return { min: 1, max: 999 };
}

// ============================================================
// LICZBA SZTUK RZADZI, PROG NAKLADU ZA NIA PODAZA
// ============================================================
// Wczesniej bylo odwrotnie: klient przesuwal suwak nakladu, a licznik sztuk
// przeskakiwal na dolna granice przedzialu. Wygladalo to jak zycie wlasne
// formularza, bo nikt nie prosil o dwie sztuki, tylko o przedzial 2-10.
//
// Zrodlem prawdy jest teraz LICZBA SZTUK. Prog wynika z niej, a nie odwrotnie,
// wiec obie kontrolki nigdy nie moga pokazac sprzecznych rzeczy. Suwak dalej
// dziala: ustawia licznik na dolna granice wybranego przedzialu, czyli mowi
// "chce co najmniej tyle".
//
// Ostatni prog na liscie jest progiem OTWARTYM: nie ma gornej granicy, ktora
// dalibysmy z automatu, wiec zamiast liczby pokazujemy nieskonczonosc i
// kierujemy zlecenie do wyceny. Dziala tak samo dla progow studia
// (1, 2-10, ..., 51-100, 100+) i jubilerskich (1, 2-5, 6-10, 10+).

/** Ostatni prog listy, czyli ten bez gornej granicy */
export function openTier(tiers = QUANTITY_TIERS) {
  return tiers[tiers.length - 1];
}

/**
 * Najwieksza liczba sztuk, ktora umiemy wycenic z automatu.
 * To gorna granica progu SASIADUJACEGO z progiem otwartym, a nie ostatniego
 * progu z rabatem: 51-100 idzie do wyceny recznej, ale nadal jest liczba sztuk.
 */
export function qtyLimit(tiers = QUANTITY_TIERS) {
  const przedostatni = tiers[tiers.length - 2];
  return przedostatni ? quantityBounds(przedostatni.id).max : 1;
}

/** Liczba oznaczajaca "wiecej niz umiemy policzyc", pokazywana jako nieskonczonosc */
export function qtyOpenValue(tiers = QUANTITY_TIERS) {
  return qtyLimit(tiers) + 1;
}

/** Czy ta liczba sztuk wpada juz w prog otwarty */
export function isOpenQty(qty, tiers = QUANTITY_TIERS) {
  return Number(qty) > qtyLimit(tiers);
}

/**
 * Najmniejsza liczba sztuk, ktora nalezy do danego progu.
 *
 * To nie zawsze jest `quantityBounds(id).min`. Progi jubilerskie zachodza na
 * siebie ("6-10" i "10+" obejmuja dziesiec sztuk), a dziesiatka nalezy do progu
 * z rabatem. Wybranie progu "10+" musi wiec ustawic jedenascie, inaczej suwak
 * wracalby na sasiedni przedzial zaraz po tym, jak klient go przesunal.
 */
export function qtyForTier(tierId, tiers = QUANTITY_TIERS) {
  const dol = quantityBounds(tierId).min;
  return openTier(tiers).id === tierId ? Math.max(dol, qtyOpenValue(tiers)) : dol;
}

/**
 * Prog nakladu dla danej liczby sztuk.
 *
 * Najpierw szukamy progu, ktory te liczbe ZAWIERA, i dopiero potem schodzimy
 * do progu otwartego. Progi jubilerskie zachodza na siebie ("6-10" i "10+"
 * obejmuja dziesiec sztuk), a bez tej kolejnosci dziesiata sztuka wypadalaby
 * do wyceny recznej, chociaz ma swoj rabat.
 */
export function tierForQty(qty, tiers = QUANTITY_TIERS) {
  const n = Math.max(1, Math.floor(Number(qty) || 1));
  const zawiera = tiers.find((tier) => {
    const b = quantityBounds(tier.id);
    return n >= b.min && n <= b.max;
  });
  if (zawiera) return zawiera;
  return n > 1 ? openTier(tiers) : tiers[0];
}

// Wybor podloza przy uslugach laserowych (przedmiot klienta, material klienta,
// material nasz) mieszka w `src/data/laserSubstrate.js`, a nie tutaj. Bylo tu
// pole dwuwartosciowe `ownMaterial`, ktore sklejalo przedmiot klienta z jego
// materialem w jedna wartosc i przez to pozwalalo wybrac "wasz material" przy
// grawerze na bizuterii klienta. Reguly podloza pociagaja za soba deklaracje
// dostarczenia i sztuke na proby, wiec ich miejsce jest obok reguly przesylki,
// a nie w konfiguracji cen: wybor podloza NIE wplywa na cene i funkcje
// w laserCo2.js oraz laserFiber.js go nie czytaja.

/** Lookup helper for multilingual labels */
export function t(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.en || obj.pl || "";
}

/** Format integer with non-breaking thin space as thousands separator */
export function fmtNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

/** Format a PLN cost amount in the right currency for the given language */
export function fmtCost(plnAmount, lang) {
  if (lang === "pl") return `${plnAmount.toFixed(2)} PLN`;
  return `${(plnAmount / CONFIG.EUR_PLN_RATE).toFixed(2)} EUR`;
}

/**
 * Cena jednostkowa przed rozrzutem tolerancji, w groszach.
 *
 * To jest liczba, którą realnie obciążamy klienta w sklepie. Widełki
 * -30%/+40% z applyPricing() opisują niepewność szacunku i mają sens w
 * kalkulatorze poglądowym, ale nie da się z nich wystawić płatności.
 * Liczymy w groszach, bo złotówki zmiennoprzecinkowe gubią grosze przy
 * mnożeniu przez nakład, a Autopay porównuje kwotę co do grosza.
 */
/**
 * Efektywny czynnik rabatu na rynek polski DLA TEJ konkretnej wyceny.
 *
 * Prog jest na wartosci calego zlecenia, a nie na cenie sztuki: piecdziesiat
 * breloczkow po dziewiec zlotych to nie jest drobne zlecenie, choc sztuka
 * kosztuje tyle co nic.
 *
 * PROG NIE MOZE BYC PROGIEM SKOKOWYM i to jest jedyna nieoczywista rzecz
 * w tej funkcji. Zwykle "ponizej 150 nie ma rabatu" daje uskok: zlecenie za
 * 149 zl kosztuje 149 zl, a za 150 zl juz 127,50 zl, czyli WIEKSZE ZLECENIE
 * JEST TANSZE. Klient, ktory to zauwazy, ma racje, ze cennik jest zepsuty.
 * Dlatego cena po rabacie nie schodzi ponizej progu: miedzy 150 a 176,50 zl
 * placi sie rowne 150 zl, a pelne 15% dziala dopiero powyzej. Funkcja jest
 * monotoniczna i nigdy nie podnosi ceny wyzej niz bez rabatu.
 *
 * @param {number} wartoscBezRabatu wartosc calego zlecenia bez rabatu, w PLN
 * @param {number} localDiscount    rabat rynkowy, 0 poza rynkiem polskim
 * @returns {number} czynnik od (1 - localDiscount) do 1
 */
export function plFactorFor(wartoscBezRabatu, localDiscount = 0) {
  if (!localDiscount || !(wartoscBezRabatu > 0)) return 1;
  const zRabatem = wartoscBezRabatu * (1 - localDiscount);
  const doZaplaty = Math.min(wartoscBezRabatu, Math.max(zRabatem, CONFIG.PL_DISCOUNT_MIN_PLN));
  return doZaplaty / wartoscBezRabatu;
}

export function unitPriceGrosze(baseCost, margin, discountRate, localDiscount = 0, qty = 1) {
  const bezRabatu = baseCost * (1 + margin) * (1 - discountRate);
  const discounted = bezRabatu * plFactorFor(bezRabatu * qty, localDiscount);
  return Math.max(1, Math.round(discounted * 100));
}

/** Apply margin, discount, tolerance -> price range PLN + EUR */
export function applyPricing(baseCost, margin, discountRate, qty, localDiscount = 0) {
  const bezRabatu = baseCost * (1 + margin) * (1 - discountRate);
  const plFactor = plFactorFor(bezRabatu * qty, localDiscount);
  const discounted = bezRabatu * plFactor;
  const perMin = Math.round(discounted * (1 - CONFIG.TOLERANCE_LOW));
  const perMax = Math.round(discounted * (1 + CONFIG.TOLERANCE_HIGH));
  return {
    // Czynnik REALNIE uzyty w tej wycenie. Rozpiska musi mnozyc przez ten sam,
    // inaczej pokaze kwoty inne niz te do zaplaty, a nic sie nie wywali.
    plFactor,
    // Kwota wiazaca, ta ktora realnie obciazamy klienta. Widelki ponizej
    // opisuja niepewnosc szacunku i sluza wylacznie prezentacji.
    unitGrosze: Math.max(1, Math.round(discounted * 100)),
    perPcPLN: { min: Math.max(1, perMin), max: Math.max(1, perMax) },
    perPcEUR: { min: Math.max(1, Math.round(perMin / CONFIG.EUR_PLN_RATE)), max: Math.max(1, Math.round(perMax / CONFIG.EUR_PLN_RATE)) },
    totalPLN: { min: Math.max(1, perMin) * qty, max: Math.max(1, perMax) * qty },
    totalEUR: { min: Math.round((Math.max(1, perMin) * qty) / CONFIG.EUR_PLN_RATE), max: Math.round((Math.max(1, perMax) * qty) / CONFIG.EUR_PLN_RATE) },
  };
}

/**
 * Rabat na rynek polski jako czynnik, nie jako osobny wiersz rozpiski.
 *
 * Wczesniej rozpiska konczyla sie kosztem szacunkowym, a pod nim staly wiersz
 * "Rabat rynek polski (-15%)". To bylo uczciwe, ale zle sprzedawalo: klient
 * czyta rabat jako cene wyjsciowa podbita po to, zeby bylo co odejmowac, i
 * zaczyna szukac, gdzie jest haczyk. Dlatego rabat schodzi rowno ze wszystkich
 * kwot w rozpisce i nigdzie nie jest nazwany.
 *
 * Wazne: wchodzi wylacznie do PREZENTACJI. Sama cena schodzi o te same 15%
 * przez localDiscount w applyPricing() i unitPriceGrosze(), wiec obie drogi
 * musza uzywac tej samej stalej. Gdyby sie rozjechaly, rozpiska pokazywalaby
 * co innego niz kwota do zaplaty, a nikomu nic by sie nie wywalilo.
 */
export function plDiscountFactor(lang) {
  return lang === "pl" ? 1 - CONFIG.PL_MARKET_DISCOUNT : 1;
}

/**
 * Formater kwot do rozpiski, z rabatem rynku polskiego juz wliczonym.
 *
 * Kazdy silnik wyceny bierze `const fc = netCostFmt(lang)` i uzywa fc() zamiast
 * fmtCost() w breakdown. Dzieki temu nie da sie przypadkiem pokazac kwoty
 * sprzed rabatu obok kwoty po rabacie.
 */
export function netCostFmt(lang, factor = plDiscountFactor(lang)) {
  return (plnAmount) => fmtCost(plnAmount * factor, lang);
}

/** Format grosze as a PLN string with two decimals, the format Autopay expects */
export function formatAmountPLN(grosze) {
  return (grosze / 100).toFixed(2);
}
