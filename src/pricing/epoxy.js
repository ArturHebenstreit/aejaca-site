// ============================================================
// EPOXY CASTING PRICING CORE
// ============================================================
// Formuly przeniesione 1:1 z EpoxyCastCalc.jsx. Bez Reacta, zeby backend
// zamowien liczyl cene tym samym kodem co kalkulator.

import { CONFIG, QUANTITY_TIERS, applyPricing, t, netCostFmt, orderQty, tierDiscount } from "./config.js";

export const EPOXY_CONFIG = {
  POWER_KW: 0.15,
  DEPRECIATION_PLN_H: 1.50,
  // DWIE STAWKI, BO TO DWIE ROZNE ROBOTY (decyzja wlasciciela 2026-09-10).
  // Zalanie gotowej formy i zdjecie oblotu to praca odtworcza: 25 zl/h, tak
  // jak dotad. Przygotowanie formy to prowadzenie linii podzialu i polerowanie
  // wzorca do lustra, czyli ta sama robota, ktora w bizuterii recznej idzie po
  // 65 zl/h. Jedna usredniona stawka podnosilaby cene zwyklego breloka z formy,
  // ktora stoi na polce od roku, czyli tam, gdzie nic sie nie zmienilo.
  LABOR_PLN_H: 25.0,
  MOLD_LABOR_PLN_H: 65.0,
  HANDLING_FEE: 5.0,
};

/**
 * Koszty przygotowania formy silikonowej, z rozdz. 11-12
 * `MDs/AEJaCA_Odlewnictwo_Procedury.md`.
 *
 * Do 10 wrzesnia 2026 forma stala w cenniku jako jedna kwota podzielona przez
 * deklarowana zywotnosc: "nowa forma mala" to bylo 60 zl / 40 zalan, czyli
 * `1,50 zl` doliczane do sztuki. Klient zamawiajacy JEDNA sztuke placil
 * poltora zlotego za forme, ktora robimy od zera, i tak samo placil klient
 * zamawiajacy czterdziesci. Zgloszenie wlasciciela 2026-09-10.
 *
 * Liczymy wiec od materialu i od godzin, a nie od okraglej kwoty:
 *   silikon  blok o sciance 12 mm wokol odlewu, gestosc 1,15 g/cm3
 *   ramka    pieciosciana skrzynka z PLA, drukowana na Bambu Lab
 *   wzorzec  wydruk MSLA plus polerowanie do lustra (rozdz. 12.5: warunek
 *            klarownosci, bo w silikonie poleruje sie RAZ, a lustro kopiuje
 *            sie potem na kazdy odlew za darmo)
 *
 * Sprawdzenie na liczbie z dokumentu: forma na master pierscionka w bloczku
 * 60 x 60 x 40 mm to wedlug rozdz. 12.3 okolo 160-170 g silikonu, czyli
 * 20-24 zl przy Elite Double. Ten model daje dla odlewu 30 ml 158 g i 20,5 zl.
 */
export const MOLD_PREP = {
  // Zhermack Elite Double 22 Normal, 2 kg / 469 zl (rozdz. 12.2). Wybor
  // podstawowy, bo plynnosc decyduje przy waskich zaulkach geometrii.
  SILICONE_PLN_KG: 130,
  SILICONE_DENSITY: 1.15,
  SILICONE_WALL_MM: 12,
  // Ramka odlewnicza drukowana z PLA, piec scian, otwarta gora.
  FRAME_WALL_MM: 2,
  PLA_PLN_G: 0.09,
  PLA_DENSITY: 1.24,
  PLA_PRINT_G_H: 15,
  PRINTER_PLN_H: 4.5,
  // Wzorzec sztywny na Saturn 4 Ultra, ABS-like albo ST 45 B (rozdz. 12.5).
  MSLA_PLN_ML: 0.35,
  MSLA_WASTE: 1.25,
  MSLA_CM_H: 3.5,
  // Separator, kubki miarowe i mieszadla jednorazowe. Resztka poprzedniej
  // mieszanki zatruwa nastepna porcje, wiec to nie jest oszczednosc (rozdz. 12.4).
  CONSUMABLES_PLN: 8,
  // Godziny przy formie wielkosci breloka. Rosna z gabarytem, ale wolniej niz
  // objetosc: wieksza forma to ten sam zestaw czynnosci na wiekszej bryle.
  HOURS_FRAME: 0.3,
  HOURS_POUR: 1.4,
  HOURS_DEMOLD: 0.4,
  HOURS_MASTER_POLISH: 1.2,
  // Objetosc odniesienia dla powyzszych godzin: brelok, 30 ml.
  HOURS_REF_ML: 30,
  HOURS_SCALE_MAX: 2,
};

