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
  console.error("Brak URL-i w sitemap.xml — nic do zgłoszenia.");
  process.exit(1);
}

console.log(`Zgłaszam ${urlList.length} URL-i do IndexNow...`);

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }),
});

console.log(`IndexNow odpowiedział: ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) {
  const body = await res.text().catch(() => "");
  console.error(body);
  process.exit(1);
}
console.log("Gotowe.");
