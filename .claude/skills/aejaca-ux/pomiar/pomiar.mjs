// ============================================================
// POMIAR UX: JEDNO POLECENIE, TRZY SKRYPTY, WLASNY SERWER
// ============================================================
// `npm run ux:pomiar` uruchamia po kolei mape (crawl ze zrzutami), dostepnosc
// (axe-core w obu motywach i obu szerokosciach) i bledy (wzorce z site-audit
// plus przekierowania i martwe klikniecia). Wynik laduje w `audyt-ux/`,
// a czyta go skill `site-audit` i skill `aejaca-ux`.
//
// Serwer statyczny jest tutaj, a nie w instrukcji, bo instrukcja "uruchom
// sobie serwer" konczy sie `npx serve -s dist`, ktory oddaje `index.html` pod
// KAZDYM adresem. Pomiar idzie wtedy po stronie glownej dwadziescia piec razy
// i kazda hydracja wyglada na zepsuta. Ten serwer oddaje 404 tam, gdzie pliku
// nie ma, dokladnie jak produkcja (`public/_redirects` nie ma reguly lapiacej
// wszystko). Wzor: `scripts/check-menu-jezyka.mjs`.
//
//   npm run build
//   npm run ux:pomiar                                  dist/ na wlasnym serwerze, 25 stron
//   npm run ux:pomiar -- --wszystko                    caly serwis
//   npm run ux:pomiar -- --start=https://www.aejaca.com/   produkcja (maszyna lokalna)
//   npm run ux:pomiar -- --tylko=bledy --bez-klikania  jeden skrypt, bez klikania
//
// Nie stoi w `npm run build`: build leci na Cloudflare Pages, gdzie nie ma
// przegladarki, a pomiar to miernik, nie straznik. Kiedy jedna klasa bledu
// wroci drugi raz, TEN JEDEN sprawdzian przenosi sie do bramki w `scripts/`.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { parsujArgumenty } from "./wspolne.mjs";

const TU = dirname(fileURLToPath(import.meta.url));
const KORZEN = join(TU, "..", "..", "..", "..");
const DIST = join(KORZEN, "dist");

const TYPY = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".avif": "image/avif", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
  ".wasm": "application/wasm",
};

const arg = parsujArgumenty(process.argv.slice(2), { wyjscie: "audyt-ux" });
const KROKI = ["mapa", "dostepnosc", "bledy"];
const tylko = arg.tylko ? String(arg.tylko).split(",") : KROKI;
for (const k of tylko) {
  if (!KROKI.includes(k)) { console.error(`Nieznany krok: ${k}. Dostepne: ${KROKI.join(", ")}`); process.exit(2); }
}

/** Serwer bez awaryjnego `index.html`: martwy adres oddaje 404, jak produkcja. */
async function serwujDist() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("Brak dist/index.html. Najpierw `npm run build`.");
    process.exit(2);
  }
  const serwer = createServer(async (req, res) => {
    const sciezka = decodeURIComponent(req.url.split("?")[0]);
    let kandydat = join(DIST, sciezka);
    try {
      if ((await stat(kandydat)).isDirectory()) kandydat = join(kandydat, "index.html");
      const dane = await readFile(kandydat);
      res.writeHead(200, { "Content-Type": TYPY[extname(kandydat)] || "application/octet-stream" });
      res.end(dane);
    } catch {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<!doctype html><title>404</title><h1>404</h1>");
    }
  });
  // Port STALY, nie losowy. Mapa zapisuje pelne adresy, wiec `--tylko=bledy`
  // uruchomione po poludniu musi trafic w ten sam serwer, co mapa z rana.
  // Pierwsza wersja brala port losowy i `bledy.mjs` zglosil 25 stron
  // "navigation-error" i 255 przekierowan, bo pukal do portu, ktorego juz
  // nie bylo. `--port=` zmienia go, gdy 4177 jest zajety.
  const port = Number(arg.port ?? 4177);
  await new Promise((ok, zle) => {
    serwer.once("error", (e) => zle(new Error(`Port ${port} zajety albo niedostepny (${e.code}). Podaj --port=.`)));
    serwer.listen(port, "127.0.0.1", ok);
  }).catch((e) => { console.error(e.message); process.exit(2); });
  return { serwer, adres: `http://127.0.0.1:${port}/` };
}