export const LBL = {
  pl: { resinType: "Typ żywicy", volume: "Objętość odlewu", mold: "Forma",
    inclusions: "Inkluzje / dodatki", finish: "Wykończenie", qty: "Nakład",
    resinCost: "Żywica / szt.", moldPrepPc: "Przygotowanie formy / szt.",
    moldPrepOne: "Przygotowanie formy (jednorazowo)", moldWork: "Praca przy formie",
    moldCount: "Formy w zleceniu",
    inclusionCost: "Inkluzje / szt.", finishCost: "Wykończenie / szt.",
    laborCost: "Praca ręczna / szt.", handling: "Obsługa / szt.",
    workTime: "Czas pracy", cureTime: "Czas utwardzania",
    energy: "Energia / szt.", depreciation: "Amortyzacja narzędzi",
    workshop: "Usługi warsztatowe", estCost: "Koszt szacunkowy / szt.", discount: "Rabat seryjny",
    totalProd: "Czas produkcji łącznie",
    customResin: "Inna żywica - wycena indywidualna" },
  en: { resinType: "Resin type", volume: "Cast volume", mold: "Mold",
    inclusions: "Inclusions / additives", finish: "Finish", qty: "Quantity",
    resinCost: "Resin / pc", moldPrepPc: "Mold preparation / pc",
    moldPrepOne: "Mold preparation (one-off)", moldWork: "Mold work",
    moldCount: "Molds in the order",
    inclusionCost: "Inclusions / pc", finishCost: "Finish / pc",
    laborCost: "Manual labor / pc", handling: "Handling / pc",
    workTime: "Work time", cureTime: "Cure time",
    energy: "Energy / pc", depreciation: "Tool depreciation",
    workshop: "Workshop services", estCost: "Estimated cost / pc", discount: "Series discount",
    totalProd: "Total production time",
    customResin: "Other resin - individual quote" },
  de: { resinType: "Harztyp", volume: "Gussvolumen", mold: "Form",
    inclusions: "Einschlüsse / Zusätze", finish: "Finish", qty: "Auflage",
    resinCost: "Harz / Stk.", moldPrepPc: "Formvorbereitung / Stk.",
    moldPrepOne: "Formvorbereitung (einmalig)", moldWork: "Arbeit an der Form",
    moldCount: "Formen im Auftrag",
    inclusionCost: "Einschlüsse / Stk.", finishCost: "Finish / Stk.",
    laborCost: "Handarbeit / Stk.", handling: "Handhabung / Stk.",
    workTime: "Arbeitszeit", cureTime: "Aushärtezeit",
    energy: "Energie / Stk.", depreciation: "Werkzeugabschreibung",
    workshop: "Werkstattleistungen", estCost: "Geschätzte Kosten / Stk.", discount: "Serienrabatt",
    totalProd: "Gesamte Produktionszeit",
    customResin: "Anderes Harz - individuelle Kalkulation" },
};

export const RESINS = [
  { id: "uv",          label: { pl: "Żywica UV", en: "UV Resin", de: "UV-Harz" },
    pricePerMl: 0.35, density: 1.10, cureH: 0.1,
    desc: { pl: "Szybkie utwardzanie, cienkie warstwy", en: "Fast curing, thin layers", de: "Schnelle Aushärtung, dünne Schichten" },
    img: "/img/calc/resin_types/uv.webp" },
  { id: "epoxy_clear", label: { pl: "Epoksyd - transparentny", en: "Epoxy - transparent", de: "Epoxid - transparent" },
    pricePerMl: 0.18, density: 1.15, cureH: 48,
    desc: { pl: "Krystalicznie czysty, 24-72h utwardzania", en: "Crystal clear, 24-72h curing", de: "Kristallklar, 24-72h Aushärtung" },
    img: "/img/calc/resin_types/epoxy_clear.webp" },
  { id: "epoxy_color", label: { pl: "Epoksyd - kolorowy", en: "Epoxy - colored", de: "Epoxid - farbig" },
    pricePerMl: 0.22, density: 1.15, cureH: 48,
    desc: { pl: "Z pigmentem, efekty artystyczne", en: "With pigment, artistic effects", de: "Mit Pigment, künstlerische Effekte" },
    img: "/img/calc/resin_types/epoxy_color.webp" },
  { id: "custom", label: { pl: "Inna żywica", en: "Other resin", de: "Anderes Harz" },
    pricePerMl: null, density: null, cureH: null, custom: true },
];

