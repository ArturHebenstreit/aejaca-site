// Serwer statyczny STOSUJACY naglowki z public/_headers. `npx serve` ich nie
// stosuje, wiec CSP blokujace WebAssembly bylo niewidoczne az do wdrozenia.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
const ROOT = "dist";
// Uruchamiaj po `npm run build`: to jedyny sposob, zeby zobaczyc lokalnie to,
// co robi Cloudflare. `npx serve` i `vite preview` ignoruja `public/_headers`,
// przez co blokada WebAssembly byla niewidoczna az do wdrozenia.
// Parsujemy `_headers` z uwzglednieniem sciezek, bo polityka workera jest inna
// niz polityka dokumentu i wlasnie ta roznica jest tu sprawdzana.
const rules = [];
{
  let current = null;
  for (const line of readFileSync("public/_headers", "utf8").split("\n")) {
    if (/^\S/.test(line) && line.startsWith("/")) { current = { path: line.trim(), headers: {} }; rules.push(current); }
    else if (current && /^\s+[A-Za-z-]+:/.test(line)) {
      const i = line.indexOf(":");
      current.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
}
const matchRules = (url) => rules.filter(r => {
  const rx = new RegExp("^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
  return rx.test(url);
});
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css",
  ".wasm":"application/wasm", ".json":"application/json", ".svg":"image/svg+xml",
  ".webp":"image/webp", ".png":"image/png", ".jpg":"image/jpeg", ".ico":"image/x-icon", ".txt":"text/plain" };
createServer((req, res) => {
  let p = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) p = join(ROOT, "404.html");
  for (const r of matchRules(req.url.split("?")[0])) {
    for (const [k, v] of Object.entries(r.headers)) res.setHeader(k, v);
  }
  res.setHeader("Content-Type", MIME[extname(p)] || "application/octet-stream");
  res.end(readFileSync(p));
}).listen(4190, () => console.log("CSP serve na 4190"));
