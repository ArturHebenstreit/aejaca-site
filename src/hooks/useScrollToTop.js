import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * KOTWICA Z ADRESU, ODPORNA NA TO, CO ADRES NIESIE NAPRAWDE.
 *
 * Do 6 wrzesnia 2026 stalo tu `document.querySelector(hash)`. Kotwica idzie
 * z adresu, czyli od kogos z zewnatrz, a `querySelector` RZUCA WYJATKIEM przy
 * napisie, ktory nie jest poprawnym selektorem. Wystarczy ukosnik na koncu
 * (`#srebro-925/`), zeby wyjatek wyleciał w trakcie efektu i strona nie
 * przewinela sie do niczego. Taki adres powstaje sam: przekierowanie ze starego
 * adresu hasla przenosi ogon (`public/_redirects`, wycofane hasla slownika).
 *
 * Bierzemy wiec `getElementById`, ktore zadnego napisu nie interpretuje,
 * i przycinamy to, co do identyfikatora nie nalezy: ukosnik na koncu i zapis
 * procentowy z adresu.
 */
export default function useScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    let id = hash.replace(/^#/, "");
    try {
      id = decodeURIComponent(id);
    } catch {
      // Adres z polamanym zapisem procentowym zostaje taki, jaki byl.
      // Zaden identyfikator i tak mu nie odpowie, a strona ma dzialac dalej.
    }
    id = id.replace(/\/+$/, "");
    if (!id) {
      window.scrollTo(0, 0);
      return;
    }

    // Strona wczytuje sie kawalkami, wiec element bywa jeszcze nieobecny.
    let proby = 0;
    let czasomierz = null;
    const przewin = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (proby < 15) {
        proby++;
        czasomierz = setTimeout(przewin, 80);
      }
    };
    czasomierz = setTimeout(przewin, 50);
    return () => clearTimeout(czasomierz);
  }, [pathname, hash]);
}
