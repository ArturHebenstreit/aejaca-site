#!/usr/bin/env node
// ============================================================
// FORMA W ODLEWIE ZYWICZNYM: DROGA POWSTANIA I PRAWDZIWY KOSZT
// ============================================================
// Zgloszenie wlasciciela z 2026-09-10, po wejsciu na wlasny sklep. Trzy rzeczy
// naraz i wszystkie trzy sa jedna rzecza: cennik udawal, ze forma jest
// drobiazgiem.
//
// 1. Pole formy pytalo o ROZMIAR, czyli o to samo co objetosc obok, tylko
//    innymi slowami. Dalo sie zamowic odlew XS w formie duzej.
// 2. Koszt formy dzielil sie przez `pourLife`, czyli przez czterdziesci
//    hipotetycznych zalan. Klient zamawiajacy JEDNA sztuke placil 60/40, czyli
//    `1,50 zl`, za forme robiona wylacznie dla niego.
// 3. Cala praca przy zywicy szla po 25 zl/h, razem z polerowaniem wzorca do
//    lustra, ktore w bizuterii recznej idzie po 65 zl/h.
//
// Ten sprawdzian pilnuje wyniku tamtej decyzji, nie samych liczb: wolno
// podniesc stawke i zmienic silikon, nie wolno wrocic do dzielenia przez
// zywotnosc ani do pytania o rozmiar.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MOLD_TYPES, MOLD_DESIGN, MOLD_PREP, EPOXY_CONFIG, INCLUSIONS, RESINS, FINISH_OPTIONS, moldPrep, zamiennikFormy, calculate } from "../src/pricing/epoxy.js";
import { terminPozycji } from "../src/pricing/terminy.js";
import { QUANTITY_TIERS } from "../src/pricing/config.js";
import { getService } from "../src/data/orderCatalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let bledy = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const sprawdz = (w, gdyZle, gdyDobrze) => (w ? ok(gdyDobrze) : zle(gdyZle));

const ZYWICA = getService("epoxy");
const POLE_FORMY = ZYWICA.fields.find((f) => f.key === "moldId");
const wycena = (moldId, qty, extra = {}) => calculate({
  resinId: "epoxy_clear", volumeId: "S", moldId, inclusionId: "none", finishId: "sanded",
  quantityId: QUANTITY_TIERS.find((t) => qty >= t.min && qty <= t.max)?.id || "proto",
  qty, ...extra,
}, "pl");

console.log("\n1. Pole formy pyta o droge, a nie o rozmiar\n");
{
  const id = MOLD_TYPES.map((m) => m.id);
  sprawdz(!id.some((x) => ["new_s", "new_m", "new_l"].includes(x)),
    `warianty rozmiarowe wrocily na liste formy: ${id.join(", ")}`,
    "na liscie formy nie ma juz malej, sredniej i duzej");
  for (const droga of ["existing", "client", "from_object", "from_file", "from_design"]) {
    sprawdz(id.includes(droga), `brakuje drogi ${droga}`, `droga ${droga} jest na liscie`);
  }
  // Rozmiar liczy sie z objetosci, wiec ta sama droga musi dac inny koszt
  // przy innej objetosci. Gdyby nie dawala, rozmiar znowu bylby zgadywany.
  const forma = MOLD_TYPES.find((m) => m.id === "from_object");
  const maly = moldPrep(forma, 7);
  const duzy = moldPrep(forma, 600);
  sprawdz(duzy.total > maly.total * 1.5,
    `gabaryt nie wplywa na koszt formy: 7 ml daje ${maly.total.toFixed(0)} zl, 600 ml ${duzy.total.toFixed(0)} zl`,
    `gabaryt liczy sie z objetosci: 7 ml to ${maly.total.toFixed(0)} zl, 600 ml to ${duzy.total.toFixed(0)} zl`);
}

