// ============================================================
// PRZEWIJANIE DO KOTWICY PO ZMIANIE TRASY
// ============================================================
// Przegladarka sama przewija do #kotwicy tylko przy pelnym zaladowaniu strony.
// Przy przejsciu wewnatrz aplikacji (np. z karty uslugi do kalkulatora na
// /jewelry/#calculator) React Router zmienia widok, ale zostawia okno na
// gorze, wiec klient laduje na hero zamiast na tym, o co prosil.
//
// Sekcje docelowe czesto montuja sie z opoznieniem (leniwe komponenty,
// obrazy), dlatego probujemy kilka razy, zamiast raz i na sztywno.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const RETRY_DELAYS_MS = [0, 120, 300, 700, 1400];

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = decodeURIComponent(hash.slice(1));
    const timers = [];
    let done = false;

    for (const delay of RETRY_DELAYS_MS) {
      timers.push(setTimeout(() => {
        if (done) return;
        const el = document.getElementById(id);
        if (!el) return;
        done = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Animacje wejscia opieraja sie na IntersectionObserver, ktory potrafi
        // przeoczyc elementy, gdy skok jest natychmiastowy. Odslaniamy je sami,
        // inaczej klient widzi pusta sekcje.
        requestAnimationFrame(() => {
          el.querySelectorAll(".reveal, .reveal-scale, .reveal-left, .reveal-right")
            .forEach((n) => n.setAttribute("data-visible", "true"));
          if (el.classList.contains("reveal")) el.setAttribute("data-visible", "true");
        });
      }, delay));
    }

    return () => timers.forEach(clearTimeout);
  }, [pathname, hash]);

  return null;
}
