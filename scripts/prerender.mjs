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
];

const routes = [
  ...STATIC_ROUTES,
  ...BLOG_SLUGS.map((s) => `/blog/${s}`),
];

let success = 0;
let failed = 0;

for (const route of routes) {
  try {
    const { html, helmet } = render(route);

    let page = template.replace("<!--ssr-outlet-->", html);

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