console.log("\n2. Koszyk zapisany przed zmiana nie traci po cichu kosztu formy\n");
{
  // `poprawkiWyboru` podstawia `warianty[0]` za wybor, ktorego juz nie ma,
  // a `warianty[0]` to NASZA GOTOWA FORMA, czyli zero przygotowania. Bez
  // zamiennika zamowienie na nowa forme cicho zamienialoby sie w najtansze.
  for (const stary of ["new_s", "new_m", "new_l"]) {
    sprawdz(zamiennikFormy(stary) === "from_object",
      `wycofany wariant ${stary} nie ma zamiennika, wiec spadnie na forme gotowa`,
      `wycofany wariant ${stary} schodzi na nowa forme z przedmiotu klienta`);
  }
  sprawdz(zamiennikFormy("existing") === null && zamiennikFormy("from_design") === null,
    "zamiennik rusza drogi, ktore sa w porzadku",
    "zamiennik dotyka wylacznie wariantow wycofanych");
  sprawdz(POLE_FORMY.zamiennik === zamiennikFormy,
    "pole formy nie zna zamiennika, wiec warstwa pol i tak podstawi pierwsza pozycje",
    "pole formy jest podpiete do zamiennika");
}

console.log("\n3. Przygotowanie liczy sie z materialu i godzin, nie z okraglej kwoty\n");
{
  for (const bez of ["existing", "client"]) {
    sprawdz(moldPrep(MOLD_TYPES.find((m) => m.id === bez), 30) === null,
      `droga ${bez} nalicza przygotowanie, chociaz nic nie przygotowujemy`,
      `droga ${bez} nie nalicza przygotowania`);
  }
  // Sprawdzenie wobec dokumentu, a nie wobec samego siebie. Rozdz. 12.3
  // `MDs/AEJaCA_Odlewnictwo_Procedury.md`: forma na master pierscionka
  // w bloczku 60 x 60 x 40 mm to 160-170 g silikonu, czyli 20-24 zl.
  const p = moldPrep(MOLD_TYPES.find((m) => m.id === "from_object"), 30);
  sprawdz(p.silikonKoszt >= 18 && p.silikonKoszt <= 26,
    `silikon na forme breloka wychodzi ${p.silikonKoszt.toFixed(2)} zl, a dokument mowi 20-24 zl`,
    `silikon na forme breloka to ${p.silikonKoszt.toFixed(2)} zl, zgodnie z rozdz. 12.3`);
  // Wzorzec drukowany dokłada polerowanie do lustra. To nie jest kosmetyka:
  // w silikonie poleruje sie RAZ, a polysk kopiuje sie potem na kazdy odlew.
  const zPliku = moldPrep(MOLD_TYPES.find((m) => m.id === "from_file"), 30);
  sprawdz(zPliku.godziny - p.godziny >= MOLD_PREP.HOURS_MASTER_POLISH * 0.99,
    "droga z wlasnym wzorcem nie dolicza polerowania wzorca",
    "droga z wlasnym wzorcem dolicza polerowanie wzorca do lustra");
  const prosty = MOLD_DESIGN.find((d) => d.id === "simple").designH;
  const zProjektu = moldPrep(MOLD_TYPES.find((m) => m.id === "from_design"), 30, prosty);
  sprawdz(zProjektu.projektH > 0 && zProjektu.total > zPliku.total,
    "projekt 3D nic nie kosztuje, chociaz to godziny pracy",
    `projekt 3D dolicza ${zProjektu.projektH} h i podnosi przygotowanie do ${zProjektu.total.toFixed(0)} zl`);
}

console.log("\n4. Praca przy formie ma wlasna stawke, wyzsza niz zalewanie\n");
{
  sprawdz(EPOXY_CONFIG.MOLD_LABOR_PLN_H > EPOXY_CONFIG.LABOR_PLN_H,
    `stawka przy formie (${EPOXY_CONFIG.MOLD_LABOR_PLN_H}) nie jest wyzsza niz przy zalewaniu (${EPOXY_CONFIG.LABOR_PLN_H})`,
    `przygotowanie formy idzie po ${EPOXY_CONFIG.MOLD_LABOR_PLN_H} zl/h, zalewanie po ${EPOXY_CONFIG.LABOR_PLN_H} zl/h`);
  const p = moldPrep(MOLD_TYPES.find((m) => m.id === "from_object"), 30);
  sprawdz(Math.abs(p.praca - p.godziny * EPOXY_CONFIG.MOLD_LABOR_PLN_H) < 0.01,
    "praca przy formie liczy sie inna stawka niz zadeklarowana",
    "praca przy formie liczy sie stawka przygotowania");
}