let serwer = null;
let start = arg.start;
if (!start) ({ serwer, adres: start } = await serwujDist());
if (!start.endsWith("/")) start += "/";

// Argumenty ida dalej bez zmian; kazdy skrypt bierze swoje, reszte ignoruje.
const przekazane = process.argv.slice(2).filter((a) => !/^--(start|tylko|port)=/.test(a));
const mapa = join(arg.wyjscie, "sitemap.json");
const polecenia = {
  mapa: [join(TU, "mapa.mjs"), `--start=${start}`, ...przekazane],
  dostepnosc: [join(TU, "dostepnosc.mjs"), `--mapa=${mapa}`, ...przekazane],
  bledy: [join(TU, "bledy.mjs"), `--mapa=${mapa}`, ...przekazane],
};

console.log(`Pomiar: ${start} -> ${arg.wyjscie}/ (${tylko.join(", ")})`);
// `spawn`, nie `spawnSync`: synchroniczne czekanie blokuje petle zdarzen, a na
// niej siedzi nasz serwer. Pierwsza wersja tego pliku tak wlasnie padla: mapa
// nie mogla polaczyc sie z serwerem, ktory stal w tym samym procesie i nie
// mial kiedy odpowiedziec.
function uruchom(args) {
  return new Promise((ok) => {
    const p = spawn(process.execPath, args, { stdio: "inherit", cwd: KORZEN });
    p.on("close", (status) => ok(status ?? 1));
  });
}
let kod = 0;
for (const krok of tylko) {
  console.log(`\n== ${krok} ==`);
  const status = await uruchom(polecenia[krok]);
  if (status !== 0) { kod = status; console.error(`${krok}: kod wyjscia ${kod}`); if (krok === "mapa") break; }
}
if (serwer) serwer.close();
if (kod !== 0) { console.error("\nPomiar niepelny, patrz wyzej."); process.exit(kod); }

// Strony osierocone liczy sie TUTAJ, nie w mapie: crawl nie moze odkryc strony,
// do ktorej nic nie prowadzi, bo poznaje strony wylacznie z odnosnikow. Dopiero
// roznica "co stoi w dist/" minus "co crawl odwiedzil" mowi, ktore strony sa
// bez wejscia. Ma sens tylko przy `--wszystko`, bo przy budzecie 25 stron
// nieodwiedzone sa prawie wszystkie.
if (arg.wszystko && tylko.includes("mapa") && !arg.start && existsSync(mapa)) {
  const { readdirSync, statSync, readFileSync, writeFileSync } = await import("node:fs");
  const trasy = [];
  (function zbierz(katalog, prefiks) {
    for (const wpis of readdirSync(katalog)) {
      const p = join(katalog, wpis);
      if (wpis === "index.html") trasy.push(prefiks + "/");
      else if (statSync(p).isDirectory() && wpis !== "assets") zbierz(p, prefiks + "/" + wpis);
    }
  })(DIST, "");
  const dane = JSON.parse(readFileSync(mapa, "utf8"));
  const odwiedzone = new Set(dane.pages.map((s) => new URL(s.url).pathname));
  dane.osierocone = trasy.filter((t) => !odwiedzone.has(t)).sort();
  writeFileSync(mapa, JSON.stringify(dane, null, 2) + "\n");
  console.log(`\nStrony w dist/: ${trasy.length}, odwiedzone: ${odwiedzone.size}, bez wejscia: ${dane.osierocone.length}`);
  for (const t of dane.osierocone.slice(0, 40)) console.log("  " + t);
}
console.log(`\nGotowe. Wyniki w ${arg.wyjscie}/: sitemap.json, zrzuty/, dostepnosc.json, bledy.json.`);
console.log("Ocena: skill `site-audit` (raport) albo `aejaca-ux` (naprawa u zrodla).");
process.exit(kod);
