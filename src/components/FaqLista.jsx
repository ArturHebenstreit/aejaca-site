// ============================================================
// LISTA PYTAN I ODPOWIEDZI
// ============================================================
// Jeden wyglad dla stron tematycznych i dla wspolnej sekcji `/faq/`. Bez tego
// kazda z nich rysowalaby pytania po swojemu i po pierwszej poprawce
// wygladalyby na trzy rozne serwisy.
//
// Kazde pytanie ma wlasna kotwice (`#pytanie-<id>`), zeby dalo sie wyslac
// klientowi odnosnik do KONKRETNEJ odpowiedzi, a nie do strony, na ktorej ma
// jej poszukac.

import { Link } from "../i18n/nav.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { odpowiedz } from "../data/faq/pomoc.js";

/** Odpowiedzi niosa odnosniki zapisane po markdownowemu, bo tresc stoi
 *  w danych, a dane nie moga zawierac JSX. */
function zOdnosnikami(tekst) {
  const czesci = String(tekst).split(/(\[[^\]]+\]\([^)]+\))/g);
  if (czesci.length === 1) return tekst;
  return czesci.map((czesc, i) => {
    const m = czesc.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!m) return czesc;
    return (
      <Link key={i} to={m[2].endsWith("/") ? m[2] : `${m[2]}/`} className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2">
        {m[1]}
      </Link>
    );
  });
}

/**
 * @param {{pytania: Array, wartosci?: object, nazwaStrony?: Function, className?: string}} props
 *   `wartosci` to kwoty do odpowiedzi liczonych z cennika. `nazwaStrony`
 *   wlacza odnosnik do strony, na ktorej pytanie stoi w swoim kontekscie:
 *   dostaje sciezke i oddaje nazwe, bo "Biżuteria" mowi wiecej niz "zobacz".
 */
export default function FaqLista({ pytania, wartosci = {}, nazwaStrony = null, className = "" }) {
  const { lang } = useLanguage();
  if (!pytania.length) return null;

  return (
    <div className={`divide-y divide-neutral-800 ${className}`}>
      {pytania.map((f) => (
        <div key={f.id} id={`pytanie-${f.id}`} className="py-4 first:pt-0 last:pb-0 scroll-mt-24">
          <div className="text-sm text-neutral-200">{f.q[lang] || f.q.pl}</div>
          <p className="text-neutral-400 text-sm leading-relaxed mt-1">
            {zOdnosnikami(odpowiedz(f, lang, wartosci))}
          </p>
          {nazwaStrony && f.strona && nazwaStrony(f.strona) && (
            <p className="mt-2">
              <Link to={f.strona} className="text-neutral-600 hover:text-amber-400 text-xs transition-colors">
                {nazwaStrony(f.strona)} &rarr;
              </Link>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
