// ============================================================
// OBRAZ BOHATERSKI
// ============================================================
// Kazda strona z duzym obrazem u gory miala ten sam kawalek JSX: jeden `<img>`
// z pelnym plikiem, ten sam na telefonie i na monitorze. `hero-studio.webp`
// wazyl 663 kB przy 2752 px i szedl w calosci do telefonu, ktory pokazywal go
// na 390 px. To jest obraz LCP, wiec placilo za to KAZDE wejscie na strone.
//
// Tutaj ten sam obraz idzie jako `<picture>` z AVIF, WebP i oryginalem na
// koniec. Przegladarka wybiera format, ktory rozumie, i szerokosc, ktora jej
// wystarcza. Warianty robi `scripts/build-hero-images.mjs`, a lista szerokosci
// stoi w `src/data/heroObrazy.js`.
//
// `display: contents` na `<picture>` jest tu istotne: obraz jest ustawiony
// bezwzglednie wzgledem sekcji (`absolute inset-0`), a zwykly `<picture>`
// wstawilby miedzy nie wlasne pudelko liniowe. Z `contents` znika z ukladu
// i zostaje dokladnie to, co bylo przed zmiana.

import { zestawHero, zapasowyHero } from "../data/heroObrazy.js";

export default function HeroObraz({
  nazwa,
  alt,
  className = "absolute inset-0 w-full h-full object-cover",
  width,
  height,
  sizes = "100vw",
  priorytet = true,
}) {
  return (
    <picture className="contents">
      <source type="image/avif" srcSet={zestawHero(nazwa, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={zestawHero(nazwa, "webp")} sizes={sizes} />
      <img
        src={zapasowyHero(nazwa)}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priorytet ? "eager" : "lazy"}
        fetchpriority={priorytet ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}