export const VOLUMES = [
  { id: "XS", label: { pl: "XS - biżuteria (do 10 ml)", en: "XS - jewelry (up to 10 ml)", de: "XS - Schmuck (bis 10 ml)" }, vol: 7 },
  { id: "S",  label: { pl: "S - brelok / mały (10-50 ml)", en: "S - keychain / small (10-50 ml)", de: "S - Schlüsselanhänger / klein (10-50 ml)" }, vol: 30 },
  { id: "M",  label: { pl: "M - podkładka / deko (50-250 ml)", en: "M - coaster / deco (50-250 ml)", de: "M - Untersetzer / Deko (50-250 ml)" }, vol: 150 },
  { id: "L",  label: { pl: "L - duży obiekt (250 ml - 1L)", en: "L - large object (250 ml - 1L)", de: "L - großes Objekt (250 ml - 1L)" }, vol: 600 },
  { id: "XL", label: { pl: "XL - powyżej 1L (river table itp.)", en: "XL - over 1L (river table etc.)", de: "XL - über 1L (River Table usw.)" }, vol: null, custom: true },
];

/**
 * Droga powstania formy, a NIE jej rozmiar.
 *
 * Do 10 wrzesnia 2026 to pole pytalo "mala, srednia czy duza", czyli o to samo,
 * o co pyta objetosc, tylko innymi slowami i z prawem do sprzecznosci: dalo sie
 * zamowic odlew XS w formie duzej. Zgloszenie wlasciciela 2026-09-10.
 *
 * Gabaryt liczy sie teraz z objetosci (`moldPrep`), a pole pyta o to, czego
 * z objetosci wyliczyc sie NIE DA i co naprawde rzadzi cena: skad bierzemy
 * wzorzec. Trzy drogi roznia sie o cale godziny pracy, nie o procenty.
 *
 * `pourLife` zostaje przy drogach z przygotowaniem, bo mowi, po ilu zalaniach
 * silikon trzeba wylac od nowa. Przy naszej formie i przy formie klienta nie
 * ma czego dzielic, wiec nie ma tam tego pola.
 *
 * ZDJECIA SA TYMCZASOWE. Pliki `new_s/new_m/new_l.webp` powstaly dla starych,
 * rozmiarowych wariantow i pokazuja po prostu formy silikonowe, wiec pasuja
 * tresciowo, ale nie pokazuja tego, czym te trzy drogi sie roznia. Do wymiany
 * na wlasne zdjecia: przedmiot klienta w ramce, wydruk wzorca, widok modelu 3D.
 */
export const MOLD_TYPES = [
  { id: "existing", label: { pl: "Nasza gotowa forma", en: "Our existing mold", de: "Unsere vorhandene Form" },
    desc: { pl: "Bez kosztu przygotowania", en: "No preparation cost", de: "Ohne Vorbereitungskosten" },
    img: "/img/calc/resin_molds/existing.webp" },
  { id: "client", label: { pl: "Twoja własna forma", en: "Your own mold", de: "Ihre eigene Form" },
    desc: { pl: "Przysyłasz gotową formę", en: "You send a ready mold", de: "Sie senden eine fertige Form" },
    img: "/img/calc/resin_molds/client.webp" },
  { id: "from_object", label: { pl: "Nowa forma z Twojego przedmiotu", en: "New mold from your object", de: "Neue Form von Ihrem Objekt" },
    desc: { pl: "Przysyłasz wzorzec, my odlewamy silikon", en: "You send the pattern, we cast the silicone", de: "Sie senden das Muster, wir gießen das Silikon" },
    prep: { master: false, designH: 0 }, pourLife: 40,
    img: "/img/calc/resin_molds/new_s.webp" },
  { id: "from_file", label: { pl: "Nowa forma z Twojego pliku 3D", en: "New mold from your 3D file", de: "Neue Form aus Ihrer 3D-Datei" },
    desc: { pl: "Drukujemy i polerujemy wzorzec", en: "We print and polish the pattern", de: "Wir drucken und polieren das Muster" },
    prep: { master: true, designH: 0 }, pourLife: 40,
    img: "/img/calc/resin_molds/new_m.webp" },
  { id: "from_design", label: { pl: "Nowa forma z naszego projektu", en: "New mold from our design", de: "Neue Form nach unserem Entwurf" },
    desc: { pl: "Projekt 3D, wzorzec i forma u nas", en: "3D design, pattern and mold by us", de: "3D-Entwurf, Muster und Form bei uns" },
    prep: { master: true, designH: 3 }, pourLife: 40,
    img: "/img/calc/resin_molds/new_l.webp" },
  { id: "custom", label: { pl: "Forma niestandardowa", en: "Custom mold", de: "Individuelle Form" }, custom: true },
];

