// ============================================================
// OBRAZ W KAFELKU
// ============================================================
// Kafelki bloga, uslug i kalkulatorow pokazuja obraz na 150 do 350 pikseli,
// a pliki maja od 1200 do 1408. Pierwsze wejscie na strone glowna z telefonu
// pobieralo przez to 699 kB obrazow, prawie w calosci niewidocznych na
// pierwszym ekranie. `loading="lazy"` tego nie zalatwia, bo przegladarka
// pobiera kilka ekranow do przodu, tyle ze kazdy w pelnej rozdzielczosci.
//
// Ten komponent podaje ten sam obraz w AVIF i WebP, w kilku szerokosciach,
// i pozwala przegladarce wziac ten, ktory jej wystarcza. Warianty robi
// `scripts/build-card-images.mjs`, a ich lista stoi w
// `src/data/obrazyWarianty.js`.
//
// Obraz spoza tej listy rysuje sie zwyczajnie, z oryginalu, wiec komponentu da
// sie uzyc wszedzie bez sprawdzania, czy warianty juz sa.
//
// `display: contents` na `<picture>` jest tu istotne tak samo jak w
// `HeroObraz`: obrazy w kafelkach stoja czesto bezwzglednie (`absolute inset-0`),
// a zwykly `<picture>` wstawilby miedzy nie wlasne pudelko liniowe.

import { WARIANTY_OBRAZOW, zestawWariantow } from "../data/obrazyWarianty.js";

export default function Obraz({
  src,
  alt = "",
  className,
  sizes = "(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw",
  width,
  height,
  loading = "lazy",
  decoding = "async",
  ...reszta
}) {
  const maWarianty = Boolean(WARIANTY_OBRAZOW[src]);

  const obraz = (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      {...reszta}
    />
  );

  if (!maWarianty) return obraz;

  return (
    <picture className="contents">
      <source type="image/avif" srcSet={zestawWariantow(src, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={zestawWariantow(src, "webp")} sizes={sizes} />
      {obraz}
    </picture>
  );
}
