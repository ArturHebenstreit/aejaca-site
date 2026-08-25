import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const serverPath = path.resolve(__dirname, "../dist/server/entry-server.mjs");

const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
const { render } = await import(serverPath);

// Blog slugs and glossary IDs are derived from the same modules the app uses,
// never hand-maintained. Since public/_redirects no longer has an SPA catch-all,
// a route missing from this list would be served as a hard 404 by Cloudflare
// Pages instead of silently falling back to client-side rendering.
const { POSTS_META } = await import("../src/blog/postsMeta.js");
const { GLOSSARY } = await import("../src/data/glossary.js");
const { PRODUCTS } = await import("../src/data/shopCatalog.js");
const { SERVICES_FULL } = await import("../src/data/serviceCatalog.js");

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
  "/terms",
  "/order",
  "/order/status",
  "/quote",
  "/oferta",
  "/cart",
  "/checkout",
  "/shop",
  "/shop/jewelry",
  "/shop/studio",
  "/shipping",
  "/privacy",
  "/reviews",
  "/b2b",
  "/toolsjewelry",
  "/toolsjewelry/alloy-composition",
  "/toolstudio/printability",
  "/toolsjewelry/metal-pricing",
  "/toolsjewelry/ring-size",
  "/toolsjewelry/ring-sizer",
  "/toolstudio",
  "/toolstudio/print-settings",
  "/toolstudio/resin-settings",
  "/toolstudio/laser-parameters",
  "/toolstudio/shrinkage",
  "/toolsjewelry/ring-blank",
  // Wersja robocza kreatora. Strona jest prerenderowana, bo bez tego
  // Cloudflare oddalby twarde 404, ale niesie `noindex`, nie ma jej
  // w sitemapie i nic do niej nie linkuje.
  "/toolsjewelry/kreator",
  "/druk-3d-piaseczno",
  "/druk-3d-warszawa",
];

const GLOSSARY_IDS = GLOSSARY.map((term) => term.id);
const BLOG_SLUGS = POSTS_META.map((post) => post.slug);
// Slugi produktow pochodza z katalogu, wiec nowy produkt nie wymaga wpisu recznego
const PRODUCT_SLUGS = PRODUCTS.map((p) => p.slug);
const SERVICE_IDS = SERVICES_FULL.map((s) => s.id);

