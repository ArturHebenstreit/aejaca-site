// ============================================================
// SZACOWANY CZAS REALIZACJI
// ============================================================
// Termin jest obietnica wobec klienta i jednoczesnie danymi, z ktorych
// kolejka pracowni liczy, co jest spoznione. Musi wiec byc ten sam
// w koszyku i w bazie, a zmiana po jednej stronie ma wywalic build.

import assert from "node:assert/strict";
import {
  TERMIN_DOMYSLNY, terminPozycji, terminZamowienia, opisTerminu,
} from "../src/pricing/terminy.js";
import { terminZamowienia as terminServer } from "../chat-api/pricing/terminy.js";

let ok = 0;
const zdanie = (opis, fn) => { fn(); ok += 1; console.log("  ✓", opis); };

console.log("\n1. Domyslny zakres i wyjatki");
zdanie("domyslnie 7-14 dni", () => {
  assert.deepEqual(TERMIN_DOMYSLNY, { min: 7, max: 14 });
  const t = terminPozycji("print_fdm", {});
  assert.equal(t.min, 7);
  assert.equal(t.max, 14);
});
zdanie("odlew z metalu szlachetnego: 7-14 dni", () => {
  const t = terminPozycji("precious_metal_casting", { platingId: "none" });
  assert.equal(t.min, 7);
  assert.equal(t.max, 14);
});
zdanie("usluga z wlasnym terminem bierze swoj, nie domyslny", () => {
  const t = terminPozycji("cad_design", {});
  assert.equal(t.max, 10);
  assert.notEqual(t.max, TERMIN_DOMYSLNY.max);
});

console.log("\n2. Powloka galwaniczna doklada dwa dni");
zdanie("rod przesuwa 7-14 na 9-16", () => {
  const t = terminPozycji("precious_metal_casting", { platingId: "rhodium" });
  assert.equal(t.min, 9);
  assert.equal(t.max, 16);
});
zdanie("brak powloki nic nie doklada", () => {
  const bez = terminPozycji("precious_metal_casting", { platingId: "none" });
  const puste = terminPozycji("precious_metal_casting", {});
  assert.equal(bez.max, puste.max);
  assert.equal(bez.dodatki.length, 0);
});
zdanie("powod dokladki jedzie razem z liczba, w trzech jezykach", () => {
  const t = terminPozycji("precious_metal_casting", { platingId: "gold_pl" });
  assert.equal(t.dodatki.length, 1);
  for (const j of ["pl", "en", "de"]) assert.ok(t.dodatki[0].powod[j]);
});

console.log("\n3. Zamowienie bierze najdluzsza pozycje");
zdanie("dwie pozycje: wygrywa dluzsza, razem ze swoja dokladka", () => {
  const t = terminZamowienia([
    { serviceId: "print_fdm", params: {} },
    { serviceId: "precious_metal_casting", params: { platingId: "rhodium" } },
  ]);
  assert.equal(t.max, 16);
  // DOLNA GRANICA TEZ IDZIE Z NAJDLUZSZEJ POZYCJI. Wziecie najmniejszej
  // z calego zamowienia obiecywaloby siedem dni czegos, czego tam nie ma.
  assert.equal(t.min, 9);
});
zdanie("pusty koszyk nie ma terminu", () => {
  assert.equal(terminZamowienia([]), null);
  assert.equal(terminZamowienia(null), null);
});
zdanie("pozycja opisana nazwa kalkulatora liczy sie tak samo", () => {
  const przezUsluge = terminZamowienia([{ serviceId: "cad_design", params: {} }]);
  const przezKalkulator = terminZamowienia([{ calculator: "cad_design", params: {} }]);
  assert.deepEqual(przezUsluge, przezKalkulator);
});

console.log("\n4. Zdanie dla klienta");
zdanie("mowi, ze to szacunek, i kto potwierdzi ostateczny", () => {
  const o = opisTerminu(terminZamowienia([{ serviceId: "print_fdm", params: {} }]), "pl");
  assert.match(o.zakres, /7-14 dni/);
  assert.match(o.zastrzezenie, /pracowni/);
  assert.match(o.zastrzezenie, /osobnej wiadomości/);
});
zdanie("trzy jezyki maja komplet napisow", () => {
  const t = terminZamowienia([{ serviceId: "precious_metal_casting", params: { platingId: "rhodium" } }]);
  for (const j of ["pl", "en", "de"]) {
    const o = opisTerminu(t, j);
    assert.ok(o.etykieta && o.zakres && o.zastrzezenie && o.dodatki, `brak napisu w ${j}`);
  }
});

console.log("\n5. Przegladarka i serwer licza to samo");
zdanie("kopia w chat-api oddaje te sama liczbe", () => {
  const pozycje = [{ serviceId: "precious_metal_casting", params: { platingId: "rhodium" } }];
  assert.deepEqual(terminServer(pozycje), terminZamowienia(pozycje));
});

console.log(`\nCzas realizacji: ${ok} sprawdzen, wszystko sie zgadza`);
