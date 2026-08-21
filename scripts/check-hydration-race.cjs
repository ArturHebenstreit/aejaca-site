#!/usr/bin/env node
// ============================================================
// WYSCIG: HYDRATACJA KONTRA FRAGMENT LENIWEJ TRASY
// ============================================================
// Kazda strona poza glowna wchodzi przez `lazy()`. Gdy hydratacja rusza,
// zanim fragment trasy sie sciagnie, granica `Suspense` zawiesza sie w jej
// trakcie, React porzuca gotowy HTML i rysuje strone od nowa u klienta.
// W konsoli zostaja bledy #421 i #418.
//
// TO JEST WYSCIG, WIEC JEDNO WEJSCIE NICZEGO NIE DOWODZI. Przy szybkim
// laczu pada mniej wiecej co trzecie, wiec narzedzie ktore otwiera strone
// raz pokazuje "czysto" na buildzie, ktory jest zepsuty. Dlatego ten skrypt
// robi dwie rzeczy: powtarza wejscia i OPOZNIA fragmenty tras, co zamienia
// wyscig w przypadek powtarzalny.
//
// Zmierzone przy dodaniu wczytywania trasy przed hydratacja (2026-08-21):
// przed poprawka 3/3 przy opoznieniu 300 ms, po poprawce 0/3, i zero na
// dziewiecdziesieciu wejsciach lacznie.
//
// TO NIE JEST CZESC BUILDA: wymaga zbudowanego `dist/` i przegladarki.
// Statycznego strażnika trzyma `scripts/check-lazy-hydration.mjs`.
//
//   npm run build
//   node scripts/check-hydration-race.cjs
//   STRONY=/studio/,/blog/ POWT=5 node scripts/check-hydration-race.cjs
//
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const TYPY = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.txt':'text/plain' };
let OPOZNIENIE = 0;

const serwer = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(DIST, p);
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch { f = path.join(DIST, '404.html'); }
  if (!fs.existsSync(f)) f = path.join(DIST, '404.html');
  // Leniwe fragmenty tras opozniamy, zeby granica Suspense na pewno nie
  // zdazyla sie zhydratowac przed efektem wykrywajacym jezyk. To zamienia
  // wyscig w powtarzalny przypadek.
  const leniwy = OPOZNIENIE && /\.js$/.test(f) && !/index-|entry|main/.test(path.basename(f));
  const wyslij = () => {
    res.writeHead(200, { 'Content-Type': TYPY[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  };
  leniwy ? setTimeout(wyslij, OPOZNIENIE) : wyslij();
});

const JEZYKI = { polski: ['pl-PL','pl'], angielski: ['en-US','en'], niemiecki: ['de-DE','de'] };

(async () => {
  let padlo = 0;
  const strony = process.env.STRONY ? process.env.STRONY.split(',') : ['/studio/','/jewelry/','/'];
  const powtorzen = Number(process.env.POWT || 3);
  await new Promise((r) => serwer.listen(5311, '127.0.0.1', r));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true });
  for (const opoznienie of [0, 300]) {
    OPOZNIENIE = opoznienie;
    console.log(`\n=== opoznienie leniwych fragmentow: ${opoznienie} ms ===`);
    for (const [opis, langs] of Object.entries(JEZYKI)) {
      for (const strona of strony) {
        let trafien = 0; const kody = new Set();
        for (let i = 0; i < powtorzen; i++) {
          const ctx = await b.newContext({ locale: langs[0], extraHTTPHeaders: { 'Accept-Language': langs.join(',') } });
          const page = await ctx.newPage();
          await page.addInitScript((l) => { Object.defineProperty(navigator, 'languages', { get: () => l }); }, langs);
          const bledy = [];
          page.on('console', (m) => { if (m.type() === 'error') bledy.push(m.text().slice(0, 200)); });
          page.on('pageerror', (e) => bledy.push('PAGEERROR ' + e.message.slice(0, 200)));
          await page.route('**/*', (r) => (r.request().url().includes('127.0.0.1:5311') ? r.continue() : r.abort()));
          await page.goto('http://127.0.0.1:5311' + strona, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
          await page.waitForTimeout(1500 + opoznienie);
          const r = bledy.filter((t) => /Minified React error #\d+/.test(t));
          if (r.length) { trafien++; padlo++; r.forEach((t) => kody.add(t.match(/#(\d+)/)[1])); }
          await ctx.close();
        }
        console.log(`  ${opis.padEnd(10)} ${strona.padEnd(11)} ${trafien}/${powtorzen} blednych hydratacji  kody=[${[...kody].join(',')}]`);
      }
    }
  }
  await b.close();
  serwer.close();
  if (padlo) {
    console.log(`\nBLEDNYCH HYDRATACJI: ${padlo}. Prerender jest wyrzucany, sprawdz src/main.jsx.`);
    process.exit(1);
  }
  console.log('\nZadna strona nie odrzucila prerenderu.');
})();
