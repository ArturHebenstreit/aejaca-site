#!/usr/bin/env node
// ============================================================
// PACZKA MODELI: KILKA PLIKOW, KILKA POZYCJI, JEDNE USTAWIENIA
// ============================================================
// Do 2026-09-06 jedno wgranie znaczylo jeden model i jedna pozycje w koszyku.
// Klient z dziesiecioma czesciami do wydrukowania musial przejsc kalkulator
// dziesiec razy, ustawiajac za kazdym razem ten sam material, to samo
// wypelnienie i to samo wykonczenie. Takie zlecenia konczyly sie mailem
// "czy moge przeslac paczke plikow", czyli poza sklepem.
//
// Trzy rozstrzygniecia wlasciciela z tego dnia i po jednej cichej awarii,
// ktora ten sprawdzian trzyma za reke:
//
// 1. KAZDY MODEL TO OSOBNA POZYCJA. Nie jedna pozycja z dziesiecioma plikami.
//    Kwota wiazaca powstaje ze ZMIERZONEJ bryly, a bryla nalezy do pliku;
//    pozycja z dziesiecioma geometriami wymagalaby zmiany modelu danych
//    w kasie, panelu, kolejce produkcji i mailach. Tu pilnujemy, ze petla
//    dodawania naprawde stoi w obu miejscach.
//
// 2. LIMIT DOTYCZY JEDNEGO WGRANIA, nie calego koszyka. Przegladarka liczy
//    geometrie u siebie i przy dwudziestu plikach naraz przestaje odpowiadac.
//    Odrzucone pliki wracaja Z NAZWAMI: klient wybral dwanascie plikow
//    z katalogu i po dwoch minutach nie pamieta, ktore to byly.
//
// 3. DO KOSZYKA WCHODZI TYLKO MODEL Z KWOTA WIAZACA. Model bez zmierzonej
//    bryly odrzucilaby i tak kasa, wiec wlozenie go do koszyka konczyloby sie
//    odmowa dopiero przy platnosci, czyli w najgorszym mozliwym miejscu.
//
// Czwarta rzecz jest o kopiach: lista formatow modelu stala w DWOCH miejscach,
// a od dolozenia paczki bylaby w trzech. Kopia rozjezdza sie przy dolozeniu
// formatu i objawem jest pole wyboru pliku, ktore nie widzi tego, co serwer
// przyjmuje.
//
// Uruchamiany w `npm run build`.

import { readFileSync } from "node:fs";

let bledy = 0;
const ok = (warunek, opis, co) => {
  if (warunek) console.log("  ok  " + opis);
  else { console.log("  ZLE " + opis + (co === undefined ? "" : "  ->  " + JSON.stringify(co))); bledy += 1; }
};
const plik = (sciezka) => readFileSync(new URL(sciezka, import.meta.url), "utf8");

const M = await import("../src/shop/paczkaModeli.js");

console.log("1. Limit dotyczy jednego wgrania i liczy to, co juz jest");
{
  ok(M.LIMIT_PACZKI === 10, "dziesiec modeli na wgranie", M.LIMIT_PACZKI);
  const pliki = Array.from({ length: 14 }, (_, i) => ({ name: `czesc-${i}.stl`, size: 100 + i }));
  const a = M.podzielPaczke(pliki, 0);
  ok(a.przyjete.length === 10, "z czternastu wchodzi dziesiec", a.przyjete.length);
  ok(a.odrzucone.length === 4, "cztery zostaja poza paczka", a.odrzucone.length);
  ok(a.odrzucone[0] === "czesc-10.stl", "odrzucone wracaja z NAZWAMI, nie jako liczba", a.odrzucone[0]);

  // Drugie wgranie do tej samej paczki widzi, ile miejsca zostalo.
  const b = M.podzielPaczke(pliki, 8);
  ok(b.przyjete.length === 2, "przy osmiu juz w paczce wchodza dwa", b.przyjete.length);
  const c = M.podzielPaczke(pliki, 10);
  ok(c.przyjete.length === 0 && c.odrzucone.length === 14, "pelna paczka nie przyjmuje nic");
  ok(M.podzielPaczke(null, 0).przyjete.length === 0, "brak plikow nie wywraca podzialu");
}

