import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import JezykPodpowiedz from "./JezykPodpowiedz.jsx";
import Footer from "./Footer.jsx";
import ChatWidget from "./ChatWidget.jsx";
import ZnacznikRuchu from "./ZnacznikRuchu.jsx";
import { trackPageView, initScrollTracking, initToolTracking } from "../utils/analytics.js";
import useScrollToTop from "../hooks/useScrollToTop.js";

/**
 * Krzywa tonalna dla zdjec w kafelkach.
 *
 * MNOZNIK JASNOSCI NIE PODNOSI CZERNI, BO NIE MA CZEGO MNOZYC. Fotografie
 * produktowe maja srednia 8 do 60 na 255, wiec ten sam `brightness()`, ktory
 * ledwo rusza najciemniejsza, przepala najjasniejsza. Poprzednie obejscia szly
 * dwoma drogami i obie konczyly sie mgla: obnizeniem kontrastu (sciaga czernie
 * i biele do szarosci) albo warstwa bieli na wierzchu (podnosi kazdy piksel
 * o tyle samo, wiec ich stosunek maleje).
 *
 * Krzywa gamma robi to, czego chcemy, i nie robi tego, czego nie chcemy:
 * `wyjscie = amplituda * wejscie^wykladnik`. Przy wykladniku ponizej jedynki
 * ciemne partie ida mocno w gore, jasne prawie wcale, a nachylenie krzywej
 * w cieniach jest WIEKSZE od jedynki, czyli kontrast w cieniach ROSNIE.
 * Osiem na 255 idzie na 38, szescdziesiat na 110, dwiescie zostaje przy 232.
 *
 * `color-interpolation-filters="sRGB"` jest konieczne: domyslnie filtry SVG
 * licza sie w przestrzeni liniowej i ta sama krzywa daje tam zupelnie inny,
 * wypłukany wynik.
 *
 * Element stoi w ukladzie strony, a nie w komponencie kafelka, bo `filter:
 * url(#...)` szuka identyfikatora w calym dokumencie, a kafelkow bywa na
 * stronie kilkadziesiat. Nie ma tu `display: none`, bo czesc przegladarek
 * przestaje wtedy widziec filtr.
 */
function KrzywaKafelka() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <filter id="kafelek-krzywa" colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncR type="gamma" exponent="0.58" amplitude="1.05" offset="0" />
          <feFuncG type="gamma" exponent="0.58" amplitude="1.05" offset="0" />
          <feFuncB type="gamma" exponent="0.58" amplitude="1.05" offset="0" />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}

export default function Layout() {
  const location = useLocation();
  useScrollToTop();
  useEffect(() => {
    trackPageView(location.pathname);
    initScrollTracking();
    initToolTracking(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-white">
      {/* Skip to content - accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <KrzywaKafelka />
      <Navbar />
      <JezykPodpowiedz />
      <main id="main-content" className="flex-1" role="main">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
      <ZnacznikRuchu />
    </div>
  );
}
