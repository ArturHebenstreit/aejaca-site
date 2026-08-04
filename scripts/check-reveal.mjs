// ============================================================
// STRAZNIK ODSLONIEC PRZY PRZEWIJANIU
// ============================================================
// `.reveal` w src/index.css ustawia `opacity: 0` i przesuniecie. Widocznosc
// wlacza dopiero atrybut `data-visible="true"`, ktory nadaje hook
// useScrollReveal przez `ref`. Klasa bez `ref` znaczy wiec jedno:
// element nie pokaze sie NIGDY, przy zadnym przewijaniu.
//
// Znalezione w praktyce na stronie /shipping/, gdzie trzy bloki byly trwale
// niewidoczne: baner darmowej wysylki, obowiazkowa informacja o cle poza UE
// oraz sekcja FAQ. Ta ostatnia jest najgorsza, bo strona emituje schemat
// FAQPage, a Google wymaga, zeby tresc z tego schematu byla widoczna.
// Deklarowalismy dane strukturalne bez pokrycia w tresci.
//
// Blad jest niewidoczny z definicji: build przechodzi, testy przechodza,
// strona wyglada poprawnie, tylko brakuje na niej kawalka. Dlatego strażnik.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync('git ls-files "src/**/*.jsx"', { encoding: "utf8" })
  .trim().split("\n").filter(Boolean);

// Otwarcie tagu z klasa reveal (takze reveal-scale, reveal-left, reveal-right).
// Bierzemy caly tag, zeby sprawdzic, czy niesie `ref`.
const TAG = /<[A-Za-z][^>]*className=\{?["`][^"`]*\breveal(?:-scale|-left|-right)?\b[^"`]*["`][^>]*>/g;

const problems = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const tag of src.match(TAG) || []) {
    if (/\bref=/.test(tag)) continue;
    const line = src.slice(0, src.indexOf(tag)).split("\n").length;
    problems.push(`${file}:${line}\n    ${tag.replace(/\s+/g, " ").slice(0, 120)}`);
  }
}

if (problems.length) {
  console.error(`\nElementy z klasa "reveal" bez "ref" (nigdy sie nie pokaza): ${problems.length}\n`);
  for (const p of problems) console.error(`  ${p}\n`);
  console.error("Dopisz ref z useScrollReveal() albo usun klase reveal, jesli tresc");
  console.error("ma byc widoczna bezwarunkowo (obietnice handlowe, obowiazki");
  console.error("informacyjne, tresc odbijana w danych strukturalnych).\n");
  process.exit(1);
}

console.log(`Odsloniecia przy przewijaniu: sprawdzono ${files.length} plikow, wszystkie z ref`);