console.log("\n5. Przygotowanie dzieli sie przez ZAMOWIONE sztuki, nie przez zywotnosc formy\n");
{
  // To jest sedno zgloszenia. Stary model dawal 60/40 = 1,50 zl przy jednej
  // sztuce, czyli klient placil ulamek kosztu formy zrobionej dla niego.
  const jedna = wycena("from_object", 1);
  const gotowa = wycena("existing", 1);
  const roznica = jedna.unitGrosze - gotowa.unitGrosze;
  sprawdz(roznica > 15000,
    `nowa forma podnosi cene jednej sztuki tylko o ${(roznica / 100).toFixed(2)} zl, czyli nadal jej nie placimy`,
    `nowa forma podnosi cene jednej sztuki o ${(roznica / 100).toFixed(2)} zl`);

  // Przy dziesieciu sztukach ta sama kwota rozklada sie na dziesiec. Nie
  // porownujemy do jednej dziesiatej wprost, bo dochodzi rabat progu.
  const dziesiec = wycena("from_object", 10);
  const nadwyzka10 = dziesiec.unitGrosze - wycena("existing", 10).unitGrosze;
  sprawdz(nadwyzka10 < roznica / 5,
    `przy dziesieciu sztukach forma nadal doklada ${(nadwyzka10 / 100).toFixed(2)} zl na sztuke`,
    `przy dziesieciu sztukach forma doklada juz tylko ${(nadwyzka10 / 100).toFixed(2)} zl na sztuke`);

  // Zamowienie ponad zywotnosc formy potrzebuje DRUGIEJ formy. Bez tego
  // pieciedziesiat sztuk z formy na czterdziesci zalan bylo za darmo.
  const forma = MOLD_TYPES.find((m) => m.id === "from_object");
  const przed = wycena("from_object", forma.pourLife);
  const po = wycena("from_object", forma.pourLife + 1);
  sprawdz(po.breakdown.some((r) => r.label === "Formy w zleceniu" && r.value === "2"),
    `zlecenie na ${forma.pourLife + 1} sztuk nie nalicza drugiej formy, a jedna wytrzymuje ${forma.pourLife} zalan`,
    "zlecenie ponad zywotnosc formy nalicza druga forme");
  sprawdz(przed.totalPLN.min > 0 && po.totalPLN.min >= przed.totalPLN.min,
    "zlecenie o sztuke wieksze wyszlo tansze w sumie",
    "zlecenie o sztuke wieksze nie jest tansze mimo drugiej formy");
}

console.log("\n6. Wieksze zlecenie NIGDY nie jest tansze w sumie\n");
{
  // Przygotowanie wchodzi do kosztu jednostkowego, wiec przyciecie rabatu
  // musi o nim wiedziec (`tierDiscount`, argument `stosunekKosztu`). Bez tego
  // klient, ktory to zauwazy, ma racje, ze cennik jest zepsuty.
  let ostatnia = 0, wpadki = [];
  for (let n = 1; n <= 50; n += 1) {
    const suma = wycena("from_object", n).unitGrosze * n;
    if (suma < ostatnia) wpadki.push(`${n} szt. tansze niz ${n - 1}`);
    ostatnia = suma;
  }
  sprawdz(wpadki.length === 0, `cennik nagradza mniejsze zlecenie: ${wpadki.join(", ")}`,
    "suma zlecenia rosnie monotonicznie od 1 do 50 sztuk");
}

