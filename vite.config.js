import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  ssr: {
    noExternal: true,
  },
  build: {
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