// STATIC_ROUTES is the one list still written by hand, so cross-check it
// against the routes main.jsx actually declares. Without the SPA catch-all a
// forgotten entry here means a live page returning 404, so fail the build
// loudly rather than shipping a hole in the site.
function assertStaticRoutesMatchRouter() {
  const mainSrc = fs.readFileSync(
    path.resolve(__dirname, "../src/main.jsx"),
    "utf-8",
  );
  const declared = [...mainSrc.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((p) => !p.includes(":") && !p.includes("*"))
    .map((p) => (p === "/" ? "/" : p.replace(/\/$/, "")));

  const listed = new Set(STATIC_ROUTES);
  const missing = declared.filter((p) => !listed.has(p));
  const stale = STATIC_ROUTES.filter((p) => !declared.includes(p));

  if (missing.length || stale.length) {
    if (missing.length) {
      console.error(
        `  ✗ STATIC_ROUTES is missing routes declared in main.jsx: ${missing.join(", ")}`,
      );
    }
    if (stale.length) {
      console.error(
        `  ✗ STATIC_ROUTES lists routes main.jsx does not declare: ${stale.join(", ")}`,
      );
    }
    process.exit(1);
  }
}

assertStaticRoutesMatchRouter();

const routes = [
  ...STATIC_ROUTES,
  ...BLOG_SLUGS.map((s) => `/blog/${s}`),
  ...GLOSSARY_IDS.map((id) => `/glossary/${id}`),
  ...PRODUCT_SLUGS.map((slug) => `/shop/${slug}`),
  ...SERVICE_IDS.map((id) => `/shop/service/${id}`),
];

// ------------------------------------------------------------
// PRELOAD OBRAZU BOHATERSKIEGO TYLKO TAM, GDZIE TEN OBRAZ JEST
// ------------------------------------------------------------
// `index.html` jest szablonem WSZYSTKICH stron, a stały w nim dwa
// `<link rel="preload" as="image" fetchpriority="high">` na obrazy strony
// głównej. Zamiar był słuszny (to są kandydaci na LCP na `/`), skutek nie:
// 465 kB pobierane z wysokim priorytetem na 95 stronach, które tych obrazów
// nie pokazują, i konkurujące tam z prawdziwym obrazem LCP.
//
// Nic się przez to nie psuło i żaden sprawdzian tego nie widział, bo strona
// działa. Znalazł to dopiero podgląd w przeglądarce: ostrzeżenie o preloadzie
// nieużytym w ciągu kilku sekund.
//
// Klucz to obraz, wartość to trasy, które go RENDERUJĄ. Ring blank pokazuje
// tylko jeden z dwóch, więc drugiego tam nie preładujemy.
//
// TRASY BEZ KOŃCOWEGO UKOŚNIKA. `routes` jest normalizowane wyżej
// (`p.replace(/\/$/, "")`), więc wpis z ukośnikiem nigdy się nie dopasuje
// i strona po cichu traci preload, który jej się należy. Wpadłem w to od razu.
const PRELOAD_BOHATERSKI = {
  "/hero-home-jewelry.webp": ["/", "/toolsjewelry/ring-blank"],
  "/hero-home-studio.webp": ["/"],
};

function buildPage(route) {
  const { html, helmet } = render(route);

  let page = template.replace("<!--ssr-outlet-->", html);

  for (const [obraz, trasy] of Object.entries(PRELOAD_BOHATERSKI)) {
    if (trasy.includes(route)) continue;
    page = page.replace(
      new RegExp(`\\s*<link rel="preload"[^>]*href="${obraz}"[^>]*/?>`, "g"),
      "",
    );
  }

  // Strip the static fallback <title>/description/OG/Twitter tags from
  // index.html - every route is now SSR-prerendered, so Helmet always
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

  return page;
}

let success = 0;
let failed = 0;

for (const route of routes) {
  try {
    const page = buildPage(route);

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

// Cloudflare Pages serves dist/404.html with a real HTTP 404 for any path that
// matches no asset and no _redirects rule. Rendering an unmatched route here
// gives that response the branded NotFound page instead of a bare error, and
// replaces the old SPA catch-all which answered every dead URL with HTTP 200
// (a soft 404 that Search Console reported as "excluded by noindex").
try {
  fs.writeFileSync(
    path.resolve(distPath, "404.html"),
    buildPage("/__not_found__"),
  );
  console.log("  ✓ 404.html");
} catch (err) {
  failed++;
  console.error(`  ✗ 404.html: ${err.message}`);
}

// ------------------------------------------------------------
// Granica Suspense musi byc po obu stronach
// ------------------------------------------------------------
// Klient owija `<Routes>` w `<Suspense>`, bo trasy sa ladowane leniwie.
// Renderowanie na serwerze znaczy granice komentarzami <!--$--> i <!--/$-->.
// Gdy `entry-server.jsx` tej granicy nie ma, hydratacja szuka znacznika,
// nie znajduje go, przewraca sie i React RYSUJE CALA STRONE OD NOWA,
// wyrzucajac gotowy HTML. Strona dziala, wiec nic nie wyglada na zepsute,
// a caly prerender przestaje sluzyc odwiedzajacym.
//
// Przez dlugi czas objawialo sie to wylacznie bledami #418 i #423 w konsoli.
const clientShell = fs.readFileSync(path.resolve(__dirname, "../src/main.jsx"), "utf8");
if (/<Suspense/.test(clientShell)) {
  const home = fs.readFileSync(path.resolve(distPath, "index.html"), "utf8");
  if (!home.includes("<!--$-->")) {
    console.error(
      "\n  ✗ Klient ma <Suspense>, a wyrenderowany HTML nie ma znacznikow granicy.\n" +
      "    Dodaj te sama granice w src/entry-server.jsx, inaczej hydratacja\n" +
      "    odrzuci prerender i przerysuje strone od zera."
    );
    failed++;
  }
}

// ------------------------------------------------------------
// Żadna strona nie preładuje obrazu, którego nie pokazuje
// ------------------------------------------------------------
// Mapa wyżej wystarczy, dopóki ktoś jej pilnuje. Ten sprawdzian pilnuje jej
// za nas i nie zależy od niej: idzie po GOTOWYCH plikach i porównuje preloady
// z tym, co na stronie faktycznie jest. Wychwyci więc także preload dodany
// z innego miejsca niż `index.html`.
//
// Preload obrazu, którego strona nie rysuje, to nie jest drobiazg kosmetyczny:
// `fetchpriority="high"` stawia go PRZED prawdziwym obrazem LCP tej strony.
{
  const wszystkie = [];
  const zbierz = (dir) => {
    for (const wpis of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, wpis.name);
      if (wpis.isDirectory()) zbierz(p);
      else if (wpis.name.endsWith(".html")) wszystkie.push(p);
    }
  };
  zbierz(distPath);

  const winne = [];
  for (const plik of wszystkie) {
    const tresc = fs.readFileSync(plik, "utf8");
    const preloady = [...tresc.matchAll(/<link rel="preload"[^>]*as="image"[^>]*href="([^"]+)"/g)]
      .map((m) => m[1]);
    for (const obraz of new Set(preloady)) {
      // Obraz liczy się jako użyty, gdy pojawia się poza samym znacznikiem
      // preload: w `src`, w `srcset` albo w tle inline.
      const bezPreloadow = tresc.replace(/<link rel="preload"[^>]*>/g, "");
      if (!bezPreloadow.includes(obraz)) {
        winne.push(`${path.relative(distPath, plik)} preładuje ${obraz}, ale go nie pokazuje`);
      }
    }
  }

  if (winne.length) {
    console.error(`\n  ✗ Preload obrazu bez użycia na ${winne.length} stronach:`);
    for (const w of winne.slice(0, 8)) console.error(`    ${w}`);
    if (winne.length > 8) console.error(`    ...i ${winne.length - 8} więcej`);
    console.error("    Dopisz trasę do PRELOAD_BOHATERSKI albo usuń preload.");
    failed++;
  } else {
    console.log(`  ✓ preloady obrazów: każdy na stronie, która go pokazuje`);
  }
}

console.log(`\nPrerendered: ${success} pages, ${failed} errors`);
if (failed > 0) process.exit(1);
