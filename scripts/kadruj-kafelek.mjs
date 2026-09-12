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
//   node scripts/kadruj-kafelek.mjs <wejscie> <wyjscie> [margines] [prog] [ksztalt] [przesuniecie]
//
// `przesuniecie` przesuwa kadr w pionie o ulamek jego wysokosci, dodatnie w dol.
// Potrzebne tam, gdzie wykryty prostokat obejmuje cos, co NIE JEST sensem
// zdjecia: przy kafelku "z Twojego przedmiotu" strumien silikonu siegal gornej
// krawedzi, wiec srodek wypadl wysoko, a drewniany listek, czyli caly sens tego
// kafelka, schowal sie pod podpisem. Wykrycie po jasnosci nie wie, co jest
// tematem, a co tlem akcji, i nie ma jak sie tego domyslic.
//
// `ksztalt` to `kwadrat` (domyslnie) albo `pas`. Kwadrat jest dla kafelkow
// rysowanych przez `MaterialCards`, ktore pokazuja caly obraz. `pas` jest dla
// `HeroCards`, ktore rysuja obraz w polu 315 x 168 i przycinaja go SAME, biorac
// srodkowy pasek. Kwadrat oddany takiemu kafelkowi traci gore i dol: owalny
// wzorzec z kafelka "z Twojego pliku 3D" zostal przez to przeciety na pol i po
// historii "polowa lustro, polowa mat" nie zostalo sladu. `pas` oddaje 16:9.
//
// `margines` to ulamek dluzszego boku przedmiotu, domyslnie 0.12.
// `prog` to jasnosc, od ktorej piksel liczy sie jako przedmiot, domyslnie 120.
//
// Skrypt WYPISUJE, jaki prostokat znalazl i jaki udzial kadru zajmuje przedmiot
// przed cieciem i po. To nie jest ozdoba: zle wykrycie widac wlasnie po tym, ze
// przedmiot zajmowal 99% kadru, chociaz na oko zajmuje polowe.

import sharp from "sharp";
import { existsSync } from "node:fs";

const [, , wejscie, wyjscie, marginesArg, progArg, ksztaltArg, przesuniecieArg] = process.argv;
if (!wejscie || !wyjscie) {
  console.error("Uzycie: node scripts/kadruj-kafelek.mjs <wejscie> <wyjscie> [margines] [prog] [kwadrat|pas]");
  process.exit(1);
}
if (!existsSync(wejscie)) {
  console.error(`Nie ma pliku: ${wejscie}`);
  process.exit(1);
}

const MARGINES = Number(marginesArg ?? 0.12);
// PROG 120, NIE 40. Pierwsza wersja brala 40 i na obu zdjeciach z 10 wrzesnia
// oddawala prawie caly kadr jako przedmiot: te tla nie sa plaska czernia, tylko
// niosa kaluze swiatla za przedmiotem i jego odbicie na blacie. Jedno i drugie
// przekracza 40, a nie przekracza 120. Sprawdzone przez przemiatanie progow:
// przy 120 wynik jest STABILNY, czyli nie zmienia sie miedzy 120 a 150, wiec
// nie jest przypadkowym trafieniem w zbocze gradientu.
const PROG = Number(progArg ?? 120);
const PAS = String(ksztaltArg ?? "kwadrat") === "pas";
const PRZESUNIECIE = Number(przesuniecieArg ?? 0);
const BOK = 512;
const PAS_SZER = 768;
const PAS_WYS = 432;

const meta = await sharp(wejscie).metadata();

/**
 * Prostokat, w ktorym cos jest, liczony z jasnosci pikseli.
 *
 * `sharp.trim()` odpada, bo szuka JEDNOLITEJ ramki wokol kadru, a tlo tych
 * zdjec ma delikatny gradient i winiete: proba na `object.webp` oddala caly
 * obraz jako przedmiot. Czytamy wiec obraz w szarosciach i szukamy wierszy
 * i kolumn, w ktorych cokolwiek przekracza prog jasnosci.
 */
async function obszarPrzedmiotu(plik, prog = PROG) {
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

// Prostokat opisany na przedmiocie, wysrodkowany na nim, powiekszony o margines.
// Przy kwadracie bok bierze sie z dluzszej krawedzi przedmiotu. Przy pasie
// wiazaca jest WYSOKOSC, a szerokosc dolicza sie do 16:9: przegladarka przytnie
// potem boki, a nie gore, wiec to wysokosc decyduje, czy przedmiot przezyje.
const zadanaWys = Math.round((PAS ? wys : Math.max(szer, wys)) * (1 + 2 * MARGINES));
const zadanaSzer = PAS ? Math.round((zadanaWys * PAS_SZER) / PAS_WYS) : zadanaWys;
// Przyciecie do granic obrazu: przedmiot stojacy przy krawedzi nie moze wypchnac
// kadru poza plik, bo `extract` konczy sie wtedy bledem. Skalujemy OBA wymiary
// tym samym czynnikiem, zeby proporcja nie uciekla, gdy zadany kadr jest
// szerszy albo wyzszy niz caly obraz.
const skala = Math.min(1, meta.width / zadanaSzer, meta.height / zadanaWys);
const kadrSzer = Math.floor(zadanaSzer * skala);
const kadrWys = Math.floor(zadanaWys * skala);
const srodekX = lewo + szer / 2;
const srodekY = gora + wys / 2;
const x = Math.round(Math.min(Math.max(0, srodekX - kadrSzer / 2), meta.width - kadrSzer));
const y = Math.round(Math.min(Math.max(0, srodekY - kadrWys / 2 + PRZESUNIECIE * kadrWys), meta.height - kadrWys));

await sharp(wejscie)
  .extract({ left: x, top: y, width: kadrSzer, height: kadrWys })
  .resize(PAS ? PAS_SZER : BOK, PAS ? PAS_WYS : BOK, { fit: "cover" })
  .webp({ quality: 82 })
  .toFile(wyjscie);

// Udzial mierzymy po WYSOKOSCI przy pasie i po dluzszym boku przy kwadracie,
// bo to ten wymiar decyduje, czy przedmiot przezyje przyciecie w przegladarce.
const udzialPrzed = Math.round(((PAS ? wys : Math.max(szer, wys)) / (PAS ? meta.height : Math.max(meta.width, meta.height))) * 100);
const udzialPo = Math.round(((PAS ? wys : Math.max(szer, wys)) / kadrWys) * 100);
console.log(`${wejscie} ${meta.width}x${meta.height}`);
console.log(`  przedmiot: ${szer}x${wys} w punkcie ${lewo},${gora}`);
console.log(`  kadr: ${kadrSzer}x${kadrWys} w punkcie ${x},${y}`);
console.log(`  przedmiot zajmowal ${udzialPrzed}% kadru, zajmuje ${udzialPo}%`);
console.log(`  zapisano ${wyjscie} jako ${PAS ? `${PAS_SZER}x${PAS_WYS}` : `${BOK}x${BOK}`} webp`);
