/**
 * Arkusz panelu budujemy u siebie i trzymamy w repozytorium.
 *
 * Wczesniej kazda strona panelu ciagnela Tailwind ze zdalnego serwera, bez
 * przypietej wersji i bez sumy kontrolnej. Kto kontrolowalby tamten skrypt,
 * kontrolowalby panel: czytalby leady i subskrybentow, a wysylajac formularze
 * z sesja zalogowanego potwierdzalby przelewy i wystawial kody rabatowe.
 * Panel z takimi uprawnieniami nie ma prawa wykonywac kodu, ktorego nie znamy.
 *
 * `content` obejmuje takze server.js, bo czesc nazw klas powstaje po stronie
 * serwera (np. kolor plakietki statusu) i wchodzi do szablonu gotowa.
 */
export default {
  content: ["./views/**/*.ejs", "./server.js"],
  theme: {
    extend: {
      colors: {
        neutral: { 950: "#0a0a0a" },
      },
    },
  },
};
