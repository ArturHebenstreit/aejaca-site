// Konfiguracja WYLACZNIE do diagnozy hydracji. Buduje Reacta w wersji
// rozwojowej, wiec zamiast "Minified React error #418" w konsoli stoi pelne
// zdanie z nazwa komponentu. Nie uzywamy tego do niczego, co idzie na serwer.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  define: { "process.env.NODE_ENV": '"development"' },
  ssr: { noExternal: true },
  build: {
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          helmet: ["react-helmet-async"],
        },
      },
    },
  },
});
