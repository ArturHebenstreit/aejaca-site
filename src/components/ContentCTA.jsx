// ============================================================
// DOMKNIECIE TRESCI, PRZEJSCIE DO OFERTY
// ============================================================
// Blog, slownik i narzedzia byly zamknieta petla: blog linkowal do bloga,
// slownik do slownika. Wpis o splotach lancuszkow ma jedenascie ekranow
// tresci i prowadzil dalej jednym odnosnikiem, a lista wpisow i slownik
// nie prowadzily NIGDZIE. Ktos, kto wlasnie przeczytal o dwunastu splotach,
// jest najlepiej przygotowanym klientem tego dnia i zostawal bez drogi.
//
// Komponent dobiera cel w dwoch krokach:
//   1. `service` wskazuje konkretna usluge, gdy temat jest jednoznaczny
//      (sploty -> lancuszek na zamowienie, miniatury -> druk zywiczny).
//   2. Bez `service` ladujemy na stronie kategorii sklepu. Zawsze uczciwe,
//      nigdy nie obiecuje czegos, czego wpis nie dotyczyl.
//
// Drugi krok jest wazny: pozwala wlaczyc to dla wszystkich osiemnastu wpisow
// i dwudziestu dziewieciu hasel od razu, zamiast czekac, az ktos przypisze
// czterdziesci siedem tematow recznie.

import { Link } from "../i18n/nav.jsx";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { t } from "../pricing/config.js";
import { useMoney } from "../shop/money.js";
import { getServiceCard } from "../data/shopCatalog.js";
import Obraz from "./Obraz.jsx";

const UI = {
  pl: {
    tag: "Zrobimy to dla Ciebie",
    shopJewelry: "Zobacz biżuterię w sklepie",
    shopStudio: "Zobacz usługi sTuDiO",
    shopGeneral: "Zobacz sklep AEJaCA",
    leadJewelry: "Pierścionki, łańcuszki i obrączki na zamówienie. Cena online, bez czekania na wycenę.",
    leadStudio: "Druk 3D, laser i odlewy żywiczne. Wgraj plik, poznaj wiążącą cenę od razu.",
    leadGeneral: "Produkty gotowe i usługi zamawiane online, z ceną wiążącą od razu.",
    from: "od",
    cta: "Zamów online",
  },
  en: {
    tag: "We can make it for you",
    shopJewelry: "See jewelry in the shop",
    shopStudio: "See sTuDiO services",
    shopGeneral: "See the AEJaCA shop",
    leadJewelry: "Rings, chains and wedding bands made to order. Priced online, no waiting.",
    leadStudio: "3D printing, laser and resin casting. Upload a file, get a binding price at once.",
    leadGeneral: "Ready-made products and services ordered online, with a binding price up front.",
    from: "from",
    cta: "Order online",
  },
  de: {
    tag: "Wir fertigen das für Sie",
    shopJewelry: "Schmuck im Shop ansehen",
    shopStudio: "sTuDiO-Leistungen ansehen",
    shopGeneral: "AEJaCA-Shop ansehen",
    leadJewelry: "Ringe, Ketten und Trauringe nach Maß. Preis online, ohne Wartezeit.",
    leadStudio: "3D-Druck, Laser und Harzguss. Datei hochladen, verbindlicher Preis sofort.",
    leadGeneral: "Fertige Produkte und online bestellbare Leistungen mit sofort verbindlichem Preis.",
    from: "ab",
    cta: "Online bestellen",
  },
};

const FALLBACK = {
  jewelry: { to: "/shop/jewelry/", label: "shopJewelry", lead: "leadJewelry", accent: "amber" },
  studio: { to: "/shop/studio/", label: "shopStudio", lead: "leadStudio", accent: "blue" },
  general: { to: "/shop/", label: "shopGeneral", lead: "leadGeneral", accent: "amber" },
};

export default function ContentCTA({ service, category = "general", className = "" }) {
  const { lang } = useLanguage();
  const u = UI[lang] || UI.en;
  const { money } = useMoney();
  const card = service ? getServiceCard(service) : null;
  const fb = FALLBACK[category] || FALLBACK.general;
  const amber = (card ? card.category : category) !== "studio";

  const ring = amber ? "border-amber-400/25 hover:border-amber-400/50" : "border-blue-400/25 hover:border-blue-400/50";
  const tint = amber ? "text-amber-400" : "text-blue-400";

  if (card) {
    return (
      <Link
        to={`/shop/service/${card.id}/`}
        className={`group not-prose flex gap-4 items-center rounded-2xl border ${ring} bg-white/[0.02] hover:bg-white/[0.04] p-4 md:p-5 transition-all duration-300 ${className}`}
      >
        <Obraz
          src={card.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shrink-0"
          sizes="96px"
        />
        <div className="min-w-0">
          <div className={`text-xs uppercase tracking-[0.2em] ${tint} mb-1`}>{u.tag}</div>
          <h3 className="text-white font-medium text-sm md:text-base leading-snug mb-1">{t(card.title, lang)}</h3>
          <p className="text-neutral-400 text-xs leading-relaxed mb-2">{t(card.lead, lang)}</p>
          <span className="text-white text-sm font-semibold">
            {card.priceFromGrosze ? (
              <>
                <span className="text-neutral-500 text-xs font-normal">{u.from} </span>
                {money(card.priceFromGrosze)}
              </>
            ) : u.cta}
            <ArrowRight className="inline w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={fb.to}
      className={`group not-prose block rounded-2xl border ${ring} bg-white/[0.02] hover:bg-white/[0.04] p-5 transition-all duration-300 ${className}`}
    >
      <div className={`text-xs uppercase tracking-[0.2em] ${tint} mb-1.5`}>{u.tag}</div>
      <h3 className="text-white font-medium text-base mb-1">{u[fb.label]}</h3>
      <p className="text-neutral-400 text-xs leading-relaxed">{u[fb.lead]}</p>
      <span className="inline-flex items-center gap-1.5 text-white text-sm font-semibold mt-3">
        {u.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
