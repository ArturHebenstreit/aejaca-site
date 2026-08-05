// ============================================================
// STRAZNIK NIEZADEKLAROWANYCH ZMIENNYCH
// ============================================================
// Powstal po awarii, ktora przeszla przez caly build. Do pola rozmiaru
// pierscionka w kalkulatorze doszedl odnosnik uzywajacy `lang`, ale funkcja
// `RingSizeField` tego argumentu nie przyjmowala. Skutek: `lang is not
// defined` przy przelaczeniu na tryb zaawansowany, wywalony cala sekcja
// kalkulatora i biala strona. Vite zbudowal to bez slowa, prerender wypisal
// 94 strony i zero bledow, bo blad wystepuje dopiero po interakcji.
//
// Pelny eslint w tym repozytorium daje ponad 1400 zgloszen, prawie same
// `react/prop-types`, wiec wpiecie go w calosci tylko zaszumiloby build.
// Ta konfiguracja wlacza JEDNA regule, `no-undef`, ktora ma dzis zero
// naruszen i lapie dokladnie ten rodzaj bledu: kod, ktory siega po nazwe,
// ktorej nie ma w zasiegu.

import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

// Plugin jest tu wylacznie po to, zeby istniejace komentarze
// `eslint-disable-next-line react-hooks/exhaustive-deps` mialy do czego sie
// odniesc. Zadna jego regula nie jest wlaczona.

export default [
  // Komentarze wyciszajace inne reguly sa tu z definicji "nieuzyte", bo tych
  // regul nie wlaczamy. To nie jest usterka i nie ma zasmiecac kazdego buildu.
  { linterOptions: { reportUnusedDisableDirectives: "off" } },
  { ignores: ["dist", "node_modules", "n8n-backup", "admin/public"] },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: { "no-undef": "error" },
  },
  {
    files: ["scripts/**/*.{js,mjs}", "chat-api/**/*.js", "workers/**/*.js", "admin/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { "no-undef": "error" },
  },
];
