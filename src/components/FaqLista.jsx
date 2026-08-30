// ============================================================
// LISTA PYTAN I ODPOWIEDZI
// ============================================================
// Jeden wyglad dla trzech miejsc: strony platnosci, strony procesu i `/faq/`.
// Bez tego kazda z nich rysowalaby pytania po swojemu i po pierwszej poprawce
// wygladalyby na trzy rozne serwisy.
//
// Kazde pytanie ma wlasna kotwice (`#pytanie-<id>`), zeby dalo sie wyslac
// klientowi odnosnik do KONKRETNEJ odpowiedzi, a nie do strony, na ktorej ma
// jej poszukac.

import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function FaqLista({ pytania, className = "" }) {
  const { lang } = useLanguage();
  if (!pytania.length) return null;

  return (
    <div className={`divide-y divide-neutral-800 ${className}`}>
      {pytania.map((f) => (
        <div key={f.id} id={`pytanie-${f.id}`} className="py-4 first:pt-0 last:pb-0 scroll-mt-24">
          <div className="text-sm text-neutral-200">{f.q[lang] || f.q.pl}</div>
          <p className="text-neutral-400 text-sm leading-relaxed mt-1">{f.a[lang] || f.a.pl}</p>
        </div>
      ))}
    </div>
  );
}
