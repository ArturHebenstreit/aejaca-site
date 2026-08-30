// ============================================================
// ZNAK FIRMOWY DO MAILI
// ============================================================
// Znak w serwisie stoi na ciemnym tle i jest rozjasniany filtrem CSS
// (`brightness-0 invert`). W mailu tego filtru nie ma, a tlo karty jest biale,
// wiec znak trzeba wziac W PELNEJ POSTACI i pomalowac go wprost.
//
// KLUCZOWA RZECZ O ZRODLE: `public/logo.png` to nie jest kontur. Wstegi splotu
// sa w nim WYPELNIONE bialym, a tlo i dziury miedzy wstegami sa przezroczyste.
// Pelny ksztalt znaku niesie wiec KANAL KRYCIA, i wystarczy go pomalowac.
//
// Pierwsze podejscie bralo ciemne piksele, czyli sam obrys wstegi, i probowalo
// go pogrubiac. To jest ta sama figura od drugiej strony: zamiast wstegi
// wychodzila jej krawedz, a zamiast splotu plątanina kresek.
//
//   npm run img:mail
//
// Zrodlo: `public/logo.png`. Wynik: `public/logo-mail.png`.
// Plik lezy w repozytorium, bo mail siega po niego przez siec i musi go tam
// zastac takze wtedy, gdy nikt nie uruchomil zadnego generatora.

import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const ZRODLO = join(KORZEN, "public", "logo.png");
const WYNIK = join(KORZEN, "public", "logo-mail.png");

const ZLOTO = [0xb5, 0x8a, 0x3c];   // ten sam zloty, co naglowki i odnosniki w mailach
const S = 1200;                      // plotno robocze, osmiokrotnosc zrodla
const KONIEC = 256;                  // dwukrotnosc najwiekszego uzycia w mailu

const { data, info } = await sharp(ZRODLO).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

/** Pelny ksztalt znaku: wszystko, co w zrodle jest kryjace. */
const ksztalt = Buffer.alloc(info.width * info.height);
for (let i = 0, p = 0; i < data.length; i += 4, p++) ksztalt[p] = data[i + 3] > 32 ? 255 : 0;

// Powiekszenie najblizszym sasiadem trzyma ostry ksztalt, lekkie rozmycie
// robi z jego schodkow gladka krawedz, a zmniejszenie o czwarta czesc
// zamienia to na porzadne wygladzenie. UWAGA: sharp po `resize` oddaje TRZY
// kanaly, nawet gdy wejscie mialo jeden. Czytanie tego jak jednego kanalu
// daje szachownice zamiast znaku.
const { data: duzy, info: infoD } = await sharp(ksztalt, { raw: { width: info.width, height: info.height, channels: 1 } })
  .resize(S, S, { kernel: "nearest" })
  .blur(2)
  .raw().toBuffer({ resolveWithObject: true });

const obraz = Buffer.alloc(S * S * 4);
for (let p = 0; p < S * S; p++) {
  obraz[p * 4] = ZLOTO[0];
  obraz[p * 4 + 1] = ZLOTO[1];
  obraz[p * 4 + 2] = ZLOTO[2];
  obraz[p * 4 + 3] = duzy[p * infoD.channels];
}

await sharp(obraz, { raw: { width: S, height: S, channels: 4 } })
  .resize(KONIEC, KONIEC, { kernel: "lanczos3" })
  .png({ compressionLevel: 9 })
  .toFile(WYNIK);

console.log(`Znak do maili: public/logo-mail.png, ${KONIEC} px, zloto ${ZLOTO.map((n) => n.toString(16)).join("")}`);
