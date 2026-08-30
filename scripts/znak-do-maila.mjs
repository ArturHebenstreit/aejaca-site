// ============================================================
// ZNAK FIRMOWY DO MAILI
// ============================================================
// Znak w serwisie to CIENKI KONTUR na przezroczystym tle, rysowany na ciemnym
// tle przez `brightness-0 invert`. W mailu tego filtru nie ma, a przy 36 px
// wlosowa kreska po prostu znika: na bialej karcie zostaje szara plamka,
// a na ciemnym tle klienta pocztowego nie zostaje nic.
//
// Ten skrypt robi z niego WERSJE Z WYPELNIENIEM: zloty krazek, a splot i
// litery wyciete z niego na bialo. Taki znak czyta sie na kazdym tle, bo sam
// niesie swoje tlo, i nie zalezy od tego, czy klient pocztowy ma jasny motyw.
//
//   npm run img:mail
//
// Zrodlo: `public/logo.png`. Wynik: `public/logo-mail.png`.
// Plik jest w repozytorium, bo mail siega po niego przez siec i musi go tam
// zastac takze wtedy, gdy nikt nie uruchomil zadnego generatora.

import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const ZRODLO = join(KORZEN, "public", "logo.png");
const WYNIK = join(KORZEN, "public", "logo-mail.png");

const ZLOTO = [0xb5, 0x8a, 0x3c];   // ten sam zloty, co w naglowkach maili
// Plotno robocze jest OSMIOKROTNOSCIA zrodla, a wynik czterokrotnie mniejszy.
// Przy mniejszym zapasie schodki po powiekszeniu najblizszym sasiadem
// przezywaja zmniejszanie i brzeg krazka wychodzi postrzepiony.
const S = 1200;
const KONIEC = 256;                  // dwukrotnosc najwiekszego uzycia w mailu
const POGRUBIENIE = 6;               // w pikselach plotna roboczego

const { data, info } = await sharp(ZRODLO).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// Kreska to wszystko, co nie jest biala plama tla. Czesc splotu jest szara
// i polprzezroczysta, wiec prog postawiony na ciemnosci gubil pol rysunku.
const mala = Buffer.alloc(info.width * info.height);
for (let i = 0, p = 0; i < data.length; i += 4, p++) {
  if (data[i + 3] > 32 && (data[i] + data[i + 1] + data[i + 2]) / 3 < 240) mala[p] = 255;
}

// Powiekszenie najblizszym sasiadem, zeby kreska zostala kreska. UWAGA: sharp
// po `resize` oddaje TRZY kanaly, nawet gdy wejscie mialo jeden, wiec czytamy
// co trzeci bajt. Czytanie tego jak jednego kanalu daje szachownice zamiast znaku.
const { data: skala, info: infoS } = await sharp(mala, { raw: { width: info.width, height: info.height, channels: 1 } })
  .resize(S, S, { kernel: "nearest" })
  .raw().toBuffer({ resolveWithObject: true });
const plotno = Buffer.alloc(S * S);
for (let p = 0; p < S * S; p++) plotno[p] = skala[p * infoS.channels];

/** Filtr maksimum po kole: pogrubienie kreski w scislym sensie. Rozmycie
 *  z progiem, ktore kusi prostota, cienki splot po prostu rozpuszcza. */
function pogrub(zrodlo, r) {
  const wynik = Buffer.alloc(S * S);
  const kolo = [];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) kolo.push(dy * S + dx);
  }
  for (let y = r; y < S - r; y++) {
    for (let x = r; x < S - r; x++) {
      const p = y * S + x;
      for (const d of kolo) if (zrodlo[p + d]) { wynik[p] = 255; break; }
    }
  }
  return wynik;
}

// Lekkie zmiekczenie po pogrubieniu: kreska ma wejsc w zmniejszanie z gladka
// krawedzia, inaczej litery w srodku wychodza zabkowane.
const { data: zmiekczona, info: infoZ } = await sharp(pogrub(plotno, POGRUBIENIE), { raw: { width: S, height: S, channels: 1 } })
  .blur(2).raw().toBuffer({ resolveWithObject: true });
const kreska = Buffer.alloc(S * S);
for (let p = 0; p < S * S; p++) kreska[p] = zmiekczona[p * infoZ.channels];

// Zloty krazek, splot wyciety na bialo. Brzeg wygladzony recznie, bo krazek
// rysujemy sami, a nie skladamy z gotowego ksztaltu.
const obraz = Buffer.alloc(S * S * 4);
const srodek = S / 2;
// Brzeg krazka wygladzamy pasmem SZEROKIM NA KILKA PIKSELI plotna roboczego.
// Pasmo jednopikselowe znika przy zmniejszaniu i obwod wychodzi w schodkach.
const promien = S / 2 - 2;
const PASMO = S / KONIEC;
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const p = y * S + x;
    const odleglosc = Math.hypot(x - srodek + 0.5, y - srodek + 0.5);
    const wKrazku = odleglosc <= promien - PASMO ? 255
      : odleglosc <= promien ? Math.round(255 * (promien - odleglosc) / PASMO) : 0;
    const tusz = kreska[p] / 255;
    obraz[p * 4] = Math.round(ZLOTO[0] * (1 - tusz) + 255 * tusz);
    obraz[p * 4 + 1] = Math.round(ZLOTO[1] * (1 - tusz) + 255 * tusz);
    obraz[p * 4 + 2] = Math.round(ZLOTO[2] * (1 - tusz) + 255 * tusz);
    obraz[p * 4 + 3] = wKrazku;
  }
}

await sharp(obraz, { raw: { width: S, height: S, channels: 4 } })
  .resize(KONIEC, KONIEC, { kernel: "lanczos3" })
  // Bez palety: kwantyzacja postrzepila wygladzony brzeg krazka, a roznica
  // w wadze pliku jest w mailu bez znaczenia.
  .png({ compressionLevel: 9 })
  .toFile(WYNIK);

const { size } = await sharp(WYNIK).metadata();
console.log(`Znak do maili: public/logo-mail.png, ${KONIEC} px, ${Math.round((size || 0) / 1024)} kB`);
