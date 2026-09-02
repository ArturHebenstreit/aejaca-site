// ============================================================
// ODNOSNIKI DO USLUG Z DANEJ KATEGORII
// ============================================================
// `/studio/` i `/jewelry/` to dwie najmocniejsze strony serwisu i przez caly
// czas nie prowadzily do zadnej strony uslugi. Jedyna droga do
// `/shop/service/<id>/` szla przez liste sklepu, przez kafelki na stronie
// glownej i przez `ContentCTA` na koncu wpisow blogowych. Search Console
// pokazal skutek: dziesiec stron uslug w stanie "wykryta, obecnie
// niezindeksowana", od kwietnia 2026.
//
// Schemat `ItemList` na obu stronach UDAWAL, ze to polaczenie istnieje:
// wymienial jedenascie pozycji wskazujacych na `#3dprint`, `#co2laser`,
// `#rings` i osiem innych sekcji, ktorych na tych stronach nigdy nie bylo.
// Adres z krzyzykiem, ktory nie trafia w zadne miejsce, po prostu zostaje na
// gorze strony, wiec nikt tego nie widzial przez caly ten czas.
//
// Teraz jedno zrodlo karmi obie rzeczy naraz: ten komponent rysuje odnosniki,
// a strona buduje `ItemList` z tej samej listy. Dzieki temu schemat nie moze
// opisac czegos, czego na stronie nie ma, bo opisuje dokladnie to, co widac.
// Regula: `.claude/skills/aejaca-seo/dane-strukturalne.md`.

import { Link } from "../i18n/nav.jsx";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { t } from "../pricing/config.js";
import { serviceCardsByCategory } from "../data/serviceCatalog.js";

const UI = {
  pl: {
    studio: "Usługi sTuDiO z ceną online",
    jewelry: "Biżuteria na zamówienie",
    lead: "Każda z tych usług ma własną stronę z opisem, parametrami i ceną.",
  },
  en: {
    studio: "sTuDiO services priced online",
    jewelry: "Custom jewelry made to order",
    lead: "Each of these has its own page with the details, specs and price.",
  },
  de: {
    studio: "sTuDiO-Leistungen mit Online-Preis",
    jewelry: "Schmuck auf Bestellung",
    lead: "Jede Leistung hat eine eigene Seite mit Beschreibung, Daten und Preis.",
  },
};

/** Lista uslug danej kategorii, w kolejnosci z katalogu. */
export function uslugiKategorii(kategoria) {
  return serviceCardsByCategory(kategoria);
}

export default function OdnosnikiUslug({ kategoria = "studio", className = "" }) {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const uslugi = uslugiKategorii(kategoria);
  if (!uslugi.length) return null;

  const niebieski = kategoria === "studio";
  const tint = niebieski ? "text-blue-400" : "text-amber-400";
  const ramka = niebieski
    ? "hover:border-blue-500/30 hover:bg-blue-500/[0.03]"
    : "hover:border-amber-500/30 hover:bg-amber-500/[0.03]";

  return (
    <div className={className} aria-label={u[kategoria]}>
      <div className="text-center mb-6">
        <h3 className={`text-xs uppercase tracking-[0.2em] ${tint} mb-2`}>{u[kategoria]}</h3>
        <p className="text-neutral-400 text-sm">{u.lead}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {uslugi.map((usluga) => (
          <Link
            key={usluga.id}
            to={`/shop/service/${usluga.id}/`}
            className={`group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all duration-300 ${ramka}`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium mb-1">{t(usluga.title, lang)}</div>
              <div className="text-neutral-400 text-xs leading-relaxed">{t(usluga.lead, lang)}</div>
            </div>
            <ArrowRight
              className={`w-4 h-4 shrink-0 mt-0.5 ${tint} transition-transform duration-300 group-hover:translate-x-1`}
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
