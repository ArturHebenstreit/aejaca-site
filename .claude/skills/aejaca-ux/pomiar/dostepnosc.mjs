#!/usr/bin/env node
// ============================================================
// DOSTEPNOSC (WCAG) PRZEZ AXE-CORE
// ============================================================
// Zastepuje agenta "accessibility-auditor" ze skilla site-audit, ktory wolal
// zewnetrzny `npx axe-cli` (siec, ktorej srodowisko zdalne nie ma). Tutaj
// axe-core lezy juz w `node_modules` (wstrzykiwany do strony na miejscu),
// wiec caly pomiar dziala bez wyjscia poza `localhost`.
//
// Serwis ma dwa motywy (`data-theme="light"` domyslny i "dark") o innych
// paletach barw, wiec blad kontrastu widoczny tylko w jednym motywie jest
// inna naprawa niz blad widoczny w obu. Kazda strona przechodzi przez axe
// osobno dla kazdej kombinacji motyw x szerokosc ekranu (domyslnie cztery:
// light/telefon, light/monitor, dark/telefon, dark/monitor), a wyniki sa
// zlaczane po parze "regula + selektor elementu": jeden fizyczny blad w
// komponencie wspolnym ma jeden wpis, nie cztery, ale wpis pamieta, w ktorych
// kombinacjach sie pojawil.
//
// Uzycie:
//   node dostepnosc.mjs                                    10 pierwszych stron z audyt-ux/sitemap.json
//   node dostepnosc.mjs --wszystko                          wszystkie strony z mapy
//   node dostepnosc.mjs --adresy=http://localhost:4173/,http://localhost:4173/studio/
//   node dostepnosc.mjs --motywy=dark --ekrany=telefon      jedna kombinacja zamiast czterech
//
// NIE JEST CZESCIA BUILDA. Wymaga zbudowanego `dist/` i serwera statycznego
// bez reguly lapiacej wszystko (patrz naglowek `scripts/audit-pages.mjs`).

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

import {
  uruchomPrzegladarke,
  nowyKontekst,
  EKRANY,
  parsujArgumenty,
  zapiszJson,
  jezykAdresu,
} from "./wspolne.mjs";

const TU = dirname(fileURLToPath(import.meta.url));
const SCIEZKA_AXE = resolve(TU, "../../../../node_modules/axe-core/axe.min.js");

const MOTYWY_DOZWOLONE = ["light", "dark"];
const EKRANY_DOZWOLONE = Object.keys(EKRANY); // ["telefon", "monitor"]
const KOLEJNOSC_KOMBINACJI = ["light/telefon", "light/monitor", "dark/telefon", "dark/monitor"];

// impact axe-core -> severity naszego raportu, zgodnie z accessibility-checks.md
const MAPA_SEVERITY = { critical: "critical", serious: "high", moderate: "medium", minor: "low" };

const domyslne = {
  mapa: "audyt-ux/sitemap.json",
  wyjscie: "audyt-ux",
  strony: "10",
  motywy: "oba",
  ekrany: "oba",
};