console.log("\n7. Klient czyta w rozpisce, za co placi\n");
{
  for (const [lang, jednorazowo, naSztuke] of [
    ["pl", "Przygotowanie formy (jednorazowo)", "Przygotowanie formy / szt."],
    ["en", "Mold preparation (one-off)", "Mold preparation / pc"],
    ["de", "Formvorbereitung (einmalig)", "Formvorbereitung / Stk."],
  ]) {
    const r = calculate({ resinId: "epoxy_clear", volumeId: "S", moldId: "from_object",
      inclusionId: "none", finishId: "sanded", quantityId: "proto", qty: 1 }, lang);
    const etykiety = r.breakdown.map((x) => x.label);
    sprawdz(etykiety.includes(jednorazowo) && etykiety.includes(naSztuke),
      `w jezyku ${lang} rozpiska nie pokazuje przygotowania formy`,
      `w jezyku ${lang} rozpiska pokazuje pelna kwote przygotowania i to, co spada na sztuke`);
  }
  const bezFormy = calculate({ resinId: "epoxy_clear", volumeId: "S", moldId: "existing",
    inclusionId: "none", finishId: "sanded", quantityId: "proto", qty: 1 }, "pl");
  sprawdz(!bezFormy.breakdown.some((r) => /Przygotowanie formy/.test(r.label)),
    "rozpiska pokazuje przygotowanie formy takze wtedy, gdy nic nie przygotowujemy",
    "przy gotowej formie rozpiska milczy o przygotowaniu");
}

console.log("\n8. Warunki drogi stoja przy kafelku, w chwili wyboru\n");
{
  // Ta sama zasada co przy wzorcu powierzonym do odlewu metalu: klient, ktory
  // klika "z Twojego przedmiotu", za chwile spakuje ten przedmiot i pojdzie na
  // poczte. Regulamin przeczyta ten, kto juz szuka sporu.
  for (const droga of ["client", "from_object", "from_file", "from_design"]) {
    const w = POLE_FORMY.warunki({ moldId: droga });
    const komplet = w && w.punkty.length > 0
      && w.punkty.every((p) => p.pl && p.en && p.de)
      && w.tytul.pl && w.tytul.en && w.tytul.de;
    sprawdz(komplet, `droga ${droga} nie ma kompletu warunkow w trzech jezykach`,
      `droga ${droga} ma warunki w trzech jezykach`);
  }
  sprawdz(POLE_FORMY.warunki({ moldId: "existing" }) == null,
    "nasza gotowa forma pokazuje warunki, ktore jej nie dotycza",
    "przy naszej gotowej formie warunkow nie ma");

  // Brak garnka cisnieniowego to prawda o sprzecie (rozdz. 14), a nie
  // drobiazg: przy przezroczystej zywicy klient zobaczy kazdy pecherzyk.
  const polezywicy = ZYWICA.fields.find((f) => f.key === "resinId");
  sprawdz(polezywicy.warunki({ resinId: "epoxy_clear" }) != null
    && polezywicy.warunki({ resinId: "epoxy_color" }) == null,
    "zastrzezenie o pecherzykach nie pojawia sie dokladnie przy zywicy przezroczystej",
    "zastrzezenie o pecherzykach stoi przy zywicy przezroczystej i tylko przy niej");
}

