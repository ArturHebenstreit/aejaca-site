// ============================================================
// SERWER DO AUDYTU UI: dist/ plus prawdziwa wycena
// ============================================================
// Sklep nie da sie obejrzec na samych plikach statycznych: konfigurator,
// koszyk i kasa wisza na /api/price z chat-api. Bez backendu strona uslugi
// renderuje kontrolki, ale nigdy ceny ani przycisku "Dodaj do koszyka",
// co przy pobieznym ogladzie wyglada jak zepsuta sciezka zakupowa.
//
// Ten serwer podaje dist/ i odpowiada na /api/price, wywolujac PRAWDZIWY
// `priceItem` z chat-api/orders.js. Wynik jest wiec liczony tym samym kodem
// co na produkcji. Rozni sie tylko to, czego tu z zalozenia nie ma:
//
//   - geometria z wgranego pliku (wymaga parsera i bazy),
//   - kursy metali z /api/market-rates (uzywamy zapasowych),
//   - limit kwartalny (wymaga bazy), zwracamy null.
//
// To narzedzie audytowe, nie czesc produktu. Nie uruchamiamy go w budowaniu
// ani nie wystawiamy na zewnatrz: nasluchuje wylacznie na 127.0.0.1.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.AUDIT_PORT) || 8899;

const { priceItem, PricingError } = await import(join(ROOT, "chat-api", "orders.js"));

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
};

function body(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Pola tekstowe z multipart/form-data. Konfigurator wysyla wlasnie tak, bo
 * ten sam endpoint przyjmuje model 3D. Czesci plikowe pomijamy: geometrii
 * i tak tu nie liczymy, a do oceny interfejsu nie jest potrzebna.
 */
function multipartFields(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!m) return null;
  const boundary = `--${m[1] || m[2]}`;
  const fields = {};
  for (const part of buf.toString("latin1").split(boundary)) {
    const i = part.indexOf("\r\n\r\n");
    if (i < 0) continue;
    const head = part.slice(0, i);
    const name = /name="([^"]+)"/i.exec(head)?.[1];
    if (!name || /filename="/i.test(head)) continue;
    fields[name] = Buffer.from(part.slice(i + 4).replace(/\r\n$/, ""), "latin1").toString("utf8");
  }
  return fields;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/price" && req.method === "POST") {
    try {
      const raw = await body(req);
      const ct = req.headers["content-type"] || "";
      const payload = ct.includes("multipart/form-data")
        ? multipartFields(raw, ct)
        : raw.toString("utf8").trim().startsWith("{")
          ? JSON.parse(raw.toString("utf8"))
          : Object.fromEntries(new URLSearchParams(raw.toString("utf8")));
      let params = payload.params;
      if (typeof params === "string") params = JSON.parse(params);
      const item = priceItem({
        calculator: String(payload.calculator || ""),
        params,
        lang: String(payload.lang || "pl"),
        geometry: null,
        scale: payload.scale ? Number(payload.scale) : 1,
        rates: null,
      });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: true, item, geometry: null, capacity: null }));
    } catch (e) {
      const isPricing = e instanceof PricingError || e?.code;
      const status = e?.code === "needs_quote" ? 409 : isPricing ? 400 : 500;
      res.writeHead(status, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: e?.message || "blad", code: e?.code }));
    }
  }

  // Kursy zapasowe, zeby pasek w stopce nie wisial w nieskonczonosc.
  if (url.pathname === "/api/market-rates") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ pln_per_eur: 4.25, updatedAt: "2026-08-04T00:00:00.000Z" }));
  }

  if (url.pathname.startsWith("/api/")) {
    res.writeHead(501, { "content-type": "application/json" });
    return res.end(JSON.stringify({ error: "Endpoint poza zakresem serwera audytowego" }));
  }

  // Pliki statyczne. Trasy bez rozszerzenia dostaja swoj index.html, tak jak
  // na Cloudflare Pages, gdzie kazda trasa jest prerenderowana osobno.
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (!extname(p)) p = join(p, "index.html");
  try {
    const data = await readFile(join(DIST, p));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    try {
      const data = await readFile(join(DIST, "404.html"));
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(data);
    } catch {
      res.writeHead(404).end("404");
    }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Serwer audytowy: http://127.0.0.1:${PORT} (dist/ + prawdziwe /api/price)`);
});
