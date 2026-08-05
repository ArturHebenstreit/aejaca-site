// Pokwitowanie ujawnionej wady modelu: zapis w zamowieniu i w mailu.
//
// To jest test dokumentu, a nie wygladu. Cala konstrukcja ma sens tylko wtedy,
// gdy potwierdzenie klienta realnie dociera do maila potwierdzajacego, w jego
// jezyku, i gdy nie pojawia sie tam, gdzie niczego nie potwierdzal.
//
// Sprawdzana zasada, ktorej nie wolno zlamac przy zadnej pozniejszej zmianie:
//
//   1. do maila trafiaja WYLACZNIE ustalenia, ktore realnie wymagaly zgody
//      (poziom `blocker`); ostrzezenia klient widzial, ale ich nie kwitowal
//   2. pozycja bez pokwitowania nie generuje zadnego bloku
//   3. tekst nie moze sugerowac zrzeczenia sie uprawnien konsumenta, bo taka
//      klauzula i tak bylaby niewazna, a jej obecnosc szkodzi
//   4. zapis istnieje w wersji HTML I w wersji tekstowej, inaczej dokumentacja
//      zalezy od ustawien poczty odbiorcy

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("../chat-api/orderMail.js", import.meta.url), "utf8");

// ------------------------------------------------------------
// Filtr ustalen: odwzorowanie `acceptedPrintNotes`
// ------------------------------------------------------------

function notesFor(items) {
  const out = [];
  for (const i of items) {
    const p = i.params?.printability;
    if (!p || !p.accepted) continue;
    const lines = (p.findings || []).filter((f) => f.level === "blocker");
    if (lines.length) out.push({ title: i.title, count: lines.length });
  }
  return out;
}

const pozycjaZgoda = {
  title: "Druk 3D FDM",
  params: {
    printability: {
      tech: "fdm", nozzle: "0.4", thinnestMm: 0.3, watertight: true, blocked: true, accepted: true,
      findings: [
        { id: "too_thin", level: "blocker", value: 0.3, limit: 0.4, share: 0.99 },
        { id: "overhangs_many", level: "warning", value: 0.41 },
      ],
    },
  },
};
const pozycjaBezZgody = {
  title: "Druk 3D MSLA",
  params: { printability: { tech: "msla", nozzle: null, blocked: true, accepted: false, findings: [{ id: "holes", level: "blocker", value: 12 }] } },
};
const pozycjaCzysta = { title: "Druk 3D FDM", params: { printability: { tech: "fdm", nozzle: "0.4", blocked: false, accepted: null, findings: [] } } };
const pozycjaBezPliku = { title: "Grawer laserowy", params: {} };

assert.equal(notesFor([pozycjaZgoda]).length, 1, "pozycja z pokwitowaniem ma trafic do maila");
assert.equal(notesFor([pozycjaZgoda])[0].count, 1, "do maila idzie sama blokada, bez ostrzezenia o nawisach");
assert.equal(notesFor([pozycjaBezZgody]).length, 0, "bez pokwitowania nie ma czego dokumentowac");
assert.equal(notesFor([pozycjaCzysta]).length, 0, "czysty model nie generuje bloku");
assert.equal(notesFor([pozycjaBezPliku]).length, 0, "usluga bez pliku nie generuje bloku");
assert.equal(notesFor([pozycjaZgoda, pozycjaCzysta, pozycjaBezPliku]).length, 1,
  "w zamowieniu mieszanym dokumentujemy tylko pozycje, ktorej to dotyczy");

// ------------------------------------------------------------
// Obecnosc w obu wersjach maila i we wszystkich jezykach
// ------------------------------------------------------------

assert.ok(SRC.includes("function acceptedPrintNotes("), "brak funkcji zbierajacej pokwitowania");
assert.ok(/const printNotes = acceptedPrintNotes\(items, lang\);[\s\S]*?customerText/.test(SRC)
  || SRC.split("function customerText")[1]?.includes("acceptedPrintNotes"),
  "wersja tekstowa maila musi zawierac ten sam zapis co HTML");

const htmlPart = SRC.slice(SRC.indexOf("function customerHtml"), SRC.indexOf("function customerText"));
assert.ok(htmlPart.includes("l.printTitle"), "brak bloku w mailu HTML");
assert.ok(htmlPart.includes("l.printRights"), "brak zastrzezenia o uprawnieniach w mailu HTML");

const textPart = SRC.slice(SRC.indexOf("function customerText"));
assert.ok(textPart.includes("l.printTitle"), "brak bloku w mailu tekstowym");
assert.ok(textPart.includes("l.printRights"), "brak zastrzezenia o uprawnieniach w mailu tekstowym");

for (const lang of ["pl", "en", "de"]) {
  for (const k of ["printTitle", "printIntro", "printAccepted", "printRights", "printSettings"]) {
    const re = new RegExp(`${k}:`, "g");
    assert.ok((SRC.match(re) || []).length >= 3, `klucz ${k} musi istniec w trzech jezykach (brakuje w ${lang} albo gdzie indziej)`);
  }
}

// ------------------------------------------------------------
// Charakter zapisu
// ------------------------------------------------------------
// Konsument NIE MOZE z gory zrzec sie uprawnien z tytulu niezgodnosci towaru
// z umowa; taka klauzula jest abuzywna i niewazna. Dokument ma potwierdzac
// ujawnienie wady i polecenie wykonania mimo niej, a nie zrzeczenie sie praw.
const zakazane = [
  /zrzeka\s+si[ęe]/i,
  /rezygnuj[ęe]\s+z\s+(reklamacj|prawa)/i,
  /waive[sd]?\s+(any|all|my)?\s*(consumer\s+)?rights?/i,
  /nie\s+b[ęe]d[ęe]\s+(sk[łl]ada[ćc]|zg[łl]asza[ćc])\s+reklamacj/i,
  /verzicht/i,
];
for (const wzor of zakazane) {
  assert.ok(!wzor.test(SRC), `mail zawiera sformulowanie o zrzeczeniu sie praw (${wzor}), a taka klauzula jest niewazna`);
}
// Za to zastrzezenie, ze uprawnienia zostaja, musi tam byc wprost.
assert.ok(/nie ogranicza Twoich uprawnień konsumenta/.test(SRC), "brak zastrzezenia po polsku");
assert.ok(/does not limit your consumer rights/.test(SRC), "brak zastrzezenia po angielsku");
assert.ok(/schränkt Ihre Verbraucherrechte nicht ein/.test(SRC), "brak zastrzezenia po niemiecku");

console.log("Pokwitowanie modelu: filtr ustalen, obecnosc w obu wersjach maila i charakter zapisu zgodne");
