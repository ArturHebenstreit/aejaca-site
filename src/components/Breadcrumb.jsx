import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// ============================================================
// OKRUSZKI
// ============================================================
// Do 27 sierpnia 2026 sciezka byla jedna linia bez zawijania, a ostatni wpis
// mial `truncate max-w-[200px]`. Przy dluzszej nazwie strony ("Kompensacja
// skurczu odlewniczego") dawalo to dwie szkody naraz: dokument robil sie
// szerszy od telefonu i cala strona przewijala sie w bok, a nazwa biezacej
// strony i tak konczyla sie wielokropkiem.
//
// Teraz sciezka zawija sie do nastepnej linii. Nic nie wystaje poza okno i nic
// nie jest ucinane, a to wlasnie ostatni wpis mowi odwiedzajacemu, gdzie jest.
//
// `aria-current="page"` dopowiada to czytnikom ekranu: ostatni wpis nie jest
// odnosnikiem, tylko biezaca strona.
export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs mb-6">
      {items.map((item, i) => {
        const ostatni = i === items.length - 1;
        return (
          <span key={item.href || i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" aria-hidden="true" />}
            {ostatni ? (
              <span className="text-neutral-400 break-words" aria-current="page">{item.label}</span>
            ) : (
              <Link to={item.href} className="text-amber-400/80 hover:text-amber-300 transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