/**
 * Zamiennik dla wariantow wycofanych 10 wrzesnia 2026.
 *
 * Koszyk zapisany wczesniej niesie `new_s`, `new_m` albo `new_l`. Bez tego
 * `poprawkiWyboru` podstawiloby `warianty[0]`, czyli NASZA GOTOWA FORME, i
 * zamowienie na nowa forme cicho traciloby caly koszt przygotowania. Rozmiaru
 * nie przenosimy, bo liczy sie go teraz z objetosci, ktora w koszyku juz jest.
 */
export function zamiennikFormy(moldId) {
  return ["new_s", "new_m", "new_l"].includes(moldId) ? "from_object" : null;
}

/**
 * Rozpiska przygotowania JEDNEJ formy dla zadanej objetosci odlewu.
 *
 * Odlew traktujemy jako szescian o boku `cbrt(V)`, a blok formy jako ten sam
 * szescian powiekszony o sciane silikonu z kazdej strony. To szacunek w gore
 * dla brył plaskich (pierscionek) i w dol dla dlugich i cienkich, ale zadnego
 * z tych dwoch wymiarow klient w sklepie nie podaje, a udawanie dokladnosci
 * przy nieznanym ksztalcie byloby gorsze niz jawny szacunek.
 *
 * @returns {object|null} null, gdy forma nie wymaga przygotowania
 */
export function moldPrep(mold, volMl) {
  if (!mold?.prep || !(volMl > 0)) return null;
  const P = MOLD_PREP;
  const bokMm = Math.cbrt(volMl * 1000);
  const bokBlokuMm = bokMm + 2 * P.SILICONE_WALL_MM;
  const silikonMl = Math.max(0, bokBlokuMm ** 3 - volMl * 1000) / 1000;
  const silikonKoszt = (silikonMl * P.SILICONE_DENSITY / 1000) * P.SILICONE_PLN_KG;

  const ramkaMl = (5 * bokBlokuMm ** 2 * P.FRAME_WALL_MM) / 1000;
  const ramkaG = ramkaMl * P.PLA_DENSITY;
  const ramkaKoszt = ramkaG * P.PLA_PLN_G;
  const ramkaDrukH = ramkaG / P.PLA_PRINT_G_H;

  // Godziny rosna z bokiem bryly, nie z objetoscia: to ta sama lista czynnosci
  // wykonana na wiekszym przedmiocie. Sufit jest po to, zeby river table nie
  // wyliczyl sobie dwudziestu godzin polerowania.
  const skala = Math.min(P.HOURS_SCALE_MAX, Math.max(1, Math.cbrt(volMl / P.HOURS_REF_ML)));
  let godziny = (P.HOURS_FRAME + P.HOURS_POUR + P.HOURS_DEMOLD) * skala;
  let masterKoszt = 0;
  let masterDrukH = 0;
  if (mold.prep.master) {
    masterKoszt = volMl * P.MSLA_WASTE * P.MSLA_PLN_ML;
    masterDrukH = (bokMm / 10) / P.MSLA_CM_H;
    godziny += P.HOURS_MASTER_POLISH * skala;
  }
  // Projekt nie skaluje sie z gabarytem: o czas decyduje zlozonosc ksztaltu.
  const projektH = mold.prep.designH || 0;

  const material = silikonKoszt + ramkaKoszt + masterKoszt + P.CONSUMABLES_PLN;
  const maszyna = ramkaDrukH * P.PRINTER_PLN_H + masterDrukH * P.PRINTER_PLN_H;
  const praca = (godziny + projektH) * EPOXY_CONFIG.MOLD_LABOR_PLN_H;

  return {
    silikonMl, silikonKoszt, ramkaKoszt, masterKoszt, material, maszyna, praca,
    godziny, projektH, drukH: ramkaDrukH + masterDrukH,
    total: material + maszyna + praca,
  };
}

