// ============================================================
// KONTROLA WYWOLAN NIEZADEKLAROWANYCH FUNKCJI
// ============================================================
// Powod powstania: brakujacy import w chat-api/server.js przeszedl przez
// `node --check`, bo skladnia byla poprawna, i ujawnil sie dopiero jako
// ReferenceError przy zamowieniu klienta, na produkcji.
//
// Ten skrypt szuka wywolan `nazwa(...)`, gdzie `nazwa` nie jest ani
// zaimportowana, ani zadeklarowana w pliku, ani znana globalna. To waski
// zakres, ale dokladnie ta klasa bledow, ktora nas ugryzla.
//
//   node scripts/check-undefined-calls.mjs

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "chat-api/server.js",
  "chat-api/orders.js",
  "chat-api/autopay.js",
  "chat-api/orderMail.js",
];

const GLOBALS = new Set([
  "require", "import", "fetch", "setTimeout", "setInterval", "clearTimeout", "clearInterval",
  "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent",
  "String", "Number", "Boolean", "Array", "Object", "JSON", "Math", "Date", "Promise", "Error",
  "Map", "Set", "RegExp", "Buffer", "URL", "URLSearchParams", "AbortController", "TextDecoder",
  // Tablice typowane sa wszedzie tam, gdzie przechodzi siatka albo plik binarny.
  "Uint8Array", "Uint16Array", "Uint32Array", "Int32Array", "Float32Array", "Float64Array",
  "TextEncoder", "structuredClone", "queueMicrotask", "console", "process", "if", "for", "while",
  "switch", "catch", "return", "typeof", "function", "await", "super", "this", "new", "do", "else",
  // slowa kluczowe, ktore w zapisie `async (` albo `constructor(` wygladaja jak wywolanie
  "async", "constructor", "get", "set", "of", "in", "yield", "delete", "void",
]);

/**
 * Usuwa komentarze i tresc literalow tekstowych, zeby zapytania SQL
 * i zdania po polsku nie byly czytane jak kod. W literalach szablonowych
 * zostawiamy wnetrze ${...}, bo tam moga byc prawdziwe wywolania.
 */
function stripNonCode(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    if (c === "/" && next === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === "\\") i++;
        i++;
      }
      i++;
      out += '""';
      continue;
    }
    if (c === "`") {
      i++;
      let depth = 0;
      while (i < n) {
        if (src[i] === "\\") { i += 2; continue; }
        if (src[i] === "$" && src[i + 1] === "{") { depth++; i += 2; out += " "; continue; }
        if (depth > 0) {
          if (src[i] === "}") { depth--; i++; out += " "; continue; }
          out += src[i]; i++; continue;
        }
        if (src[i] === "`") { i++; break; }
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function declaredNames(src) {
  const names = new Set();
  const patterns = [
    /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    /(?:^|\n)\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/g,
    // destrukturyzacja: const { a, b } = ...
    /(?:const|let|var)\s*\{([^}]*)\}\s*=/g,
  ];
  for (const re of patterns) {
    for (const m of src.matchAll(re)) {
      for (const part of m[1].split(",")) {
        const name = part.trim().split(":").pop().split("=")[0].trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
      }
    }
  }
  // parametry funkcji, zeby nie zglaszac wywolan callbackow
  for (const m of src.matchAll(/\(([^)]*)\)\s*=>/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split("=")[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  return names;
}

function importedNames(src) {
  const names = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  for (const m of src.matchAll(/import\s+([A-Za-z_$][\w$]*)\s*(?:,|from)/g)) names.add(m[1]);
  for (const m of src.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  return names;
}

let problems = 0;

for (const rel of FILES) {
  const raw = readFileSync(join(ROOT, rel), "utf8");
  const src = stripNonCode(raw);
  const known = new Set([...declaredNames(raw), ...importedNames(raw), ...GLOBALS]);

  // Wywolania postaci `nazwa(`, pomijajac `.nazwa(` (metody obiektow)
  const called = new Set();
  for (const m of src.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) called.add(m[2]);

  const missing = [...called].filter((n) => !known.has(n));
  if (missing.length) {
    console.error(`  ✗ ${rel}: wywolania bez deklaracji i bez importu: ${missing.join(", ")}`);
    problems += missing.length;
  }
}

if (problems) {
  console.error("\nBrakujacy import przechodzi przez `node --check`, bo skladnia jest poprawna,");
  console.error("a ujawnia sie dopiero jako ReferenceError u klienta. Uzupelnij importy.\n");
  process.exit(1);
}

console.log("Backend: wszystkie wywolywane funkcje sa zadeklarowane albo zaimportowane");
