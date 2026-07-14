import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const serverPath = path.resolve(__dirname, "../dist/server/entry-server.mjs");

const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
const { render } = await import(serverPath);

const STATIC_ROUTES = [
  "/",
  "/jewelry",
  "/studio",
  "/blog",
  "/contact",
  "/glossary",
  "/about",
  "/warranty",
  "/returns",
  "/shipping",
  "/privacy",
  "/reviews",
  "/b2b",
  "/toolsjewelry",
  "/toolsjewelry/alloy-composition",
  "/toolsjewelry/metal-pricing",
  "/toolsjewelry/ring-size",
  "/toolstudio",
  "/toolstudio/print-settings",
  "/toolstudio/laser-parameters",
  "/toolsjewelry/ring-blank",
];

const GLOSSARY_IDS = [
  "srebro-925",
  "zloto-probowane",
  "pierscionek-zareczynowy",
  "obraczki-slubne",
  "kamien-szlachetny",
  "rodowanie",
  "moissanit",
  "rozmiar-pierscionka",
  "personalizowany-grawer",
  "bizuteria-inwestycyjna",
  "druk-3d-fdm",
  "plik-stl",
  "pla",
  "petg",
  "zywica-uv",
  "laser-co2",
  "laser-fiber",
  "plik-svg",
  "odlew-zywiczny",
  "prototypowanie",
  "cad",
  "modelowanie-3d",
  "personalizacja",
  "projektowanie-ai",
  "wycena-online",
];

const BLOG_SLUGS = [
  "pierscionek-zareczynowy-na-zamowienie",
  "druk-3d-krok-po-kroku",
  "grawerowanie-laserowe-przewodnik",
  "jak-dbac-o-bizuterie",
  "odlewy-zywiczne-poradnik",
  "prezenty-personalizowane",
  "jak-przygotowac-plik-stl",
  "srebro-vs-zloto",
  "obraczki-slubne",
  "materialy-laser-cutting",
  "bizuteria-inwestycja",
  "projektowanie-ai",
  "warsztat-od-kuchni",
  "modelowanie-3d-na-zamowienie",
  "ile-kosztuje-bizuteria-na-zamowienie",
  "rodzaje-splotow-lancuszkow",
];

const routes = [
  ...STATIC_ROUTES,
  ...BLOG_SLUGS.map((s) => `/blog/${s}`),
  ...GLOSSARY_IDS.map((id) => `/glossary/${id}`),
];

let success = 0;
let failed = 0;

for (const route of routes) {
  try {
    const { html, helmet } = render(route);

    let page = template.replace("<!--ssr-outlet-->", html);

    // Strip the static fallback <title>/description/OG/Twitter tags from
    // index.html — every route is now SSR-prerendered, so Helmet always
    // supplies the real per-page tags below. Leaving the static ones in
    // produces duplicate title/description/OG tags on every page.
    page = page
      .replace(/\s*<!-- Static fallback meta tags[\s\S]*?-->\s*/, "\n")
      .replace(/\s*<title>[\s\S]*?<\/title>/, "")
      .replace(/\s*<meta name="description"[^>]*\/>/, "")
      .replace(/\s*<meta property="og:[a-z:]+"[^>]*\/>/g, "")
      .replace(/\s*<meta name="twitter:[a-z:]+"[^>]*\/>/g, "");

    if (helmet) {
      const helmetHead = [
        helmet.title?.toString(),
        helmet.meta?.toString(),
        helmet.link?.toString(),
        helmet.script?.toString(),
      ]
        .filter(Boolean)
        .join("\n    ");

      if (helmetHead) {
        page = page.replace("</head>", `    ${helmetHead}\n  </head>`);
      }
    }

    const filePath =
      route === "/" ? "index.html" : `${route.slice(1)}/index.html`;
    const fullPath = path.resolve(distPath, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, page);
    success++;
    console.log(`  ✓ ${route}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${route}: ${err.message}`);
  }
}

console.log(`\nPrerendered: ${success} pages, ${failed} errors`);
if (failed > 0) process.exit(1);
