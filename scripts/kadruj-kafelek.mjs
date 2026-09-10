#!/usr/bin/env node
// ============================================================
// KADROWANIE OBRAZU KAFELKA DO KWADRATU
// ============================================================
// Generator obrazow zostawia wokol przedmiotu duzo czarnego tla. Na zdjeciu
// w pelnej wielkosci wyglada to dobrze, ale kafelek w kreatorze ma jakies
// 180 pikselow, wiec przedmiot zajmujacy 40% kadru schodzi do 70 pikseli,
// a jego szczegol, ktory jest calym sensem kafelka, do kilkunastu.
//
// Pierwszy przypadek: `text_print`, czyli plytka z reliefem zatopiona
// w bryle zywicy (2026-09-10). Relief to wloskowe kreski. Przy 45 pikselach
// znikaja bez sladu i kafelek czyta sie jako biala plamka w szkle.
//
// Skrypt znajduje przedmiot po tym, ze tlo jest jednolite (`trim` bierze
// kolor lewego gornego piksela), obudowuje go kwadratem z marginesem
// i skaluje do 512 x 512, czyli do wielkosci, ktora ma reszta katalogu.
// Margines zostaje, bo przedmiot dociety do samej krawedzi wyglada na
// wciety, a `MaterialCards` rysuje go w zaokraglonej ramce.
//
//   node scripts/kadruj-kafelek.mjs <wejscie> <wyjscie> [margines]
//
// `margines` to ulamek dluzszego boku przedmiotu, domyslnie 0.12.

import sharp from "sharp";
import { existsSync } from "node:fs";

const [, , wejscie, wyjscie, marginesArg] = process.argv;
if (!wejscie || !wyjscie) {
  console.error("Uzycie: node scripts/kadruj-kafelek.mjs <wejscie> <wyjscie> [margines]");
  process.exit(1);
}
if (!existsSync(wejscie)) {
  console.error(`Nie ma pliku: ${wejscie}`);
  process.exit(1);
}

const MARGINES = Number(marginesArg ?? 0.12);
const BOK = 512;

const meta = await sharp(wejscie).metadata();

/**
 * Prostokat, w ktorym cos jest, liczony z jasnosci pikseli.
 *
 * `sharp.trim()` odpada, bo szuka JEDNOLITEJ ramki wokol kadru, a tlo tych
 * zdjec ma delikatny gradient i winiete: proba na `object.webp` oddala caly
 * obraz jako przedmiot. Czytamy wiec obraz w szarosciach i szukamy wierszy
 * i kolumn, w ktorych cokolwiek przekracza prog jasnosci. Odbicie na blacie
 * jest ciemniejsze niz przedmiot, wiec prog 40 je pomija, a przedmiot lapie.
 */
async function obszarPrzedmiotu(plik, prog = 40) {
  const { data, info } = await sharp(plik).greyscale().raw().toBuffer({ resolveWithObject: true });
  let lewo = info.width, prawo = -1, gora = info.height, dol = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[y * info.width + x] < prog) continue;
      if (x < lewo) lewo = x;
      if (x > prawo) prawo = x;
      if (y < gora) gora = y;
      if (y > dol) dol = y;
    }
  }
  if (prawo < 0) return null;
  return { lewo, gora, szer: prawo - lewo + 1, wys: dol - gora + 1 };
}

const obszar = await obszarPrzedmiotu(wejscie);
if (!obszar) {
  console.error("Nie znalazlem przedmiotu: caly obraz jest ciemniejszy niz prog jasnosci");
  process.exit(1);
}
const { lewo, gora, szer, wys } = obszar;

// Kwadrat opisany na przedmiocie, wysrodkowany na nim, powiekszony o margines.
const bok = Math.round(Math.max(szer, wys) * (1 + 2 * MARGINES));
const srodekX = lewo + szer / 2;
const srodekY = gora + wys / 2;
// Przyciecie do granic obrazu: przedmiot stojacy przy krawedzi nie moze
// wypchnac kadru poza plik, bo `extract` konczy sie wtedy bledem.
const maks = Math.min(bok, meta.width, meta.height);
const x = Math.round(Math.min(Math.max(0, srodekX - maks / 2), meta.width - maks));
const y = Math.round(Math.min(Math.max(0, srodekY - maks / 2), meta.height - maks));

await sharp(wejscie)
  .extract({ left: x, top: y, width: maks, height: maks })
  .resize(BOK, BOK, { fit: "cover" })
  .webp({ quality: 82 })
  .toFile(wyjscie);

const udzialPrzed = Math.round((Math.max(szer, wys) / Math.max(meta.width, meta.height)) * 100);
const udzialPo = Math.round((Math.max(szer, wys) / maks) * 100);
console.log(`${wejscie} ${meta.width}x${meta.height}`);
console.log(`  przedmiot: ${szer}x${wys} w punkcie ${lewo},${gora}`);
console.log(`  kadr: ${maks}x${maks} w punkcie ${x},${y}`);
console.log(`  przedmiot zajmowal ${udzialPrzed}% kadru, zajmuje ${udzialPo}%`);
console.log(`  zapisano ${wyjscie} jako ${BOK}x${BOK} webp`);
