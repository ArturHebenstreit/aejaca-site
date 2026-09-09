// Submits every URL in public/sitemap.xml to IndexNow (Bing, Yandex, and
// other participating search engines pick up changes within minutes
// instead of waiting for the next crawl).
//
// Usage: npm run indexnow
// Run this after a deploy that changes page content, adds/removes pages,
// or updates the sitemap. Key file must already be live at
// https://www.aejaca.com/<INDEXNOW_KEY>.txt (public/<key>.txt in the repo).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = "www.aejaca.com";
const KEY = "1cc7ba768716151f4028f5c9d6127177";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const sitemapPath = path.resolve(__dirname, "../public/sitemap.xml");
const xml = fs.readFileSync(sitemapPath, "utf-8");
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (urlList.length === 0) {
  console.error("Brak URL-i w sitemap.xml - nic do zgłoszenia.");
  process.exit(1);
}

console.log(`Zgłaszam ${urlList.length} URL-i do IndexNow...`);

// AWARIA SIECI NIE JEST BLEDEM W KODZIE i nie moze tak wygladac. Gole
// `await fetch` bez opakowania wyrzucalo na ekran slad stosu z wnetrza
// undici ("Error.captureStackTrace ... node:internal/deps/undici"), czyli
// obraz zepsutego skryptu. Zgloszenie wlasciciela 2026-09-09: zamiast
// zdania "nie dalo sie polaczyc" dostal dwadziescia linijek cudzego kodu
// i musial pytac, co zepsul. Nie zepsul niczego: to zapora po jego stronie.
let res;
try {
  res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });
} catch (e) {
  const kod = e.cause?.code || e.code || "";
  console.error(`\nNie udalo sie polaczyc z IndexNow: ${e.cause?.message || e.message}`);
  // CERTYFIKAT NIE DA SIE SPRAWDZIC. Node ma WLASNA liste zaufanych urzedow,
  // wkompilowana w binarke, i NIE czyta magazynu certyfikatow Windows. Program
  // antywirusowy albo firmowa zapora, ktore rozcinaja HTTPS i podpisuja ruch
  // wlasnym urzedem, sa wiec zaufane dla przegladarki i nieznane dla Node.
  // Objaw jest mylacy: ta sama strona otwiera sie w przegladarce bez slowa.
  if (["UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "SELF_SIGNED_CERT_IN_CHAIN",
       "DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
       "CERT_HAS_EXPIRED"].includes(kod)) {
    console.error(`\nKod ${kod} znaczy, ze Node nie potrafi sprawdzic certyfikatu, a nie ze IndexNow nie dziala.`);
    console.error("Node ma wlasna liste urzedow i nie zaglada do magazynu certyfikatow Windows,");
    console.error("wiec antywirus albo zapora rozcinajaca HTTPS jest dla niego nieznanym wystawca.");
    console.error("\nCo sprawdzic, po kolei:");
    console.error("  1. Kto wystawil certyfikat, ktory naprawde dostajesz:");
    console.error(`     node -e "require('tls').connect(443,'api.indexnow.org',{servername:'api.indexnow.org',rejectUnauthorized:false},function(){console.log(this.getPeerCertificate().issuer);this.end()})"`);
    console.error("     Nazwa antywirusa albo firmy w polu 'O' potwierdza rozcinanie HTTPS.");
    console.error("  2. Wtedy: wylacz skanowanie HTTPS dla tego polaczenia, ALBO wskaz Node ten urzad:");
    console.error("     set NODE_EXTRA_CA_CERTS=C:\\sciezka\\do\\korzenia.crt");
    console.error("     ALBO przejdz na Node 22+ i uruchom z --use-system-ca, wtedy Node czyta magazyn Windows.");
    console.error("\nCzego NIE robic: NODE_TLS_REJECT_UNAUTHORIZED=0 wylacza sprawdzanie certyfikatow");
    console.error("dla calego procesu, wiec zamienia jeden zablokowany strzal w cicha dziure.");
    console.error("\nZgloszenie mozna tez wyslac recznie, bez tego skryptu: patrz komentarz na koncu pliku.");
  }
  process.exit(1);
}

console.log(`IndexNow odpowiedział: ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) {
  const body = await res.text().catch(() => "");
  console.error(body);
  process.exit(1);
}
console.log("Gotowe.");

// DROGA AWARYJNA, gdy Node na danej maszynie nie przepuszcza HTTPS.
// Zgloszenie idzie zwyklym POST-em, wiec zrobi je takze curl, ktory na
// Windowsie korzysta z magazynu certyfikatow systemu:
//
//   node -e "const x=require('fs').readFileSync('public/sitemap.xml','utf8');
//     require('fs').writeFileSync('indexnow.json', JSON.stringify({
//       host:'www.aejaca.com', key:'1cc7ba768716151f4028f5c9d6127177',
//       keyLocation:'https://www.aejaca.com/1cc7ba768716151f4028f5c9d6127177.txt',
//       urlList:[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1])}))"
//   curl -X POST -H "Content-Type: application/json" --data @indexnow.json https://api.indexnow.org/indexnow