export const INCLUSIONS = [
  { id: "none",     label: { pl: "Brak", en: "None", de: "Keine" },                                              cost: 0,  img: "/img/calc/resin_inclusions/none.webp" },
  { id: "pigment",  label: { pl: "Pigment / brokat", en: "Pigment / glitter", de: "Pigment / Glitzer" },          cost: 3,  img: "/img/calc/resin_inclusions/pigment.webp" },
  { id: "object",   label: { pl: "Zalewany obiekt (kwiat, zdjęcie)", en: "Embedded object (flower, photo)", de: "Eingebettetes Objekt (Blume, Foto)" }, cost: 8,  img: "/img/calc/resin_inclusions/object.webp" },
  { id: "led",      label: { pl: "LED / elektronika", en: "LED / electronics", de: "LED / Elektronik" },          cost: 15, img: "/img/calc/resin_inclusions/led.webp" },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" },                              cost: null, custom: true },
];

export const FINISH_OPTIONS = [
  { id: "raw",      label: { pl: "Surowy (z formy)", en: "Raw (from mold)", de: "Roh (aus Form)" },               timeH: 0,   cost: 0,
    desc: { pl: "Naturalna faktura formy", en: "Natural mold texture", de: "Natürliche Formtextur" },
    img: "/img/calc/resin_finish/raw.webp" },
  { id: "sanded",   label: { pl: "Szlifowany + polerowany", en: "Sanded + polished", de: "Geschliffen + poliert" }, timeH: 0.5, cost: 5,
    desc: { pl: "Lustrzany połysk", en: "Mirror gloss", de: "Spiegelglanz" },
    img: "/img/calc/resin_finish/sanded.webp" },
  { id: "coated",   label: { pl: "Lakierowany / powlekany", en: "Coated / lacquered", de: "Lackiert / beschichtet" }, timeH: 0.3, cost: 8,
    desc: { pl: "Głęboki „mokry” efekt", en: "Deep wet-look effect", de: "Tiefer Nass-Effekt" },
    img: "/img/calc/resin_finish/coated.webp" },
  { id: "custom",   label: { pl: "Niestandardowe", en: "Custom", de: "Individuell" },                              timeH: null, cost: null, custom: true },
];

