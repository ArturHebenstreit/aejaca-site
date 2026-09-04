// POMIAR KAFELKOW: PRAWDZIWE PIKSELE, NIE DEKLARACJE
// ---------------------------------------------------
// Tailwind v4 wypisuje kolory jako `oklch()`, ktorego `canvas.fillStyle` po
// cichu nie przyjmuje, wiec kazde czytanie koloru z CSS klamie. Dlatego
// mierzymy zrzut samego kafelka: piksele sa jedynym swiadkiem.
//
// Wiersz niesie takze ODCISK KLAS, bo bez niego nie wiadomo, ktora rodzine
// kafelkow widzimy, a rodzin jest kilkanascie i kazda malowala stan inaczej.
import { chromium } from "playwright";
const HOST = "http://127.0.0.1:4210";

async function jasnosc(page, locator) {
  const png = await locator.screenshot();
  const b64 = png.toString("base64");
  return page.evaluate(async (dane) => {
    const img = new Image();
    await new Promise((ok, zle) => { img.onload = ok; img.onerror = zle; img.src = "data:image/png;base64," + dane; });
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let R = 0, G = 0, B = 0, n = 0;
    const m = 6; // obwodka jest jasna i zawyzalaby wynik; skarga dotyczy WYPELNIENIA
    for (let y = m; y < c.height - m; y += 2) {
      for (let xx = m; xx < c.width - m; xx += 2) {
        const i = (y * c.width + xx) * 4;
        R += d[i]; G += d[i + 1]; B += d[i + 2]; n += 1;
      }
    }
    R = Math.round(R / n); G = Math.round(G / n); B = Math.round(B / n);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return { rgb: [R, G, B], L: +(0.2126 * lin(R) + 0.7152 * lin(G) + 0.0722 * lin(B)).toFixed(4) };
  }, b64);
}

/** Krotki odcisk: rodzina kafelka i to, czy niesie zdjecie. */
function odcisk(klasy, maZdjecie) {
  const c = [];
  if (maZdjecie) c.push("zdjecie");
  if (/border-(amber|blue)-400(?![/\d])/.test(klasy)) c.push("obwodka-pelna");
  if (/bg-(amber|blue)-400\//.test(klasy)) c.push("tlo-akcentu");
  if (/bg-white\/\[/.test(klasy)) c.push("tlo-biel");
  if (/ring-2/.test(klasy)) c.push("pierscien");
  return c.join(" ") || "brak zaczepow";
}

const EKRANY = [
  ["sklep, odlew", "/shop/service/precious_metal_casting/"],
  ["kalkulator sTuDiO", "/studio/?tab=3dprint"],
  ["jubilerka", "/jewelry/?service=new"],
];

const b = await chromium.launch({ headless: true, executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const motyw of ["dark", "light"]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 }, locale: "pl-PL" });
  await ctx.addInitScript((m) => {
    try { localStorage.setItem("aejaca-theme", m); } catch {}
    document.documentElement.setAttribute("data-theme", m);
  }, motyw);
  console.log("\n########## " + motyw.toUpperCase());
  for (const [nazwa, adres] of EKRANY) {
    const p = await ctx.newPage();
    await p.goto(HOST + adres, { waitUntil: "networkidle", timeout: 30000 });
    await p.waitForTimeout(1500);
    const k = p.locator('button[class*="rounded-xl"], button[class*="rounded-lg"]');
    console.log("\n--- " + nazwa);
    let ile = 0;
    for (let i = 0; i < await k.count() && ile < 8; i += 1) {
      const el = k.nth(i);
      const box = await el.boundingBox().catch(() => null);
      if (!box || box.width < 100 || box.height < 24) continue;
      const klasy = (await el.getAttribute("class")) || "";
      const maZdjecie = await el.locator("img").count() > 0;
      const wybrany = /border-(amber|blue)-400(?![/\d])/.test(klasy);
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await p.mouse.move(5, 5); await p.waitForTimeout(140);
      const spok = await jasnosc(p, el);
      await el.hover(); await p.waitForTimeout(260);
      const naj = await jasnosc(p, el);
      const roznica = (naj.L - spok.L).toFixed(4);
      console.log("   " + (wybrany ? "WYBRANY " : "spokojny") +
        "  L " + String(spok.L).padEnd(7) + " -> " + String(naj.L).padEnd(7) +
        " (roznica " + String(roznica).padStart(7) + ")   rgb " + spok.rgb.join(",") +
        " -> " + naj.rgb.join(",") + "   [" + odcisk(klasy, maZdjecie) + "]");
      ile += 1;
    }
    await p.close();
  }
  await ctx.close();
}
await b.close();