console.log("2. Komunikat mowi, co odpadlo, w jezyku klienta");
{
  ok(M.komunikatPaczki([], "pl") === null, "gdy weszlo wszystko, nie ma o czym mowic");
  const widziane = new Set();
  for (const lang of ["pl", "en", "de"]) {
    const k = M.komunikatPaczki(["a.stl", "b.stl"], lang);
    ok(typeof k === "string" && k.includes("a.stl") && k.includes("b.stl"), `${lang}: wymienia nazwy`);
    widziane.add(k);
  }
  ok(widziane.size === 3, "kazdy jezyk ma wlasne zdanie, a nie kopie polskiego", widziane.size);
  // Zdanie ma prowadzic do DRUGIEJ PACZKI w tym samym koszyku, a nie do
  // drugiego zamowienia: inaczej klient placi dwie wysylki.
  ok(/koszyka/.test(M.komunikatPaczki(["a.stl"], "pl")), "po polsku odsyla do tego samego koszyka");
}

console.log("3. Formaty modelu stoja w jednym miejscu");
{
  ok(/\.stl/.test(M.FORMATY_MODELU) && /\.3mf/.test(M.FORMATY_MODELU) && /\.step/.test(M.FORMATY_MODELU),
    "lista niesie formaty, ktore przyjmuje wycena", M.FORMATY_MODELU);
  for (const f of ["../src/components/calculators/Print3DCalc.jsx",
                   "../src/components/calculators/MetalCastCalc.jsx"]) {
    const tresc = plik(f);
    ok(/FORMATY_MODELU/.test(tresc), `${f.split("/").pop()}: czyta wspolna liste`);
    ok(!/"\.stl,\.obj/.test(tresc), `${f.split("/").pop()}: nie ma wlasnej kopii listy`);
  }
}

console.log("4. Tozsamosc wpisu rozroznia pliki o tej samej nazwie");
{
  const f = { name: "czesc.stl", size: 120 };
  ok(M.idModelu(f, 0) !== M.idModelu(f, 1), "dwa te same pliki wybrane naraz maja rozne id");
}

console.log("5. Kalkulator dodaje osobna pozycje na kazdy model");
{
  const kasa = plik("../src/components/calculators/CalcToCart.jsx");
  ok(/podzielPaczke/.test(kasa) && /wgrajModel/.test(kasa) && /wycenModel/.test(kasa),
    "korzysta ze wspolnej warstwy, a nie z wlasnej kopii");
  ok(/for \(const model of paczkaGotowa\)/.test(kasa),
    "petla dodaje po jednej pozycji na model");
  // Bez tego filtra do koszyka trafialby model bez kwoty wiazacej, a kasa
  // odmowilaby dopiero przy platnosci.
  ok(/paczkaGotowa = paczka\.filter\(\(m\) => m\.token && m\.binding/.test(kasa),
    "do koszyka wchodzi tylko model z tokenem i z kwota wiazaca");
  ok(/paczkaMozliwa = Boolean\(uploadToken\)/.test(kasa),
    "pole paczki pokazuje sie dopiero, gdy model glowny jest u nas");
  ok(/print3d_fdm", "print3d_msla", "jewelry_casting/.test(kasa),
    "i tylko tam, gdzie cena bierze sie z pliku");
  ok(/multiple/.test(kasa), "pole przyjmuje kilka plikow naraz");
  // Ustawienia sa wspolne: pozycja z paczki jedzie z tymi samymi parametrami.
  ok(/params: paramsZPodstawa,[\s\S]{0,400}uploadToken: model\.token/.test(kasa),
    "model z paczki dziedziczy ustawienia z formularza");
}

console.log("6. Karta uslugi w sklepie zachowuje sie tak samo");
{
  const karta = plik("../src/components/shop/ServiceConfigurator.jsx");
  ok(/paczkaModeli/.test(karta), "karta uslugi korzysta z tej samej warstwy");
  ok(/multiple/.test(karta), "pole przyjmuje kilka plikow naraz");
  ok(/LIMIT_PACZKI/.test(karta), "zna ten sam limit, a nie wlasny");
}

console.log(bledy ? `\nBLEDY: ${bledy}` : "\nPaczka modeli: jedno wgranie, kilka pozycji, jedne ustawienia");
process.exit(bledy ? 1 : 0);
