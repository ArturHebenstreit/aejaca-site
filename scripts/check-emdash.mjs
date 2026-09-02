// ============================================================
// STRAZNIK DLUGICH MYSLNIKOW
// ============================================================
// Wlasciciel ma twarda zasade pisowni: zaden dlugi myslnik (U+2014) ani
// ani encja HTML nie ma prawa pojawic sie w tresci, w komentarzach, w kodzie
// ani w commitach. Zamiast niego krotki myslnik, przecinek, nawias lub kropka.
//
// Jednorazowe sprzatanie objelo 2720 znakow w 234 plikach. Bez straznika
// wrocilyby po kilku tygodniach, bo model jezykowy wstawia je odruchowo,
// a w kodzie zrodlowym nikt ich nie widzi az do publikacji na stronie.
//
// Wyjatki: n8n-backup to zrzut z zywej instancji n8n, ma odpowiadac temu,
// co stoi na serwerze, i nie wolno go recznie modyfikowac.
//
// Ta sama kategoria co n8n-backup: SKILLE SCIAGNIETE Z ZEWNATRZ. Ich pliki
// sa kopiami 1:1 cudzych repozytoriow i maja takie pozostac. Lista jest jawna,
// bo w `.claude/skills/` leza takze skille napisane przez nas i one podlegaja
// zasadzie normalnie. Poprawianie w nich pisowni rozjezdzalo by je z gora przy kazdej
// aktualizacji, a przy licencji CC BY oznaczaloby ciche modyfikowanie cudzego
// utworu bez adnotacji. Zasada pisowni dotyczy tego, co PISZEMY, a nie tego,
// co wciagamy w niezmienionej postaci.
//
// Wyjatek NIE obejmuje `ORIGIN.md`: te pliki piszemy sami i podlegaja zasadzie
// jak cala reszta repozytorium.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const DASH = "\u2014";
const ENTITY = "&" + "mdash;";

const SKIP = /^(n8n-backup)\//;
const SKILLE_ZEWNETRZNE = [
  "browser-automation",
  "find-skills",
  "frontend-design",
  "playwright-skill",
  "rhino3d-scripts",
  "site-audit",
  "task-observer",
];
const OBCY_SKILL = new RegExp(
  `^\\.claude/skills/(${SKILLE_ZEWNETRZNE.join("|")})/(?!ORIGIN\\.md$)`
);
const BINARY = /\.(png|jpe?g|webp|avif|gif|ico|svg|woff2?|ttf|otf|pdf|stl|3mf|step|zip|wasm|xlsx)$/i;

const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !SKIP.test(f) && !OBCY_SKILL.test(f) && !BINARY.test(f));

const problems = [];
for (const file of files) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (!src.includes(DASH) && !src.includes(ENTITY)) continue;
  src.split("\n").forEach((line, i) => {
    if (!line.includes(DASH) && !line.includes(ENTITY)) return;
    problems.push(`${file}:${i + 1}\n    ${line.trim().slice(0, 120)}`);
  });
}

if (problems.length) {
  console.error(`\nDlugie myslniki w repozytorium: ${problems.length}\n`);
  for (const p of problems.slice(0, 40)) console.error(`  ${p}\n`);
  if (problems.length > 40) console.error(`  ...i ${problems.length - 40} wiecej\n`);
  console.error(`Zamien "${DASH}" na krotki myslnik, przecinek, nawias albo kropke.`);
  console.error("To zasada pisowni wlasciciela, obowiazuje takze w komentarzach.\n");
  process.exit(1);
}

console.log(`Dlugie myslniki: sprawdzono ${files.length} plikow, zero wystapien`);