async function main() {
  const args = parsujArgumenty(process.argv.slice(2), domyslne);

  if (!existsSync(SCIEZKA_AXE)) {
    console.error(`Brak axe-core pod ${SCIEZKA_AXE}. Uruchom "npm install".`);
    process.exit(1);
  }

  let adresy;
  if (args.adresy) {
    adresy = String(args.adresy).split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    const mapaSciezka = resolve(process.cwd(), args.mapa);
    if (!existsSync(mapaSciezka)) {
      console.error(`Brak pliku mapy: ${mapaSciezka}. Podaj --mapa=PLIK albo --adresy=URL,URL,...`);
      process.exit(1);
    }
    let mapa;
    try {
      mapa = JSON.parse(readFileSync(mapaSciezka, "utf8"));
    } catch (e) {
      console.error(`Nie mozna wczytac mapy ${mapaSciezka}: ${e.message}`);
      process.exit(1);
    }
    adresy = (mapa.pages || []).map((p) => p.url).filter(Boolean);
  }

  if (!adresy.length) {
    console.error("Brak adresow do przegladu. Podaj --adresy=... albo mape z pages[].url.");
    process.exit(1);
  }

  if (!args.wszystko) {
    const limit = Number(args.strony) || 10;
    adresy = adresy.slice(0, limit);
  }

  const motywyLista = args.motywy === "oba" ? MOTYWY_DOZWOLONE : [args.motywy];
  if (motywyLista.some((m) => !MOTYWY_DOZWOLONE.includes(m))) {
    console.error(`Niepoprawna wartosc --motywy: ${args.motywy}. Dozwolone: oba, light, dark.`);
    process.exit(1);
  }

  const ekranyLista = args.ekrany === "oba" ? EKRANY_DOZWOLONE : [args.ekrany];
  if (ekranyLista.some((e) => !EKRANY_DOZWOLONE.includes(e))) {
    console.error(`Niepoprawna wartosc --ekrany: ${args.ekrany}. Dozwolone: oba, telefon, monitor.`);
    process.exit(1);
  }

  const przegladarka = await uruchomPrzegladarke();
  const findingsMap = new Map(); // klucz: "url||rule||selektor"
  const stronyZUdanymBiegiem = new Set();
  let udaneUruchomienia = 0;

  for (const url of adresy) {
    let host;
    try {
      host = new URL(url).host;
    } catch {
      console.error(`Pomijam niepoprawny adres: ${url}`);
      continue;
    }

    for (const motyw of motywyLista) {
      for (const ekranNazwa of ekranyLista) {
        const etykietaKombinacji = `${motyw}/${ekranNazwa}`;
        let ctx = null;
        try {
          ctx = await nowyKontekst(przegladarka, { host, ekran: EKRANY[ekranNazwa], motyw, lang: jezykAdresu(url) });
          const page = await ctx.newPage();

          try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
          } catch {
            await page.goto(url, { waitUntil: "load", timeout: 20_000 });
          }

          await page
            .waitForFunction(
              (m) => document.documentElement.getAttribute("data-theme") === m,
              motyw,
              { timeout: 3_000 }
            )
            .catch(() => {});

          await page.addScriptTag({ path: SCIEZKA_AXE });
          const wynikAxe = await page.evaluate(async () => {
            return await window.axe.run(
              { exclude: [["[data-audyt-pomin]"]] },
              {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
                },
                rules: { "target-size": { enabled: true } },
              }
            );
          });

          for (const naruszenie of wynikAxe.violations) {
            const severity = MAPA_SEVERITY[naruszenie.impact] || "medium";
            const wcag = (naruszenie.tags || []).filter((t) => /^wcag/i.test(t));
            for (const wezel of naruszenie.nodes) {
              const selektor = selektorZTarget(wezel.target);
              const klucz = `${url}||${naruszenie.id}||${selektor}`;
              if (!findingsMap.has(klucz)) {
                findingsMap.set(klucz, {
                  severity,
                  wcag,
                  rule: naruszenie.id,
                  page: url,
                  element: selektor,
                  html: (wezel.html || "").slice(0, 160),
                  issue: naruszenie.help,
                  recommendation: (wezel.failureSummary || "").slice(0, 300),
                  where: new Set([etykietaKombinacji]),
                });
              } else {
                findingsMap.get(klucz).where.add(etykietaKombinacji);
              }
            }
          }

          udaneUruchomienia += 1;
          stronyZUdanymBiegiem.add(url);
        } catch (e) {
          console.error(`Blad na ${url} [${etykietaKombinacji}]: ${e.message}`);
        } finally {
          if (ctx) await ctx.close().catch(() => {});
        }
      }
    }
  }

  await przegladarka.close();

  const findings = [...findingsMap.values()].map((f) => ({
    ...f,
    where: KOLEJNOSC_KOMBINACJI.filter((k) => f.where.has(k)),
  }));

  // "count" liczy wezly z ta regula na tej stronie: tyle findingow dzieli
  // klucz strona+regula (kazdy finding to jeden unikalny selektor).
  const licznikNaStrone = new Map();
  for (const f of findings) {
    const k = `${f.page}||${f.rule}`;
    licznikNaStrone.set(k, (licznikNaStrone.get(k) || 0) + 1);
  }
  for (const f of findings) {
    f.count = licznikNaStrone.get(`${f.page}||${f.rule}`);
  }

  // by_rule liczy strony, nie wezly: jeden blad w komponencie wspolnym
  // pojawia sie na stu stronach i tak wlasnie chcemy go czytac.
  const stronyNaRegule = new Map();
  for (const f of findings) {
    if (!stronyNaRegule.has(f.rule)) stronyNaRegule.set(f.rule, new Set());
    stronyNaRegule.get(f.rule).add(f.page);
  }
  const by_rule = {};
  for (const [rule, zbior] of stronyNaRegule) by_rule[rule] = zbior.size;

  const wynik = {
    generated_at: new Date().toISOString(),
    pages_audited: stronyZUdanymBiegiem.size,
    runs: udaneUruchomienia,
    findings,
    by_rule,
  };

  const plikWyjsciowy = join(args.wyjscie, "dostepnosc.json");
  zapiszJson(plikWyjsciowy, wynik);

  wypiszTabelke(findings);
  console.log(`\nZapisano: ${plikWyjsciowy}`);
  console.log(`Stron: ${wynik.pages_audited}, przebiegow: ${wynik.runs}, znalezisk: ${findings.length}`);
}

/** Jednoznaczny selektor pierwszego celu naruszenia. Cel bywa zagniezdzony
 * (iframe, shadow DOM) jako tablica w tablicy: wtedy sklejamy go w jeden napis. */
function selektorZTarget(target) {
  const pierwszy = target[0];
  return Array.isArray(pierwszy) ? pierwszy.join(" ") : String(pierwszy);
}

function wypiszTabelke(findings) {
  const grupy = new Map(); // rule -> { severity, strony:Set, wezly:liczba, kombinacje:Set }
  for (const f of findings) {
    if (!grupy.has(f.rule)) {
      grupy.set(f.rule, { severity: f.severity, strony: new Set(), wezly: 0, kombinacje: new Set() });
    }
    const g = grupy.get(f.rule);
    g.strony.add(f.page);
    g.wezly += 1;
    for (const k of f.where) g.kombinacje.add(k);
  }

  const wiersze = [...grupy.entries()].sort((a, b) => b[1].strony.size - a[1].strony.size);
  if (!wiersze.length) {
    console.log("Brak znalezisk.");
    return;
  }

  console.log("regula".padEnd(32) + "powaga".padEnd(10) + "stron".padEnd(7) + "wezlow".padEnd(8) + "motywy/ekrany");
  for (const [rule, g] of wiersze) {
    console.log(
      rule.padEnd(32) +
        g.severity.padEnd(10) +
        String(g.strony.size).padEnd(7) +
        String(g.wezly).padEnd(8) +
        [...g.kombinacje].join(", ")
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