console.log("\n9. Prog nakladu przestal udawac licznik sztuk\n");
{
  // Ekran mial suwak "Naklad" i licznik "Liczba sztuk" jedna pod druga, na
  // jedna liczbe, przy czym konfigurator juz wtedy wyliczal jedno z drugiego.
  const KATALOG = readFileSync(join(ROOT, "src/data/orderCatalog.js"), "utf8");
  sprawdz(!/L\("Nakład", "Batch size", "Auflage"\)/.test(KATALOG),
    "gdzies zostala jeszcze etykieta Naklad, wiec ekran ma dwie kontrolki o tym samym znaczeniu",
    "zadne pole nie nazywa sie juz Naklad");
  sprawdz(/const ETYKIETA_RABATU = L\("Rabat ilościowy"/.test(KATALOG),
    "prog nakladu nie mowi, ze ustawia rabat",
    "prog nakladu nazywa sie rabatem ilosciowym");
  // Przystanki suwaka rysowaly sie jako identyfikator wielkimi literami, wiec
  // Polak czytal PROTO, MICRO, SMALL na szesciu uslugach.
  sprawdz(QUANTITY_TIERS.every((t) => typeof t.tick === "string" && /^[\d+-]+$/.test(t.tick)),
    `progi bez czytelnego przystanku: ${QUANTITY_TIERS.filter((t) => !t.tick).map((t) => t.id).join(", ")}`,
    "kazdy prog ma przystanek zapisany liczbami, zrozumialy w trzech jezykach");
}

console.log("\n10. Przystanki suwaka trafiaja w kciuk, a nie w rowne kolumny\n");
{
  // Node nie laduje `.jsx`, wiec ta polowe reguly sprawdzamy w tresci pliku,
  // tak jak reszta sprawdzianow dotykajacych komponentow. Sama geometria
  // potwierdzona pomiarem w przegladarce, na 1280 px i 390 px: rozjazd
  // srodka napisu wobec srodka kciuka wynosi zero pikseli na obu szerokosciach.
  const K = readFileSync(join(ROOT, "src/components/shop/ConfigControls.jsx"), "utf8");
  sprawdz(/marginInline: `\$\{KCIUK_PX \/ 2\}px`/.test(K),
    "tor przystankow nie jest wciety o polowe kciuka, wiec skrajne przystanki klamia",
    "tor przystankow jest wciety o polowe kciuka");
  sprawdz(/left: `\$\{\(i \/ Math\.max\(1, options\.length - 1\)\) \* 100\}%`/.test(K),
    "przystanki wracaja do rownych kolumn zamiast stac na swoich pozycjach",
    "kazdy przystanek stoi na swojej pozycji na torze");
  sprawdz(!/gridTemplateColumns: `repeat\(\$\{options\.length\}/.test(K),
    "siatka rownych kolumn nadal rysuje przystanki",
    "siatki rownych kolumn juz nie ma");
}

console.log("\n11. Sklep mowi to samo, co mail wyslany klientce\n");
{
  // 10 wrzesnia 2026 pracownia odpisala klientce, ktora chce zatopic w zywicy
  // dwa druty medyczne po zlamanych palcach meza. Mail obiecal konkretne
  // rzeczy, a klientka moze wejsc do sklepu i sprawdzic. Ten rozdzial pilnuje,
  // zeby sklep nie mowil czegos innego niz to, co dostala na pismie.
  //
  // Brelok 40 x 25 x 9 mm to okolo 9 ml, czyli XS. Bryla prosta, z naszego
  // projektu, z zatopieniem, polerowana do przejrzystosci.
  const brelok = (o = {}) => calculate({ resinId: "epoxy_clear", volumeId: "XS", moldId: "from_design",
    moldDesignId: "simple", inclusionId: "object", finishId: "sanded", quantityId: "proto", qty: 1, ...o }, "pl");

  // "Orientacyjnie od 300 do 500 zlotych za pierwszy breloczek."
  const pierwszy = brelok().unitGrosze / 100;
  sprawdz(pierwszy >= 300 && pierwszy <= 500,
    `sklep liczy ${pierwszy.toFixed(0)} zl za pierwszy brelok, a mail obiecal 300-500 zl`,
    `sklep liczy ${pierwszy.toFixed(0)} zl za pierwszy brelok, czyli w widelkach z mailu`);

  // "Drugi egzemplarz, wykonywany rownolegle, to dodatkowo jedna trzecia."
  // Sklep ma byc NIE DROZSZY niz mail: rozjazd w druga strone jest tym,
  // z czego bysmy sie tlumaczyli.
  const dwa = brelok({ quantityId: "micro", qty: 2 }).unitGrosze * 2 / 100;
  const drugi = dwa - pierwszy;
  sprawdz(drugi > 0 && drugi <= pierwszy / 3 + 1,
    `druga sztuka kosztuje ${drugi.toFixed(0)} zl, czyli wiecej niz jedna trzecia pierwszej (${(pierwszy / 3).toFixed(0)} zl) obiecana w mailu`,
    `druga sztuka kosztuje ${drugi.toFixed(0)} zl, nie wiecej niz jedna trzecia obiecana w mailu`);

  // "Dwa do trzech tygodni, liczac od otrzymania drucikow."
  const zNowaForma = terminPozycji("epoxy", { moldId: "from_design" });
  sprawdz(zNowaForma.min >= 14 && zNowaForma.max >= 21,
    `przy nowej formie termin to ${zNowaForma.min}-${zNowaForma.max} dni, a mail obiecal dwa do trzech tygodni`,
    `przy nowej formie termin to ${zNowaForma.min}-${zNowaForma.max} dni, zgodnie z mailem`);
  const zGotowa = terminPozycji("epoxy", { moldId: "existing" });
  sprawdz(zGotowa.max < zNowaForma.max,
    "gotowa forma dostala ten sam wydluzony termin co nowa, chociaz nie ma czego przygotowywac",
    `przy gotowej formie termin zostaje na ${zGotowa.min}-${zGotowa.max} dni`);

  // "Grawer laserowy na malej srebrnej blaszce" albo "napis wydrukowany na
  // naszej drukarce zywicznej". Oba maja byc do wybrania, a nie do opisania.
  for (const sposob of ["text_plate", "text_print"]) {
    const w = INCLUSIONS.find((i) => i.id === sposob);
    sprawdz(w && w.cost != null && w.timeH > 0,
      `sposobu na napis ${sposob} nie ma w sklepie albo nie ma ceny`,
      `sposob na napis ${sposob} jest do wybrania i ma cene`);
  }

  // "Ksztalt decyduje o cenie" - to jest powod, dla ktorego mail podal widelki,
  // a nie jedna kwote. Fasetowany krysztal musi kosztowac wiecej niz prostokat.
  sprawdz(brelok({ moldDesignId: "faceted" }).unitGrosze > brelok().unitGrosze,
    "fasetowany krysztal kosztuje tyle co prosta bryla, wiec widelki z mailu nie maja pokrycia",
    "fasetowany krysztal kosztuje wiecej niz prosta bryla");
  sprawdz(brelok({ moldDesignId: "sculpt" }).type === "custom",
    "ksztalt rzezbiarski dostaje kwote z automatu, chociaz nie znamy jego godzin",
    "ksztalt rzezbiarski idzie do wyceny recznej");
}

console.log("\n12. Nigdzie nie obiecujemy odlewu bez pecherzykow\n");
{
  // Rozdz. 14 `MDs/AEJaCA_Odlewnictwo_Procedury.md`: garnka cisnieniowego
  // w pracowni nie ma. Karta uslugi obiecywala "bryle bez pecherzy", a mail
  // do klientki mowil odwrotnie. Prawdziwy jest mail.
  const KARTA = readFileSync(join(ROOT, "src/data/serviceCatalog.js"), "utf8");
  // Szukamy CALYCH ZDAN, ktore obiecywaly brak pecherzy, a nie samego slowa:
  // zdanie uczciwe tez zawiera slowo "pecherzyki", tylko z przeczeniem przed nim.
  for (const obietnica of [
    "odlewać większe bryły bez pęcherzy", "allows larger volumes without bubbles", "größere Volumen ohne Blasen",
    "bryła bez pęcherzy", "no bubbles in the piece", "Stück ohne Blasen",
    "żeby w bryle nie zostały pęcherze", "so no bubbles remain in the piece", "damit keine Blasen bleiben",
  ]) {
    sprawdz(!KARTA.includes(obietnica),
      `karta uslugi nadal obiecuje "${obietnica}", a garnka cisnieniowego nie mamy`,
      `karta uslugi nie obiecuje juz "${obietnica}"`);
  }
  // I odwrotnie: zastrzezenie ma na tej karcie BYC, w kazdym z trzech jezykow.
  for (const [lang, zdanie] of [["pl", "nie mamy garnka ciśnieniowego"], ["en", "we have no pressure pot"], ["de", "keinen Drucktopf"]]) {
    sprawdz(KARTA.includes(zdanie),
      `w jezyku ${lang} karta uslugi nie mowi, ze garnka cisnieniowego nie mamy`,
      `w jezyku ${lang} karta uslugi mowi wprost, ze garnka cisnieniowego nie mamy`);
  }
  // Zywica przezroczysta poleruje sie dluzej, bo widac przez nia kazda ryse.
  const clear = RESINS.find((r) => r.id === "epoxy_clear");
  const szlif = FINISH_OPTIONS.find((f) => f.id === "sanded");
  sprawdz(clear.clear === true && szlif.timeClearH > szlif.timeH,
    "polerowanie zywicy przezroczystej liczy sie tak samo jak barwionej",
    `polerowanie przezroczystej to ${szlif.timeClearH} h wobec ${szlif.timeH} h przy barwionej`);
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nForma w odlewie zywicznym: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