export function calculate({ resinId, volumeId, moldId, inclusionId, finishId, quantityId, qty: sztuk }, lang) {
  const resin = RESINS.find(r => r.id === resinId);
  const vol = VOLUMES.find(v => v.id === volumeId);
  const mold = MOLD_TYPES.find(m => m.id === moldId);
  const incl = INCLUSIONS.find(i => i.id === inclusionId);
  const fin = FINISH_OPTIONS.find(f => f.id === finishId);
  const qTier = QUANTITY_TIERS.find(q => q.id === quantityId);
  if (!resin || !vol || !mold || !incl || !fin || !qTier) return null;
  if (!resin.pricePerMl || !vol.vol || mold.custom || incl.cost == null || fin.cost == null || !qTier.qty) return { type: "custom" };
  // LICZYMY PO LICZBIE SZTUK, KTORA KLIENT NAPRAWDE ZAMAWIA, a nie po nakladzie
  // reprezentatywnym progu. Przy dwoch sztukach przygotowanie dzieli sie przez
  // dwie, a nie przez szesc. Rabat zostaje przy progu i jest przycinany tak,
  // zeby wieksze zlecenie nigdy nie bylo tansze (`tierDiscount`).
  const qty = orderQty(quantityId, { qty: sztuk });
  const l = LBL[lang] || LBL.en;

  const resinCost = vol.vol * resin.pricePerMl * 1.10;
  const inclCost = incl.cost;
  const workTimeH = 0.25 + (fin.timeH || 0);
  const cureOverheadH = resin.cureH * 0.02;
  const handleH = 0.05;

  const laborCost = workTimeH * EPOXY_CONFIG.LABOR_PLN_H;
  const energyCost = (workTimeH + cureOverheadH) * EPOXY_CONFIG.POWER_KW * CONFIG.ENERGY_COST_PLN;
  const deprCost = (workTimeH + cureOverheadH) * EPOXY_CONFIG.DEPRECIATION_PLN_H;
  const finishCost = fin.cost || 0;

  // PRZYGOTOWANIE FORMY DZIELI SIE PRZEZ SZTUKI, KTORE KLIENT ZAMAWIA, a nie
  // przez deklarowana zywotnosc silikonu (decyzja wlasciciela 2026-09-10).
  // Poprzedni model dzielil przez `pourLife`, wiec zamawiajacy jedna sztuke
  // placil 1/40 kosztu formy zrobionej wylacznie dla niego. Teraz prototyp
  // niesie caly koszt przygotowania i klient widzi, dlaczego jest drogi,
  // a przy serii ta sama kwota rozklada sie na jego oczach.
  const prep = moldPrep(mold, vol.vol);
  const formy = (n) => (prep && mold.pourLife ? Math.ceil(n / mold.pourLife) : prep ? 1 : 0);
  const prepPerPc = (n) => (prep ? (prep.total * formy(n)) / n : 0);

  // Koszt jednostkowy jako FUNKCJA NAKLADU: naklad wchodzi wylacznie przez
  // podzial przygotowania formy. Potrzebujemy go dla dwoch nakladow naraz,
  // zeby przyciecie rabatu wiedzialo, o ile koszt spada przy jednej sztuce
  // wiecej. Bez tego zlecenie o sztuke wieksze potrafi wyjsc tansze w sumie.
  const kosztBazowy = (n) => resinCost + prepPerPc(n) + inclCost + finishCost
    + laborCost + energyCost + deprCost + EPOXY_CONFIG.HANDLING_FEE;

  const baseCost = kosztBazowy(qty);
  const rabat = tierDiscount(quantityId, qty, QUANTITY_TIERS,
    qty > 1 ? kosztBazowy(qty - 1) / kosztBazowy(qty) : 1);
  // Godziny przy formie doliczaja sie RAZ na zlecenie, nie na sztuke.
  const batchTimeH = (workTimeH + handleH) * qty + resin.cureH
    + (prep ? (prep.godziny + prep.projektH + prep.drukH) * formy(qty) : 0);

  const plDiscount = lang === "pl" ? CONFIG.PL_MARKET_DISCOUNT : 0;
  const pricing = applyPricing(baseCost, CONFIG.BASE_MARGIN, rabat, qty, plDiscount);
  const fc = netCostFmt(lang, pricing.plFactor);
  const cureDisplay = resin.cureH < 1 ? `${Math.round(resin.cureH * 60)} min (UV)` : `${resin.cureH} h`;

  return {
    type: "calculated", ...pricing, qty, discount: rabat,
    totalTimeH: qty > 1 || prep ? batchTimeH : null,
    moldPrep: prep,
    breakdown: [
      { label: l.resinCost, value: `${fc(resinCost)} (${vol.vol} ml)` },
      // Przygotowanie stoi WLASNA POZYCJA, dwa razy: pelna kwota i to, co z niej
      // spada na sztuke. Klient ma zobaczyc jedno i drugie, bo bez pelnej kwoty
      // nie wie, za co placi, a bez podzialu nie widzi, ze wieksze zlecenie
      // rozklada te sama kwote.
      ...(prep ? [
        { label: l.moldPrepOne, value: fc(prep.total) },
        ...(formy(qty) > 1 ? [{ label: l.moldCount, value: String(formy(qty)) }] : []),
        { label: l.moldWork, value: `${(prep.godziny + prep.projektH).toFixed(1)} h` },
        { label: l.moldPrepPc, value: fc(prepPerPc(qty)) },
      ] : []),
      { label: l.inclusionCost, value: fc(inclCost) },
      { label: l.finishCost, value: fc(finishCost) },
      { label: l.laborCost, value: fc(laborCost) },
      { label: l.handling, value: fc(EPOXY_CONFIG.HANDLING_FEE) },
      { label: l.workTime, value: `${(workTimeH * 60).toFixed(0)} min` },
      { label: l.cureTime, value: cureDisplay },
      { label: l.energy, value: fc(energyCost) },
      { label: l.depreciation, value: fc(deprCost) },
      { label: l.workshop, value: fc(baseCost * CONFIG.BASE_MARGIN) },
      { divider: true },
      { label: l.estCost, value: fc(baseCost * (1 + CONFIG.BASE_MARGIN)), bold: true },
      ...(rabat > 0 ? [{ label: l.discount, value: `-${Math.round(rabat * 1000) / 10}%`, accent: true }] : []),
      ...(batchTimeH > 0 && (qty > 1 || prep) ? [{ label: l.totalProd, value: `~${batchTimeH.toFixed(1)} h`, bold: true }] : []),
    ],
  };
}
