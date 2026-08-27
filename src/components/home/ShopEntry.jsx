// ============================================================
// WEJSCIE DO SKLEPU NA STRONIE GLOWNEJ
// ============================================================
// Strona glowna prowadzila wylacznie do kalkulatorow, czyli do "opisz,
// policzymy, zrobimy". Kto chcial po prostu kupic, nie mial dokad pojsc.
//
// Sekcja pokazuje faktyczny asortyment, ulozony wedlug tego, jak blisko
// wysylki jest dana pozycja: najpierw rzeczy z polki, potem uslugi
// z cena wiazaca.
//
// PROG WIDOCZNOSCI. Pas gotowych produktow pojawia sie dopiero od
// READY_MIN pozycji dostepnych. Przy jednej sztuce siatka zaprojektowana
// na kilka wyglada jak awaria, a nie jak oferta, i opróznia sie sama po
// pierwszej sprzedazy. Pas wroci bez zmian w kodzie, gdy katalog urosnie.

import { Link } from "../../i18n/nav.jsx";
import { ArrowRight, Package, Wrench, Truck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { t } from "../../pricing/config.js";
import { useMoney } from "../../shop/money.js";
import { useAvailability, stockOf } from "../../shop/availability.js";
import { PRODUCTS, serviceCardsByCategory } from "../../data/shopCatalog.js";
import { UI as SHOP_UI } from "../../pages/Shop.jsx";
import Obraz from "../Obraz.jsx";

/** Ponizej tylu dostepnych pozycji pas gotowych produktow sie nie renderuje. */
const READY_MIN = 3;
/** Ile kafli pokazujemy w kazdym pasie. Trzy w rzedzie na duzym ekranie. */
const READY_SHOWN = 3;
const SERVICES_PER_CATEGORY = 3;

function Tile({ to, image, alt, badge, title, lead, price, note, u }) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden
                 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="aspect-square bg-black overflow-hidden">
        <Obraz
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        {badge}
        <h3 className="text-white font-medium text-sm leading-snug mb-1">{title}</h3>
        <p className="text-neutral-400 text-xs leading-relaxed mb-3 flex-1">{lead}</p>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white font-bold">{price}</div>
            {note && <div className="text-neutral-500 text-xs mt-0.5">{note}</div>}
          </div>
          <span className="text-neutral-500 group-hover:text-white text-xs flex items-center gap-1 transition-colors">
            {u.details} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ShopEntry() {
  const { t: tr, lang } = useLanguage();
  const s = tr.home.shopEntry;
  const u = SHOP_UI[lang] || SHOP_UI.en;
  const { money } = useMoney();
  const availability = useAvailability();

  // Tylko to, co da sie dzis kupic i wyslac.
  const ready = PRODUCTS.filter((p) => stockOf(p, availability) > 0).slice(0, READY_SHOWN);
  const showReady = ready.length >= READY_MIN;

  // Po rowno z obu marek, zeby sekcja nie zaczela wygladac na sam sTuDiO.
  const services = [
    ...serviceCardsByCategory("studio").slice(0, SERVICES_PER_CATEGORY),
    ...serviceCardsByCategory("jewelry").slice(0, SERVICES_PER_CATEGORY),
  ];

  return (
    <section className="py-14 px-4 bg-neutral-950" aria-labelledby="shop-entry-heading">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Package className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-xs uppercase tracking-[0.2em]">{s.tag}</span>
          </div>
          <h2 id="shop-entry-heading" className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
            {s.title}
          </h2>
          <p className="text-neutral-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {s.subtitle}
          </p>
        </div>

        {showReady && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white text-sm font-semibold">{s.readyHeading}</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ready.map((p) => (
                <Tile
                  key={p.slug}
                  to={`/shop/${p.slug}/`}
                  image={p.images[0]}
                  alt={t(p.title, lang)}
                  title={t(p.title, lang)}
                  lead={t(p.short, lang)}
                  price={money(p.priceGrosze)}
                  note={stockOf(p, availability) === 1 ? u.lastOne : u.inStock}
                  u={u}
                  badge={
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                        <Truck className="w-3 h-3" />{u.inStock}
                      </span>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-4 h-4 text-blue-400" />
            <h3 className="text-white text-sm font-semibold">{s.servicesHeading}</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((card) => (
              <Tile
                key={card.id}
                to={`/shop/service/${card.id}/`}
                image={card.image}
                alt={t(card.title, lang)}
                title={t(card.title, lang)}
                lead={t(card.lead, lang)}
                u={u}
                price={
                  card.priceFromGrosze ? (
                    <>
                      <span className="text-neutral-500 text-xs font-normal">{u.from} </span>
                      {money(card.priceFromGrosze)}
                    </>
                  ) : (
                    <span className="text-amber-300 text-sm">{u.quoteBadge}</span>
                  )
                }
                note={card.priceFromGrosze ? `${u.ready} ${card.leadTimeDays} ${u.days}` : u.quoteReply}
                badge={
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 text-neutral-300 border border-white/10">
                      <Wrench className="w-3 h-3" />{u.madeToOrder}
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            to="/shop/"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/15 bg-white/5 text-white text-sm font-medium hover:bg-white/10 hover:border-white/25 transition-all duration-300"
          >
            {s.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
