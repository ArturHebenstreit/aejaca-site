import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  ssr: {
    noExternal: true,
  },
  build: {
    // Manifest mowi, ktory plik wyjsciowy odpowiada ktoremu zrodlu. Czyta go
    // `scripts/prerender.mjs`, zeby kazda strona zapowiadala wlasny fragment
    // trasy. Bez tego przegladarka odkrywa go dopiero po przetworzeniu pliku
    // wejsciowego i idzie po niego druga tura.
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "three": ["three"],
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "helmet": ["react-helmet-async"],
        },
      },
    },
  },
});
